import type { MetadataRoute } from "next";

import { getAllConcepts } from "@/src/native-okf/server/repository";
import { getNativeOkfPublicOrigin } from "@/src/native-okf/server/public-origin";
import { CANONICAL_ROUTES, conceptPageHref } from "@/src/native-okf/shared/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getNativeOkfPublicOrigin();
  const concepts = await getAllConcepts();
  const paths = new Set<string>([
    CANONICAL_ROUTES.home,
    CANONICAL_ROUTES.library,
    CANONICAL_ROUTES.chat,
    CANONICAL_ROUTES.imprint,
    CANONICAL_ROUTES.privacy,
    ...concepts.map((concept) => conceptPageHref(concept.id)),
  ]);

  return [...paths]
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((path) => ({
      url: new URL(path, origin).toString(),
      changeFrequency: path === CANONICAL_ROUTES.home ? "weekly" : "monthly",
      priority: path === CANONICAL_ROUTES.home
        ? 1
        : path === CANONICAL_ROUTES.library
          ? 0.9
          : path.startsWith("/papers/")
            ? 0.8
            : 0.6,
    }));
}
