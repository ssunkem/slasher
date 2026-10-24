/* SLASHER v2 · apresentação das regras, sem dependência de frameworks. */
(function(){
'use strict';
const R=window.SLASHER_RULES;
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=n=>(Number(n)||0);
const options=(items,value)=>items.map(([v,label])=>'<option value="'+esc(v)+'"'+(String(value)===String(v)?' selected':'')+'>'+esc(label)+'</option>').join('');
const attrSelect=(key,value)=>'<label class="field">'+key+' · '+R.ATTRIBUTES[key]+'<select name="attr_'+key+'" required>'+options([...R.ATTRIBUTE_VALUES].sort((a,b)=>b-a).map(n=>[n,n]),value)+'</select></label>';
const skillOpts=(current,includeBlank=true)=>options([...(includeBlank?[['','Selecione...']]:[]),...R.SKILLS.map(k=>[k,k])],current||'');
const itemList=items=>(items||[]).map(i=>esc(i.name)+' | '+Number(i.slots)+' | '+Number(i.damageBase||0)).join('\n');
const bond=(v,i)=>'<label class="field">Vínculo '+(i+1)+'<input name="bond_'+i+'" maxlength="300" value="'+esc(v||'')+'" required placeholder="Nome, relação, o que oferece e o que teme perder"></label>';
function historyOptions(id){return options(R.HISTORIES.map(h=>[h.id,h.name+' · '+h.skills.join(' + ')]),id||'estudante');}
function characterForm(existing=null){
 const h=R.pickHistory(existing?.history)||R.HISTORIES[0];
 const extras=R.SKILLS.filter(k=>existing?.skills?.[k]&&!h.skills.includes(k));
 const attributes=existing?.attrs||Object.fromEntries(Object.keys(R.ATTRIBUTES).map((k,i)=>[k,R.ATTRIBUTE_VALUES[i]]));
 const spec=Object.keys(existing?.skills||{}).find(k=>existing.skills[k]===25)||'';
 return '<h2>'+(existing?'Editar sobrevivente':'Novo sobrevivente · Edição de Teste I')+'</h2>'+
 '<p class="lead">Sete passos: conceito, atributos, histórico, competências, vínculos, situação e recursos. A ficha não utiliza classes.</p>'+
 '<form id="'+(existing?'edit-character':'create-character')+'" class="v2-form">'+(existing?'<input type="hidden" name="id" value="'+esc(existing.id)+'">':'')+
 '<div class="v2-form-step"><h3>01 / Identidade</h3><div class="field-row"><label class="field">Nome<input name="name" required maxlength="90" value="'+esc(existing?.name||'')+'"></label><label class="field">Idade<input type="number" name="age" min="10" max="100" value="'+esc(existing?.age||18)+'"></label></div>'+
 '<label class="field">Ocupação / situação escolar<input name="occupation" maxlength="120" value="'+esc(existing?.occupation||'')+'"></label>'+
 '<label class="field">Conceito (uma frase)<input name="concept" maxlength="300" value="'+esc(existing?.concept||'')+'"></label>'+
 '<label class="field">Duas qualidades contraditórias<input name="traits" maxlength="300" value="'+esc(existing?.traits||'')+'"></label>'+
 '<label class="field">Preocupação atual<input name="concern" maxlength="300" value="'+esc(existing?.concern||'')+'"></label></div>'+
 '<div class="v2-form-step"><h3>02 / Atributos</h3><p class="hint">Use cada valor exatamente uma vez: 65, 55, 50, 45, 40, 35.</p><div class="grid3">'+Object.keys(R.ATTRIBUTES).map(k=>attrSelect(k,attributes[k])).join('')+'</div></div>'+
 '<div class="v2-form-step"><h3>03 / Histórico</h3><label class="field">Histórico<select name="history" id="v2-history">'+historyOptions(existing?.history)+'</select></label>'+
 '<label class="field">Contato e acesso<input name="contact" maxlength="240" value="'+esc(existing?.contact||h.contact)+'" placeholder="Pessoa ou instituição que aceita conversar"></label></div>'+
 '<div class="v2-form-step"><h3>04 / Competências</h3><p class="hint">As duas do histórico são automáticas. Escolha três outras, depois especialize uma das cinco (+25 substitui +15).</p><div class="grid3">'+
 [0,1,2].map(i=>'<label class="field">Adicional '+(i+1)+'<select name="extra_'+i+'" required>'+skillOpts(extras[i])+'</select></label>').join('')+
 '</div><label class="field">Especialização<select name="specialization" required>'+skillOpts(spec)+'</select></label></div>'+
 '<div class="v2-form-step"><h3>05 / Vínculos</h3>'+[0,1,2].map(i=>bond(existing?.bonds?.[i],i)).join('')+'</div>'+
 '<div class="v2-form-step"><h3>06 / Situação e equipamento</h3>'+
 '<label class="field">Moradia<input name="home" maxlength="240" value="'+esc(existing?.home||'')+'"></label>'+
 '<label class="field">Responsabilidade cotidiana<input name="responsibility" maxlength="240" value="'+esc(existing?.responsibility||'')+'"></label>'+
 '<label class="field">Item significativo<input name="meaningfulItem" maxlength="240" value="'+esc(existing?.meaningfulItem||'')+'"></label>'+
 '<label class="field">Itens carregados, um por linha (nome | espaços | dano base)<textarea name="inventory" rows="4" placeholder="Lanterna | 1 | 0&#10;Faca pequena | 1 | 2">'+esc(itemList(existing?.inventory))+'</textarea></label>'+
 '<p class="hint">Máximo 6 Espaços. Dano base: 0 para item comum, 1 soco/objeto leve, 2 lâmina curta/objeto, 3 arma pesada/arma curta, 4 arma longa. Validar equipamentos com o narrador.</p></div>'+
 '<div class="v2-form-step"><h3>07 / Sobrevivência</h3><p class="hint">Início automático: Vitalidade 6/6, Fôlego 5/5, Tensão 0/6, duas Declarações de Preparo.</p>'+
 '<label class="field">Anotações<textarea name="notes" maxlength="5000" rows="3">'+esc(existing?.notes||'')+'</textarea></label>'+
 (existing?'<label class="field">Retrato (JPG, PNG ou WebP; até 8 MB)<input id="portrait-file" type="file" accept="image/jpeg,image/png,image/webp"></label><div id="portrait-preview" class="v2-photo">'+(existing.portrait?'<img src="'+esc(existing.portrait)+'" alt="Retrato">':'Sem retrato')+'</div>':'')+'</div>'+
 '<div class="modal-footer"><button type="button" data-action="close-modal" class="btn flat">Cancelar</button><button class="btn red" type="submit">'+(existing?'Salvar mudanças':'Criar sobrevivente')+'</button></div></form>';
}
function parseCharacterForm(dat,previous={}){
 const history=R.pickHistory(dat.history);if(!history)throw Error('Histórico inválido');
 const extras=[dat.extra_0,dat.extra_1,dat.extra_2];
 if(new Set(extras).size!==3||extras.some(k=>!R.SKILLS.includes(k)||history.skills.includes(k)))throw Error('Escolha três competências adicionais diferentes das duas do histórico');
 const all=[...history.skills,...extras];
 if(!all.includes(dat.specialization))throw Error('Especialize uma das cinco competências escolhidas');
 const values=Object.fromEntries(Object.keys(R.ATTRIBUTES).map(k=>[k,Number(dat['attr_'+k])]));
 const skills=Object.fromEntries(all.map(k=>[k,k===dat.specialization?25:15]));
 const inventory=String(dat.inventory||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>{
  const bits=s.split('|');const name=bits[0].trim(),slots=Number(bits[1]),damageBase=Number(bits[2]||0);
  if(!name||!Number.isInteger(slots)||slots<1||slots>3)throw Error('Escreva cada item como "nome | espaços" (1 a 3)');
  if(!Number.isInteger(damageBase)||damageBase<0||damageBase>4)throw Error('Dano base deve estar entre 0 e 4');return {name,slots,damageBase};
 });
 const c=R.newCharacter({...previous,name:dat.name,age:Number(dat.age),occupation:dat.occupation,
 concept:dat.concept,traits:dat.traits,concern:dat.concern,attrs:values,history:dat.history,
 skills,contact:dat.contact,bonds:[dat.bond_0,dat.bond_1,dat.bond_2],home:dat.home,
 responsibility:dat.responsibility,meaningfulItem:dat.meaningfulItem,inventory,notes:dat.notes});
 if(previous?.schemaVersion===R.VERSION){
  for(const k of ['id','campaign_id','owner_id','vitality','vitalityMax','stamina','staminaMax','tension','preparations','wounds','deathRisk','marks','development','portrait'])c[k]=previous[k];
 }
 return c;
}
function meter(label,value,max,color){const v=R.clamp(value,0,max);return '<div class="v2-meter"><div class="between"><small>'+esc(label)+'</small><b>'+v+' / '+max+'</b></div><div class="meter '+(color||'')+'"><span style="width:'+100*v/max+'%"></span></div></div>';}
function legacyBanner(c){return '<div class="panel"><h3>Ficha da versão 1.0</h3><p>Esta ficha permanece preservada, mas suas classes e atributos não equivalem aos do novo Livro Básico. Crie uma ficha 2.0 para jogar com D100. Os registros antigos não serão apagados.</p><p><b>'+esc(c.name)+'</b> · '+esc(c.occupation||'')+'</p></div>';}
function sheet(s,ch,can){
 if(!ch)return '<section class="panel"><h2>Nenhum sobrevivente</h2><button class="btn red" data-action="modal" data-value="create-character">Criar ficha</button></section>';
 if(R.isLegacy(ch))return legacyBanner(ch);
 const rows=Object.entries(R.ATTRIBUTES).map(([k,name])=>'<div class="v2-attr"><small>'+k+' · '+esc(name)+'</small><strong>'+esc(ch.attrs[k])+'</strong></div>').join('');
 const skills=Object.entries(ch.skills||{}).map(([k,v])=>'<span class="tag">'+esc(k)+' <b>+'+v+'</b></span>').join('');
 const itemRows=(ch.inventory||[]).map(i=>'<li>'+esc(i.name)+' <small>('+Number(i.slots)+' Espaços)</small></li>').join('')||'<li>Sem itens registrados</li>';
 return '<header class="section-head"><div><div class="eyebrow">SLASHER / SOBREVIVENTE 2.0</div><h2>'+esc(ch.name)+'</h2><p>'+esc(ch.concept||ch.occupation||'Pessoa de Dunmoor')+'</p></div>'+
 (can?'<button class="btn flat" data-action="modal" data-value="edit-character" data-id="'+esc(ch.id)+'">Editar ficha</button>':'')+'</header>'+
 '<div class="v2-sheet"><section class="panel">'+(ch.portrait?'<img class="v2-portrait" src="'+esc(ch.portrait)+'" alt="Retrato de '+esc(ch.name)+'">':'')+
 '<div class="eyebrow">'+esc(R.pickHistory(ch.history)?.name||'Histórico')+' · '+esc(ch.age)+' anos</div>'+
 '<p>'+esc(ch.occupation||'')+'</p><div class="v2-attributes">'+rows+'</div>'+
 '<h3>Competências</h3><div class="row" style="flex-wrap:wrap">'+skills+'</div>'+
 '<h3>Contato</h3><p>'+esc(ch.contact||'Nenhum')+'</p>'+
 '<h3>Vínculos</h3><ul>'+ch.bonds.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
 '<h3>Situação</h3><p>Moradia: '+esc(ch.home||'Não definida')+'<br>Responsabilidade: '+esc(ch.responsibility||'Não definida')+'<br>Objeto significativo: '+esc(ch.meaningfulItem||'Não definido')+'</p></section>'+
 '<section class="stack"><div class="panel"><h3>Estado atual</h3>'+meter('VITALIDADE',ch.vitality,ch.vitalityMax,'hp')+meter('FÔLEGO',ch.stamina,ch.staminaMax,'stamina')+meter('TENSÃO',ch.tension,6,'stress')+
 '<div class="grid2"><div class="metric"><small>Preparo disponível</small><h3>'+ch.preparations+' / 2</h3></div><div class="metric"><small>Risco de Morte</small><h3>'+ch.deathRisk+' / 3</h3></div></div>'+
 '<p class="hint">Ferimentos Graves: '+(ch.wounds?.length?ch.wounds.map(w=>esc(w.type)).join(', '):'Nenhum')+'</p><p class="hint">Desenvolvimento: '+esc(ch.development||0)+' Marca(s)</p></div>'+
 '<div class="panel"><h3>Inventário · '+R.inventorySpaces(ch.inventory)+' / 6 Espaços</h3><ul>'+itemRows+'</ul><p class="hint">Preparo Retroativo: 2 declarações por Caso; o narrador avalia plausibilidade.</p></div>'+
 '<div class="panel"><h3>Registros</h3><p>'+esc(ch.notes||'Nenhuma anotação')+'</p><h3>Preocupação</h3><p>'+esc(ch.concern||'Não registrada')+'</p></div></section></div>';
}
function dice(s,ch){
 const allowed=s.characters.filter(c=>c.schemaVersion===R.VERSION&&(s.members.some(m=>m.user_id===s.user?.id&&m.role==='gm')||c.owner_id===s.user?.id));
 const value=allowed.some(c=>c.id===ch?.id)?ch?.id:allowed[0]?.id;
 return '<header class="section-head"><div><div class="eyebrow">SLASHER / TESTES PERCENTUAIS</div><h2>Rolagens D100</h2><p>O Narrador anuncia dificuldade e consequência antes do dado. Pistas essenciais não exigem sorte.</p></div></header>'+
 '<div class="grid2"><div class="panel"><h3>Fazer teste</h3><form id="dice-form" class="stack">'+
 '<label class="field">Sobrevivente<select name="character_id" required>'+options(allowed.map(c=>[c.id,c.name]),value)+'</select></label>'+
 '<label class="field">Abordagem / atributo<select name="attribute">'+options(Object.entries(R.ATTRIBUTES),'RAC')+'</select></label>'+
 '<label class="field">Competência<select name="skill">'+options([['','Sem treinamento'],...R.SKILLS.map(k=>[k,k])],'')+'</select></label>'+
 '<label class="field">Dificuldade<select name="difficulty">'+options([['normal','Normal'],['dificil','Difícil'],['extremo','Extremo']],'normal')+'</select></label>'+
 '<label class="field">Circunstância total<select name="circumstance">'+options([-20,-10,0,10,20].map(n=>[n,n>0?'+'+n:String(n)]),0)+'</select></label>'+
 '<label class="field">Objetivo e risco<input name="description" maxlength="160" placeholder="Ex.: copiar a fita antes da ronda"></label>'+
 '<button class="btn red" type="submit" '+(allowed.length?'':'disabled')+'>⬡ Rolar D100</button></form></div>'+
 '<div class="panel"><h3>Últimos testes</h3><div class="journal">'+(s.rolls||[]).slice(0,15).map(r=>r.schemaVersion===R.VERSION?
 '<div class="journal-event"><small>'+esc(new Date(r.created_at).toLocaleString('pt-BR'))+'</small><p><b>'+esc(r.description||'Teste')+'</b> · D100 '+r.natural+' / '+r.limit+' · '+esc(r.grade)+(r.special?' ('+esc(r.special)+')':'')+'</p></div>':'<div class="journal-event"><small>Histórico legado D20 preservado</small></div>').join('')+'</div></div></div>';
}
function roster(ch){
 if(R.isLegacy(ch))return '<button class="survivor-card" data-action="select-char" data-id="'+esc(ch.id)+'"><div class="info"><b>'+esc(ch.name)+'</b><small>Ficha legada · 1.0</small></div></button>';
 return '<button class="survivor-card" data-action="select-char" data-id="'+esc(ch.id)+'"><div class="info"><b>'+esc(ch.name)+'</b><small>'+esc(R.pickHistory(ch.history)?.name||'')+' · '+(ch.owner_id?'Jogador':'NPC')+'</small>'+
 meter('Vitalidade',ch.vitality,ch.vitalityMax,'hp')+'</div><span>↗</span></button>';
}
function dashboard(s,isGM){
 return '<header class="section-head"><div><div class="eyebrow">DUNMOOR / ARQUIVO ATIVO</div><h2>'+esc(s.campaign?.name||'Campanha')+'</h2><p>'+s.members.length+' participante(s) · '+s.characters.length+' ficha(s)</p></div></header>'+
 '<section class="hero-panel"><div><div class="eyebrow">SLASHER · EDIÇÃO DE TESTE I</div><h2>A cidade não esquece.</h2><p>Investigue primeiro. A violência é uma escolha com consequências.</p><div class="row"><button class="btn red" data-action="go" data-value="investigation">Arquivo de investigação</button><button class="btn flat" data-action="go" data-value="dice">Rolar D100</button></div></div></section>'+
 '<div class="panel"><div class="panel-title"><h3>Sobreviventes</h3><button class="btn small red" data-action="modal" data-value="create-character">+ Criar ficha</button></div><div class="grid2">'+s.characters.map(roster).join('')+'</div></div>';
}
function gm(s,ch){
 const editable=ch&&!R.isLegacy(ch);
 const clock=(key,title,max)=>'<div class="panel"><h3>'+title+' · '+Number(s.campaign?.[key]||0)+' / '+max+'</h3><div class="row">'+Array.from({length:max},(_,i)=>'<button class="btn small '+(Number(s.campaign?.[key]||0)>i?'red':'flat')+'" data-action="set-clock" data-key="'+key+'" data-value="'+(i+1)+'">'+(i+1)+'</button>').join('')+'</div><button class="btn small flat" data-action="set-clock" data-key="'+key+'" data-value="0">Zerar</button></div>';
 return '<header class="section-head"><div><div class="eyebrow">CONFIDENCIAL / NARRADOR</div><h2>Painel do Mestre</h2><p>Controle de consequências, recursos e relógios. Não exponha segredos pelo P2P.</p></div></header>'+
 '<div class="grid2">'+clock('suspicion','Suspeita da Cidade',6)+clock('danger','Perigo do Local',4)+'</div>'+
 '<div class="panel"><h3>Estado do sobrevivente</h3><label class="field">Ficha<select id="gm-picker">'+options(s.characters.map(c=>[c.id,c.name]),ch?.id)+'</select></label>'+
 (editable?'<div class="stack">'+[['vitality','Vitalidade',ch.vitality,6],['stamina','Fôlego',ch.stamina,5],['tension','Tensão',ch.tension,6],['preparations','Preparo',ch.preparations,2],['development','Desenvolvimento',ch.development,999],['deathRisk','Risco de Morte',ch.deathRisk,3]].map(([k,label,value,max])=>
 '<div class="between"><span>'+label+' · '+value+' / '+max+'</span><div class="row"><button class="btn small flat" data-action="stat" data-id="'+esc(ch.id)+'" data-stat="'+k+'" data-delta="-1">−1</button><button class="btn small flat" data-action="stat" data-id="'+esc(ch.id)+'" data-stat="'+k+'" data-delta="1">+1</button></div></div>').join('')+'</div>':'<p class="hint">Selecione uma ficha da edição 2.0 para alterar recursos.</p>')+'</div>'+
 '<div class="panel"><h3>Notas secretas da campanha</h3><textarea id="gm-note" rows="6">'+esc(s.gmNote||'')+'</textarea><button class="btn red" data-action="save-gm-note">Salvar notas</button></div>';
}
function rules(){
 return '<header class="section-head"><div><div class="eyebrow">SLASHER / LIVRO BÁSICO</div><h2>Regras rápidas · Edição de Teste I</h2><p>Este resumo substitui o manual da edição VI; consulte o PDF oficial da edição atual para detalhes.</p></div></header>'+
 '<div class="rules-grid">'+[
 ['ROLAGEM','d100 ≤ Alvo. Alvo = atributo + treinamento + circunstâncias (mínimo 10, máximo 90).'],
 ['DIFICULDADE','Normal = Alvo; Difícil = metade; Extremo = um quinto.'],
 ['GRAUS','Até metade: Forte; até um quinto: Extraordinário. 01: Virada; 100: Revés.'],
 ['COMPETÊNCIAS','Treinada +15; especializada +25 no lugar de +15. Circunstâncias entre −20 e +20.'],
 ['PISTAS','Pista Essencial é obtida por abordagem plausível, sem teste obrigatório.'],
 ['PREPARO','Dois usos por Caso, se item comum, acessível e compatível com seis Espaços.'],
 ['VIOLÊNCIA','Ataque percentual, esquiva custa 1 Fôlego; dano fixo, +1 Forte ou +2 Extraordinário.'],
 ['FERIMENTOS','Dano 3+ causa Ferimento Grave; 0 Vitalidade inicia Risco de Morte 0–3.'],
 ['CAÇADA','Distância 0–4; sucesso +1, Forte +2, falha −1, Revés −2.'],
 ['TENSÃO','Escala 0–6, com pressão em 3, limite em 5 e Ruptura em 6.'],
 ['DESENVOLVIMENTO','1–2 Marcas por Sessão; custos 4/5/6/8 para melhorias.']
 ].map(([title,detail])=>'<div class="rule-section"><h3>'+title+'</h3><p>'+detail+'</p></div>').join('')+'</div>';
}
function randomCharacter(){
 const history=R.HISTORIES[Math.floor(Math.random()*R.HISTORIES.length)];
 const values=[...R.ATTRIBUTE_VALUES].sort(()=>Math.random()-.5);
 const attrs=Object.fromEntries(Object.keys(R.ATTRIBUTES).map((k,i)=>[k,values[i]]));
 const extras=R.SKILLS.filter(k=>!history.skills.includes(k)).slice(0,3);
 const skills=Object.fromEntries([...history.skills,...extras].map((k,i)=>[k,i===0?25:15]));
 return R.newCharacter({name:'Desconhecido de Dunmoor',age:25,occupation:history.name,
 attrs,history:history.id,skills,contact:history.contact,bonds:['Amigo de infância','Parente distante','Contato da cidade'],inventory:[]});
}
window.SLASHER_V2={characterForm,parseCharacterForm,sheet,dice,dashboard,gm,rules,roster,randomCharacter};
})();