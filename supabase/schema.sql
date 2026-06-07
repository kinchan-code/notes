-- ============================================================
-- Pa Notes — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- profiles: mirrors auth.users, auto-populated via trigger
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
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

alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_shares enable row level security;

-- profiles: any authenticated user can read (needed for share-by-email lookup)
create policy "profiles: authenticated read" on profiles
  for select using (auth.role() = 'authenticated');

-- documents: owner full access
create policy "documents: owner all" on documents
  for all using (owner_id = auth.uid());

-- documents: shared users can read
create policy "documents: shared read" on documents
  for select using (
    exists (
      select 1 from document_shares
      where document_id = documents.id
        and shared_with_user_id = auth.uid()
    )
  );

-- documents: shared editors can update content
create policy "documents: editor update" on documents
  for update using (
    exists (
      select 1 from document_shares
      where document_id = documents.id
        and shared_with_user_id = auth.uid()
        and role = 'editor'
    )
  );

-- document_shares: owner can manage
create policy "shares: owner manage" on document_shares
  for all using (
    exists (
      select 1 from documents
      where id = document_shares.document_id
        and owner_id = auth.uid()
    )
  );

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
