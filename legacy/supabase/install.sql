-- SLASHER 10.0  /  INSTALAÇÃO INICIAL ÚNICA
-- Para um projeto Supabase NOVO, sem tabelas do SLASHER.
-- Execute todo o arquivo UMA VEZ no SQL Editor, com permissões de proprietário.
-- Contém: estrutura base, Mesa Atual e rolagens locais (nesta ordem).
-- O Supabase deve ter Authentication configurado (Anonymous sign-ins para entrada rápida).
-- ATENÇÃO: este arquivo NÃO é um script de atualização para bancos existentes.

begin;

-- ============================================================
-- schema.sql : base integrada ao instalador 10.0
-- ============================================================

-- SLASHER 7.0 | Dunmoore Horror Story
-- Execute uma única vez no SQL Editor de um PROJETO NOVO do Supabase.
-- Nenhuma senha ou chave service_role deve ser exposta no cliente.

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 90),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  suspicion integer not null default 0 check (suspicion between 0 and 6),
  danger integer not null default 0 check (danger between 0 and 4),
  created_at timestamptz not null default now()
);
create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('gm','player')),
  nickname text not null check (char_length(nickname) between 2 and 50),
  joined_at timestamptz not null default now(),
  primary key (campaign_id,user_id)
);
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 90),
  class_key text not null,
  age integer not null default 18 check (age between 10 and 100),
  occupation text not null default '',
  attrs jsonb not null,
  hp integer not null,
  hp_max integer not null,
  stamina integer not null,
  stamina_max integer not null,
  stress integer not null default 0 check (stress between 0 and 100),
  notes text not null default '' check (char_length(notes) <= 5000),
  portrait text not null default '' check (char_length(portrait) <= 150000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (hp between 0 and hp_max and hp_max between 12 and 22),
  check (stamina between 0 and stamina_max and stamina_max between 12 and 22)
);
create index if not exists characters_campaign_idx on public.characters(campaign_id);
create table if not exists public.character_effects (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  kind text not null check (kind in ('item','skill','condition')),
  title text not null check (char_length(title) between 2 and 80),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists effects_campaign_idx on public.character_effects(campaign_id);
create table if not exists public.rolls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  kind text not null check (kind in ('test','attack','monster')),
  description text not null default '',
  "natural" integer not null check ("natural" between 1 and 20),
  modifier integer not null check (modifier between -12 and 12),
  total integer not null,
  damage integer not null default 0 check (damage >= 0),
  created_at timestamptz not null default now()
);
create index if not exists rolls_campaign_idx on public.rolls(campaign_id,created_at desc);
create table if not exists public.gm_notes (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 20000),
  updated_at timestamptz not null default now()
);
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists audit_campaign_idx on public.audit_log(campaign_id,created_at desc);

-- Estas funções são DEFINER para evitar a recursão das políticas de membros.
create or replace function public.slasher_is_member(p_campaign uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.campaign_members m
    where m.campaign_id=p_campaign and m.user_id=(select auth.uid()));
$$;
create or replace function public.slasher_is_gm(p_campaign uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.campaign_members m
    where m.campaign_id=p_campaign and m.user_id=(select auth.uid()) and m.role='gm');
$$;

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.character_effects enable row level security;
alter table public.rolls enable row level security;
alter table public.gm_notes enable row level security;
alter table public.audit_log enable row level security;

create policy "slasher campaigns members read" on public.campaigns for select to authenticated
using (public.slasher_is_member(id));
create policy "slasher membership read" on public.campaign_members for select to authenticated
using (public.slasher_is_member(campaign_id));
create policy "slasher characters members read" on public.characters for select to authenticated
using (public.slasher_is_member(campaign_id));
create policy "slasher effects members read" on public.character_effects for select to authenticated
using (public.slasher_is_member(campaign_id));
create policy "slasher rolls members read" on public.rolls for select to authenticated
using (public.slasher_is_member(campaign_id));
create policy "slasher gm notes gm read" on public.gm_notes for select to authenticated
using (public.slasher_is_gm(campaign_id));
create policy "slasher audit members read" on public.audit_log for select to authenticated
using (public.slasher_is_member(campaign_id));
-- Escritas só pelas funções abaixo, que validam identidade, papel e campanha.

