/**
 * Canonical public routes for the accepted native OKF release shell.
 *
 * The model API deliberately keeps its existing native namespace.
 * Route definitions in this module are dependency-free so they can be shared
 * by server components, client components, tests, and Next configuration.
 */
export const NATIVE_OKF_PUBLIC_ROUTES = {
  home: "/",
  library: "/library",
  chat: "/chat",
  method: "/method",
} as const;

/** Concise alias used by release-shell components and readiness checks. */
export const CANONICAL_ROUTES = NATIVE_OKF_PUBLIC_ROUTES;

export const NATIVE_OKF_API_ROUTES = {
  chat: "/api/native-okf/chat",
  retrievalDebug: "/api/native-okf/retrieval-debug",
  retired: "/api/native-okf/retired",
} as const;

/** Public noindex destination that deliberately resolves to a controlled 404. */
export const NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE = "/route-unavailable";

export interface NativeOkfRedirectDefinition {
  source: string;
  destination: string;
  permanent: false;
}

export interface NativeOkfRewriteDefinition {
  source: string;
  destination: string;
}

/** Temporary canary redirects from the former native-prefixed public URLs. */
export const NATIVE_OKF_COMPATIBILITY_REDIRECTS = [
  {
    source: "/native-okf/admin/access",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/native-okf/admin",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/native-okf/papers/:slug",
    destination: "/papers/:slug",
    permanent: false,
  },
  {
    source: "/native-okf/concepts/:conceptId*",
    destination: "/concepts/:conceptId*",
    permanent: false,
  },
  {
    source: "/native-okf/chat",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
  {
    source: "/native-okf/access",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
  {
    source: "/native-okf/method",
    destination: NATIVE_OKF_PUBLIC_ROUTES.method,
    permanent: false,
  },
  {
    source: "/native-okf/route-unavailable",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/native-okf/release-home",
    destination: NATIVE_OKF_PUBLIC_ROUTES.home,
    permanent: false,
  },
  {
    source: "/native-okf",
    destination: NATIVE_OKF_PUBLIC_ROUTES.library,
    permanent: false,
  },
] satisfies readonly NativeOkfRedirectDefinition[];

/**
 * Public legacy locations receive either the closest valid canonical route or
 * a controlled not-found response. No legacy implementation is imported.
 */
export const LEGACY_PUBLIC_REDIRECTS = [
  {
    source: "/access",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
  {
    source: "/workbench/import",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/ingest",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/workbench/admin",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/desrist-evaluation/admin",
    destination: NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    permanent: false,
  },
  {
    source: "/workbench/:paperId",
    destination: "/papers/:paperId",
    permanent: false,
  },
  {
    source: "/workbench",
    destination: NATIVE_OKF_PUBLIC_ROUTES.library,
    permanent: false,
  },
  {
    source: "/explore",
    destination: NATIVE_OKF_PUBLIC_ROUTES.library,
    permanent: false,
  },
  {
    source: "/patterns",
    destination: NATIVE_OKF_PUBLIC_ROUTES.library,
    permanent: false,
  },
  {
    source: "/okf-chat",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
  {
    source: "/chatbot-demo",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
  {
    source: "/flow-builder",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
  {
    source: "/methodology",
    destination: NATIVE_OKF_PUBLIC_ROUTES.method,
    permanent: false,
  },
  {
    source: "/desrist-evaluation",
    destination: NATIVE_OKF_PUBLIC_ROUTES.chat,
    permanent: false,
  },
] satisfies readonly NativeOkfRedirectDefinition[];

export const LEGACY_UNAVAILABLE_REWRITES =
  [] satisfies readonly NativeOkfRewriteDefinition[];

/**
 * Retained legacy API source stays on disk for rollback but is unreachable
 * from production URLs. These path-level guards import no legacy module.
 */
export const LEGACY_API_BLOCK_REWRITES = [
  {
    source: "/api/okf/:path*",
    destination: NATIVE_OKF_API_ROUTES.retired,
  },
  {
    source: "/api/workbench/:path*",
    destination: NATIVE_OKF_API_ROUTES.retired,
  },
  {
    source: "/api/desrist-evaluation/:path*",
    destination: NATIVE_OKF_API_ROUTES.retired,
  },
] satisfies readonly NativeOkfRewriteDefinition[];
/**
 * Canonical browser URLs are served by the accepted native route modules.
 * Next applies redirects before beforeFiles rewrites, preventing loops while
 * keeping the native-prefixed URLs useful as rollback-compatible internals.
 */
export const NATIVE_OKF_CANONICAL_REWRITES = [
  { source: "/", destination: "/native-okf/release-home" },
  { source: NATIVE_OKF_PUBLIC_ROUTES.library, destination: "/native-okf" },
  { source: NATIVE_OKF_PUBLIC_ROUTES.chat, destination: "/native-okf/chat" },
  {
    source: NATIVE_OKF_PUBLIC_ROUTES.method,
    destination: "/native-okf/method",
  },
  {
    source: "/papers/:slug",
    destination: "/native-okf/papers/:slug",
  },
  {
    source: "/concepts/:conceptId*",
    destination: "/native-okf/concepts/:conceptId*",
  },
] satisfies readonly NativeOkfRewriteDefinition[];

/** Patterns that should receive an X-Robots-Tag noindex header. */
export const NATIVE_OKF_NOINDEX_PATTERNS = [
  "/api/:path*",
  "/native-okf",
  "/native-okf/:path*",
  NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
  "/workbench",
  "/workbench/:path*",
  "/desrist-evaluation",
  "/desrist-evaluation/:path*",
  "/explore",
  "/patterns",
  "/okf-chat",
  "/chatbot-demo",
  "/flow-builder",
  "/methodology",
  "/ingest",
] as const;

function encodePathSegments(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** Build a canonical paper Workbench URL from either a paper ID or slug. */
export function paperHref(paperIdOrSlug: string): string {
  const normalized = paperIdOrSlug.trim().replaceAll("\\", "/");
  const slug = normalized.startsWith("papers/")
    ? normalized.slice("papers/".length)
    : normalized;

  if (slug && !slug.includes("/") && slug !== "." && slug !== "..") {
    return `/papers/${encodeURIComponent(slug.replace(/\.md$/iu, ""))}`;
  }

  return NATIVE_OKF_PUBLIC_ROUTES.library;
}

/** Build a canonical catch-all concept URL from a normalized concept ID. */
export function conceptRouteHref(conceptId: string): string {
  const normalized = conceptId
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/gu, "")
    .replace(/\.md$/iu, "");
  const paperMatch = /^papers\/([^/]+)$/u.exec(normalized);
  if (paperMatch?.[1]) {
    return paperHref(paperMatch[1]);
  }

  const encoded = encodePathSegments(normalized);
  return encoded
    ? `/concepts/${encoded}`
    : NATIVE_OKF_PUBLIC_ROUTES.library;
}

/** Readable alias used by sitemap and release-shell consumers. */
export const conceptPageHref = conceptRouteHref;

function duplicateSources(
  definitions: readonly { source: string }[],
  label: string,
): string[] {
  const seen = new Set<string>();
  const issues: string[] = [];
  for (const definition of definitions) {
    if (seen.has(definition.source)) {
      issues.push(`${label} defines ${definition.source} more than once.`);
    }
    seen.add(definition.source);
  }
  return issues;
}

function routePatternMatches(pattern: string, candidate: string): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);
  const candidateSegments = candidate.split("/").filter(Boolean);

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const candidateSegment = candidateSegments[index];
    if (patternSegment?.startsWith(":")) {
      if (patternSegment.endsWith("*")) {
        return true;
      }
      if (!candidateSegment) {
        return false;
      }
      continue;
    }
    if (patternSegment !== candidateSegment) {
      return false;
    }
  }

  return patternSegments.length === candidateSegments.length;
}

function representativeRoute(pattern: string): string {
  return pattern
    .split("/")
    .map((segment) =>
      segment.startsWith(":")
        ? segment.endsWith("*")
          ? "probe/path"
          : "probe"
        : segment,
    )
    .join("/");
}

function shadowingIssues(
  definitions: readonly { source: string }[],
  label: string,
): string[] {
  const issues: string[] = [];
  for (let earlier = 0; earlier < definitions.length; earlier += 1) {
    for (let later = earlier + 1; later < definitions.length; later += 1) {
      const earlierSource = definitions[earlier]?.source;
      const laterSource = definitions[later]?.source;
      if (
        earlierSource &&
        laterSource &&
        earlierSource !== laterSource &&
        routePatternMatches(earlierSource, representativeRoute(laterSource))
      ) {
        issues.push(`${label} ${earlierSource} shadows ${laterSource}.`);
      }
    }
  }
  return issues;
}


/**
 * Pure release-readiness validation for route definitions. An empty result is
 * success; callers decide whether to throw or format diagnostics.
 */
export function validateNativeOkfRouteIntegrity(): string[] {
  const issues = [
    ...duplicateSources(
      NATIVE_OKF_COMPATIBILITY_REDIRECTS,
      "Compatibility redirects",
    ),
    ...duplicateSources(LEGACY_PUBLIC_REDIRECTS, "Legacy redirects"),
    ...duplicateSources(
      NATIVE_OKF_CANONICAL_REWRITES,
      "Canonical rewrites",
    ),
    ...duplicateSources(
      LEGACY_UNAVAILABLE_REWRITES,
      "Unavailable-route rewrites",
    ),
    ...duplicateSources(
      LEGACY_API_BLOCK_REWRITES,
      "Legacy API block rewrites",
    ),
    ...shadowingIssues(
      [
        ...NATIVE_OKF_COMPATIBILITY_REDIRECTS,
        ...LEGACY_PUBLIC_REDIRECTS,
        ...LEGACY_UNAVAILABLE_REWRITES,
      ],
      "Route order",
    ),

  ];

  const redirects = [
    ...NATIVE_OKF_COMPATIBILITY_REDIRECTS,
    ...LEGACY_PUBLIC_REDIRECTS,
  ];
  for (const redirect of redirects) {
    if (redirect.source === redirect.destination) {
      issues.push(`Redirect ${redirect.source} targets itself.`);
    }
    if (redirect.destination.startsWith("/native-okf")) {
      issues.push(
        `Public redirect ${redirect.source} exposes native internal route ${redirect.destination}.`,
      );
    }
  }

  const canonicalRoutes = Object.values(NATIVE_OKF_PUBLIC_ROUTES);
  if (new Set(canonicalRoutes).size !== canonicalRoutes.length) {
    issues.push("Canonical public route values are not unique.");
  }

  for (const rewrite of NATIVE_OKF_CANONICAL_REWRITES) {
    if (!rewrite.destination.startsWith("/native-okf")) {
      issues.push(
        `Canonical rewrite ${rewrite.source} does not target the native implementation.`,
      );
    }
  }

  for (const rewrite of LEGACY_API_BLOCK_REWRITES) {
    if (rewrite.destination !== NATIVE_OKF_API_ROUTES.retired) {
      issues.push(
        `Legacy API guard ${rewrite.source} does not target the retired API response.`,
      );
    }
  }

  if (
    !NATIVE_OKF_NOINDEX_PATTERNS.includes(
      NATIVE_OKF_CONTROLLED_NOT_FOUND_ROUTE,
    )
  ) {
    issues.push("The controlled not-found route must be noindex.");
  }


  return issues;
}
