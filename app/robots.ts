import type { MetadataRoute } from "next";

import { getNativeOkfPublicOrigin } from "@/src/native-okf/server/public-origin";

export default function robots(): MetadataRoute.Robots {
  const origin = getNativeOkfPublicOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/library", "/chat", "/access", "/method", "/papers/", "/concepts/"],
      disallow: [
        "/admin",
        "/api/",
        "/native-okf",
        "/route-unavailable",
        "/okf-chat",
        "/chatbot-demo",
        "/workbench",
        "/flow-builder",
        "/ingest",
        "/desrist-evaluation",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
