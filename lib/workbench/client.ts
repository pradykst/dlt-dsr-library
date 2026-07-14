export type WorkbenchHttpErrorDetails = {
  route: string;
  status: number;
  statusText: string;
  contentType: string;
  code: string;
  message: string;
  bodyPreview?: string;
};

export class WorkbenchHttpError extends Error {
  readonly details: WorkbenchHttpErrorDetails;

  constructor(details: WorkbenchHttpErrorDetails) {
    super(details.message);
    this.name = "WorkbenchHttpError";
    this.details = details;
  }
}

export async function fetchWorkbenchJson<T>(route: string, init?: RequestInit): Promise<T> {
  const response = await fetch(route, init);
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();
  const bodyPreview = previewBody(body);

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new WorkbenchHttpError({
      route,
      status: response.status,
      statusText: response.statusText,
      contentType: contentType || "missing",
      code: "NON_JSON_RESPONSE",
      message: `Workbench expected JSON but received ${contentType || "a response without a content type"}.`,
      bodyPreview
    });
  }

  let payload: unknown;
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    throw new WorkbenchHttpError({
      route,
      status: response.status,
      statusText: response.statusText,
      contentType,
      code: "INVALID_JSON_RESPONSE",
      message: "Workbench received malformed JSON.",
      bodyPreview
    });
  }

  if (!response.ok) {
    const record = isRecord(payload) ? payload : {};
    throw new WorkbenchHttpError({
      route,
      status: response.status,
      statusText: response.statusText,
      contentType,
      code: String(record.error ?? "WORKBENCH_REQUEST_FAILED"),
      message: String(record.message ?? record.error ?? `Workbench request failed with HTTP ${response.status}.`),
      bodyPreview
    });
  }

  return payload as T;
}

export function workbenchErrorDetails(error: unknown): WorkbenchHttpErrorDetails {
  if (error instanceof WorkbenchHttpError) return error.details;
  return {
    route: "unknown",
    status: 0,
    statusText: "Client error",
    contentType: "unknown",
    code: "WORKBENCH_CLIENT_ERROR",
    message: error instanceof Error ? error.message : String(error)
  };
}

function previewBody(body: string) {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact ? compact.slice(0, 240) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
