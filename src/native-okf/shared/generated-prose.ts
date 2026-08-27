/** Applies the chatbot prose style rule while preserving exact stored titles. */
export function sanitizeGeneratedProse(
  value: string,
  protectedFragments: readonly string[] = [],
): string {
  const fragments = [...new Set(protectedFragments)]
    .filter((fragment) => fragment.includes("\u2014"))
    .sort((left, right) => right.length - left.length);
  let protectedValue = value;
  const tokens = fragments.map((fragment, index) => {
    const token = `\uE000native-okf-title-${index}\uE001`;
    protectedValue = protectedValue.split(fragment).join(token);
    return { fragment, token };
  });
  let sanitized = protectedValue.replace(/\s*\u2014\s*/gu, " - ");
  for (const { fragment, token } of tokens) {
    sanitized = sanitized.split(token).join(fragment);
  }
  return sanitized;
}
