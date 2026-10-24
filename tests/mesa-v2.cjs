/* Integração autoritativa do narrador, cena, caçada e arquivo de pistas */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
globalThis.crypto=crypto;
const R=require('../rules-engine.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const win={SLASHER_RULES:R};
const records=new Map(),storage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)};
const ctx={window:win,localStorage:storage,crypto,console,Uint32Array};
vm.runInNewContext(read('mesa-v2.js'),ctx);
vm.runInNewContext(read('investigation.js'),ctx);
const c=R.newCharacter({name:'Elisa',age:19,occupation:'rádio',history:'artista',
 attrs:{FOR:35,AGI:55,PER:65,RAC:50,PRE:45,FIR:40},
 skills:{Expressão:15,Empatia:15,Tecnologia:15,Observação:25,Furtividade:15},
 bonds:['Irmã','Colega','Professor'],inventory:[{name:'Faca',slots:1,damageBase:2}]});
Object.assign(c,{id:'c1',campaign_id:'camp',owner_id:'player'});
const s={campaignId:'camp',mode:'p2p-host',user:{id:'gm'},members:[{user_id:'gm',role:'gm'},{user_id:'player',role:'player'}],characters:[c],selected:'c1',campaign:{name:'Dunmoor'}};
win.SLASHER71.load(s);
const t=win.SLASHER71.remote(s,'v2-threat',{name:'Vigia humano',type:'humano',damageBase:2,dodge:0},'gm');
const anomaly=win.SLASHER71.remote(s,'v2-threat',{name:'O Chamador',type:'anomalia',sign:'três toques'},'gm');
assert.equal(anomaly.vitality,null);
assert.throws(()=>win.SLASHER71.remote(s,'v2-threat',{name:'fraude',type:'humano'},'player'),/exclusiva/);
win.SLASHER71.remote(s,'v2-toggle',{},'gm');
assert.throws(()=>win.SLASHER71.remote(s,'v2-attack',{actor:'c1',target:anomaly.id,attribute:'FOR',itemIndex:-1},'player'),/anomalias/);
assert.throws(()=>win.SLASHER71.remote(s,'v2-attack',{actor:'c1',target:t.id,attribute:'PER',itemIndex:-1},'player'),/Armas de Fogo/);
const attack=win.SLASHER71.remote(s,'v2-attack',{actor:'c1',target:t.id,attribute:'FOR',itemIndex:0,circumstance:0},'player');
assert(attack.attack.natural>=1&&attack.attack.natural<=100);
assert(s.mesa71.events.length===1);
win.SLASHER71.remote(s,'v2-start-chase',{distance:2,speed:'equivalente',exit:'píer'},'gm');
const before=c.stamina;
const move=win.SLASHER71.remote(s,'v2-chase',{actor:'c1',skill:'Atletismo',maneuver:'sprint',circumstance:0},'player');
assert(move.roll.natural>=1&&move.roll.natural<=100);
assert.equal(c.stamina,before-1);
assert(move.chase.distance>=0&&move.chase.distance<=4);
assert(records.has('slasher2_table_camp'));
win.SLASHER_INVESTIGATION.load(s);
assert.equal(s.investigation.title,'Caso sem título');
s.investigation.evidence.push({id:'e1',title:'Ata alterada',location:'Arquivo'});
assert(win.SLASHER_INVESTIGATION.render(s,true).includes('Ata alterada'));
assert(!win.SLASHER_INVESTIGATION.render(s,false).includes('v2-secret-note'));
console.log('PASS: mestre autoritativo, ameaça sem HP, arma, caçada, eventos e pistas');
