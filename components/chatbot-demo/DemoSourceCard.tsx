import Link from "next/link";
import type { DemoPaper } from "@/components/chatbot-demo/demo-data";

export function DemoSourceCard({ paper, active }: { paper: DemoPaper; active?: boolean }) {
  const content = (
    <div className={active ? "border border-blue bg-blue/5 p-3 transition" : "border border-line bg-paper p-3 transition"}>
      <div className="flex items-start justify-between gap-3">
        <span className="border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-blue">{paper.code}</span>
        {active && <span className="demo-scan-dot mt-1 h-2 w-2 shrink-0 bg-blue" />}
      </div>
      <h3 className="mt-2 text-sm font-semibold leading-5 text-ink">{paper.title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted">{paper.matchedElement}</p>
    </div>
  );

  if (!paper.href) return content;
  return (
    <Link href={paper.href} className="block hover:border-blue">
      {content}
    </Link>
  );
}
