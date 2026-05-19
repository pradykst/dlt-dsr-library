import { ArrowRight } from "lucide-react";

const steps = ["Problem Context", "Requirements", "Principles", "Features", "Artifact", "Evaluation", "Pattern"];

export function MiniFlowStrip() {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[760px] items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div className="min-h-16 flex-1 border border-line bg-white px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Stage {index + 1}</div>
              <div className="mt-1 text-sm font-medium text-ink">{step}</div>
            </div>
            {index < steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted" />}
          </div>
        ))}
      </div>
    </div>
  );
}
