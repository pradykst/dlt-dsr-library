"use client";

import { useState } from "react";

import {
  designKnowledgeStarterQuestion,
  groundedSolutionStarterQuestion,
  hasMeaningfulGuidedProblem,
  isGuidedQuestionWithinBounds,
  MAX_GUIDED_QUESTION_CHARACTERS,
  MIN_GUIDED_PROBLEM_CHARACTERS,
  paperComparisonStarterQuestion,
  paperMapStarterQuestion,
  validateDistinctGuidedPapers,
  type NativeOkfGuidedStarterKind,
  type NativeOkfGuidedStarterPaper,
} from "../../shared/guided-starters.ts";

const WORKFLOWS: ReadonlyArray<{
  kind: NativeOkfGuidedStarterKind;
  label: string;
  description: string;
  requiresDiagram: boolean;
}> = [
  {
    kind: "paper-map",
    label: "Explore a paper map",
    description:
      "View the stored design-knowledge structure represented for one paper.",
    requiresDiagram: true,
  },
  {
    kind: "design-knowledge",
    label: "Inspect design knowledge",
    description:
      "Ask about a design category represented in one selected paper.",
    requiresDiagram: false,
  },
  {
    kind: "paper-comparison",
    label: "Compare two papers",
    description: "Compare reusable design knowledge across two publications.",
    requiresDiagram: false,
  },
  {
    kind: "grounded-solution",
    label: "Build a design proposal",
    description:
      "Use the library to generate a problem-specific decision-support flow.",
    requiresDiagram: true,
  },
] as const;

interface GuidedChatStartersProps {
  papers: readonly NativeOkfGuidedStarterPaper[];
  currentDiagramEnabled: boolean;
  pending: boolean;
  onDefaultDiagramIntent: (enabled: boolean) => void;
  onAsk: (question: string, includeDiagram: boolean) => void;
}

