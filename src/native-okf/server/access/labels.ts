import "server-only";

import { isIP } from "node:net";

export const NATIVE_OKF_ADMIN_LABEL_MAX_LENGTH = 120;

const NEUTRAL_LABEL_CHARACTERS = /^[\p{L}\p{N} ._-]+$/u;
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

export function normalizeNativeOkfAdministrativeLabel(
  value: string,
): string | null {
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (
    normalized.length === 0 ||
    normalized.length > NATIVE_OKF_ADMIN_LABEL_MAX_LENGTH ||
    isIP(normalized) !== 0 ||
    !NEUTRAL_LABEL_CHARACTERS.test(normalized) ||
    !HAS_LETTER_OR_NUMBER.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export function assertNativeOkfAdministrativeLabel(value: string): string {
  const normalized = normalizeNativeOkfAdministrativeLabel(value);
  if (!normalized) {
    throw new Error(
      "Administrative labels must be neutral and use only letters, digits, spaces, periods, underscores, or hyphens.",
    );
  }
  return normalized;
}

