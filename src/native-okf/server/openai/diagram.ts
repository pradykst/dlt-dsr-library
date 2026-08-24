import "server-only";

import type { Response } from "openai/resources/responses/responses";

import type {
  GeneratedDiagram,
  NativeOkfDiagramMode,
  SynthesisDraftState,
} from "../../shared/chat-types.ts";
import type { NativeOpenAiClient } from "./client.ts";
import type { NativeOkfGroundedContext } from "./context.ts";
import type { NativeOkfDiagramGrounding } from "./diagram-grounding.ts";
import type { NativeOpenAiEnvironment } from "./env.ts";
import { GENERATED_DIAGRAM_RESPONSE_FORMAT } from "./diagram-schema.ts";
import { validateGeneratedDiagram } from "./diagram-validation.ts";
import { NATIVE_OKF_SYSTEM_PROMPT } from "./prompts.ts";

const MAX_REPAIR_ERRORS = 12;

export const NATIVE_OKF_DIAGRAM_INSTRUCTIONS = `Return only a compact decision-support flow as a structured diagram matching the supplied strict schema. Do not output coordinates, rendering instructions, Markdown, or prose outside the structured response. Use no external knowledge and no source or concept outside the supplied allowlist.

Keep every node in the same weakly connected flow, directed from the problem toward outcomes, with 7 to 12 nodes when the evidence permits, never more than 14 nodes or 20 edges, no more than three major parallel branches, no orphan, duplicate, or self-loop, and short stable IDs. Give every node a short canvas label of at most 72 characters. Write every description as one concise sentence of at most 280 characters; rationales are at most 240 characters, and edge labels at most 32 characters.

Use only these normalized stages: problem, design-goal, design-objective, meta-requirement, design-requirement, requirements, design-principle, principles, design-feature, features, artifact, governance, evaluation, outcome, other. Do not emit empty stages.`;

export const NATIVE_OKF_STORED_DIAGRAM_INSTRUCTIONS = `Create a stored source map for knowledge already represented in the retrieved native OKF context. Every node must use provenance "stored", synthesis false, one exact sourcePaths concept ID, the same one-item supportConceptIds, and a faithful stored label, description, and normalized stage. Every edge must use provenance "stored", identify its two endpoint concept IDs as supportConceptIds, and reproduce an exact supplied resolved native relationship. Create no proposed, user-provided, adapted, or synthesized design knowledge.`;


export interface GenerateNativeOkfDiagramOptions {
  client: NativeOpenAiClient;
  environment: NativeOpenAiEnvironment;
  context: NativeOkfGroundedContext;
  question: string;
  answerMarkdown: string;
  mode?: Exclude<NativeOkfDiagramMode, "comparative">;
  grounding?: NativeOkfDiagramGrounding;
  priorDraft?: SynthesisDraftState | null;
  requireRpfPath?: boolean;
  synthesisProblem?: string | null;
  synthesisDomain?: string | null;
}

export interface GenerateNativeOkfDiagramResult {
  diagram?: GeneratedDiagram;
  warnings: string[];
  usedSupportConceptIds?: string[];
  deterministicSummary?: string;
  diagnosticCode?: "synthesis-plan-repair-failed";
}

interface InvalidStructuredDiagram {
  errors: string[];
}

function safeDraftContext(draft: SynthesisDraftState | null | undefined): string {
  if (!draft) return "None.";
  return JSON.stringify({
    version: draft.version,
    problemStatement: draft.problemStatement,
    domain: draft.domain,
    objective: draft.objective,
    constraints: draft.constraints,
    nodes: draft.nodes,
    edges: draft.edges,
  });
}

function groundingSummary(
  grounding: NativeOkfDiagramGrounding | undefined,
): string {
  if (!grounding) return "Exact metadata is unavailable in legacy mode.";
  return JSON.stringify({
    concepts: [...grounding.conceptsById.values()].map((concept) => ({
      conceptId: concept.conceptId,
      title: concept.title,
      description: concept.description,
      type: concept.type,
      stage: concept.stage,
    })),
    storedRelations: grounding.storedRelations,
  });
}

