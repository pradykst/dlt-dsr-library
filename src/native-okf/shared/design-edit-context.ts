import type { NativeOkfChatHistoryMessage, SynthesisDraftState } from "./chat-types.ts";

/** Operation vocabulary only; application domains and proposed solutions are not inferred here. */
export const DESIGN_EDIT_ACTION = /\b(?:add(?:ing)?|include|insert|introduce|connect|reconnect|link|attach|remov(?:e|ing)|delete|drop|exclude|renam(?:e|ing)|relabel|updat(?:e|ing)|revise|replac(?:e|ing)|move|refine|simplif(?:y|ying)|reduce|prune|adjust|chang(?:e|ing)|make|split(?:ting)?|separat(?:e|ing)|merg(?:e|ing)|combin(?:e|ing)|consolidate|undo|revert|restore|implement|apply|incorporate)\b/iu;
export const DESIGN_EDIT_DISCUSSION = /\b(?:what\s+do\s+you\s+think|would\s+(?:it|that|this)\s+make\s+sense|should\s+(?:i|we)|discuss|consider(?:ing)?|thinking\s+about|before\s+(?:editing|changing|applying))\b/iu;
export const DESIGN_EDIT_REVERT = /^\s*(?:(?:please|actually|now)\s+)*(?:undo|revert|restore)\b/iu;
export const DESIGN_EDIT_CORRECTION = /^\s*(?:no\b|actually\b|rather\b|instead\b)|\b(?:i|we)\s+mean\b/iu;
const REFERENT = /\b(?:this|that|it|these|those|above|what\s+(?:i|we)\s+(?:said|described|requested))\b/iu;
const APPLY = /\b(?:apply|implement|incorporate|reflect|put|do|carry)\b/iu;
const TASK_WORDS = /^(?:can|could|would|will|you|we|i|please|pls|also|now|just|then|actually|and|so|the|a|an|to|into|in|on|of|for|with|this|that|it|these|those|above|what|said|described|requested|apply|implement|incorporate|reflect|put|do|carry|out|change|changes|edit|edits|modification|modifications|diagram|mapping|graph|proposal|design)$/iu;

export function isDeferredDesignEdit(question: string): boolean {
  return APPLY.test(question) && REFERENT.test(question) &&
    !(question.match(/[\p{L}\p{N}]+/gu) ?? []).some(word => !TASK_WORDS.test(word));
}

/** Only researcher instructions establish an edit. Assistant suggestions are not authorization. */
export function recentDesignInstructions(history: readonly NativeOkfChatHistoryMessage[]): string | null {
  const users = history.filter(message => message.role === "user").slice(-3);
  const last = users.findLastIndex(message => DESIGN_EDIT_ACTION.test(message.content) && !isDeferredDesignEdit(message.content));
  if (last < 0) return null;
  return users.slice(last).map(message => message.content).join("\n");
}

export function resolveDesignEditContext(question: string, pending: string | null | undefined,
  history: readonly NativeOkfChatHistoryMessage[]): string | null {
  if (!isDeferredDesignEdit(question)) return null;
  const instruction = pending || recentDesignInstructions(history);
  return instruction ? `${instruction}\nLatest instruction: ${question}` : null;
}

/** An explicit positional target bounds the edit; ordinary constraints remain semantically reviewed. */
export function orderedDesignNodes(draft: SynthesisDraftState, displayedOrder?: readonly string[]) {
  if (!displayedOrder || displayedOrder.length !== draft.nodes.length || new Set(displayedOrder).size !== draft.nodes.length ||
      draft.nodes.some(node => !displayedOrder.includes(node.id))) return draft.nodes;
  const positions = new Map(displayedOrder.map((id, index) => [id, index]));
  return [...draft.nodes].sort((left, right) => positions.get(left.id)! - positions.get(right.id)!);
}

export function positionalDesignEditScope(question: string, draft: SynthesisDraftState, displayedOrder?: readonly string[]): Set<string> | null {
  const roles: Record<string, string[]> = { requirement: ["design-requirement", "meta-requirement", "requirements"],
    principle: ["design-principle", "principles"], feature: ["design-feature", "features"], artifact: ["artifact"] };
  const targets = new Set<string>();
  for (const match of question.matchAll(/\b(first|second|third|fourth|fifth|last)\s+(?:design\s+)?(requirement|principle|feature|artifact)s?\b/giu)) {
    const nodes = orderedDesignNodes(draft, displayedOrder).filter(node => roles[match[2]!.toLowerCase()]!.includes(node.stage));
    const index = match[1]!.toLowerCase() === "last" ? nodes.length - 1 : ["first", "second", "third", "fourth", "fifth"].indexOf(match[1]!.toLowerCase());
    if (nodes[index]) targets.add(nodes[index]!.id);
  }
  if (!targets.size) return null;
  if (/\b(?:rename|relabel)\b/iu.test(question)) return targets;
  // Only direct downstream design mechanisms can be adapted implicitly. An
  // artifact's identity is outside this set unless explicitly targeted.
  for (let depth = 0; depth < 2; depth += 1) {
    for (const edge of draft.edges) {
      const node = draft.nodes.find(node => node.id === edge.target);
      if (targets.has(edge.source) && node && ["design-principle", "principles", "design-feature", "features"].includes(node.stage)) targets.add(node.id);
    }
  }
  return targets;
}
