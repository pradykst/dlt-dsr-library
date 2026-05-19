import Link from "next/link";
import { patterns } from "@/lib/knowledge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function FeaturedPatterns() {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-serif text-2xl text-ink">Featured Reusable Patterns</h2>
        <Link href="/patterns" className="text-sm font-medium text-blue hover:underline">View all patterns</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {patterns.slice(0, 3).map((pattern) => (
          <Card key={pattern.id} className="p-5">
            <Badge>Synthesized from paper</Badge>
            <h3 className="mt-4 text-base font-semibold text-ink">{pattern.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{pattern.summary}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
