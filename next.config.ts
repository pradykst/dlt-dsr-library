import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/native-okf": ["./knowledge/okf/**/*.md"],
    "/native-okf/**": ["./knowledge/okf/**/*.md"],
  },
};

export default nextConfig;
