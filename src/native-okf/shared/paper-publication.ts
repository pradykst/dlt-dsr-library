import { publicationDoi } from "./research-presentation.ts";
import { isSafeExternalHref } from "./links.ts";

interface PublicationRecord {
  id: string;
  filePath: string;
  resource?: string;
  markdownBody: string;
  frontmatter: Record<string, unknown>;
}

export interface PaperPublication {
  label: "DOI" | "Publication";
  href?: string;
  text: string;
  githubHref?: string;
}

/** The native record links to that paper's individual design-knowledge records. */
export function designKnowledgeGithubHref(record: Pick<PublicationRecord, "id" | "filePath">): string | undefined {
  const path = record.filePath.replaceAll("\\", "/");
  if (path !== `${record.id}.md` || !/^papers\/[^/]+\.md$/u.test(path) || /(?:^|\/)\.\.?\//u.test(path)) return undefined;
  return `https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function externalPublication(value: unknown): string | undefined {
  if (typeof value !== "string" || !isSafeExternalHref(value)) return undefined;
  try {
    const url = new URL(value);
    if (!/^https?:$/u.test(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}

/** Resolve bibliographic fields and the record's publication link, never cited references. */
export function resolvePaperPublication(record: PublicationRecord): PaperPublication {
  const metadata = record.frontmatter;
  const doiValue = typeof metadata.doi === "string" ? metadata.doi.trim().replace(/^doi:\s*/iu, "") : undefined;
  const doi = publicationDoi(doiValue?.startsWith("10.") ? `https://doi.org/${doiValue}` : doiValue) ??
    publicationDoi(typeof metadata.doi_url === "string" ? metadata.doi_url : undefined) ??
    publicationDoi(record.resource) ??
    publicationDoi(undefined, record.markdownBody.split(/^##\s+/mu, 1)[0]);
  const linkLine = /^\*\*(?:Link|Publication|URL):\*\*\s*(.+)$/imu.exec(record.markdownBody)?.[1];
  const linkUrl = linkLine?.match(/https?:\/\/[^\s<>"\]]+/iu)?.[0]?.replace(/\)$/, "");
  const fallback = [metadata.publication_url, metadata.source_url, record.resource, linkUrl]
    .map(externalPublication).find(Boolean);
  const href = doi ?? fallback;
  return {
    label: doi ? "DOI" : "Publication",
    ...(href ? { href } : {}),
    text: doi ? doi.replace("https://doi.org/", "") : href ? "View publication" : "Publication link unavailable",
    githubHref: designKnowledgeGithubHref(record),
  };
}
