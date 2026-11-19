create schema if not exists hop;

create table hop.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique not null,
  email text,
  name text not null,
  hall text,
  phone text,
  is_demo boolean not null default false,
  demo_group uuid,
  nexconn_id text unique not null,
  created_at timestamptz not null default now()
);

create table hop.lobbies (
  id uuid primary key default gen_random_uuid(),
  destination text not null check (destination in ('CCU','HWH','SRC','KGP')),
  direction text not null check (direction in ('out','back')),
  travel_date date not null,
  is_demo boolean not null default false,
  demo_owner uuid,
  channel_id text unique not null,
  channel_ready boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index lobbies_real_uq on hop.lobbies (destination, direction, travel_date) where not is_demo;
create unique index lobbies_demo_uq on hop.lobbies (demo_owner, destination, direction, travel_date) where is_demo;

create table hop.intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hop.users(id),
  lobby_id uuid not null references hop.lobbies(id),
  window_key text not null,
  bags smallint not null check (bags between 0 and 6),
  message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lobby_id)
);

create table hop.proposals (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references hop.lobbies(id),
  creator_id uuid not null references hop.users(id),
  depart_at timestamptz not null,
  meeting_point text not null,
  vehicle text not null check (vehicle in ('toto','sedan','suv')),
  total_fare int not null check (total_fare between 1 and 20000),
  seats smallint not null check (seats between 2 and 6),
  status text not null default 'open' check (status in ('open','locked','cancelled')),
  message_id text,
  created_at timestamptz not null default now()
);

create table hop.votes (
  proposal_id uuid not null references hop.proposals(id),
  user_id uuid not null references hop.users(id),
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

create table hop.pods (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid unique not null references hop.proposals(id),
  channel_id text unique not null,
  status text not null default 'pending' check (status in ('pending','live','archived')),
  ticket_message_id text,
  lease_until timestamptz,
  created_at timestamptz not null default now()
);

create table hop.pod_members (
  pod_id uuid not null references hop.pods(id),
  user_id uuid not null references hop.users(id),
  status text not null check (status in ('in','left')),
  joined_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);

create table hop.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hop.users(id),
  pod_id uuid not null references hop.pods(id),
  rating smallint not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create table hop.events (
  id bigserial primary key,
  user_id uuid,
  name text not null,
  ms int,
  created_at timestamptz not null default now()
);

create table hop.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

alter table hop.users enable row level security;
alter table hop.lobbies enable row level security;
alter table hop.intents enable row level security;
alter table hop.proposals enable row level security;
alter table hop.votes enable row level security;
alter table hop.pods enable row level security;
alter table hop.pod_members enable row level security;
alter table hop.feedback enable row level security;
alter table hop.events enable row level security;
alter table hop.rate_limits enable row level security;
