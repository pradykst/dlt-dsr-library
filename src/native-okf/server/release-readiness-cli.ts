import "server-only";

import {
  formatReleaseReadinessReport,
  runNativeOkfReleaseReadiness,
} from "./release-readiness.ts";

async function main(): Promise<void> {
  const report = await runNativeOkfReleaseReadiness();
  console.log(formatReleaseReadinessReport(report));
  if (!report.ready) process.exitCode = 1;
}

main().catch((error: unknown) => {
  void error;
  console.error("Native OKF release readiness could not complete.");
  process.exitCode = 1;
});
