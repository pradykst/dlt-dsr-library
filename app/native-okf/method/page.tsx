import type { Metadata } from "next";

import { ReleaseMethod } from "@/src/native-okf/components/release/ReleaseMethod";

export const metadata: Metadata = {
  title: "Method and limitations",
  description:
    "How the DSR Knowledge Library represents, retrieves, validates, and presents source-grounded design knowledge.",
  alternates: { canonical: "/method" },
};

export default function MethodPage() {
  return <ReleaseMethod />;
}
