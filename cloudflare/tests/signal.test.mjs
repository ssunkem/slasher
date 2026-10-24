import assert from 'node:assert/strict';
import worker,{SlasherRoom} from '../src/worker.js';
class FakeResponse{
 constructor(body=null,init={}){this.body=body;this.status=init.status??200;this.headers=init.headers??{};this.webSocket=init.webSocket;this.ok=this.status>=200&&this.status<300}
 async json(){return JSON.parse(this.body)}
}
globalThis.Response=FakeResponse;
class Socket{
 constructor(){this.sent=[];this.readyState=1;this.peer=null;this.attachment=null}
 send(s){this.sent.push(JSON.parse(s));if(this.peer)this.peer.sent.push(JSON.parse(s))}
 close(){this.readyState=3}
 serializeAttachment(a){this.attachment=a}
 deserializeAttachment(){return this.attachment}
}
globalThis.WebSocketPair=class{constructor(){const c=new Socket(),s=new Socket();c.peer=s;s.peer=c;this[0]=c;this[1]=s}}
class Storage{constructor(){this.data=new Map()}async get(k){return this.data.get(k)}async put(k,v){this.data.set(k,v)}async delete(k){this.data.delete(k)}}
const rooms=new Map(),env={ALLOWED_ORIGINS:'https://ssunkem.github.io',ROOMS:{idFromName(name){return name},get(name){
 if(!rooms.has(name)){const ctx={storage:new Storage(),list:[],acceptWebSocket(ws){this.list.push(ws)},getWebSockets(){return this.list.filter(x=>x.readyState===1)}};const obj=new SlasherRoom(ctx,env);rooms.set(name,{obj,ctx})}
 const {obj}=rooms.get(name);return {fetch:(url,opts)=>obj.fetch(typeof url==='string'?new Request(url,opts):url)}
}}};
const request=(path,opts={})=>worker.fetch(new Request('https://signal.example'+path,{...opts,headers:{Origin:'https://ssunkem.github.io',...(opts.headers||{})}}),env);
const created=await request('/v1/rooms',{method:'POST'});assert.equal(created.status,201);
const {code,hostToken}=await created.json();assert.match(code,/^[A-HJ-NP-Z2-9]{9}$/);assert(hostToken.length>60);
const host=await request(`/v1/rooms/${code}/ws?role=host&token=${hostToken}`,{headers:{Upgrade:'websocket'}});assert.equal(host.status,101);
const guest=await request(`/v1/rooms/${code}/ws?role=guest`,{headers:{Upgrade:'websocket'}});assert.equal(guest.status,101);
const room=rooms.get('room:'+code);
const hostServer=room.ctx.list[0],guestServer=room.ctx.list[1];
assert(guestServer.deserializeAttachment().auth);
assert(host.webSocket.sent.some(m=>m.type==='peer-joined'));
const guestId=guestServer.deserializeAttachment().peerId;
room.obj.webSocketMessage(hostServer,JSON.stringify({type:'offer',to:guestId,description:{type:'offer',sdp:'v=0\\n'}}));
assert(guest.webSocket.sent.some(m=>m.type==='offer'));
room.obj.webSocketMessage(guestServer,JSON.stringify({type:'answer',description:{type:'answer',sdp:'v=0\\n'}}));
assert(host.webSocket.sent.some(m=>m.type==='answer'));
room.obj.webSocketMessage(guestServer,JSON.stringify({type:'candidate',candidate:{candidate:'candidate:0 1 UDP 1 127.0.0.1 123 typ host'}}));
assert(host.webSocket.sent.some(m=>m.type==='candidate'));
const creds=await request(`/v1/rooms/${code}/ice`,{method:'POST',headers:{Authorization:'Bearer '+guestServer.deserializeAttachment().auth}});
assert.equal((await creds.json()).turn,false);
assert.equal((await request(`/v1/rooms/${code}/ice`,{method:'POST'})).status,401);
assert.equal((await worker.fetch(new Request('https://signal.example/v1/rooms',{method:'POST',headers:{Origin:'https://attacker.example'}}),env)).status,403);
const duplicate=await request(`/v1/rooms/${code}/ws?role=host&token=${hostToken}`,{headers:{Upgrade:'websocket'}});assert.equal(duplicate.status,409);
console.log('PASS: Cloudflare Worker creates short code, authenticates host, forwards ICE/SDP, protects TURN endpoint and origin');