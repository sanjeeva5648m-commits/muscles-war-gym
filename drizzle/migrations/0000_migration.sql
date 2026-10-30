create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- First account ever created becomes the owner; later sign-ups get no role.
create or replace function public.claim_first_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_owner after insert on auth.users
for each row execute function public.claim_first_owner();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.business_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'The Muscle''s War Gym',
  tagline text not null default 'Train with purpose. Build your strength.',
  description text not null default '',
  phone text not null default '+91 82192 95600',
  whatsapp text not null default '918219295600',
  email text,
  address text not null default 'Opposite Ghumarwin Bridge, Ghumarwin, Himachal Pradesh 174021, India',
  hours jsonb not null default '[]'::jsonb,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  reviews_url text,
  updated_at timestamptz not null default now()
);
insert into public.business_settings (id) values (1);
grant select on public.business_settings to anon, authenticated;
grant update on public.business_settings to authenticated;
grant all on public.business_settings to service_role;
alter table public.business_settings enable row level security;
create policy "public read settings" on public.business_settings for select using (true);
create policy "owner update settings" on public.business_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_settings before update on public.business_settings for each row execute function public.touch_updated_at();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null default '' check (char_length(category) <= 80),
  description text not null default '' check (char_length(description) <= 2000),
  image_path text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  brand text not null default '' check (char_length(brand) <= 80),
  category text not null default '' check (char_length(category) <= 80),
  package_size text not null default '' check (char_length(package_size) <= 60),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(10,2) check (price is null or price >= 0),
  available boolean not null default true,
  image_path text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text not null default '' check (char_length(caption) <= 200),
  is_actual_gym boolean not null default true,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['services','machines','products','gallery'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read published" on public.%I for select using (published or public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "owner insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "owner update" on public.%I for update to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "owner delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''))', t);
    execute format('create trigger t_%s before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^\+?[0-9 ]{10,16}$'),
  category text not null check (category in ('Membership','Personal training','Supplements','General')),
  message text check (message is null or char_length(message) <= 1000),
  consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "anyone submit enquiry" on public.enquiries for insert to anon, authenticated with check (status = 'new');
create policy "owner read enquiries" on public.enquiries for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "owner update enquiries" on public.enquiries for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "owner delete enquiries" on public.enquiries for delete to authenticated using (public.has_role(auth.uid(),'admin'));