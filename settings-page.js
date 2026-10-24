/* SLASHER | Options / system settings: one page for video and audio preferences. */
(function(){
 'use strict';
 const OPTIONS=[['soft','Suave','Ruído discreto'],['classic','Clássico','Equilíbrio original'],['strong','Intenso','CRT envelhecido'],['off','Desligado','Imagem limpa']];
 const escape=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 function modeOption([key,title,desc],current){return `<button type="button" class="settings-mode${key===current?' is-active':''}" data-crt-mode="${key}" aria-pressed="${key===current}"><span class="settings-mode-mark" aria-hidden="true">${key===current?'◆':'◇'}</span><span><b>${title}</b><small>${desc}</small></span></button>`}
 function range({id,title,desc,value}){return `<label class="settings-range" for="${id}"><span class="settings-range-title"><strong>${title}</strong><output for="${id}" id="${id}-value">${value}%</output></span><input id="${id}" type="range" min="0" max="100" step="5" value="${value}"><small>${desc}</small></label>`}
 function render(opts={}){
  const guest=!!opts.guest,crt=window.SLASHER_CRT?.get?.()||'classic',fx=window.SLASHER_CRT?.effects?.()||{bloom:35,chroma:30},audio=window.SLASHER_SFX?.get?.()||{enabled:true,volume:30};
  const content=`<section class="settings-page" aria-label="Configurações de imagem e áudio">
   <header class="settings-head"><div class="settings-kicker">SLASHER / SYSTEM OPTIONS / ARQUIVO Nº X</div><h1>Configurações<span class="settings-blink" aria-hidden="true">_</span></h1><p>Ajuste a imagem e o som antes de entrar em Dunmoore. As preferências são pessoais e ficam neste navegador.</p></header>
   <div class="settings-layout">
    <nav class="settings-chapters" aria-label="Seções de configurações"><span>MENU DO SISTEMA</span><a href="#settings-display">01 <b>Imagem / CRT</b><i>↗</i></a><a href="#settings-sound">02 <b>Áudio / SFX</b><i>↗</i></a><div class="settings-chapters-foot">SISTEMA LOCAL<br>SEM ALTERAR A CAMPANHA</div></nav>
    <div class="settings-stack">
     <section class="settings-card" id="settings-display" aria-labelledby="settings-display-title"><div class="settings-card-head"><div><span class="settings-serial">OPTION 01 / DISPLAY</span><h2 id="settings-display-title">Imagem <span>/ CRT</span></h2></div><span class="settings-status" id="settings-crt-status">${crt==='off'?'DESLIGADO':'ATIVO'}</span></div>
      <div class="settings-display-preview" aria-hidden="true"><div class="settings-screen"><div class="settings-screen-haze"></div><span class="settings-screen-marker">DUNMOORE // 1999</span><div class="settings-screen-title">SLASHER</div><div class="settings-screen-line"></div><small>THE FOREST NEVER FORGETS</small></div><span class="settings-screen-caption">MONITOR • SIMULAÇÃO ANALÓGICA</span></div>
      <div class="settings-subtitle">INTENSIDADE DO TUBO</div><div class="settings-mode-grid" role="group" aria-label="Intensidade do CRT">${OPTIONS.map(x=>modeOption(x,crt)).join('')}</div>
      <div class="settings-range-grid">${range({id:'slasher-fx-bloom',title:'Bloom',value:fx.bloom,desc:'Halo suave de brilho em títulos e seleções.'})}${range({id:'slasher-fx-chroma',title:'Aberração cromática',value:fx.chroma,desc:'Separação RGB discreta; textos pequenos continuam nítidos.'})}</div>
      <div class="settings-card-foot"><p>Com o CRT desligado, bloom e aberração ficam suspensos, mas seus valores são preservados.</p><button type="button" class="settings-secondary-button" id="slasher-fx-reset">↺ Restaurar imagem</button></div>
     </section>
     <section class="settings-card" id="settings-sound" aria-labelledby="settings-sound-title"><div class="settings-card-head"><div><span class="settings-serial">OPTION 02 / AUDIO</span><h2 id="settings-sound-title">Áudio <span>/ SFX</span></h2></div><span class="settings-status" id="settings-audio-status">${audio.enabled?'ATIVO':'MUDO'}</span></div>
      <label class="settings-toggle" for="slasher-audio-enabled"><span class="settings-toggle-copy"><b>Sons de interface</b><small>Navegação, confirmação, inventário, dados e alertas.</small></span><input id="slasher-audio-enabled" type="checkbox" ${audio.enabled?'checked':''}><span class="settings-switch" aria-hidden="true"></span></label>
      ${range({id:'slasher-audio-volume',title:'Volume geral',value:audio.volume,desc:'Som lo-fi produzido pelo navegador, sem arquivos externos.'})}
      <div class="settings-audio-actions"><button type="button" id="slasher-audio-test" class="settings-primary-button">▶ Testar som</button><button type="button" id="slasher-audio-mute" class="settings-secondary-button">${audio.enabled?'♫ Silenciar':'♫ Ativar som'}</button></div>
      <div class="settings-card-foot"><p>O áudio começa somente depois de sua interação. Não há reprodução automática nem música contínua.</p><span class="settings-audio-signal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
     </section>
     <div class="settings-end"><span>AS CONFIGURAÇÕES SÃO SALVAS AUTOMATICAMENTE</span><span>SLASHER · VERSÃO 1.0</span></div>
    </div>
   </div>
  </section>`;
  if(guest)return `<div class="settings-guest-shell"><div class="settings-guest-head"><span>SLASHER / SYSTEM SETTINGS</span><button type="button" class="settings-secondary-button" data-action="go" data-value="lobby">← Voltar ao início</button></div>${content}</div>`;
  return content;
 }
 window.SLASHER_SETTINGS={render};
})();