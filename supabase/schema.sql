-- ============================================================
-- SHIFTLY — Esquema completo Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- TABLAS
-- ──────────────────────────────────────────────

create table if not exists companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists stores (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists departments (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  store_id    uuid references stores(id) on delete set null,
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists profiles (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete set null,
  company_id     uuid not null references companies(id) on delete cascade,
  store_id       uuid references stores(id) on delete set null,
  department_id  uuid references departments(id) on delete set null,
  full_name      text not null,
  login_code     text not null,
  role           text not null check (role in ('owner','admin','manager','employee')),
  created_at     timestamptz default now(),
  unique(company_id, login_code)
);

create table if not exists schedule_events (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references companies(id) on delete cascade,
  store_id        uuid references stores(id) on delete set null,
  employee_id     uuid not null references profiles(id) on delete cascade,
  manager_id      uuid not null references profiles(id),
  department_id   uuid references departments(id) on delete set null,
  title           text not null default 'Turno',
  shift_date      date not null,
  start_time      time not null,
  end_time        time not null,
  break_minutes   int not null default 15,
  lunch_minutes   int not null default 60,
  total_hours     numeric(5,2) not null default 0,
  notes           text default '',
  status          text not null default 'activo' check (status in ('activo','completado','pendiente','cancelado')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists shift_change_requests (
  id                      uuid primary key default uuid_generate_v4(),
  company_id              uuid not null references companies(id) on delete cascade,
  requester_employee_id   uuid not null references profiles(id),
  target_employee_id      uuid not null references profiles(id),
  current_shift_id        uuid not null references schedule_events(id),
  requested_shift_id      uuid not null references schedule_events(id),
  requested_change_date   date not null,
  reason                  text not null,
  additional_message      text default '',
  status                  text not null default 'pendiente' check (status in ('pendiente','aprobada','rechazada')),
  manager_response        text,
  reviewed_by             uuid references profiles(id),
  reviewed_at             timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create table if not exists conversations (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  created_at  timestamptz default now()
);

create table if not exists conversation_members (
  id               uuid primary key default uuid_generate_v4(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  created_at       timestamptz default now(),
  unique(conversation_id, user_id)
);

create table if not exists messages (
  id               uuid primary key default uuid_generate_v4(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null references profiles(id),
  receiver_id      uuid references profiles(id),
  message          text not null,
  read_at          timestamptz,
  created_at       timestamptz default now()
);

create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null check (type in ('shift_change','request_approved','request_rejected','new_message','new_request')),
  title       text not null,
  message     text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────

create index if not exists idx_profiles_user_id         on profiles(user_id);
create index if not exists idx_profiles_company_id      on profiles(company_id);
create index if not exists idx_schedule_company         on schedule_events(company_id);
create index if not exists idx_schedule_employee        on schedule_events(employee_id);
create index if not exists idx_schedule_date            on schedule_events(shift_date);
create index if not exists idx_requests_company         on shift_change_requests(company_id);
create index if not exists idx_messages_conv            on messages(conversation_id);
create index if not exists idx_notifications_user       on notifications(user_id);

-- ──────────────────────────────────────────────
-- REALTIME
-- ──────────────────────────────────────────────

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

alter table companies             enable row level security;
alter table stores                enable row level security;
alter table departments           enable row level security;
alter table profiles              enable row level security;
alter table schedule_events       enable row level security;
alter table shift_change_requests enable row level security;
alter table conversations         enable row level security;
alter table conversation_members  enable row level security;
alter table messages              enable row level security;
alter table notifications         enable row level security;

-- Helper: obtener company_id del usuario autenticado
create or replace function get_my_company_id()
returns uuid language sql stable security definer as $$
  select company_id from profiles where user_id = auth.uid() limit 1;
$$;

-- Helper: obtener profile_id del usuario autenticado
create or replace function get_my_profile_id()
returns uuid language sql stable security definer as $$
  select id from profiles where user_id = auth.uid() limit 1;
$$;

-- Helper: obtener rol del usuario autenticado
create or replace function get_my_role()
returns text language sql stable security definer as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$;

-- Helper: verificar rol mínimo
create or replace function has_min_role(min_role text)
returns boolean language sql stable security definer as $$
  select case
    when min_role = 'employee' then true
    when min_role = 'manager'  then get_my_role() in ('manager','admin','owner')
    when min_role = 'admin'    then get_my_role() in ('admin','owner')
    when min_role = 'owner'    then get_my_role() = 'owner'
    else false
  end;
$$;

-- ── Companies ──
create policy "Misma empresa" on companies for select
  using (id = get_my_company_id());

create policy "Owner edita empresa" on companies for update
  using (id = get_my_company_id() and get_my_role() in ('owner','admin'));

-- ── Stores ──
create policy "Ver tiendas empresa" on stores for all
  using (company_id = get_my_company_id());

-- ── Departments ──
create policy "Ver departamentos empresa" on departments for all
  using (company_id = get_my_company_id());

-- ── Profiles ──
create policy "Ver perfiles empresa" on profiles for select
  using (company_id = get_my_company_id());

create policy "Manager inserta profiles" on profiles for insert
  with check (company_id = get_my_company_id() and has_min_role('admin'));

create policy "Admin edita profiles" on profiles for update
  using (company_id = get_my_company_id() and has_min_role('admin'));

create policy "Admin elimina profiles" on profiles for delete
  using (company_id = get_my_company_id() and has_min_role('admin'));

-- ── Schedule events ──
create policy "Ver turnos empresa" on schedule_events for select
  using (company_id = get_my_company_id());

create policy "Manager crea turnos" on schedule_events for insert
  with check (company_id = get_my_company_id() and has_min_role('manager'));

create policy "Manager edita turnos" on schedule_events for update
  using (company_id = get_my_company_id() and has_min_role('manager'));

create policy "Manager elimina turnos" on schedule_events for delete
  using (company_id = get_my_company_id() and has_min_role('manager'));

-- ── Shift change requests ──
create policy "Ver solicitudes empresa" on shift_change_requests for select
  using (company_id = get_my_company_id());

create policy "Empleado crea solicitud" on shift_change_requests for insert
  with check (
    company_id = get_my_company_id()
    and requester_employee_id = get_my_profile_id()
  );

create policy "Manager revisa solicitud" on shift_change_requests for update
  using (company_id = get_my_company_id() and has_min_role('manager'));

-- ── Conversations ──
create policy "Ver conversaciones empresa" on conversations for select
  using (company_id = get_my_company_id());

create policy "Crear conversación empresa" on conversations for insert
  with check (company_id = get_my_company_id());

-- ── Conversation members ──
create policy "Ver miembros conversación" on conversation_members for select
  using (
    exists (
      select 1 from conversation_members cm
      join conversations c on c.id = cm.conversation_id
      where cm.user_id = get_my_profile_id()
        and c.company_id = get_my_company_id()
        and cm.conversation_id = conversation_members.conversation_id
    )
  );

create policy "Insertar miembros" on conversation_members for insert
  with check (
    exists (
      select 1 from conversations where id = conversation_id and company_id = get_my_company_id()
    )
  );

-- ── Messages ──
create policy "Ver mensajes propios" on messages for select
  using (
    exists (
      select 1 from conversation_members
      where conversation_id = messages.conversation_id
        and user_id = get_my_profile_id()
    )
  );

create policy "Enviar mensaje en conversación" on messages for insert
  with check (
    sender_id = get_my_profile_id()
    and exists (
      select 1 from conversation_members
      where conversation_id = messages.conversation_id
        and user_id = get_my_profile_id()
    )
  );

create policy "Marcar leído" on messages for update
  using (
    receiver_id = get_my_profile_id()
    or sender_id = get_my_profile_id()
  );

-- ── Notifications ──
create policy "Ver mis notificaciones" on notifications for select
  using (user_id = get_my_profile_id());

create policy "Sistema crea notificaciones" on notifications for insert
  with check (company_id = get_my_company_id());

create policy "Marcar notificación leída" on notifications for update
  using (user_id = get_my_profile_id());

-- ──────────────────────────────────────────────
-- DATOS INICIALES DE EJEMPLO
-- ──────────────────────────────────────────────
-- Ejecutar esto manualmente después para crear
-- la primera empresa y el primer usuario owner:
--
-- 1. Crear usuario en Supabase Auth:
--    Email: 936@em-fundgrube.local
--    Password: 123456
--
-- 2. insert into companies (name) values ('Mi Empresa') returning id;
--    -- Copiar el id generado (company_uuid)
--
-- 3. insert into profiles (user_id, company_id, full_name, login_code, role)
--    values ('<auth_user_id>', '<company_uuid>', 'Administrador', '936', 'owner');
