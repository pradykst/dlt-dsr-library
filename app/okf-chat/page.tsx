import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { OkfChatWorkspace } from "@/components/okf-chat/OkfChatWorkspace";

export const metadata: Metadata = {
  title: "DSR OKF Decision Assistant",
  description: "Evidence-grounded design knowledge reuse across curated DSR papers."
};

export default function OkfChatPage() {
  return (
    <PageShell>
      <OkfChatWorkspace />
    </PageShell>
  );
}
