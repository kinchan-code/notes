-- ============================================================
-- Pa Notes — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- profiles: mirrors auth.users, auto-populated via trigger
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- trigger to create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Untitled',
  content_html text default '',
  content_text text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- document_shares
create table if not exists document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  shared_with_user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  created_by uuid not null references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(document_id, shared_with_user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Security-definer helpers avoid infinite recursion between
-- documents <-> document_shares policies (Postgres error 42P17).
create or replace function public.is_document_owner(doc_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.documents d
    where d.id = doc_id and d.owner_id = auth.uid()
  );
$$;

create or replace function public.user_has_document_share(doc_id uuid, required_role text default null)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.document_shares ds
    where ds.document_id = doc_id
      and ds.shared_with_user_id = auth.uid()
      and (required_role is null or ds.role = required_role)
  );
$$;

alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_shares enable row level security;

-- profiles: any authenticated user can read (needed for share-by-email lookup)
create policy "profiles: authenticated read" on profiles
  for select using (auth.role() = 'authenticated');

-- profiles: users can update their own profile
create policy "profiles: self update" on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- avatars storage bucket (public read for profile images)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "avatars: owner insert" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars: owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- documents: owner full access
create policy "documents: owner all" on documents
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- documents: shared users can read
create policy "documents: shared read" on documents
  for select using (user_has_document_share(id));

-- documents: shared editors can update content
create policy "documents: editor update" on documents
  for update using (user_has_document_share(id, 'editor'));

-- document_shares: owner can manage
create policy "shares: owner manage" on document_shares
  for all using (is_document_owner(document_id));

-- document_shares: shared user can see their own shares
create policy "shares: self read" on document_shares
  for select using (shared_with_user_id = auth.uid());

-- ============================================================
-- updated_at trigger helper
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on documents
  for each row execute procedure set_updated_at();

create trigger shares_updated_at
  before update on document_shares
  for each row execute procedure set_updated_at();
