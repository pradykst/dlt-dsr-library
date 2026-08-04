# Pre-edit blocker report: forgetting-blockchain-gdpr

## Status: blocked (schema/ambiguity — no file changes made)

## Exact ambiguity

The canonical concept `forgetting-blockchain-gdpr-dp.md` is a single
design-principle node whose body sentence synthesizes five paraphrased
clauses. Unlike the other three Batch-1 papers (which each had a formal,
explicitly numbered source table of design objectives that a merged node
could be mechanically split against), this paper has **no formal table,
figure, or numbered list of "design principles" anywhere in the source
PDF**. The paper's abstract and conclusion state only that the authors
"derive[d] helpful principles for designing data-protection compliant
blockchains" — a plural claim with no enumerated, labelled itemization.

The content that the existing merged node draws on is scattered across
three structurally distinct parts of the paper, not one:

1. Section 6 ("Discussion and conclusion") — one sentence describing what
   the *prototype itself does* ("combination of state pruning and a
   custom function to delete logs... enable the logging of predefined
   transactions in the state of the EVM"), framed as an artifact/method
   description (exaptation), not phrased as a forward-looking
   recommendation to future designers.
2. Section 4.5 ("Evaluation") — two sentences embedded in prose answers to
   interviewee questions during the demonstration Q&A ("We recommend
   storing the data in the state using smart contract logic"; "A node
   therefore must ask multiple other nodes for a block in the middle of
   the chain and check if they all recognize this block").
3. Section 5 ("Limitations") — four ordinally signalled points ("First,"
   "Second," "Third," "Lastly"), each a discussion of a limitation that
   incidentally contains an embedded recommendation (restrict to
   permissioned/audited environments; log to persistent state explicitly;
   trust multiple cross-checked sources for a new bootstrap block; set
   deletion time to ~7 days for downtime tolerance).

Two of these five clauses in the current merged node come from an
unlabelled Q&A answer (item 2), one comes from an artifact-description
sentence in the Discussion (item 1), and the remaining come from the
Limitations section's four ordinal points (item 3). Splitting this node
requires deciding: (a) whether the Section-6 artifact-description sentence
counts as a "design principle" at all, versus being artifact/methodology
content; (b) whether unlabelled interview Q&A prose in Section 4.5 is an
acceptable evidence source for a formal atomic concept, given the protocol
rule against inferring concepts from unlabelled discussion prose; and (c)
whether the Limitations section's "First/Second/Third/Lastly" ordinal
structure is a sufficiently formal "numbered statement" to split against on
its own (which would yield 4 principles, not the current 5, and would
drop the Section-6 and Section-4.5 content entirely from the design-
knowledge inventory, moving it instead to Artifact/Methodology narrative
if warranted).

None of these are choices the protocol allows an autonomous pass to guess
at silently, since the outcome measurably changes which content is
represented as formal design knowledge versus artifact/evaluation prose.

## Source evidence

- Abstract: "We evaluate the prototype with the help from experts... and
  derive principles on how to design them." (no itemization)
- Section 4.5 Evaluation, unlabelled Q&A answers, article p. 7 (PDF p. 7,
  printed p. 7093).
- Section 5 Limitations, four ordinal points ("First," "Second," "Third,"
  "Lastly"), article p. 7–8 (PDF p. 7–8, printed p. 7093–7094).
- Section 6 Discussion and conclusion, artifact-description sentence,
  article p. 8 (PDF p. 8, printed p. 7094).

## Affected concepts

- `forgetting-blockchain-gdpr-dp.md` (currently 1 merged design-principle
  node) — candidate for a 4-way or 5-way split depending on the schema
  decision above; not modified.

## Affected relationships

None (this paper has only one concept type; no relationships exist or are
affected).

## Decision required

A human decision on which of the following conventions to apply, since
this paper lacks a formal enumerable source structure:
1. Split into 4 atomic design principles sourced only from Section 5's
   ordinal "First/Second/Third/Lastly" limitations (the closest thing to a
   formal numbered list), moving the Section-6 artifact-description
   sentence into the paper's `Artifact`/`Methodology` narrative instead of
   treating it as a design principle, and excluding the two unlabelled
   Section 4.5 Q&A sentences unless they restate content already covered
   by the Section 5 points (the "log to persistent state" and "cross-check
   multiple sources" Q&A answers do substantially restate Section 5 points
   2 and 3, so this may not lose real content).
2. Keep a single merged design-principle node but rewrite its body to
   quote each of the five source clauses as a semicolon-delimited list
   using closer-to-verbatim wording (current wording is already a fairly
   faithful paraphrase, so this is a smaller-scope fix), keeping the
   present one-node structure since the source itself never itemizes
   "principles" as discrete numbered items.
3. Some other split the reviewing human specifies after reading the
   source sections cited above.

## Files restored

None — no canonical or test files were modified before this paper was
identified as ambiguous; the working tree was and remains clean.

## Also noted (non-blocking, minor)

- **Missing author**: The canonical paper record and its single concept
  file list authors as "Simon Farshid, Andreas Reitz," omitting the
  paper's third author, Peter Roßbach, who appears in the byline and every
  page footer of the source PDF. This is an unambiguous factual omission
  (not part of the blocker) that should be corrected together with
  whichever design-knowledge fix the reviewer selects, to avoid two
  separate commits touching the same paper file.
- **Resource URI discrepancy**: the canonical `resource` field cites
  `https://hdl.handle.net/10125/59571`, while the PDF's own printed header
  cites `https://hdl.handle.net/10125/60145`. This is the same class of
  discrepancy (session/track handle vs. paper-specific ScholarSpace handle)
  noted for `cross-org-workflow-objectives` during setup; not confidently
  resolvable without external verification, and not itself a reason to
  block.
