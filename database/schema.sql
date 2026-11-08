// Block A: Tables
-- Profiles (one per signed-up user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  location text,
  push_token text,
  created_at timestamptz not null default now()
);

-- Skills offered by users
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  category text not null,
  description text,
  location text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- Service requests (user_id = who asked, provider_id = who is asked)
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  title text not null,
  description text,
  category text,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','completed')),
  created_at timestamptz not null default now()
);

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  check (reviewer_id <> provider_id)
);

// Block B: Automatic profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

// Block C: Policies
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;

-- PROFILES: any signed-in user can read; only you can edit yours
create policy "profiles readable" on public.profiles
  for select to authenticated using (true);
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- SKILLS: everyone reads; only the owner writes
create policy "skills readable" on public.skills
  for select to authenticated using (true);
create policy "skills insert own" on public.skills
  for insert to authenticated with check (auth.uid() = user_id);
create policy "skills update own" on public.skills
  for update to authenticated using (auth.uid() = user_id);
create policy "skills delete own" on public.skills
  for delete to authenticated using (auth.uid() = user_id);

-- SERVICE REQUESTS: only the requester and the provider can see or change them
create policy "requests visible to both" on public.service_requests
  for select to authenticated
  using (auth.uid() = user_id or auth.uid() = provider_id);
create policy "requests insert own" on public.service_requests
  for insert to authenticated with check (auth.uid() = user_id);
create policy "requests update by both" on public.service_requests
  for update to authenticated
  using (auth.uid() = user_id or auth.uid() = provider_id);
create policy "requests delete own" on public.service_requests
  for delete to authenticated using (auth.uid() = user_id);

-- REVIEWS: everyone reads; you can only write as yourself
create policy "reviews readable" on public.reviews
  for select to authenticated using (true);
create policy "reviews insert own" on public.reviews
  for insert to authenticated with check (auth.uid() = reviewer_id);
create policy "reviews delete own" on public.reviews
  for delete to authenticated using (auth.uid() = reviewer_id);

//Create table and RLS policies 
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skills(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  preferred_date date,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

alter table service_requests enable row level security;

-- Both sides can see a request.
create policy "Parties view their requests"
  on service_requests for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = provider_id);

-- Only the requester can create, and cannot request their own skill.
create policy "Requester creates request"
  on service_requests for insert to authenticated
  with check (auth.uid() = requester_id and requester_id <> provider_id);

-- Either side can update (status changes).
create policy "Parties update their requests"
  on service_requests for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = provider_id);

-- Requester can delete their own request.
create policy "Requester deletes request"
  on service_requests for delete to authenticated
  using (auth.uid() = requester_id);

-- =========================================================
-- Push notifications (US10)
-- =========================================================

create table if not exists push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

drop policy if exists "Users manage own tokens" on push_tokens;
create policy "Users manage own tokens"
  on push_tokens for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sends an Expo push to the requester when the provider
-- accepts, declines or completes a request.
create extension if not exists pg_net with schema extensions;

create or replace function notify_request_response()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  skill text;
  msg text;
  payload jsonb;
begin
  if new.status = old.status then return new; end if;
  if new.status not in ('accepted', 'declined', 'completed') then return new; end if;

  select skill_name into skill from skills where id = new.skill_id;

  msg := case new.status
    when 'accepted'  then 'Your request for "' || coalesce(skill, 'a skill') || '" was accepted.'
    when 'declined'  then 'Your request for "' || coalesce(skill, 'a skill') || '" was declined.'
    else                  'Your request for "' || coalesce(skill, 'a skill') || '" was marked completed.'
  end;

  select jsonb_agg(jsonb_build_object(
           'to', token,
           'title', 'Request update',
           'body', msg,
           'sound', 'default',
           'channelId', 'default',
           'data', jsonb_build_object('requestId', new.id)
         ))
    into payload
    from push_tokens
   where user_id = new.requester_id;

  if payload is not null then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := payload
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_request_response on service_requests;
create trigger trg_notify_request_response
  after update of status on service_requests
  for each row execute function notify_request_response();