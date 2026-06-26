import nextEnv from "@next/env";
import { parseOkfLibrary } from "../lib/okf/parser.ts";
import { indexOkfKnowledgeBase } from "../lib/okf/indexer.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const kb = parseOkfLibrary();
const summary = await indexOkfKnowledgeBase(kb);
console.log(JSON.stringify(summary, null, 2));
