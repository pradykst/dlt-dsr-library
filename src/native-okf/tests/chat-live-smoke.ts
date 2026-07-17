import "server-only";

import { answerNativeOkfChat } from "../server/openai/chat.ts";

if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
  console.log(
    "Native OKF live chat smoke test skipped: OPENAI_API_KEY and OPENAI_MODEL are required.",
  );
} else {
  const response = await answerNativeOkfChat({
    question: "What design principles address privacy?",
    includeDiagram: false,
  });

  if (response.insufficientContext || response.sources.length === 0) {
    throw new Error("The live chat smoke test did not return grounded sources.");
  }

  console.log(
    `Native OKF live chat smoke test passed with ${response.sources.length} validated source(s).`,
  );
}
