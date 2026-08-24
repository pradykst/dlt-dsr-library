import "server-only";

const baseUrlArgument = process.argv.find((argument) =>
  argument.startsWith("--base-url="),
);
const baseUrlValue = baseUrlArgument?.slice("--base-url=".length);

if (!baseUrlValue) {
  console.log(
    "Native OKF public-route smoke test skipped: pass --base-url=<running application>.",
  );
} else {
  const baseUrl = new URL(baseUrlValue);
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("The smoke-test base URL must use HTTP or HTTPS.");
  }

  const chatResponse = await fetch(
    new URL("/api/native-okf/chat", baseUrl),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl.origin,
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        question: "What design principles address privacy?",
        includeDiagram: false,
      }),
      cache: "no-store",
      redirect: "error",
    },
  );

  if (chatResponse.status !== 200) {
    throw new Error(
      `Expected anonymous public chat access; received HTTP ${chatResponse.status}.`,
    );
  }

  console.log(
    `Native OKF public-route smoke test passed (anonymous chat HTTP ${chatResponse.status}).`,
  );
}
