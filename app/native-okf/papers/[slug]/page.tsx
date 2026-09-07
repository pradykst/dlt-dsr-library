import { notFound } from "next/navigation";

import { WorkbenchView } from "@/src/native-okf/components/WorkbenchView";
import { getNativeOkfScopePapers } from "@/src/native-okf/server/scope-papers";
import { getPaperWorkbenchViewModel } from "@/src/native-okf/server/workbench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NativeOkfPaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let view;

  try {
    view = await getPaperWorkbenchViewModel(slug);
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) notFound();
    throw error;
  }

  if (!view) notFound();
  const scopePapers = await getNativeOkfScopePapers();
  return <WorkbenchView view={view} scopePapers={scopePapers} />;
}
