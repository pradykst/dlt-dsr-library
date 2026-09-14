import Link from "next/link";
import { publicationDoi, researcherMarkdown } from "../shared/research-presentation.ts";
import { formatConceptCount } from "../shared/presentation.ts";
import type { ReactNode } from "react";

import { conceptHref, isSafeExternalHref } from "../shared/links.ts";
import {
  buildPaperPresentation,
  publicPaperFrontmatter,
} from "../shared/paper-presentation.ts";
import type { NativeOkfScopePaper } from "../shared/paper-scope.ts";
import { NATIVE_OKF_PUBLIC_ROUTES } from "../shared/routes.ts";
import {
  CONCEPT_WORKBENCH_SECTIONS,
  PAPER_WORKBENCH_SECTIONS,
  workbenchSectionEyebrow,
} from "../shared/workbench-sections.ts";
import { PaperChatLauncher } from "./chat/PaperChatLauncher.tsx";
import type { JsonValue, WorkbenchViewModel } from "../shared/types.ts";
import { ConceptCard } from "./ConceptCard.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { MarkdownDocument } from "./MarkdownDocument.tsx";
import { MetadataGrid } from "./MetadataGrid.tsx";
import { NativeOkfGraph } from "./NativeOkfGraph.tsx";
import { PaperDsrGrid } from "./PaperDsrGrid.tsx";
import { PaperGraphViews } from "./PaperGraphViews.tsx";
import { NativeOkfShell } from "./NativeOkfShell.tsx";
import { RelationshipList } from "./RelationshipList.tsx";
import { TypeBadge } from "./TypeBadge.tsx";

