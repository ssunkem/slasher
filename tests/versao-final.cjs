const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const base=path.join(__dirname,'..');
function appFixture(initial={}){
 const memory={...initial}, events={}; const localStorage={getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=String(v),removeItem:k=>delete memory[k]};
 const root={innerHTML:''};const document={querySelector:q=>q==='#app'?root:null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener:(n,cb)=>events[n]=cb,activeElement:null};
 const window={addEventListener:()=>{}};
 const context={window,document,localStorage,console,setTimeout,clearTimeout,setInterval:()=>0,clearInterval,crypto:require('node:crypto').webcrypto,confirm:()=>true,navigator:{clipboard:{}},URL,Image:class{},performance};
 vm.createContext(context);
 for(const f of ['dice-local.js','mesa71.js','app.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),context,{filename:f});
 return {context,root,memory,get:x=>vm.runInContext(x,context)};
}
(async()=>{
 let f=appFixture();await new Promise(ok=>setTimeout(ok,15));
 assert.equal(f.get('api.data.campaigns.length'),0,'New installs should contain no fabricated campaigns');
 assert.equal(f.get('api.data.characters.length'),0,'New installs should contain no fabricated players');
 await f.get('(async()=>{state.user=api.me;await loadLobby();const id=await api.createCampaign("Meu arquivo","Mestre");await openCampaign(id);})()');
 assert.equal(f.get('state.campaign.name'),'Meu arquivo','New campaign must be accessible');
 assert.equal(f.get('state.mesa71.monsters.length'),0,'New campaign must not seed creatures');
 assert.equal(f.get('state.mesa71.inventory.length'),0,'New campaign must not seed equipment');
 assert.equal(f.get('state.mesa71.stock.length'),0,'New campaign must not seed the shop');
 assert.equal(f.get('state.mesa71.encounter.active'),false,'New campaign should not start combat');
 assert.equal(f.get('state.mesa71.shop.is_open'),false,'New campaign shop should start closed');
 assert(f.root.innerHTML.includes('Meu arquivo'));
 const prior={campaigns:[{id:'dunmoore-1999',name:'Dunmoore: Ecos da Montanha',invite_code:'DEMO-777'},{id:'my-real-camp',name:'Campanha preservada',invite_code:'REALABC'}],members:[{campaign_id:'dunmoore-1999',user_id:'demo-gm',role:'gm',nickname:'Mestre'},{campaign_id:'my-real-camp',user_id:'demo-gm',role:'gm',nickname:'Mestre'}],characters:[],effects:[],rolls:[],audit:[],notes:{}};
 f=appFixture({'slasher7-demo-v1':JSON.stringify(prior)});await new Promise(ok=>setTimeout(ok,15));
 await f.get('(async()=>{state.user=api.me;await loadLobby();})()');
 assert.equal(f.get('state.campaigns.length'),1,'Legacy starter must not appear in release campaign list');
 assert.equal(f.get('state.campaigns[0].campaign.name'),'Campanha preservada');
 assert.equal(f.get('api.data.campaigns.length'),2,'Legacy records must not be destroyed');
 assert(f.root.innerHTML.includes('Campanha preservada'));
 assert(!f.root.innerHTML.includes('DEMO-777'));
 console.log('PASS: clean 1.0 install, blank campaign, disabled sample, real legacy saves retained');
})().catch(e=>{console.error(e);process.exitCode=1});