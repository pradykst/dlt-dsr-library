import type { NodeType } from "@/lib/types";

export const nodeTypeColors: Record<NodeType, { bg: string; border: string; text: string; dot: string }> = {
  paper: { bg: "#eef2f7", border: "#b9c5d4", text: "#293547", dot: "#4f6f91" },
  domain: { bg: "#f3f0ea", border: "#d5cdbd", text: "#38342d", dot: "#8a7654" },
  problem: { bg: "#f6eeee", border: "#d8bfc0", text: "#4a2c31", dot: "#9b636d" },
  requirement: { bg: "#f4f0f7", border: "#cbbdd8", text: "#352940", dot: "#77658f" },
  principle: { bg: "#eef4ef", border: "#b9cdbd", text: "#273a2c", dot: "#5f7f67" },
  feature: { bg: "#f6f1e7", border: "#d9c79f", text: "#46371d", dot: "#a77b37" },
  artifact: { bg: "#edf3f4", border: "#b5cbd0", text: "#263d43", dot: "#4d7a84" },
  evaluation: { bg: "#f1f1ef", border: "#c8c6bd", text: "#353633", dot: "#77766f" },
  capability: { bg: "#edf2f6", border: "#b8c6d0", text: "#253640", dot: "#5b7385" },
  pattern: { bg: "#f0f4ee", border: "#bbcbb4", text: "#2d3b29", dot: "#6f8a5d" },
  theory: { bg: "#f2eff4", border: "#c8bbd2", text: "#342a3d", dot: "#806d91" },
  stakeholder: { bg: "#f4f0ea", border: "#d0c3ad", text: "#3c3428", dot: "#9a7a49" }
};

export const capabilityPalette = ["#e7ecef", "#bfd0d9", "#7f9bab", "#34586c"];

export const edgeColor = "#a9a69b";
