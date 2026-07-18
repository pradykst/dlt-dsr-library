import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

const MINIMUM_IP_HASH_SECRET_BYTES = 32;

export type NativeOkfTrustedProxyConfig =
  | { trustProxy: false }
  | {
      trustProxy: true;
      header: "x-forwarded-for" | "x-real-ip";
      trustedHops: number;
    };

export interface NativeOkfClientIpInput {
  headers: Headers | Record<string, string | string[] | undefined>;
  directAddress?: string | null;
}

export interface NativeOkfIpSubject {
  ipSubject: string;
  source: "direct" | "trusted-proxy" | "unresolved";
}

function getHeader(
  headers: NativeOkfClientIpInput["headers"],
  name: string,
): string | null {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const record = headers as Record<string, string | string[] | undefined>;
  const key = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === name,
  );
  if (!key) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let candidate = raw.trim();
  if (candidate.length === 0 || candidate.includes("%")) return null;

  if (candidate.startsWith("[") && candidate.includes("]")) {
    candidate = candidate.slice(1, candidate.indexOf("]"));
  } else {
    const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPort) candidate = ipv4WithPort[1];
  }

  const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4) candidate = mappedIpv4[1];

  const version = isIP(candidate);
  if (version === 4) {
    return candidate
      .split(".")
      .map((octet) => String(Number(octet)))
      .join(".");
  }
  if (version === 6) {
    try {
      const hostname = new URL(`http://[${candidate}]/`).hostname;
      return hostname.slice(1, -1).toLowerCase();
    } catch {
      return null;
    }
  }
  return null;
}

function resolveIp(
  input: NativeOkfClientIpInput,
  proxy: NativeOkfTrustedProxyConfig,
): { ip: string | null; source: NativeOkfIpSubject["source"] } {
  const directIp = normalizeIp(input.directAddress);
  if (!proxy.trustProxy) {
    return directIp
      ? { ip: directIp, source: "direct" }
      : { ip: null, source: "unresolved" };
  }

  if (
    !Number.isSafeInteger(proxy.trustedHops) ||
    proxy.trustedHops < 1 ||
    proxy.trustedHops > 16
  ) {
    return { ip: null, source: "unresolved" };
  }

  const rawHeader = getHeader(input.headers, proxy.header);
  if (!rawHeader) return { ip: null, source: "unresolved" };
  const forwarded = rawHeader.split(",").map((part) => normalizeIp(part));
  if (forwarded.length === 0 || forwarded.some((part) => part === null)) {
    return { ip: null, source: "unresolved" };
  }

  const chain = directIp ? [...forwarded, directIp] : forwarded;
  const index = directIp
    ? chain.length - proxy.trustedHops - 1
    : chain.length - proxy.trustedHops;
  const selected = index >= 0 ? chain[index] : null;
  return selected
    ? { ip: selected, source: "trusted-proxy" }
    : { ip: null, source: "unresolved" };
}

export function createNativeOkfIpSubject(
  input: NativeOkfClientIpInput,
  proxy: NativeOkfTrustedProxyConfig,
  hashSecret: string,
): NativeOkfIpSubject {
  if (Buffer.byteLength(hashSecret, "utf8") < MINIMUM_IP_HASH_SECRET_BYTES) {
    throw new Error(
      `Native OKF IP hash secret must be at least ${MINIMUM_IP_HASH_SECRET_BYTES} bytes.`,
    );
  }
  const resolved = resolveIp(input, proxy);
  const privateValue = resolved.ip ?? "unresolved";
  const ipSubject = createHmac("sha256", hashSecret)
    .update("native-okf:client-ip:v1:")
    .update(privateValue)
    .digest("hex");
  return { ipSubject, source: resolved.source };
}
