import type { Metadata } from "next";
import Link from "next/link";
import { NativeOkfShell } from "@/src/native-okf/components/NativeOkfShell";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <NativeOkfShell title="Privacy" eyebrow="Legal" breadcrumbs={[{ label: "Privacy" }]}>
    <div className="max-w-3xl space-y-8 text-sm leading-7 text-ink [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_a]:break-words [&_a]:text-blue [&_a]:underline">
      <section>
        <h2>Controller and contact</h2>
        <p>Project contact: Max Gräser, <a href="mailto:max.graeser@uni-leipzig.de">max.graeser@uni-leipzig.de</a>, telephone <a href="tel:+493419733605">+49 341 97 33605</a>. Full institutional and project contact details are in the <Link href="/imprint">Imprint</Link>.</p>
        <p className="mt-3">The University’s data protection officer can be contacted through the <a href="https://www.uni-leipzig.de/datenschutz" target="_blank" rel="noopener noreferrer">official University privacy and data protection contact page</a>.</p>
      </section>
      <section>
        <h2>Browsing, cookies and analytics</h2>
        <p>The public library and chat do not require an account. This application does not set authentication or tracking cookies, and does not load analytics or advertising trackers on these pages. The chat uses browser session storage as described below. Publication, GitHub and evaluation-survey links take you to external services whose privacy notices apply when you visit them.</p>
      </section>
      <section>
        <h2>Conversation storage in your browser</h2>
        <p>The main chat keeps a bounded conversation, selected papers, diagram preference and conversation state in session storage for the current browser tab. This supports page reloads and returning to the chat within that tab. New Chat clears the saved conversation. Closing the tab normally ends the session; browser session-restore features can restore it. You can also clear the site’s browser data. The paper-page drawer keeps a separate tab-session conversation for each paper, so reopening it can restore that paper’s chat. New Chat clears the current chat; clearing site data removes the saved chats for this site.</p>
        <p className="mt-3">The application does not persist public chat questions, answers or diagrams in a server-side chat-history database. It does not write these conversations to Supabase or another application database. This does not mean that requests are unprocessed or that infrastructure and model-provider logs do not exist.</p>
      </section>
      <section>
        <h2>What is sent when you ask a question</h2>
        <p>Submitting a chat question sends the question, a bounded recent conversation history, selected paper IDs, diagram preference and conversation state to this site’s server. Conversation state can include the current design problem, a previous proposed diagram and source references. The server retrieves the permitted library evidence and validates sources and diagrams before returning a response.</p>
        <p className="mt-3">For generated answers and proposals, the server sends the question, relevant recent history or proposal state, retrieved paper and concept content, and response instructions to OpenAI through its API. Clarifications and requests that the server can reject without generation may not require a model call. Please avoid entering confidential information or personal data that is unnecessary for your research question.</p>
      </section>
      <section>
        <h2>Model and moderation processing</h2>
        <p>OpenAI processes the submitted content to generate answers and diagrams. The application requests that Responses API results are not stored for later retrieval by setting store to false. That setting does not disable all provider processing or abuse-monitoring retention. Provider retention, processing locations and transfer arrangements depend on the service agreement and account configuration; this application does not claim zero provider retention.</p>
        <p className="mt-3">When moderation is enabled by the service operator, submitted conversation content and generated answers or diagrams are also sent to OpenAI’s moderation API for safety checks. Moderation is configurable and is not a local-only check. See <a href="https://platform.openai.com/docs/guides/your-data" target="_blank" rel="noopener noreferrer">OpenAI’s API data controls</a> for provider processing information. Contact the project for the arrangements applicable to this service.</p>
      </section>
      <section>
        <h2>Operational and infrastructure logs</h2>
        <p>The chat server records timestamps, generated request IDs, success or error status, HTTP status and request duration. Error entries may contain diagnostic codes and upstream HTTP status. These application outcome logs exclude question text, answer text and retrieved source content. Validation failures can additionally log technical diagnostic codes.</p>
        <p className="mt-3">The hosting and network infrastructure processes connection and request information to deliver and protect the service, and may retain access or security logs, including IP addresses and requested URLs. Log retention and access are controlled by the deployment operator and hosting configuration, not by browser session storage. Contact the project for the applicable retention periods and infrastructure arrangements.</p>
      </section>
      <section>
        <h2>Your privacy requests</h2>
        <p>Contact the project or the University’s data protection officer to request information about processing, access, correction, erasure or restriction, or to exercise applicable objection and data-portability rights. You may also lodge a complaint with the competent data protection supervisory authority. Clearing a browser conversation does not erase copies already processed by infrastructure or model providers; the project contact can help with requests concerning those services.</p>
      </section>
    </div>
  </NativeOkfShell>;
}
