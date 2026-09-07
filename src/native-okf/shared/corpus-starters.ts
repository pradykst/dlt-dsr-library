/**
 * The four corpus-wide starter capabilities shown above the main chat composer.
 * Each card populates an editable example into the composer — nothing is sent
 * until the researcher submits. Placeholders such as `[paper 1]` and
 * `[describe your problem]` are meant to be edited; no routing depends on the
 * exact text of these examples.
 */
export interface NativeOkfCorpusStarter {
  id: string;
  label: string;
  description: string;
  example: string;
}

export const NATIVE_OKF_CORPUS_STARTERS: readonly NativeOkfCorpusStarter[] = [
  {
    id: "relevant-design-knowledge",
    label: "Find relevant design knowledge",
    description:
      "Describe a problem or topic and find relevant requirements, principles, and features across the library.",
    example:
      "What design knowledge in the library is relevant to privacy-preserving information exchange across organizations?",
  },
  {
    id: "reusable-patterns",
    label: "Discover reusable design patterns",
    description:
      "Identify recurring design ideas and mechanisms across multiple publications.",
    example:
      "What reusable design patterns appear across the library for establishing trust between organizations?",
  },
  {
    id: "compare-papers",
    label: "Compare two papers",
    description: "Compare reusable design knowledge across two publications.",
    example: "Compare the reusable design knowledge in [paper 1] and [paper 2].",
  },
  {
    id: "design-proposal",
    label: "Build a design proposal",
    description:
      "Use the library to generate a problem-specific, evidence-grounded design proposal.",
    example:
      "I am designing a system for [describe your problem]. What requirements, design principles, and features should I consider?",
  },
] as const;
