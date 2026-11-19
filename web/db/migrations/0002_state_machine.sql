-- Atomic join / leave / lock. Every function locks the proposal row first so seat caps
-- and one-vote-per-lobby hold under concurrent taps.

create or replace function hop.join_proposal(p_proposal uuid, p_user uuid, p_now timestamptz)
returns table(result text, in_count int, pod_id uuid, moved_from uuid)
language plpgsql as $$
#variable_conflict use_column
declare
  v hop.proposals%rowtype;
  v_pod uuid;
  v_cnt int;
  v_moved uuid;
begin
  select * into v from hop.proposals where id = p_proposal for update;
  if not found or v.status = 'cancelled' then
    return query select 'closed'::text, 0, null::uuid, null::uuid; return;
  end if;
  if not exists (select 1 from hop.intents where user_id = p_user and lobby_id = v.lobby_id) then
    return query select 'not_in_lobby'::text, 0, null::uuid, null::uuid; return;
  end if;
  if p_now >= v.depart_at then
    return query select 'departed'::text, 0, null::uuid, null::uuid; return;
  end if;
  if exists (
    select 1 from hop.pod_members pm
      join hop.pods pd on pd.id = pm.pod_id
      join hop.proposals pr on pr.id = pd.proposal_id
     where pm.user_id = p_user and pm.status = 'in' and pr.lobby_id = v.lobby_id and pr.id <> p_proposal
  ) then
    return query select 'busy'::text, 0, null::uuid, null::uuid; return;
  end if;

  if v.status = 'open' then
    select count(*) into v_cnt from hop.votes where proposal_id = p_proposal;
    if exists (select 1 from hop.votes where proposal_id = p_proposal and user_id = p_user) then
      return query select 'already'::text, v_cnt, null::uuid, null::uuid; return;
    end if;
    if v_cnt >= v.seats then
      return query select 'full'::text, v_cnt, null::uuid, null::uuid; return;
    end if;
    select vt.proposal_id into v_moved
      from hop.votes vt join hop.proposals pr on pr.id = vt.proposal_id
     where vt.user_id = p_user and pr.lobby_id = v.lobby_id and pr.status = 'open' and pr.id <> p_proposal
     limit 1;
    if v_moved is not null then
      delete from hop.votes where proposal_id = v_moved and user_id = p_user;
    end if;
    insert into hop.votes(proposal_id, user_id) values (p_proposal, p_user);
    return query select 'joined'::text, v_cnt + 1, null::uuid, v_moved; return;
  end if;

  -- locked: join the pod while seats are free
  select id into v_pod from hop.pods where proposal_id = p_proposal;
  select count(*) into v_cnt from hop.pod_members where pod_id = v_pod and status = 'in';
  if exists (select 1 from hop.pod_members where pod_id = v_pod and user_id = p_user and status = 'in') then
    return query select 'already'::text, v_cnt, v_pod, null::uuid; return;
  end if;
  if v_cnt >= v.seats then
    return query select 'full'::text, v_cnt, v_pod, null::uuid; return;
  end if;
  insert into hop.pod_members(pod_id, user_id, status) values (v_pod, p_user, 'in')
  on conflict (pod_id, user_id) do update set status = 'in', joined_at = now();
  return query select 'joined'::text, v_cnt + 1, v_pod, null::uuid;
end $$;

create or replace function hop.leave_proposal(p_proposal uuid, p_user uuid, p_now timestamptz)
returns table(result text, in_count int, pod_id uuid)
language plpgsql as $$
#variable_conflict use_column
declare
  v hop.proposals%rowtype;
  v_pod uuid;
  v_cnt int;
  v_n int;
begin
  select * into v from hop.proposals where id = p_proposal for update;
  if not found then
    return query select 'not_in'::text, 0, null::uuid; return;
  end if;

  if v.status = 'open' then
    delete from hop.votes where proposal_id = p_proposal and user_id = p_user;
    get diagnostics v_n = row_count;
    select count(*) into v_cnt from hop.votes where proposal_id = p_proposal;
    return query select (case when v_n > 0 then 'left' else 'not_in' end)::text, v_cnt, null::uuid; return;
  end if;

  select id into v_pod from hop.pods where proposal_id = p_proposal;
  if v_pod is null then
    return query select 'not_in'::text, 0, null::uuid; return;
  end if;
  update hop.pod_members set status = 'left' where pod_id = v_pod and user_id = p_user and status = 'in';
  get diagnostics v_n = row_count;
  select count(*) into v_cnt from hop.pod_members where pod_id = v_pod and status = 'in';
  if v_n > 0 and v_cnt = 0 then
    update hop.pods set status = 'archived' where id = v_pod;
    update hop.proposals set status = 'cancelled' where id = p_proposal;
  end if;
  return query select (case when v_n > 0 then 'left' else 'not_in' end)::text, v_cnt, v_pod;
end $$;

create or replace function hop.lock_proposal(p_proposal uuid, p_user uuid)
returns table(result text, pod_id uuid)
language plpgsql as $$
#variable_conflict use_column
declare
  v hop.proposals%rowtype;
  v_pod uuid;
  v_cnt int;
begin
  select * into v from hop.proposals where id = p_proposal for update;
  if not found or v.status = 'cancelled' then
    return query select 'closed'::text, null::uuid; return;
  end if;

  if v.status = 'locked' then
    select id into v_pod from hop.pods where proposal_id = p_proposal;
    if exists (select 1 from hop.pod_members where pod_id = v_pod and user_id = p_user and status = 'in') then
      return query select 'already_locked'::text, v_pod; return;
    end if;
    return query select 'not_voter'::text, null::uuid; return;
  end if;

  if not exists (select 1 from hop.votes where proposal_id = p_proposal and user_id = p_user) then
    return query select 'not_voter'::text, null::uuid; return;
  end if;
  select count(*) into v_cnt from hop.votes where proposal_id = p_proposal;
  if v_cnt < 2 then
    return query select 'too_few'::text, null::uuid; return;
  end if;

  v_pod := gen_random_uuid();
  insert into hop.pods(id, proposal_id, channel_id) values (v_pod, p_proposal, 'p' || replace(v_pod::text, '-', ''));
  insert into hop.pod_members(pod_id, user_id, status)
    select v_pod, user_id, 'in' from hop.votes where proposal_id = p_proposal;
  delete from hop.votes
   where user_id in (select user_id from hop.votes where proposal_id = p_proposal)
     and proposal_id in (select id from hop.proposals where lobby_id = v.lobby_id and status = 'open' and id <> p_proposal);
  update hop.proposals set status = 'locked' where id = p_proposal;
  return query select 'locked'::text, v_pod;
end $$;
