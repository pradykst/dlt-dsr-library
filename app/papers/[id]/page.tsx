import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PaperLens } from "@/components/papers/PaperLens";
import { getPaperById, papers } from "@/lib/knowledge";

export function generateStaticParams() {
  return papers.map((paper) => ({ id: paper.id }));
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = getPaperById(id);
  if (!paper) notFound();
  return (
    <PageShell>
      <PaperLens paper={paper} />
    </PageShell>
  );
}
