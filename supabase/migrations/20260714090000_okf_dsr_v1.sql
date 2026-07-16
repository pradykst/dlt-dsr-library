-- Canonical OKF DSR v1 metadata and review semantics.
-- OKF files remain canonical; these tables are an indexed runtime copy.

alter table okf_papers
  add column if not exists schema_version text not null default 'okf-dsr-v1',
  add column if not exists slug text,
  add column if not exists short_title text,
  add column if not exists venue text,
  add column if not exists doi text,
  add column if not exists doi_url text,
  add column if not exists source_url text,
  add column if not exists abstract text,
  add column if not exists domain_context text,
  add column if not exists research_problem jsonb not null default '[]'::jsonb,
  add column if not exists research_objective jsonb not null default '[]'::jsonb,
  add column if not exists research_questions jsonb not null default '[]'::jsonb,
  add column if not exists artifact_type text,
  add column if not exists dlt_role text,
  add column if not exists methodology text,
  add column if not exists theoretical_foundations jsonb not null default '[]'::jsonb,
  add column if not exists evaluation_method jsonb not null default '[]'::jsonb,
  add column if not exists key_contributions jsonb not null default '[]'::jsonb,
  add column if not exists design_knowledge_output jsonb not null default '[]'::jsonb,
  add column if not exists limitations jsonb not null default '[]'::jsonb,
  add column if not exists notes text,
  add column if not exists extraction_status text not null default 'okf_draft',
  add column if not exists author_check_status text not null default 'not_requested',
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists last_indexed_at timestamptz;

alter table okf_concepts
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

alter table okf_evidence_items
  add column if not exists supports jsonb not null default '[]'::jsonb,
  add column if not exists quote_or_summary text,
  add column if not exists evidence_type text not null default 'summary';

alter table okf_relations
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists extraction_type text not null default 'explicit';

alter table okf_papers drop constraint if exists okf_papers_review_status_check;
alter table okf_concepts drop constraint if exists okf_concepts_review_status_check;

update okf_papers set review_status = 'unreviewed'
where review_status not in ('unreviewed', 'internally_reviewed', 'author_verified')
   or review_status is null;

update okf_concepts set review_status = 'unreviewed'
where review_status not in ('unreviewed', 'internally_reviewed', 'author_verified')
   or review_status is null;

alter table okf_papers drop constraint if exists okf_papers_extraction_status_check;
alter table okf_papers drop constraint if exists okf_papers_author_check_status_check;
alter table okf_papers drop constraint if exists okf_papers_author_verification_check;
alter table okf_papers drop constraint if exists okf_papers_review_metadata_check;

alter table okf_papers
  add constraint okf_papers_review_status_check
    check (review_status in ('unreviewed', 'internally_reviewed', 'author_verified')),
  add constraint okf_papers_extraction_status_check
    check (extraction_status in ('indexed_from_canonical_okf', 'okf_draft')),
  add constraint okf_papers_author_check_status_check
    check (author_check_status in ('not_requested', 'requested', 'verified', 'disputed')),
  add constraint okf_papers_author_verification_check
    check ((review_status = 'author_verified') = (author_check_status = 'verified')),
  add constraint okf_papers_review_metadata_check
    check (
      review_status = 'unreviewed'
      or (nullif(btrim(reviewed_by), '') is not null and reviewed_at is not null)
    );

alter table okf_concepts drop constraint if exists okf_concepts_review_metadata_check;

alter table okf_concepts
  add constraint okf_concepts_review_status_check
    check (review_status in ('unreviewed', 'internally_reviewed', 'author_verified')),
  add constraint okf_concepts_review_metadata_check
    check (
      review_status = 'unreviewed'
      or (nullif(btrim(reviewed_by), '') is not null and reviewed_at is not null)
    );

update okf_evidence_items
set quote_or_summary = coalesce(nullif(quote, ''), paraphrase, '')
where quote_or_summary is null;

alter table okf_evidence_items
  alter column quote_or_summary set not null;

alter table okf_evidence_items drop constraint if exists okf_evidence_items_evidence_type_check;
alter table okf_evidence_items
  add constraint okf_evidence_items_evidence_type_check
    check (evidence_type in ('quote', 'summary', 'paraphrase'));

alter table okf_relations drop constraint if exists okf_relations_extraction_type_check;
alter table okf_relations
  add constraint okf_relations_extraction_type_check
    check (extraction_type in ('explicit', 'inferred', 'explicit-in-artifact'));