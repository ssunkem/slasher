/* SLASHER 7.1 · Dunmoore Horror Story · Mesa Atual
   Complemento sem build. A autorização real é validada nas funções SQL. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const pct=(n,max)=>max?clamp((Number(n)||0)/max*100,0,100):0;
const diceLabel=n=>n?`1d${n}`:'Item';
const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const DKEY='slasher71_local_';
const dockDefault=['inventory','dice','combat','shop','events','notes','catalog','master'];
// PREDEFINIÇÕES NARRATIVAS: base na novelização do Rei Oculto (versão anterior do manuscrito
// intitulada O Messias Afogado). Nomes de oponentes, estatísticas, danos e preços são adaptações
// de SLASHER, não características canônicas do romance.
const SLASHER_LIBRARY={
 monsters:[
  {key:'escavado',name:'Escavado da Mina',hp:18,defense:12,damage:8,origin:'Galeria da North Ridge',details:'Figura magra coberta de pó pálido, unhas marcando o concreto. O clarão de flash a fez recuar. Evite combate frontal.',hint:'Pista: flashes e grades de contenção abrem uma rota de fuga.'},
  {key:'vigia',name:'Vigia das Três Batidas',hp:16,defense:13,damage:6,origin:'Ruídos nas paredes',details:'Adaptação de ameaça anunciada por três batidas; surge perto de passagens, portas e corredores.',hint:'Pista: reconhecer o padrão das batidas alerta antes do ataque.'},
  {key:'eco',name:'Eco sem Nome',hp:12,defense:14,damage:4,origin:'Vozes de pessoas desaparecidas',details:'Manifestação das vozes familiares e dos nomes apagados. O rádio produz estática capaz de interromper uma imitação.',hint:'Pista: estática e gravações contraditórias revelam o engano.'},
  {key:'parede',name:'Rosto sob o Papel',hp:12,defense:15,damage:4,origin:'Corredor do quarto de Iris',details:'Forma de rosto que pressiona a parede sem rasgá-la. Encontro narrativo recomendado: escapar é mais importante que atacar.',hint:'Pista: o áudio revela passos que a imagem não registra.'},
  {key:'seguranca',name:'Segurança da Passarela',hp:19,defense:12,damage:6,origin:'Passarela da mina',details:'Vigilante humano ligado ao transporte e às cerimônias. Não é uma criatura sobrenatural.',hint:'Pista: crachás, rotas de manutenção e horários da troca de turno.'},
  {key:'marcado',name:'Operário Marcado',hp:17,defense:11,damage:8,origin:'Arquivos da mineradora',details:'Antigo trabalhador associado às galerias. Versão de RPG inspirada nos registros e nas vítimas do acordo.',hint:'Pista: os nomes escritos e riscados não são apenas decoração.'},
  {key:'rei',name:'O Rei Oculto',hp:300,defense:20,damage:12,origin:'A água negra e os nomes entregues',details:'Entidade coroada sobre a água. Esta ficha é um marcador de perigo, não um chefe convencional para derrotar com dano.',hint:'Pista: o ritual, os nomes e o retorno dos registros importam mais que a força bruta.'}
 ],
 weapons:[
  {key:'canivete',name:'Canivete dobrável',damage:4,price:12,stock:4,details:'Pequeno, fácil de esconder, alcance curto.'},
  {key:'faca',name:'Faca de caça',damage:6,price:28,stock:3,details:'Lâmina resistente; uso improvisado e perigoso.'},
  {key:'barra',name:'Barra de ferro',damage:8,price:22,stock:2,details:'Arma improvisada pesada e barulhenta.'},
  {key:'martelo',name:'Martelo de oficina',damage:6,price:20,stock:3,details:'Ferramenta comum em áreas de manutenção.'},
  {key:'chave',name:'Chave inglesa pesada',damage:6,price:18,stock:2,details:'Ferramenta útil para abrir equipamentos e se defender.'},
  {key:'cabo',name:'Cabo de picareta',damage:8,price:14,stock:2,details:'Madeira robusta retirada de uma ferramenta de mineração.'},
  {key:'picareta',name:'Picareta de mineração',damage:10,price:42,stock:1,details:'Golpe devastador, difícil de carregar e de esconder.'},
  {key:'bastao',name:'Bastão de madeira',damage:6,price:9,stock:4,details:'Discreto, quebra após uso excessivo a critério do mestre.'},
  {key:'tesoura',name:'Tesoura escolar',damage:4,price:5,stock:5,details:'Arma improvisada de emergência, não indicada para combate.'}
 ],
 items:[
  {key:'lanterna',name:'Lanterna portátil',price:15,stock:5,details:'A luz permite atravessar galerias e identificar sulcos nas paredes.'},
  {key:'pilhas',name:'Pilhas sobressalentes',price:6,stock:8,details:'Mantêm o rádio, a lanterna e o gravador funcionando.'},
  {key:'flash',name:'Câmera descartável com flash',price:22,stock:3,details:'O flash afugentou a figura vista nos túneis. Não é uma arma comum.'},
  {key:'radio',name:'Rádio portátil',price:28,stock:2,details:'A estática interrompeu uma voz na casa de Iris.'},
  {key:'gravador',name:'Gravador portátil de fita',price:35,stock:2,details:'A fita pode registrar sons que parecem não ter ocorrido.'},
  {key:'cassete',name:'Fita cassete virgem',price:8,stock:5,details:'Grave depoimentos e ruídos antes que sejam esquecidos.'},
  {key:'corda',name:'Corda de manutenção (15 m)',price:14,stock:4,details:'Essencial para galerias e passarelas deterioradas.'},
  {key:'ferramentas',name:'Kit básico de ferramentas',price:35,stock:2,details:'Acesso a painéis, parafusos, trancas e improvisos.'},
  {key:'medico',name:'Kit de primeiros socorros',price:25,stock:3,details:'Bandagens para estabilizar ferimentos; não cura instantânea.'},
  {key:'mapa',name:'Mapa anotado da North Ridge',price:0,stock:1,details:'Cópia de mapa antiga; informações de galeria podem ter sido apagadas.'},
  {key:'foto',name:'Fotografia antiga',price:0,stock:1,details:'Evidência. Nomes e figuras podem desaparecer dos registros.'},
  {key:'linha',name:'Fio vermelho de marcação',price:2,stock:6,details:'Marca trajetos e serve como referência quando a orientação falha.'},
  {key:'sacos',name:'Sacos plásticos para arquivos',price:4,stock:6,details:'Protegem registros da umidade da mina.'},
  {key:'mascara',name:'Máscara antipó descartável',price:5,stock:5,details:'Proteção básica em áreas de mineração; não torna a água negra segura.'}
 ]
};
const allPresets=()=>[...SLASHER_LIBRARY.weapons.map(x=>({...x,kind:'weapon'})),...SLASHER_LIBRARY.items.map(x=>({...x,kind:'item',damage:0}))];
function findPreset(kind,key){return kind==='monster'?SLASHER_LIBRARY.monsters.find(x=>x.key===key):allPresets().find(x=>x.kind===kind&&x.key===key)}

let lastKnownCamp=null,flashId=null,focusKey=null;
// O alvo de combate é uma escolha da interface, nunca uma permissão de ataque.
// O servidor continua validando a criatura, o dono da arma e a ação.
let selectedMonster={key:'',id:''};
function targetScope(s){return `${s.user?.id||'guest'}:${s.campaignId||'no-campaign'}`}
function selectedTarget(s,monsters){
 const key=targetScope(s);
 if(selectedMonster.key!==key)selectedMonster={key,id:''};
 const valid=monsters.find(m=>m.id===selectedMonster.id&&Number(m.hp)>0);
 if(!valid)selectedMonster.id='';
 return selectedMonster.id;
}

const sortKey=(s)=>`slasher71_docks_${s.user?.id||'guest'}_${s.campaignId}`;
const focusStorage=(s)=>`slasher71_focus_${s.user?.id||'guest'}_${s.campaignId}`;
const activeKey=(s)=>`slasher71_weapon_${s.user?.id||'guest'}_${s.campaignId}`;
function safeJson(s,fallback){try{return JSON.parse(s)||fallback}catch{return fallback}}
function getLocal(key,fallback){try{return safeJson(localStorage.getItem(key),fallback)}catch{return fallback}}
function setLocal(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch{}}
function freshDemo(s){const all=s.characters||[];const first=all[0];return {monsters:[{id:id(),campaign_id:s.campaignId,name:'Escavado da Mina',hp:16,hp_max:20,defense:12,damage_sides:8,portrait:'',description:'Ouve passos através de paredes úmidas.'},{id:id(),campaign_id:s.campaignId,name:'Vigia das Três Batidas',hp:14,hp_max:14,defense:13,damage_sides:6,portrait:'',description:'Sempre chega após a terceira batida.'}],inventory:first?[{id:id(),campaign_id:s.campaignId,character_id:first.id,title:'Canivete de Caça',kind:'weapon',damage_sides:6,quantity:1,details:'Lâmina gasta; 1d6 de dano'},{id:id(),campaign_id:s.campaignId,character_id:first.id,title:'Lanterna',kind:'item',damage_sides:0,quantity:1,details:'Pilhas fracas'}]:[],shop:{campaign_id:s.campaignId,is_open:true,name:'Mercado da Rua Norte'},stock:[{id:id(),campaign_id:s.campaignId,title:'Kit de primeiros socorros',kind:'item',damage_sides:0,price:20,stock:5,details:'Bandagens e gaze limpa.'},{id:id(),campaign_id:s.campaignId,title:'Barra de ferro',kind:'weapon',damage_sides:8,price:35,stock:3,details:'Pesada, faz muito barulho.'}],encounter:{campaign_id:s.campaignId,active:true,round:1,turn_label:'Eleanor Hayes'},events:[],demoCredits:{}}}
function currentData(s){return s.mesa71||{monsters:[],inventory:[],shop:null,stock:[],encounter:null,events:[],ready:false,error:''}}
function roleGM(s){return s.campaign&&s.members.some(m=>m.user_id===s.user?.id&&m.role==='gm')&&!s.gmPreview}
async function rpc(api,fn,args){const {data,error}=await api.sb.rpc('slasher71_'+fn,args);if(error)throw error;return data}
async function query(api,table,campaign,opts={}){let q=api.sb.from('slasher71_'+table).select('*').eq('campaign_id',campaign);if(opts.order)q=q.order(opts.order,{ascending:false});if(opts.limit)q=q.limit(opts.limit);const {data,error}=await q;if(error)throw error;return data||[]}
async function load(s,api){if(!s.campaignId)return;const camp=s.campaignId;const old=s.mesa71;
 if(s.mode==='demo'){
  const k=DKEY+camp;let local=getLocal(k,null);if(!local){local=freshDemo(s);setLocal(k,local)}
  s.mesa71={...local,ready:true,error:''};return;
 }
 try{
  const [monsters,inventory,shops,stock,encounters,events]=await Promise.all([
   query(api,'monsters',camp),query(api,'inventory',camp),query(api,'shops',camp),query(api,'shop_stock',camp),query(api,'encounters',camp),query(api,'combat_events',camp,{order:'created_at',limit:35})
  ]);
  if(old?.ready&&events[0]?.id&&old.events?.[0]?.id!==events[0].id)flashId=events[0].id;
  s.mesa71={monsters,inventory,shop:shops[0]||null,stock,encounter:encounters[0]||null,events,ready:true,error:''};lastKnownCamp=camp;
 }catch(e){s.mesa71={...(old||{}),ready:false,error:e?.message||'Erro ao carregar Mesa Atual',monsters:old?.monsters||[],inventory:old?.inventory||[],stock:old?.stock||[],events:old?.events||[]};}
}
function persistDemo(s){if(s.mode==='demo')setLocal(DKEY+s.campaignId,s.mesa71)}
function getLayout(s){const o=getLocal(sortKey(s),null)||{};return {order:Array.isArray(o.order)?[...new Set([...o.order,...dockDefault])].filter(x=>dockDefault.includes(x)):dockDefault.slice(),hidden:o.hidden||{}}}
function setLayout(s,layout){setLocal(sortKey(s),layout)}
function activeWeapon(s,charId){const o=getLocal(activeKey(s),{});return o[charId]||''}
function saveWeapon(s,charId,weaponId){const o=getLocal(activeKey(s),{});o[charId]=weaponId;setLocal(activeKey(s),o)}
function getFocus(s){const saved=focusKey||getLocal(focusStorage(s),null);const own=s.characters.filter(c=>roleGM(s)||c.owner_id===s.user?.id);const all=[...own.map(c=>({key:'c:'+c.id,type:'character',data:c})),...(roleGM(s)?currentData(s).monsters.map(m=>({key:'m:'+m.id,type:'monster',data:m})):[])];return all.find(x=>x.key===saved)||all[0]||null}
function avatar(person,type='character',size='normal'){
 const title=esc(person?.name||'?');const portrait=person?.portrait||'';
 return `<div class="m71-portrait ${size} ${type==='monster'?'monster':''}">${portrait.startsWith('data:image/')?`<img src="${esc(portrait)}" alt="Retrato de ${title}">`:`<span>${type==='monster'?'☠':title[0]||'?'}</span>`}</div>`;
}
function meter(label,now,max,kind='',active=false,pre=null){const value=Number(now||0),p=pct(value,max);const from=pre==null?p:pct(pre,max);return `<div class="m71-meter-wrap ${active?'hit':''}"><div class="m71-between"><span>${esc(label)}</span><strong class="m71-numeric" ${active&&pre!=null?`data-m71-from="${Number(pre)}" data-m71-to="${value}" data-m71-max="${max}"`:''}>${value} / ${max}</strong></div><div class="m71-meter ${kind}" style="--m71-from:${from}%;--m71-to:${p}%"><div class="m71-meter-ghost"></div><div class="m71-meter-fill"></div></div></div>`}
function characterStatus(s,focus){if(!focus)return `<div class="m71-empty-hero"><h2>Nenhuma ficha disponível.</h2><p>Crie um sobrevivente na aba “Sobreviventes” ou peça ao mestre para atribuir uma ficha.</p><button class="btn red" data-action="go" data-value="characters">Abrir sobreviventes</button></div>`;
 const c=focus.data,monster=focus.type==='monster';const max=Number(c.hp_max||16),statuses=(s.effects||[]).filter(e=>e.character_id===c.id&&e.kind==='condition');const item=(!monster?currentData(s).inventory.find(i=>i.id===activeWeapon(s,c.id)):null);const latest=currentData(s).events[0];const justHit=latest?.id===flashId&&(monster?latest.target_monster_id===c.id:latest.target_character_id===c.id)&&latest.hit;const hpFrom=justHit?latest.hp_before:null;
 return `<section class="m71-hero"><div class="m71-hero-copy"><div class="eyebrow">DUNMOORE / ARQUIVO DA SESSÃO</div><div class="m71-hero-label">${monster?'ENTIDADE REGISTRADA':'SOBREVIVENTE EM CAMPO'}</div><h2>${esc(c.name)}</h2><p>${monster?esc(c.description||'A cidade não deveria conhecer esta presença.'):esc(c.occupation||'Habitante de Dunmoore')} · ${monster?'CRIATURA':esc(c.class_key?.toUpperCase()||'SOBREVIVENTE')}</p><div class="m71-status-stack">${meter('VIDA',c.hp,max,'hp',justHit,hpFrom)}${!monster?meter('STAMINA',c.stamina,c.stamina_max,'stamina')+meter('ESTRESSE',c.stress,100,'stress'):meter('DANO',c.damage_sides,c.damage_sides,'stamina')}</div><div class="m71-conditions">${monster?`<span class="m71-pill">DEFESA ${c.defense}</span><span class="m71-pill">ATAQUE 1d${c.damage_sides}</span>`:statuses.map(e=>`<span class="m71-pill dangerous">✚ ${esc(e.title)}</span>`).join('')||'<span class="m71-pill">SEM CONDIÇÕES</span>'}</div></div><div class="m71-hero-character">${avatar(c,monster?'monster':'character','hero')}<div class="m71-portrait-caption">${monster?'DOSSIÊ DA CRIATURA':'REGISTRO Nº '+String(c.id).slice(0,6).toUpperCase()}</div></div><div class="m71-evidence"><div class="eyebrow">EM DESTAQUE</div><div class="m71-evidence-symbol">${monster?'☠':item?'⚔':'⌾'}</div><h3>${monster?'A ameaça observa':item?esc(item.title):'Nenhuma arma equipada'}</h3><p>${monster?'O mestre controla os ataques desta entidade.':item?`Dano automático ${diceLabel(item.damage_sides)}. Escolhida no inventário.`:'Abra o inventário e selecione uma arma.'}</p><div class="m71-evidence-bottom">${monster?esc(c.name):'ARQUIVO PESSOAL · DUNMOORE'}</div></div></section>`;
}
function inventoryWidget(s,focus){const c=focus?.type==='character'?focus.data:null;const inv=currentData(s).inventory.filter(i=>i.character_id===c?.id);const legacy=(s.effects||[]).filter(e=>e.character_id===c?.id&&e.kind==='item');if(!c)return '<div class="m71-info">Selecione um sobrevivente para consultar os pertences.</div>';
 const selected=activeWeapon(s,c.id);return `<p class="m71-help">Clique em <b>Equipar</b> numa arma para selecioná-la no combate. Inventário sincronizado com a campanha.</p><div class="m71-items">${inv.map(i=>`<div class="m71-item"><div class="m71-item-icon">${i.kind==='weapon'?'⚔':'▣'}</div><div class="m71-item-copy"><b>${esc(i.title)}</b><small>${i.kind==='weapon'?`ARMA · ${diceLabel(i.damage_sides)}`:'OBJETO'} · QTD ${i.quantity}</small><small>${esc(i.details)}</small></div>${i.kind==='weapon'?`<button class="btn small ${selected===i.id?'red':'flat'}" data-action="mesa-equip" data-character="${c.id}" data-item="${i.id}">${selected===i.id?'Equipada':'Equipar'}</button>`:''}${roleGM(s)?`<button class="btn small flat" data-action="mesa-del-inventory" data-item="${i.id}" title="Remover item">✕</button>`:''}</div>`).join('')}${legacy.map(i=>`<div class="m71-item legacy"><div class="m71-item-icon">▣</div><div class="m71-item-copy"><b>${esc(i.title)}</b><small>ITEM ANTIGO · ${esc(i.details||'')}</small></div></div>`).join('')}${!inv.length&&!legacy.length?'<div class="m71-info">Inventário vazio. Peça itens ao mestre ou compre numa loja aberta.</div>':''}</div><div class="m71-bottomline">DINHEIRO <b>$ ${Number(c.credits??80)}</b></div>`;
}
function diceWidget(s,focus){const c=focus?.type==='character'?focus.data:null;return `<p class="m71-help">Teste livre com D20. Para atacar e causar dano real, use a janela <b>Combate atual</b>.</p><form data-mesa-form="test" class="m71-form"><label>Sobrevivente<input name="char_name" value="${esc(c?.name||'Sem personagem')}" disabled></label><div class="m71-two"><label>Atributo<select name="attr">${[['none','Sem atributo'],['CIE','Ciências'],['RAL','Raciocínio'],['COC','Oculto'],['EDF','Educação física'],['REF','Reflexos'],['TEC','Tecnologia'],['CRI','Criatividade'],['SOC','Social']].map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Circunstância<select name="circumstance">${[-4,-3,-2,-1,0,1,2,3,4].map(n=>`<option value="${n}" ${n===0?'selected':''}>${n>0?'+':''}${n}</option>`).join('')}</select></label></div><label>O que você está tentando fazer?<input name="description" maxlength="120" placeholder="Ex.: Escapar pelo corredor"></label><button class="btn red" type="submit" ${!s.campaignId?'disabled':''}>⬡ Rolar D20</button></form>`}
function encounterWidget(s,focus){
 const d=currentData(s),enc=d.encounter,monsters=d.monsters,c=focus?.type==='character'?focus.data:null,gm=roleGM(s);
 if(!enc?.active){if(selectedMonster.key===targetScope(s))selectedMonster.id='';return `<div class="m71-no-combat"><span>☾</span><h3>Nenhum combate ativo</h3><p>O mestre abre um confronto quando Dunmoore deixa de apenas observar.</p>${gm?'<button class="btn red" data-action="mesa-open-combat">Iniciar combate</button>':''}</div>`}
 const weapons=c?d.inventory.filter(i=>i.character_id===c.id&&i.kind==='weapon'):[];
 const w=activeWeapon(s,c?.id),targetId=selectedTarget(s,monsters);
 const target=monsters.find(m=>m.id===targetId);
 return `<div class="m71-encounter-status"><span class="m71-pill dangerous">● CONFRONTO AO VIVO</span><span class="m71-pill">RODADA ${enc.round}</span><span class="m71-pill">VEZ DE ${esc(enc.turn_label||'A definir')}</span></div>
 <div class="m71-target-prompt">${c?'Selecione seu alvo clicando na criatura:':'Criaturas presentes no combate:'}</div>
 <div class="m71-combatants" role="group" aria-label="Criaturas do combate">${monsters.map(m=>{
  const alive=Number(m.hp)>0,chosen=m.id===targetId;
  return `<button class="m71-combatant m71-target ${chosen?'selected':''} ${!alive?'defeated':''}" type="button" data-action="mesa-select-monster" data-monster="${esc(m.id)}" aria-pressed="${chosen?'true':'false'}" aria-label="${alive?'Selecionar alvo':'Criatura incapacitada'}: ${esc(m.name)}, ${m.hp} de ${m.hp_max} pontos de vida" ${alive?'':'disabled'}>${avatar(m,'monster')}<span class="m71-target-info"><span class="m71-target-heading"><b>${esc(m.name)}</b><span class="m71-target-label">${chosen?'✓ ALVO SELECIONADO':alive?'ESCOLHER ALVO':'INCAPACITADO'}</span></span>${meter('HP',m.hp,m.hp_max,'hp')}</span></button>`
 }).join('')||'<p class="m71-info">Nenhuma criatura registrada.</p>'}</div>
 ${c?`<form data-mesa-form="attack" class="m71-form"><h4>Atacar criatura</h4><input type="hidden" name="target" value="${esc(targetId)}"><p class="m71-target-hint" data-m71-target-hint>${target?`Alvo selecionado: <strong>${esc(target.name)}</strong>`:'Clique em um monstro acima para liberar o ataque.'}</p><label class="field">Arma<select name="weapon"><option value="">Improvisada · 1d4</option>${weapons.map(i=>`<option value="${i.id}" ${i.id===w?'selected':''}>${esc(i.title)} · ${diceLabel(i.damage_sides)}</option>`).join('')}</select></label><button class="btn red" type="submit" data-m71-attack-submit ${target?'':'disabled'}>⚔ Atacar com D20 e aplicar dano</button><p class="m71-help">Ataque e dano são calculados no servidor, conferindo arma, defensor e permissão.</p></form>`:''}
 ${gm?`<form data-mesa-form="monster-attack" class="m71-form"><h4>⚠ Ataque do monstro</h4><div class="m71-two"><label>Criatura<select name="monster" required>${monsters.map(m=>`<option value="${m.id}" ${m.hp===0?'disabled':''}>${esc(m.name)}</option>`).join('')}</select></label><label>Alvo<select name="target" required>${s.characters.map(ch=>`<option value="${ch.id}" ${ch.hp===0?'disabled':''}>${esc(ch.name)} (${ch.hp}/${ch.hp_max})</option>`).join('')}</select></label></div><button class="btn flat" type="submit">☠ Rolar ataque da criatura</button></form>`:''}`;
}

function shopWidget(s,focus){const d=currentData(s),shop=d.shop,gm=roleGM(s),c=focus?.type==='character'?focus.data:null;if(!shop?.is_open&&!gm)return '<div class="m71-info">O comércio está fechado. Quando o mestre abrir a loja, os produtos aparecerão aqui.</div>';
 return `<div class="m71-shop-title"><span>${esc(shop?.name||'Loja fechada')}</span><span class="m71-pill ${shop?.is_open?'':'dangerous'}">${shop?.is_open?'ABERTA':'FECHADA'}</span></div><div class="m71-stock">${d.stock.map(i=>`<div class="m71-stock-item"><div><b>${esc(i.title)}</b><small>${i.kind==='weapon'?`ARMA · ${diceLabel(i.damage_sides)}`:'OBJETO'} · estoque ${i.stock}</small><small>${esc(i.details||'')}</small></div><div class="m71-stock-buy"><b>$ ${i.price}</b>${shop?.is_open&&c?`<button data-action="mesa-buy" data-item="${i.id}" data-character="${c.id}" class="btn small red" ${i.stock<1||Number(c.credits??80)<i.price?'disabled':''}>Comprar</button>`:''}${gm?`<button data-action="mesa-del-stock" data-item="${i.id}" class="btn small flat">✕</button>`:''}</div></div>`).join('')||'<div class="m71-info">Nenhum produto cadastrado.</div>'}</div>${!c?'<p class="m71-help">Selecione uma ficha de sobrevivente para comprar.</p>':''}`;
}
function eventsWidget(s){const d=currentData(s);return `<div class="m71-events">${d.events.map((e,i)=>{const victim=s.characters.find(c=>c.id===e.target_character_id)||d.monsters.find(m=>m.id===e.target_monster_id);const atk=s.characters.find(c=>c.id===e.actor_character_id)||d.monsters.find(m=>m.id===e.actor_monster_id);const isNew=e.id===flashId;return `<article class="m71-event ${e.hit?'hit':'miss'} ${isNew?'impact':''}"><div class="m71-event-top"><span class="eyebrow">${e.hit?'ACERTO':'ERRO'} · ${new Date(e.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span><span class="m71-pill ${e.hit?'dangerous':''}">${e.hit?`-${e.damage} HP`:'SEM DANO'}</span></div><h4>${esc(e.actor_name)} <span>atacou</span> ${esc(e.target_name)}</h4><div class="m71-event-flow"><div class="m71-event-actor">${avatar(atk||{name:e.actor_name},e.actor_monster_id?'monster':'character')}<b>${esc(e.actor_name)}</b></div><span class="m71-event-arrow">➜</span><div class="m71-event-actor">${avatar(victim||{name:e.target_name},e.target_monster_id?'monster':'character')}<b>${esc(e.target_name)}</b></div></div>${meter('HP do alvo',e.hp_after,e.hp_max,'hp',isNew,e.hp_before)}<div class="m71-event-footer"><span>D20 <b>${e.die_roll}</b> · total <b>${e.total}</b> vs defesa <b>${e.defense}</b></span><span>Arma: ${esc(e.weapon_name)}</span></div>${isNew&&e.hit?`<span class="m71-floating">-${e.damage} HP</span>`:''}</article>`}).join('')||'<div class="m71-info">Nenhum confronto registrado. Os próximos ataques aparecerão aqui para todos os participantes.</div>'}</div>`;}
function notesWidget(s,focus){const c=focus?.type==='character'?focus.data:null;return `<div class="m71-notes"><div class="m71-note"><span class="eyebrow">OBSERVAÇÕES DO SOBREVIVENTE</span><p>${esc(c?.notes||'Nenhuma anotação na ficha. Pistas essenciais não precisam de sorte.')}</p></div><div class="m71-note"><span class="eyebrow">ARQUIVO DA CIDADE</span><p>Três batidas. Um nome apagado. A montanha não devolve tudo o que leva.</p></div></div>`;}
function masterWidget(s,focus){if(!roleGM(s))return '<div class="m71-info">Controles exclusivos do mestre.</div>';const d=currentData(s),c=focus?.type==='character'?focus.data:null,round=d.encounter?.round||1;
 return `<div class="m71-gm">${focus?.type==='monster'?`<form data-mesa-form="monster-adjust" class="m71-form"><h4>Editar criatura · ${esc(focus.data.name)}</h4><label>Alterar vida (+ ou -)<input name="delta" type="number" min="-300" max="300" value="5"></label><button class="btn flat" type="submit">Atualizar HP</button></form><form data-mesa-form="monster-portrait" class="m71-form"><h4>Retrato da criatura</h4><label>Imagem JPG, PNG ou WebP<input name="portrait" type="file" accept="image/png,image/jpeg,image/webp" required></label><button class="btn flat" type="submit">Salvar retrato</button></form>`:''}<form data-mesa-form="create-monster" class="m71-form"><h4>☠ Criar monstro</h4><label>Nome<input name="name" required minlength="2" maxlength="80" placeholder="Ex.: Escavado"></label><div class="m71-three"><label>HP<input name="hp" type="number" min="1" max="300" value="18"></label><label>Defesa<input name="defense" type="number" min="6" max="25" value="12"></label><label>Dano<select name="damage"><option value="4">1d4</option><option value="6" selected>1d6</option><option value="8">1d8</option><option value="10">1d10</option><option value="12">1d12</option></select></label></div><button class="btn flat" type="submit">+ Adicionar criatura</button></form><form data-mesa-form="encounter" class="m71-form"><h4>Relógio do confronto</h4><div class="m71-two"><label>Rodada<input name="round" min="1" max="999" type="number" value="${round}"></label><label>Vez de<input name="turn" maxlength="80" value="${esc(d.encounter?.turn_label||'')}" placeholder="Elizabeth"></label></div><div class="m71-inline-buttons"><button class="btn red" type="submit" name="active" value="true">Iniciar / Atualizar</button><button class="btn flat" type="submit" name="active" value="false">Encerrar</button></div></form>${c?`<form data-mesa-form="grant-item" class="m71-form"><h4>Presentear ${esc(c.name)} com item</h4><label>Nome<input name="title" maxlength="80" required placeholder="Canivete de caça"></label><div class="m71-two"><label>Tipo<select name="kind"><option value="weapon">Arma</option><option value="item">Objeto</option></select></label><label>Dano<select name="damage"><option value="0">Sem dano</option><option value="4">1d4</option><option value="6" selected>1d6</option><option value="8">1d8</option><option value="10">1d10</option><option value="12">1d12</option></select></label></div><label>Descrição<input name="details" maxlength="400"></label><button class="btn flat" type="submit">Entregar à ficha</button></form><form data-mesa-form="wallet" class="m71-form"><h4>Dinheiro do sobrevivente</h4><label>Adicionar / retirar créditos<input name="delta" type="number" min="-100000" max="100000" value="20"></label><button class="btn flat" type="submit">Alterar saldo</button></form>`:''}<form data-mesa-form="shop-settings" class="m71-form"><h4>Loja da cena</h4><label>Nome da loja<input name="name" required maxlength="80" minlength="2" value="${esc(d.shop?.name||'Mercado de Dunmoore')}"></label><div class="m71-inline-buttons"><button class="btn red" name="open" value="true" type="submit">Abrir loja</button><button class="btn flat" name="open" value="false" type="submit">Fechar loja</button></div></form><form data-mesa-form="stock" class="m71-form"><h4>Adicionar produto</h4><label>Nome<input name="title" required maxlength="80" minlength="2" placeholder="Faca de caça"></label><div class="m71-three"><label>Tipo<select name="kind"><option value="item">Objeto</option><option value="weapon">Arma</option></select></label><label>Dano<select name="damage"><option value="0">Nenhum</option><option value="4">1d4</option><option value="6">1d6</option><option value="8">1d8</option><option value="10">1d10</option><option value="12">1d12</option></select></label><label>Preço<input name="price" type="number" min="0" max="100000" value="20"></label></div><label>Estoque<input name="stock" type="number" min="0" max="999" value="3"></label><label>Descrição<input name="details" maxlength="400"></label><button class="btn flat" type="submit">Cadastrar produto</button></form></div>`;
}
function catalogWidget(s,focus){if(!roleGM(s))return '<div class="m71-info">O arquivo do mestre não está disponível aos jogadores.</div>';
 const c=focus?.type==='character'?focus.data:null,d=currentData(s);
 const mons=SLASHER_LIBRARY.monsters.map(m=>`<article class="m71-library-card"><div class="m71-lib-head"><div><div class="eyebrow">${esc(m.origin)}</div><h4>☠ ${esc(m.name)}</h4></div><span class="m71-pill">HP ${m.hp} · DEF ${m.defense} · 1d${m.damage}</span></div><p>${esc(m.details)}</p><div class="m71-lib-foot"><small>${esc(m.hint)}</small><button type="button" class="btn small red" data-action="mesa-preset-monster" data-key="${m.key}">+ Invocar</button></div></article>`).join('');
 const gear=allPresets().map(i=>`<article class="m71-library-card"><div class="m71-lib-head"><div><div class="eyebrow">${i.kind==='weapon'?'ARMA · 1D'+i.damage:'OBJETO / INVESTIGAÇÃO'}</div><h4>${i.kind==='weapon'?'⚔':'▣'} ${esc(i.name)}</h4></div><span class="m71-pill">$ ${i.price}</span></div><p>${esc(i.details)}</p><div class="m71-lib-foot"><small>${i.kind==='weapon'?'Dano 1d'+i.damage:'Sem dano'} · Estoque padrão ${i.stock}</small><div class="row"><button class="btn small flat" type="button" data-action="mesa-preset-grant" data-kind="${i.kind}" data-key="${i.key}" ${c?'':'disabled title="Selecione um sobrevivente"'}>+ Inventário</button><button class="btn small flat" type="button" data-action="mesa-preset-stock" data-kind="${i.kind}" data-key="${i.key}">+ Loja</button></div></div></article>`).join('');
 return `<div class="m71-library"><p class="m71-help">Criaturas, objetos e ferramentas inspirados na novelização <b>O Rei Oculto</b>. Nomes de criaturas e atributos são adaptações do SLASHER, não estatísticas presentes no romance. O arquivo é exclusivo do mestre; invocar não inicia combate sozinho.</p><details open><summary>☠ Criaturas preparadas (${SLASHER_LIBRARY.monsters.length})</summary><div class="m71-library-grid">${mons}</div></details><details><summary>⚔ Armas e itens preparados (${allPresets().length})</summary><p class="m71-help">Selecione um sobrevivente no topo para entregar um equipamento. Adicionar à loja não a abre automaticamente.</p><div class="m71-inline-buttons"><button class="btn red" data-action="mesa-seed-stock" type="button">Abastecer loja com kit inicial</button></div><div class="m71-library-grid">${gear}</div></details><p class="m71-help">Fora do catálogo: use <b>Painel do mestre</b> para criar monstros ou equipamentos personalizados. Itens de cena não surgem magicamente no inventário dos jogadores.</p></div>`;
}
const widgets={inventory:['▦','Inventário'],dice:['⬡','Rolagem rápida'],combat:['⚔','Combate atual'],shop:['◇','Loja da cena'],events:['☠','Registro de combate'],notes:['☷','Notas e pistas'],catalog:['▣','Catálogo de Dunmoore'],master:['✚','Painel do mestre']};
function render(s){const d=currentData(s);if(!d.ready)return `<section class="m71-page"><div class="m71-panel"><h2>Instalação da Mesa Atual</h2><p>A interface 7.1 precisa da migração do Supabase. Execute <code>migrate_7_1.sql</code> no SQL Editor sem apagar o banco anterior.</p><p class="m71-error">${esc(d.error||'Verificando tabelas do SLASHER 7.1...')}</p><button data-action="mesa-retry" class="btn red">Tentar carregar novamente</button></div></section>`;
 const layout=getLayout(s),f=getFocus(s),gm=roleGM(s);const own=s.characters.filter(c=>gm||c.owner_id===s.user?.id);const pick=[...own.map(c=>({key:'c:'+c.id,name:c.name,type:'character'})),...(gm?d.monsters.map(m=>({key:'m:'+m.id,name:m.name,type:'monster'})):[])];
 const widgetsHtml={inventory:()=>inventoryWidget(s,f),dice:()=>diceWidget(s,f),combat:()=>encounterWidget(s,f),shop:()=>shopWidget(s,f),events:()=>eventsWidget(s),notes:()=>notesWidget(s,f),catalog:()=>catalogWidget(s,f),master:()=>masterWidget(s,f)};
 const panes=layout.order.filter(k=>gm||k!=='master'&&k!=='catalog').filter(k=>gm||k!=='shop'||d.shop?.is_open).map(k=>`<article class="m71-dock ${layout.hidden[k]?'minimized':''}" data-dock="${k}" draggable="true"><div class="m71-dock-bar"><div class="m71-dock-title"><span>${widgets[k][0]}</span><h3>${widgets[k][1]}</h3></div><div class="m71-dock-tools"><button type="button" title="Mover para a esquerda" data-action="mesa-move" data-dock="${k}" data-dir="-1">←</button><button type="button" title="Mover para a direita" data-action="mesa-move" data-dock="${k}" data-dir="1">→</button><button type="button" title="Recolher ou expandir" data-action="mesa-toggle" data-dock="${k}">${layout.hidden[k]?'+':'−'}</button><span title="Arraste para reorganizar">⋮⋮</span></div></div><div class="m71-dock-content">${layout.hidden[k]?'':widgetsHtml[k]()}</div></article>`).join('');
 return `<div class="m71-page"><header class="m71-page-title"><div><div class="eyebrow">SLASHER 7.1 / ESTA É SUA MESA</div><h2>Mesa Atual</h2><p>O horror acontece aqui. Arraste as janelas ou use as setas para montar o seu próprio painel.</p></div><label>PERSONAGEM EM FOCO<select id="m71-focus">${pick.map(p=>`<option value="${p.key}" ${f?.key===p.key?'selected':''}>${p.type==='monster'?'☠':'◉'} ${esc(p.name)}</option>`).join('')}</select></label></header>${characterStatus(s,f)}<div class="m71-board-head"><div><div class="eyebrow">PAINEL PERSONALIZÁVEL</div><h3>Centro de operações</h3></div><button class="btn small flat" data-action="mesa-reset-layout">↺ Restaurar janelas</button></div><section class="m71-board" id="m71-board">${panes}</section></div>`;
}
async function compressPortrait(file){if(!file||!file.size)throw Error('Selecione uma imagem');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Formato não permitido');if(file.size>8*1024*1024)throw Error('Imagem acima de 8 MB');return new Promise((resolve,reject)=>{const src=URL.createObjectURL(file),img=new Image();img.onerror=()=>{URL.revokeObjectURL(src);reject(Error('Não foi possível ler a imagem'))};img.onload=()=>{URL.revokeObjectURL(src);try{const k=Math.min(1,300/img.width,380/img.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*k));canvas.height=Math.max(1,Math.round(img.height*k));const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/jpeg',.7);if(data.length>149000)data=canvas.toDataURL('image/jpeg',.43);if(data.length>149000)throw Error('Imagem muito grande mesmo após otimizar');resolve(data)}catch(e){reject(e)}};img.src=src})}
function formData(form){return Object.fromEntries(new FormData(form).entries())}
function mustGM(s){if(!roleGM(s))throw Error('Somente o mestre pode realizar esta ação')}
function mustFocusChar(s){const c=getFocus(s);if(c?.type!=='character')throw Error('Escolha um sobrevivente primeiro');return c.data}
function demoRpc(s,op,p){const d=currentData(s),gm=roleGM(s),c=s.characters.find(ch=>ch.id===p.p_character),stock=d.stock.find(i=>i.id===p.p_stock);const update=()=>{persistDemo(s)};if(['monster_create','monster_adjust','monster_portrait','inventory_grant','inventory_remove','shop_set','stock_add','stock_remove','wallet_adjust','encounter_set'].includes(op)&&!gm)throw Error('Apenas o mestre pode editar a mesa');
 if(op==='monster_create'){const monsterId=id();d.monsters.push({id:monsterId,campaign_id:s.campaignId,name:p.p_name,hp:p.p_hp,hp_max:p.p_hp,defense:p.p_defense,damage_sides:p.p_damage,description:p.p_description||''});update();return monsterId}
 if(op==='monster_adjust'){const m=d.monsters.find(x=>x.id===p.p_id);if(m)m.hp=clamp(m.hp+p.p_delta,0,m.hp_max);update()}
 if(op==='monster_portrait'){const m=d.monsters.find(x=>x.id===p.p_id);if(m)m.portrait=p.p_portrait;update()}
 if(op==='inventory_grant'){d.inventory.push({id:id(),campaign_id:s.campaignId,character_id:p.p_character,title:p.p_title,kind:p.p_kind,damage_sides:p.p_damage,quantity:p.p_quantity,details:p.p_details});update()}
 if(op==='inventory_remove'){d.inventory=d.inventory.filter(i=>i.id!==p.p_id);update()}
 if(op==='shop_set'){d.shop={campaign_id:s.campaignId,name:p.p_name,is_open:p.p_open};update()}
 if(op==='stock_add'){d.stock.push({id:id(),campaign_id:s.campaignId,title:p.p_title,kind:p.p_kind,damage_sides:p.p_damage,price:p.p_price,stock:p.p_stock,details:p.p_details});update()}
 if(op==='stock_remove'){d.stock=d.stock.filter(i=>i.id!==p.p_id);update()}
 if(op==='wallet_adjust'){const ch=s.characters.find(x=>x.id===p.p_character);ch.credits=clamp((ch.credits??80)+p.p_delta,0,1000000);update()}
 if(op==='buy'){if(!d.shop?.is_open||!stock||!stock.stock)throw Error('Produto indisponível');const ch=s.characters.find(x=>x.id===p.p_character);if(!ch)throw Error('Selecione um sobrevivente');if(ch.owner_id!==s.user?.id&&!gm)throw Error('Ficha não pertence a você');if((ch.credits??80)<stock.price)throw Error('Dinheiro insuficiente');ch.credits=(ch.credits??80)-stock.price;stock.stock-=1;d.inventory.push({...stock,id:id(),character_id:ch.id,quantity:1});update()}
 if(op==='encounter_set'){d.encounter={campaign_id:s.campaignId,active:p.p_active,round:p.p_round,turn_label:p.p_turn};update()}
 if(op==='attack'){
  const attacker=p.p_actor_character?s.characters.find(x=>x.id===p.p_actor_character):d.monsters.find(x=>x.id===p.p_actor_monster);
  const victim=p.p_target_character?s.characters.find(x=>x.id===p.p_target_character):d.monsters.find(x=>x.id===p.p_target_monster);
  if(!attacker||!victim)throw Error('Atacante ou alvo inválido');if(p.p_actor_monster&&!gm)throw Error('Somente o mestre controla monstros');
  if(p.p_actor_character&&attacker.owner_id!==s.user.id&&!gm)throw Error('Você não controla este sobrevivente');
  const item=d.inventory.find(i=>i.id===p.p_inventory);if(item&&(item.kind!=='weapon'||item.character_id!==attacker.id))throw Error('Arma inválida');
  const die=p.p_actor_monster?attacker.damage_sides:(item?.damage_sides||4),mod=p.p_actor_monster?2:Number(attacker.attrs?.REF||0),natural=Math.floor(Math.random()*20)+1,total=natural+mod,defense=p.p_target_monster?victim.defense:10+Number(victim.attrs?.REF||0);const hit=natural===20||(natural!==1&&total>=defense);const damage=hit?Math.floor(Math.random()*die)+1+(natural===20?2:0):0;const before=victim.hp;victim.hp=Math.max(0,before-damage);
  const ev={id:id(),campaign_id:s.campaignId,actor_name:attacker.name,target_name:victim.name,weapon_name:item?.title||(p.p_actor_monster?'Ataque da criatura':'Ataque improvisado'),actor_character_id:p.p_actor_character||null,actor_monster_id:p.p_actor_monster||null,target_character_id:p.p_target_character||null,target_monster_id:p.p_target_monster||null,die_roll:natural,total,defense,hit,damage,hp_before:before,hp_after:victim.hp,hp_max:victim.hp_max,created_at:new Date().toISOString()};d.events.unshift(ev);d.events=d.events.slice(0,35);flashId=ev.id;update();return ev;
 }
}
async function run(s,api,op,p){if(s.mode==='demo')return demoRpc(s,op,p);return rpc(api,op,p)}
async function refresh(s,api,display){if(s.mode==='online')await display.refreshCampaign(true);else{persistDemo(s);api.save?.();display.render()} }
async function action(act,btn,ctx){const {state:s,api,refreshCampaign,render,toast}=ctx;const d=currentData(s),c=getFocus(s);const idVal=btn.dataset.item;
 if(act==='mesa-select-monster'){
  const monster=d.monsters.find(m=>m.id===btn.dataset.monster);
  if(!d.encounter?.active||!monster||Number(monster.hp)<=0)throw Error('Essa criatura não pode ser selecionada.');
  selectedMonster={key:targetScope(s),id:monster.id};
  const combatDock=btn.closest('.m71-dock');
  combatDock?.querySelectorAll('[data-action="mesa-select-monster"]').forEach(card=>{
    const isPicked=card.dataset.monster===monster.id;
    card.classList.toggle('selected',isPicked);
    card.setAttribute('aria-pressed',isPicked?'true':'false');
    const label=card.querySelector('.m71-target-label');
    if(label)label.textContent=isPicked?'✓ ALVO SELECIONADO':'ESCOLHER ALVO';
  });
  const attackForm=combatDock?.querySelector('form[data-mesa-form="attack"]');
  const targetInput=attackForm?.querySelector('input[name="target"]');
  if(targetInput)targetInput.value=monster.id;
  const attackButton=attackForm?.querySelector('[data-m71-attack-submit]');
  if(attackButton)attackButton.disabled=false;
  const hint=attackForm?.querySelector('[data-m71-target-hint]');
  if(hint){hint.textContent='Alvo selecionado: '+monster.name;hint.classList.add('ready')}
  btn.disabled=false;
  return;
 }
 if(act==='mesa-preset-monster'){
  mustGM(s);const p=findPreset('monster',btn.dataset.key);if(!p)throw Error('Criatura não encontrada no catálogo');btn.disabled=true;
  const monsterId=await run(s,api,'monster_create',{p_campaign:s.campaignId,p_name:p.name,p_hp:p.hp,p_defense:p.defense,p_damage:p.damage});
  if(monsterId){onFocus(s,'m:'+monsterId)}await refresh(s,api,{refreshCampaign,render});toast('Criatura invocada: '+p.name+'. Agora você pode iniciar o confronto.');return;
 }
 if(act==='mesa-preset-grant'||act==='mesa-preset-stock'){
  mustGM(s);const p=findPreset(btn.dataset.kind,btn.dataset.key);if(!p)throw Error('Item não encontrado no catálogo');btn.disabled=true;
  if(act==='mesa-preset-grant'){const ch=mustFocusChar(s);await run(s,api,'inventory_grant',{p_character:ch.id,p_title:p.name,p_kind:p.kind,p_damage:p.damage||0,p_quantity:1,p_details:p.details});toast(p.name+' entregue a '+ch.name+'.')}
  else {await run(s,api,'stock_add',{p_campaign:s.campaignId,p_title:p.name,p_kind:p.kind,p_damage:p.damage||0,p_price:p.price,p_stock:p.stock,p_details:p.details});toast(p.name+' cadastrado na loja.')}
  await refresh(s,api,{refreshCampaign,render});return;
 }
 if(act==='mesa-seed-stock'){
  mustGM(s);btn.disabled=true;let added=0;let present=new Set(d.stock.map(x=>x.kind+'::'+x.title));
  for(const p of allPresets().filter(x=>x.price>0&&x.price<=35)){
   if(present.has(p.kind+'::'+p.name))continue;
   await run(s,api,'stock_add',{p_campaign:s.campaignId,p_title:p.name,p_kind:p.kind,p_damage:p.damage||0,p_price:p.price,p_stock:p.stock,p_details:p.details});present.add(p.kind+'::'+p.name);added++;
  }
  await refresh(s,api,{refreshCampaign,render});toast(added?'Loja abastecida com '+added+' equipamentos. Abra a loja para disponibilizá-los.':'Catálogo inicial já estava na loja.');return;
 }
 if(act==='mesa-retry'){await load(s,api);render();return}
 if(act==='mesa-reset-layout'){setLayout(s,{order:dockDefault,hidden:{}});render();return}
 if(act==='mesa-toggle'){const l=getLayout(s);l.hidden[btn.dataset.dock]=!l.hidden[btn.dataset.dock];setLayout(s,l);render();return}
 if(act==='mesa-move'){const l=getLayout(s),pos=l.order.indexOf(btn.dataset.dock);const to=pos+Number(btn.dataset.dir);if(pos>=0&&to>=0&&to<l.order.length){[l.order[pos],l.order[to]]=[l.order[to],l.order[pos]];setLayout(s,l);render()}return}
 if(act==='mesa-equip'){saveWeapon(s,btn.dataset.character,idVal);render();toast('Arma equipada para a próxima ação.');return}
 if(act==='mesa-open-combat'){mustGM(s);await run(s,api,'encounter_set',{p_campaign:s.campaignId,p_active:true,p_round:1,p_turn:''});await refresh(s,api,{refreshCampaign,render});return}
 if(act==='mesa-buy'){await run(s,api,'buy',{p_stock:idVal,p_character:btn.dataset.character});await refresh(s,api,{refreshCampaign,render});toast('Compra concluída. O item foi para o inventário.');return}
 if(act==='mesa-del-stock'){mustGM(s);if(!confirm('Retirar produto da loja?'))return;await run(s,api,'stock_remove',{p_id:idVal});await refresh(s,api,{refreshCampaign,render});return}
 if(act==='mesa-del-inventory'){mustGM(s);if(!confirm('Retirar item do inventário?'))return;await run(s,api,'inventory_remove',{p_id:idVal});await refresh(s,api,{refreshCampaign,render});return}
}
async function submit(form,ctx,submitter){const {state:s,api,refreshCampaign,render,toast}=ctx,dat=formData(form),c=getFocus(s),d=currentData(s);const kind=form.dataset.mesaForm;const num=k=>Number(dat[k]||0);const act=async(op,args)=>run(s,api,op,args);const cam=s.campaignId;let event=null;
 if(kind==='test'){const ch=c?.type==='character'?c.data:null;const a=ch?.attrs?.[dat.attr]||0;const description=String(dat.description||'').trim()||`Teste ${dat.attr!=='none'?dat.attr:'geral'} · ${ch?.name||'Dunmoore'}`;const p={campaign_id:cam,character_id:ch?.id||null,kind:'test',description,modifier:Number(a)+num('circumstance'),damage_sides:0};const r=await api.roll(p);toast(`D20: ${r.natural} ${r.modifier>=0?'+':'−'} ${Math.abs(r.modifier)} = ${r.total}`)}
 else if(kind==='attack'){const ch=mustFocusChar(s);const target=d.monsters.find(m=>m.id===dat.target&&Number(m.hp)>0);if(!target)throw Error('Clique em um monstro vivo para escolher seu alvo antes de atacar.');const inv=dat.weapon||null;event=await act('attack',{p_campaign:cam,p_actor_character:ch.id,p_actor_monster:null,p_target_character:null,p_target_monster:target.id,p_inventory:inv});}
 else if(kind==='monster-attack'){mustGM(s);event=await act('attack',{p_campaign:cam,p_actor_character:null,p_actor_monster:dat.monster,p_target_character:dat.target,p_target_monster:null,p_inventory:null});}
 else if(kind==='monster-adjust'){mustGM(s);if(c?.type!=='monster')throw Error('Selecione um monstro');await act('monster_adjust',{p_id:c.data.id,p_delta:num('delta')});}
 else if(kind==='monster-portrait'){mustGM(s);if(c?.type!=='monster')throw Error('Selecione um monstro');const pic=await compressPortrait(dat.portrait);await act('monster_portrait',{p_id:c.data.id,p_portrait:pic});}
 else if(kind==='create-monster'){mustGM(s);const created=await act('monster_create',{p_campaign:cam,p_name:String(dat.name||'').trim(),p_hp:num('hp'),p_defense:num('defense'),p_damage:num('damage')});if(created)onFocus(s,'m:'+created);toast('Monstro criado e adicionado à sessão: '+dat.name+'.');}
 else if(kind==='encounter'){mustGM(s);await act('encounter_set',{p_campaign:cam,p_active:submitter?.value==='true',p_round:num('round'),p_turn:dat.turn});}
 else if(kind==='grant-item'){mustGM(s);const ch=mustFocusChar(s);await act('inventory_grant',{p_character:ch.id,p_title:dat.title,p_kind:dat.kind,p_damage:dat.kind==='item'?0:num('damage'),p_quantity:1,p_details:dat.details});}
 else if(kind==='wallet'){mustGM(s);const ch=mustFocusChar(s);await act('wallet_adjust',{p_character:ch.id,p_delta:num('delta')});}
 else if(kind==='shop-settings'){mustGM(s);await act('shop_set',{p_campaign:cam,p_name:dat.name,p_open:submitter?.value==='true'});}
 else if(kind==='stock'){mustGM(s);await act('stock_add',{p_campaign:cam,p_title:dat.title,p_kind:dat.kind,p_damage:dat.kind==='item'?0:num('damage'),p_price:num('price'),p_stock:num('stock'),p_details:dat.details});}
 else return;
 await refresh(s,api,{refreshCampaign,render});
 if(event)toast(event.hit?`${event.actor_name} acertou ${event.target_name}: -${event.damage} HP`:`${event.actor_name} errou o ataque!`);
 else if(kind==='grant-item')toast(`${dat.kind==='weapon'?'Arma':'Item'} entregue a ${c?.data?.name||'sobrevivente'}: ${dat.title}. Veja o inventário.`);
 else if(kind==='shop-settings')toast(submitter?.value==='true'?`Loja aberta para todos: ${dat.name}.`:'Loja fechada para os jogadores.');
 else if(kind==='stock')toast(`Produto cadastrado na loja: ${dat.title}.`);
 else if(kind!=='test')toast('Mesa Atual sincronizada.');
}
function onFocus(s,value){focusKey=value;setLocal(focusStorage(s),value)}
function animateCounters(){document.querySelectorAll('[data-m71-from][data-m71-to]').forEach(el=>{const from=Number(el.dataset.m71From),to=Number(el.dataset.m71To),max=Number(el.dataset.m71Max),start=performance.now(),duration=900;const tick=now=>{const f=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-f,3);el.textContent=Math.round(from+(to-from)*eased)+' / '+max;if(f<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)})}
function attachDrag(s){animateCounters();const board=document.getElementById('m71-board');if(!board||board.dataset.init)return;board.dataset.init='1';let dragged=null;board.addEventListener('dragstart',e=>{const el=e.target.closest('.m71-dock');if(!el)return;dragged=el.dataset.dock;el.classList.add('dragging');e.dataTransfer?.setData('text/plain',dragged);if(e.dataTransfer)e.dataTransfer.effectAllowed='move'});board.addEventListener('dragover',e=>{if(!dragged)return;e.preventDefault();const target=e.target.closest('.m71-dock');if(target&&target.dataset.dock!==dragged)target.classList.add('drop-target')});board.addEventListener('dragleave',e=>{e.target.closest('.m71-dock')?.classList.remove('drop-target')});board.addEventListener('drop',e=>{e.preventDefault();const t=e.target.closest('.m71-dock');if(!t||!dragged)return;const l=getLayout(s),from=l.order.indexOf(dragged),to=l.order.indexOf(t.dataset.dock);if(from>=0&&to>=0&&from!==to){l.order.splice(to,0,l.order.splice(from,1)[0]);setLayout(s,l)}dragged=null;document.querySelectorAll('.m71-dock').forEach(el=>el.classList.remove('drop-target','dragging'));s._mesaRender?.()});board.addEventListener('dragend',()=>{dragged=null;document.querySelectorAll('.m71-dock').forEach(el=>el.classList.remove('drop-target','dragging'))})}
window.SLASHER71={load,render,action,submit,focusChanged:onFocus,attachDrag,roleGM};
})();