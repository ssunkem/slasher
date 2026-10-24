/**
 * Regressão do fluxo real: o app.js intercepta o submit do navegador
 * e repassa os formulários sem id para SLASHER71.submit.
 * Uso: node tests/formularios-mesa71.cjs
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root={innerHTML:''};
const memory={};
const events={};
const storage={getItem:k=>Object.hasOwn(memory,k)?memory[k]:null,setItem:(k,v)=>memory[k]=v,removeItem:k=>delete memory[k]};
class FakeFormData {constructor(form){this.form=form} entries(){return Object.entries(this.form.entries??{})}}
const document={querySelector:q=>q==='#app'?root:null,querySelectorAll:()=>[],getElementById:()=>null,addEventListener:(event,cb)=>{events[event]=cb},activeElement:null};
const window={SLASHER_CONFIG:{supabaseUrl:'',supabaseAnonKey:''},addEventListener:()=>{}};
const context={document,window,localStorage:storage,console,setTimeout,clearTimeout,setInterval:()=>0,clearInterval,confirm:()=>true,crypto:require('node:crypto').webcrypto,FormData:FakeFormData,navigator:{clipboard:{}},URL,Image:class{},performance};
vm.createContext(context);
const base=path.resolve(__dirname,'..');
for(const fname of ['dice-local.js','mesa71.js','app.js'])vm.runInContext(fs.readFileSync(path.join(base,fname),'utf8'),context,{filename:fname});
const get=(expr)=>vm.runInContext(expr,context);
function newForm(formName,entries){
 const button={disabled:false,isConnected:true};
 return {dataset:{mesaForm:formName},getAttribute:()=>null,querySelector:(sel)=>sel==='button[type=submit]'?button:null,entries,_button:button};
}
async function submit(form,buttonValue){let prevented=false;await events.submit({preventDefault(){prevented=true},target:form,submitter:buttonValue==null?null:{value:buttonValue}});assert.equal(prevented,true,'The app must handle submit');assert.equal(form._button.disabled,false,'Submission button must be released');}
(async()=>{
 await new Promise(resolve=>setTimeout(resolve,30));
 await get('async function __openDemo(){state.user=api.me;await loadLobby();const id=await api.createCampaign("Campanha de validação","Mestre");await openCampaign(id);await api.createCharacter({campaign_id:id,name:"Eleanor",class_key:"reb",age:18,occupation:"Estudante"});await refreshCampaign(true);};__openDemo()');
 assert(root.innerHTML.includes('Mesa Atual'));
 // Must fail on the 7.1 original code, which returned early for forms without id.
 await submit(newForm('grant-item',{title:'Revólver enferrujado',kind:'weapon',damage:'8',details:'Teste de entrega'}));
 let inventory=get('state.mesa71.inventory');
 assert(inventory.some(x=>x.title==='Revólver enferrujado'&&x.kind==='weapon'),'The gift must appear in new inventory');
 assert(root.innerHTML.includes('Revólver enferrujado'),'The inventory item must be rendered');
 await submit(newForm('shop-settings',{name:'Mercado 24 horas'}),'false');
 assert.equal(get('state.mesa71.shop.is_open'),false,'Closing shop must persist');
 await submit(newForm('shop-settings',{name:'Mercado 24 horas'}),'true');
 assert.equal(get('state.mesa71.shop.is_open'),true,'Opening shop must persist');
 await submit(newForm('stock',{title:'Munição caseira',kind:'item',damage:'0',price:'25',stock:'4',details:'Pacote'}));
 assert(get('state.mesa71.stock').some(x=>x.title==='Munição caseira'),'Shop product must be inserted');
 // Switch to player. Store dock must appear, and GM-only panel disappear.
 const state=get('state');
 state.characters[0].owner_id='demo-player';state.members.push({user_id:'demo-player',role:'player',nickname:'Eleanor'});
 state.user={id:'demo-player',user_metadata:{display_name:'Eleanor'}};
 const html=window.SLASHER71.render(state);
 assert(html.includes('data-dock="shop"'),'Players should see the open shop');
 assert(html.includes('Munição caseira'),'Players should see shop products');
 assert(!html.includes('data-dock="master"'),'Players should not get GM controls');
 console.log('PASS: actual submit event path, GM inventory grant, shop close/open, product registration, player shop view');
})().catch(e=>{console.error('FAILED:',e);process.exitCode=1});