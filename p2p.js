/* SLASHER P2P: manual WebRTC signaling, host authoritative game session.
   No Supabase / centralized signaling. Public STUN only, TURN not included.
   The host must keep this browser tab open. */
(function(){
 'use strict';
 const ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
 const MAX_SIGNAL=35000,CHUNK=12000,MAX_MESSAGE=1200000;
 const pending=new Map(),live=new Map(),pendingRPC=new Map(),pieces=new Map();
 const uid=()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 let client=null,requestSerial=0;
 const callbacks={};
 const signal=obj=>btoa(Array.from(new TextEncoder().encode(JSON.stringify(obj)),x=>String.fromCharCode(x)).join(''));
 function parse(code,type){
  if(!code||code.length>MAX_SIGNAL)throw Error('Código de conexão vazio ou grande demais');
  let value;
  try{const str=atob(code.replace(/\s/g,''));value=JSON.parse(new TextDecoder().decode(Uint8Array.from(str,c=>c.charCodeAt(0))))}catch{throw Error('Código de conexão inválido ou incompleto')}
  if(value.v!==1||value.type!==type||typeof value.sdp!=='string'||!value.sdp.startsWith('v=0')||value.sdp.length>25000||typeof value.id!=='string')throw Error('Código de conexão incompatível');
  return value;
 }
 function gather(pc){return new Promise((resolve,reject)=>{
  if(pc.iceGatheringState==='complete')return resolve();
  const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',test);reject(Error('Não foi possível reunir as rotas de conexão. Tente gerar outro convite.'))},18000);
  function test(){if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',test);resolve()}}
  pc.addEventListener('icegatheringstatechange',test);
 })}
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
  dc.onclose=()=>{if(who.role==='host')live.delete(who.key);for(const [id,req] of pendingRPC)if(req.who===who){clearTimeout(req.timer);req.reject(Error('A conexão com o mestre caiu'));pendingRPC.delete(id)}callbacks.disconnected?.(who)};
 }
 function received(who,msg){
  if(!msg||typeof msg.type!=='string')return;
  if(who.role==='host'){
   if(msg.type==='hello'&&!who.id){who.id='peer-'+uid();who.nick=String(msg.nick||'Sobrevivente').trim().slice(0,32);if(who.nick.length<2)who.nick='Sobrevivente';live.set(who.key,who);transmit(who.dc,{type:'welcome',id:who.id,nick:who.nick});callbacks.hello?.(who);return}
   if(msg.type==='request'&&who.id&&typeof msg.reqid==='string'&&msg.reqid.length<100){Promise.resolve().then(()=>callbacks.request?.(who,msg.method,msg.args)).then(result=>transmit(who.dc,{type:'reply',reqid:msg.reqid,ok:true,result})).catch(e=>{try{transmit(who.dc,{type:'reply',reqid:msg.reqid,ok:false,error:String(e?.message||e)})}catch{}});return}
  }else{
   if(msg.type==='welcome'){who.id=msg.id;callbacks.welcome?.(msg);return}
   if(msg.type==='snapshot'){callbacks.snapshot?.(msg.payload);return}
   if(msg.type==='reply'){const task=pendingRPC.get(msg.reqid);if(!task)return;clearTimeout(task.timer);pendingRPC.delete(msg.reqid);msg.ok?task.resolve(msg.result):task.reject(Error(msg.error||'Ação negada pelo mestre'));return}
  }
 }
 async function hostOffer(){
  const pc=make(),id=uid(),key=id;let dc;
  try{
   dc=pc.createDataChannel('slasher-sync',{ordered:true});const who={key,pc,dc,role:'host',id:null,nick:null};
   listen(dc,who);
   const offer=await pc.createOffer();await pc.setLocalDescription(offer);await gather(pc);
   pending.set(id,who);
   return signal({v:1,type:'offer',id,sdp:pc.localDescription.sdp});
  }catch(e){pc.close();throw e}
 }
 async function joinOffer(code,nick){
  const offer=parse(code,'offer');const pc=make(),key='client-'+offer.id;
  try{
   const who={key,pc,role:'client',id:null,nick:String(nick||'').trim().slice(0,32),dc:null};
   client=who;
   pc.ondatachannel=e=>{who.dc=e.channel;listen(who.dc,who);who.dc.onopen=()=>transmit(who.dc,{type:'hello',nick:who.nick})};
   await pc.setRemoteDescription({type:'offer',sdp:offer.sdp});const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await gather(pc);
   return signal({v:1,type:'answer',id:offer.id,sdp:pc.localDescription.sdp});
  }catch(e){pc.close();client=null;throw e}
 }
 async function acceptAnswer(code){const answer=parse(code,'answer');const who=pending.get(answer.id);if(!who)throw Error('Esse convite não está mais ativo. Gere um novo.');pending.delete(answer.id);await who.pc.setRemoteDescription({type:'answer',sdp:answer.sdp});return true}
 function snapshot(payload){for(const who of live.values()){try{transmit(who.dc,{type:'snapshot',payload})}catch(e){console.warn('P2P: envio falhou',e)}}}
 function call(method,args){if(!client||client.dc?.readyState!=='open'||!client.id)return Promise.reject(Error('Aguardando conexão com o mestre'));
  const reqid='r'+(++requestSerial)+'-'+Date.now();return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pendingRPC.delete(reqid);reject(Error('O mestre não respondeu à solicitação'))},20000);
   pendingRPC.set(reqid,{who:client,resolve,reject,timer});try{transmit(client.dc,{type:'request',reqid,method,args})}catch(e){clearTimeout(timer);pendingRPC.delete(reqid);reject(e)}
  });
 }
 function close(){for(const who of [...pending.values(),...live.values(),client].filter(Boolean)){try{who.dc?.close();who.pc.close()}catch{}}
  pending.clear();live.clear();client=null;for(const [id,p] of pendingRPC){clearTimeout(p.timer);p.reject(Error('Mesa encerrada'));pendingRPC.delete(id)}
 }
 window.SLASHER_P2P={hostOffer,joinOffer,acceptAnswer,snapshot,call,close,on:(type,cb)=>callbacks[type]=cb,peers:()=>Array.from(live.values()).map(w=>({id:w.id,nick:w.nick,state:w.dc?.readyState})),isClientReady:()=>!!client?.id};
})();