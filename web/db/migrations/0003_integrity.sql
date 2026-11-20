-- 1. Joining a locked pod clears the user's votes on other open proposals in the lobby.
-- 2. Locking never adds someone who is already in another pod of the lobby, and never after departure.

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
     where pm.user_id = p_user and pm.status = 'in' and pd.status <> 'archived' and pr.lobby_id = v.lobby_id and pr.id <> p_proposal
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

  select id into v_pod from hop.pods where proposal_id = p_proposal;
  select count(*) into v_cnt from hop.pod_members where pod_id = v_pod and status = 'in';
  if exists (select 1 from hop.pod_members where pod_id = v_pod and user_id = p_user and status = 'in') then
    return query select 'already'::text, v_cnt, v_pod, null::uuid; return;
  end if;
  if v_cnt >= v.seats then
    return query select 'full'::text, v_cnt, v_pod, null::uuid; return;
  end if;
  select vt.proposal_id into v_moved
    from hop.votes vt join hop.proposals pr on pr.id = vt.proposal_id
   where vt.user_id = p_user and pr.lobby_id = v.lobby_id and pr.status = 'open'
   limit 1;
  delete from hop.votes
   where user_id = p_user
     and proposal_id in (select id from hop.proposals where lobby_id = v.lobby_id and status = 'open');
  insert into hop.pod_members(pod_id, user_id, status) values (v_pod, p_user, 'in')
  on conflict (pod_id, user_id) do update set status = 'in', joined_at = now();
  return query select 'joined'::text, v_cnt + 1, v_pod, v_moved;
end $$;

drop function if exists hop.lock_proposal(uuid, uuid);

create or replace function hop.lock_proposal(p_proposal uuid, p_user uuid, p_now timestamptz default now())
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
  if p_now >= v.depart_at then
    return query select 'departed'::text, null::uuid; return;
  end if;

  -- Anyone already in another live pod of this lobby cannot be in a second one.
  delete from hop.votes
   where proposal_id = p_proposal
     and user_id in (
       select pm.user_id from hop.pod_members pm
         join hop.pods pd on pd.id = pm.pod_id
         join hop.proposals pr on pr.id = pd.proposal_id
        where pm.status = 'in' and pd.status <> 'archived' and pr.lobby_id = v.lobby_id and pr.id <> p_proposal);

  if not exists (select 1 from hop.votes where proposal_id = p_proposal and user_id = p_user) then
    return query select 'busy'::text, null::uuid; return;
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
