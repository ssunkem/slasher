/* SLASHER 1.1 · fila visual: organização de turnos sem alterar as regras D20. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SLASHER_TURNS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const key=(kind,id)=>(kind==='monster'?'m:':'c:')+id;
 function participants(characters=[],monsters=[]){
  return [
   ...characters.filter(c=>c&&c.id).map(c=>({key:key('character',c.id),id:c.id,type:'character',name:c.name||'Sobrevivente',hp:Number(c.hp)||0,max:Number(c.hp_max)||0,stamina:Number(c.stamina)||0,stress:Number(c.stress)||0,portrait:c.portrait||''})),
   ...monsters.filter(m=>m&&m.id).map(m=>({key:key('monster',m.id),id:m.id,type:'monster',name:m.name||'Criatura',hp:Number(m.hp)||0,max:Number(m.hp_max)||0,portrait:m.portrait||''}))
  ];
 }
 const active=p=>p&&p.hp>0;
 function reconcile(encounter,characters=[],monsters=[]){
  if(!encounter?.active)return {...(encounter||{}),queue:[],currentKey:null};
  const roster=participants(characters,monsters);
  const known=new Map(roster.map(p=>[p.key,p]));
  const used=new Set();
  const old=Array.isArray(encounter.queue)?encounter.queue:[];
  const queue=[];
  for(const entry of old){
   if(!entry||typeof entry.key!=='string'||!known.has(entry.key)||used.has(entry.key))continue;
   queue.push({key:entry.key,acted:entry.acted===true});used.add(entry.key);
  }
  for(const p of roster)if(!used.has(p.key))queue.push({key:p.key,acted:false});
  const byKey=k=>known.get(k);
  const available=e=>!e.acted&&active(byKey(e.key));
  let currentKey=typeof encounter.currentKey==='string'?encounter.currentKey:null;
  if(!queue.some(e=>e.key===currentKey&&available(e)))currentKey=queue.find(available)?.key||null;
  const person=byKey(currentKey);
  return {...encounter,round:Math.max(1,Math.floor(Number(encounter.round)||1)),queue,currentKey,turn_label:person?.name||''};
 }
 function advance(encounter,characters=[],monsters=[]){
  const e=reconcile(encounter,characters,monsters);
  if(!e.active)throw Error('Inicie o confronto antes de avançar o turno');
  if(!e.currentKey)return e;
  const queue=e.queue.map(x=>({...x,acted:x.acted||x.key===e.currentKey}));
  const roster=new Map(participants(characters,monsters).map(p=>[p.key,p]));
  const index=queue.findIndex(x=>x.key===e.currentKey);
  let next=null;
  for(let n=1;n<=queue.length;n++){
   const candidate=queue[(index+n)%queue.length];
   if(!candidate.acted&&active(roster.get(candidate.key))){next=candidate.key;break}
  }
  const person=roster.get(next);
  return {...e,queue,currentKey:next,turn_label:person?.name||''};
 }
 function newRound(encounter,characters=[],monsters=[]){
  const e=reconcile(encounter,characters,monsters);
  if(!e.active)throw Error('Inicie o confronto antes de começar outra rodada');
  const queue=e.queue.map(q=>({...q,acted:false}));
  const roster=new Map(participants(characters,monsters).map(p=>[p.key,p]));
  const currentKey=queue.find(q=>active(roster.get(q.key)))?.key||null;
  return {...e,round:e.round+1,queue,currentKey,turn_label:roster.get(currentKey)?.name||''};
 }
 function start(encounter,characters=[],monsters=[],round=1){
  return reconcile({...(encounter||{}),active:true,round:Math.max(1,Math.floor(Number(round)||1)),queue:[],currentKey:null,turn_label:''},characters,monsters);
 }
 function status(encounter,characters=[],monsters=[]){
  const e=reconcile(encounter,characters,monsters);
  const roster=new Map(participants(characters,monsters).map(p=>[p.key,p]));
  return {encounter:e,entries:e.queue.map((q,i)=>{
   const p=roster.get(q.key);
   return {...p,order:i,acted:q.acted,state:!active(p)?'fallen':q.acted?'acted':q.key===e.currentKey?'current':'next'};
  }),complete:!!e.active&&!e.currentKey};
 }
 return Object.freeze({key,participants,reconcile,start,advance,newRound,status});
});
