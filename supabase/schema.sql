-- ============================================================================
-- Roots & Echoes — Living 3D Family Tree & Generational Archive
-- Supabase PostgreSQL Schema, Ownership, Access Requests & Private Storage
-- ============================================================================

-- 1. Family Members Table
create table if not exists public.family_members (
  id text primary key,
  first_name text not null,
  last_name text not null,
  maiden_name text,
  birth_year integer not null,
  passing_year integer,
  birth_place text,
  occupation text,
  generation integer not null default 0,
  portrait_url text not null,
  spirit_animal text check (spirit_animal is null or spirit_animal in ('panther', 'bird', 'owl')),
  parent_ids text[] not null default '{}',
  partner_ids text[] not null default '{}',
  children_ids text[] not null default '{}',
  bio text not null default '',
  milestones jsonb not null default '[]'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  beliefs jsonb not null default '{}'::jsonb,
  health jsonb not null default '{}'::jsonb,
  persona jsonb not null default '{}'::jsonb,
  owner_email text,
  submitted_by text,
  approved_viewer_emails text[] not null default '{}',
  is_public_to_family boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe idempotent column additions for existing deployments
alter table public.family_members add column if not exists owner_email text;
alter table public.family_members add column if not exists submitted_by text;
alter table public.family_members add column if not exists approved_viewer_emails text[] not null default '{}';
alter table public.family_members add column if not exists is_public_to_family boolean not null default false;

create index if not exists idx_family_members_generation
  on public.family_members (generation asc, birth_year asc);

create index if not exists idx_family_members_owner
  on public.family_members (owner_email);

-- Automatically maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_family_members_updated_at on public.family_members;
create trigger trg_family_members_updated_at
  before update on public.family_members
  for each row
  execute function public.set_updated_at();

-- 2. Access & Ownership Requests Table
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.family_members(id) on delete cascade,
  requester_email text not null,
  requester_name text,
  note text,
  request_type text not null default 'view' check (request_type in ('view', 'claim')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  unique (member_id, requester_email)
);

alter table public.access_requests add column if not exists request_type text not null default 'view';

create index if not exists idx_access_requests_member_status
  on public.access_requests (member_id, status);

create index if not exists idx_access_requests_requester
  on public.access_requests (requester_email);

-- 3. Strict Row Level Security (Authenticated Users Only — Zero Anonymous Reads)
alter table public.family_members enable row level security;

drop policy if exists "Public read access to family archive" on public.family_members;
drop policy if exists "Authenticated read access to family archive" on public.family_members;
create policy "Authenticated read access to family archive"
  on public.family_members
  for select
  to authenticated
  using (true);

alter table public.access_requests enable row level security;

drop policy if exists "Authenticated read own or owned access requests" on public.access_requests;
create policy "Authenticated read own or owned access requests"
  on public.access_requests
  for select
  to authenticated
  using (
    lower(requester_email) = lower(auth.jwt() ->> 'email')
    or exists (
      select 1
      from public.family_members fm
      where fm.id = access_requests.member_id
        and lower(fm.owner_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 4. Private Family Media Storage Bucket (Signed URLs Only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-media',
  'family-media',
  false,
  10485760, -- 10 MB per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for family-media" on storage.objects;
drop policy if exists "Authenticated read access for family-media" on storage.objects;
create policy "Authenticated read access for family-media"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'family-media');
