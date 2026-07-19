export function ReleaseSemanticMotif() {
  return (
    <figure
      className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-7"
      aria-labelledby="release-motif-caption"
    >
      <figcaption
        id="release-motif-caption"
        className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
      >
        Illustrative design-knowledge structure
      </figcaption>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <MotifNode
          caption="Requirements"
          title="What the design must address"
          className="border-violet-200 bg-violet-50 text-violet-950"
        />
        <MotifArrow />
        <MotifNode
          caption="Principles"
          title="How reusable knowledge guides action"
          className="border-emerald-200 bg-emerald-50 text-emerald-950"
        />
        <MotifArrow />
        <MotifNode
          caption="Features"
          title="How principles become concrete"
          className="border-amber-200 bg-amber-50 text-amber-950"
        />
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">
        A visual motif, not a stored result from any individual paper.
      </p>
    </figure>
  );
}

function MotifNode({
  caption,
  title,
  className,
}: {
  caption: string;
  title: string;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] opacity-70">
        {caption}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5">{title}</p>
    </div>
  );
}

function MotifArrow() {
  return (
    <span
      aria-hidden="true"
      className="justify-self-center text-xl font-semibold text-slate-400 max-sm:rotate-90"
    >
      →
    </span>
  );
}
