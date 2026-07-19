import "server-only";

const LOCAL_ORIGIN = "http://localhost:3000";

export function getNativeOkfPublicOrigin(
  configured = process.env.NATIVE_OKF_PUBLIC_ORIGIN,
): string {
  const candidate = configured?.trim();
  if (!candidate) return LOCAL_ORIGIN;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return LOCAL_ORIGIN;
    }
    return url.origin;
  } catch {
    return LOCAL_ORIGIN;
  }
}
