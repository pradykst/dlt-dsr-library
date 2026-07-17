import "server-only";

import {
  formatOkfValidationReport,
  validateOkfBundle,
} from "./validation.ts";

async function main(): Promise<void> {
  const report = await validateOkfBundle();
  console.log(formatOkfValidationReport(report));

  for (const warning of report.warnings) {
    console.warn(`Warning [${warning.code}]: ${warning.message}`);
  }
  for (const error of report.fatalErrors) {
    console.error(`Fatal [${error.code}]: ${error.message}`);
  }

  if (report.fatalValidationErrorCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Native OKF validation failed: ${message}`);
  process.exitCode = 1;
});
