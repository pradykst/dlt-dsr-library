"use client";

import { useEffect, useRef } from "react";
import { Bot, CheckCircle2, User } from "lucide-react";
import {
  artifactDirection,
  demoFlowNodes,
  demoPapers,
  recommendedFeatures,
  recommendedPrinciples,
  recommendedRequirements,
  searchStatuses,
  selectedOutputs
} from "@/components/chatbot-demo/demo-data";
import { DemoFlow } from "@/components/chatbot-demo/DemoFlow";

export function DemoChatPanel({ currentStep }: { currentStep: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [currentStep]);

  return (
    <section className="flex min-h-[720px] flex-col border border-line bg-white shadow-research">
      <div className="border-b border-line bg-paper px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Scripted assistant preview</div>
        <h2 className="mt-1 font-serif text-2xl text-ink">Demo Conversation</h2>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <UserMessage>
          I want to design a DLT-based system that helps marketplaces prevent inconsistent product identities and manipulated product descriptions. What design knowledge from prior DSR papers should I reuse?
        </UserMessage>

        {currentStep >= 1 && (
          <AssistantMessage>
            To guide you properly, what do you want to derive from the library?
            <div className="mt-3 flex flex-wrap gap-2">
              {["Requirements", "Objectives", "Design principles", "Features", "Artifact direction", "Evaluation ideas"].map((chip) => {
                const selected = currentStep >= 2 && selectedOutputs.includes(chip);
                return (
                  <span key={chip} className={selected ? "border border-blue bg-blue/10 px-2 py-1 text-xs font-medium text-ink" : "border border-line bg-white px-2 py-1 text-xs text-muted"}>
                    {selected && <CheckCircle2 className="mr-1 inline h-3 w-3 text-blue" />}
                    {chip}
                  </span>
                );
              })}
            </div>
          </AssistantMessage>
        )}

        {currentStep >= 2 && (
          <UserMessage compact>
            Requirements, design principles, features, and artifact direction.
          </UserMessage>
        )}

        {currentStep >= 2 && (
          <AssistantMessage>
            I will search reviewed paper-level grids and flows, then build a temporary global flow for this design problem. I will only recommend items that can be traced back to paper evidence.
          </AssistantMessage>
        )}

        {currentStep >= 3 && (
          <AssistantMessage>
            <div className="font-semibold text-ink">Searching structured paper flows</div>
            <div className="mt-3 space-y-2">
              {searchStatuses.map((status, index) => {
                const visible = index <= statusIndexForStep(currentStep);
                if (!visible) return null;
                const active = currentStep < 6 && index === statusIndexForStep(currentStep);
                return (
                  <div key={status} className="flex items-center gap-2 text-sm text-muted">
                    <span className={active ? "demo-scan-dot h-2 w-2 bg-blue" : "h-2 w-2 bg-green"} />
                    <span>{status}</span>
                    {active && <span className="demo-typing-dots text-blue">...</span>}
                  </div>
                );
              })}
            </div>
          </AssistantMessage>
        )}

        {currentStep >= 5 && (
          <AssistantMessage>
            I found reusable design knowledge around information manipulation, shared records, auditability, off-chain storage, hash anchoring, and evidence-linked review.
          </AssistantMessage>
        )}

        {currentStep >= 6 && <FinalAnswerCard />}
      </div>
    </section>
  );
}

function statusIndexForStep(step: number) {
  if (step <= 3) return 2;
  if (step === 4) return 4;
  return 5;
}

function UserMessage({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="ml-auto flex max-w-[92%] items-start gap-3 sm:max-w-[82%]">
      <div className={compact ? "border border-blue/20 bg-blue/5 px-3 py-2 text-sm leading-6 text-ink" : "border border-blue/20 bg-blue/5 px-4 py-3 text-sm leading-6 text-ink"}>
        {children}
      </div>
      <span className="grid h-8 w-8 shrink-0 place-items-center border border-blue/20 bg-white text-blue">
        <User className="h-4 w-4" />
      </span>
    </div>
  );
}

