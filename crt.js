/* SLASHER CRT / display effects, persisted locally. Events survive page rerenders. */
(function(){
 'use strict';
 const KEY='slasher-crt-intensity-v1';
 const FX_KEYS={bloom:'slasher-crt-bloom-v1',chroma:'slasher-crt-chroma-v1'};
 const FX_DEFAULT={bloom:35,chroma:30};
 const ORDER=['soft','classic','strong','off'];
 const fxState={...FX_DEFAULT};
 function safePct(v,defaultValue){if(v==null||v==='')return defaultValue;const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n/5)*5)):defaultValue}
 function saved(k){try{return localStorage.getItem(k)}catch{return null}}
 function put(k,v){try{localStorage.setItem(k,String(v))}catch{}}
 function setFx(effect,value,store=true){
  if(!(effect in FX_KEYS))return;
  const pct=safePct(value,FX_DEFAULT[effect]);fxState[effect]=pct;
  const root=document.documentElement;
  if(effect==='bloom'){
   root.style.setProperty('--crt-bloom-core',(pct/100*.54).toFixed(3));
   root.style.setProperty('--crt-bloom-halo',(pct/100*.38).toFixed(3));
   root.style.setProperty('--crt-bloom-border',(pct/100*.24).toFixed(3));
  }else{
   const px=(pct/100*1.8).toFixed(2)+'px';const neg=(-pct/100*1.8).toFixed(2)+'px';
   root.style.setProperty('--crt-chroma-left',neg);
   root.style.setProperty('--crt-chroma-right',px);
   root.style.setProperty('--crt-chroma-alpha',(pct===0?0:.32).toFixed(3));
  }
  const input=document.getElementById('slasher-fx-'+effect);if(input)input.value=String(pct);
  const output=document.getElementById('slasher-fx-'+effect+'-value');if(output)output.textContent=pct+'%';
  if(store)put(FX_KEYS[effect],pct);
 }
 function apply(mode,store=false){
  const current=ORDER.includes(mode)?mode:'classic';
  document.documentElement.dataset.crt=current;
  const overlay=document.getElementById('slasher-crt');if(overlay)overlay.dataset.mode=current;
  document.querySelectorAll('[data-crt-mode]').forEach(b=>{
    const chosen=b.dataset.crtMode===current;
    b.setAttribute('aria-pressed',String(chosen));b.classList.toggle('is-active',chosen);
    const marker=b.querySelector('.settings-mode-mark');if(marker)marker.textContent=chosen?'◆':'◇';
  });
  const label=document.getElementById('settings-crt-status');if(label){label.textContent=current==='off'?'DESLIGADO':'ATIVO';label.dataset.disabled=String(current==='off')}
  if(store)put(KEY,current);
  return current;
 }
 apply(saved(KEY)||'classic');
 for(const effect of Object.keys(FX_KEYS))setFx(effect,safePct(saved(FX_KEYS[effect]),FX_DEFAULT[effect]),false);
 document.addEventListener('click',e=>{
   const mode=e.target.closest('[data-crt-mode]');if(mode){apply(mode.dataset.crtMode,true);return}
   if(e.target.closest('#slasher-fx-reset'))for(const key of Object.keys(FX_KEYS))setFx(key,FX_DEFAULT[key]);
 });
 document.addEventListener('input',e=>{for(const key of Object.keys(FX_KEYS))if(e.target.id==='slasher-fx-'+key)setFx(key,e.target.value)});
 window.SLASHER_CRT={set:mode=>{if(ORDER.includes(mode))apply(mode,true)},get:()=>document.documentElement.dataset.crt,effects:()=>({...fxState}),setFx,sync:()=>apply(document.documentElement.dataset.crt)};
})();