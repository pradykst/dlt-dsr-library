import type { Metadata } from "next";

import { ReleaseHomepage } from "@/src/native-okf/components/release/ReleaseHomepage";
import { buildReleaseHomeViewModel } from "@/src/native-okf/server/release-home";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "DSR Knowledge Library" },
  description:
    "A research prototype for exploring and reusing source-grounded design knowledge from Design Science Research publications.",
  alternates: { canonical: "/" },
};

export default async function ReleaseHomePage() {
  const viewModel = await buildReleaseHomeViewModel();
  return <ReleaseHomepage viewModel={viewModel} />;
}
