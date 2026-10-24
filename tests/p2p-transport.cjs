const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../p2p.js'),'utf8');
const pairs=new Map();let serial=0;
class FakeChannel{
 constructor(){this.readyState='connecting';this.onmessage=null;this.onopen=null;this.onclose=null;this.peer=null;}
 send(data){assert.equal(this.readyState,'open');queueMicrotask(()=>this.peer?.onmessage?.({data}))}
 close(){if(this.readyState==='closed')return;this.readyState='closed';this.onclose?.();this.peer?.close()}
}
class FakeRTCPeerConnection{
 constructor(){this.iceGatheringState='complete';this.ondatachannel=null;this.localDescription=null;this.remoteDescription=null;this.connectionState='new';this.iceConnectionState='new';this.listeners={};} addEventListener(type,cb){(this.listeners[type]??=[]).push(cb)} removeEventListener(type,cb){this.listeners[type]=(this.listeners[type]||[]).filter(f=>f!==cb)} emit(type){for(const f of this.listeners[type]||[])f()}
 createDataChannel(){this.dc=new FakeChannel();return this.dc}
 async createOffer(){this.id='test'+(++serial);pairs.set(this.id,{host:this});return {type:'offer',sdp:'v=0\na=offer:'+this.id+'\na=candidate:1 1 udp 2122260223 192.168.1.10 4444 typ host'}}
 async createAnswer(){return {type:'answer',sdp:'v=0\na=answer:'+this.id+'\na=candidate:1 1 udp 2122260223 192.168.1.11 5555 typ host'}}
 async setLocalDescription(obj){this.localDescription=obj}
 async setRemoteDescription(obj){this.remoteDescription=obj;const id=obj.sdp.split('\n')[1].split(':')[1];this.id=id;const r=pairs.get(id);if(obj.type==='offer'){r.guest=this;this.host=r.host;}else{
  assert(r.guest&&r.host===this);const h=r.host.dc,g=new FakeChannel();h.peer=g;g.peer=h;r.guest.ondatachannel?.({channel:g});h.readyState='open';g.readyState='open';queueMicrotask(()=>g.onopen?.());
 }}
 close(){this.dc?.close()}
}
function createContext(){const sandbox={window:{RTCPeerConnection:FakeRTCPeerConnection},RTCPeerConnection:FakeRTCPeerConnection,crypto:crypto.webcrypto,Uint8Array,TextEncoder,TextDecoder,Array,Map,Promise,Number,String,JSON,setTimeout,clearTimeout,queueMicrotask,console,btoa,atob};vm.createContext(sandbox);vm.runInContext(source,sandbox);return sandbox.window.SLASHER_P2P}
(async()=>{
 const host=createContext(),guest=createContext();let joined,received,disconnect=0;
 host.on('hello',p=>{joined=p;host.snapshot({campaign:{id:'demo'},gmNote:null,characters:[]})});
 host.on('request',(who,method,args)=>{assert.equal(who.id,joined.id);if(method==='removeGMNotes')throw Error('Ação não autorizada');return {method,args,user:who.id}});
 guest.on('welcome',message=>{assert.equal(message.nick,'Eleanor');received={...message}});
 guest.on('snapshot',snapshot=>{received.snapshot=snapshot});
 guest.on('disconnected',()=>disconnect++);
 const offer=await host.hostOffer();const answer=await guest.joinOffer(offer,'Eleanor');
 // ICE pode falhar enquanto o usuário ainda está copiando a resposta.
 // Isso não pode ser reportado como falha definitiva antes de o mestre aceitar.
 const connection=pairs.get([...pairs.keys()][0]);
 connection.guest.iceConnectionState='failed';connection.guest.connectionState='failed';
 connection.guest.emit('iceconnectionstatechange');
 assert.equal(guest.diagnostics().phase,'waiting','ICE failed prematuro não deve abortar o convite manual');
 connection.host.iceConnectionState='failed';connection.host.connectionState='failed';
 connection.host.emit('iceconnectionstatechange');
 assert.equal(host.diagnostics().phase,'waiting','O convite não expira antes de aceitar a resposta');
 await host.acceptAnswer(answer);
 await new Promise(resolve=>setTimeout(resolve,30));
 assert(joined&&received&&received.snapshot,'welcome+snapshot via fake WebRTC');
 assert.equal(received.snapshot.gmNote,null);
 assert.equal(joined.nick,'Eleanor');
 assert(host.diagnostics().candidateCount>=1,'ICE candidates recorded');
 assert.match(host.diagnostics().localRoutes,/host:1/,'candidate type is exposed without IP');
 assert.match(host.diagnostics().remoteRoutes,/host:1/,'remote candidate type is exposed');
 assert.equal(typeof host.diagnostics().channel,'string','real DataChannel state is reported');
 assert.equal(host.diagnostics().hostPeers,1);
 const reply=await guest.call('roll',[{kind:'test',modifier:2}]);assert.equal(reply.method,'roll');assert.equal(reply.user,joined.id);
 await assert.rejects(guest.call('removeGMNotes',[]),/não autorizada/);
 host.close();await new Promise(resolve=>setTimeout(resolve,5));assert.equal(disconnect,1);
 console.log('PASS: oferta/resposta, sincronização, RPC, recusa de método, encerramento');
})().catch(e=>{console.error(e);process.exitCode=1});