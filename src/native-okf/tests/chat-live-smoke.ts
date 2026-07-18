import "server-only";

const baseUrlArgument = process.argv.find((argument) =>
  argument.startsWith("--base-url="),
);
const baseUrlValue = baseUrlArgument?.slice("--base-url=".length);

if (!baseUrlValue) {
  console.log(
    "Native OKF protected-route smoke test skipped: pass --base-url=<running application>.",
  );
} else {
  const baseUrl = new URL(baseUrlValue);
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("The smoke-test base URL must use HTTP or HTTPS.");
  }

  const accessResponse = await fetch(
    new URL("/api/native-okf/access", baseUrl),
    {
      method: "GET",
      cache: "no-store",
      redirect: "error",
    },
  );
  const accessPayload: unknown = await accessResponse
    .json()
    .catch(() => undefined);

  if (
    typeof accessPayload === "object" &&
    accessPayload !== null &&
    "authenticated" in accessPayload &&
    accessPayload.authenticated === true
  ) {
    throw new Error(
      "The route smoke test refuses to send a paid request with an authenticated session.",
    );
  }

  const chatResponse = await fetch(
    new URL("/api/native-okf/chat", baseUrl),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "What design principles address privacy?",
        includeDiagram: false,
      }),
      cache: "no-store",
      redirect: "error",
    },
  );

  if (![401, 403, 429, 503].includes(chatResponse.status)) {
    throw new Error(
      `Expected the protected chat route to reject anonymous paid access; received HTTP ${chatResponse.status}.`,
    );
  }

  console.log(
    `Native OKF protected-route smoke test passed (access HTTP ${accessResponse.status}; anonymous chat HTTP ${chatResponse.status}).`,
  );
}
