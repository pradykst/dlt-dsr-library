import { parseOkfLibrary } from "../lib/okf/parser.ts";
import { validateOkfSource, validateOkfTemplate } from "../lib/okf/source-validator.ts";

const strict = process.argv.includes("--strict");
const source = validateOkfSource();
const template = validateOkfTemplate();
console.log(`OKF${strict ? " strict" : ""} validation summary`);
console.log(`papers: ${source.counts.papers}`);
console.log(`concepts: ${source.counts.concepts}`);
console.log(`relations: ${source.counts.relations}`);
console.log(`evidence_items: ${source.counts.evidence}`);
console.log(`graph_nodes: ${source.counts.graph_nodes}`);
console.log(`graph_edges: ${source.counts.graph_edges}`);
console.log(`recommended_paths: ${source.counts.recommended_paths}`);
console.log(`errors: ${source.errors.length}`);
for (const error of source.errors) console.error(`- [${error.code}] ${error.file}: ${error.message}`);
console.log(`template_valid: ${template.ok}`);
console.log(`template_errors: ${template.errors.length}`);
for (const error of template.errors) console.error(`- [${error.code}] ${error.file}: ${error.message}`);

if (source.ok && template.ok) {
  const kb = parseOkfLibrary();
  console.log(`parser_warnings: ${kb.warnings.length}`);
  for (const warning of kb.warnings) console.error(`- [PARSER_WARNING] ${warning.file}: ${warning.message}`);
  if (kb.warnings.length) process.exitCode = 1;
} else process.exitCode = 1;