import { validateOkfTextLibrary } from "../lib/okf/text-hygiene-validator.ts";

const result = validateOkfTextLibrary();

console.log("OKF text hygiene validation");
console.log(`Runtime papers: ${result.runtimePaperCount}`);
console.log(`Templates: ${result.templateCount}`);
console.log(`Files checked: ${result.checkedFileCount}`);
console.log(`Human-text fields inspected: ${result.inspectedFieldCount}`);
console.log(`Verbatim quotations preserved/skipped: ${result.verbatimQuoteCount}`);
console.log(`Findings: ${result.findings.length}`);

for (const finding of result.findings) {
  console.error(`- [${finding.code}] ${finding.file} :: ${finding.field}: ${finding.reason}`);
  if (finding.suggestedText && finding.suggestedText !== finding.priorText) console.error(`  Suggested: ${finding.suggestedText}`);
}

if (result.findings.length) process.exitCode = 1;
