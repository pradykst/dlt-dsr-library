import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

import {
  LEGACY_PUBLIC_REDIRECTS,
  LEGACY_API_BLOCK_REWRITES,
  LEGACY_UNAVAILABLE_REWRITES,
  NATIVE_OKF_CANONICAL_REWRITES,
  NATIVE_OKF_COMPATIBILITY_REDIRECTS,
  NATIVE_OKF_NOINDEX_PATTERNS,
} from "./src/native-okf/shared/routes";

const tracedOkfBundle = ["./knowledge/okf/**/*.md"];
// Only non-sensitive build identity is embedded. Runtime model configuration stays server-only.
function buildCommit(): string {
  const supplied = process.env.NATIVE_OKF_BUILD_COMMIT?.trim();
  if (supplied && /^[a-f0-9]{40}$/u.test(supplied)) return supplied;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  env: {
    NATIVE_OKF_BUILD_COMMIT: buildCommit(),
    NATIVE_OKF_BUILD_TIMESTAMP: new Date().toISOString(),
  },
  outputFileTracingIncludes: {
    "/": tracedOkfBundle,
    "/library": tracedOkfBundle,
    "/chat": tracedOkfBundle,
    "/papers/**": tracedOkfBundle,
    "/concepts/**": tracedOkfBundle,
    "/sitemap.xml": tracedOkfBundle,
    "/native-okf": tracedOkfBundle,
    "/native-okf/**": tracedOkfBundle,
    "/api/native-okf/**": tracedOkfBundle,
  },
  async redirects() {
    return [
      ...NATIVE_OKF_COMPATIBILITY_REDIRECTS,
      ...LEGACY_PUBLIC_REDIRECTS,
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        ...LEGACY_API_BLOCK_REWRITES,
        ...NATIVE_OKF_CANONICAL_REWRITES,
        ...LEGACY_UNAVAILABLE_REWRITES,
      ],
    };
  },
  async headers() {
    return NATIVE_OKF_NOINDEX_PATTERNS.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

export default nextConfig;
