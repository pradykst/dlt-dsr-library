import type { Metadata } from "next";

import { AccessPortal } from "@/src/native-okf/components/access/AccessPortal";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research access",
  description:
    "Enter a private evaluation code for the source-grounded DSR research assistant.",
  alternates: { canonical: "/access" },
};

export default function NativeOkfAccessPage() {
  return (
    <NativeOkfShell
      title="Research access"
      eyebrow="Limited native OKF evaluation"
      description="Paid grounded chat is available only to authenticated evaluators and remains subject to application-owned quotas and budget controls."
      breadcrumbs={[{ label: "Research access" }]}
    >
      <AccessPortal />
    </NativeOkfShell>
  );
}

