import { PageShell } from "@/components/layout/PageShell";
import { DsrChatbot } from "@/components/rag-chatbot/DsrChatbot";

export default function DsrChatbotPage() {
  return (
    <PageShell>
      <DsrChatbot />
    </PageShell>
  );
}
