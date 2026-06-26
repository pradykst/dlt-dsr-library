import { parseOkfLibrary } from "../lib/okf/parser.ts";
import { indexOkfKnowledgeBase } from "../lib/okf/indexer.ts";

const kb = parseOkfLibrary();
const summary = await indexOkfKnowledgeBase(kb);
console.log(JSON.stringify(summary, null, 2));
