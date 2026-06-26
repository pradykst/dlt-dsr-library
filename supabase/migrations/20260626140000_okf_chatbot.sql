create table if not exists papers (
  paper_id text primary key,
  title text not null,
  authors jsonb,
  year int,
  source_pdf_path text,
  review_status text not null check (review_status in ('draft', 'reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists concepts (
  concept_id text primary key,
  paper_id text not null references papers(paper_id) on delete cascade,
  okf_path text,
  type text not null,
  dsr_layer text,
  title text not null,
  description text,
  body_text text,
  tags jsonb not null default '[]'::jsonb,
  confidence text not null default 'low',
  extraction_type text not null check (extraction_type in ('explicit', 'inferred')),
  review_status text not null check (review_status in ('draft', 'reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_items (
  evidence_id text primary key,
  paper_id text not null references papers(paper_id) on delete cascade,
  concept_id text references concepts(concept_id) on delete set null,
  page_number int,
  section text,
  quote text,
  paraphrase text not null,
  source_location text,
  confidence text not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists relations (
  relation_id text primary key,
  source_concept_id text not null references concepts(concept_id) on delete cascade,
  predicate text not null,
  target_concept_id text not null references concepts(concept_id) on delete cascade,
  evidence_id text references evidence_items(evidence_id) on delete set null,
  confidence text not null default 'low',
  relation_scope text not null check (relation_scope in ('paper_level', 'cross_paper', 'query_generated')),
  created_at timestamptz not null default now()
);

create table if not exists conversation_sessions (
  session_id text primary key,
  user_goal text,
  current_stage text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists session_design_state (
  state_id text primary key,
  session_id text not null references conversation_sessions(session_id) on delete cascade,
  accepted_requirements jsonb not null default '[]'::jsonb,
  rejected_requirements jsonb not null default '[]'::jsonb,
  selected_principles jsonb not null default '[]'::jsonb,
  selected_features jsonb not null default '[]'::jsonb,
  artifact_direction jsonb not null default '{}'::jsonb,
  open_assumptions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists generated_flows (
  flow_id text primary key,
  session_id text references conversation_sessions(session_id) on delete cascade,
  flow_type text not null,
  title text not null,
  confidence text not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists flow_nodes (
  flow_node_id text primary key,
  flow_id text not null references generated_flows(flow_id) on delete cascade,
  concept_id text references concepts(concept_id) on delete set null,
  label text not null,
  node_type text not null,
  position int not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists flow_edges (
  flow_edge_id text primary key,
  flow_id text not null references generated_flows(flow_id) on delete cascade,
  source_flow_node_id text not null references flow_nodes(flow_node_id) on delete cascade,
  target_flow_node_id text not null references flow_nodes(flow_node_id) on delete cascade,
  predicate text not null,
  relation_id text references relations(relation_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists user_corrections (
  correction_id text primary key,
  session_id text references conversation_sessions(session_id) on delete set null,
  target_type text not null,
  target_id text not null,
  correction_text text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists idx_concepts_paper_id on concepts(paper_id);
create index if not exists idx_concepts_type on concepts(type);
create index if not exists idx_concepts_dsr_layer on concepts(dsr_layer);
create index if not exists idx_evidence_items_paper_id on evidence_items(paper_id);
create index if not exists idx_relations_predicate on relations(predicate);
create index if not exists idx_relations_source_concept_id on relations(source_concept_id);
create index if not exists idx_relations_target_concept_id on relations(target_concept_id);
create index if not exists idx_generated_flows_session_id on generated_flows(session_id);
create index if not exists idx_flow_nodes_flow_id on flow_nodes(flow_id);
create index if not exists idx_flow_edges_flow_id on flow_edges(flow_id);