export function WorkbenchView({
  view,
  scopePapers,
}: {
  view: WorkbenchViewModel;
  scopePapers?: readonly NativeOkfScopePaper[];
}) {
  const { concept } = view;
  const isPaper = view.kind === "paper";
  const paperScopeId = isPaper ? concept.id.replace(/^papers\//u, "") : "";
  const frontmatter = concept.frontmatter;
  const paperPresentation = isPaper
    ? buildPaperPresentation(concept.markdownBody, view.linkedGroups)
    : null;
  const displayFrontmatter = publicPaperFrontmatter(frontmatter);
  const doi = publicationDoi(concept.resource, concept.markdownBody);
  const resourceIsSafe = Boolean(
    concept.resource && isSafeExternalHref(concept.resource),
  );

  const metadataItems = isPaper
    ? [
        { label: "Authors", value: metadataValue(frontmatter.authors) },
        { label: "Year", value: metadataValue(frontmatter.year) },
        { label: "Venue", value: metadataValue(frontmatter.venue) },
        { label: "Methodology", value: metadataValue(frontmatter.methodology) },
      ]
    : [
        { label: "Authors", value: metadataValue(frontmatter.authors) },
        { label: "Year", value: metadataValue(frontmatter.year) },
        { label: "Venue", value: metadataValue(frontmatter.venue) },
        { label: "Producer label", value: metadataValue(frontmatter.label) },
        { label: "Source paper", value: metadataValue(frontmatter.source_paper) },
        { label: "Methodology", value: metadataValue(frontmatter.methodology) },
        { label: "Timestamp", value: concept.timestamp },
        {
          label: "Bundle path",
          value: <code className="font-mono text-xs">{concept.filePath}</code>,
        },
      ];

  // On a paper page the design map is the high-level overview, so it is placed
  // above the detailed Design knowledge cards. Concept pages keep their existing
  // order (linked concepts, relationships, then the local graph). Section order
  // and eyebrow numbers come from ../shared/workbench-sections.ts.
  const sectionKind = isPaper ? "paper" : "concept";
  const designKnowledgeSection = (
    <WorkbenchSection
      id="design-knowledge"
      eyebrow={workbenchSectionEyebrow(sectionKind, "design-knowledge")}
      title={isPaper ? "Design knowledge" : "Linked concepts"}
      description={
        isPaper
          ? "Directly linked concepts, grouped by their represented design-knowledge category."
          : "Concepts connected by incoming or outgoing native Markdown links."
      }
    >
      {view.linkedGroups.length > 0 ? (
        <div className="space-y-8">
          {view.linkedGroups.map((group) => (
            <section key={group.type} aria-labelledby={`group-${group.type}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 id={`group-${group.type}`} className="font-serif text-2xl font-semibold text-ink">
                  {formatConceptCount(group.type, group.count)}
                </h3>

              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.concepts.map((linkedConcept) => (
                  <ConceptCard
                    key={linkedConcept.id}
                    concept={linkedConcept}
                    meta={<code className="font-mono">{linkedConcept.id}</code>}
                    showTypeBadge={false}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title={isPaper ? "No linked design knowledge" : "No linked concepts"}
          description={isPaper
            ? "The current library record contains no directly linked design knowledge."
            : "The graph contains no directly connected concept documents for this item."
          }
        />
      )}
    </WorkbenchSection>
  );

  const relationshipsSection = !isPaper ? (
    <WorkbenchSection
      id="relationships"
      eyebrow="03"
      title="Relationships"
      description="Directed links from Markdown. Heading context is displayed as derived metadata, not as a formal OKF predicate."
    >
      <div className="grid items-start gap-7 lg:grid-cols-2">
        <RelationshipList
          title="Outgoing links"
          relationships={view.outgoing}
          emptyMessage="This concept has no outgoing Markdown links."
        />
        <RelationshipList
          title="Incoming backlinks"
          relationships={view.incoming}
          emptyMessage="No other concept links to this concept."
        />
      </div>
    </WorkbenchSection>
  ) : null;

  const graphSection = (
    <WorkbenchSection
      id="graph"
      eyebrow={workbenchSectionEyebrow(sectionKind, "graph")}
      title={isPaper ? "Paper design map" : "Local graph"}
      description={
        isPaper
          ? "The default semantic design map canonicalizes stored design relationships; Raw links retains the complete technical Markdown-link view."
          : "One-hop by default, with an optional bounded two-hop view. Nodes are concept files and arrows are Markdown links."
      }
    >
      {isPaper && view.paperDesignMap ? (
        <PaperGraphViews
          designMap={view.paperDesignMap}
          graphOneHop={view.graphOneHop}
          graphTwoHops={view.graphTwoHops}
          selectedId={concept.id}
        />
      ) : (
        <NativeOkfGraph
          graphOneHop={view.graphOneHop}
          graphTwoHops={view.graphTwoHops}
          selectedId={concept.id}
        />
      )}
    </WorkbenchSection>
  );

  return (
    <>
    {isPaper && scopePapers && scopePapers.length > 0 ? (
      <PaperChatLauncher
        paperId={paperScopeId}
        paperTitle={concept.title}
        papers={scopePapers}
      />
    ) : null}
    <NativeOkfShell
      title={concept.title}
      eyebrow={isPaper ? "Research paper" : concept.typeLabel}
      description={concept.description}
      breadcrumbs={[
        ...(isPaper
          ? [{
              label: "Papers",
              href: `${NATIVE_OKF_PUBLIC_ROUTES.library}#papers`,
            }]
          : []),
        { label: concept.title },
      ]}
      actions={
        <>
          {isPaper ? (
            <TypeBadge type={concept.type} label={concept.typeLabel} />
          ) : null}
          {resourceIsSafe && concept.resource ? (
            <a
              href={concept.resource}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue"
            >
              Open source resource ↗
            </a>
          ) : null}
        </>
      }
    >
      <div className="space-y-12">
        <nav
          aria-label={isPaper ? "Paper sections" : "Concept sections"}
          className="sticky top-0 z-10 -mx-2 flex gap-1 overflow-x-auto border-y border-line bg-paper/95 px-2 py-3 backdrop-blur"
        >
          {(isPaper ? PAPER_WORKBENCH_SECTIONS : CONCEPT_WORKBENCH_SECTIONS).map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition hover:bg-white hover:text-ink"
            >
              {section.navLabel}
            </a>
          ))}
        </nav>

        <WorkbenchSection
          id="overview"
          eyebrow="01"
          title="Overview"
          description={
            isPaper
              ? "Publication metadata and narrative from the current library record."
              : "Producer metadata and the represented concept document."
          }
        >
          <div className="space-y-7">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
              {!isPaper ? (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Concept identity
                    </p>
                    <code className="mt-1 block break-all font-mono text-xs text-ink">
                      {concept.id}
                    </code>
                  </div>
                  <Link
                    href={conceptHref(concept.id)}
                    className="text-xs font-semibold text-blue hover:underline"
                  >
                    Open concept record
                  </Link>
                </div>
              ) : null}
              <MetadataGrid items={[...metadataItems, { label: "DOI", value: doi ? <a href={doi} target="_blank" rel="noopener noreferrer" className="break-all text-blue underline">{doi}</a> : undefined }]} />
              {concept.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Concept tags">
                  {concept.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8">
              <MarkdownDocument
                markdown={researcherMarkdown(paperPresentation?.narrativeMarkdown ?? concept.markdownBody)}
                sourceFilePath={concept.filePath}
              />
            </div>
          </div>
        </WorkbenchSection>

        {isPaper && paperPresentation ? (
          <WorkbenchSection
            id="dsr-grid"
            eyebrow="02"
            title="DSR grid"
            description="Six dimensions represented in the current paper record."
          >
            <PaperDsrGrid
              dimensions={paperPresentation.dsrDimensions}
              sourceFilePath={concept.filePath}
            />
          </WorkbenchSection>
        ) : null}

        {isPaper ? (
          <>
            {graphSection}
            {designKnowledgeSection}
          </>
        ) : (
          <>
            {designKnowledgeSection}
            {relationshipsSection}
            {graphSection}
          </>
        )}

        <WorkbenchSection
          id="raw-metadata"
          eyebrow="05"
          title={isPaper ? "Publication metadata" : "Raw metadata"}
          description={
            isPaper
              ? "Additional metadata represented in the current library record."
              : "The complete producer frontmatter, serialized without server paths or runtime data."
          }
        >
          <details className="group rounded-2xl border border-line bg-white shadow-sm">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink marker:hidden sm:px-6">
              <span className="flex items-center justify-between gap-4">
                {isPaper ? "Show additional metadata" : "Show producer frontmatter"}
                <span aria-hidden="true" className="text-lg text-muted transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <pre className="max-h-[36rem] overflow-auto border-t border-line bg-slate-950 p-5 text-xs leading-6 text-slate-100 sm:p-6">
              <code>{JSON.stringify(displayFrontmatter, null, 2)}</code>
            </pre>
          </details>
        </WorkbenchSection>
      </div>
    </NativeOkfShell>
    </>
  );
}

function WorkbenchSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20" aria-labelledby={`${id}-title`}>
      <div className="mb-5 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-2 font-serif text-3xl font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function metadataValue(value: JsonValue | undefined): ReactNode {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const simpleValues = value.filter(
      (entry): entry is string | number | boolean =>
        typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean",
    );
    return simpleValues.length === value.length
      ? simpleValues.map(String).join(", ")
      : JSON.stringify(value);
  }
  return JSON.stringify(value);
}
