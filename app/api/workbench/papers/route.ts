import { getWorkbenchPapers } from "../../../../lib/okf/workbench-adapter.ts";
import { getOkfKnowledgeBaseLoadMetadata } from "../../../../lib/okf/retrieval.ts";

export async function GET() {
  try {
    const papers = await getWorkbenchPapers();
    const metadata = getOkfKnowledgeBaseLoadMetadata();
    return Response.json({
      ok: true,
      papers,
      runtime: {
        db_loaded_from: metadata.db_loaded_from,
        key_type: metadata.key_type,
        row_count: metadata.row_count
      }
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: "WORKBENCH_LOAD_FAILED",
      message: "Could not load canonical OKF papers.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
