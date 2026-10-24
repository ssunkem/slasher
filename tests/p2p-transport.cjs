const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../p2p.js'),'utf8');
const pairs=new Map();let serial=0;
class FakeChannel{
 constructor(){this.readyState='connecting';this.onmessage=null;this.onopen=null;this.onclose=null;this.peer=null;}
 send(data){assert.equal(this.readyState,'open');queueMicrotask(()=>this.peer?.onmessage?.({data}))}
 close(){if(this.readyState==='closed')return;this.readyState='closed';this.onclose?.();this.peer?.close()}
}
class FakeRTCPeerConnection{
 constructor(){this.iceGatheringState='complete';this.ondatachannel=null;this.localDescription=null;this.remoteDescription=null;}
 createDataChannel(){this.dc=new FakeChannel();return this.dc}
 async createOffer(){this.id='test'+(++serial);pairs.set(this.id,{host:this});return {type:'offer',sdp:'v=0\na=offer:'+this.id}}
 async createAnswer(){return {type:'answer',sdp:'v=0\na=answer:'+this.id}}
 async setLocalDescription(obj){this.localDescription=obj}
 async setRemoteDescription(obj){this.remoteDescription=obj;const id=obj.sdp.split(':')[1];this.id=id;const r=pairs.get(id);if(obj.type==='offer'){r.guest=this;this.host=r.host;}else{
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
 const offer=await host.hostOffer();const answer=await guest.joinOffer(offer,'Eleanor');await host.acceptAnswer(answer);
 await new Promise(resolve=>setTimeout(resolve,30));
 assert(joined&&received&&received.snapshot,'welcome+snapshot via fake WebRTC');
 assert.equal(received.snapshot.gmNote,null);
 assert.equal(joined.nick,'Eleanor');
 const reply=await guest.call('roll',[{kind:'test',modifier:2}]);assert.equal(reply.method,'roll');assert.equal(reply.user,joined.id);
 await assert.rejects(guest.call('removeGMNotes',[]),/não autorizada/);
 host.close();await new Promise(resolve=>setTimeout(resolve,5));assert.equal(disconnect,1);
 console.log('PASS: oferta/resposta, sincronização, RPC, recusa de método, encerramento');
})().catch(e=>{console.error(e);process.exitCode=1});