function diagramRequestInput(
  options: GenerateNativeOkfDiagramOptions,
  repair?: InvalidStructuredDiagram,
): string {
  const allowedConceptIds = [
    ...(options.grounding?.allowedConceptIds ??
      options.context.allowedConceptIds),
  ].sort((left, right) => left.localeCompare(right, "en"));
  const sections = [
    "Allowed current-turn concept IDs (copy exactly):\n" +
      JSON.stringify(allowedConceptIds),
    "Validated current user problem/request:\n" + options.question,
    "Exact stored concept and relation metadata:\n" +
      groundingSummary(options.grounding),
    "Current-turn retrieved native OKF source context:\n" +
      options.context.prompt,
  ];
  if (options.mode === "synthesized" && !repair) {
    sections.push(
      "Bounded prior synthesis draft (design context, never evidence):\n" +
        safeDraftContext(options.priorDraft),
    );
  }
  if (!repair) {
    sections.push(
      "Concise grounded text answer to align with without enumerating every node:\n" +
        options.answerMarkdown,
    );
  } else {
    sections.push(
      "The prior structured output was invalid and is intentionally omitted. Consolidate semantically overlapping nodes, preserve every relevant allowlisted sourcePath, and return one complete replacement. Validation errors:\n" +
        repair.errors
          .slice(0, MAX_REPAIR_ERRORS)
          .map((error) => "- " + error)
          .join("\n"),
    );
  }
  return sections.join("\n\n");
}

function refusal(response: Response): boolean {
  return response.output.some(
    (item) =>
      item.type === "message" &&
      item.content.some((part) => part.type === "refusal"),
  );
}

function parseAndValidate(
  response: Response,
  options: GenerateNativeOkfDiagramOptions,
):
  | { ok: true; diagram: GeneratedDiagram; warnings: string[] }
  | { ok: false; invalid: InvalidStructuredDiagram } {
  if (refusal(response)) {
    return { ok: false, invalid: { errors: ["The structured response was refused."] } };
  }
  const raw = response.output_text?.trim() ?? "";
  if (response.status === "incomplete") {
    return {
      ok: false,
      invalid: {
        errors: [
          "The structured response was incomplete (" +
            (response.incomplete_details?.reason ?? "unknown reason") +
            ").",
        ],
      },
    };
  }
  if (!raw) {
    return { ok: false, invalid: { errors: ["The structured response contained no diagram JSON."] } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, invalid: { errors: ["The structured response was not valid JSON."] } };
  }
  const validation = validateGeneratedDiagram(
    parsed,
    options.grounding ?? options.context.allowedConceptIds,
    {
      ...(options.mode ? { mode: options.mode } : {}),
      requireRpfPath:
        options.mode === "synthesized" && options.requireRpfPath !== false,
    },
  );
  return validation.ok
    ? { ok: true, diagram: validation.diagram, warnings: validation.warnings }
    : { ok: false, invalid: { errors: validation.errors } };
}

async function createResponse(
  options: GenerateNativeOkfDiagramOptions,
  repair?: InvalidStructuredDiagram,
): Promise<Response> {
  const modeInstructions = NATIVE_OKF_STORED_DIAGRAM_INSTRUCTIONS;
  return options.client.responses.create({
    model: options.environment.model,
    instructions: [
      NATIVE_OKF_SYSTEM_PROMPT,
      NATIVE_OKF_DIAGRAM_INSTRUCTIONS,
      modeInstructions,
    ].join("\n\n"),
    input: diagramRequestInput(options, repair),
    reasoning: { effort: options.environment.reasoningEffort },
    max_output_tokens: options.environment.diagramMaxOutputTokens,
    text: { format: GENERATED_DIAGRAM_RESPONSE_FORMAT },
    tools: [],
    tool_choice: "none",
    parallel_tool_calls: false,
    store: false,
  });
}

export async function generateNativeOkfDiagram(
  options: GenerateNativeOkfDiagramOptions,
): Promise<GenerateNativeOkfDiagramResult> {
  if (options.mode === "synthesized") {
    if (!options.grounding) {
      return {
        warnings: [],
        diagnosticCode: "synthesis-plan-repair-failed",
      };
    }
    const { generateNativeOkfSynthesisPlan } = await import(
      "./synthesis-plan.ts"
    );
    return generateNativeOkfSynthesisPlan({
      client: options.client,
      environment: options.environment,
      problemStatement: options.synthesisProblem ??
        options.priorDraft?.problemStatement ??
        options.question,
      refinementRequest: options.question,
      domain: options.synthesisDomain ?? options.priorDraft?.domain ?? null,
      objective: options.priorDraft?.objective ?? null,
      constraints: options.priorDraft?.constraints ?? [],
      grounding: options.grounding,
      priorDraft: options.priorDraft ?? null,
    });
  }

  const first = parseAndValidate(
    await createResponse(options),
    options,
  );
  if (first.ok) return { diagram: first.diagram, warnings: first.warnings };

  const second = parseAndValidate(
    await createResponse(options, first.invalid),
    options,
  );
  if (second.ok) {
    return {
      diagram: second.diagram,
      warnings: [
        ...second.warnings,
        "The structured diagram required one bounded repair.",
      ],
    };
  }
  return {
    warnings: [
      "The diagram was withheld after two invalid structured responses (the initial response and one bounded repair).",
    ],
  };
}
