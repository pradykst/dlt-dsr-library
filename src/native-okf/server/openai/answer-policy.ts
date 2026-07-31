import "server-only";

import type { NativeOkfAnswerMode } from "../conversation.ts";

const FENCED_DIAGRAM_BLOCK =
  /```\s*(?:mermaid|dot|graphviz|plantuml)\b[\s\S]*?```/iu;
const DIAGRAM_DIRECTIVE_LINE =
  /^\s*(?:flowchart|graph|digraph|sequenceDiagram|stateDiagram(?:-v2)?|classDiagram|erDiagram)\b/imu;
const DOT_EDGE_LINE =
  /^\s*(?:"[^"]+"|[\w.-]+)\s*(?:--|->)\s*(?:"[^"]+"|[\w.-]+)\s*(?:\[[^\]]*\])?\s*;?\s*$/gmu;
const ASCII_TREE_LINE =
  /^\s*(?:[|+`\\-]+|[\u2500-\u257f]+)\s*(?:--|\u2500{2}|[>+])\s*\S+/gmu;
const HTML_SVG_PAYLOAD =
  /<(?:svg|path|polygon|polyline|marker|mxGraphModel|diagram)\b/iu;
const JSON_DIAGRAM_PAYLOAD =
  /(?:```\s*json\s*)?\{[\s\S]{0,12000}?"nodes"\s*:\s*\[[\s\S]{0,12000}?"edges"\s*:\s*\[/iu;
const TEXTUAL_NODE_EDGE_LINE =
  /^\s*(?:node|edge)\s+[\w.-]+\s*(?::|->|-->)\s*\S+/gimu;
const BULLET_LINE = /^\s*(?:[-*+] |\d+[.)] )/gmu;
const HEADING_LINE = /^#{1,6}\s+(.+)$/gmu;
const INTERNAL_SOURCE_REQUEST =
  /\b(?:provide|paste)\b[^.!?]{0,120}\b(?:retrieved\s+source\s+text|internal\s+(?:source\s+records?|concept\s+ids?)|native\s+source\s+records?)\b|\bretrieve\b[^.!?]{0,120}\bnative\s+source\s+records?\b|\bupload\b[^.!?]{0,120}\bpaper\b/iu;

export const NATIVE_OKF_INTERNAL_SOURCE_REQUEST_ERROR =
  "The answer asks the user to supply internal library source material.";

export interface NativeOkfAnswerPolicyResult {
  valid: boolean;
  errors: string[];
  wordCount: number;
  paragraphCount: number;
  bulletCount: number;
  maximumWords: number;
}

export type NativeOkfAnswerPolicyMode =
  | NativeOkfAnswerMode
  | "synthesis-outline";

export const NATIVE_OKF_ANSWER_HARD_WORD_LIMITS: Record<
  NativeOkfAnswerPolicyMode,
  number
> = {
  normal: 350,
  comparison: 450,
  detailed: 900,
  "synthesis-outline": 280,
};

function matchCount(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function countWords(value: string): number {
  return (
    value.match(
      /[\p{L}\p{N}]+(?:['\u2019.-][\p{L}\p{N}]+)*/gu,
    )?.length ?? 0
  );
}

function arrowHeavyLines(value: string): number {
  return value.split("\n").filter((line) => {
    const arrows =
      line.match(/(?:--?>|==>|=>|\u2192|\u21d2|\u21e2|\u2193|\u2191|\u2190)/gu)?.length ?? 0;
    const delimiters = line.match(/[\[\]{}()|+]/gu)?.length ?? 0;
    return (
      arrows >= 1 &&
      (delimiters >= 2 || arrows >= 2) &&
      line.replace(/\s/gu, "").length <= 180
    );
  }).length;
}

function pseudoTableDiagramLines(value: string): number {
  return value.split("\n").filter((line) =>
    /^\s*\|.*(?:--?>|==>|=>|\u2192|\u21d2|\u2193|\u2191|\u2190).*\|\s*$/u.test(line)
  ).length;
}

function repeatedHeadings(value: string): string[] {
  const headings = [...value.matchAll(HEADING_LINE)].flatMap(
    (match) =>
      match[1]
        ? [match[1].trim().toLocaleLowerCase("en")]
        : [],
  );
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const heading of headings) {
    if (seen.has(heading)) repeated.add(heading);
    seen.add(heading);
  }
  return [...repeated];
}

export function validateNativeOkfAnswerPolicy(
  answerMarkdown: string,
  mode: NativeOkfAnswerPolicyMode,
): NativeOkfAnswerPolicyResult {
  const errors: string[] = [];
  const words = countWords(answerMarkdown);
  const maximumWords = NATIVE_OKF_ANSWER_HARD_WORD_LIMITS[mode];
  const paragraphs = answerMarkdown
    .split(/\n\s*\n/gu)
    .filter((paragraph) => paragraph.trim() !== "").length;
  const bullets = matchCount(answerMarkdown, BULLET_LINE);
  const boxDrawingCharacters =
    answerMarkdown.match(/[\u2500-\u257f]/gu)?.length ?? 0;

  if (INTERNAL_SOURCE_REQUEST.test(answerMarkdown)) {
    errors.push(NATIVE_OKF_INTERNAL_SOURCE_REQUEST_ERROR);
  }
  if (FENCED_DIAGRAM_BLOCK.test(answerMarkdown)) {
    errors.push(
      "The answer contains a fenced diagram-language block.",
    );
  }
  if (DIAGRAM_DIRECTIVE_LINE.test(answerMarkdown)) {
    errors.push("The answer contains a diagram-language directive.");
  }
  if (matchCount(answerMarkdown, DOT_EDGE_LINE) >= 2) {
    errors.push(
      "The answer contains repeated DOT-like node-edge syntax.",
    );
  }
  if (
    boxDrawingCharacters >= 6 ||
    matchCount(answerMarkdown, ASCII_TREE_LINE) >= 2
  ) {
    errors.push(
      "The answer contains an ASCII or box-drawing flow pattern.",
    );
  }
  if (arrowHeavyLines(answerMarkdown) >= 2) {
    errors.push(
      "The answer contains an arrow-heavy multiline pseudo-diagram.",
    );
  }
  if (pseudoTableDiagramLines(answerMarkdown) >= 2) {
    errors.push(
      "The answer contains a pseudo-table used as a diagram.",
    );
  }
  if (HTML_SVG_PAYLOAD.test(answerMarkdown)) {
    errors.push("The answer contains an HTML or SVG diagram payload.");
  }
  if (JSON_DIAGRAM_PAYLOAD.test(answerMarkdown)) {
    errors.push(
      "The answer embeds JSON diagram output in visible text.",
    );
  }
  if (matchCount(answerMarkdown, TEXTUAL_NODE_EDGE_LINE) >= 2) {
    errors.push(
      "The answer contains a textual node-edge representation.",
    );
  }
  if (words > maximumWords) {
    errors.push(
      `The answer has ${words} words; the hard limit is ${maximumWords}.`,
    );
  }
  const bulletLimit = mode === "detailed" ? 12 : 5;
  if (bullets > bulletLimit) {
    errors.push(
      `The answer has ${bullets} bullets; the limit is ${bulletLimit}.`,
    );
  }
  const paragraphLimit =
    mode === "normal" || mode === "synthesis-outline"
      ? 8
      : mode === "comparison"
        ? 10
        : 24;
  if (paragraphs > paragraphLimit) {
    errors.push(
      `The answer has ${paragraphs} paragraphs; the limit is ${paragraphLimit}.`,
    );
  }
  if (repeatedHeadings(answerMarkdown).length > 0) {
    errors.push("The answer repeats one or more section headings.");
  }

  return {
    valid: errors.length === 0,
    errors,
    wordCount: words,
    paragraphCount: paragraphs,
    bulletCount: bullets,
    maximumWords,
  };
}
