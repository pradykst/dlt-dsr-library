import type { ReactNode } from "react";

/** Backwards-compatible transparent wrapper retained for native route imports. */
export function NativeOkfRouteShell({ children }: { children: ReactNode }) {
  return children;
}
