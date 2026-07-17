import type { Metadata } from "next";
import Link from "next/link";

import { ChatWorkbench } from "@/src/native-okf/components/chat/ChatWorkbench";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";
import { NATIVE_OKF_ROOT } from "@/src/native-okf/shared/links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Grounded chat",
  description:
    "Ask grounded questions across the isolated native Open Knowledge Format library.",
};

export default function NativeOkfChatPage() {
  return (
    <NativeOkfShell
      title="Research library chat"
      eyebrow="Native OKF grounded assistant"
      description="Ask questions across the canonical papers and design-knowledge concepts. Local retrieval selects the context; generated answers cite only validated native OKF sources."
      breadcrumbs={[{ label: "Chat" }]}
      actions={
        <Link
          href={NATIVE_OKF_ROOT}
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-blue/40 hover:text-blue"
        >
          Browse papers
        </Link>
      }
    >
      <ChatWorkbench />
    </NativeOkfShell>
  );
}
