import { parseOkfLibrary } from "../lib/okf/parser.ts";

const kb = parseOkfLibrary();
console.log(`OKF validation summary`);
console.log(`papers: ${kb.papers.length}`);
console.log(`concepts: ${kb.concepts.length}`);
console.log(`relations: ${kb.relations.length}`);
console.log(`evidence_items: ${kb.evidence_items.length}`);
console.log(`warnings: ${kb.warnings.length}`);
for (const warning of kb.warnings) {
  console.log(`- ${warning.file}: ${warning.message}`);
}
