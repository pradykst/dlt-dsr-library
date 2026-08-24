import type { NextConfig } from "next";

import {
  LEGACY_PUBLIC_REDIRECTS,
  LEGACY_API_BLOCK_REWRITES,
  LEGACY_UNAVAILABLE_REWRITES,
  NATIVE_OKF_CANONICAL_REWRITES,
  NATIVE_OKF_COMPATIBILITY_REDIRECTS,
  NATIVE_OKF_NOINDEX_PATTERNS,
} from "./src/native-okf/shared/routes";

const tracedOkfBundle = ["./knowledge/okf/**/*.md"];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": tracedOkfBundle,
    "/library": tracedOkfBundle,
    "/chat": tracedOkfBundle,
    "/method": tracedOkfBundle,
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
