-- SLASHER / edição VII: sincronização de rolagens locais
-- Execute UMA VEZ no SQL Editor do projeto Supabase existente.
-- Não remove dados e não altera funções antigas, mantendo compatibilidade.
-- OBSERVAÇÃO: o navegador escolhe o resultado; NÃO há prova antifraude.
-- O servidor mantém autorização do mestre, dono, arma, alvo e HP.

create or replace function public.slasher_roll_local(
 p_campaign_id uuid,p_character_id uuid,p_kind text,p_description text,p_modifier integer,p_damage_sides integer, p_natural integer, p_damage_face integer
) returns public.rolls language plpgsql security definer set search_path='' as $$
declare v public.rolls; v_natural int; v_damage int := 0;
begin
 if not public.slasher_is_member(p_campaign_id) then raise exception 'Não pertence à campanha'; end if;
 if p_kind not in ('test','attack','monster') or p_modifier not between -12 and 12 then raise exception 'Rolagem inválida'; end if;
 if p_kind='monster' and not public.slasher_is_gm(p_campaign_id) then raise exception 'Ataque de criatura exclusivo do mestre'; end if;
 if p_damage_sides not in (0,4,6,8,10,12) then raise exception 'Dado de dano não suportado'; end if;
 if p_character_id is not null and not exists (select 1 from public.characters c where c.id=p_character_id and c.campaign_id=p_campaign_id and
    (c.owner_id=auth.uid() or public.slasher_is_gm(p_campaign_id))) then raise exception 'Não pode rolar para esta ficha'; end if;
 if p_natural not between 1 and 20 then raise exception 'D20 local inválido'; end if;
 if p_kind='test' or p_damage_sides=0 then
  if p_damage_face <> 0 then raise exception 'Este teste não causa dano'; end if;
  v_damage := 0;
 else
  if p_damage_face not between 1 and p_damage_sides then raise exception 'Dano local fora do dado da arma'; end if;
  v_damage := p_damage_face;
 end if;
 v_natural := p_natural;
 insert into public.rolls(campaign_id,actor_id,character_id,kind,description,natural,modifier,total,damage)
 values(p_campaign_id,auth.uid(),p_character_id,p_kind,left(coalesce(p_description,''),160),v_natural,p_modifier,v_natural+p_modifier,v_damage)
 returning * into v;
 return v;
end; $$;

create or replace function public.slasher71_attack_local(p_campaign uuid,p_actor_character uuid,p_actor_monster uuid,p_target_character uuid,p_target_monster uuid,p_inventory uuid,p_client_natural integer,p_client_damage_face integer)
returns public.slasher71_combat_events language plpgsql security definer set search_path='' as $$
declare v_actor public.characters; v_monster public.slasher71_monsters; v_target public.characters; v_target_monster public.slasher71_monsters;
 v_item public.slasher71_inventory; v_encounter public.slasher71_encounters; v_event public.slasher71_combat_events;
 v_name text; v_target_name text; v_weapon text; v_die int; v_mod int; v_def int; v_before int; v_after int; v_max int;
 v_nat int; v_total int; v_hit boolean; v_damage int:=0;
