import { notFound } from "next/navigation";

import { WorkbenchView } from "@/src/native-okf/components/WorkbenchView";
import { getConceptWorkbenchViewModel } from "@/src/native-okf/server/workbench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NativeOkfConceptPage({
  params,
}: {
  params: Promise<{ conceptId: string[] }>;
}) {
  const { conceptId } = await params;
  let view;

  try {
    view = await getConceptWorkbenchViewModel(conceptId);
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) notFound();
    throw error;
  }

  if (!view) notFound();
  return <WorkbenchView view={view} />;
}
