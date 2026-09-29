-- HACCP Control v3.9.2
-- Thawing / Defrost Control
-- Run ONCE after v3.9.1-notification-center.sql

begin;

create table if not exists public.thawing_standards (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  code text not null,
  name text not null,
  method text not null check (method in ('refrigeration','running_water','microwave','cook_from_frozen','other')),
  unit text not null default '°C',
  max_temperature numeric,
  monitoring_interval_minutes integer check (monitoring_interval_minutes is null or monitoring_interval_minutes between 15 and 1440),
  maximum_duration_minutes integer check (maximum_duration_minutes is null or maximum_duration_minutes between 15 and 10080),
  reminder_minutes integer not null default 15 check (reminder_minutes between 0 and 1440),
  overdue_grace_minutes integer not null default 30 check (overdue_grace_minutes between 0 and 1440),
  post_thaw_instruction text,
  verification_required boolean not null default false,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (kitchen_id, code)
);

create table if not exists public.thawing_batches (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  standard_id uuid not null references public.thawing_standards(id),
  product_name text not null,
  batch_reference text,
  quantity numeric,
  quantity_unit text,
  intended_use text,
  source_equipment_id uuid references public.equipment(id),
  thaw_equipment_id uuid references public.equipment(id),
  thaw_location text,
  started_at timestamptz not null default now(),
  expected_complete_at timestamptz,
  status text not null default 'active' check (status in ('active','ready','hold','discarded','cancelled')),
  completed_at timestamptz,
  completion_notes text,
  verification_status text not null default 'NOT_REQUIRED' check (verification_status in ('NOT_REQUIRED','PENDING','VERIFIED')),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  verification_notes text,
  created_by uuid not null references public.profiles(id),
  completed_by uuid references public.profiles(id),
  standard_code_snapshot text not null default '',
  standard_name_snapshot text not null default '',
  method_snapshot text not null default '',
  unit_snapshot text not null default '°C',
  max_temperature_snapshot numeric,
  monitoring_interval_minutes_snapshot integer,
  maximum_duration_minutes_snapshot integer,
  reminder_minutes_snapshot integer not null default 15,
  overdue_grace_minutes_snapshot integer not null default 30,
  post_thaw_instruction_snapshot text,
  verification_required_snapshot boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists thawing_batches_kitchen_status_idx on public.thawing_batches(kitchen_id,status,started_at desc);

create table if not exists public.thawing_readings (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  batch_id uuid not null references public.thawing_batches(id) on delete cascade,
  actual_temperature numeric not null,
  unit text not null default '°C',
  status text not null check (status in ('PASS','OUT')),
  limit_text_snapshot text not null,
  notes text,
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now()
);

create index if not exists thawing_readings_batch_idx on public.thawing_readings(batch_id,recorded_at desc);
create index if not exists thawing_readings_kitchen_idx on public.thawing_readings(kitchen_id,recorded_at desc);

create table if not exists public.thawing_corrective_actions (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid not null unique references public.thawing_readings(id) on delete cascade,
  immediate_action text not null,
  product_disposition text,
  followup_temperature numeric,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  verification_notes text
);

create table if not exists public.thawing_evidence (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  batch_id uuid not null references public.thawing_batches(id) on delete cascade,
  reading_id uuid references public.thawing_readings(id) on delete cascade,
  storage_path text not null unique,
  original_name text,
  mime_type text not null default 'image/jpeg',
  file_size bigint,
  photo_kind text not null default 'evidence' check (photo_kind in ('product','temperature','label','condition','corrective','other')),
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create or replace function public.prepare_thawing_batch()
returns trigger language plpgsql security definer set search_path=public as $$
declare s public.thawing_standards%rowtype;
begin
  select * into s from public.thawing_standards where id=new.standard_id and kitchen_id=new.kitchen_id and active=true;
  if not found then raise exception 'Active thawing standard not found for this kitchen.'; end if;
  if new.created_by <> auth.uid() then raise exception 'Thawing batch must be started by the signed-in user.'; end if;
  new.standard_code_snapshot:=s.code; new.standard_name_snapshot:=s.name; new.method_snapshot:=s.method; new.unit_snapshot:=s.unit;
  new.max_temperature_snapshot:=s.max_temperature; new.monitoring_interval_minutes_snapshot:=s.monitoring_interval_minutes;
  new.maximum_duration_minutes_snapshot:=s.maximum_duration_minutes; new.reminder_minutes_snapshot:=s.reminder_minutes;
  new.overdue_grace_minutes_snapshot:=s.overdue_grace_minutes; new.post_thaw_instruction_snapshot:=s.post_thaw_instruction;
  new.verification_required_snapshot:=s.verification_required;
  if s.maximum_duration_minutes is not null then
    new.expected_complete_at:=new.started_at + make_interval(mins=>s.maximum_duration_minutes);
  end if;
  return new;
end; $$;

drop trigger if exists trg_prepare_thawing_batch on public.thawing_batches;
create trigger trg_prepare_thawing_batch before insert on public.thawing_batches for each row execute function public.prepare_thawing_batch();

create or replace function public.prepare_thawing_reading()
returns trigger language plpgsql security definer set search_path=public as $$
declare b public.thawing_batches%rowtype;
begin
  select * into b from public.thawing_batches where id=new.batch_id and kitchen_id=new.kitchen_id;
  if not found then raise exception 'Thawing batch not found.'; end if;
  if b.status <> 'active' then raise exception 'Temperature can only be recorded for an active thawing batch.'; end if;
  if new.recorded_by <> auth.uid() then raise exception 'Reading must be recorded by the signed-in user.'; end if;
  new.unit:=coalesce(nullif(new.unit,''),b.unit_snapshot,'°C');
  if b.max_temperature_snapshot is null then
    new.status:='PASS'; new.limit_text_snapshot:='Property-approved thawing procedure';
  else
    new.status:=case when new.actual_temperature <= b.max_temperature_snapshot then 'PASS' else 'OUT' end;
    new.limit_text_snapshot:='≤ '||trim(to_char(b.max_temperature_snapshot,'FM999999990.##'))||b.unit_snapshot;
  end if;
  return new;
end; $$;

drop trigger if exists trg_prepare_thawing_reading on public.thawing_readings;
create trigger trg_prepare_thawing_reading before insert on public.thawing_readings for each row execute function public.prepare_thawing_reading();

create or replace function public.protect_thawing_reading_update()
returns trigger language plpgsql as $$ begin raise exception 'Thawing temperature readings are immutable.'; end; $$;
drop trigger if exists trg_protect_thawing_reading_update on public.thawing_readings;
create trigger trg_protect_thawing_reading_update before update on public.thawing_readings for each row execute function public.protect_thawing_reading_update();

create or replace function public.verify_thawing_corrective_action(p_action_id uuid,p_notes text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_kitchen uuid;
begin
  select r.kitchen_id into v_kitchen from public.thawing_corrective_actions a join public.thawing_readings r on r.id=a.reading_id where a.id=p_action_id;
  if v_kitchen is null then raise exception 'Corrective action not found.'; end if;
  if not public.has_kitchen_role(v_kitchen,array['owner','admin','manager','supervisor']) then raise exception 'Supervisor access required.'; end if;
  if coalesce(trim(p_notes),'')='' then raise exception 'Verification notes are required.'; end if;
  update public.thawing_corrective_actions set verified_by=auth.uid(),verified_at=now(),verification_notes=trim(p_notes) where id=p_action_id and verified_at is null;
  if not found then raise exception 'Action is already verified or not found.'; end if;
  return true;
end; $$;

grant execute on function public.verify_thawing_corrective_action(uuid,text) to authenticated;

create or replace function public.complete_thawing_batch(p_batch_id uuid,p_status text,p_notes text default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare b public.thawing_batches%rowtype; r public.thawing_readings%rowtype;
begin
  select * into b from public.thawing_batches where id=p_batch_id;
  if not found or not public.is_kitchen_member(b.kitchen_id) then raise exception 'Thawing batch not found.'; end if;
  if b.status<>'active' then raise exception 'This thawing batch is already closed.'; end if;
  if p_status not in ('ready','hold','discarded','cancelled') then raise exception 'Invalid completion status.'; end if;
  if p_status='ready' then
    select * into r from public.thawing_readings where batch_id=b.id order by recorded_at desc limit 1;
    if not found then raise exception 'Record at least one temperature before marking food ready for use.'; end if;
    if r.status<>'PASS' then raise exception 'Latest thawing reading must be PASS before marking ready for use.'; end if;
    if exists(select 1 from public.thawing_readings x where x.batch_id=b.id and x.status='OUT' and not exists(select 1 from public.thawing_corrective_actions a where a.reading_id=x.id)) then
      raise exception 'Complete corrective action for every out-of-limit reading first.';
    end if;
  end if;
  update public.thawing_batches set status=p_status,completed_at=now(),completed_by=auth.uid(),completion_notes=nullif(trim(p_notes),''),verification_status=case when verification_required_snapshot then 'PENDING' else 'NOT_REQUIRED' end where id=b.id;
  return true;
end; $$;

grant execute on function public.complete_thawing_batch(uuid,text,text) to authenticated;


create or replace function public.verify_thawing_batch(p_batch_id uuid,p_notes text)
returns boolean language plpgsql security definer set search_path=public as $$
declare b public.thawing_batches%rowtype;
begin
  select * into b from public.thawing_batches where id=p_batch_id;
  if not found then raise exception 'Thawing batch not found.'; end if;
  if not public.has_kitchen_role(b.kitchen_id,array['owner','admin','manager','supervisor']) then raise exception 'Supervisor access required.'; end if;
  if b.verification_status<>'PENDING' then raise exception 'This thawing batch does not require verification or is already verified.'; end if;
  if coalesce(trim(p_notes),'')='' then raise exception 'Verification notes are required.'; end if;
  update public.thawing_batches set verification_status='VERIFIED',verified_by=auth.uid(),verified_at=now(),verification_notes=trim(p_notes) where id=p_batch_id;
  return true;
end; $$;

grant execute on function public.verify_thawing_batch(uuid,text) to authenticated;

create or replace function public.validate_thawing_evidence()
returns trigger language plpgsql security definer set search_path=public as $$
declare b public.thawing_batches%rowtype; c integer;
begin
  select * into b from public.thawing_batches where id=new.batch_id and kitchen_id=new.kitchen_id;
  if not found then raise exception 'Invalid thawing batch for evidence.'; end if;
  if new.reading_id is not null and not exists(select 1 from public.thawing_readings r where r.id=new.reading_id and r.batch_id=new.batch_id and r.kitchen_id=new.kitchen_id) then raise exception 'Invalid thawing reading for evidence.'; end if;
  if coalesce(new.storage_path,'') not like (new.kitchen_id::text||'/'||new.batch_id::text||'/%') then raise exception 'Invalid thawing evidence storage path.'; end if;
  if new.reading_id is not null then
    select count(*) into c from public.thawing_evidence where reading_id=new.reading_id;
    if c>=3 then raise exception 'Maximum 3 photos per thawing temperature check.'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_validate_thawing_evidence on public.thawing_evidence;
create trigger trg_validate_thawing_evidence before insert on public.thawing_evidence for each row execute function public.validate_thawing_evidence();

alter table public.thawing_standards enable row level security;
alter table public.thawing_batches enable row level security;
alter table public.thawing_readings enable row level security;
alter table public.thawing_corrective_actions enable row level security;
alter table public.thawing_evidence enable row level security;

create policy "members read thawing standards" on public.thawing_standards for select to authenticated using (public.is_kitchen_member(kitchen_id));
create policy "managers insert thawing standards" on public.thawing_standards for insert to authenticated with check (public.has_kitchen_role(kitchen_id,array['owner','admin','manager']));
create policy "managers update thawing standards" on public.thawing_standards for update to authenticated using (public.has_kitchen_role(kitchen_id,array['owner','admin','manager'])) with check (public.has_kitchen_role(kitchen_id,array['owner','admin','manager']));

create policy "members read thawing batches" on public.thawing_batches for select to authenticated using (public.is_kitchen_member(kitchen_id));
create policy "members start thawing batches" on public.thawing_batches for insert to authenticated with check (public.is_kitchen_member(kitchen_id) and created_by=auth.uid());
create policy "members read thawing readings" on public.thawing_readings for select to authenticated using (public.is_kitchen_member(kitchen_id));
create policy "members insert thawing readings" on public.thawing_readings for insert to authenticated with check (public.is_kitchen_member(kitchen_id) and recorded_by=auth.uid());

create policy "members read thawing actions" on public.thawing_corrective_actions for select to authenticated using (exists(select 1 from public.thawing_readings r where r.id=reading_id and public.is_kitchen_member(r.kitchen_id)));
create policy "members insert thawing actions" on public.thawing_corrective_actions for insert to authenticated with check (created_by=auth.uid() and exists(select 1 from public.thawing_readings r where r.id=reading_id and r.status='OUT' and public.is_kitchen_member(r.kitchen_id)));
create policy "members read thawing evidence" on public.thawing_evidence for select to authenticated using (public.is_kitchen_member(kitchen_id));
create policy "members insert thawing evidence" on public.thawing_evidence for insert to authenticated with check (uploaded_by=auth.uid() and public.is_kitchen_member(kitchen_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('thawing-evidence','thawing-evidence',false,6291456,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "members upload thawing evidence objects" on storage.objects for insert to authenticated
with check(bucket_id='thawing-evidence' and public.is_kitchen_member((storage.foldername(name))[1]::uuid));
create policy "members read thawing evidence objects" on storage.objects for select to authenticated
using(bucket_id='thawing-evidence' and public.is_kitchen_member((storage.foldername(name))[1]::uuid));
create policy "uploader cleans unregistered thawing evidence" on storage.objects for delete to authenticated
using(bucket_id='thawing-evidence' and owner_id=auth.uid()::text and public.is_kitchen_member((storage.foldername(name))[1]::uuid) and not exists(select 1 from public.thawing_evidence e where e.storage_path=name));

-- Dedicated thawing notifications. Client merges these with the v3.9.1 Notification Center.
create or replace function public.get_thawing_notifications(p_kitchen_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_items jsonb:='[]'::jsonb; v_tz text:='UTC';
begin
  if p_kitchen_id is null or not public.is_kitchen_member(p_kitchen_id) then raise exception 'Kitchen access required.'; end if;
  select coalesce(timezone,'UTC') into v_tz from public.kitchens where id=p_kitchen_id;

  select coalesce(jsonb_agg(item order by severity_order,due_at),'[]'::jsonb) into v_items from (
    select jsonb_build_object(
      'key','thaw-check:'||b.id::text,'category','thawing','severity',case when now()>due_at+make_interval(mins=>coalesce(b.overdue_grace_minutes_snapshot,30)) then 'critical' else 'warning' end,
      'title_en','Thawing temperature check due','title_id','Pemeriksaan suhu pencairan jatuh tempo',
      'detail_en',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),'')||' · '||b.standard_name_snapshot,
      'detail_id',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),'')||' · '||b.standard_name_snapshot,
      'action_en','Open Thawing Control','action_id','Buka Kontrol Pencairan','page','thawing','due_at',due_at
    ) item,
    case when now()>due_at+make_interval(mins=>coalesce(b.overdue_grace_minutes_snapshot,30)) then 0 else 1 end severity_order,due_at
    from public.thawing_batches b
    cross join lateral (
      select coalesce((select max(r.recorded_at) from public.thawing_readings r where r.batch_id=b.id),b.started_at) + make_interval(mins=>b.monitoring_interval_minutes_snapshot) due_at
    ) d
    where b.kitchen_id=p_kitchen_id and b.status='active' and b.monitoring_interval_minutes_snapshot is not null
      and now() >= due_at - make_interval(mins=>coalesce(b.reminder_minutes_snapshot,15))

    union all

    select jsonb_build_object('key','thaw-duration:'||b.id::text,'category','thawing','severity','critical','title_en','Thawing maximum duration exceeded','title_id','Durasi maksimum pencairan terlampaui','detail_en',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),''),'detail_id',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),''),'action_en','Open Thawing Control','action_id','Buka Kontrol Pencairan','page','thawing','due_at',b.expected_complete_at),0,b.expected_complete_at
    from public.thawing_batches b where b.kitchen_id=p_kitchen_id and b.status='active' and b.expected_complete_at is not null and now()>b.expected_complete_at

    union all

    select jsonb_build_object('key','thaw-action:'||r.id::text,'category','thawing','severity','critical','title_en','Thawing corrective action required','title_id','Tindakan koreksi pencairan diperlukan','detail_en',b.product_name||' · '||r.actual_temperature||r.unit,'detail_id',b.product_name||' · '||r.actual_temperature||r.unit,'action_en','Open Corrective Actions','action_id','Buka Tindakan Koreksi','page','corrective','due_at',r.recorded_at),0,r.recorded_at
    from public.thawing_readings r join public.thawing_batches b on b.id=r.batch_id
    where r.kitchen_id=p_kitchen_id and r.status='OUT' and not exists(select 1 from public.thawing_corrective_actions a where a.reading_id=r.id)

    union all

    select jsonb_build_object('key','thaw-verify:'||a.id::text,'category','thawing','severity','warning','title_en','Thawing corrective action awaiting verification','title_id','Tindakan koreksi pencairan menunggu verifikasi','detail_en',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),''),'detail_id',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),''),'action_en','Open Corrective Actions','action_id','Buka Tindakan Koreksi','page','corrective','due_at',a.created_at),1,a.created_at
    from public.thawing_corrective_actions a join public.thawing_readings r on r.id=a.reading_id join public.thawing_batches b on b.id=r.batch_id
    where r.kitchen_id=p_kitchen_id and a.verified_at is null and public.has_kitchen_role(p_kitchen_id,array['owner','admin','manager','supervisor'])

    union all

    select jsonb_build_object('key','thaw-batch-verify:'||b.id::text,'category','thawing','severity','warning','title_en','Thawing batch awaiting verification','title_id','Batch pencairan menunggu verifikasi','detail_en',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),''),'detail_id',b.product_name||coalesce(' · '||nullif(b.batch_reference,''),''),'action_en','Open Thawing Records','action_id','Buka Catatan Pencairan','page','records','due_at',b.completed_at),1,b.completed_at
    from public.thawing_batches b
    where b.kitchen_id=p_kitchen_id and b.verification_status='PENDING' and public.has_kitchen_role(p_kitchen_id,array['owner','admin','manager','supervisor'])
  ) q
  where not exists (
    select 1 from public.notification_snoozes ns
    where ns.kitchen_id=p_kitchen_id and ns.user_id=auth.uid()
      and ns.notification_key=(q.item->>'key') and ns.snoozed_until>now()
  );

  return jsonb_build_object('items',v_items,'total',jsonb_array_length(v_items));
end; $$;

grant select,insert,update on public.thawing_standards to authenticated;
grant select,insert on public.thawing_batches to authenticated;
grant select,insert on public.thawing_readings to authenticated;
grant select,insert on public.thawing_corrective_actions to authenticated;
grant select,insert on public.thawing_evidence to authenticated;
grant execute on function public.get_thawing_notifications(uuid) to authenticated;

commit;
