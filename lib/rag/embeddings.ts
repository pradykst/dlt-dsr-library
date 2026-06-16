export async function createQueryEmbedding(input: string) {
  const baseUrl = process.env.EMBEDDING_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("Query embedding service is not configured. Set EMBEDDING_API_BASE_URL.");
  }

  const timeoutMs = Math.max(numberFromEnv("EMBEDDING_TIMEOUT_MS", 120000), 120000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EMBEDDING_API_KEY ? { Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}` } : {})
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL,
        input
      })
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Query embedding request timed out after ${timeoutMs}ms.`);
    }
    throw new Error(`Query embedding fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Query embedding request failed (${response.status}): ${details}`);
  }

  const payload = await response.json() as { data?: Array<{ embedding?: number[] }> };
  const embedding = payload.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Query embedding response did not include an embedding vector.");
  }

  return embedding;
}

function numberFromEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
