-- HACCP Control v3.9.2.1
-- Timezone compatibility fix
-- Run ONCE after v3.9.2.
-- Fixes legacy offset-style kitchen timezones such as GMT+0800 and prevents
-- unsupported timezone strings from being stored in public.kitchens.

begin;

-- Normalize common Indonesian legacy/browser offset strings already stored.
update public.kitchens
set timezone = 'Asia/Jakarta'
where upper(regexp_replace(coalesce(timezone,''), '[ :]', '', 'g')) in
  ('GMT+0700','UTC+0700','+0700','GMT+07','UTC+07','+07');

update public.kitchens
set timezone = 'Asia/Makassar'
where upper(regexp_replace(coalesce(timezone,''), '[ :]', '', 'g')) in
  ('GMT+0800','UTC+0800','+0800','GMT+08','UTC+08','+08');

update public.kitchens
set timezone = 'Asia/Jayapura'
where upper(regexp_replace(coalesce(timezone,''), '[ :]', '', 'g')) in
  ('GMT+0900','UTC+0900','+0900','GMT+09','UTC+09','+09');

create or replace function public.normalize_kitchen_timezone(p_timezone text)
returns text
language plpgsql
stable
set search_path = public, pg_catalog
as $$
declare
  v_input text := nullif(trim(p_timezone), '');
  v_name text;
  v_compact text;
  v_match text[];
  v_hours integer;
  v_minutes integer;
  v_candidate text;
begin
  if v_input is null then
    return 'UTC';
  end if;

  -- Preserve valid IANA/PostgreSQL timezone names and canonicalize case.
  select name into v_name
  from pg_timezone_names
  where lower(name) = lower(v_input)
  order by name
  limit 1;
  if v_name is not null then
    return v_name;
  end if;

  v_compact := upper(regexp_replace(v_input, '\s+', '', 'g'));

  if replace(v_compact, ':', '') in ('GMT+0700','UTC+0700','+0700','GMT+07','UTC+07','+07') then
    return 'Asia/Jakarta';
  elsif replace(v_compact, ':', '') in ('GMT+0800','UTC+0800','+0800','GMT+08','UTC+08','+08') then
    return 'Asia/Makassar';
  elsif replace(v_compact, ':', '') in ('GMT+0900','UTC+0900','+0900','GMT+09','UTC+09','+09') then
    return 'Asia/Jayapura';
  end if;

  -- Whole-hour fixed offsets can safely use Etc/GMT zones.
  v_match := regexp_match(v_compact, '^(?:GMT|UTC)?([+-])(\d{2})(?::?(\d{2}))$');
  if v_match is not null then
    v_hours := v_match[2]::integer;
    v_minutes := v_match[3]::integer;
    if v_minutes = 0 and v_hours <= 14 then
      if v_hours = 0 then
        return 'UTC';
      end if;
      -- IANA Etc/GMT signs are intentionally reversed.
      v_candidate := 'Etc/GMT' || case when v_match[1] = '+' then '-' else '+' end || v_hours::text;
      if exists (select 1 from pg_timezone_names where name = v_candidate) then
        return v_candidate;
      end if;
    end if;
  end if;

  raise exception 'Time zone "%" not recognized. Use an IANA zone such as Asia/Jakarta, Asia/Makassar, or Asia/Jayapura.', p_timezone;
end;
$$;

create or replace function public.normalize_kitchen_timezone_trigger()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.timezone := public.normalize_kitchen_timezone(new.timezone);
  return new;
end;
$$;

drop trigger if exists trg_normalize_kitchen_timezone on public.kitchens;
create trigger trg_normalize_kitchen_timezone
before insert or update of timezone on public.kitchens
for each row execute function public.normalize_kitchen_timezone_trigger();

commit;
