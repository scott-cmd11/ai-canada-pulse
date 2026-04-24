-- quotes table: Canadian government AI quotes archive
-- Source of truth for both pending (awaiting review) and approved/rejected quotes.
-- Public reads go through an Upstash cache layer; this table is the audit trail.

create table if not exists public.quotes (
  id                 uuid primary key default gen_random_uuid(),
  source_type        text not null check (source_type in (
                        'federal_hansard','senate','canada_news',
                        'provincial_hansard_on','provincial_hansard_qc',
                        'provincial_hansard_bc','provincial_hansard_ab',
                        'manual'
                      )),
  source_url         text,
  source_fetched_at  timestamptz not null default now(),
  speaker_name       text not null,
  speaker_role       text,
  party              text,
  chamber            text check (chamber in ('house','senate','provincial_legislature','executive')),
  jurisdiction       text not null check (jurisdiction in ('federal','on','qc','bc','ab')),
  quote_date         date,
  quote_text         text not null,
  context_excerpt    text,
  topics             text[] default '{}',
  language           text default 'en' check (language in ('en','fr')),
  status             text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at       timestamptz not null default now(),
  reviewed_at        timestamptz,
  editor_notes       text,
  dedup_hash         text not null unique
);

create index if not exists quotes_status_date_idx    on public.quotes (status, quote_date desc nulls last);
create index if not exists quotes_status_submitted   on public.quotes (status, submitted_at desc);
create index if not exists quotes_jurisdiction_idx   on public.quotes (jurisdiction);
create index if not exists quotes_party_idx          on public.quotes (party);

-- Row Level Security: all access goes through the service role key on the
-- Next.js server, so RLS can stay enabled with no permissive policies. The
-- browser never talks to Supabase directly.
alter table public.quotes enable row level security;

comment on table  public.quotes              is 'Canadian government AI quotes archive (federal + provincial + civil service). Reviewed before publication.';
comment on column public.quotes.dedup_hash   is 'sha256(source_url + quote_text[0:200]) — prevents re-ingesting the same quote.';
comment on column public.quotes.status       is 'pending (in review) | approved (public) | rejected (hidden).';
