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