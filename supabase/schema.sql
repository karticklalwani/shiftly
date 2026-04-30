create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  created_at timestamptz default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  full_name text not null,
  login_code text not null,
  role text not null check (role in ('owner','admin','manager','employee')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, login_code)
);