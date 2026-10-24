/* SLASHER v2 · Quadro de investigação compartilhado; segredos não são transmitidos. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const key=id=>'slasher2_investigation_'+id;
const secretKey=id=>'slasher2_secrets_'+id;
const defaults=()=>({version:2,title:'Caso sem título',summary:'',evidence:[],hypotheses:[],questions:[],updatedAt:null});
function load(s){
 if(!s.campaignId)return;
 if(s.mode==='p2p-client'){s.investigation=s.investigation||defaults();return;}
 try{s.investigation={...defaults(),...(JSON.parse(localStorage.getItem(key(s.campaignId)))||{})}}catch{s.investigation=defaults()}
}
function save(s){if(s.mode==='p2p-client')throw Error('Somente o mestre controla o quadro de investigação');s.investigation.updatedAt=new Date().toISOString();localStorage.setItem(key(s.campaignId),JSON.stringify(s.investigation))}
function secrets(s){
 if(s.mode==='p2p-client')return '';
 try{return localStorage.getItem(secretKey(s.campaignId))||''}catch{return ''}
}
function render(s,gm){
 const d=s.investigation||defaults();
 const section=(label,items,kind)=>'<div class="panel"><div class="panel-title"><h3>'+label+'</h3><span class="tag">'+items.length+'</span></div>'+
 '<div class="v2-evidence-list">'+(items.map(item=>'<article class="v2-evidence"><div><small>'+esc(item.location||item.category||'Registro da equipe')+'</small><h4>'+esc(item.title)+'</h4><p>'+esc(item.description||'')+'</p></div>'+
 (gm?'<button type="button" class="btn small flat" data-action="investigation-remove" data-kind="'+kind+'" data-id="'+esc(item.id)+'">Remover</button>':'')+'</article>').join('')||'<p class="hint">Nenhum registro ainda.</p>')+'</div></div>';
 return '<header class="section-head"><div><div class="eyebrow">DUNMOOR / CASO ABERTO</div><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary||'O que se sabe, o que se suspeita e onde procurar.')+'</p></div></header>'+
 '<div class="grid2">'+section('Pistas confirmadas',d.evidence,'evidence')+section('Hipóteses',d.hypotheses,'hypotheses')+section('Perguntas em aberto',d.questions,'questions')+
 (gm?'<div class="panel"><h3>Registrar descoberta</h3><form data-investigation-form="add" class="stack"><label class="field">Tipo<select name="kind"><option value="evidence">Pista confirmada</option><option value="hypotheses">Hipótese do grupo</option><option value="questions">Pergunta em aberto</option></select></label><label class="field">Título<input name="title" maxlength="140" required></label><label class="field">Local ou fonte<input name="location" maxlength="120"></label><label class="field">Descrição<textarea name="description" maxlength="2000" rows="3"></textarea></label><button type="submit" class="btn red">Adicionar ao arquivo</button></form></div>':'')+'</div>'+
 (gm?'<div class="panel"><h3>Configurar o Caso</h3><form data-investigation-form="settings" class="stack"><label class="field">Nome do Caso<input name="title" maxlength="140" value="'+esc(d.title)+'"></label><label class="field">Resumo público<textarea name="summary" rows="2" maxlength="1500">'+esc(d.summary)+'</textarea></label><button class="btn flat" type="submit">Salvar dados públicos</button></form></div>'+
 '<div class="panel"><h3>Arquivo sigiloso do narrador</h3><p class="hint">Salvo apenas no navegador do mestre. Não entra no estado P2P compartilhado.</p><textarea id="v2-secret-note" rows="7" maxlength="20000">'+esc(secrets(s))+'</textarea><button class="btn small red" data-action="investigation-save-secret">Salvar segredo local</button></div>':'');
}
async function submit(form,ctx){
 const {state:s,refreshCampaign,toast}=ctx;if(!ctx.isGM())throw Error('Somente o narrador pode alterar o quadro');
 const dat=Object.fromEntries(new FormData(form));const d=s.investigation||defaults();
 if(form.dataset.investigationForm==='settings'){d.title=String(dat.title||'Caso sem título').trim().slice(0,140);d.summary=String(dat.summary||'').slice(0,1500)}
 else if(form.dataset.investigationForm==='add'){
 const kind=dat.kind;if(!['evidence','hypotheses','questions'].includes(kind))throw Error('Tipo inválido');
 const title=String(dat.title||'').trim();if(!title)throw Error('Título obrigatório');
 d[kind].push({id:crypto.randomUUID(),title:title.slice(0,140),location:String(dat.location||'').slice(0,120),description:String(dat.description||'').slice(0,2000)});
 }else return;
 s.investigation=d;save(s);await refreshCampaign(true);toast('Arquivo de investigação atualizado.');
}
async function action(act,btn,ctx){
 const {state:s,refreshCampaign,toast}=ctx;if(!ctx.isGM())throw Error('Somente o narrador altera o Caso');
 if(act==='investigation-save-secret'){localStorage.setItem(secretKey(s.campaignId),String(document.getElementById('v2-secret-note')?.value||'').slice(0,20000));toast('Notas secretas salvas no navegador do narrador.');return}
 if(act==='investigation-remove'){
 const k=btn.dataset.kind;if(!['evidence','hypotheses','questions'].includes(k))throw Error('Tipo inválido');
 s.investigation[k]=s.investigation[k].filter(i=>i.id!==btn.dataset.id);save(s);await refreshCampaign(true);
 }
}
window.SLASHER_INVESTIGATION={load,render,submit,action};
})();