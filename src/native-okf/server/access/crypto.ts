import "server-only";

import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

const INVITATION_ENTROPY_BYTES = 24;

function assertHmacSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error("The native OKF HMAC secret must contain at least 32 characters.");
  }
}

function hmacHex(secret: string, domain: string, value: string): string {
  assertHmacSecret(secret);
  return createHmac("sha256", secret)
    .update(domain, "utf8")
    .update("\0", "utf8")
    .update(value, "utf8")
    .digest("hex");
}

/** Generates an opaque 192-bit invitation bearer credential. */
export function generateInvitationCode(): string {
  return randomBytes(INVITATION_ENTROPY_BYTES).toString("base64url");
}

export function generateInvitationId(): string {
  return randomUUID();
}

export function hashInvitationCode(code: string, secret: string): string {
  if (!code) throw new Error("Invitation code must not be empty.");
  return hmacHex(secret, "native-okf/invitation/v1", code);
}

/** Produces the only IP-derived value that may be passed to the store. */
export function hashIpSubject(ipAddress: string, secret: string): string {
  if (!ipAddress) throw new Error("IP address must not be empty.");
  return hmacHex(secret, "native-okf/ip-subject/v1", ipAddress);
}

export function timingSafeHashEqual(leftHex: string, rightHex: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(leftHex) || !/^[a-f\d]{64}$/i.test(rightHex)) {
    return false;
  }
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

