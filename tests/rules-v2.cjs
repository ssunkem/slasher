/* Testes reproduzíveis do núcleo percentil, da ficha e da integração visual SLASHER 2.0 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=require('../rules-engine.js');
const here=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const C={
 name:'Elisa Moreau',age:19,occupation:'Técnica de rádio',history:'artista',
 attrs:{FOR:35,AGI:55,PER:65,RAC:50,PRE:45,FIR:40},
 skills:{Expressão:15,Empatia:15,Tecnologia:15,Observação:25,Furtividade:15},
 bonds:['Irmã','Colega','Professor'],inventory:[{name:'Gravador',slots:1,damageBase:0},{name:'Faca curta',slots:1,damageBase:2}]
};
assert.equal(R.HISTORIES.length,12);
assert.equal(R.SKILLS.length,19);
const c=R.newCharacter(C);
assert.equal(c.schemaVersion,2);
assert.equal(c.vitality,6);assert.equal(c.stamina,5);assert.equal(c.tension,0);
assert.equal(c.preparations,2);assert.equal(R.inventorySpaces(c.inventory),2);
assert.equal(R.validateCharacter(c).length,0);
assert.throws(()=>R.newCharacter({...C,attrs:{...C.attrs,FOR:65}}),/35, 40/);
assert.throws(()=>R.newCharacter({...C,inventory:[{name:'kit',slots:3},{name:'corda',slots:3},{name:'arma',slots:1}]}),/seis Espaços/);
assert.equal(R.calculateTest({attribute:55,training:15,circumstance:10,natural:80}).success,true);
assert.equal(R.calculateTest({attribute:55,training:15,circumstance:10,natural:81}).success,false);
assert.equal(R.calculateTest({attribute:55,training:15,circumstance:10,difficulty:'dificil',natural:40}).success,true);
assert.equal(R.calculateTest({attribute:55,training:15,circumstance:10,difficulty:'extremo',natural:17}).success,false);
assert.equal(R.calculateTest({attribute:90,training:25,circumstance:20,natural:100}).special,'reves');
assert.equal(R.calculateTest({attribute:35,training:0,circumstance:0,natural:1}).special,'virada');
assert.equal(R.calculateTest({attribute:35,training:0,circumstance:0,natural:2}).grade,'extraordinario');
const roll=R.rollForCharacter(c,{attribute:'PER',skill:'Observação',circumstance:10,difficulty:'dificil'},35);
assert.equal(roll.target,90);assert.equal(roll.limit,45);assert.equal(roll.grade,'forte');
assert.equal(R.fixedDamage(2,'forte'),3);assert.equal(R.fixedDamage(2,'extraordinario'),4);
const hurt=R.applyDamage(c,3,'Sangramento');assert.equal(hurt.vitality,3);assert.equal(hurt.wounds.length,1);
assert.equal(c.vitality,6);
const chase=R.chaseStep({round:1,distance:2,speed:'rapido',status:'ativa'},roll,{sprint:true});
assert.equal(chase.round,2);assert.equal(chase.distance,3);
const win={SLASHER_RULES:R};vm.runInNewContext(here('slasher-v2.js'),{window:win});
const form={
 name:'Elisa',age:'19',occupation:'Técnica de rádio',concept:'investigadora',traits:'risonha e cautelosa',concern:'fitas',
 history:'artista',contact:'operador',attr_FOR:'35',attr_AGI:'55',attr_PER:'65',attr_RAC:'50',attr_PRE:'45',attr_FIR:'40',
 extra_0:'Tecnologia',extra_1:'Observação',extra_2:'Furtividade',specialization:'Observação',
 bond_0:'Irmã',bond_1:'Colega',bond_2:'Professor',home:'casa',responsibility:'trabalho',
 meaningfulItem:'fita',inventory:'Gravador | 1 | 0\nFaca curta | 1 | 2',notes:'pista'
};
const parsed=win.SLASHER_V2.parseCharacterForm(form);
assert.equal(parsed.skills['Observação'],25);assert.equal(parsed.inventory[1].damageBase,2);
assert(win.SLASHER_V2.characterForm().includes('attr_FOR'));
assert(win.SLASHER_V2.sheet({},parsed,true).includes('VITALIDADE'));
const markup=here('index.html');
for(const script of ['rules-engine.js','slasher-v2.js','investigation.js','mesa-v2.js'])assert(markup.includes(script));
assert(!markup.includes('src="dice-local.js'));
console.log('PASS: regras D100, criação, inventário, ferimentos, caçada, UI e scripts 2.0');
