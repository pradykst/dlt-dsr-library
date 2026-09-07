import "server-only";

import type { NativeOkfScopePaper } from "../shared/paper-scope.ts";
import { compareDisplayStrings } from "../shared/presentation.ts";
import { getLibraryViewModel } from "./workbench.ts";

/**
 * The canonical paper list backing the chat scope selector, `@` reference, and
 * `/paper` command. The count is always derived from the repository — never
 * hard-coded.
 */
export async function getNativeOkfScopePapers(): Promise<NativeOkfScopePaper[]> {
  const library = await getLibraryViewModel();
  return library.papers
    .map((paper) => ({
      paperId: paper.id.replace(/^papers\//u, ""),
      title: paper.title,
      authors: [...paper.authors],
    }))
    .sort(
      (left, right) =>
        compareDisplayStrings(left.title, right.title) ||
        compareDisplayStrings(left.paperId, right.paperId),
    );
}
