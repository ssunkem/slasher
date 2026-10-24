/* SLASHER / Cloudflare signaling v1: WebSocket offers/answers/ICE only.
   Game state lives with the GM. TURN secrets NEVER leave the Worker.
   Deploy with Wrangler. DO stores room/session metadata, not character sheets. */
const ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_GUESTS=6;
const codeRE=/^[A-HJ-NP-Z2-9]{9}$/;
const STUN={urls:['stun:stun.cloudflare.com:3478','stun:stun.l.google.com:19302']};
const json=(data,status=200,more={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...more}});
const random=(length)=>{
 const a=new Uint8Array(length),out=[];crypto.getRandomValues(a);
 // 32-symbol alphabet; mask produces exact uniform selection.
 for(const n of a)out.push(ABC[n&31]);return out.join('');
};
const uuid=()=>crypto.randomUUID();
const cors=(req,env)=>{
 const origin=req.headers.get('Origin');
 const allowed=String(env.ALLOWED_ORIGINS||'https://ssunkem.github.io').split(',').map(s=>s.trim());
 return origin&&allowed.includes(origin)?{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Content-Type, Authorization','access-control-max-age':'600','vary':'Origin'}:null;
};
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname,headers=cors(request,env);
  if(path==='/health')return json({service:'SLASHER signal',ready:true,turnConfigured:!!(env.TURN_KEY_ID&&env.TURN_API_TOKEN)});
  if(!headers)return json({error:'Origem não autorizada'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  const reply=(data,status=200)=>json(data,status,headers);
  if(path==='/v1/rooms'&&request.method==='POST'){
   // Abuse limit is enforced in a DO, not a per-instance Worker variable.
   const ip=request.headers.get('CF-Connecting-IP')||'local-development';
   const limiter=env.ROOMS.get(env.ROOMS.idFromName('limiter:'+ip));
   const permitted=await limiter.fetch('https://internal/rate',{method:'POST'});
   if(!permitted.ok)return reply({error:'Muitas salas criadas nesta rede. Tente mais tarde.'},429);
   for(let i=0;i<5;i++){
    const code=random(9),token=uuid()+uuid();
    const room=env.ROOMS.get(env.ROOMS.idFromName('room:'+code));
    const created=await room.fetch('https://internal/init',{method:'POST',headers:{'x-host-token':token}});
    if(created.status===201)return reply({code,hostToken:token},201);
   }
   return reply({error:'Não foi possível gerar um código de sala.'},503);
  }
  const match=path.match(/^\/v1\/rooms\/([A-Z0-9]{9})\/(ws|ice)$/);
  if(!match||!codeRE.test(match[1]))return reply({error:'Caminho ou código de sala inválido'},404);
  const [,code,action]=match;
  const stub=env.ROOMS.get(env.ROOMS.idFromName('room:'+code));
  if(action==='ws'){
   if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return reply({error:'WebSocket obrigatório'},426);
   // host token must never be written to logs or shared as room code
   return stub.fetch(new Request('https://internal/ws'+url.search,{headers:request.headers}));
  }
  if(action==='ice'&&request.method==='POST'){
   const auth=request.headers.get('Authorization')||'';
   if(!/^Bearer [a-f0-9-]{36}$/i.test(auth))return reply({error:'Acesso negado'},401);
   const response=await stub.fetch('https://internal/ice',{method:'POST',headers:{authorization:auth}});
   return new Response(response.body,{status:response.status,headers:{...headers,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
  return reply({error:'Método não permitido'},405);
 }
};

export class SlasherRoom {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 sessions(){return this.ctx.getWebSockets().map(ws=>({ws,a:ws.deserializeAttachment()})).filter(x=>x.a?.role);}
 byRole(role){return this.sessions().find(x=>x.a.role===role);}
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/rate'){
   const now=Date.now(),prior=await this.ctx.storage.get('limiter')||{start:0,count:0};
   const count=now-prior.start>3600000?{start:now,count:1}:{start:prior.start,count:prior.count+1};
   await this.ctx.storage.put('limiter',count);
   return count.count<=12?new Response('ok'):new Response('limit',{status:429});
  }
  if(url.pathname==='/init'){
   if(await this.ctx.storage.get('hostToken'))return new Response('collision',{status:409});
   const token=request.headers.get('x-host-token');
   if(!token||token.length<50)return new Response('invalid',{status:400});
   await this.ctx.storage.put('hostToken',token);
   return new Response('created',{status:201});
  }
  const hostToken=await this.ctx.storage.get('hostToken');
  if(!hostToken)return json({error:'Sala inexistente ou encerrada'},404);
  if(url.pathname==='/ws'){
   const role=url.searchParams.get('role'),token=url.searchParams.get('token');
   if(role==='host'&&token!==hostToken)return json({error:'Token do mestre inválido'},403);
   if(role!=='host'&&role!=='guest')return json({error:'Perfil inválido'},400);
   if(role==='host'&&this.byRole('host'))return json({error:'Mestre já conectado'},409);
   if(role==='guest'&&!this.byRole('host'))return json({error:'O mestre não está online'},409);
   if(role==='guest'&&this.sessions().filter(x=>x.a.role==='guest').length>=MAX_GUESTS)return json({error:'Sala cheia'},429);
   const [client,server]=Object.values(new WebSocketPair());
   const peerId=role==='host'?'host':uuid(),auth=uuid();
   this.ctx.acceptWebSocket(server);
   server.serializeAttachment({role,peerId,auth,iceIssuedAt:0});
   server.send(JSON.stringify({type:'ready',peerId,auth}));
   if(role==='guest')this.sendHost({type:'peer-joined',peerId});
   return new Response(null,{status:101,webSocket:client});
  }
  if(url.pathname==='/ice'){
   const token=(request.headers.get('authorization')||'').slice(7);
   const user=this.sessions().find(s=>s.a.auth===token);
   if(!user)return json({error:'Sessão encerrada'},401);
   if(Date.now()-(user.a.iceIssuedAt||0)<60000)return json({error:'Aguarde para renovar credenciais TURN'},429);
   user.ws.serializeAttachment({...user.a,iceIssuedAt:Date.now()});
   if(!this.env.TURN_KEY_ID||!this.env.TURN_API_TOKEN)return json({iceServers:[STUN],turn:false});
   const endpoint=`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(this.env.TURN_KEY_ID)}/credentials/generate-ice-servers`;
   let res;
   try{res=await fetch(endpoint,{method:'POST',headers:{authorization:`Bearer ${this.env.TURN_API_TOKEN}`,'content-type':'application/json'},body:JSON.stringify({ttl:21600})});}
   catch{return json({error:'Serviço TURN indisponível'},503)}
   if(!res.ok)return json({error:'Não foi possível obter credenciais TURN'},503);
   const data=await res.json();
   const valid=(data.iceServers||[]).filter(s=>s&&s.urls).map(s=>({...s,urls:(Array.isArray(s.urls)?s.urls:[s.urls]).filter(u=>!/:53(?:\?|$)/.test(u))}));
   if(!valid.length)return json({error:'Serviço TURN retornou dados incompletos'},502);
   return json({iceServers:valid,turn:valid.some(s=>!!s.credential)});
  }
  return json({error:'Inválido'},404);
 }
 sendHost(message){const host=this.byRole('host');if(host){try{host.ws.send(JSON.stringify(message))}catch{}}}
 webSocketMessage(ws,data){
  if(typeof data!=='string'||data.length>33000)return;
  let msg;try{msg=JSON.parse(data)}catch{return}
  const sender=ws.deserializeAttachment();
  if(!sender||!['host','guest'].includes(sender.role))return;
  if(!['offer','answer','candidate'].includes(msg.type))return;
  const dest=sender.role==='host'?this.sessions().find(x=>x.a.role==='guest'&&x.a.peerId===msg.to):this.byRole('host');
  if(!dest)return;
  if(msg.type==='candidate'){
   if(msg.candidate!==null&&(typeof msg.candidate!=='object'||typeof msg.candidate.candidate!=='string'||msg.candidate.candidate.length>4000))return;
  }else if(!msg.description||msg.description.type!==(msg.type==='offer'?'offer':'answer')||typeof msg.description.sdp!=='string'||msg.description.sdp.length>24000)return;
  try{dest.ws.send(JSON.stringify({type:msg.type,from:sender.peerId,description:msg.description,candidate:msg.candidate??null}))}catch{}
 }
 async webSocketClose(ws){
  const a=ws.deserializeAttachment();
  if(a?.role==='host'){
   for(const user of this.sessions().filter(s=>s.a.role==='guest')){try{user.ws.close(4000,'Mestre saiu')}catch{}}
   await this.ctx.storage.delete('hostToken');
  }else if(a?.role==='guest')this.sendHost({type:'peer-left',peerId:a.peerId});
 }
 async webSocketError(ws){try{ws.close(1011,'Falha de conexão')}catch{};await this.webSocketClose(ws)}
}