begin
 if not public.slasher_is_member(p_campaign) then raise exception 'Você não participa desta campanha'; end if;
 select * into v_encounter from public.slasher71_encounters where campaign_id=p_campaign;
 if not coalesce(v_encounter.active,false) then raise exception 'O mestre ainda não abriu um combate'; end if;
 if (p_actor_character is null)=(p_actor_monster is null) then raise exception 'Escolha exatamente um atacante'; end if;
 if (p_target_character is null)=(p_target_monster is null) then raise exception 'Escolha exatamente um alvo'; end if;
 if p_actor_character is not null then
  select * into v_actor from public.characters where id=p_actor_character;
  if v_actor.id is null or v_actor.campaign_id<>p_campaign or (v_actor.owner_id is distinct from auth.uid() and not public.slasher_is_gm(p_campaign)) then raise exception 'Atacante não autorizado'; end if;
  if p_target_monster is null then raise exception 'Sobreviventes atacam criaturas nesta versão'; end if;
  v_name:=v_actor.name;v_mod:=coalesce((v_actor.attrs->>'REF')::integer,0);
  if p_inventory is null then v_weapon:='Ataque improvisado';v_die:=4;
  else
   select * into v_item from public.slasher71_inventory where id=p_inventory and campaign_id=p_campaign and character_id=v_actor.id;
   if v_item.id is null or v_item.kind<>'weapon' or v_item.quantity<1 then raise exception 'A arma não está no inventário do atacante'; end if;
   v_weapon:=v_item.title;v_die:=v_item.damage_sides;
  end if;
 else
  if not public.slasher_is_gm(p_campaign) then raise exception 'Apenas o mestre controla criaturas'; end if;
  select * into v_monster from public.slasher71_monsters where id=p_actor_monster;
  if v_monster.id is null or v_monster.campaign_id<>p_campaign then raise exception 'Criatura desconhecida'; end if;
  if p_target_character is null then raise exception 'Criaturas atacam sobreviventes nesta versão'; end if;
  v_name:=v_monster.name;v_weapon:='Ataque da criatura';v_die:=v_monster.damage_sides;v_mod:=2;
 end if;
 if p_target_monster is not null then
  select * into v_target_monster from public.slasher71_monsters where id=p_target_monster for update;
  if v_target_monster.id is null or v_target_monster.campaign_id<>p_campaign then raise exception 'Alvo inválido'; end if;
  v_target_name:=v_target_monster.name;v_before:=v_target_monster.hp;v_max:=v_target_monster.hp_max;v_def:=v_target_monster.defense;
 else
  select * into v_target from public.characters where id=p_target_character for update;
  if v_target.id is null or v_target.campaign_id<>p_campaign then raise exception 'Alvo inválido'; end if;
  v_target_name:=v_target.name;v_before:=v_target.hp;v_max:=v_target.hp_max;v_def:=10+coalesce((v_target.attrs->>'REF')::integer,0);
 end if;
 if v_before<=0 then raise exception 'O alvo já está incapacitado'; end if;
 if p_client_natural not between 1 and 20 then raise exception 'D20 local fora do intervalo'; end if;
 if p_client_damage_face not between 1 and v_die then raise exception 'Dado de dano não corresponde à arma'; end if;
 v_nat:=p_client_natural;v_total:=v_nat+v_mod;
 v_hit:=(v_nat=20) or (v_nat<>1 and v_total>=v_def);
 if v_hit then
  v_damage:=p_client_damage_face;
  if v_nat=20 then v_damage:=v_damage+2;end if;
 end if;
 v_after:=greatest(0,v_before-v_damage);
 if p_target_monster is not null then update public.slasher71_monsters set hp=v_after where id=p_target_monster;
 else update public.characters set hp=v_after,updated_at=now() where id=p_target_character;end if;
 insert into public.slasher71_combat_events(campaign_id,actor_character_id,actor_monster_id,target_character_id,target_monster_id,
 actor_name,target_name,weapon_name,die_roll,total,defense,hit,damage,hp_before,hp_after,hp_max)
 values(p_campaign,p_actor_character,p_actor_monster,p_target_character,p_target_monster,v_name,v_target_name,v_weapon,
 v_nat,v_total,v_def,v_hit,v_damage,v_before,v_after,v_max) returning * into v_event;
 return v_event;
end $$;

revoke all on function public.slasher_roll_local(uuid,uuid,text,text,integer,integer,integer,integer) from public,anon;
grant execute on function public.slasher_roll_local(uuid,uuid,text,text,integer,integer,integer,integer) to authenticated;
revoke all on function public.slasher71_attack_local(uuid,uuid,uuid,uuid,uuid,uuid,integer,integer) from public,anon;
grant execute on function public.slasher71_attack_local(uuid,uuid,uuid,uuid,uuid,uuid,integer,integer) to authenticated;