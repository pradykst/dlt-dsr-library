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
import { NATIVE_OKF_PUBLIC_ROUTES } from "@/src/native-okf/shared/routes";

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
    redirect(NATIVE_OKF_PUBLIC_ROUTES.adminAccess);
  }

  if (!config.adminConfigured || !config.adminSessionSecret) {
    redirect(NATIVE_OKF_PUBLIC_ROUTES.adminAccess);
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
    redirect(NATIVE_OKF_PUBLIC_ROUTES.adminAccess);
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

