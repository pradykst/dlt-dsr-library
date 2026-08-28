import type { Metadata } from "next";
import Link from "next/link";

import { ChatWorkbench } from "@/src/native-okf/components/chat/ChatWorkbench";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";
import { getNativeOkfGuidedStarterPapers } from "@/src/native-okf/server/guided-starters";
import { NATIVE_OKF_PUBLIC_ROUTES } from "@/src/native-okf/shared/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Ask source-linked questions across the DSR Knowledge Library.",
  alternates: { canonical: "/chat" },
};

export default async function NativeOkfChatPage() {
  const starterPapers = await getNativeOkfGuidedStarterPapers();
  return (
    <NativeOkfShell
      title="Chat with the design knowledge library"
      eyebrow=""
      description="Ask about papers and represented design knowledge, compare studies, or build an evidence-linked decision-support flow."
      breadcrumbs={[{ label: "Chat" }]}
      actions={
        <Link
          href={NATIVE_OKF_PUBLIC_ROUTES.library}
          className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-blue/40 hover:text-blue"
        >
          Browse papers
        </Link>
      }
    >
      <ChatWorkbench starterPapers={starterPapers} />
    </NativeOkfShell>
  );
}
