import { CheckCircle2, GitBranch, Search } from "lucide-react";
import {
  demoFlowNodes,
  demoPapers,
  demoSteps,
  qualityCriteria,
  retrievedElements,
  selectedOutputs
} from "@/components/chatbot-demo/demo-data";
import { DemoFlow } from "@/components/chatbot-demo/DemoFlow";
import { DemoSourceCard } from "@/components/chatbot-demo/DemoSourceCard";

export function DemoReasoningPanel({ currentStep }: { currentStep: number }) {
  return (
    <aside className="space-y-4">
      <section className="border border-line bg-white p-5 shadow-research">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Current stage</div>
            <h2 className="mt-2 font-serif text-2xl text-ink">{demoSteps[currentStep]}</h2>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-blue/20 bg-blue/5 text-blue">
            {currentStep < 3 ? <Search className="h-4 w-4" /> : <GitBranch className="h-4 w-4" />}
          </span>
        </div>
        <div className="mt-4">
          <StageContent currentStep={currentStep} />
        </div>
      </section>

      <section className="border border-line bg-white p-5 shadow-research">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Source papers being searched</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {demoPapers.map((paper, index) => <DemoSourceCard key={paper.code} paper={paper} active={currentStep >= 2 && index <= Math.min(demoPapers.length - 1, currentStep + 1)} />)}
        </div>
      </section>

      <section className="border border-line bg-white p-5 shadow-research">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Retrieved design knowledge elements</div>
        <div className="mt-3 space-y-3">
          <ElementGroup title="Requirements" items={retrievedElements.requirements} active={currentStep >= 3} />
          <ElementGroup title="Design principles" items={retrievedElements.principles} active={currentStep >= 4} />
          <ElementGroup title="Features" items={retrievedElements.features} active={currentStep >= 4} />
        </div>
      </section>

      <section className="border border-line bg-white p-5 shadow-research">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Temporary mini-flow</div>
        <div className="mt-3">
          <DemoFlow nodes={demoFlowNodes} visibleCount={currentStep >= 6 ? demoFlowNodes.length : Math.min(demoFlowNodes.length, currentStep + 1)} compact />
        </div>
      </section>

      <section className="border border-line bg-white p-5 shadow-research">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Evaluation criteria</div>
        <div className="mt-3 grid gap-3">
          {qualityCriteria.map((criterion, index) => {
            const active = currentStep >= 5 || index <= currentStep - 3;
            return (
              <div key={criterion.label} className={active ? "border border-green/30 bg-green/5 p-3" : "border border-line bg-paper p-3 opacity-60"}>
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {active && <CheckCircle2 className="h-4 w-4 text-green" />}
                  {criterion.label}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{criterion.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function StageContent({ currentStep }: { currentStep: number }) {
  if (currentStep === 0) {
    return (
      <dl className="grid gap-3 text-sm">
        <StageRow label="Detected domain" value="Marketplace data consistency" />
        <StageRow label="Detected DLT problem type" value="Multi-party trust and information manipulation" />
        <StageRow label="Likely output requested" value="Design guidance" />
      </dl>
    );
  }

  if (currentStep === 1) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedOutputs.map((chip) => <span key={chip} className="border border-blue/25 bg-blue/10 px-2 py-1 text-xs font-medium text-ink">{chip}</span>)}
      </div>
    );
  }

  if (currentStep === 2) {
    return <ScanningNote text="Scanning reviewed paper-level grids and flows for related requirements, principles, features, artifacts, and evidence." />;
  }

  if (currentStep === 3) {
    return (
      <div className="grid gap-2">
        {["Problem -> Requirement", "Requirement -> Principle", "Principle -> Feature", "Feature -> Artifact"].map((edge) => (
          <div key={edge} className="border border-line bg-paper px-3 py-2 text-sm text-ink">{edge}</div>
        ))}
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="flex flex-wrap gap-2">
        {retrievedElements.groupedConcepts.map((concept) => <span key={concept} className="border border-line bg-paper px-2 py-1 text-xs text-ink">{concept}</span>)}
      </div>
    );
  }

  if (currentStep === 5) {
    return <ScanningNote text="Checking whether the answer is comprehensive, generalizable, and grounded in evidence-backed relations." />;
  }

  return <ScanningNote text="Final design direction ready: DLT-backed Product Identity Registry with evidence-backed dispute review." complete />;
}

function StageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-paper p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-5 text-ink">{value}</dd>
    </div>
  );
}

function ScanningNote({ text, complete }: { text: string; complete?: boolean }) {
  return (
    <div className="flex items-start gap-3 border border-line bg-paper p-3 text-sm leading-6 text-muted">
      <span className={complete ? "mt-2 h-2 w-2 shrink-0 bg-green" : "demo-scan-dot mt-2 h-2 w-2 shrink-0 bg-blue"} />
      <span>{text}</span>
    </div>
  );
}

function ElementGroup({ title, items, active }: { title: string; items: string[]; active: boolean }) {
  return (
    <div className={active ? "opacity-100 transition" : "opacity-45 transition"}>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="border border-line bg-paper px-2 py-1 text-xs leading-5 text-ink">{item}</span>)}
      </div>
    </div>
  );
}
