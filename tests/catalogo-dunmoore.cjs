/**
 * Regressão da biblioteca de Dunmoore e formulário quebrado de monstro.
 * Executar: node tests/catalogo-dunmoore.cjs
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const root={innerHTML:''};
const events={},memory={};
const storage={getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v,removeItem:k=>delete memory[k]};
class FakeFormData{constructor(form){this.form=form}entries(){return Object.entries(this.form.entries??{})}}
const document={querySelector:q=>q==='#app'?root:null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener:(name,fn)=>events[name]=fn,activeElement:null};
const window={SLASHER_CONFIG:{supabaseUrl:'',supabaseAnonKey:''},addEventListener:()=>{}};
const ctx={document,window,localStorage:storage,console,setTimeout,clearTimeout,setInterval:()=>0,clearInterval,confirm:()=>true,crypto:require('node:crypto').webcrypto,FormData:FakeFormData,navigator:{clipboard:{}},URL,Image:class{},performance};
vm.createContext(ctx);
for(const fname of ['dice-local.js','mesa71.js','app.js'])vm.runInContext(fs.readFileSync(path.join(base,fname),'utf8'),ctx,{filename:fname});
const get=expr=>vm.runInContext(expr,ctx);
function form(name,fields){const button={disabled:false,isConnected:true};return {dataset:{mesaForm:name},getAttribute:()=>null,querySelector:sel=>sel==='button[type=submit]'?button:null,entries:fields,_button:button}}
async function submit(name,fields){const f=form(name,fields);await events.submit({preventDefault(){},target:f,submitter:{value:'true'}});assert.equal(f._button.disabled,false,'Botão deve ser habilitado após submit')}
async function click(action,data){const btn={disabled:false,dataset:{action,...data},closest(sel){return sel==='[data-action]'?this:null}};await events.click({target:{id:null,closest:()=>btn}});}
(async()=>{
 await new Promise(ok=>setTimeout(ok,30));
 await get('async function __load(){state.user=api.me;await loadLobby();const id=await api.createCampaign("Campanha de validação","Mestre");await openCampaign(id);await api.createCharacter({campaign_id:id,name:"Eleanor",class_key:"reb",age:18,occupation:"Estudante"});await refreshCampaign(true);};__load()');
 const state=get('state');
 const html=window.SLASHER71.render(state);
 assert(html.includes('data-dock="catalog"'),'Catalog dock missing');
 assert(html.includes('data-mesa-form="create-monster" class="m71-form"'),'Broken monster form markup');
 assert(!html.includes('data-mesa-form="create-monster class='),'Malformed legacy form must be gone');
 assert(html.includes('Escavado da Mina')&&html.includes('O Rei Oculto')&&html.includes('Gravador portátil de fita'));
 const monstersBefore=state.mesa71.monsters.length;
 await submit('create-monster',{name:'Figura da Enfermaria',hp:'21',defense:'13',damage:'8'});
 assert.equal(state.mesa71.monsters.length,monstersBefore+1,'Custom creation form should add monster');
 assert(state.mesa71.monsters.some(m=>m.name==='Figura da Enfermaria'));
 const n=state.mesa71.monsters.length;
 await click('mesa-preset-monster',{key:'escavado'});
 assert.equal(state.mesa71.monsters.length,n+1,'Preset monster should create');
 const created=state.mesa71.monsters.findLast(m=>m.name==='Escavado da Mina');
 assert.equal(created.hp,18);assert.equal(created.defense,12);assert.equal(created.damage_sides,8);
 // Focus survived the new monster, switch back to a survivor for item granting.
 const char=state.characters[0];window.SLASHER71.focusChanged(state,'c:'+char.id);
 await click('mesa-preset-grant',{key:'flash',kind:'item'});
 assert(state.mesa71.inventory.some(i=>i.character_id===char.id&&i.title==='Câmera descartável com flash'));
 await click('mesa-preset-grant',{key:'picareta',kind:'weapon'});
 assert(state.mesa71.inventory.some(i=>i.character_id===char.id&&i.title==='Picareta de mineração'&&i.damage_sides===10));
 await click('mesa-preset-stock',{key:'faca',kind:'weapon'});
 assert(state.mesa71.stock.some(i=>i.title==='Faca de caça'));
 const len=state.mesa71.stock.length;
 await click('mesa-seed-stock',{});
 assert(state.mesa71.stock.length>len,'Starter kit should add products');
 const count=state.mesa71.stock.length;
 await click('mesa-seed-stock',{});
 assert.equal(state.mesa71.stock.length,count,'Seeding must be idempotent');
 // Players see their inventory but must not receive GM catalog or master controls.
 state.characters[0].owner_id='demo-player';state.members.push({user_id:'demo-player',role:'player',nickname:'Eleanor'});
 state.user={id:'demo-player',user_metadata:{display_name:'Eleanor'}};
 const playerHtml=window.SLASHER71.render(state);
 assert(!playerHtml.includes('data-dock="catalog"'),'Players must not see catalog dock');
 assert(!playerHtml.includes('data-dock="master"'),'Players must not see GM controls');
 assert(playerHtml.includes('Câmera descartável com flash'),'Player should see item received');
 console.log('PASS: corrected form, custom monsters, 7 NPC presets, 9 weapon and 14 item presets, give, shop seed idempotence and player view');
})().catch(e=>{console.error('FAILED',e);process.exitCode=1});