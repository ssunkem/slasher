const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dataMap=new Map();
const localStorage={getItem:k=>dataMap.get(k)||null,setItem:(k,v)=>dataMap.set(k,v),removeItem:k=>dataMap.delete(k)};
class FakeFormData {constructor(form){return {entries(){return Object.entries(form.entries||{})}}}}
const ctx={window:{},document:{getElementById:()=>null},localStorage,FormData:FakeFormData,crypto:require('crypto').webcrypto,console,confirm:()=>true};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../dice-local.js','utf8'),ctx);vm.runInContext(fs.readFileSync(__dirname+'/../mesa71.js','utf8'),ctx);
const app=ctx.window.SLASHER71;
const char=(id,name,owner)=>({id,name,owner_id:owner,class_key:'reb',occupation:'estudante',hp:16,hp_max:16,stamina:16,stamina_max:16,stress:12,credits:80,portrait:'',attrs:{REF:3,EDF:2},notes:''});
const state={mode:'local',user:{id:'demo-gm'},campaignId:'dunmoore',campaign:{id:'dunmoore'},members:[{user_id:'demo-gm',role:'gm'},{user_id:'demo-player',role:'player'}],characters:[char('e1','Elizabeth','demo-player'),char('e2','Theodore','demo-gm')],effects:[],gmPreview:false};
const api={save(){this.saved=true},roll:async p=>({natural:16,total:16+p.modifier,modifier:p.modifier})};
let rendered=''; const ctx2={state,api,refreshCampaign:async()=>{throw Error('Unexpected remote refresh')},render:()=>{rendered=app.render(state)},toast:x=>{}};
const form=(name,entries)=>({dataset:{mesaForm:name},entries});
(async()=>{
 await app.load(state,api);
 assert.equal(state.mesa71.monsters.length,0);
 let h=app.render(state);
 assert(h.includes('Mesa Atual')&&h.includes('Inventário'));
 await app.submit(form('create-monster',{name:'Escavado da Mina',hp:'20',defense:'12',damage:'8'}),ctx2);
 // Create another monster via GM form.
 await app.submit(form('create-monster',{name:'A Sombra',hp:'24',defense:'14',damage:'8'}),ctx2);
 assert.equal(state.mesa71.monsters.length,2);
 // Change focus back to a survivor after monster creation.
 app.focusChanged(state,'c:e1');
 // Test stock, shop open, money, buy and inventory creation.
 await app.submit(form('stock',{title:'Faca longa',kind:'weapon',damage:'8',price:'27',stock:'2',details:'Testada'}),ctx2);
 const stock=state.mesa71.stock.find(x=>x.title==='Faca longa'); assert(stock);
 await app.submit(form('shop-settings',{name:'Loja do Cais'}),ctx2,{value:'true'});
 const credits=state.characters[0].credits;
 await app.action('mesa-buy',{dataset:{item:stock.id,character:'e1'}},ctx2);
 assert.equal(state.mesa71.inventory.filter(i=>i.character_id==='e1'&&i.title==='Faca longa').length,1);
 assert.equal(state.characters[0].credits,credits-27);
 assert.equal(stock.stock,1);
 // Equip actual weapon. Attack until hit; server simulation validates target and weapon.
 const weapon=state.mesa71.inventory.find(i=>i.title==='Faca longa');
 await app.action('mesa-equip',{dataset:{item:weapon.id,character:'e1'}},ctx2);
 await app.submit(form('attack',{target:state.mesa71.monsters[0].id,weapon:weapon.id}),ctx2);
 assert.equal(state.mesa71.events.length,1);
 assert.equal(state.mesa71.events[0].weapon_name,'Faca longa');
 assert.equal(state.mesa71.events[0].actor_name,'Elizabeth');
 assert(state.mesa71.events[0].hp_before>=state.mesa71.events[0].hp_after);
 h=app.render(state);assert(h.includes('Registro de combate')&&h.includes('D20')&&h.includes('Elizabeth'));
 // Attack by monster as GM and update player's HP.
 await app.submit(form('monster-attack',{monster:state.mesa71.monsters[0].id,target:'e1'}),ctx2);
 assert.equal(state.mesa71.events.length,2);
 assert.equal(state.mesa71.events[0].target_name,'Elizabeth');
 // Close and reopen store; re-entrant demo persistence.
 await app.submit(form('shop-settings',{name:'Loja do Cais'}),ctx2,{value:'false'});
 assert.equal(state.mesa71.shop.is_open,false);
 await app.load(state,api);assert.equal(state.mesa71.shop.is_open,false);
 // Player view must not leak GM dock.
 state.user={id:'demo-player'};
 h=app.render(state);
 assert(!h.includes('data-dock="master"'));
 assert(!h.includes('data-dock="shop"'));
 // No player access to master action.
 let blocked=false;
 try{await app.submit(form('create-monster',{name:'Intruso',hp:'10',defense:'12',damage:'6'}),ctx2)}catch(e){blocked=true}
 assert(blocked);
 console.log('PASS: dashboard, docks, new monster, shop stock, purchase, real weapon, attack, log, GM permissions, persistence');
})().catch(e=>{console.error(e);process.exit(1)});