function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[94%] items-start gap-3 sm:max-w-[88%]">
      <span className="grid h-8 w-8 shrink-0 place-items-center border border-line bg-paper text-blue">
        <Bot className="h-4 w-4" />
      </span>
      <div className="demo-message-in border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink">
        {children}
      </div>
    </div>
  );
}

function FinalAnswerCard() {
  return (
    <AssistantMessage>
      <div className="space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Final recommendation</div>
          <h3 className="mt-2 font-serif text-2xl text-ink">Evidence-backed design guidance</h3>
        </div>

        <AnswerSection title="1. Interpreted design problem">
          <p className="text-sm leading-6 text-muted">
            You are designing a DLT-based information sharing system for marketplaces where product identity and product descriptions must remain consistent, verifiable, and resistant to manipulation.
          </p>
        </AnswerSection>

        <AnswerSection title="2. Recommended requirements">
          <CardGrid>{recommendedRequirements.map((item) => <Recommendation key={item.label} item={item} />)}</CardGrid>
        </AnswerSection>

        <AnswerSection title="3. Recommended design principles">
          <CardGrid>{recommendedPrinciples.map((item) => <Recommendation key={item.label} item={item} linkedLabel="Linked requirement" />)}</CardGrid>
        </AnswerSection>

        <AnswerSection title="4. Recommended features">
          <CardGrid>{recommendedFeatures.map((item) => <Recommendation key={item.label} item={item} linkedLabel="Linked principle" />)}</CardGrid>
        </AnswerSection>

        <AnswerSection title="5. Suggested artifact">
          <div className="border border-line bg-white p-4">
            <h4 className="font-serif text-xl text-ink">{artifactDirection.title}</h4>
            <p className="mt-2 text-sm leading-6 text-muted">{artifactDirection.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {artifactDirection.architecture.map((item) => (
                <div key={item} className="border border-line bg-paper px-3 py-2 text-sm text-ink">{item}</div>
              ))}
            </div>
          </div>
        </AnswerSection>

        <AnswerSection title="6. Temporary query-specific flow">
          <DemoFlow nodes={demoFlowNodes} compact />
        </AnswerSection>

        <AnswerSection title="7. Evidence and citations">
          <div className="grid gap-3">
            {demoPapers.slice(0, 4).map((paper) => (
              <div key={paper.code} className="border border-line bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CitationBadge code={paper.code} />
                  <span className="text-sm font-semibold text-ink">{paper.title}</span>
                </div>
                <div className="mt-2 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-3">
                  <span><strong className="text-ink">Matched element:</strong> {paper.matchedElement}</span>
                  <span><strong className="text-ink">Relation used:</strong> {paper.relationUsed}</span>
                  <span><strong className="text-ink">Evidence:</strong> {paper.evidenceSnippet}</span>
                </div>
              </div>
            ))}
          </div>
        </AnswerSection>
      </div>
    </AssistantMessage>
  );
}

function AnswerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function Recommendation({ item, linkedLabel = "Sources" }: {
  item: { label: string; body: string; linkedTo?: string; sources: string[]; evidence: string };
  linkedLabel?: string;
}) {
  return (
    <div className="border border-line bg-white p-3">
      <h5 className="text-sm font-semibold leading-5 text-ink">{item.label}</h5>
      <p className="mt-2 text-xs leading-5 text-muted">{item.body}</p>
      {item.linkedTo && <p className="mt-2 text-xs text-blue">{linkedLabel}: {item.linkedTo}</p>}
      <div className="mt-3 flex flex-wrap gap-1">
        {item.sources.map((source) => <CitationBadge key={source} code={source} />)}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{item.evidence}</p>
    </div>
  );
}

function CitationBadge({ code }: { code: string }) {
  return <span className="demo-citation-badge border border-blue/25 bg-blue/10 px-2 py-0.5 text-[11px] font-semibold text-blue">[{code}]</span>;
}
