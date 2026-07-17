import "server-only";

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import test from "node:test";

const CLIENT_SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

async function collectClientSources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"))) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectClientSources(absolutePath));
    } else if (
      entry.isFile() &&
      CLIENT_SOURCE_EXTENSIONS.has(extname(entry.name).toLocaleLowerCase("en"))
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/gu,
    /\bimport\s+["']([^"']+)["']/gu,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

test("native client modules never import the OpenAI SDK or server-only OpenAI modules", async () => {
  const cwd = process.cwd();
  const candidates = [
    ...await collectClientSources(resolve(cwd, "src/native-okf/components")),
    ...await collectClientSources(resolve(cwd, "app/native-okf")),
  ];
  const clientFiles: string[] = [];
  const violations: string[] = [];

  for (const absolutePath of candidates) {
    const source = await readFile(absolutePath, "utf8");
    if (!/^\s*["']use client["'];/u.test(source)) continue;
    const displayPath = relative(cwd, absolutePath).replaceAll("\\", "/");
    clientFiles.push(displayPath);

    for (const specifier of importSpecifiers(source)) {
      const normalized = specifier.replaceAll("\\", "/").toLocaleLowerCase("en");
      if (
        normalized === "openai" ||
        normalized.startsWith("openai/") ||
        normalized.includes("/server/openai") ||
        normalized.startsWith("server/openai")
      ) {
        violations.push(`${displayPath}: ${specifier}`);
      }
    }
  }

  assert.ok(clientFiles.length > 0, "expected at least one native client module");
  assert.deepEqual(violations, []);
});
