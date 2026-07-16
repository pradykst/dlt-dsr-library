-- Canonical Workbench presentation profile for OKF DSR v1.
-- OKF bundle files remain canonical; these JSONB columns are an indexed runtime copy.

alter table okf_papers
  add column if not exists presentation_version text,
  add column if not exists paper_metadata jsonb not null default '{}'::jsonb,
  add column if not exists presentation jsonb;

update okf_papers
set presentation_version = presentation ->> 'presentation_version'
where presentation is not null
  and presentation_version is null;

alter table okf_papers
  drop constraint if exists okf_papers_presentation_version_check,
  drop constraint if exists okf_papers_paper_metadata_object_check,
  drop constraint if exists okf_papers_presentation_object_check,
  drop constraint if exists okf_papers_presentation_identity_check;

alter table okf_papers
  add constraint okf_papers_presentation_version_check
    check (presentation_version is null or presentation_version = 'workbench-v1'),
  add constraint okf_papers_paper_metadata_object_check
    check (jsonb_typeof(paper_metadata) = 'object'),
  add constraint okf_papers_presentation_object_check
    check (presentation is null or jsonb_typeof(presentation) = 'object'),
  add constraint okf_papers_presentation_identity_check
    check (
      presentation is null
      or (
        presentation_version = 'workbench-v1'
        and presentation ->> 'presentation_version' = 'workbench-v1'
        and presentation ->> 'paper_id' = paper_id
      )
    );

comment on column okf_papers.paper_metadata is
  'Indexed canonical index.md metadata and optional graph source reference. OKF files remain canonical.';

comment on column okf_papers.presentation is
  'Indexed canonical presentation.yaml workbench-v1 profile. OKF files remain canonical.';

comment on column okf_papers.presentation_version is
  'Presentation schema version; currently workbench-v1. Nullable only for rows not yet re-indexed.';

-- Deployment order:
-- 1. Apply this migration to Supabase.
-- 2. Run npm run okf:validate:strict.
-- 3. Run npm run okf:index with the server-only service-role key.
