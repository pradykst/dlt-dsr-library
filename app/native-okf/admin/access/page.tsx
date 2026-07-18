import type { Metadata } from "next";

import { AdminAccessPortal } from "@/src/native-okf/components/admin/AdminAccessPortal";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administrator access",
  description: "Private access to native OKF evaluation controls.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function NativeOkfAdminAccessPage() {
  return (
    <NativeOkfShell
      title="Administrator access"
      eyebrow="Private native OKF operations"
      description="Authenticate to review aggregate usage, budgets, reservations, and invitations without exposing research content or credentials."
      breadcrumbs={[{ label: "Administrator access" }]}
    >
      <AdminAccessPortal />
    </NativeOkfShell>
  );
}

