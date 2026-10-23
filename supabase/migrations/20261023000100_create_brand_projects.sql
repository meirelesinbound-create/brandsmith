-- BRANDSMITH cloud persistence foundation
-- Each row belongs to one authenticated user. RLS is the access boundary.

create table if not exists public.brand_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  category text not null default 'A definir',
  stage text not null default 'Ponto de partida',
  color text not null default 'lime',
  investigation_answers jsonb not null default '[]'::jsonb
    check (jsonb_typeof(investigation_answers) = 'array'),
  interpretation_notes text not null default '',
  direction_notes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(direction_notes) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_projects_owner_updated_idx
  on public.brand_projects (owner_id, updated_at desc);

alter table public.brand_projects enable row level security;

drop policy if exists "Users can read their own brand projects" on public.brand_projects;
create policy "Users can read their own brand projects"
  on public.brand_projects for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can create their own brand projects" on public.brand_projects;
create policy "Users can create their own brand projects"
  on public.brand_projects for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own brand projects" on public.brand_projects;
create policy "Users can update their own brand projects"
  on public.brand_projects for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own brand projects" on public.brand_projects;
create policy "Users can delete their own brand projects"
  on public.brand_projects for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.set_brand_projects_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_brand_projects_updated_at on public.brand_projects;
create trigger set_brand_projects_updated_at
  before update on public.brand_projects
  for each row execute function public.set_brand_projects_updated_at();

comment on table public.brand_projects is
  'BRANDSMITH project workspace. JSON fields store the evolving investigation and strategic working notes.';
