// SLASHER | Dunmoore | frontend modular sem build step
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=dt=>new Date(dt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const ATTR=[['CIE','Ciências'],['RAL','Raciocínio e Lógica'],['COC','Conhecimento Oculto'],['EDF','Educação Física'],['REF','Reflexo'],['TEC','Oficina e Tecnologia'],['CRI','Criatividade e Estilo'],['SOC','Habilidades Sociais']];
const CLASSES=[['atl','O Atleta','Arrancada','1× por cena, 3 STA para +2 em Escapar.'],['bul','O Bully','Entre eles','1× por cena, Proteger concede +3 Defesa.'],['ner','O Nerd','Padrão oculto','1× por cena, pergunte relação entre duas pistas.'],['pat','A Patricinha','Pessoa certa','1× por sessão, declare contato social plausível.'],['pop','A Popular','Voz firme','1× por cena, conversa segura recupera +5 EST adicionais.'],['reb','O Rebelde','Saída lateral','1× por cena, +2 em REF/TEC com cobertura.'],['par','O Paranormal','Presságio','1× por cena, +5 EST para obter sinal verdadeiro.'],['art','O Artista','Ruído certo','1× por cena, +2 ao criar distração.'],['cod','O Coder','Cópia fria','1× por cena, cópia extra de evidência digital acessível.'],['esc','O Escoteiro','Conheço um caminho','1× por cena, +2 ao localizar rota segura.'],['tra','O Trabalhador','Na gambiarra','1× por cena, +2 em TEC com materiais.'],['pro','O Professor','Contexto histórico','1× por cena, descubra uma conexão documental.']];
const PRESETS={atl:[0,0,0,4,3,0,1,2],bul:[0,0,0,4,2,1,0,3],ner:[2,4,1,0,0,2,1,0],pat:[0,2,0,0,1,0,3,4],pop:[0,1,0,0,2,0,3,4],reb:[0,0,1,2,3,2,2,0],par:[0,2,4,0,1,0,2,1],art:[0,1,1,0,1,1,4,2],cod:[0,3,0,0,1,4,2,0],esc:[1,1,0,3,3,1,0,1],tra:[0,1,0,3,1,4,0,1],pro:[2,4,1,0,0,0,1,2]};
const NAMES=['Eleanor Hayes','Daniel Mercer','Charlotte Reed','Oliver Brooks','Amelia Blackwell','Mason Keller','Hazel Bishop','Isaac Shaw','Vivian Rivers','Caleb Turner','Beth Holloway','Noah Barlow','Grace Sullivan','Elliot Walker','Olivia Keating','Nathan Foster','Leah Whitmore','Finn Abbott','Abigail Quinn','Arthur Pierce','Rachel Dawson','Samuel Graves','Annie Collins','Morgan Hale'];
const OCC=['aluno transferido','voluntária da biblioteca','técnico de eletrônica','fotógrafo amador','garçonete do cais','guarda florestal','aprendiz de mecânico','funcionário do hospital','jornalista do grêmio','professor substituto','atendente de loja de discos','músico de garagem','auxiliar na serraria'];
const HOOKS=['Ouviu três batidas dentro de uma parede vazia.','Tem uma fotografia em que alguém foi apagado.','O nome aparece em um relatório antigo da mina.','Não lembra como conseguiu a chave do hospital.','Sonha com uma coroa sob o lago.','Recebeu uma ligação de uma pessoa desaparecida.','Sabe de um túnel que não consta nos mapas.','Tem medo de descobrir o que o pai assinou.'];
const cls=k=>CLASSES.find(c=>c[0]===k)||CLASSES[0];
const attrObj=k=>Object.fromEntries(ATTR.map(([key],i)=>[key,PRESETS[k]?.[i]??0]));
const uuid=()=>crypto.randomUUID?.()||('id-'+Date.now()+'-'+Math.random().toString(16).slice(2));
const sample=a=>a[Math.floor(Math.random()*a.length)];
const roleIcon=k=>k==='item'?'▣':k==='skill'?'✦':'✝';
const NOCACHE='slasher7-demo-v1'; // Nome histórico da chave para preservar campanhas salvas.
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),4200)}
function safeErr(err){return String(err?.message||err||'Erro inesperado').replace(/invalid login credentials/i,'E-mail ou senha incorretos').replace(/email not confirmed/i,'Confirme seu e-mail para entrar').replace(/user already registered/i,'Este e-mail já está cadastrado')}
function avatar(ch,size=''){return `<div class="avatar ${size}">${ch.portrait?`<img src="${esc(ch.portrait)}" alt="Retrato de ${esc(ch.name)}">`:esc(ch.name?.[0]?.toUpperCase()||'?')}</div>`}
function actorName(id){return state.members.find(m=>m.user_id===id)?.nickname||(id===state.user?.id?'Você':'Sobrevivente')}
const config=window.SLASHER_CONFIG||{};
const ONLINE=false; // github pages P2P: Supabase not loaded or contacted
const state={mode:ONLINE?'online':'local',user:null,campaignId:null,campaign:null,campaigns:[],members:[],characters:[],effects:[],rolls:[],audit:[],gmNote:'',page:'lobby',selected:null,modal:null,authTab:'quick',gmPreview:false,loading:false,connection:'offline',channel:null,revision:0};
const isGM=()=>state.campaign&&state.members.some(m=>m.user_id===state.user?.id&&m.role==='gm')&&!state.gmPreview;
const own=ch=>ch?.owner_id===state.user?.id;
const canEdit=ch=>ch&&(isGM()||own(ch));
const selected=()=>state.characters.find(x=>x.id===state.selected)||state.characters[0];
function dateNow(){return new Date().toISOString()}

