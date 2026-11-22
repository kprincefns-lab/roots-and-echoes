-- ============================================================================
-- Roots & Echoes — Living 3D Family Tree & Generational Archive
-- Supabase PostgreSQL Schema & Storage Bucket Setup
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_family_members_generation
  on public.family_members (generation asc, birth_year asc);

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

-- Enable Row Level Security (public read; writes mediated via server API with service_role)
alter table public.family_members enable row level security;

drop policy if exists "Public read access to family archive" on public.family_members;
create policy "Public read access to family archive"
  on public.family_members
  for select
  using (true);

-- 2. Family Media Storage Bucket (portraits & memory gallery photos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-media',
  'family-media',
  true,
  10485760, -- 10 MB per image
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for family-media" on storage.objects;
create policy "Public read access for family-media"
  on storage.objects
  for select
  using (bucket_id = 'family-media');
