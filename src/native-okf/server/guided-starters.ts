import "server-only";

import {
  NATIVE_OKF_GUIDED_CATEGORY_LABELS,
  NATIVE_OKF_GUIDED_CATEGORY_TYPES,
  type NativeOkfGuidedCategoryType,
  type NativeOkfGuidedStarterPaper,
} from "../shared/guided-starters.ts";
import { getLibraryViewModel } from "./workbench.ts";

const guidedCategoryTypes = new Set<string>(
  NATIVE_OKF_GUIDED_CATEGORY_TYPES,
);

function isGuidedCategoryType(
  value: string,
): value is NativeOkfGuidedCategoryType {
  return guidedCategoryTypes.has(value);
}

export async function getNativeOkfGuidedStarterPapers(): Promise<
  NativeOkfGuidedStarterPaper[]
> {
  const library = await getLibraryViewModel();
  return library.papers
    .map((paper) => ({
      id: paper.id,
      title: paper.title,
      categories: paper.linkedTypeCounts.flatMap((category) =>
        isGuidedCategoryType(category.type)
          ? [{
              type: category.type,
              label: NATIVE_OKF_GUIDED_CATEGORY_LABELS[category.type],
            }]
          : [],
      ),
    }))
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title, "en") ||
        left.id.localeCompare(right.id, "en"),
    );
}
