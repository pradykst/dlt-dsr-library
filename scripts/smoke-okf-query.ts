const query = "I want to design a cross-marketplace product identity and review-continuity protocol where the same exact product variant can be listed on multiple marketplaces, sellers can relist products, buyers can leave verified-purchase reviews, and competitors should not expose raw commercial data. Which reusable DSR design requirements, design principles, design features, and artifact patterns should I reuse from the OKF library? Build a concise Requirement -> Principle -> Feature -> Artifact flow, explain which papers support each part, show evidence, and clearly mark any product-identity-specific suggestions as query-generated.";

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/okf/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query })
});
if (!response.ok) throw new Error(`Expected status 200, got ${response.status}`);
const payload = await response.json();
const rows = payload.flow_rows ?? payload.answer_payload?.flow_rows ?? [];
const evidence = payload.evidence ?? [];
const text = JSON.stringify(payload);
const checks = [
  [payload.source_papers?.length >= 5, "at least 5 source papers"],
  [rows.length >= 6, "at least 6 flow rows"],
  [evidence.length >= 10, "at least 10 evidence refs"],
  [/query-generated|query_generated/i.test(text), "contains query-generated"],
  [!text.includes("No direct OKF card"), "does not contain No direct OKF card"],
  [/And No One Gets the Short End of the Stick/i.test(text), "contains Short End paper"],
  [/Blockchain for the IoT/i.test(text), "contains Blockchain for the IoT"],
  [/SSI|KYC/i.test(text), "contains SSI or KYC"]
];
const failed = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failed.length) throw new Error(`Smoke query failed: ${failed.join(", ")}`);
console.log(JSON.stringify({ ok: true, source_papers: payload.source_papers.length, rows: rows.length, evidence: evidence.length }, null, 2));

export {};

