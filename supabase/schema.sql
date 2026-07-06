-- =============================================================
-- 佛教功課紀錄 App — 資料庫 Schema
-- 在 Supabase 後台 SQL Editor 貼上並執行（整份一次執行即可）。
-- 可重複執行（drop if exists / create or replace）。
-- =============================================================

-- ---------- 資料表 ----------

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 一個人可綁定多台裝置（device_uid = auth.uid()）
create table if not exists public.user_devices (
  device_uid uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_devices_user on public.user_devices(user_id);

-- 跨裝置配對碼
create table if not exists public.pairing_codes (
  code text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  share_slug text not null unique,
  start_date date,
  end_date date,
  privacy_mode text not null default 'totals_only'
    check (privacy_mode in ('totals_only','top3','show_all')),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.project_leaders (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (project_id, user_id)
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  target_count integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_items_project on public.items(project_id);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  delta integer not null,
  recorded_at timestamptz not null default now(),
  record_date date not null
);
create index if not exists idx_records_item on public.records(item_id);
create index if not exists idx_records_project_date on public.records(project_id, record_date);
create index if not exists idx_records_user on public.records(user_id);

-- ---------- 輔助函式 ----------

-- 目前這台裝置對應的「人」ID
create or replace function public.current_person_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select user_id from public.user_devices where device_uid = auth.uid();
$$;

create or replace function public.app_is_member(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.project_members
    where project_id = p_project_id and user_id = public.current_person_id()
  );
$$;

create or replace function public.app_is_leader(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.project_leaders
    where project_id = p_project_id and user_id = public.current_person_id()
  );
$$;

-- ---------- 啟用 RLS ----------
alter table public.users enable row level security;
alter table public.user_devices enable row level security;
alter table public.pairing_codes enable row level security;
alter table public.projects enable row level security;
alter table public.project_leaders enable row level security;
alter table public.project_members enable row level security;
alter table public.items enable row level security;
alter table public.records enable row level security;

-- users：只能讀寫自己
drop policy if exists users_select on public.users;
create policy users_select on public.users for select
  using (id = public.current_person_id());
drop policy if exists users_update on public.users;
create policy users_update on public.users for update
  using (id = public.current_person_id());

-- user_devices / pairing_codes：只透過 RPC 存取，前端不可直接讀寫（RLS 開啟且無政策＝全擋）

-- projects
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select
  using (public.app_is_member(id));
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update
  using (public.app_is_leader(id));

-- project_leaders：成員可看
drop policy if exists leaders_select on public.project_leaders;
create policy leaders_select on public.project_leaders for select
  using (public.app_is_member(project_id));

-- project_members：可看自己的會籍
drop policy if exists members_select on public.project_members;
create policy members_select on public.project_members for select
  using (user_id = public.current_person_id());

-- items：成員可看，組長可增修刪
drop policy if exists items_select on public.items;
create policy items_select on public.items for select
  using (public.app_is_member(project_id));
drop policy if exists items_insert on public.items;
create policy items_insert on public.items for insert
  with check (public.app_is_leader(project_id));
drop policy if exists items_update on public.items;
create policy items_update on public.items for update
  using (public.app_is_leader(project_id));
drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete
  using (public.app_is_leader(project_id));

-- records：只讀寫自己的，且需為該專案成員
drop policy if exists records_select on public.records;
create policy records_select on public.records for select
  using (user_id = public.current_person_id());
drop policy if exists records_insert on public.records;
create policy records_insert on public.records for insert
  with check (user_id = public.current_person_id() and public.app_is_member(project_id));

-- ---------- RPC：身分 ----------

drop function if exists public.current_person();
create function public.current_person()
returns setof public.users
language sql stable security definer set search_path = public as $$
  select u.* from public.users u
  join public.user_devices d on d.user_id = u.id
  where d.device_uid = auth.uid();
$$;

create or replace function public.create_person(p_name text, p_settings jsonb)
returns public.users
language plpgsql security definer set search_path = public as $$
declare
  v_existing uuid;
  v_user public.users;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select user_id into v_existing from public.user_devices where device_uid = auth.uid();
  if v_existing is not null then
    select * into v_user from public.users where id = v_existing;
    return v_user;
  end if;
  insert into public.users(display_name, settings)
    values (coalesce(nullif(trim(p_name), ''), 'Anonymous'), coalesce(p_settings, '{}'::jsonb))
    returning * into v_user;
  insert into public.user_devices(device_uid, user_id) values (auth.uid(), v_user.id);
  return v_user;
end;
$$;

-- ---------- RPC：配對碼 ----------

create or replace function public.generate_pairing_code()
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_person uuid;
  v_code text;
  v_try int := 0;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no_person'; end if;
  delete from public.pairing_codes where expires_at < now();
  delete from public.pairing_codes where user_id = v_person;
  loop
    v_try := v_try + 1;
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    begin
      insert into public.pairing_codes(code, user_id, expires_at)
        values (v_code, v_person, now() + interval '10 minutes');
      return v_code;
    exception when unique_violation then
      if v_try > 20 then raise exception 'code_generation_failed'; end if;
    end;
  end loop;
end;
$$;

create or replace function public.redeem_pairing_code(p_code text)
returns public.users
language plpgsql security definer set search_path = public as $$
declare
  v_target uuid;
  v_old uuid;
  v_user public.users;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from public.pairing_codes where expires_at < now();
  select user_id into v_target from public.pairing_codes where code = p_code;
  if v_target is null then raise exception 'invalid_code'; end if;
  select user_id into v_old from public.user_devices where device_uid = auth.uid();
  if v_old is null then
    insert into public.user_devices(device_uid, user_id) values (auth.uid(), v_target);
  elsif v_old <> v_target then
    update public.user_devices set user_id = v_target where device_uid = auth.uid();
    -- 若舊的人已無任何裝置，清除其空資料
    delete from public.users u
      where u.id = v_old
        and not exists (select 1 from public.user_devices d where d.user_id = u.id)
        and not exists (select 1 from public.records r where r.user_id = u.id)
        and not exists (select 1 from public.project_members m where m.user_id = u.id);
  end if;
  delete from public.pairing_codes where code = p_code;
  select * into v_user from public.users where id = v_target;
  return v_user;
end;
$$;

-- ---------- RPC：專案 ----------

create or replace function public.create_project(
  p_name text, p_description text, p_start date, p_end date, p_privacy text
)
returns public.projects
language plpgsql security definer set search_path = public as $$
declare
  v_person uuid;
  v_proj public.projects;
  v_slug text;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no_person'; end if;
  loop
    v_slug := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.projects where share_slug = v_slug);
  end loop;
  insert into public.projects(name, description, share_slug, start_date, end_date, privacy_mode, created_by)
    values (
      coalesce(nullif(trim(p_name), ''), 'Group'),
      nullif(trim(coalesce(p_description, '')), ''),
      v_slug, p_start, p_end,
      coalesce(p_privacy, 'totals_only'), v_person
    )
    returning * into v_proj;
  insert into public.project_leaders(project_id, user_id) values (v_proj.id, v_person);
  insert into public.project_members(project_id, user_id) values (v_proj.id, v_person);
  return v_proj;
end;
$$;

-- 加入前預覽（用分享短碼）
create or replace function public.get_project_by_slug(p_slug text)
returns table(id uuid, name text, description text, already_member boolean, same_name boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_person uuid;
  v_name text;
  v_pid uuid;
begin
  select p.id into v_pid from public.projects p where p.share_slug = p_slug;
  if v_pid is null then return; end if;
  v_person := public.current_person_id();
  select display_name into v_name from public.users where users.id = v_person;
  return query
    select p.id, p.name, p.description,
      exists(select 1 from public.project_members m where m.project_id = p.id and m.user_id = v_person),
      exists(select 1 from public.project_members m join public.users u on u.id = m.user_id
             where m.project_id = p.id and u.display_name = v_name and m.user_id <> v_person)
    from public.projects p where p.id = v_pid;
end;
$$;

create or replace function public.join_project(p_slug text)
returns public.projects
language plpgsql security definer set search_path = public as $$
declare
  v_person uuid;
  v_proj public.projects;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no_person'; end if;
  select * into v_proj from public.projects where share_slug = p_slug;
  if v_proj.id is null then raise exception 'not_found'; end if;
  insert into public.project_members(project_id, user_id)
    values (v_proj.id, v_person)
    on conflict do nothing;
  return v_proj;
end;
$$;

-- 我參與的所有專案（含是否為組長）
create or replace function public.get_my_projects()
returns table(
  id uuid, name text, description text, share_slug text,
  start_date date, end_date date, privacy_mode text,
  created_by uuid, created_at timestamptz, is_leader boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.description, p.share_slug,
    p.start_date, p.end_date, p.privacy_mode, p.created_by, p.created_at,
    exists(select 1 from public.project_leaders l where l.project_id = p.id and l.user_id = public.current_person_id())
  from public.projects p
  join public.project_members m on m.project_id = p.id
  where m.user_id = public.current_person_id()
  order by p.created_at desc;
$$;

-- 組長：查看成員清單
create or replace function public.get_members(p_project_id uuid)
returns table(user_id uuid, display_name text, is_leader boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.app_is_member(p_project_id) then raise exception 'forbidden'; end if;
  return query
    select m.user_id, u.display_name,
      exists(select 1 from public.project_leaders l where l.project_id = p_project_id and l.user_id = m.user_id)
    from public.project_members m
    join public.users u on u.id = m.user_id
    where m.project_id = p_project_id
    order by u.display_name;
end;
$$;

-- 組長：設定/取消共同組長
create or replace function public.set_project_leader(p_project_id uuid, p_user_id uuid, p_is_leader boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.app_is_leader(p_project_id) then raise exception 'forbidden'; end if;
  if p_is_leader then
    insert into public.project_leaders(project_id, user_id) values (p_project_id, p_user_id)
      on conflict do nothing;
  else
    -- 至少保留一位組長
    if (select count(*) from public.project_leaders where project_id = p_project_id) <= 1 then
      raise exception 'last_leader';
    end if;
    delete from public.project_leaders where project_id = p_project_id and user_id = p_user_id;
  end if;
end;
$$;

-- ---------- RPC：記錄與統計 ----------

-- 記錄畫面：每個項目的 今天 / 我的累計 / 全組累計
create or replace function public.get_record_view(p_project_id uuid, p_today date)
returns table(
  item_id uuid, item_name text, target_count integer, sort_order integer,
  my_today bigint, my_total bigint, group_total bigint
)
language plpgsql stable security definer set search_path = public as $$
declare v_person uuid;
begin
  if not public.app_is_member(p_project_id) then raise exception 'forbidden'; end if;
  v_person := public.current_person_id();
  return query
    select i.id, i.name, i.target_count, i.sort_order,
      coalesce(sum(r.delta) filter (where r.user_id = v_person and r.record_date = p_today), 0),
      coalesce(sum(r.delta) filter (where r.user_id = v_person), 0),
      coalesce(sum(r.delta), 0)
    from public.items i
    left join public.records r on r.item_id = i.id
    where i.project_id = p_project_id and i.is_active
    group by i.id, i.name, i.target_count, i.sort_order
    order by i.sort_order, i.created_at;
end;
$$;

-- 區間統計：每個項目 我的 / 全組 加總（p_from / p_to 為 null 代表不限）
create or replace function public.get_item_stats(p_project_id uuid, p_from date, p_to date)
returns table(
  item_id uuid, item_name text, target_count integer, sort_order integer,
  my_sum bigint, group_sum bigint
)
language plpgsql stable security definer set search_path = public as $$
declare v_person uuid;
begin
  if not public.app_is_member(p_project_id) then raise exception 'forbidden'; end if;
  v_person := public.current_person_id();
  return query
    select i.id, i.name, i.target_count, i.sort_order,
      coalesce(sum(r.delta) filter (where r.user_id = v_person), 0),
      coalesce(sum(r.delta), 0)
    from public.items i
    left join public.records r on r.item_id = i.id
      and (p_from is null or r.record_date >= p_from)
      and (p_to is null or r.record_date <= p_to)
    where i.project_id = p_project_id and i.is_active
    group by i.id, i.name, i.target_count, i.sort_order
    order by i.sort_order, i.created_at;
end;
$$;

-- 排行榜（依隱私模式）
create or replace function public.get_ranking(p_project_id uuid, p_from date, p_to date)
returns table(display_name text, total bigint, is_me boolean, rnk bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  v_person uuid;
  v_privacy text;
  v_limit int;
begin
  if not public.app_is_member(p_project_id) then raise exception 'forbidden'; end if;
  v_person := public.current_person_id();
  select privacy_mode into v_privacy from public.projects where id = p_project_id;
  if v_privacy = 'totals_only' then
    return; -- 不公開個人
  elsif v_privacy = 'top3' then
    v_limit := 3;
  else
    v_limit := 1000000;
  end if;
  return query
    with totals as (
      select m.user_id, u.display_name, coalesce(sum(r.delta), 0) as total
      from public.project_members m
      join public.users u on u.id = m.user_id
      left join public.records r on r.user_id = m.user_id and r.project_id = p_project_id
        and (p_from is null or r.record_date >= p_from)
        and (p_to is null or r.record_date <= p_to)
      where m.project_id = p_project_id
      group by m.user_id, u.display_name
    )
    select t.display_name, t.total, (t.user_id = v_person),
      row_number() over (order by t.total desc)
    from totals t
    where t.total > 0
    order by t.total desc
    limit v_limit;
end;
$$;

-- 個人總覽：跨所有專案的每項功課完成狀況
create or replace function public.get_profile_summary()
returns table(
  project_id uuid, project_name text, is_leader boolean,
  item_id uuid, item_name text, target_count integer,
  my_total bigint, group_total bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, p.name,
    exists(select 1 from public.project_leaders l where l.project_id = p.id and l.user_id = public.current_person_id()),
    i.id, i.name, i.target_count,
    coalesce(sum(r.delta) filter (where r.user_id = public.current_person_id()), 0),
    coalesce(sum(r.delta), 0)
  from public.projects p
  join public.project_members me on me.project_id = p.id and me.user_id = public.current_person_id()
  join public.items i on i.project_id = p.id and i.is_active
  left join public.records r on r.item_id = i.id
  group by p.id, p.name, i.id, i.name, i.target_count, i.sort_order, p.created_at
  order by p.created_at desc, i.sort_order;
$$;

-- ---------- 權限 ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- 完成！
