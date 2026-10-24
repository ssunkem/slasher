/* SLASHER v2 · Mesa Atual: risco, ameaça, caçada e consequências */
(function(){
'use strict';
const R=window.SLASHER_RULES;
const esc=v=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const id=()=>crypto.randomUUID();
const KEY='slasher2_table_';
const defaults=()=>({version:2,ready:true,threats:[],events:[],clocks:[],encounter:{active:false,round:1},chase:{active:false,round:0,distance:2,speed:'equivalente',exit:'',status:'ativa'},inventory:[]});
const gm=s=>s.members?.some(m=>m.user_id===s.user?.id&&m.role==='gm')&&!s.gmPreview;
const pct=(v,max)=>Math.max(0,Math.min(100,Math.round(100*(v||0)/max)));
const testName=r=>r?('D100 '+r.natural+' / '+r.limit+' · '+(r.success?r.grade:'falha')+(r.special?' ('+r.special+')':'')):'';
function load(s){
 if(!s.campaignId)return;
 if(s.mode==='p2p-client'){s.mesa71={...defaults(),...(s.mesa71||{})};return}
 let value;try{value=JSON.parse(localStorage.getItem(KEY+s.campaignId))}catch{}
 s.mesa71={...defaults(),...(value?.version===2?value:{})};
}
function persist(s){if(s.mode!=='p2p-client')localStorage.setItem(KEY+s.campaignId,JSON.stringify(s.mesa71))}
function character(s){const chars=s.characters.filter(c=>!R.isLegacy(c)&&(gm(s)||c.owner_id===s.user?.id));return chars.find(c=>c.id===s.selected)||chars[0]}
function threatVisible(s,t){return gm(s)||s.mesa71?.encounter?.active}
function tag(label,n,max){return '<div class="v2-meter"><div class="between"><small>'+esc(label)+'</small><b>'+n+' / '+max+'</b></div><div class="meter"><span style="width:'+pct(n,max)+'%"></span></div></div>'}
function render(s){
 const d=s.mesa71||defaults(),master=gm(s),c=character(s);
 const options=(list)=>list.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+'</option>').join('');
 const threats=(d.threats||[]).filter(t=>threatVisible(s,t));
 const available=threats.filter(t=>t.type==='humano'&&t.vitality>0);
 const fighter=master?s.characters.filter(ch=>ch.schemaVersion===2):s.characters.filter(ch=>ch.schemaVersion===2&&ch.owner_id===s.user?.id);
 const weapons=c?.inventory?.filter(i=>Number(i.damageBase)>0)||[];
 const chase=d.chase||defaults().chase;
 return '<header class="section-head"><div><div class="eyebrow">DUNMOOR / SITUAÇÃO ATUAL</div><h2>Mesa Atual · Sobrevivência</h2><p>Ações, risco e consequência. O narrador descreve os sinais antes dos dados.</p></div></header>'+
 '<div class="grid2"><section class="panel"><h3>Sobrevivente em campo</h3><label class="field">Ficha selecionada<select id="m71-focus">'+options(fighter).replace('value="'+esc(c?.id)+'"','value="'+esc(c?.id)+'" selected')+'</select></label>'+
 (c?'<div class="v2-three-meters">'+tag('Vitalidade',c.vitality,6)+tag('Fôlego',c.stamina,5)+tag('Tensão',c.tension,6)+'</div><p class="hint">Ferimentos: '+(c.wounds?.map(w=>esc(w.type)).join(', ')||'nenhum')+' · Preparo: '+c.preparations+'/2 · Risco de Morte: '+c.deathRisk+'/3</p>'+
 '<h4>Inventário · '+R.inventorySpaces(c.inventory)+'/6 Espaços'+(R.inventorySpaces(c.inventory)>6?' · SOBRECARREGADO':'')+'</h4><ul>'+(c.inventory||[]).map(i=>'<li>'+esc(i.name)+' · '+i.slots+' espaço(s)'+(i.damageBase?' · dano '+i.damageBase:'')+'</li>').join('')+'</ul>':'<p>Nenhuma ficha 2.0 atribuída.</p>')+'</section>'+
 '<section class="panel"><h3>Confronto</h3><p><b>'+(d.encounter?.active?'Cena perigosa ativa · Rodada '+d.encounter.round:'Sem confronto ativo')+'</b></p>'+
 (master?'<div class="row"><button class="btn small red" data-action="mesa-v2-toggle">'+(d.encounter?.active?'Encerrar confronto':'Iniciar confronto')+'</button><button class="btn small flat" data-action="mesa-v2-next">Próxima rodada</button></div>':'')+
 '<div class="v2-threat-list">'+(threats.map(t=>'<div class="v2-threat"><b>'+esc(t.name)+'</b> <small>'+esc(t.type)+'</small>'+
 (t.type==='humano'?'<p>Vitalidade '+t.vitality+'/'+t.vitalityMax+' · Dano base '+t.damageBase+'</p>':'<p>Anomalia sem barra de Vitalidade. Deve ser compreendida ou contida.</p>')+
 '<p class="hint">Sinal: '+esc(t.sign||'Não observado')+'</p>'+(master?'<button class="btn small flat" data-action="mesa-v2-remove-threat" data-id="'+t.id+'">Retirar</button>':'')+'</div>').join('')||'<p class="hint">Nenhuma ameaça registrada nesta cena.</p>')+'</div>'+
 (c&&d.encounter?.active&&available.length?'<h4>Atacar um oponente humano</h4><form data-mesa-form="v2-attack" class="stack"><label class="field">Alvo<select name="target">'+options(available)+'</select></label>'+
 '<label class="field">Abordagem<select name="attribute"><option value="FOR">FOR · Luta</option><option value="AGI">AGI · Luta</option><option value="PER">PER · Armas de Fogo</option></select></label>'+
 '<label class="field">Equipamento<select name="itemIndex"><option value="-1">Desarmado (dano 1)</option>'+weapons.map(i=>'<option value="'+c.inventory.indexOf(i)+'">'+esc(i.name)+' (base '+i.damageBase+')</option>').join('')+'</select></label>'+
 '<label class="field">Circunstância<select name="circumstance"><option>-20</option><option>-10</option><option selected>0</option><option>10</option><option>20</option></select></label><input type="hidden" name="actor" value="'+c.id+'"><button class="btn red" type="submit">Resolver ataque D100</button></form>'+
 '<p class="hint">A ameaça humana pode esquivar quando tiver Reação e Fôlego. O narrador informa quando a esquiva está disponível.</p>':'')+'</section></div>'+
 '<div class="grid2"><section class="panel"><h3>Caçada / Fuga</h3><div class="v2-distance"><strong>Distância '+chase.distance+' / 4</strong><div class="meter"><span style="width:'+pct(chase.distance,4)+'%"></span></div></div>'+
 '<p class="hint">'+(chase.active?'Em andamento · Rodada '+chase.round:'Caçada inativa')+' · perseguidor '+esc(chase.speed)+' · saída: '+esc(chase.exit||'Não estabelecida')+'</p>'+
 (c&&chase.active?'<form data-mesa-form="v2-chase" class="stack"><input type="hidden" name="actor" value="'+c.id+'"><label class="field">Manobra<select name="maneuver"><option value="sprint">Correr / sprint (1 Fôlego)</option><option value="hide">Esconder-se</option><option value="barricade">Barricar passagem</option><option value="move">Mudar rota</option></select></label>'+
 '<label class="field">Competência<select name="skill"><option>Atletismo</option><option>Furtividade</option><option>Reflexos</option></select></label>'+
 '<label class="field">Circunstância<select name="circumstance"><option>-20</option><option>-10</option><option selected>0</option><option>10</option><option>20</option></select></label>'+
 '<button type="submit" class="btn red">Executar manobra D100</button></form>':'')+
 (master?'<form data-mesa-form="v2-start-chase" class="stack"><label class="field">Distância inicial<select name="distance">'+[0,1,2,3,4].map(n=>'<option value="'+n+'"'+(Number(chase.distance)===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
 '<label class="field">Velocidade do perseguidor<select name="speed"><option value="lento">Lento</option><option value="equivalente">Equivalente</option><option value="rapido">Rápido</option></select></label><label class="field">Condição de Saída<input name="exit" required value="'+esc(chase.exit||'')+'" placeholder="Ex.: alcançar a estrada e quebrar linha de visão"></label>'+
 '<button type="submit" class="btn flat">'+(chase.active?'Reiniciar':'Iniciar')+' Caçada</button></form><button type="button" class="btn small flat" data-action="mesa-v2-stop-chase">Encerrar caçada</button>':'')+'</section>'+
 '<section class="panel"><h3>Relógios de ameaça</h3>'+(d.clocks||[]).map(k=>'<div class="v2-clock"><div class="between"><b>'+esc(k.name)+'</b><span>'+k.value+' / '+k.max+'</span></div><div class="row">'+Array.from({length:k.max},(_,i)=>'<span class="v2-clock-step '+(i<k.value?'active':'')+'">▮</span>').join('')+'</div>'+
 (master?'<div class="row"><button class="btn small flat" data-action="mesa-v2-clock" data-id="'+k.id+'" data-delta="-1">−1</button><button class="btn small flat" data-action="mesa-v2-clock" data-id="'+k.id+'" data-delta="1">+1</button></div>':'')+'</div>').join('')+
 (master?'<form data-mesa-form="v2-clock" class="stack"><label class="field">Novo relógio<input name="name" maxlength="80" required></label><label class="field">Segmentos<select name="max"><option>4</option><option>6</option></select></label><button class="btn flat" type="submit">Adicionar relógio</button></form>':'')+'</section></div>'+
 (master?'<div class="grid2"><section class="panel"><h3>Preparar ameaça</h3><form data-mesa-form="v2-threat" class="stack"><label class="field">Nome<input name="name" maxlength="100" required></label>'+
 '<label class="field">Tipo<select name="type"><option value="humano">Humano</option><option value="anomalia">Anomalia</option></select></label>'+
 '<label class="field">Primeiro sinal<input name="sign" maxlength="300"></label><label class="field">Padrão / o que deseja<textarea name="pattern" maxlength="700"></textarea></label>'+
 '<label class="field">Limitação e contenção<textarea name="limitation" maxlength="700"></textarea></label>'+
 '<label class="field">Dano base humano<select name="damageBase"><option>1</option><option>2</option><option selected>3</option><option>4</option></select></label>'+
 '<label class="field">Esquiva humana (Alvo D100; 0 para nenhuma)<input name="dodge" type="number" min="0" max="90" value="40"></label>'+
 '<button class="btn red" type="submit">Registrar ameaça</button></form></section>'+
 '<section class="panel"><h3>Ação do perseguidor humano</h3><form data-mesa-form="v2-threat-attack" class="stack"><label class="field">Agressor<select name="threat">'+options(available)+'</select></label><label class="field">Alvo<select name="victim">'+options(s.characters.filter(ch=>ch.schemaVersion===2))+'</select></label>'+
 '<label class="field">Defensor esquiva? (custa 1 Fôlego)<select name="dodge"><option value="yes">Sim</option><option value="no">Não</option></select></label><button class="btn red" type="submit">Resolver ataque da ameaça</button></form>'+
 '<p class="hint">Ações de anomalias são tratadas por sinais, gatilhos e condições de interrupção, não por dano automático.</p>'+
 '<h3>Conceder equipamento</h3><form data-mesa-form="v2-grant" class="stack"><label class="field">Sobrevivente<select name="character">'+options(s.characters.filter(ch=>ch.schemaVersion===2))+'</select></label>'+
 '<label class="field">Nome do item<input name="name" required maxlength="100"></label><label class="field">Espaços<select name="slots"><option>1</option><option>2</option><option>3</option></select></label>'+
 '<label class="field">Dano base (0 se não é arma)<select name="damageBase"><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></label>'+
 '<button class="btn flat" type="submit">Adicionar ao inventário</button></form></section></div>':'')+
 '<section class="panel"><h3>Registro de acontecimentos</h3><div class="journal">'+(d.events||[]).slice(0,25).map(ev=>'<div class="journal-event"><small>'+esc(new Date(ev.at).toLocaleString('pt-BR'))+'</small><p><b>'+esc(ev.title)+'</b> · '+esc(ev.detail||'')+'</p></div>').join('')+'</div></section>';
}
function register(s,title,detail){s.mesa71.events.unshift({id:id(),at:new Date().toISOString(),title,detail});s.mesa71.events=s.mesa71.events.slice(0,80)}
function remote(s,op,p,actorId){
 const d=s.mesa71,master=s.members.some(m=>m.user_id===actorId&&m.role==='gm');
 const own=cid=>{const c=s.characters.find(x=>x.id===cid&&x.schemaVersion===2);if(!c||(!master&&c.owner_id!==actorId))throw Error('Ficha sem autorização');return c};
 if(!['v2-attack','v2-chase'].includes(op)&&!master)throw Error('Operação exclusiva do narrador');
 let outcome=null;
 if(op==='v2-attack'){
  if(!d.encounter?.active)throw Error('Não há confronto ativo');
  const c=own(p.actor),t=d.threats.find(x=>x.id===p.target&&x.type==='humano'&&x.vitality>0);
  if(!t)throw Error('Alvo indisponível (anomalias não usam Vitalidade)');
  const att=p.attribute;
  if(!['FOR','AGI','PER'].includes(att))throw Error('Atributo de ataque inválido');
  const skill=att==='PER'?'Armas de Fogo':'Luta';
  const i=Number(p.itemIndex),item=i>=0?c.inventory?.[i]:null;
  if(i>=0&&(!item||Number(item.damageBase)<1||Number(item.damageBase)>4))throw Error('Arma não consta no inventário');
  if(att==='PER'&&(!item||Number(item.damageBase)<3))throw Error('Armas de Fogo exigem uma arma adequada no inventário');
  const attack=R.rollForCharacter(c,{attribute:att,skill,circumstance:Number(p.circumstance||0),difficulty:'normal'});
  let dodge=null,hit=attack.success;
  if(t.dodge>0&&t.stamina>0&&t.reactedRound!==d.encounter.round){
   dodge=R.calculateTest({attribute:t.dodge,training:0,circumstance:0,difficulty:'normal',natural:R.die100()});
   t.stamina-=1;t.reactedRound=d.encounter.round;
   const levels={falha:0,normal:1,forte:2,extraordinario:3};
   if(dodge.success&&levels[dodge.grade]>=levels[attack.grade])hit=false;
  }
  const damage=hit?R.fixedDamage(item?.damageBase||1,attack.grade,attack.special):0;
  if(hit){t.vitality=Math.max(0,t.vitality-damage);if(damage>=3)t.wounds=(t.wounds||0)+1}
  register(s,c.name+' atacou '+t.name,testName(attack)+(dodge?' · Esquiva '+testName(dodge):'')+' · '+(hit?'Dano '+damage:'sem acerto'));
  outcome={attack,dodge,hit,damage};
 }
 else if(op==='v2-chase'){
  if(!d.chase.active)throw Error('Não há caçada ativa');
  const c=own(p.actor),man=p.maneuver;
  if(!['sprint','move','hide','barricade'].includes(man))throw Error('Manobra inválida');
  if(!['Atletismo','Furtividade','Reflexos'].includes(p.skill))throw Error('Competência inválida');
  if(man==='sprint'&&c.stamina>0)c.stamina--;
  let diff=c.stamina===0?'dificil':'normal';
  if(R.inventorySpaces(c.inventory)>6)diff='dificil';
  if(man==='hide'&&d.chase.distance<2)throw Error('É preciso Distância 2 para esconder-se');
  const roll=R.rollForCharacter(c,{attribute:'AGI',skill:p.skill,circumstance:Number(p.circumstance||0),difficulty:diff});
  d.chase=R.chaseStep(d.chase,roll,{sprint:man==='sprint',hide:man==='hide',barricade:man==='barricade'});
  register(s,c.name+' fez manobra de fuga',man+' · '+testName(roll)+' · Distância '+d.chase.distance+'/4');
  outcome={roll,chase:d.chase};
 }
 else if(op==='v2-threat'){
  const t={id:id(),name:String(p.name||'').trim().slice(0,100),type:p.type==='anomalia'?'anomalia':'humano',sign:String(p.sign||'').slice(0,300),pattern:String(p.pattern||'').slice(0,700),limitation:String(p.limitation||'').slice(0,700),
  vitality:p.type==='anomalia'?null:6,vitalityMax:p.type==='anomalia'?null:6,stamina:5,damageBase:R.clamp(p.damageBase,1,4),dodge:R.clamp(p.dodge,0,90),wounds:0};
  if(!t.name)throw Error('Informe o nome da ameaça');d.threats.push(t);outcome=t;
 }
 else if(op==='v2-remove-threat')d.threats=d.threats.filter(t=>t.id!==p.id);
 else if(op==='v2-toggle'){d.encounter.active=!d.encounter.active;if(d.encounter.active)d.encounter.round=1}
 else if(op==='v2-next')d.encounter.round++;
 else if(op==='v2-clock')d.clocks.push({id:id(),name:String(p.name||'').slice(0,80),max:[4,6].includes(Number(p.max))?Number(p.max):4,value:0});
 else if(op==='v2-clock-step'){const k=d.clocks.find(k=>k.id===p.id);if(k)k.value=R.clamp(k.value+Number(p.delta),0,k.max)}
 else if(op==='v2-start-chase'){d.chase={active:true,round:0,distance:R.clamp(p.distance,0,4),speed:['lento','equivalente','rapido'].includes(p.speed)?p.speed:'equivalente',exit:String(p.exit||'').slice(0,200),status:'ativa'};}
 else if(op==='v2-stop-chase')d.chase.active=false;
 else if(op==='v2-threat-attack'){
  if(!d.encounter?.active)throw Error('Inicie um confronto antes de atacar');
  const t=d.threats.find(x=>x.id===p.threat&&x.type==='humano'&&x.vitality>0),v=own(p.victim);
  if(!t)throw Error('Agressor indisponível');
  const attack=R.calculateTest({attribute:50,training:0,circumstance:0,difficulty:'normal',natural:R.die100()});
  let dodge=null,hit=attack.success;
  if(p.dodge==='yes'&&v.stamina>0&&v.reactedRound!==d.encounter.round){
   dodge=R.rollForCharacter(v,{attribute:'AGI',skill:'Reflexos',difficulty:'normal',circumstance:0});
   v.stamina--;v.reactedRound=d.encounter.round;
   const ranks={falha:0,normal:1,forte:2,extraordinario:3};
   if(dodge.success&&ranks[dodge.grade]>=ranks[attack.grade])hit=false;
  }
  const damage=hit?R.fixedDamage(t.damageBase,attack.grade,attack.special):0;
  if(hit)Object.assign(v,R.applyDamage(v,damage,'a definir'));
  register(s,t.name+' atacou '+v.name,testName(attack)+(dodge?' · Esquiva '+testName(dodge):'')+' · Dano '+damage);
  outcome={attack,dodge,hit,damage};
 }
 else if(op==='v2-grant'){
  const c=own(p.character),item={name:String(p.name||'').trim().slice(0,100),slots:Number(p.slots),damageBase:R.clamp(p.damageBase,0,4)};
  if(!item.name||![1,2,3].includes(item.slots))throw Error('Item inválido');
  if(R.inventorySpaces(c.inventory)+item.slots>12)throw Error('Carga acima do limite de transporte improvisado (12 Espaços)');
  c.inventory.push(item);outcome=item;
 }
 else throw Error('Operação desconhecida');
 persist(s);return outcome;
}
async function apply(op,p,ctx){
 const {state:s,api,refreshCampaign,toast}=ctx;
 let result;
 if(s.mode==='p2p-client')result=await api.remoteMesa(op,p);
 else {result=remote(s,op,p,s.user.id);api.save?.();}
 await refreshCampaign(true);
 if(result?.attack||result?.roll)toast(result.attack?'Ataque: '+testName(result.attack):'Fuga: '+testName(result.roll));
 else toast('Mesa atualizada.');
 return result;
}
async function action(act,btn,ctx){
 const d=btn.dataset;
 const ops={'mesa-v2-toggle':['v2-toggle',{}],'mesa-v2-next':['v2-next',{}],'mesa-v2-stop-chase':['v2-stop-chase',{}],'mesa-v2-remove-threat':['v2-remove-threat',{id:d.id}],'mesa-v2-clock':['v2-clock-step',{id:d.id,delta:Number(d.delta)}]};
 if(!ops[act])return;
 if(!gm(ctx.state))throw Error('Só o mestre pode alterar este controle');
 await apply(...ops[act],ctx);
}
async function submit(form,ctx){
 const dat=Object.fromEntries(new FormData(form)),kind=form.dataset.mesaForm;
 if(!kind)return;
 if(kind==='v2-attack')return apply('v2-attack',{actor:dat.actor,target:dat.target,attribute:dat.attribute,itemIndex:Number(dat.itemIndex),circumstance:Number(dat.circumstance)},ctx);
 if(kind==='v2-chase')return apply('v2-chase',{actor:dat.actor,maneuver:dat.maneuver,skill:dat.skill,circumstance:Number(dat.circumstance)},ctx);
 if(!gm(ctx.state))throw Error('Somente o mestre altera a cena');
 const ops={'v2-threat':['v2-threat',{...dat,damageBase:Number(dat.damageBase),dodge:Number(dat.dodge)}],
  'v2-clock':['v2-clock',{name:dat.name,max:Number(dat.max)}],
  'v2-start-chase':['v2-start-chase',{distance:Number(dat.distance),speed:dat.speed,exit:dat.exit}],
  'v2-threat-attack':['v2-threat-attack',dat],
  'v2-grant':['v2-grant',{...dat,slots:Number(dat.slots),damageBase:Number(dat.damageBase)}]};
 if(!ops[kind])throw Error('Formulário desconhecido');
 return apply(...ops[kind],ctx);
}
function focusChanged(s,selected){s.selected=selected;s._mesaRender?.()}
window.SLASHER71={load,render,action,submit,focusChanged,attachDrag:()=>{},roleGM:gm,remote};
})();