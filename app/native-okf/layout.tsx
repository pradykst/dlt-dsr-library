import type { Metadata } from "next";
import "reactflow/dist/style.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "DSR Knowledge Library",
    template: "%s · DSR Knowledge Library",
  },
  description:
    "A research prototype for exploring and reusing source-linked design knowledge from Design Science Research publications.",
};

export default function NativeOkfLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
