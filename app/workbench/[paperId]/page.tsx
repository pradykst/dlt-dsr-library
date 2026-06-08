import { PageShell } from "@/components/layout/PageShell";
import { WorkbenchPaper } from "@/components/workbench/WorkbenchPaper";

export default async function WorkbenchPaperPage({ params }: any) {
  const { paperId } = await params;
  return (
    <PageShell>
      <WorkbenchPaper paperId={paperId} />
    </PageShell>
  );
}