create or replace function public.slasher_create_campaign(p_name text, p_nickname text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
  if char_length(btrim(coalesce(p_name,''))) not between 3 and 90 then raise exception 'Nome de campanha inválido'; end if;
  if char_length(btrim(coalesce(p_nickname,''))) not between 2 and 50 then raise exception 'Apelido inválido'; end if;
  insert into public.campaigns(name) values(btrim(p_name)) returning id into v_id;
  insert into public.campaign_members(campaign_id,user_id,role,nickname)
    values(v_id,auth.uid(),'gm',btrim(p_nickname));
  return v_id;
end; $$;

create or replace function public.slasher_join_campaign(p_code text, p_nickname text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
  if char_length(btrim(coalesce(p_nickname,''))) not between 2 and 50 then raise exception 'Apelido inválido'; end if;
  select id into v_id from public.campaigns where invite_code=upper(btrim(coalesce(p_code,'')));
  if v_id is null then raise exception 'Convite não encontrado'; end if;
  insert into public.campaign_members(campaign_id,user_id,role,nickname)
    values(v_id,auth.uid(),'player',btrim(p_nickname))
    on conflict(campaign_id,user_id) do update set nickname=excluded.nickname;
  return v_id;
end; $$;

create or replace function public.slasher_class_attrs(p_key text)
returns jsonb language plpgsql immutable set search_path='' as $$
begin
 return case p_key
 when 'atl' then '{"CIE":0,"RAL":0,"COC":0,"EDF":4,"REF":3,"TEC":0,"CRI":1,"SOC":2}'::jsonb
 when 'bul' then '{"CIE":0,"RAL":0,"COC":0,"EDF":4,"REF":2,"TEC":1,"CRI":0,"SOC":3}'::jsonb
 when 'ner' then '{"CIE":2,"RAL":4,"COC":1,"EDF":0,"REF":0,"TEC":2,"CRI":1,"SOC":0}'::jsonb
 when 'pat' then '{"CIE":0,"RAL":2,"COC":0,"EDF":0,"REF":1,"TEC":0,"CRI":3,"SOC":4}'::jsonb
 when 'pop' then '{"CIE":0,"RAL":1,"COC":0,"EDF":0,"REF":2,"TEC":0,"CRI":3,"SOC":4}'::jsonb
 when 'reb' then '{"CIE":0,"RAL":0,"COC":1,"EDF":2,"REF":3,"TEC":2,"CRI":2,"SOC":0}'::jsonb
 when 'par' then '{"CIE":0,"RAL":2,"COC":4,"EDF":0,"REF":1,"TEC":0,"CRI":2,"SOC":1}'::jsonb
 when 'art' then '{"CIE":0,"RAL":1,"COC":1,"EDF":0,"REF":1,"TEC":1,"CRI":4,"SOC":2}'::jsonb
 when 'cod' then '{"CIE":0,"RAL":3,"COC":0,"EDF":0,"REF":1,"TEC":4,"CRI":2,"SOC":0}'::jsonb
 when 'esc' then '{"CIE":1,"RAL":1,"COC":0,"EDF":3,"REF":3,"TEC":1,"CRI":0,"SOC":1}'::jsonb
 when 'tra' then '{"CIE":0,"RAL":1,"COC":0,"EDF":3,"REF":1,"TEC":4,"CRI":0,"SOC":1}'::jsonb
 when 'pro' then '{"CIE":2,"RAL":4,"COC":1,"EDF":0,"REF":0,"TEC":0,"CRI":1,"SOC":2}'::jsonb
 else null end;
end; $$;

create or replace function public.slasher_create_character(
 p_campaign_id uuid,p_name text,p_class text,p_age integer,p_occupation text default '',p_npc boolean default false
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_attrs jsonb; v_max integer; v_id uuid; v_owner uuid;
begin
 if not public.slasher_is_member(p_campaign_id) then raise exception 'Não pertence à campanha'; end if;
 if p_npc and not public.slasher_is_gm(p_campaign_id) then raise exception 'Só o mestre cria NPCs'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 2 and 90 then raise exception 'Nome inválido'; end if;
 if p_age not between 10 and 100 then raise exception 'Idade inválida'; end if;
 v_attrs := public.slasher_class_attrs(p_class);
 if v_attrs is null then raise exception 'Classe desconhecida'; end if;
 v_max := 12+2*(v_attrs->>'EDF')::integer;
 v_owner := case when p_npc then null else auth.uid() end;
 insert into public.characters(campaign_id,owner_id,name,class_key,age,occupation,attrs,hp,hp_max,stamina,stamina_max)
 values(p_campaign_id,v_owner,btrim(p_name),p_class,p_age,left(coalesce(p_occupation,''),120),v_attrs,v_max,v_max,v_max,v_max)
 returning id into v_id;
 return v_id;
end; $$;

create or replace function public.slasher_update_character(p_character_id uuid,p_name text,p_notes text,p_portrait text)
returns void language plpgsql security definer set search_path='' as $$
declare v public.characters;
begin
 select * into v from public.characters where id=p_character_id;
 if v.id is null then raise exception 'Ficha não encontrada'; end if;
 if v.owner_id is distinct from auth.uid() and not public.slasher_is_gm(v.campaign_id) then
   raise exception 'Você não pode editar esta ficha'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 2 and 90 then raise exception 'Nome inválido'; end if;
 if char_length(coalesce(p_notes,''))>5000 then raise exception 'Anotações grandes demais'; end if;
 if char_length(coalesce(p_portrait,''))>150000 then raise exception 'Retrato grande demais'; end if;
 if coalesce(p_portrait,'')<>'' and coalesce(p_portrait,'') !~ '^data:image/(jpeg|png|webp);base64,' then
   raise exception 'Formato de retrato inválido'; end if;
 update public.characters set name=btrim(p_name),notes=coalesce(p_notes,''),portrait=coalesce(p_portrait,''),updated_at=now()
 where id=p_character_id;
end; $$;

create or replace function public.slasher_assign_character(p_character_id uuid,p_owner uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.characters;
begin
 select * into v from public.characters where id=p_character_id;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Permissão negada'; end if;
 if p_owner is not null and not exists(select 1 from public.campaign_members where campaign_id=v.campaign_id and user_id=p_owner)
 then raise exception 'Novo dono precisa participar da campanha'; end if;
 update public.characters set owner_id=p_owner,updated_at=now() where id=p_character_id;
 insert into public.audit_log(campaign_id,actor_id,character_id,message) values(v.campaign_id,auth.uid(),p_character_id,'Atribuição de ficha alterada');
end; $$;

create or replace function public.slasher_change_stat(p_character_id uuid,p_stat text,p_delta integer)
returns void language plpgsql security definer set search_path='' as $$
declare v public.characters;
begin
 select * into v from public.characters where id=p_character_id for update;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Só o mestre altera os indicadores'; end if;
 if p_stat not in ('hp','stamina','stress') or p_delta not between -100 and 100 then raise exception 'Alteração inválida'; end if;
 update public.characters set
 hp=case when p_stat='hp' then greatest(0,least(hp_max,hp+p_delta)) else hp end,
 stamina=case when p_stat='stamina' then greatest(0,least(stamina_max,stamina+p_delta)) else stamina end,
 stress=case when p_stat='stress' then greatest(0,least(100,stress+p_delta)) else stress end,
 updated_at=now() where id=p_character_id;
 insert into public.audit_log(campaign_id,actor_id,character_id,message)
 values(v.campaign_id,auth.uid(),v.id,'Alterou '||p_stat||' em '||p_delta::text);
end; $$;

create or replace function public.slasher_grant_effect(p_character_id uuid,p_kind text,p_title text,p_details text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.characters; v_id uuid;
begin
 select * into v from public.characters where id=p_character_id;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Só o mestre distribui recursos'; end if;
 if p_kind not in ('item','skill','condition') or char_length(btrim(coalesce(p_title,''))) not between 2 and 80 or char_length(coalesce(p_details,''))>500
 then raise exception 'Recurso inválido'; end if;
 insert into public.character_effects(campaign_id,character_id,kind,title,details)
 values(v.campaign_id,v.id,p_kind,btrim(p_title),coalesce(p_details,'')) returning id into v_id;
 insert into public.audit_log(campaign_id,actor_id,character_id,message)
 values(v.campaign_id,auth.uid(),v.id,'Concedeu '||p_kind||': '||btrim(p_title));
 return v_id;
end; $$;

create or replace function public.slasher_remove_effect(p_effect_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.character_effects;
begin
 select * into v from public.character_effects where id=p_effect_id;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Só o mestre retira recursos'; end if;
 delete from public.character_effects where id=p_effect_id;
 insert into public.audit_log(campaign_id,actor_id,character_id,message)
 values(v.campaign_id,auth.uid(),v.character_id,'Removeu '||v.kind||': '||v.title);
end; $$;

create or replace function public.slasher_set_clock(p_campaign_id uuid,p_clock text,p_value integer)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.slasher_is_gm(p_campaign_id) then raise exception 'Somente o mestre controla os relógios'; end if;
 if p_clock='suspicion' and p_value between 0 and 6 then
  update public.campaigns set suspicion=p_value where id=p_campaign_id;
 elsif p_clock='danger' and p_value between 0 and 4 then
  update public.campaigns set danger=p_value where id=p_campaign_id;
 else raise exception 'Relógio inválido'; end if;
end; $$;

create or replace function public.slasher_save_gm_note(p_campaign_id uuid,p_text text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.slasher_is_gm(p_campaign_id) then raise exception 'Somente o mestre acessa estas notas'; end if;
 if char_length(coalesce(p_text,'')) > 20000 then raise exception 'Nota grande demais'; end if;
 insert into public.gm_notes(campaign_id,content) values(p_campaign_id,coalesce(p_text,''))
 on conflict(campaign_id) do update set content=excluded.content,updated_at=now();
end; $$;

create or replace function public.slasher_roll(
 p_campaign_id uuid,p_character_id uuid,p_kind text,p_description text,p_modifier integer,p_damage_sides integer default 0
) returns public.rolls language plpgsql security definer set search_path='' as $$
declare v public.rolls; v_natural int; v_damage int := 0;
begin
 if not public.slasher_is_member(p_campaign_id) then raise exception 'Não pertence à campanha'; end if;
 if p_kind not in ('test','attack','monster') or p_modifier not between -12 and 12 then raise exception 'Rolagem inválida'; end if;
 if p_kind='monster' and not public.slasher_is_gm(p_campaign_id) then raise exception 'Ataque de criatura exclusivo do mestre'; end if;
 if p_damage_sides not in (0,4,6,8,10,12) then raise exception 'Dado de dano não suportado'; end if;
 if p_character_id is not null and not exists (select 1 from public.characters c where c.id=p_character_id and c.campaign_id=p_campaign_id and
    (c.owner_id=auth.uid() or public.slasher_is_gm(p_campaign_id))) then raise exception 'Não pode rolar para esta ficha'; end if;
 v_natural := floor(random()*20)::integer+1;
 if p_kind <> 'test' and p_damage_sides>0 then v_damage := floor(random()*p_damage_sides)::integer+1; end if;
 insert into public.rolls(campaign_id,actor_id,character_id,kind,description,"natural",modifier,total,damage)
 values(p_campaign_id,auth.uid(),p_character_id,p_kind,left(coalesce(p_description,''),160),v_natural,p_modifier,v_natural+p_modifier,v_damage)
 returning * into v;
 return v;
end; $$;

-- Protege procedimentos de escrita contra usuários anônimos e visitantes sem login.
revoke all on function public.slasher_is_member(uuid) from public,anon;
revoke all on function public.slasher_is_gm(uuid) from public,anon;
revoke all on function public.slasher_class_attrs(text) from public,anon;
revoke all on function public.slasher_create_campaign(text,text) from public,anon;
revoke all on function public.slasher_join_campaign(text,text) from public,anon;
revoke all on function public.slasher_create_character(uuid,text,text,integer,text,boolean) from public,anon;
revoke all on function public.slasher_update_character(uuid,text,text,text) from public,anon;
revoke all on function public.slasher_assign_character(uuid,uuid) from public,anon;
revoke all on function public.slasher_change_stat(uuid,text,integer) from public,anon;
revoke all on function public.slasher_grant_effect(uuid,text,text,text) from public,anon;
revoke all on function public.slasher_remove_effect(uuid) from public,anon;
revoke all on function public.slasher_set_clock(uuid,text,integer) from public,anon;
revoke all on function public.slasher_save_gm_note(uuid,text) from public,anon;
revoke all on function public.slasher_roll(uuid,uuid,text,text,integer,integer) from public,anon;
grant execute on function public.slasher_is_member(uuid) to authenticated;
grant execute on function public.slasher_is_gm(uuid) to authenticated;
grant execute on function public.slasher_class_attrs(text) to authenticated;
grant execute on function public.slasher_create_campaign(text,text) to authenticated;
grant execute on function public.slasher_join_campaign(text,text) to authenticated;
grant execute on function public.slasher_create_character(uuid,text,text,integer,text,boolean) to authenticated;
grant execute on function public.slasher_update_character(uuid,text,text,text) to authenticated;
grant execute on function public.slasher_assign_character(uuid,uuid) to authenticated;
grant execute on function public.slasher_change_stat(uuid,text,integer) to authenticated;
grant execute on function public.slasher_grant_effect(uuid,text,text,text) to authenticated;
grant execute on function public.slasher_remove_effect(uuid) to authenticated;
grant execute on function public.slasher_set_clock(uuid,text,integer) to authenticated;
grant execute on function public.slasher_save_gm_note(uuid,text) to authenticated;
grant execute on function public.slasher_roll(uuid,uuid,text,text,integer,integer) to authenticated;

-- Leitura permitida apenas sob as políticas RLS acima.
grant usage on schema public to authenticated;
grant select on public.campaigns, public.campaign_members, public.characters,
  public.character_effects, public.rolls, public.gm_notes, public.audit_log to authenticated;

-- Postgres Changes: publicação necessária para a sincronização entre navegadores.
do $$ declare v text; begin
 foreach v in array array['campaigns','campaign_members','characters','character_effects','rolls','audit_log'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=v) then
    execute format('alter publication supabase_realtime add table public.%I',v);
  end if;
 end loop;
end $$;

-- ============================================================
-- migrate_7_1.sql : base integrada ao instalador 10.0
-- ============================================================

-- SLASHER 7.1 | Mesa Atual, monstros, inventário, loja e combate sincronizado
-- MIGRAÇÃO ADITIVA: rode sobre um banco SLASHER 7.0 já instalado.
-- Não apaga fichas, campanhas ou registros existentes.

alter table public.characters add column if not exists credits integer not null default 80 check (credits between 0 and 1000000);

create table if not exists public.slasher71_monsters (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 name text not null check (char_length(name) between 2 and 80),
 description text not null default '' check (char_length(description)<=500),
 portrait text not null default '' check (char_length(portrait)<=150000),
 hp integer not null check(hp>=0),
 hp_max integer not null check(hp_max between 1 and 300),
 defense integer not null default 12 check(defense between 6 and 25),
 damage_sides integer not null default 6 check(damage_sides in (4,6,8,10,12)),
 created_at timestamptz not null default now(),
 check(hp<=hp_max)
);
create index if not exists slasher71_monsters_camp_idx on public.slasher71_monsters(campaign_id);

create table if not exists public.slasher71_inventory (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid not null references public.characters(id) on delete cascade,
 title text not null check(char_length(title) between 2 and 80),
 kind text not null default 'item' check(kind in ('item','weapon')),
 damage_sides integer not null default 0 check(damage_sides in (0,4,6,8,10,12)),
 quantity integer not null default 1 check(quantity between 1 and 99),
 details text not null default '' check(char_length(details)<=400),
 created_at timestamptz not null default now(),
 check(kind='weapon' or damage_sides=0)
);
create index if not exists slasher71_inventory_camp_idx on public.slasher71_inventory(campaign_id,character_id);

create table if not exists public.slasher71_shops (
 campaign_id uuid primary key references public.campaigns(id) on delete cascade,
 name text not null default 'Loja de Dunmoore' check(char_length(name) between 2 and 80),
 is_open boolean not null default false,
 updated_at timestamptz not null default now()
);
create table if not exists public.slasher71_shop_stock (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 title text not null check(char_length(title) between 2 and 80),
 kind text not null check(kind in ('item','weapon')),
 damage_sides integer not null default 0 check(damage_sides in (0,4,6,8,10,12)),
 price integer not null check(price between 0 and 100000),
 stock integer not null check(stock between 0 and 999),
 details text not null default '' check(char_length(details)<=400),
 check(kind='weapon' or damage_sides=0)
);
create index if not exists slasher71_stock_camp_idx on public.slasher71_shop_stock(campaign_id);

create table if not exists public.slasher71_encounters (
 campaign_id uuid primary key references public.campaigns(id) on delete cascade,
 active boolean not null default false,
 round integer not null default 1 check(round between 1 and 999),
 turn_label text not null default '' check(char_length(turn_label)<=80),
 updated_at timestamptz not null default now()
);

create table if not exists public.slasher71_combat_events (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 actor_character_id uuid references public.characters(id) on delete set null,
 actor_monster_id uuid references public.slasher71_monsters(id) on delete set null,
 target_character_id uuid references public.characters(id) on delete set null,
 target_monster_id uuid references public.slasher71_monsters(id) on delete set null,
 actor_name text not null,
 target_name text not null,
 weapon_name text not null,
 die_roll integer not null check(die_roll between 1 and 20),
 total integer not null,
 defense integer not null,
 hit boolean not null,
 damage integer not null default 0 check(damage>=0),
 hp_before integer not null,
 hp_after integer not null,
 hp_max integer not null,
 created_at timestamptz not null default now()
);
create index if not exists slasher71_combat_events_idx on public.slasher71_combat_events(campaign_id,created_at desc);

alter table public.slasher71_monsters enable row level security;
alter table public.slasher71_inventory enable row level security;
alter table public.slasher71_shops enable row level security;
alter table public.slasher71_shop_stock enable row level security;
alter table public.slasher71_encounters enable row level security;
alter table public.slasher71_combat_events enable row level security;

drop policy if exists "s71 monster members read" on public.slasher71_monsters;
create policy "s71 monster members read" on public.slasher71_monsters for select to authenticated using(public.slasher_is_member(campaign_id));
drop policy if exists "s71 inventory members read" on public.slasher71_inventory;
create policy "s71 inventory members read" on public.slasher71_inventory for select to authenticated using(public.slasher_is_member(campaign_id));
drop policy if exists "s71 shop members read" on public.slasher71_shops;
create policy "s71 shop members read" on public.slasher71_shops for select to authenticated using(public.slasher_is_member(campaign_id));
drop policy if exists "s71 stock members read" on public.slasher71_shop_stock;
create policy "s71 stock members read" on public.slasher71_shop_stock for select to authenticated using(public.slasher_is_member(campaign_id));
drop policy if exists "s71 encounters members read" on public.slasher71_encounters;
create policy "s71 encounters members read" on public.slasher71_encounters for select to authenticated using(public.slasher_is_member(campaign_id));
drop policy if exists "s71 events members read" on public.slasher71_combat_events;
create policy "s71 events members read" on public.slasher71_combat_events for select to authenticated using(public.slasher_is_member(campaign_id));

grant select on public.slasher71_monsters,public.slasher71_inventory,public.slasher71_shops,
 public.slasher71_shop_stock,public.slasher71_encounters,public.slasher71_combat_events to authenticated;

create or replace function public.slasher71_monster_create(p_campaign uuid,p_name text,p_hp integer,p_defense integer,p_damage integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.slasher_is_gm(p_campaign) then raise exception 'Apenas o mestre pode criar criaturas'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 2 and 80 or p_hp not between 1 and 300 or p_defense not between 6 and 25 or p_damage not in(4,6,8,10,12) then raise exception 'Dados da criatura inválidos'; end if;
 insert into public.slasher71_monsters(campaign_id,name,hp,hp_max,defense,damage_sides)
 values(p_campaign,btrim(p_name),p_hp,p_hp,p_defense,p_damage) returning id into v_id;
 return v_id;
end $$;

create or replace function public.slasher71_monster_adjust(p_id uuid,p_delta integer)
returns void language plpgsql security definer set search_path='' as $$
declare v public.slasher71_monsters;
begin
 select * into v from public.slasher71_monsters where id=p_id for update;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Sem permissão para alterar criatura'; end if;
 if p_delta not between -300 and 300 then raise exception 'Valor inválido'; end if;
 update public.slasher71_monsters set hp=greatest(0,least(hp_max,hp+p_delta)) where id=p_id;
end $$;

create or replace function public.slasher71_monster_portrait(p_id uuid,p_portrait text)
returns void language plpgsql security definer set search_path='' as $$
declare v public.slasher71_monsters;
begin
 select * into v from public.slasher71_monsters where id=p_id;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Somente o mestre edita o retrato do monstro'; end if;
 if char_length(coalesce(p_portrait,''))>150000 then raise exception 'Retrato grande demais'; end if;
 if coalesce(p_portrait,'')<>'' and coalesce(p_portrait,'') !~ '^data:image/(jpeg|png|webp);base64,' then raise exception 'Formato inválido'; end if;
 update public.slasher71_monsters set portrait=coalesce(p_portrait,'') where id=p_id;
end $$;

create or replace function public.slasher71_inventory_grant(p_character uuid,p_title text,p_kind text,p_damage integer,p_quantity integer,p_details text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.characters; v_id uuid;
begin
 select * into v from public.characters where id=p_character;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Somente o mestre concede equipamentos'; end if;
 if char_length(btrim(coalesce(p_title,''))) not between 2 and 80 or p_kind not in('item','weapon') or p_damage not in(0,4,6,8,10,12) or (p_kind='item' and p_damage<>0) or (p_kind='weapon' and p_damage=0) or p_quantity not between 1 and 99 or char_length(coalesce(p_details,''))>400 then raise exception 'Equipamento inválido'; end if;
 insert into public.slasher71_inventory(campaign_id,character_id,title,kind,damage_sides,quantity,details)
 values(v.campaign_id,p_character,btrim(p_title),p_kind,p_damage,p_quantity,coalesce(p_details,'')) returning id into v_id;
 return v_id;
end $$;

create or replace function public.slasher71_inventory_remove(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.slasher71_inventory;
begin
 select * into v from public.slasher71_inventory where id=p_id;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Somente o mestre remove equipamentos'; end if;
 delete from public.slasher71_inventory where id=p_id;
end $$;

create or replace function public.slasher71_shop_set(p_campaign uuid,p_name text,p_open boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.slasher_is_gm(p_campaign) then raise exception 'Somente o mestre controla a loja'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 2 and 80 then raise exception 'Nome da loja inválido'; end if;
 insert into public.slasher71_shops(campaign_id,name,is_open) values(p_campaign,btrim(p_name),p_open)
 on conflict(campaign_id) do update set name=excluded.name,is_open=excluded.is_open,updated_at=now();
end $$;

create or replace function public.slasher71_stock_add(p_campaign uuid,p_title text,p_kind text,p_damage integer,p_price integer,p_stock integer,p_details text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.slasher_is_gm(p_campaign) then raise exception 'Somente o mestre edita o catálogo'; end if;
 if char_length(btrim(coalesce(p_title,''))) not between 2 and 80 or p_kind not in('item','weapon') or p_damage not in(0,4,6,8,10,12) or (p_kind='item' and p_damage<>0) or (p_kind='weapon' and p_damage=0) or p_price not between 0 and 100000 or p_stock not between 0 and 999 or char_length(coalesce(p_details,''))>400 then raise exception 'Produto inválido'; end if;
 insert into public.slasher71_shop_stock(campaign_id,title,kind,damage_sides,price,stock,details)
 values(p_campaign,btrim(p_title),p_kind,p_damage,p_price,p_stock,coalesce(p_details,'')) returning id into v_id;
 return v_id;
end $$;

create or replace function public.slasher71_stock_remove(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.slasher71_shop_stock;
begin
 select * into v from public.slasher71_shop_stock where id=p_id;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Somente o mestre remove produtos'; end if;
 delete from public.slasher71_shop_stock where id=p_id;
end $$;

create or replace function public.slasher71_wallet_adjust(p_character uuid,p_delta integer)
returns void language plpgsql security definer set search_path='' as $$
declare v public.characters;
begin
 select * into v from public.characters where id=p_character for update;
 if v.id is null or not public.slasher_is_gm(v.campaign_id) then raise exception 'Somente o mestre altera o dinheiro'; end if;
 if p_delta not between -100000 and 100000 then raise exception 'Valor inválido'; end if;
 update public.characters set credits=greatest(0,least(1000000,credits+p_delta)),updated_at=now() where id=p_character;
end $$;

create or replace function public.slasher71_buy(p_stock uuid,p_character uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_item public.slasher71_shop_stock; v_character public.characters; v_shop public.slasher71_shops; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
 select * into v_item from public.slasher71_shop_stock where id=p_stock for update;
 if v_item.id is null then raise exception 'Produto indisponível'; end if;
 select * into v_shop from public.slasher71_shops where campaign_id=v_item.campaign_id;
 if not coalesce(v_shop.is_open,false) then raise exception 'A loja está fechada'; end if;
 select * into v_character from public.characters where id=p_character for update;
 if v_character.id is null or v_character.campaign_id<>v_item.campaign_id or (v_character.owner_id is distinct from auth.uid() and not public.slasher_is_gm(v_item.campaign_id)) then raise exception 'Você não pode comprar para esta ficha'; end if;
 if v_item.stock<1 then raise exception 'Produto esgotado'; end if;
 if v_character.credits<v_item.price then raise exception 'Dinheiro insuficiente'; end if;
 update public.slasher71_shop_stock set stock=stock-1 where id=p_stock;
 update public.characters set credits=credits-v_item.price,updated_at=now() where id=p_character;
 insert into public.slasher71_inventory(campaign_id,character_id,title,kind,damage_sides,quantity,details)
 values(v_item.campaign_id,p_character,v_item.title,v_item.kind,v_item.damage_sides,1,v_item.details) returning id into v_id;
 return v_id;
end $$;

create or replace function public.slasher71_encounter_set(p_campaign uuid,p_active boolean,p_round integer,p_turn text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.slasher_is_gm(p_campaign) then raise exception 'Somente o mestre abre ou encerra combates'; end if;
 if p_round not between 1 and 999 or char_length(coalesce(p_turn,''))>80 then raise exception 'Turno inválido'; end if;
 insert into public.slasher71_encounters(campaign_id,active,round,turn_label) values(p_campaign,p_active,p_round,coalesce(p_turn,''))
 on conflict(campaign_id) do update set active=excluded.active,round=excluded.round,turn_label=excluded.turn_label,updated_at=now();
end $$;

create or replace function public.slasher71_attack(p_campaign uuid,p_actor_character uuid,p_actor_monster uuid,p_target_character uuid,p_target_monster uuid,p_inventory uuid)
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
 v_nat:=floor(random()*20)::integer+1;v_total:=v_nat+v_mod;
 v_hit:=(v_nat=20) or (v_nat<>1 and v_total>=v_def);
 if v_hit then
  v_damage:=floor(random()*v_die)::integer+1;
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

-- Funcões SECURITY DEFINER só para usuários autenticados, com validação interna.
revoke all on function public.slasher71_monster_create(uuid,text,integer,integer,integer) from public,anon;
revoke all on function public.slasher71_monster_adjust(uuid,integer) from public,anon;
revoke all on function public.slasher71_monster_portrait(uuid,text) from public,anon;
revoke all on function public.slasher71_inventory_grant(uuid,text,text,integer,integer,text) from public,anon;
revoke all on function public.slasher71_inventory_remove(uuid) from public,anon;
revoke all on function public.slasher71_shop_set(uuid,text,boolean) from public,anon;
revoke all on function public.slasher71_stock_add(uuid,text,text,integer,integer,integer,text) from public,anon;
revoke all on function public.slasher71_stock_remove(uuid) from public,anon;
revoke all on function public.slasher71_wallet_adjust(uuid,integer) from public,anon;
revoke all on function public.slasher71_buy(uuid,uuid) from public,anon;
revoke all on function public.slasher71_encounter_set(uuid,boolean,integer,text) from public,anon;
revoke all on function public.slasher71_attack(uuid,uuid,uuid,uuid,uuid,uuid) from public,anon;
grant execute on function public.slasher71_monster_create(uuid,text,integer,integer,integer) to authenticated;
grant execute on function public.slasher71_monster_adjust(uuid,integer) to authenticated;
grant execute on function public.slasher71_monster_portrait(uuid,text) to authenticated;
grant execute on function public.slasher71_inventory_grant(uuid,text,text,integer,integer,text) to authenticated;
grant execute on function public.slasher71_inventory_remove(uuid) to authenticated;
grant execute on function public.slasher71_shop_set(uuid,text,boolean) to authenticated;
grant execute on function public.slasher71_stock_add(uuid,text,text,integer,integer,integer,text) to authenticated;
grant execute on function public.slasher71_stock_remove(uuid) to authenticated;
grant execute on function public.slasher71_wallet_adjust(uuid,integer) to authenticated;
grant execute on function public.slasher71_buy(uuid,uuid) to authenticated;
grant execute on function public.slasher71_encounter_set(uuid,boolean,integer,text) to authenticated;
grant execute on function public.slasher71_attack(uuid,uuid,uuid,uuid,uuid,uuid) to authenticated;

-- Enviar atualizações ao vivo. As políticas RLS continuam em vigor.
do $$ declare v text; begin
 foreach v in array array['slasher71_monsters','slasher71_inventory','slasher71_shops','slasher71_shop_stock','slasher71_encounters','slasher71_combat_events'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=v) then
   execute format('alter publication supabase_realtime add table public.%I',v);
  end if;
 end loop;
end $$;

-- ============================================================
-- migrate_dice_local.sql : base integrada ao instalador 10.0
-- ============================================================

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
 insert into public.rolls(campaign_id,actor_id,character_id,kind,description,"natural",modifier,total,damage)
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

commit;