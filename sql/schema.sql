create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('read_only', 'editor', 'super_user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists personnel (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  job_title text not null,
  area text not null,
  notes text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  individual_risk_override integer null,
  created_by uuid null references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references personnel(id) on delete cascade,
  incident_date date not null,
  incident_type text not null,
  severity text not null check (severity in ('Low','Moderate','High','Critical')),
  description text not null default '',
  proximity_category text not null default 'Indirect',
  on_shift boolean not null default false,
  directly_involved boolean not null default false,
  witnessed_scene boolean not null default false,
  body_recovery boolean not null default false,
  line_of_sight_only boolean not null default false,
  multi_fatality boolean not null default false,
  media_interest boolean not null default false,
  colleague_involved boolean not null default false,
  child_involved boolean not null default false,
  created_by uuid null references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk_matrix (
  key text primary key,
  label text not null,
  score_value integer not null default 0,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into risk_matrix (key, label, score_value, is_enabled, sort_order) values
('severity_low', 'Severity: Low', 1, true, 10),
('severity_moderate', 'Severity: Moderate', 3, true, 20),
('severity_high', 'Severity: High', 6, true, 30),
('severity_critical', 'Severity: Critical', 10, true, 40),
('within_30_days', 'Repeat exposure within 30 days', 5, true, 50),
('within_90_days', 'Repeat exposure within 90 days', 3, true, 60),
('on_shift', 'On shift at time of incident', 1, true, 70),
('directly_involved', 'Directly involved', 4, true, 80),
('witnessed_scene', 'Witnessed scene at close proximity', 3, true, 90),
('body_recovery', 'Body recovery / body management involvement', 5, true, 100),
('line_of_sight_only', 'Line of sight only / indirect exposure', 1, true, 110),
('multi_fatality', 'Multiple casualties / fatalities', 5, true, 120),
('media_interest', 'Significant media interest', 2, true, 130),
('colleague_involved', 'Colleague known to staff involved', 3, true, 140),
('child_involved', 'Child involved', 4, true, 150)
on conflict (key) do nothing;

-- Replace the password hashes before production use.
insert into app_users (username, display_name, password_hash, role) values
('viewer1', 'Viewer One', '$2a$10$replace_me', 'read_only'),
('editor1', 'Editor One', '$2a$10$replace_me', 'editor'),
('super1', 'Super User', '$2a$10$replace_me', 'super_user')
on conflict (username) do nothing;