// Armazenamento de campanhas locais com compatibilidade para arquivos anteriores.
class LocalAPI{
 constructor(){this.me={id:'demo-gm',email:'',user_metadata:{display_name:'Mestre'}};this.data=null} // ID legado preserva permissões.
 seed(){return {campaigns:[],members:[],characters:[],effects:[],rolls:[],audit:[],notes:{}}}
 isLegacySample(c){return c?.id==='dunmoore-1999'&&c?.invite_code==='DEMO-777'&&c?.name==='Dunmoore: Ecos da Montanha'}
 save(){try{localStorage.setItem(NOCACHE,JSON.stringify(this.data))}catch{ /* armazenamento restrito: sessão em memória */ }}
 async init(){try{this.data=JSON.parse(localStorage.getItem(NOCACHE))||this.seed()}catch{this.data=this.seed()}this.save();return this.me}
 async logout(){return true}
 async listCampaigns(){return this.data.members.filter(m=>m.user_id===this.me.id).map(m=>({...m,campaign:this.data.campaigns.find(c=>c.id===m.campaign_id)})).filter(m=>m.campaign&&!this.isLegacySample(m.campaign))}
 async createCampaign(n,nick){const id=uuid(),c={id,name:n,invite_code:uuid().replace(/-/g,'').slice(0,12).toUpperCase(),suspicion:0,danger:0,created_at:dateNow()};this.data.campaigns.push(c);this.data.members.push({campaign_id:id,user_id:this.me.id,role:'gm',nickname:nick});this.data.notes[id]='';this.save();return id}
 async joinCampaign(code,nick){const c=this.data.campaigns.find(c=>c.invite_code===code.trim().toUpperCase());if(!c)throw Error('Convite não encontrado neste arquivo. Para jogar com amigos, use o código da Sala P2P.');this.data.members.push({campaign_id:c.id,user_id:this.me.id,role:'player',nickname:nick});this.save();return c.id}
 async loadCampaign(id){return {campaign:this.data.campaigns.find(c=>c.id===id),members:this.data.members.filter(m=>m.campaign_id===id),characters:this.data.characters.filter(c=>c.campaign_id===id),effects:this.data.effects.filter(e=>e.campaign_id===id),rolls:this.data.rolls.filter(r=>r.campaign_id===id).slice(-80).reverse(),audit:this.data.audit.filter(a=>a.campaign_id===id).slice(-35).reverse(),gmNote:this.data.notes[id]||''}}
 async createCharacter(p){const id=uuid(),c=window.SLASHER_RULES.newCharacter({...p,id,campaign_id:p.campaign_id,owner_id:p.npc?null:(p.owner_id||this.me.id)});c.updated_at=dateNow();this.data.characters.push(c);this.audit('Sobrevivente 2.0 criado',id);this.save();return id}
 audit(message,ch){this.data.audit.push({id:uuid(),campaign_id:state.campaignId,actor_id:this.me.id,character_id:ch,message,created_at:dateNow()})}
 async changeStat(id,key,d){const c=this.data.characters.find(c=>c.id===id);if(!c||c.schemaVersion!==2)throw Error('Ficha 2.0 não encontrada');const limits={vitality:6,stamina:5,tension:6,preparations:2,deathRisk:3,development:999};if(!Object.hasOwn(limits,key)||!Number.isInteger(Number(d)))throw Error('Indicador inválido');c[key]=window.SLASHER_RULES.clamp(Number(c[key]||0)+Number(d),0,limits[key]);this.audit('Alterou '+key+' em '+d,id);this.save()}
 async grantEffect(id,kind,title,details){this.data.effects.push({id:uuid(),campaign_id:state.campaignId,character_id:id,kind,title,details,created_at:dateNow()});this.audit(`Concedeu ${kind}: ${title}`,id);this.save()}
 async removeEffect(id){const e=this.data.effects.find(e=>e.id===id);if(!e)return;this.data.effects=this.data.effects.filter(e=>e.id!==id);this.audit(`Removeu ${e.kind}: ${e.title}`,e.character_id);this.save()}
 async setClock(k,v){this.data.campaigns.find(c=>c.id===state.campaignId)[k]=v;this.save()}
 async saveNote(t){this.data.notes[state.campaignId]=t;this.save()}
 async updateCharacter(ch){const c=this.data.characters.find(c=>c.id===ch.id);if(!c||c.schemaVersion!==2)throw Error('Ficha 2.0 não encontrada');const merged={...c,...ch,id:c.id,campaign_id:c.campaign_id,owner_id:c.owner_id,vitality:c.vitality,vitalityMax:c.vitalityMax,stamina:c.stamina,staminaMax:c.staminaMax,tension:c.tension,preparations:c.preparations,wounds:c.wounds,deathRisk:c.deathRisk,marks:c.marks,development:c.development};const errors=window.SLASHER_RULES.validateCharacter(merged);if(errors.length)throw Error(errors.join('; '));Object.assign(c,merged,{updated_at:dateNow()});this.audit('Ficha atualizada',c.id);this.save()}
 async assignCharacter(chId,owner){this.data.characters.find(c=>c.id===chId).owner_id=owner;this.audit('Atribuição de ficha alterada',chId);this.save()}
 async roll(p){const c=this.data.characters.find(c=>c.id===p.character_id&&c.campaign_id===p.campaign_id);if(!c)throw Error('Selecione uma ficha da edição 2.0');const result=window.SLASHER_RULES.rollForCharacter(c,p);const r={...result,schemaVersion:2,id:uuid(),campaign_id:p.campaign_id,actor_id:p.actor_id||this.me.id,character_id:c.id,kind:'test',description:safeInput(p.description,160),created_at:dateNow()};this.data.rolls.push(r);this.save();return r}
}
const api=new LocalAPI();
const P2P=window.SLASHER_P2P||{on(){},peers(){return []},snapshot(){},call(){return Promise.reject(Error('WebRTC indisponível'))}};
let p2pOffer='',p2pAnswer='',p2pWait='',p2pNickname='';

function p2pDiagDetails(d){return '<small>Rotas locais: '+(Number(d.candidateCount)||0)+' · ICE: '+esc(d.ice||'new')+' · Conexão: '+esc(d.connection||'new')+' · DataChannel: '+esc(d.channel||'novo')+'</small>'+
 '<small>Candidatos locais: '+esc(d.localRoutes||'nenhuma')+' · Remotos: '+esc(d.remoteRoutes||'nenhuma')+'</small>'}
function p2pDiagnostics(){const d=P2P.diagnostics?.()||{};return `<div class="p2p-diagnostic ${d.phase==='error'?'p2p-diagnostic-error':''}" id="p2p-diagnostic" role="status" aria-live="polite"><strong>Estado da conexão:</strong> ${esc(d.message||'Aguardando...')}<details class="p2p-technical"><summary>Detalhes da conexão</summary>${p2pDiagDetails(d)}</details></div>`}

