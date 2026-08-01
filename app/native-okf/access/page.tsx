import type { Metadata } from "next";

import { AccessPortal } from "@/src/native-okf/components/access/AccessPortal";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat access",
  description:
    "Enter an evaluation access code for the design knowledge assistant.",
  alternates: { canonical: "/access" },
};

export default function NativeOkfAccessPage() {
  return (
    <NativeOkfShell
      title="Chat access"
      eyebrow=""
      description="Enter your evaluation access code to use the design knowledge assistant."
      breadcrumbs={[{ label: "Chat access" }]}
    >
      <AccessPortal />
    </NativeOkfShell>
  );
}

