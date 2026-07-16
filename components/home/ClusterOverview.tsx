import { Card } from "@/components/ui/Card";

const clusters = [
  ["Trust and exchange", "Capacity exchange and opportunism problems where traceability and joint rules reduce uncertainty."],
  ["Privacy and auditability", "Designs that preserve sensitive data while keeping state changes verifiable."],
  ["Tokenized incentives", "Token mechanisms for reviewer effort, recognition, and marketplace participation."],
  ["Fair marketplaces", "Allocation designs that combine inclusive primary access and merit-sensitive secondary markets."],
  ["IoT data integrity", "Sensor-origin integrity controls, hash anchoring, and linearly scalable protection."],
  ["Identity and consent", "SSI, reusable credentials, and patient-controlled consent across organizations."],
  ["Development lifecycle", "Method fragments, roles, modeling, and governance checkpoints for blockchain systems."]
];

export function ClusterOverview() {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-serif text-2xl text-ink">Problem Clusters</h2>
        <span className="text-xs uppercase tracking-[0.12em] text-muted">Research map</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {clusters.map(([title, description]) => (
          <Card key={title} className="p-4 transition hover:border-blue">
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
