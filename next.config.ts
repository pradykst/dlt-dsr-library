import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/native-okf": ["./knowledge/okf/**/*.md"],
    "/native-okf/**": ["./knowledge/okf/**/*.md"],
    "/api/native-okf/**": ["./knowledge/okf/**/*.md"],
  },
};

export default nextConfig;
