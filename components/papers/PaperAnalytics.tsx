"use client";

import { useEffect } from "react";
import { trackPaperOpened } from "@/utils/analytics";

export function PaperAnalytics({ paperId, title }: { paperId: string; title?: string }) {
  useEffect(() => {
    trackPaperOpened(paperId, title);
  }, [paperId, title]);

  return null;
}