// ---- Interface ----
function updateConnectionStatus(){const el=$('#connection');if(el)el.innerHTML=state.mode==='p2p-host'?'<span class="chip good">P2P / MESTRE</span>':state.mode==='p2p-client'?`<span class="chip ${state.connection==='live'?'good':'red'}">P2P / ${state.connection==='live'?'CONECTADO':'DESCONECTADO'}</span>`:state.mode==='local'?'<span class="chip">ARQUIVO LOCAL</span>':`<span class="chip ${state.connection==='live'?'good':'red'}"><span class="live-dot"></span>${esc(state.connection==='live'?'AO VIVO':state.connection.toUpperCase())}</span>`}
function renderLogin(){return renderP2PLanding()}
function renderP2PLanding(){return `<div class="login-shell"><section class="login-hero"><div class="hero-content"><div class="eyebrow">DUNMOOR / MAINE / ARQUIVO Nº X</div><div class="hero-line"></div><div class="hero-title">SLASHER</div><div class="hero-sub">DUNMOORE</div><p class="lead">O mestre abre a porta. O restante da mesa decide se entra.</p><div class="row" style="margin-top:24px"><span class="chip">P2P / WEBRTC</span><span class="chip">SALA PRIVADA</span><span class="chip">VERSÃO 1.0</span></div></div><div class="hero-foot">O QUE A MONTANHA ENGOLIU AINDA ESTÁ ESCUTANDO.</div></section><section class="login-side"><div class="login-card"><div class="eyebrow">CONEXÃO PRIVADA / ARQUIVOS DA MESA</div><h2>Escolha como entrar.</h2><p class="lead">O mestre hospeda os arquivos no próprio navegador. Jogadores se conectam diretamente, sem cadastro e sem banco remoto.</p><div class="panel stack" style="margin-top:22px"><button class="btn red wide" data-action="p2p-host">✝ Hospedar como mestre ↗</button><button class="btn flat wide" data-action="p2p-join">⌁ Entrar na mesa do mestre</button><p class="hint">Entre com um código curto de sala. Se necessário, use as opções avançadas de conexão.</p><p class="hint">O mestre deve manter a aba aberta. Salve backups da campanha no computador.</p></div><div class="settings-login-access"><button type="button" class="btn flat" data-action="go" data-value="settings">⚙ Configurações de imagem e áudio</button></div></div></section></div>`}
function renderP2PJoin(){const online=P2P.hasSignaling();return `<div class="login-shell"><section class="login-hero"><div class="hero-content"><div class="eyebrow">CONEXÃO P2P / SOBREVIVENTE</div><div class="hero-line"></div><div class="hero-title">SLASHER</div><div class="hero-sub">DUNMOORE / SALA PRIVADA</div><p class="lead">Uma sala, nove caracteres. O mestre mantém a campanha no próprio navegador.</p></div></section><section class="login-side"><div class="login-card"><div class="eyebrow">SINALIZAÇÃO ASSISTIDA</div><h2>Entrar na mesa.</h2><form id="p2p-short-join-form" class="stack"><label class="field">Seu apelido<input name="nick" required minlength="2" maxlength="32" value="${esc(p2pNickname)}" placeholder="Como vão te chamar"></label><label class="field">Código curto da sala<input name="room" class="p2p-short-field" required maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="AB3D5FGH9"></label><button type="submit" class="btn red wide" ${online?'':'disabled'}>⌁ Conectar à sala ↗</button></form>${online?'<p class="hint">O código faz a negociação automaticamente. Se a conexão direta falhar, Cloudflare TURN poderá retransmitir os dados.</p>':'<p class="m71-info">Conexão por código curto ainda não ativada. O administrador precisa implantar o Worker Cloudflare e definir o endereço de sinalização. Use a alternativa manual abaixo.</p>'}<details class="p2p-legacy"><summary>Conexão avançada / código manual</summary><form id="p2p-join-form"><label class="field">Apelido<input name="nick" minlength="2" maxlength="32" value="${esc(p2pNickname)}" required></label><label class="field">Código completo do mestre<textarea name="offer" rows="4" required placeholder="Cole o código longo do convite manual"></textarea></label><button type="submit" class="btn flat wide">Gerar resposta manual</button></form>${p2pAnswer?`<label class="field">Resposta para devolver ao mestre<textarea readonly id="p2p-answer" rows="4">${esc(p2pAnswer)}</textarea></label><button class="btn flat" data-action="p2p-copy" data-target="p2p-answer">Copiar resposta</button>`:''}</details>${p2pDiagnostics()}<button class="btn flat wide" data-action="p2p-back" style="margin-top:16px">← Voltar</button></div></section></div>`}
function renderP2PRoom(){const host=state.mode==='p2p-host',peers=P2P.peers(),room=P2P.roomStatus();return `${titleBlock('WEBRTC / CONEXÃO DIRETA','Sala P2P',host?'O mestre é a autoridade. Compartilhe apenas o código curto; a conexão acontece automaticamente.':'Conexão P2P com o mestre.')}<div class="grid2"><section class="panel stack"><div class="panel-title"><h3>${host?'✝ Controle do mestre':'⌁ Conexão com o mestre'}</h3><span class="tag">${host?peers.length+' CONECTADOS':'JOGADOR'}</span></div>${host?`<p>Campanha: <b>${esc(state.campaign?.name||'')}</b></p><p class="hint">A campanha fica salva neste navegador. A Cloudflare apenas ajuda os participantes a se conectarem.</p>${P2P.hasSignaling()?`<button class="btn red" data-action="p2p-create-room" ${room.active?'disabled':''}>${room.active?'Sala curta aberta ✓':'✚ Abrir sala com código curto'}</button>${room.active?`<div class="p2p-short-invite"><span class="eyebrow">CÓDIGO PARA A TURMA</span><input id="p2p-short-code" class="p2p-short-field" value="${esc(room.code||'')}" readonly aria-label="Código da sala"><button class="btn flat" data-action="p2p-copy" data-target="p2p-short-code">Copiar código</button><p class="hint">Jogadores escolhem Entrar na mesa e digitam estes nove caracteres.</p></div>`:''}`:'<p class="m71-info">Cloudflare ainda não configurada. A opção manual continua disponível enquanto o Worker não é implantado.</p>'}<details class="p2p-legacy"><summary>Conexão avançada / código manual</summary><button class="btn flat" data-action="p2p-offer">Gerar convite manual</button>${p2pOffer?`<label class="field">Convite<textarea readonly rows="4" id="p2p-offer-code">${esc(p2pOffer)}</textarea></label><button class="btn flat" data-action="p2p-copy" data-target="p2p-offer-code">Copiar convite</button><label class="field">Resposta do jogador<textarea rows="4" id="p2p-response-code" placeholder="Cole a resposta"></textarea></label><button class="btn flat" data-action="p2p-accept">Concluir conexão manual</button>`:''}</details>${p2pDiagnostics()}`:`<p><b>Conectado como ${esc(state.user?.user_metadata?.display_name||'Sobrevivente')}</b></p><p class="hint">O mestre controla a campanha. O conteúdo não é armazenado pela Cloudflare.</p>`}</section><section class="panel stack"><div class="panel-title"><h3>Participantes</h3></div>${host?peers.map(x=>`<div class="m71-item"><strong>${esc(x.nick)}</strong><span class="chip good">${esc(x.state)}</span></div>`).join('')||'<p class="hint">Ainda não há jogadores conectados.</p>':'<p class="hint">Conexão P2P ativa. Abra a Mesa Atual para jogar.</p>'}<button class="btn flat" data-action="go" data-value="mesa">◈ Ir para Mesa Atual</button></section></div>`}

