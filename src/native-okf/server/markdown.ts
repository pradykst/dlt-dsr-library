import "server-only";

import { unified } from "unified";
import { visit } from "unist-util-visit";
import remarkParse from "remark-parse";

import { resolveOkfLinkTarget } from "./paths.ts";
import type { OkfHeading, OkfLink } from "./types.ts";

interface AstNode {
  type: string;
  value?: unknown;
  alt?: unknown;
  identifier?: unknown;
  url?: unknown;
  depth?: unknown;
  children?: AstNode[];
  position?: {
    start?: {
      line?: number;
    };
  };
}

export interface ParseOkfMarkdownOptions {
  sourceId: string;
  /** Bundle-relative POSIX path, including `.md`. */
  sourceFilePath: string;
}

export interface ParsedOkfMarkdown {
  headings: OkfHeading[];
  links: OkfLink[];
}

function textFromNode(node: AstNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "image" && typeof node.alt === "string") {
    return node.alt;
  }
  if (!node.children) {
    return "";
  }

  return node.children.map(textFromNode).join("");
}

function normalizeReferenceIdentifier(identifier: string): string {
  return identifier.trim().replace(/\s+/gu, " ").toLowerCase();
}

function asAstNode(value: unknown): AstNode {
  return value as AstNode;
}

/**
 * Parse headings and Markdown links without imposing an edge ontology.
 * Internal link existence is resolved later, once the complete bundle is in
 * memory; normalized candidates are retained on targetId/targetPath.
 */
export function parseOkfMarkdown(
  markdownBody: string,
  options: ParseOkfMarkdownOptions,
): ParsedOkfMarkdown {
  const tree = unified().use(remarkParse).parse(markdownBody);
  const definitions = new Map<string, string>();

  visit(tree, (unknownNode) => {
    const node = asAstNode(unknownNode);
    if (
      node.type === "definition" &&
      typeof node.identifier === "string" &&
      typeof node.url === "string"
    ) {
      definitions.set(normalizeReferenceIdentifier(node.identifier), node.url);
    }
  });

  const headings: OkfHeading[] = [];
  const links: OkfLink[] = [];
  let relationHint: string | undefined;

  visit(tree, (unknownNode) => {
    const node = asAstNode(unknownNode);

    if (node.type === "heading" && typeof node.depth === "number") {
      const text = textFromNode(node).trim();
      const heading: OkfHeading = {
        depth: node.depth,
        text,
      };
      const line = node.position?.start?.line;
      if (typeof line === "number") {
        heading.line = line;
      }
      headings.push(heading);
      relationHint = text || undefined;
      return;
    }

    let rawTarget: string | undefined;
    if (node.type === "link" && typeof node.url === "string") {
      rawTarget = node.url;
    } else if (
      node.type === "linkReference" &&
      typeof node.identifier === "string"
    ) {
      rawTarget = definitions.get(
        normalizeReferenceIdentifier(node.identifier),
      );
    }

    if (rawTarget === undefined) {
      return;
    }

    const target = resolveOkfLinkTarget(options.sourceFilePath, rawTarget);
    if (target.kind === "ignored") {
      return;
    }

    const link: OkfLink = {
      sourceId: options.sourceId,
      rawTarget,
      label: textFromNode(node).trim(),
      resolved: false,
      external: target.kind === "external",
      broken: false,
    };
    if (relationHint !== undefined) {
      link.relationHint = relationHint;
    }
    if (target.kind === "internal") {
      link.targetId = target.targetId;
      link.targetPath = target.targetPath;
    }
    links.push(link);
  });

  return { headings, links };
}

export const parseMarkdown = parseOkfMarkdown;
