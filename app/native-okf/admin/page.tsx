import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/src/native-okf/components/admin/AdminDashboard";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";
import { readNativeOkfAccessRuntimeConfig } from "@/src/native-okf/server/access/runtime";
import {
  NATIVE_OKF_ADMIN_COOKIE,
  verifyAdminSessionCookie,
} from "@/src/native-okf/server/access/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evaluation administration",
  description: "Private aggregate controls for the native OKF evaluation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function NativeOkfAdminPage() {
  let config: ReturnType<typeof readNativeOkfAccessRuntimeConfig>;
  try {
    config = readNativeOkfAccessRuntimeConfig();
  } catch {
    redirect("/native-okf/admin/access");
  }

  if (!config.adminConfigured || !config.adminSessionSecret) {
    redirect("/native-okf/admin/access");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(NATIVE_OKF_ADMIN_COOKIE)?.value;
  let authenticated = false;
  try {
    authenticated = verifyAdminSessionCookie(
      token ? `${NATIVE_OKF_ADMIN_COOKIE}=${token}` : null,
      config.adminSessionSecret,
    ).valid;
  } catch {
    authenticated = false;
  }

  if (!authenticated) {
    redirect("/native-okf/admin/access");
  }

  return (
    <NativeOkfShell
      title="Evaluation administration"
      eyebrow="Private native OKF operations"
      description="Review safe aggregate usage and control limited researcher invitations. Research content and credentials are intentionally excluded."
      breadcrumbs={[{ label: "Evaluation administration" }]}
    >
      <AdminDashboard />
    </NativeOkfShell>
  );
}