function PaperSelect({
  id,
  label,
  papers,
  value,
  onChange,
}: {
  id: string;
  label: string;
  papers: readonly NativeOkfGuidedStarterPaper[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 text-sm font-semibold text-ink">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block w-full max-w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-blue/50 focus:ring-2 focus:ring-blue/20"
      >
        <option value="">Select a paper</option>
        {papers.map((paper) => (
          <option key={paper.id} value={paper.id}>
            {paper.title}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GuidedChatStarters({
  papers,
  currentDiagramEnabled,
  pending,
  onDefaultDiagramIntent,
  onAsk,
}: GuidedChatStartersProps) {
  const [activeKind, setActiveKind] =
    useState<NativeOkfGuidedStarterKind | null>(null);
  const [mapPaperId, setMapPaperId] = useState("");
  const [knowledgePaperId, setKnowledgePaperId] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] = useState("");
  const [firstPaperId, setFirstPaperId] = useState("");
  const [secondPaperId, setSecondPaperId] = useState("");
  const [problem, setProblem] = useState("");
  const [attempted, setAttempted] = useState(false);

  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const mapPaper = paperById.get(mapPaperId);
  const knowledgePaper = paperById.get(knowledgePaperId);
  const firstPaper = paperById.get(firstPaperId);
  const secondPaper = paperById.get(secondPaperId);
  const selectedKnowledgeCategory = knowledgePaper?.categories.find(
    (category) => category.type === knowledgeCategory,
  );

  function activate(kind: NativeOkfGuidedStarterKind) {
    const workflow = WORKFLOWS.find((candidate) => candidate.kind === kind);
    if (!workflow) return;
    const opening = activeKind !== kind;
    setActiveKind(opening ? kind : null);
    setAttempted(false);
    if (opening) onDefaultDiagramIntent(workflow.requiresDiagram);
  }

  let generatedQuestion = "";
  let validation = "";
  let generatedDiagramIntent = currentDiagramEnabled;

  if (activeKind === "paper-map") {
    if (mapPaper) generatedQuestion = paperMapStarterQuestion(mapPaper.title);
    else validation = "Select one paper to view its stored design map.";
    generatedDiagramIntent = true;
  } else if (activeKind === "design-knowledge") {
    if (!knowledgePaper) validation = "Select one paper to inspect.";
    else if (!selectedKnowledgeCategory) {
      validation = "Select a represented design category.";
    } else {
      generatedQuestion = designKnowledgeStarterQuestion(
        knowledgePaper.title,
        selectedKnowledgeCategory.label,
      );
    }
  } else if (activeKind === "paper-comparison") {
    validation = validateDistinctGuidedPapers(firstPaperId, secondPaperId) ?? "";
    if (!validation && firstPaper && secondPaper) {
      generatedQuestion = paperComparisonStarterQuestion(
        firstPaper.title,
        secondPaper.title,
      );
    }
  } else if (activeKind === "grounded-solution") {
    if (!hasMeaningfulGuidedProblem(problem)) {
      validation = `Describe a meaningful problem using at least ${MIN_GUIDED_PROBLEM_CHARACTERS} characters.`;
    } else {
      generatedQuestion = groundedSolutionStarterQuestion(problem);
      if (!isGuidedQuestionWithinBounds(generatedQuestion)) {
        validation = `The generated question must remain within ${MAX_GUIDED_QUESTION_CHARACTERS.toLocaleString()} characters.`;
        generatedQuestion = "";
      }
    }
    generatedDiagramIntent = true;
  }

  function ask() {
    setAttempted(true);
    if (!generatedQuestion || validation || pending) return;
    onAsk(generatedQuestion, generatedDiagramIntent);
  }

  const activeWorkflow = WORKFLOWS.find(
    (workflow) => workflow.kind === activeKind,
  );

  return (
    <section aria-label="Guided starters" className="min-w-0 max-w-full">
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {WORKFLOWS.map((workflow) => {
          const expanded = activeKind === workflow.kind;
          return (
            <button
              key={workflow.kind}
              type="button"
              aria-expanded={expanded}
              aria-controls="native-okf-guided-starter-form"
              disabled={pending}
              onClick={() => activate(workflow.kind)}
              className="min-w-0 rounded-xl border border-line bg-paper px-4 py-3 text-left transition hover:border-blue/35 hover:bg-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-not-allowed disabled:opacity-55"
            >
              <span className="block text-sm font-semibold text-ink">
                {workflow.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {workflow.description}
              </span>
            </button>
          );
        })}
      </div>

      {activeWorkflow ? (
        <div
          id="native-okf-guided-starter-form"
          className="mt-4 min-w-0 max-w-full rounded-xl border border-blue/20 bg-blue/5 p-4 text-left sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {activeWorkflow.label}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                Configure the question below. Nothing is submitted until you press
                Ask this question.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveKind(null)}
              className="text-xs font-semibold text-blue underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            {activeKind === "paper-map" ? (
              <PaperSelect
                id="guided-map-paper"
                label="Paper"
                papers={papers}
                value={mapPaperId}
                onChange={setMapPaperId}
              />
            ) : null}

            {activeKind === "design-knowledge" ? (
              <>
                <PaperSelect
                  id="guided-knowledge-paper"
                  label="Paper"
                  papers={papers}
                  value={knowledgePaperId}
                  onChange={(value) => {
                    setKnowledgePaperId(value);
                    setKnowledgeCategory("");
                    setAttempted(false);
                  }}
                />
                <label
                  htmlFor="guided-knowledge-category"
                  className="block min-w-0 text-sm font-semibold text-ink"
                >
                  Represented category
                  <select
                    id="guided-knowledge-category"
                    value={knowledgeCategory}
                    disabled={!knowledgePaper}
                    onChange={(event) => setKnowledgeCategory(event.target.value)}
                    className="mt-2 block w-full max-w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-blue/50 focus:ring-2 focus:ring-blue/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Select a represented category</option>
                    {knowledgePaper?.categories.map((category) => (
                      <option key={category.type} value={category.type}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            {activeKind === "paper-comparison" ? (
              <>
                <PaperSelect
                  id="guided-first-paper"
                  label="First paper"
                  papers={papers}
                  value={firstPaperId}
                  onChange={setFirstPaperId}
                />
                <PaperSelect
                  id="guided-second-paper"
                  label="Second paper"
                  papers={papers}
                  value={secondPaperId}
                  onChange={setSecondPaperId}
                />
              </>
            ) : null}

            {activeKind === "grounded-solution" ? (
              <label
                htmlFor="guided-grounded-problem"
                className="block min-w-0 text-sm font-semibold text-ink sm:col-span-2"
              >
                Research problem
                <textarea
                  id="guided-grounded-problem"
                  value={problem}
                  rows={4}
                  maxLength={MAX_GUIDED_QUESTION_CHARACTERS}
                  onChange={(event) => setProblem(event.target.value)}
                  placeholder="Describe the problem the decision-support flow should address."
                  className="mt-2 block w-full max-w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-normal leading-6 text-ink outline-none placeholder:text-slate-400 focus:border-blue/50 focus:ring-2 focus:ring-blue/20"
                />
                <span className="mt-1 block text-xs font-normal text-muted">
                  {problem.length}/{MAX_GUIDED_QUESTION_CHARACTERS}
                </span>
              </label>
            ) : null}
          </div>

          {generatedQuestion ? (
            <div className="mt-4 min-w-0 rounded-lg border border-line bg-white px-3 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-blue">
                Generated question
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-slate-700">
                {generatedQuestion}
              </p>
            </div>
          ) : null}

          {attempted && validation ? (
            <p role="alert" className="mt-3 text-xs font-semibold text-rose-700">
              {validation}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-5 text-muted">
              {generatedDiagramIntent
                ? "This workflow will request the existing design-proposal diagram path."
                : "This workflow is text-only unless you enable the existing diagram control."}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={ask}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Ask this question
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
