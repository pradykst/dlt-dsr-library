import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { OkfChatWorkspace } from "@/components/okf-chat/OkfChatWorkspace";

export const metadata: Metadata = {
  title: "DSR OKF Chat",
  description: "Decision-support chatbot backed by local DSR OKF knowledge."
};

export default function OkfChatPage() {
  return (
    <PageShell>
      <OkfChatWorkspace />
    </PageShell>
  );
}
