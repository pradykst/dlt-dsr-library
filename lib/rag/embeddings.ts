export async function createQueryEmbedding(input: string) {
  const baseUrl = process.env.EMBEDDING_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("Query embedding service is not configured. Set EMBEDDING_API_BASE_URL.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.EMBEDDING_API_KEY ? { Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}` } : {})
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL,
      input
    })
  });

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
