import Link from "next/link";
import { ArrowRight, GitBranch, Library } from "lucide-react";
import { MiniFlowStrip } from "@/components/visuals/MiniFlowStrip";

export function Hero() {
  return (
    <section className="research-grid border border-line bg-white px-5 py-8 shadow-research sm:px-8 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 border border-line bg-paper px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted">
            <Library className="h-3.5 w-3.5" />
            Version 1 research demo
          </div>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
            DLT Design Science Knowledge Library
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            A visual knowledge base for blockchain and DLT design research, tracing how problem contexts become requirements, principles, features, artifacts, evaluations, and reusable patterns.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/explore" className="inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue">
              Explore design knowledge <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/flow-builder" className="inline-flex items-center gap-2 border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-blue">
              Build a design path <GitBranch className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="border border-line bg-paper/80 p-4">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-muted">
            <span>Design-science chain</span>
            <span>Synthesized from papers</span>
          </div>
          <MiniFlowStrip />
        </div>
      </div>
    </section>
  );
}
