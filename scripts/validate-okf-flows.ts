import fs from "node:fs";
import path from "node:path";
import { knowledgeEdges, knowledgeNodes } from "../data/knowledge-base.ts";
import { renderFlowValidationReport, validateOkfFlows, type LegacyFlowComparisonSource } from "../lib/okf/flow-validation.ts";

const args = new Set(process.argv.slice(2));
const legacyComparison: LegacyFlowComparisonSource = {
  paperIds: {
    BLOCKCHAIN_IOT_SDPS_2019: "paper-iot-sdps",
    HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023: "paper-consent-hie",
    NIL_NFT_MARKETPLACE_2026: "paper-nil-marketplace",
    PEER_REVIEW_TOKEN_INCENTIVES_2025: "paper-peer-review-token",
    SHORT_END_STICK_2025: "paper-opportunism",
    SSI_KYC_FRAMEWORK_2022: "paper-ssi-kyc",
    TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024: "paper-trust-capacity"
  },
  nodes: knowledgeNodes,
  edges: knowledgeEdges
};
const report = await validateOkfFlows({ legacyComparison });
const markdown = renderFlowValidationReport(report);

if (args.has("--json")) console.log(JSON.stringify(report, null, 2));
else console.log(markdown);

if (args.has("--write")) {
  const reportFile = path.join(process.cwd(), "docs", "FLOW_VALIDATION_REPORT.md");
  fs.writeFileSync(reportFile, markdown, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), reportFile).replace(/\\/g, "/")}`);
}

if (report.summary.errors > 0) process.exitCode = 1;