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

export interface GeneratedDiagramNode {
  id: string;
  label: string;
  category: string;
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

export interface NativeOkfChatResponse {
  answerMarkdown: string;
  sources: NativeOkfSourceCard[];
  diagram?: GeneratedDiagram;
  insufficientContext: boolean;
  warnings?: string[];
  retrievalDebug?: unknown;
}
