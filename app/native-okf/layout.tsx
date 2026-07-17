import type { Metadata } from "next";
import "reactflow/dist/style.css";

import { NativeOkfRouteShell } from "@/src/native-okf/components/NativeOkfRouteShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Native OKF Library",
    template: "%s · Native OKF Library",
  },
  description: "The isolated native Open Knowledge Format Workbench.",
};

export default function NativeOkfLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <NativeOkfRouteShell>{children}</NativeOkfRouteShell>;
}
