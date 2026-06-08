import { AlertTriangle } from "lucide-react";

export function DataDisclaimer() {
  return (
    <div className="mt-4 inline-flex max-w-3xl items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 shadow-[0_0_22px_rgba(251,146,60,0.22)]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
      <p>
        Limited, moderately accurate seeded data. This previews how the flow may look after peer review; it is not a finalized evidence base.
      </p>
    </div>
  );
}
