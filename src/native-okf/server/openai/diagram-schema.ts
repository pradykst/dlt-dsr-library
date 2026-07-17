import "server-only";

export const DIAGRAM_LIMITS = Object.freeze({
  maxTitleCharacters: 160,
  maxExplanationCharacters: 2_000,
  maxNodes: 18,
  maxEdges: 30,
  maxNodeIdCharacters: 64,
  maxNodeLabelCharacters: 160,
  maxCategoryCharacters: 80,
  maxSourcePathsPerNode: 20,
  maxSourcePathCharacters: 320,
  maxEdgeLabelCharacters: 120,
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
        required: ["id", "label", "category", "sourcePaths", "synthesis"],
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
          category: {
            type: "string",
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxCategoryCharacters,
          },
          sourcePaths: {
            type: "array",
            minItems: 1,
            maxItems: DIAGRAM_LIMITS.maxSourcePathsPerNode,
            items: {
              type: "string",
              minLength: 1,
              maxLength: DIAGRAM_LIMITS.maxSourcePathCharacters,
            },
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
        required: ["source", "target", "label"],
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
            minLength: 1,
            maxLength: DIAGRAM_LIMITS.maxEdgeLabelCharacters,
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
