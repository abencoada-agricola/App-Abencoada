-- Apply once after general-occurrences.sql. No changes to historical migrations.
begin;
alter table public.records add column work_front text;
alter table public.records add constraint records_work_front_length check(work_front is null or char_length(work_front)<=120);
alter function public.diesel_operation_submit(jsonb) rename to operation_submit_before_work_front;
alter function public.operation_submit_before_work_front(jsonb) set schema private;
revoke all on function private.operation_submit_before_work_front(jsonb) from public,anon,authenticated;
create function public.diesel_operation_submit(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;front text;rid uuid;
begin
 if payload->>'kind' is distinct from 'refuel' then return private.operation_submit_before_work_front(payload);end if;
 if private.member() is null then return jsonb_build_object('error','Conta sem autorização.','status',403);end if;
 rid:=(payload->>'id')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(rid::text,0));
 -- Accepted retries retain the original value and existing ownership checks.
 if exists(select 1 from public.records where id=rid) then return private.operation_submit_before_work_front(payload);end if;
 if payload ? 'workFront' and payload->'workFront'<>'null'::jsonb and jsonb_typeof(payload->'workFront')<>'string' then
  return jsonb_build_object('error','Informe a frente de trabalho como texto.','status',422);
 end if;
 front:=nullif(trim(payload->>'workFront'),'');
 if char_length(front)>120 then return jsonb_build_object('error','Informe a frente de trabalho com até 120 caracteres.','status',422);end if;
 result:=private.operation_submit_before_work_front(payload);
 if not result ? 'error' and not coalesce((result->>'duplicate')::boolean,false) then
  update public.records set work_front=front where id=(result->>'id')::uuid and user_id=auth.uid();
 end if;
 return result;
exception when invalid_text_representation then return jsonb_build_object('error','Identificador inválido.','status',422);
end $$;
revoke all on function public.diesel_operation_submit(jsonb) from public,anon,authenticated;
grant execute on function public.diesel_operation_submit(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
