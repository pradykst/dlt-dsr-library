const stats = [
  ["8", "papers"],
  ["9", "reusable patterns"],
  ["13", "DLT capabilities"],
  ["18+", "requirements"],
  ["20+", "design principles"],
  ["20+", "design features"]
];

export function ResearchStats() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {stats.map(([value, label]) => (
        <div key={label} className="border border-line bg-white p-4">
          <div className="font-serif text-3xl text-ink">{value}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{label}</div>
        </div>
      ))}
    </section>
  );
}
