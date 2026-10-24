/* SLASHER · Livro Básico, Edição de Teste I · núcleo determinístico */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SLASHER_RULES=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=2;
const ATTRIBUTES={FOR:'Força',AGI:'Agilidade',PER:'Percepção',RAC:'Raciocínio',PRE:'Presença',FIR:'Firmeza'};
const ATTRIBUTE_VALUES=[65,55,50,45,40,35];
const SKILLS=['Atletismo','Luta','Reflexos','Furtividade','Condução','Mecânica','Tecnologia','Pesquisa','Observação','Vigilância','Rastreamento','Sobrevivência','Medicina','Empatia','Persuasão','Burocracia','Expressão','Conhecimento Oculto','Armas de Fogo'];
const HISTORIES=[
{id:'estudante',name:'Estudante atento',skills:['Pesquisa','Observação'],contact:'Colega, funcionário escolar'},
{id:'oficina',name:'Trabalhador de oficina',skills:['Mecânica','Atletismo'],contact:'Técnico, fornecedor'},
{id:'artista',name:'Artista independente',skills:['Expressão','Empatia'],contact:'Produtor, coletivo cultural'},
{id:'saude',name:'Profissional de saúde',skills:['Medicina','Empatia'],contact:'Enfermagem, clínica'},
{id:'jornalista',name:'Jornalista local',skills:['Pesquisa','Persuasão'],contact:'Redação, radialista'},
{id:'seguranca',name:'Ex-segurança',skills:['Vigilância','Luta'],contact:'Porteiro, vigilante'},
{id:'condutor',name:'Condutor',skills:['Condução','Reflexos'],contact:'Motorista, transportadora'},
{id:'publico',name:'Funcionário público',skills:['Burocracia','Pesquisa'],contact:'Prefeitura, cartório'},
{id:'esportista',name:'Esportista',skills:['Atletismo','Reflexos'],contact:'Técnico, clube'},
{id:'interior',name:'Pessoa do interior',skills:['Sobrevivência','Rastreamento'],contact:'Fazendeiro, guarda-florestal'},
{id:'informatica',name:'Técnico de informática',skills:['Tecnologia','Pesquisa'],contact:'TI, reparador'},
{id:'ativista',name:'Ativista comunitário',skills:['Persuasão','Empatia'],contact:'Associação, voluntários'}
];
const DAMAGE={soco:1,objeto:2,lamina:2,pesada:3,arma_curta:3,arma_longa:4};
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,Number(v)||0));
const pickHistory=id=>HISTORIES.find(h=>h.id===id);
const skillsOf=c=>Object.keys(c?.skills||{}).filter(k=>c.skills[k]===15||c.skills[k]===25);
function validateCharacter(c){
 const errors=[];
 if(!c||typeof c!=='object')return ['Ficha ausente'];
 if(!String(c.name||'').trim()||String(c.name).length>90)errors.push('Nome inválido');if(!Number.isInteger(Number(c.age))||Number(c.age)<10||Number(c.age)>100)errors.push('Idade deve ficar entre 10 e 100');
 const vals=Object.keys(ATTRIBUTES).map(k=>Number(c.attrs?.[k])).sort((a,b)=>a-b);
 if(JSON.stringify(vals)!==JSON.stringify([...ATTRIBUTE_VALUES].sort((a,b)=>a-b)))errors.push('Distribua 35, 40, 45, 50, 55 e 65 exatamente uma vez');
 const history=pickHistory(c.history);
 if(!history)errors.push('Histórico inválido');
 const tr=skillsOf(c);
 if(tr.length!==5)errors.push('Escolha cinco competências, incluindo as duas do histórico');
 if(history&&!history.skills.every(k=>tr.includes(k)))errors.push('As duas competências do histórico são obrigatórias');
 if(tr.filter(k=>c.skills[k]===25).length!==1)errors.push('Especialize exatamente uma das cinco competências');
 if(tr.some(k=>!SKILLS.includes(k)))errors.push('Competência desconhecida');
 if(!Array.isArray(c.bonds)||c.bonds.length!==3)errors.push('Registre três Vínculos');
 if(!Array.isArray(c.inventory)||c.inventory.some(i=>![1,2,3].includes(Number(i.slots))||!Number.isInteger(Number(i.damageBase||0))||Number(i.damageBase||0)<0||Number(i.damageBase||0)>4)||inventorySpaces(c.inventory)>6)errors.push('Inventário deve ocupar no máximo seis Espaços');
 return errors;
}
function inventorySpaces(items){return (items||[]).reduce((s,i)=>s+Number(i.slots||0),0)}
function newCharacter(payload){
 const history=pickHistory(payload.history);
 const attrs=Object.fromEntries(Object.keys(ATTRIBUTES).map((key,i)=>[key,Number(payload.attrs?.[key]??ATTRIBUTE_VALUES[i])]));
 const skills=Object.fromEntries(SKILLS.filter(k=>payload.skills?.[k]===15||payload.skills?.[k]===25).map(k=>[k,Number(payload.skills[k])]));
 const c={
 schemaVersion:VERSION,id:payload.id||null,campaign_id:payload.campaign_id||null,owner_id:payload.owner_id||null,
 name:String(payload.name||'').trim(),age:Number(payload.age)||18,occupation:String(payload.occupation||'').trim().slice(0,120),
 concept:String(payload.concept||'').trim().slice(0,300),traits:String(payload.traits||'').trim().slice(0,300),
 concern:String(payload.concern||'').trim().slice(0,300),history:payload.history,attrs,skills,
 contact:String(payload.contact||history?.contact||'').trim().slice(0,240),
 bonds:Array.isArray(payload.bonds)?payload.bonds.map(b=>String(b||'').trim().slice(0,300)):[],
 home:String(payload.home||'').slice(0,240),responsibility:String(payload.responsibility||'').slice(0,240),
 meaningfulItem:String(payload.meaningfulItem||'').slice(0,240),inventory:Array.isArray(payload.inventory)?payload.inventory.map(i=>({name:String(i.name||'').slice(0,100),slots:Number(i.slots),damageBase:Number(i.damageBase||0)})):[],
 vitality:6,vitalityMax:6,stamina:5,staminaMax:5,tension:0,preparations:2,
 wounds:[],deathRisk:0,marks:[],development:0,notes:String(payload.notes||'').slice(0,5000),portrait:String(payload.portrait||'').slice(0,170000)
 };
 const errors=validateCharacter(c);if(errors.length)throw Error(errors.join('; '));return c;
}
function die100(randomBytes){
 if(randomBytes&&randomBytes.length){const n=Number(randomBytes[0]);if(Number.isInteger(n)&&n>=1&&n<=100)return n;}
 if(!globalThis.crypto?.getRandomValues)throw Error('Gerador seguro indisponível');
 const buffer=new Uint32Array(1),limit=Math.floor(4294967296/100)*100;
 do{globalThis.crypto.getRandomValues(buffer)}while(buffer[0]>=limit);
 return buffer[0]%100+1;
}
function calculateTest({attribute,training=0,circumstance=0,difficulty='normal',natural}){
 const attr=Number(attribute);if(!Number.isFinite(attr)||attr<0||attr>100)throw Error('Atributo inválido');
 if(![0,15,25].includes(Number(training)))throw Error('Treinamento inválido');
 if(!Number.isInteger(Number(circumstance))||Number(circumstance)<-20||Number(circumstance)>20)throw Error('Circunstância fora de -20 a +20');
 if(!['normal','dificil','extremo'].includes(difficulty))throw Error('Dificuldade inválida');
 if(!Number.isInteger(Number(natural))||natural<1||natural>100)throw Error('D100 inválido');
 const target=clamp(attr+Number(training)+Number(circumstance),10,90);
 const limit=difficulty==='dificil'?Math.floor(target/2):difficulty==='extremo'?Math.floor(target/5):target;
 const success=natural<=limit&&natural!==100;
 const grade=!success?'falha':natural<=Math.floor(target/5)?'extraordinario':natural<=Math.floor(target/2)?'forte':'normal';
 return {natural,target,limit,difficulty,success,grade,special:natural===1?'virada':natural===100?'reves':null};
}
function rollForCharacter(c,p,forcedNatural){
 if(!c||c.schemaVersion!==VERSION)throw Error('A ficha não utiliza o novo sistema');
 if(!Object.hasOwn(ATTRIBUTES,p.attribute))throw Error('Atributo desconhecido');
 const skill=p.skill&&SKILLS.includes(p.skill)?p.skill:null;
 const training=skill?Number(c.skills?.[skill]||0):0;
 const circumstance=Number(p.circumstance||0);
 return {...calculateTest({attribute:c.attrs[p.attribute],training,circumstance,difficulty:p.difficulty||'normal',natural:forcedNatural??die100()}),attribute:p.attribute,skill,training,circumstance};
}
function opposed(a,b){const rank={falha:0,normal:1,forte:2,extraordinario:3};if(rank[a.grade]!==rank[b.grade])return rank[a.grade]>rank[b.grade]?'a':'b';if(a.target!==b.target)return a.target>b.target?'a':'b';return 'impasse';}
function fixedDamage(base,grade,special){return Math.max(0,Number(base)||0)+(special==='virada'||grade==='extraordinario'?2:grade==='forte'?1:0)}
function applyDamage(c,damage,woundType){
 const out={...c,wounds:[...(c.wounds||[])]};
 const before=clamp(c.vitality,0,6);out.vitality=Math.max(0,before-Math.max(0,damage));
 if(damage>=3){out.wounds.push({type:woundType||'a definir',createdAt:new Date().toISOString(),treated:false});}
 if(out.vitality===0)out.deathRisk=Math.max(0,Number(out.deathRisk)||0);
 return out;
}
function chaseStep(chase,roll,{sprint=false,hide=false,barricade=false}={}){
 const c={...chase};c.round=(Number(c.round)||0)+1;
 let delta=roll.special==='reves'?-2:!roll.success?-1:roll.grade==='forte'||roll.grade==='extraordinario'?2:1;
 if(barricade&&roll.success)delta=1;
 if(hide&&roll.success&&Number(c.distance)>=2)c.status=roll.grade==='forte'||roll.grade==='extraordinario'?'saida_possivel':'suspensa';
 c.distance=clamp(Number(c.distance)+delta,0,4);
 if(c.speed==='rapido'&&c.round%2===0&&!c.obstacle){c.distance=clamp(c.distance-1,0,4)}
 c.obstacle=!!(barricade&&roll.success);
 c.lastResult={...roll,sprint,hide,barricade};
 return c;
}
function isLegacy(c){return !c||c.schemaVersion!==VERSION}
return Object.freeze({VERSION,ATTRIBUTES,ATTRIBUTE_VALUES,SKILLS,HISTORIES,DAMAGE,clamp,pickHistory,validateCharacter,inventorySpaces,newCharacter,die100,calculateTest,rollForCharacter,opposed,fixedDamage,applyDamage,chaseStep,isLegacy});
});