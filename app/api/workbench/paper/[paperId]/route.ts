import { getWorkbenchPaper, getWorkbenchPapers } from "../../../../../lib/okf/workbench-adapter.ts";

export async function GET(_request: Request, context: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await context.params;
  try {
    const bundle = await getWorkbenchPaper(paperId);
    if (!bundle) {
      const papers = await getWorkbenchPapers();
      return Response.json({
        ok: false,
        error: "PAPER_NOT_FOUND",
        paperId,
        availablePapers: papers.map((paper) => ({
          paper_id: paper.paper_id,
          slug: paper.slug,
          title: paper.short_title
        }))
      }, { status: 404 });
    }
    return Response.json(bundle);
  } catch (error) {
    return Response.json({
      ok: false,
      error: "WORKBENCH_LOAD_FAILED",
      paperId,
      message: "Could not load canonical OKF Workbench data.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
