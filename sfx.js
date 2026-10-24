/* SLASHER / UI AUDIO: original procedural retro/lo-fi sounds.
   No samples, no autoplay, no external files. All notes start on user gesture. */
(function(){
 'use strict';
 const PREF='slasher-ui-sound-v1';
 const DEFAULT={enabled:true,volume:30};
 let setting={...DEFAULT},ctx=null,mix=null,noiseBuffer=null,hoverAt=0,lastPlayed=0,hoverNode=null;
 const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
 try{
  const p=JSON.parse(localStorage.getItem(PREF)||'null');
  if(p&&typeof p==='object'){
   if(typeof p.enabled==='boolean')setting.enabled=p.enabled;
   if(Number.isFinite(Number(p.volume)))setting.volume=clamp(p.volume);
  }
 }catch{}
 function persist(){try{localStorage.setItem(PREF,JSON.stringify(setting))}catch{}}
 function applyUi(){
  const enabled=document.getElementById('slasher-audio-enabled'),level=document.getElementById('slasher-audio-volume'),out=document.getElementById('slasher-audio-volume-value');
  if(enabled)enabled.checked=setting.enabled;
  if(level){level.value=String(setting.volume);level.disabled=!setting.enabled;}
  if(out)out.textContent=setting.enabled?setting.volume+'%':'OFF';
  const label=document.getElementById('settings-audio-status');if(label){label.textContent=setting.enabled?'ATIVO':'MUDO';label.dataset.disabled=String(!setting.enabled)}
  const mute=document.getElementById('slasher-audio-mute');if(mute)mute.textContent=setting.enabled?'♫ Silenciar':'♫ Ativar som';
  const test=document.getElementById('slasher-audio-test');if(test)test.disabled=!setting.enabled||setting.volume===0;
  if(mix&&ctx){mix.gain.setTargetAtTime(setting.enabled?(setting.volume/100)**1.35*.38:0,ctx.currentTime,.012);}
 }
 function ensureAudio(){
  if(!setting.enabled||setting.volume<=0||document.hidden)return false;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return false;
  try{
   if(!ctx){ctx=new AC();mix=ctx.createGain();mix.gain.value=0;mix.connect(ctx.destination);applyUi();}
   if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   if(ctx.state==='closed')return false;
   return true;
  }catch{return false;}
 }
 function env(g,t,gain,attack,decay){
  const min=.00001;
  g.gain.setValueAtTime(min,t);
  g.gain.linearRampToValueAtTime(Math.max(min,gain),t+attack);
  g.gain.exponentialRampToValueAtTime(min,t+attack+decay);
 }
 function tone(start,duration,f1,f2,level=.19,wave='triangle',cutoff=1100){
  if(!ctx||!mix)return;
  const osc=ctx.createOscillator(),lp=ctx.createBiquadFilter(),gain=ctx.createGain();
  lp.type='lowpass';lp.frequency.value=cutoff;lp.Q.value=.7;
  osc.type=wave;osc.frequency.setValueAtTime(f1,start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,f2),start+duration);
  env(gain,start,level,Math.min(.007,duration*.2),Math.max(.014,duration-.007));
  osc.connect(lp);lp.connect(gain);gain.connect(mix);osc.start(start);osc.stop(start+duration+.03);
 }
 function noise(start,duration,level=.07,center=550){
  if(!ctx||!mix)return;
  if(!noiseBuffer){
   const len=Math.round(ctx.sampleRate*.35);noiseBuffer=ctx.createBuffer(1,len,ctx.sampleRate);
   const data=noiseBuffer.getChannelData(0);
   for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*.72;
  }
  const src=ctx.createBufferSource(),band=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),gain=ctx.createGain();
  band.type='bandpass';band.frequency.value=center;band.Q.value=.6;
  low.type='lowpass';low.frequency.value=1600;
  src.buffer=noiseBuffer;env(gain,start,level,.004,Math.max(.012,duration-.004));
  src.connect(band);band.connect(low);low.connect(gain);gain.connect(mix);src.start(start);src.stop(start+duration+.02);
 }
 function play(name,opts={}){
  if(!ensureAudio())return false;
  const t=ctx.currentTime+.005;
  // Upper limit on rapid-fire notes prevents audio piling up on fast repeated actions.
  if(!opts.force&&name==='hover'&&t-lastPlayed<.09)return false;
  lastPlayed=t;
  switch(name){
   case 'hover': tone(t,.037,425,352,.075,'sine',850);break;
   case 'navigate':tone(t,.085,474,320,.16,'triangle',930);noise(t,.033,.022,950);break;
   case 'confirm':tone(t,.095,492,585,.18,'triangle',1200);tone(t+.064,.14,720,630,.11,'sine',1180);break;
   case 'back':tone(t,.135,345,178,.19,'triangle',730);noise(t,.044,.018,480);break;
   case 'item':tone(t,.072,505,410,.14,'triangle',980);noise(t+.035,.085,.055,610);tone(t+.055,.095,660,460,.095,'sine',900);break;
   case 'purchase':tone(t,.09,396,510,.13,'triangle',1050);tone(t+.079,.13,598,740,.125,'triangle',1220);noise(t,.057,.03,1100);break;
   case 'dice':for(let i=0;i<4;i++){const dt=i*.063;noise(t+dt,.065,.055-i*.005,360+i*110);tone(t+dt,.045,180+i*34,115+i*33,.10-i*.01,'triangle',650);}tone(t+.275,.17,250,160,.15,'sine',600);break;
   case 'danger':tone(t,.12,205,174,.16,'sawtooth',470);tone(t+.084,.17,189,115,.12,'triangle',420);break;
   case 'error':tone(t,.12,257,206,.18,'square',530);tone(t+.09,.18,200,142,.12,'triangle',480);break;
   default:return false;
  }
  return true;
 }
 const ACTIONS={
  'go':'navigate','auth-tab':'navigate','select-char':'navigate','open-campaign':'confirm','demo-enter':'confirm',
  'modal':'item','close-modal':'back','close-dice':'back','logout':'back',
  'mesa-toggle':'navigate','mesa-move':'navigate','mesa-reset-layout':'back','mesa-select-monster':'navigate',
  'mesa-equip':'item','mesa-buy':'purchase','mesa-del-inventory':'back','mesa-del-stock':'back',
  'mesa-preset-monster':'danger','mesa-preset-grant':'item','mesa-preset-stock':'item','mesa-seed-stock':'item',
  'mesa-open-combat':'danger','mesa-close-combat':'back','mesa-next-round':'navigate',
  'stat':'navigate','set-clock':'navigate','switch-role':'navigate','copy-invite':'confirm',
  'save-gm-note':'confirm','random-fields':'navigate','random-npc':'confirm',
  'remove-effect':'back','demo-reset':'back'
 };
 function getAction(el){
  const act=el.dataset.action||'';
  if(act.startsWith('mesa-preset'))return ACTIONS[act]||'item';
  if(act.startsWith('mesa-'))return ACTIONS[act]||'navigate';
  return ACTIONS[act]||'navigate';
 }
 const fxExcluded=target=>Boolean(target.closest('.settings-page'));
 function setup(){
  document.addEventListener('change',e=>{
   if(e.target.id==='slasher-audio-enabled'){setting.enabled=Boolean(e.target.checked);persist();applyUi();if(setting.enabled)play('confirm',{force:true});}
   else if(e.target.id==='slasher-audio-volume')play('navigate',{force:true});
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='slasher-audio-volume'){setting.volume=clamp(e.target.value);persist();applyUi();}
  });
  document.addEventListener('click',e=>{
   if(e.target.closest('#slasher-audio-test')){play('confirm',{force:true});return;}
   if(e.target.closest('#slasher-audio-mute')){setting.enabled=!setting.enabled;persist();applyUi();if(setting.enabled)play('confirm',{force:true});return;}
   if(fxExcluded(e.target))return;
   const el=e.target.closest('button,a[href],[role="button"]');if(!el||el.disabled)return;
   if(el.matches('button[type="submit"]'))return;
   play(getAction(el));
  },{capture:true});
  document.addEventListener('submit',e=>{
    const form=e.target;if(!form.matches('form')||form.querySelector('button[type="submit"]:disabled'))return;
    const type=form.dataset.mesaForm||form.id||'';
    if(type==='test'||type==='attack'||type==='monster-attack'||type==='dice-form')play('dice');
    else if(type==='create-monster'||type==='encounter')play('danger');
    else if(type==='grant-item'||type==='grant-effect'||type==='add-stock')play('item');
    else play('confirm');
  },{capture:true});
  document.addEventListener('change',e=>{
    if(fxExcluded(e.target))return;
    if(e.target.matches('select:not(:disabled),input[type="checkbox"]:not(:disabled),input[type="radio"]:not(:disabled)'))play('navigate');
  },{capture:true});
  document.addEventListener('pointerover',e=>{
    if(!ctx||ctx.state!=='running'||!setting.enabled||setting.volume===0||document.hidden)return;
    if(e.pointerType==='touch'||fxExcluded(e.target))return;
    const el=e.target.closest('.side-nav button,.login-switch button,.m71-target,.survivor-card');
    if(!el||el.disabled||el===hoverNode)return;
    if(performance.now()-hoverAt<135)return;
    hoverNode=el;hoverAt=performance.now();play('hover');
  },{passive:true});
  document.addEventListener('pointerout',e=>{
    if(hoverNode&&(e.target===hoverNode||hoverNode.contains(e.target)))hoverNode=null;
  },{passive:true});
  document.addEventListener('keydown',e=>{
    if(!['Escape','ArrowUp','ArrowDown'].includes(e.key))return;
    if(e.key==='Escape'&&!fxExcluded(e.target))play('back');
    if(e.key.startsWith('Arrow')&&!e.repeat&&e.target.closest('.side-nav,.login-switch'))play('hover');
  },{capture:true});
  // React to error toast without modifying the application's own code.
  const toast=document.getElementById('toast');if(toast&&window.MutationObserver){
    const obs=new MutationObserver(()=>{
      const message=toast.textContent?.trim()||'';
      if(message&&/^(erro:|falha|rolagem não registrada|não foi possível)/i.test(message))play('error');
    });obs.observe(toast,{childList:true,characterData:true,subtree:true});
  }
  applyUi();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
 window.SLASHER_SFX={play,get:()=>({...setting}),setEnabled:v=>{setting.enabled=Boolean(v);persist();applyUi()},setVolume:v=>{setting.volume=clamp(v);persist();applyUi()},sync:applyUi};
})();