import "server-only";

import { GENERATED_DIAGRAM_STAGES } from "../../shared/chat-types.ts";

export const DIAGRAM_LIMITS = Object.freeze({
  maxTitleCharacters: 160,
  maxExplanationCharacters: 2_000,
  preferredMinNodes: 7,
  preferredMaxNodes: 12,
  maxNodes: 14,
  maxEdges: 20,
  maxParallelBranches: 3,
  maxNodeIdCharacters: 64,
  maxNodeLabelCharacters: 90,
  maxNodeDescriptionCharacters: 300,
  maxCategoryCharacters: 40,
  maxGroupCharacters: 40,
  minOrder: 0,
  maxOrder: 100,
  maxSourcePathsPerNode: 3,
  maxSourcePathCharacters: 320,
  maxSupportConceptIds: 3,
  maxSynthesisRationaleCharacters: 240,
  maxEdgeLabelCharacters: 32,
});

/**
 * Manual JSON Schema supplied to the Responses API Structured Outputs format.
 * Cross-field and retrieval-allowlist rules are deliberately enforced again by
 * diagram-validation.ts because JSON Schema cannot express them safely.
 */
export const GENERATED_DIAGRAM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "explanation", "nodes", "edges"],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: DIAGRAM_LIMITS.maxTitleCharacters,
    },
    explanation: {
      type: "string",
      minLength: 1,
      maxLength: DIAGRAM_LIMITS.maxExplanationCharacters,
    },
    nodes: {
      type: "array",
      minItems: 1,
      maxItems: DIAGRAM_LIMITS.maxNodes,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "label",
          "description",
          "category",
          "stage",
          "order",
          "group",
          "provenance",
          "sourcePaths",
          "supportConceptIds",
          "synthesisRationale",
          "synthesis",
        ],
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxNodeIdCharacters,
          },
          label: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxNodeLabelCharacters,
          },
          description: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxNodeDescriptionCharacters,
          },
          category: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxCategoryCharacters,
          },
          stage: {
            type: "string",
            enum: GENERATED_DIAGRAM_STAGES,
          },
          order: {
            type: "integer",
            minimum: DIAGRAM_LIMITS.minOrder,
            maximum: DIAGRAM_LIMITS.maxOrder,
          },
          group: {
            anyOf: [
              { type: "null" },
              {
                type: "string",
                minLength: 1,
                maxLength: DIAGRAM_LIMITS.maxGroupCharacters,
              },
            ],
          },
          provenance: {
            type: "string",
            enum: ["user-provided", "stored", "synthesized"],
          },
          sourcePaths: {
            type: "array",
            minItems: 0,
            maxItems: DIAGRAM_LIMITS.maxSourcePathsPerNode,
            items: {
              type: "string",
              minLength: 1,
              maxLength: DIAGRAM_LIMITS.maxSourcePathCharacters,
            },
          },
          supportConceptIds: {
            type: "array",
            minItems: 0,
            maxItems: DIAGRAM_LIMITS.maxSupportConceptIds,
            items: {
              type: "string",
              minLength: 1,
              maxLength: DIAGRAM_LIMITS.maxSourcePathCharacters,
            },
          },
          synthesisRationale: {
            anyOf: [
              { type: "null" },
              {
                type: "string",
                minLength: 1,
                maxLength: DIAGRAM_LIMITS.maxSynthesisRationaleCharacters,
              },
            ],
          },
          synthesis: { type: "boolean" },
        },
      },
    },
    edges: {
      type: "array",
      maxItems: DIAGRAM_LIMITS.maxEdges,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "source",
          "target",
          "label",
          "provenance",
          "supportConceptIds",
        ],
        properties: {
          source: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxNodeIdCharacters,
          },
          target: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxNodeIdCharacters,
          },
          label: {
            type: "string",
            minLength: 0,
            maxLength: DIAGRAM_LIMITS.maxEdgeLabelCharacters,
          },
          provenance: {
            type: "string",
            enum: ["stored", "synthesized"],
          },
          supportConceptIds: {
            type: "array",
            minItems: 1,
            maxItems: DIAGRAM_LIMITS.maxSupportConceptIds,
            items: {
              type: "string",
              minLength: 1,
              maxLength: DIAGRAM_LIMITS.maxSourcePathCharacters,
            },
          },
        },
      },
    },
  },
} as const;

export const GENERATED_DIAGRAM_RESPONSE_FORMAT = {
  type: "json_schema",
  name: "native_okf_generated_diagram",
  description:
    "A grounded native OKF diagram whose node sourcePaths come only from the supplied retrieval allowlist.",
  strict: true,
  schema: GENERATED_DIAGRAM_JSON_SCHEMA,
} as const;
