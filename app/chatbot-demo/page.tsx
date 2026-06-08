import type { Metadata } from "next";
import { ChatbotDemo } from "@/components/chatbot-demo/ChatbotDemo";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Chatbot Demo",
  description: "A scripted preview of the planned interactive design knowledge assistant."
};

export default function ChatbotDemoPage() {
  return (
    <PageShell>
      <ChatbotDemo />
    </PageShell>
  );
}