function p2pPublicSnapshot(){
 const camp=state.campaignId,dat=api.data;
 const raw=state.mesa71||{};
 const visible=!!raw.encounter?.active;
 const mesa={version:2,threats:visible?(raw.threats||[]):[],clocks:raw.clocks||[],chase:raw.chase||null,inventory:raw.inventory||[],encounter:raw.encounter||null,events:raw.events||[],ready:true,error:''};
 return {campaign:dat.campaigns.find(c=>c.id===camp),members:dat.members.filter(m=>m.campaign_id===camp),characters:dat.characters.filter(c=>c.campaign_id===camp),effects:dat.effects.filter(e=>e.campaign_id===camp),rolls:dat.rolls.filter(r=>r.campaign_id===camp).slice(-80).reverse(),audit:dat.audit.filter(e=>e.campaign_id===camp).slice(-35).reverse(),mesa71:mesa,investigation:state.investigation||null};
}
function broadcastP2P(){if(state.mode==='p2p-host'&&state.campaignId&&state.campaign)P2P.snapshot(p2pPublicSnapshot())}
function safeInput(s,max=120){return String(s||'').trim().slice(0,max)}
function downloadP2PBackup(){
 if(state.mode!=='p2p-host')throw Error('Só o mestre pode salvar o arquivo da campanha');
 const table={};
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&/^(slasher71_local_|slasher2_table_|slasher2_investigation_)/.test(key))table[key]=JSON.parse(localStorage.getItem(key))}}catch{}
 if(state.campaignId&&state.mesa71)table['slasher2_table_'+state.campaignId]=state.mesa71;
 const saved={type:'slasher-p2p-backup',format:1,exportedAt:dateNow(),data:api.data,mesa:table};
 const blob=new Blob([JSON.stringify(saved,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='SLASHER_P2P_backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 toast('Backup do SLASHER exportado. Guarde esse arquivo em segurança.');
}
async function restoreP2PBackup(file){
 if(state.mode!=='p2p-host')throw Error('Somente o mestre importa backups');
 if(P2P.peers().length)throw Error('Desconecte os jogadores antes de restaurar um backup');
 if(!file||file.size>6*1024*1024)throw Error('O backup precisa ter menos de 6 MB');
 const backup=JSON.parse(await file.text());const db=backup?.data;
 if(backup.type!=='slasher-p2p-backup'||backup.format!==1||!db||!Array.isArray(db.campaigns)||!Array.isArray(db.members)||!Array.isArray(db.characters)||!Array.isArray(db.effects)||!Array.isArray(db.rolls)||!Array.isArray(db.audit)||typeof db.notes!=='object'||!db.notes||typeof backup.mesa!=='object'||!backup.mesa)throw Error('Backup incompatível ou corrompido');
 if(db.campaigns.length>100||db.characters.length>500||Object.keys(backup.mesa).length>100)throw Error('Backup acima do limite permitido');
 if(!confirm('Substituir os arquivos locais do mestre pelos dados deste backup? Esta ação não pode ser desfeita.'))return;
 api.data=db;api.save();
 for(const [key,value] of Object.entries(backup.mesa))if(/^(slasher71_local_|slasher2_table_|slasher2_investigation_)/.test(key)&&key.length<130)try{localStorage.setItem(key,JSON.stringify(value))}catch{}
 state.mesa71=null;await loadLobby();toast('Backup restaurado. Abra a campanha para voltar ao jogo.');
}

async function handleGuestRequest(who,method,args){
 if(state.mode!=='p2p-host'||!state.campaignId||!state.campaign)throw Error('O mestre não abriu a campanha');
 if(!api.data.members.some(m=>m.campaign_id===state.campaignId&&m.user_id===who.id))throw Error('Participante não reconhecido');
 const [a,b,c,d]=Array.isArray(args)?args:[];
 const owned=id=>{const ch=api.data.characters.find(x=>x.id===id&&x.campaign_id===state.campaignId);if(!ch||ch.owner_id!==who.id)throw Error('Esta ficha não pertence a você');return ch};
 let result;
 if(method==='createCharacter'){
   const p=a||{};if(!safeInput(p.name,90))throw Error('Nome obrigatório');
   result=await api.createCharacter({...p,campaign_id:state.campaignId,owner_id:who.id,npc:false});
  }else if(method==='updateCharacter'){
   owned(a?.id);result=await api.updateCharacter({...a,portrait:String(a.portrait||'').slice(0,170000),notes:String(a.notes||'').slice(0,5000)});
  }else if(method==='roll'){
   const p=a||{};owned(p.character_id);
   if(p.kind!=='test'||!['normal','dificil','extremo'].includes(p.difficulty||'normal'))throw Error('Tipo de rolagem inválido');
   result=await api.roll({...p,kind:'test',campaign_id:state.campaignId,actor_id:who.id});
 }else if(method==='mesa'){
  const op=a,params=b||{};
  if(!['v2-attack','v2-chase'].includes(op))throw Error('Ação não autorizada');
  owned(params.actor);
  result=window.SLASHER71.remote(state,op,params,who.id);api.save();
 }else throw Error('Ação não autorizada ao jogador P2P');
 await refreshCampaign(false);broadcastP2P();return result;
}
function guestMethods(){
 api.save=()=>{};
 api.listCampaigns=async()=>api.data.members.filter(m=>m.user_id===api.me.id).map(m=>({...m,campaign:api.data.campaigns.find(c=>c.id===m.campaign_id)}));
 api.createCampaign=()=>Promise.reject(Error('Só o mestre pode criar campanhas'));
 api.joinCampaign=()=>Promise.reject(Error('Use o convite WebRTC para entrar'));
 for(const fn of ['createCharacter','updateCharacter','roll'])api[fn]=(...args)=>P2P.call(fn,args);
 for(const fn of ['changeStat','grantEffect','removeEffect','setClock','saveNote','assignCharacter'])api[fn]=()=>Promise.reject(Error('Ação exclusiva do mestre'));
 api.remoteMesa=(op,args)=>P2P.call('mesa',[op,args]);
}
P2P.on('status',info=>{
 p2pWait=info.message;const el=document.getElementById('p2p-diagnostic');if(el){const wasExpanded=!!el.querySelector('.p2p-technical[open]');el.classList.toggle('p2p-diagnostic-error',info.phase==='error');el.innerHTML='<strong>Estado da conexão:</strong> '+esc(info.message)+'<details class="p2p-technical"'+(wasExpanded?' open':'')+'><summary>Detalhes da conexão</summary>'+p2pDiagDetails(info)+'</details>'}
});
P2P.on('hello',who=>{
 if(state.mode!=='p2p-host'||!state.campaignId)return;
 api.data.members.push({campaign_id:state.campaignId,user_id:who.id,role:'player',nickname:who.nick});api.save();
 broadcastP2P(); // sends to all peers, including the newcomer
 refreshCampaign(false).catch(console.error);
});
P2P.on('request',handleGuestRequest);
P2P.on('welcome',message=>{
 state.user={id:message.id,email:null,user_metadata:{display_name:message.nick}};api.me=state.user;
 api.data={campaigns:[],members:[],characters:[],effects:[],rolls:[],audit:[],notes:{}};
 guestMethods();state.mode='p2p-client';state.connection='live';p2pWait='Conectado ao mestre';
 render();
});
P2P.on('snapshot',async payload=>{
 if(state.mode!=='p2p-client'||!payload?.campaign)return;
 api.data={campaigns:[payload.campaign],members:payload.members,characters:payload.characters,effects:payload.effects,rolls:payload.rolls,audit:payload.audit,notes:{}};
 state.mesa71=payload.mesa71;state.investigation=payload.investigation;
 if(!state.campaignId){state.campaignId=payload.campaign.id;state.page='mesa';}
 await refreshCampaign(false);
});
P2P.on('disconnected',who=>{
 if(who.role==='client'&&state.mode==='p2p-client'){state.connection='offline';toast('Conexão P2P encerrada. O mestre precisa estar online.');updateConnectionStatus()}
 else if(who.role==='host'&&state.mode==='p2p-host'){broadcastP2P();if(state.page==='p2p-room')render()}
});

const navItems=[['p2p-room','⌁','Sala P2P'],['mesa','◈','Mesa Atual'],['dashboard','▦','Visão geral'],['characters','♟','Sobreviventes'],['sheet','▤','Ficha digital'],['dice','⬡','Rolagens'],['investigation','⌕','Investigação'],['gm','✝','Painel do mestre'],['rules','☷','Regras rápidas']];
function renderShell(content){return `<div class="shell"><aside class="sidebar"><div class="brand"><div class="wordmark">SLASHER</div><small>DUNMOOR, MAINE</small></div><div class="side-group-label">ARQUIVOS DA CAMPANHA</div><nav class="side-nav" aria-label="Navegação"><button data-action="go" data-value="lobby" class="${state.page==='lobby'?'active':''}">⌂ Campanhas</button>${state.campaign?navItems.filter(([id])=>id!=='gm'||isGM()).map(([id,icon,title])=>`<button data-action="go" data-value="${id}" class="${state.page===id?'active':''}">${icon} ${title}</button>`).join(''):''}</nav><div class="side-group-label">SISTEMA</div><nav class="side-nav" aria-label="Configurações"><button data-action="go" data-value="settings" class="${state.page==='settings'?'active':''}">⚙ Configurações</button></nav><div class="side-foot"><div class="eyebrow">STATUS DO ARQUIVO</div><p class="tiny" style="margin:8px 0">A cidade nunca esquece. Ela apenas muda os registros.</p><span class="edition-footnote">SLASHER · VERSÃO 1.0.0</span></div></aside><div class="main"><header class="topbar"><div><div class="eyebrow">${state.campaign?'CAMPANHA ATIVA':'ARQUIVO CENTRAL'}</div><b>${esc(state.campaign?.name||'Dunmoore Horror Story')}</b></div><div class="topbar-right"><span id="connection">${state.mode==='local'?'<span class="chip">ARQUIVO LOCAL</span>':'<span class="chip">CONECTANDO</span>'}</span><span class="user-email tiny muted">${esc(state.user?.user_metadata?.display_name||state.user?.email||'Mestre')}</span><button class="btn small flat" data-action="logout">Sair</button></div></header><main class="main-body">${content}</main></div></div>`}
function titleBlock(k,title,desc,actions=''){return `<header class="section-head"><div><div class="eyebrow">${k}</div><h2>${title}</h2><p>${desc}</p></div>${actions?`<div class="row">${actions}</div>`:''}</header>`}
function rosterCard(ch,action='select-char'){return window.SLASHER_V2.roster(ch)}
function renderLobby(){const items=state.campaigns.map(m=>`<button class="survivor-card" data-action="open-campaign" data-id="${m.campaign_id}"><div class="avatar" style="font:30px Georgia">⌂</div><div class="info"><b>${esc(m.campaign?.name||'Campanha')}</b><small>${m.role==='gm'?'MESTRE':'JOGADOR'} · ${esc(m.nickname)}</small><small class="mono">Arquivo local</small></div><span class="accent">↗</span></button>`).join('');return `${titleBlock('SLASHER / ARQUIVOS LOCAIS','Suas campanhas','Abra uma campanha e depois acesse Sala P2P para convidar amigos.')}<section class="hero-panel"><div><div class="eyebrow">DUNMOORE / MESA CONECTADA</div><h2>Dunmoore continua esperando.</h2><p>Acesse as fichas, distribua itens e conduza uma campanha com seus jogadores conectados.</p><div class="row" style="margin-top:22px"><button class="btn red" data-action="modal" data-value="create-campaign">+ Criar campanha</button></div></div></section><div class="panel"><div class="panel-title"><h3>Arquivos disponíveis</h3><span class="tag">${state.campaigns.length} CAMPANHAS</span></div><div class="grid2">${items||'<div class="empty full"><b>Nenhuma campanha encontrada</b>Crie uma campanha para assumir o papel de mestre.</div>'}</div>${state.mode==='p2p-host'?`<div class="panel stack" style="margin-top:16px"><h3>Arquivo local do mestre</h3><p class="hint">Salve backups regularmente. O navegador não substitui um HD e o SLASHER não envia cópias à nuvem.</p><div class="row"><button class="btn flat" data-action="p2p-export">↓ Exportar backup</button><label class="btn flat" style="cursor:pointer">↑ Restaurar backup<input type="file" id="p2p-backup-file" accept="application/json,.json" style="display:none"></label></div></div>`:''}</div>`}
function renderDashboard(){return window.SLASHER_V2.dashboard(state,isGM())}
function renderCharacters(){return titleBlock('ARQUIVO / SOBREVIVENTES','Sobreviventes','Fichas da Edição de Teste I.', '<button class="btn red" data-action="modal" data-value="create-character">+ Criar ficha</button>')+'<div class="grid2">'+state.characters.map(ch=>window.SLASHER_V2.roster(ch)).join('')+'</div>'}
function statBox(label,v,max,key){return `<div class="kpi"><div class="between"><span class="stat-label">${label}</span><span class="stat-label mono">${v}/${max}</span></div><div class="stat-value">${v}</div><div class="meter ${key}"><span style="width:${Math.max(0,Math.min(100,v/max*100))}%"></span></div></div>`}
function effectGroup(ch,kind,label){let entries=state.effects.filter(x=>x.character_id===ch.id&&x.kind===kind);return `<div class="panel"><div class="panel-title"><h3>${label}</h3><span class="tag">${entries.length}</span></div><div class="item-list">${entries.map(e=>`<div class="item"><div><strong><span class="accent">${roleIcon(kind)}</span> ${esc(e.title)}</strong><small>${esc(e.details||'Nenhuma descrição')}</small></div>${isGM()?`<button class="btn small negative" data-action="remove-effect" data-id="${e.id}" title="Retirar recurso">Remover</button>`:`<span class="chip">${kind==='item'?'EQUIP.':kind==='skill'?'TALENTO':'ESTADO'}</span>`}</div>`).join('')||`<div class="hint">${kind==='item'?'Nenhum item registrado.':kind==='skill'?'Nenhuma habilidade concedida.':'Nenhuma condição ativa.'}</div>`}</div>${isGM()?`<button class="btn small flat" style="margin-top:12px" data-action="modal" data-value="grant" data-kind="${kind}" data-id="${ch.id}">+ Adicionar ${kind==='item'?'item':kind==='skill'?'habilidade':'condição'}</button>`:''}</div>`}
function renderSheet(){return window.SLASHER_V2.sheet(state,selected(),canEdit(selected()))}
function rollDescription(kind,attribute,characterName){const suffix=characterName?' · '+characterName:'';if(kind==='monster')return 'Ataque de criatura';if(kind==='attack')return 'Ataque de sobrevivente'+suffix;const a=ATTR.find(([key])=>key===attribute);return (a?'Teste de '+a[1]+' ('+a[0]+')':'Teste geral (sem atributo)')+suffix}
function renderRollList(limit=30){const list=state.rolls.slice(0,limit);return `<div class="journal">${list.map(r=>`<div class="journal-event"><div class="between"><b>${r.kind==='monster'?'☠ ':r.kind==='attack'?'⚔ ':'⬡ '}${esc(r.description||'Teste de habilidade')}</b><small>${fmt(r.created_at)}</small></div><p>${esc(actorName(r.actor_id))} · D20 <b class="accent">${r.natural}</b> ${r.modifier<0?'−':'+'} ${Math.abs(r.modifier)} = <b style="color:white">${r.total}</b>${r.damage?' · dano '+r.damage:''}</p></div>`).join('')||'<div class="empty"><b>Silêncio total.</b>Nenhuma rolagem registrada ainda.</div>'}</div>`}
function renderDice(){return window.SLASHER_V2.dice(state,selected())}
function clockRender(key,title,max,desc){const val=Number(state.campaign?.[key]||0);return `<div class="panel"><div class="between"><div><div class="eyebrow">${title}</div><h3>${val} / ${max}</h3></div><span class="tag">MESTRE</span></div><p class="hint">${desc}</p><div class="clock">${Array.from({length:max},(_,i)=>`<button class="${val>i?'filled':''}" data-action="set-clock" data-key="${key}" data-value="${i+1}" title="Definir ${i+1}">${val>i?'✕':'·'}</button>`).join('')}</div><button class="btn small flat" data-action="set-clock" data-key="${key}" data-value="0">Zerar relógio</button></div>`}
function renderGm(){return isGM()?window.SLASHER_V2.gm(state,selected()):'<div class="empty">Arquivo exclusivo do narrador.</div>'}
function renderRules(){return window.SLASHER_V2.rules()}
function renderModal(){if(!state.modal)return '';const m=state.modal;let body='';if(m.type==='create-campaign')body=`<h2>Criar campanha</h2><p class="lead">Você será o mestre. Um convite será gerado automaticamente.</p><form id="create-campaign"><label class="field">Nome da campanha<input name="name" required minlength="3" maxlength="90" placeholder="Ex.: Dunmoore: O Último Ano"></label><label class="field">Seu nome na mesa<input name="nick" required minlength="2" maxlength="50" placeholder="Ex.: Narrador" value="${esc(state.user?.user_metadata?.display_name||'')}"></label><div class="modal-footer"><button type="button" class="btn flat" data-action="close-modal">Cancelar</button><button type="submit" class="btn red">Criar mesa</button></div></form>`;
 if(m.type==='join-campaign')body=`<h2>Entrar na campanha</h2><p class="lead">Peça o código de acesso ao mestre.</p><form id="join-campaign"><label class="field">Código de convite<input name="code" required placeholder="CÓDIGO DA MESA" style="text-transform:uppercase" autocomplete="off"></label><label class="field">Seu nome na mesa<input name="nick" required minlength="2" maxlength="50" placeholder="Seu apelido" value="${esc(state.user?.user_metadata?.display_name||'')}"></label><div class="modal-footer"><button type="button" class="btn flat" data-action="close-modal">Cancelar</button><button type="submit" class="btn red">Entrar</button></div></form>`;
 if(m.type==='create-character'){body=window.SLASHER_V2.characterForm()}
 if(m.type==='grant'){const kind=m.kind||'item';body=`<h2>Conceder ${kind==='skill'?'habilidade':kind==='condition'?'condição':'item'}</h2><p class="lead">O recurso aparecerá na ficha selecionada dos jogadores conectados.</p><form id="grant-effect"><input name="character_id" type="hidden" value="${esc(m.id)}"><input name="kind" type="hidden" value="${esc(kind)}"><label class="field">Nome do recurso<input name="title" maxlength="80" minlength="2" required placeholder="Ex.: Chave da Ala Norte"></label><label class="field">Descrição<textarea name="details" maxlength="500" placeholder="Efeito e informações do recurso"></textarea></label><div class="modal-footer"><button type="button" class="btn flat" data-action="close-modal">Cancelar</button><button type="submit" class="btn red">Conceder à ficha</button></div></form>`}
 if(m.type==='edit-character'){const ch=state.characters.find(c=>c.id===m.id);body=ch&&!window.SLASHER_RULES.isLegacy(ch)?window.SLASHER_V2.characterForm(ch):'<h2>Ficha legada</h2><p>Crie uma ficha 2.0 separada.</p>'}
 if(m.type==='assign'){const ch=state.characters.find(c=>c.id===m.id);body=`<h2>Atribuir personagem</h2><p class="lead">Mude o dono da ficha de ${esc(ch?.name||'sobrevivente')} sem perder recursos e ferimentos.</p><form id="assign-character"><input name="id" type="hidden" value="${m.id}"><label class="field">Novo responsável<select name="owner_id"><option value="">NPC sem dono</option>${state.members.map(x=>`<option value="${x.user_id}" ${ch?.owner_id===x.user_id?'selected':''}>${esc(x.nickname)} (${x.role==='gm'?'mestre':'jogador'})</option>`).join('')}</select></label><div class="modal-footer"><button class="btn flat" type="button" data-action="close-modal">Cancelar</button><button class="btn red" type="submit">Confirmar</button></div></form>`}
 return `<div class="modal-backdrop" role="presentation" id="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="SLASHER: ${esc(m.type)}">${body}</section></div>`}
function classSummary(key){const a=PRESETS[key]||PRESETS.ner,p=cls(key);return `<div class="eyebrow">ATRIBUTOS PRÉ-DEFINIDOS · 10 PONTOS</div><div class="row" style="margin-top:9px">${ATTR.map(([k],i)=>`<span class="tag">${k} <b style="color:white">${a[i]}</b></span>`).join('')}</div><p class="hint" style="margin-top:9px"><b>${esc(p[2])}:</b> ${esc(p[3])} · HP/STA ${12+2*a[3]}</p>`}
function renderDiceOverlay(r,rolling=false){return `<div class="dice-shade" id="dice-overlay"><div class="dice-dialog"><div class="eyebrow">SLASHER / PROTOCOLO DE ROLAGEM</div><h2>${rolling?'O dado está girando...':'Resultado da rolagem'}</h2><div class="dice-box ${rolling?'roll':''}" id="dice-face">${rolling?'?':r.natural}</div>${rolling?`<p class="muted">O destino ainda não escolheu um número.</p>`:`<p class="result-total">${r.total}<span class="tiny muted"> total</span></p><p class="muted">D20 natural ${r.natural} ${r.modifier>=0?'+':'−'} ${Math.abs(r.modifier)} · ${esc(r.description||'Rolagem')}</p>${r.damage?`<p class="result-damage">Dano potencial: ${r.damage}</p>`:''}<button class="btn red wide" data-action="close-dice" style="margin-top:18px">Fechar resultado</button>`}</div></div>`}
function render(){const root=$('#app');if(!state.user){root.innerHTML=state.page==='settings'?window.SLASHER_SETTINGS.render({guest:true}):state.page==='p2p-join'?renderP2PJoin():renderLogin();window.SLASHER_CRT?.sync?.();window.SLASHER_SFX?.sync?.();return}let page=state.page;if(!state.campaign&&page!=='settings')page='lobby';const components={lobby:renderLobby,investigation:()=>window.SLASHER_INVESTIGATION?.render(state,isGM())||'<div class="panel">Arquivo indisponível</div>','p2p-room':renderP2PRoom,mesa:()=>window.SLASHER71.render(state),dashboard:renderDashboard,characters:renderCharacters,sheet:renderSheet,dice:renderDice,gm:renderGm,rules:renderRules,settings:()=>window.SLASHER_SETTINGS.render()};root.innerHTML=renderShell((components[page]||renderLobby)())+renderModal();updateConnectionStatus();state._mesaRender=render;if(page==='mesa')window.SLASHER71.attachDrag(state);if(page==='settings'){window.SLASHER_CRT?.sync?.();window.SLASHER_SFX?.sync?.()}}
// ---- Fluxos da mesa e interações ----
async function loadLobby(){state.campaigns=await api.listCampaigns();state.campaign=null;state.campaignId=null;state.characters=[];state.effects=[];state.selected=null;state.page='lobby';if(api.unsubscribe)api.unsubscribe();render()}
async function openCampaign(id){if(api.unsubscribe)api.unsubscribe();state.campaignId=id;state.page='mesa';await refreshCampaign(true);if(api.subscribe)api.subscribe(id,()=>{clearTimeout(syncTimer);syncTimer=setTimeout(()=>refreshCampaign(false).catch(e=>console.error(e)),300)})}
let syncTimer=null,refreshing=false;
async function refreshCampaign(force=false){if(!state.campaignId||refreshing)return;refreshing=true;try{const payload=await api.loadCampaign(state.campaignId);if(!payload?.campaign)throw Error('Campanha não encontrada ou acesso revogado');Object.assign(state,payload);await window.SLASHER71.load(state,api);window.SLASHER_INVESTIGATION?.load(state);if(!state.characters.some(c=>c.id===state.selected))state.selected=state.characters[0]?.id||null;
 const editing=!force&&(state.modal||document.activeElement?.closest('form')||document.activeElement?.id==='gm-note'||state.page==='settings');if(!editing)render();else updateConnectionStatus();if(state.mode==='p2p-host')broadcastP2P();}finally{refreshing=false}}
async function syncAction(cb,notice='Alteração salva e sincronizada.'){try{await cb();if(state.campaignId)await refreshCampaign(true);else await loadLobby();if(notice)toast(notice)}catch(e){console.error(e);toast('Erro: '+safeErr(e))}}
function randomChar(){return {name:sample(NAMES),class_key:sample(CLASSES)[0],age:16+Math.floor(Math.random()*35),occupation:sample(OCC),hook:sample(HOOKS)}}
async function randomNpc(){if(!isGM())throw Error('Somente o mestre cria NPCs');const info=window.SLASHER_V2.randomCharacter();info.name=sample(NAMES);const id=await api.createCharacter({...info,campaign_id:state.campaignId,npc:true});state.selected=id;await refreshCampaign(true);toast('NPC criado na Edição 2.0.')}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('Copiado para a área de transferência.')}catch{window.prompt('Copie o código de convite:',text)}}
function openDiceOverlay(r){$('#dice-overlay')?.remove();document.body.insertAdjacentHTML('beforeend',renderDiceOverlay(r))}
function executeRoll(p){
 if($('#dice-overlay'))return;
 const local=window.SLASHER_DICE.build(p);
 const optimistic={...p,...local,description:p.description,created_at:new Date().toISOString(),id:'local-'+Date.now()};
 document.body.insertAdjacentHTML('beforeend',renderDiceOverlay(null,true));
 const face=$('#dice-face');let n=1;
 const spin=setInterval(()=>{if(face?.isConnected)face.textContent=String(n++%20+1)},50);
 let statusText='⟳ Sincronizando com a mesa...',failed=false;
 const status=()=>{const el=$('#dice-sync-note');if(el){el.textContent=statusText;el.classList.toggle('error',failed)}};
 const sync=api.roll({...p,clientDice:local}).then(saved=>{
   statusText='✓ Resultado registrado na mesa';
   if(state.campaignId===p.campaign_id){state.rolls=[saved,...state.rolls.filter(r=>r.id!==saved.id)].slice(0,80)}
   status();return saved;
 }).catch(e=>{
   failed=true;statusText='⚠ Não sincronizado. A rolagem não entrou no histórico.';
   status();console.error('Falha ao sincronizar D20:',e);toast('Rolagem não registrada: '+safeErr(e));return null;
 });
 setTimeout(()=>{
  clearInterval(spin);
  if(!$('#dice-overlay'))return;
  if(state.mode==='p2p-client') {sync.then(result=>{if(result&&$('#dice-overlay'))openDiceOverlay(result)});return;}
  openDiceOverlay(optimistic);
  const dialog=$('#dice-overlay .dice-dialog');if(dialog)dialog.insertAdjacentHTML('beforeend','<p class="dice-sync-note" id="dice-sync-note"></p>');
  status();
 },480);
 return sync;
}
function photoCompress(file){return new Promise((resolve,reject)=>{if(!file) return resolve(null);if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(Error('Somente JPG, PNG ou WebP.'));if(file.size>8*1024*1024)return reject(Error('Imagem maior que 8 MB.'));const url=URL.createObjectURL(file);const img=new Image();img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Não foi possível abrir a imagem.'))};img.onload=()=>{URL.revokeObjectURL(url);try{const ratio=Math.min(1,320/img.width,390/img.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#151519';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/jpeg',.72);if(data.length>149000)data=canvas.toDataURL('image/jpeg',.48);if(data.length>149000)throw Error('Imagem ainda é grande demais.');resolve(data)}catch(e){reject(e)}};img.src=url})}

document.addEventListener('click',async e=>{
 if(e.target.id==='modal-backdrop'){state.modal=null;render();return}
 const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;const act=btn.dataset.action,val=btn.dataset.value,id=btn.dataset.id;
 try{
 if(act.startsWith('investigation-')){btn.disabled=true;await window.SLASHER_INVESTIGATION.action(act,btn,{state,api,refreshCampaign,render,toast,isGM});return}
 if(act.startsWith('mesa-')){btn.disabled=true;await window.SLASHER71.action(act,btn,{state,api,refreshCampaign,render,toast});return}
 switch(act){
 case 'p2p-host':state.mode='p2p-host';state.user=api.me;await loadLobby();return;
 case 'p2p-join':state.page='p2p-join';render();return;
 case 'p2p-back':p2pAnswer='';p2pWait='';state.page='lobby';render();return;
 case 'p2p-create-room':if(state.mode!=='p2p-host'||!state.campaignId)throw Error('Abra uma campanha primeiro');await P2P.createRoom();render();toast('Sala criada. Copie o código curto para os jogadores!');return;
 case 'p2p-offer':if(state.mode!=='p2p-host'||!state.campaignId)throw Error('Abra uma campanha primeiro');p2pOffer=await P2P.hostOffer();render();return;
 case 'p2p-accept':if(state.mode!=='p2p-host')throw Error('Apenas o mestre pode aceitar');await P2P.acceptAnswer($('#p2p-response-code')?.value.trim());toast('Resposta aceita. Aguardando o jogador conectar.');render();return;
 case 'p2p-copy':{const field=document.getElementById(btn.dataset.target);if(field)await copyText(field.value);return}
 case 'p2p-export':downloadP2PBackup();return;
 case 'auth-tab':state.authTab=val;render();return;
 case 'logout':if(state.mode==='p2p-host'||state.mode==='p2p-client'){if(state.mode==='p2p-host'&&P2P.peers().length&&!confirm('Encerrar as conexões dos jogadores?'))return;P2P.close();location.reload();return;}if(state.mode==='online'&&state.user?.is_anonymous&&!confirm('Esta conta está vinculada ao navegador. Sair pode fazer você perder acesso às fichas. Continuar?'))return;await api.logout();state.user=null;state.campaign=null;state.campaignId=null;state.page='lobby';api.unsubscribe?.();render();return;
 case 'go':if(val==='p2p-room'&&!state.campaignId)throw Error('Abra uma campanha antes de criar um convite');if(val==='gm'&&!isGM())throw Error('Apenas o mestre pode usar este painel');state.page=val;state.modal=null;render();return;
 case 'open-campaign':await openCampaign(id);return;
 case 'modal':if(val==='grant'&&!isGM())throw Error('Somente o mestre pode conceder itens');if(val==='edit-character'&&!canEdit(state.characters.find(c=>c.id===id)))throw Error('Ficha protegida');state.modal={type:val,id,kind:btn.dataset.kind,portraitData:null};render();return;
 case 'close-modal':state.modal=null;render();return;
 case 'select-char':state.selected=id;state.page='sheet';render();return;
 case 'random-npc':await randomNpc();return;
 case 'random-fields':{const form=$('#create-character');if(!form)return;const a=randomChar();form.elements.name.value=a.name;form.elements.age.value=a.age;form.elements.class_key.value=a.class_key;form.elements.occupation.value=a.occupation;$('#class-preview').innerHTML=classSummary(a.class_key);return}
 case 'copy-invite':await copyText(state.campaign.invite_code);return;
 case 'clear-portrait':{if(!state.modal)return;state.modal.portraitData='';const el=$('#portrait-preview');if(el)el.innerHTML='<div class="avatar">?</div>';const file=$('#portrait-file');if(file)file.value='';return}
 case 'stat':{if(!isGM())throw Error('Somente o mestre pode alterar indicadores');btn.disabled=true;await syncAction(()=>api.changeStat(id,btn.dataset.stat,Number(btn.dataset.delta)));return}
 case 'set-clock':{if(!isGM())throw Error('Somente o mestre controla os relógios');const key=btn.dataset.key;let newValue=Number(val);if(state.campaign[key]===newValue)newValue=Math.max(0,newValue-1);btn.disabled=true;await syncAction(()=>api.setClock(key,newValue),'Relógio da cidade atualizado.');return}
 case 'save-gm-note':{if(!isGM())throw Error('Sem acesso');const v=$('#gm-note').value;btn.disabled=true;await syncAction(()=>api.saveNote(v),'Nota secreta salva.');return}
 case 'remove-effect':{if(!isGM())throw Error('Somente o mestre remove recursos');if(!confirm('Remover este recurso da ficha?'))return;btn.disabled=true;await syncAction(()=>api.removeEffect(id),'Recurso removido da ficha.');return}
 case 'close-dice':$('#dice-overlay')?.remove();return;
 }
 }catch(err){console.error(err);toast('Erro: '+safeErr(err));btn.disabled=false}
});
document.addEventListener('change',async e=>{
 if(e.target.id==='p2p-backup-file'){try{await restoreP2PBackup(e.target.files?.[0])}catch(err){toast('Backup: '+safeErr(err))}return}
 if(e.target.id==='sheet-picker'||e.target.id==='gm-picker'){state.selected=e.target.value;render();return}
 if(e.target.id==='class-picker'){$('#class-preview').innerHTML=classSummary(e.target.value);return}
 if(e.target.id==='m71-focus'){window.SLASHER71.focusChanged(state,e.target.value);render();return}
 if(e.target.id==='portrait-file'){
  try{const data=await photoCompress(e.target.files[0]);if(!state.modal||state.modal.type!=='edit-character')return;state.modal.portraitData=data;$('#portrait-preview').innerHTML=`<div class="avatar"><img alt="Prévia do retrato" src="${esc(data)}"></div>`;toast('Retrato preparado. Clique em salvar ficha para sincronizar.')}catch(err){toast(safeErr(err));e.target.value=''}
 }
});

document.addEventListener('submit',async e=>{
 e.preventDefault();const form=e.target;const formId=form.getAttribute('id');if(!formId&&!form.dataset.mesaForm)return;const dat=Object.fromEntries(new FormData(form).entries());const submit=form.querySelector('button[type=submit]');if(submit?.disabled)return;if(submit)submit.disabled=true;
 try{
 if(form.dataset.investigationForm){await window.SLASHER_INVESTIGATION.submit(form,{state,api,refreshCampaign,render,toast,isGM});return}
 if(form.dataset.mesaForm){await window.SLASHER71.submit(form,{state,api,refreshCampaign,render,toast},e.submitter);return}
 if(formId==='p2p-short-join-form'){p2pNickname=safeInput(dat.nick,32);await P2P.joinRoom(dat.room,p2pNickname);p2pWait='Aguardando conexão com o mestre...';render();return;}
 if(formId==='p2p-join-form'){p2pNickname=safeInput(dat.nick,32);p2pWait='Aguardando o mestre aceitar a conexão...';p2pAnswer=await P2P.joinOffer(String(dat.offer||'').trim(),p2pNickname);render();return;}
 if(formId==='quick-auth-form'){
  if(state.mode!=='online')throw Error('Acesso rápido indisponível na demonstração');const result=await api.anonymousAuth(dat.nickname);state.user=result.user;await loadLobby();toast('Acesso criado como '+dat.nickname);return;
 }
 if(formId==='auth-form'){
 const result=await api.auth(state.authTab,dat.email,dat.password);if(result.session){state.user=result.user;await loadLobby()}else{state.authTab='login';render();toast('Cadastro recebido. Confira seu e-mail para confirmar a conta.')}return;
 }
 if(formId==='create-campaign'){const id=await api.createCampaign(dat.name,dat.nick);state.modal=null;await openCampaign(id);toast('Campanha criada. Abra a Sala P2P para convidar jogadores.');return}
 if(formId==='join-campaign'){const id=await api.joinCampaign(dat.code,dat.nick);state.modal=null;await openCampaign(id);toast('Você entrou na campanha.');return}
 if(formId==='create-character'){
  const data=window.SLASHER_V2.parseCharacterForm(dat);
  const id=await api.createCharacter({...data,campaign_id:state.campaignId,npc:false});
  state.selected=id;state.modal=null;state.page='sheet';await refreshCampaign(true);toast('Sobrevivente 2.0 criado.');return;
  }
 if(formId==='grant-effect'){if(!isGM())throw Error('Apenas o mestre pode conceder recursos');await api.grantEffect(dat.character_id,dat.kind,dat.title.trim(),dat.details.trim());state.modal=null;await refreshCampaign(true);toast('Recurso concedido e sincronizado.');return}
 if(formId==='assign-character'){if(!isGM())throw Error('Apenas o mestre atribui fichas');await api.assignCharacter(dat.id,dat.owner_id||null);state.modal=null;await refreshCampaign(true);toast('Responsável pela ficha atualizado.');return}
 if(formId==='edit-character'){
  const prev=state.characters.find(c=>c.id===dat.id);if(!canEdit(prev))throw Error('Ficha protegida');
  const next=window.SLASHER_V2.parseCharacterForm(dat,prev);
  next.portrait=state.modal?.portraitData??prev.portrait;
  await api.updateCharacter(next);state.modal=null;await refreshCampaign(true);toast('Ficha 2.0 salva.');return;
  }
 if(formId==='dice-form'){
   const character=state.characters.find(c=>c.id===dat.character_id);
   if(!character||!canEdit(character))throw Error('Você não controla esta ficha');
   const p={campaign_id:state.campaignId,character_id:character.id,kind:'test',attribute:dat.attribute,skill:dat.skill||null,
   difficulty:dat.difficulty,circumstance:Number(dat.circumstance),description:dat.description||'Teste de '+dat.attribute};
   const result=await api.roll(p);
   await refreshCampaign(true);
   toast('D100 '+result.natural+' / '+result.limit+' · '+(result.success?'SUCESSO '+result.grade.toUpperCase():'FALHA')+(result.special?' · '+result.special.toUpperCase():''));
   return;
  }
  }catch(err){console.error(err);toast('Erro: '+safeErr(err))}finally{if(submit?.isConnected)submit.disabled=false}
});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#dice-overlay')){$('#dice-overlay').remove();return}if(state.modal){state.modal=null;render()}}});
window.addEventListener('storage',e=>{if(state.mode==='local'&&e.key===NOCACHE&&state.user){try{api.data=JSON.parse(e.newValue);if(state.campaignId)refreshCampaign(false);else loadLobby()}catch{}}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.campaignId&&state.mode==='online')refreshCampaign(false).catch(console.error)});
setInterval(()=>{if(!document.hidden&&state.campaignId&&state.mode==='online')refreshCampaign(false).catch(console.error)},20000);
(async()=>{try{const user=await api.init();state.user=state.mode==='local'?null:user;if(user&&state.mode==='online')await loadLobby();else render()}catch(e){console.error(e);$('#app').innerHTML=`<div class="login-side" style="min-height:100vh"><div class="panel"><h2>Falha de conexão</h2><p>${esc(safeErr(e))}</p><p class="hint">Recarregue a página e verifique o armazenamento local.</p><button class="btn red" onclick="location.reload()">Tentar novamente</button></div></div>`}})();