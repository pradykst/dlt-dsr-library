"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initMixpanel, updateSessionRecordingForRoute } from "@/lib/mixpanel";
import { trackPageView } from "@/utils/analytics";

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    updateSessionRecordingForRoute(pathname);
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
