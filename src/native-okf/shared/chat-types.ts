export type NativeOkfChatRole = "user" | "assistant";

export interface NativeOkfChatHistoryMessage {
  role: NativeOkfChatRole;
  content: string;
}

export interface NativeOkfChatRequest {
  question: string;
  history?: NativeOkfChatHistoryMessage[];
  includeDiagram?: boolean;
}

export interface NativeOkfSourceCard {
  sourceId: string;
  conceptId: string;
  title: string;
  type: string;
  description?: string;
  sourcePaper?: string;
  resource?: string;
}

export const GENERATED_DIAGRAM_STAGES = [
  "problem",
  "requirements",
  "principles",
  "features",
  "artifact",
  "governance",
  "evaluation",
  "outcome",
  "other",
] as const;

export type DiagramStage = (typeof GENERATED_DIAGRAM_STAGES)[number];

export interface GeneratedDiagramNode {
  id: string;
  label: string;
  description: string;
  category: string;
  stage: DiagramStage;
  order: number;
  group: string | null;
  sourcePaths: string[];
  synthesis: boolean;
}

export interface GeneratedDiagramEdge {
  source: string;
  target: string;
  label: string;
}

export interface GeneratedDiagram {
  title: string;
  explanation: string;
  nodes: GeneratedDiagramNode[];
  edges: GeneratedDiagramEdge[];
}

export interface NativeOkfPersonalQuotaMetadata {
  questionsRemainingToday: number;
  diagramsRemainingToday: number;
  questionsRemainingTotal: number;
  diagramsRemainingTotal: number;
  resetAtMs: number;
  accessExpiresAtMs: number;
}

export interface NativeOkfChatResponse {
  answerMarkdown: string;
  sources: NativeOkfSourceCard[];
  diagram?: GeneratedDiagram;
  insufficientContext: boolean;
  warnings?: string[];
  retrievalDebug?: unknown;
  quota?: NativeOkfPersonalQuotaMetadata;
}
