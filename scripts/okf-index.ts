import nextEnv from "@next/env";
import { parseOkfLibrary } from "../lib/okf/parser.ts";
import { indexOkfKnowledgeBase } from "../lib/okf/indexer.ts";
import { validateOkfSource } from "../lib/okf/source-validator.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const source = validateOkfSource();
if (!source.ok) {
  const details = source.errors.map((issue) => `[${issue.code}] ${issue.file}: ${issue.message}`).join("\n");
  throw new Error(`Refusing to index an invalid canonical OKF source.\n${details}`);
}

const kb = parseOkfLibrary();
const summary = await indexOkfKnowledgeBase(kb);
console.log(JSON.stringify(summary, null, 2));
