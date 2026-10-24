/* SLASHER P2P: manual WebRTC signaling, host authoritative game session.
   No Supabase / centralized signaling. Public STUN only, TURN not included.
   The host must keep this browser tab open. */
(function(){
 'use strict';
 const ICE={iceServers:[{urls:['stun:stun.cloudflare.com:3478','stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
 // Os convites NÃO têm TTL: gatheringTimeout e connectTimeout não expiram o código.
 const GATHER_MS=30000, CONNECT_MS=45000;
 const MAX_SIGNAL=35000,CHUNK=12000,MAX_MESSAGE=1200000;
 const NO_ROUTE='O navegador não encontrou rotas WebRTC. Confira se PC e celular estão na mesma rede Wi-Fi, sem VPN, e tente novamente. Em algumas redes é necessário um servidor TURN.';
 const hasRoute=sdp=>/^a=candidate:/m.test(String(sdp||''));
 const routeCount=sdp=>(String(sdp||'').match(/^a=candidate:/gm)||[]).length;
 // Contagem por tipo, sem revelar IP privado, mDNS ou endereco publico.
 const routeTypes=sdp=>{
  const groups={host:0,srflx:0,relay:0,prflx:0}, lines=String(sdp||'').split(/\r?\n/).filter(x=>x.startsWith('a=candidate:'));
  let mdns=0;
  for(const line of lines){const type=line.match(/\btyp (host|srflx|relay|prflx)\b/);if(type)groups[type[1]]++;if(/\.local(?:\s|$)/.test(line))mdns++;}
  const parts=Object.entries(groups).filter(([,n])=>n).map(([type,n])=>type+':'+n);
  return parts.length?parts.join(', ')+(mdns?' (mDNS:'+mdns+')':''):'nenhuma';
 };
 let diagnostic={phase:'idle',message:'Pronto para negociar a conexão.',candidateCount:0,ice:'new',connection:'new',channel:'novo',localRoutes:'nenhuma',remoteRoutes:'nenhuma'};
 const report=(phase,message,who)=>{diagnostic={phase,message,
  candidateCount:who?.candidateCount??diagnostic.candidateCount,
  ice:who?.pc?.iceConnectionState||diagnostic.ice,
  connection:who?.pc?.connectionState||diagnostic.connection,
  channel:who?who.dc?.readyState||'não criado':diagnostic.channel,
  localRoutes:who?.pc?routeTypes(who.pc.localDescription?.sdp):diagnostic.localRoutes,
  remoteRoutes:who?.pc?routeTypes(who.pc.remoteDescription?.sdp):diagnostic.remoteRoutes
 };callbacks.status?.({...diagnostic})};
 const pending=new Map(),live=new Map(),pendingRPC=new Map(),pieces=new Map();
 // Uma negociação manual pode aguardar o usuário copiar/colar a resposta.
 // Um ICE 'failed' antes da aplicação da resposta não equivale a convite expirado.
 const retire=who=>{if(!who)return;who.closed=true;clearTimeout(who.connectionTimer);try{who.dc?.close()}catch{}try{who.pc?.close()}catch{}};
 const uid=()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 let client=null,requestSerial=0;
 const callbacks={};
 const signal=obj=>btoa(Array.from(new TextEncoder().encode(JSON.stringify(obj)),x=>String.fromCharCode(x)).join(''));
 function parse(code,type){
  if(!code||code.length>MAX_SIGNAL)throw Error('Código de conexão vazio ou grande demais');
  let value;
  try{const str=atob(code.replace(/\s/g,''));value=JSON.parse(new TextDecoder().decode(Uint8Array.from(str,c=>c.charCodeAt(0))))}catch{throw Error('Código de conexão inválido ou incompleto')}
  if(value.v!==1||value.type!==type||typeof value.sdp!=='string'||!value.sdp.startsWith('v=0')||value.sdp.length>25000||typeof value.id!=='string')throw Error('Código de conexão incompatível');
  if(!hasRoute(value.sdp))throw Error('O código recebido não contém rotas de conexão WebRTC. O outro navegador deve gerar um NOVO código. '+NO_ROUTE);
  return value;
 }
 function gather(pc){return new Promise((resolve,reject)=>{
  let finished=false;
  const finish=()=>{
   if(finished)return;
   finished=true;clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',changed);
   const description=pc.localDescription?.sdp||'';
   hasRoute(description)?resolve(routeCount(description)):reject(Error(NO_ROUTE));
  };
  const changed=()=>{if(pc.iceGatheringState==='complete')finish()};
  // Some phones take longer to gather STUN candidates. If gathering stalls,
  // use the routes we already have instead of rejecting a usable LAN route.
  const timer=setTimeout(finish,GATHER_MS);
  pc.addEventListener('icegatheringstatechange',changed);
  changed();
 })}
 function watch(pc,who){
  const changed=()=>{
   if(who.closed)return; // Ignora callbacks de tentativas antigas.
   const state=pc.connectionState,ice=pc.iceConnectionState;
   if(state==='connected'){
    who.stage='connected';report('connected','Canal P2P conectado.',who);
   }else if(state==='failed'||ice==='failed'){
    if(who.role==='client'&&who.stage==='waiting-host'){
     // O cliente começa a testar ICE assim que cria o answer. Como o mestre
     // ainda precisa colar esse código, um erro ICE aqui é prematuro.
     report('waiting','Resposta gerada. ICE ainda sem conexão: envie o código ao mestre e peça que conclua. Se não conectar depois, gere convite e resposta novos.',who);
    }else if(who.role==='host'&&who.stage==='waiting-answer'){
     report('waiting','Convite criado. Aguardando a resposta do jogador; ICE ainda não foi concluído.',who);
    }else{
     report('error','Falha na negociação ICE depois da resposta. Tente gerar um convite novo. Desative VPN ou isolamento Wi-Fi; algumas redes exigem TURN.',who);
    }
   }else if(state==='disconnected'){
    if(who.stage==='connected')report('error','O outro navegador perdeu a conexão. Confira a rede dos dois aparelhos.',who);
   }else if(state==='connecting'||ice==='checking'){
    if(who.stage==='waiting-host')report('waiting','Resposta pronta. Aguardando o mestre aplicar o código... (ICE: '+ice+')',who);
    else if(who.stage==='waiting-answer')report('waiting','Convite gerado. Aguardando a resposta do jogador...',who);
    else report('connecting','Verificando caminho direto entre os navegadores...',who);
   }
  };
  pc.addEventListener('connectionstatechange',changed);
  pc.addEventListener('iceconnectionstatechange',changed);
 }

 function make(){if(!window.RTCPeerConnection)throw Error('Seu navegador não oferece WebRTC. Use uma versão atual do Firefox ou Chrome.');return new RTCPeerConnection(ICE)}
 function transmit(dc,message){if(!dc||dc.readyState!=='open')throw Error('O outro participante está desconectado');
  const text=JSON.stringify(message);if(text.length>MAX_MESSAGE)throw Error('Mensagem grande demais para P2P');
  const id=uid(),count=Math.ceil(text.length/CHUNK);
  for(let i=0;i<count;i++)dc.send(JSON.stringify({packet:id,index:i,total:count,payload:text.slice(i*CHUNK,(i+1)*CHUNK)}));
 }
 function listen(dc,who){
  dc.onmessage=event=>{
   try{
    const part=JSON.parse(event.data);
    if(!part||typeof part.packet!=='string'||part.packet.length>80||!Number.isInteger(part.index)||!Number.isInteger(part.total)||part.total<1||part.total>130||part.index<0||part.index>=part.total||typeof part.payload!=='string'||part.payload.length>CHUNK)throw Error('Pacote P2P inválido');
    const key=who.key+':'+part.packet;
    let data=pieces.get(key);
    if(!data){data={time:Date.now(),array:Array(part.total),count:0};pieces.set(key,data)}
    if(data.array.length!==part.total)throw Error('Pacote inconsistênte');
    if(data.array[part.index]===undefined){data.array[part.index]=part.payload;data.count++}
    if(data.count===part.total){pieces.delete(key);const msg=JSON.parse(data.array.join(''));received(who,msg)}
    if(pieces.size>80)for(const [k,p] of pieces)if(Date.now()-p.time>30000)pieces.delete(k);
   }catch(e){console.warn('SLASHER P2P pacote ignorado:',e)}
  };
  dc.onerror=()=>report('error','Erro no canal de dados. Gere um novo convite e tente novamente.',who);
  dc.onclose=()=>{if(who.closed)return;if(diagnostic.phase!=='error')report('error','Canal P2P fechado. Será necessário reconectar.',who);if(who.role==='host')live.delete(who.key);for(const [id,req] of pendingRPC)if(req.who===who){clearTimeout(req.timer);req.reject(Error('A conexão com o mestre caiu'));pendingRPC.delete(id)}callbacks.disconnected?.(who)};
 }
 function received(who,msg){
  if(!msg||typeof msg.type!=='string')return;
  if(who.role==='host'){
   if(msg.type==='hello'&&!who.id){report('connected','Jogador entrou na mesa!',who);who.id='peer-'+uid();who.nick=String(msg.nick||'Sobrevivente').trim().slice(0,32);if(who.nick.length<2)who.nick='Sobrevivente';live.set(who.key,who);transmit(who.dc,{type:'welcome',id:who.id,nick:who.nick});callbacks.hello?.(who);return}
   if(msg.type==='request'&&who.id&&typeof msg.reqid==='string'&&msg.reqid.length<100){Promise.resolve().then(()=>callbacks.request?.(who,msg.method,msg.args)).then(result=>transmit(who.dc,{type:'reply',reqid:msg.reqid,ok:true,result})).catch(e=>{try{transmit(who.dc,{type:'reply',reqid:msg.reqid,ok:false,error:String(e?.message||e)})}catch{}});return}
  }else{
   if(msg.type==='welcome'){report('connected','Conectado ao mestre! Aguardando os dados da campanha.',who);who.id=msg.id;callbacks.welcome?.(msg);return}
   if(msg.type==='snapshot'){callbacks.snapshot?.(msg.payload);return}
   if(msg.type==='reply'){const task=pendingRPC.get(msg.reqid);if(!task)return;clearTimeout(task.timer);pendingRPC.delete(msg.reqid);msg.ok?task.resolve(msg.result):task.reject(Error(msg.error||'Ação negada pelo mestre'));return}
  }
 }
 async function hostOffer(){
  // Não deixe um convite antigo gerar 'ICE failed' sobre o convite atual.
  for(const who of pending.values())retire(who);pending.clear();
  const pc=make(),id=uid(),key=id;let dc;
  try{
   dc=pc.createDataChannel('slasher-sync',{ordered:true});const who={key,pc,dc,role:'host',id:null,nick:null,stage:'gathering',closed:false};
   listen(dc,who);watch(pc,who);dc.onopen=()=>{clearTimeout(who.connectionTimer);who.stage='connected';report('connected','Canal aberto; aguardando apresentação do jogador...',who)};
   report('gathering','Descobrindo rotas de conexão do mestre...',who);
   const offer=await pc.createOffer();await pc.setLocalDescription(offer);who.candidateCount=await gather(pc);
   who.stage='waiting-answer';pending.set(id,who);report('offer','Convite pronto ('+who.candidateCount+' rotas). Sem TTL no SLASHER: mantenha esta aba aberta e peça a resposta ao jogador.',who);
   return signal({v:1,type:'offer',id,sdp:pc.localDescription.sdp});
  }catch(e){report('error',e.message||'Não foi possível gerar convite.');pc.close();throw e}
 }
 async function joinOffer(code,nick){
  let offer;try{offer=parse(code,'offer')}catch(e){report('error',e.message);throw e}
  retire(client);client=null;const pc=make(),key='client-'+offer.id;
  try{
   const who={key,pc,role:'client',id:null,nick:String(nick||'').trim().slice(0,32),dc:null,stage:'gathering',closed:false};
   client=who;watch(pc,who);report('gathering','O celular está descobrindo suas rotas WebRTC...',who);
   pc.ondatachannel=e=>{who.dc=e.channel;listen(who.dc,who);who.dc.onopen=()=>{clearTimeout(who.connectionTimer);who.stage='connected';report('connected','Canal aberto. Confirmando identidade com o mestre...',who);transmit(who.dc,{type:'hello',nick:who.nick})}};
   await pc.setRemoteDescription({type:'offer',sdp:offer.sdp});const answer=await pc.createAnswer();await pc.setLocalDescription(answer);who.candidateCount=await gather(pc);
   who.stage='waiting-host';report('answer','Resposta pronta ('+who.candidateCount+' rotas). COPIE e envie ao mestre; ainda não é erro se ICE estiver em checking/failed.',who);
   return signal({v:1,type:'answer',id:offer.id,sdp:pc.localDescription.sdp});
  }catch(e){report('error',e.message||'Não foi possível gerar a resposta.');pc.close();client=null;throw e}
 }
 async function acceptAnswer(code){let answer;try{answer=parse(code,'answer')}catch(e){report('error',e.message);throw e}const who=pending.get(answer.id);if(!who)throw Error('Esse convite não está mais ativo. Gere um novo.');pending.delete(answer.id);who.stage='checking';await who.pc.setRemoteDescription({type:'answer',sdp:answer.sdp});
  report('connecting','Resposta aplicada. Verificando a conexão direta...',who);
  who.connectionTimer=setTimeout(()=>{if(!who.closed&&who.stage==='checking'&&who.dc.readyState!=='open'&&who.pc.connectionState!=='connected'&&who.pc.connectionState!=='closed')report('error','A conexão não abriu após 45 segundos DESDE A ACEITAÇÃO DA RESPOSTA. Crie convite novo e tente novamente. Verifique isolamento Wi-Fi/VPN ou necessidade de TURN.',who)},CONNECT_MS);
  return true}
 function snapshot(payload){for(const who of live.values()){try{transmit(who.dc,{type:'snapshot',payload})}catch(e){console.warn('P2P: envio falhou',e)}}}
 function call(method,args){if(!client||client.dc?.readyState!=='open'||!client.id)return Promise.reject(Error('Aguardando conexão com o mestre'));
  const reqid='r'+(++requestSerial)+'-'+Date.now();return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pendingRPC.delete(reqid);reject(Error('O mestre não respondeu à solicitação'))},20000);
   pendingRPC.set(reqid,{who:client,resolve,reject,timer});try{transmit(client.dc,{type:'request',reqid,method,args})}catch(e){clearTimeout(timer);pendingRPC.delete(reqid);reject(e)}
  });
 }
 function close(){for(const who of [...pending.values(),...live.values(),client].filter(Boolean))retire(who);
  pending.clear();live.clear();client=null;report('idle','Sala desconectada.');for(const [id,p] of pendingRPC){clearTimeout(p.timer);p.reject(Error('Mesa encerrada'));pendingRPC.delete(id)}
 }
 window.SLASHER_P2P={hostOffer,joinOffer,acceptAnswer,snapshot,call,close,on:(type,cb)=>callbacks[type]=cb,peers:()=>Array.from(live.values()).map(w=>({id:w.id,nick:w.nick,state:w.dc?.readyState})),isClientReady:()=>!!client?.id,diagnostics:()=>({...diagnostic,hostPeers:live.size,pendingOffers:pending.size,clientReady:!!client?.id})};
})();