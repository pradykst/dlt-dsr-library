import fs from "node:fs";
import path from "node:path";
import { renderFlowValidationReport, validateOkfFlows } from "../lib/okf/flow-validation.ts";

const args = new Set(process.argv.slice(2));
const report = await validateOkfFlows();
const markdown = renderFlowValidationReport(report);

if (args.has("--json")) console.log(JSON.stringify(report, null, 2));
else console.log(markdown);

if (args.has("--write")) {
  const reportFile = path.join(process.cwd(), "docs", "FLOW_VALIDATION_REPORT.md");
  fs.writeFileSync(reportFile, markdown, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), reportFile).replace(/\\/g, "/")}`);
}

if (report.summary.errors > 0) process.exitCode = 1;