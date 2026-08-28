import Link from "next/link";
import { ArrowRight, Bot, GitBranch, Library } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/layout/PageShell";
import { MiniFlowStrip } from "@/components/visuals/MiniFlowStrip";

const features = [
  {
    title: "Paper-level design knowledge grids",
    description: "Inspect canonical OKF paper data across requirements, principles, features, artifacts, evaluations, and evidence."
  },
  {
    title: "Evidence-backed flows",
    description: "Trace how design knowledge moves from problem statements to artifact features and evaluation outcomes."
  },
  {
    title: "Reviewer correction workflow",
    description: "Report issues for Git-based review so canonical OKF changes remain traceable and are re-indexed deliberately."
  },
  {
    title: "Pattern exploration",
    description: "Compare recurring DLT design patterns across papers and identify reusable knowledge for future DSR projects."
  }
];

export default function HomePage() {
  return (
    <PageShell className="space-y-8 sm:space-y-10">
      <section className="research-grid border border-line bg-white px-5 py-8 shadow-research sm:px-8 lg:px-10">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <Badge>Research prototype</Badge>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
              DLT Design Knowledge Library
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              A structured library for reusing design knowledge from distributed ledger technology research.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base">
              The library transforms DSR papers into reviewable design knowledge grids and flow representations, connecting problems, requirements, design principles, features, artifacts, evaluations, and evidence. It helps researchers compare prior DLT instantiations and reuse supported design knowledge for new research projects.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/explore" className="inline-flex items-center justify-center gap-2 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue">
                Explore Library <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/workbench" className="inline-flex items-center justify-center gap-2 border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-blue">
                Open Workbench <GitBranch className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <Card className="min-w-0 bg-paper/80 p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-1 text-xs uppercase tracking-[0.12em] text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>Structured DSR chain</span>
              <span>Linked to papers</span>
            </div>
            <MiniFlowStrip />
          </Card>
        </div>
      </section>

      <Link href="/chatbot-demo" className="block relative border border-blue/40 bg-gradient-to-r from-blue/10 via-white to-white p-5 shadow-[0_0_20px_rgba(59,130,246,0.15)] transition hover:border-blue hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-blue/20 bg-blue/5 text-blue">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Upcoming assistant preview</div>
              <h2 className="mt-1 font-serif text-2xl text-ink">Preview Research Assistant</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                See how a future assistant will retrieve from paper-level flows, ask clarifying questions, and build a query-specific mini-flow with cited design guidance.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue">
            Open scripted demo <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Library className="h-4 w-4 text-blue" />
          <h2 className="font-serif text-2xl text-ink">What Users Can Do</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-5">
              <h3 className="font-serif text-xl leading-tight text-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
