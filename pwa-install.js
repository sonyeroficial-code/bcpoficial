(()=>{
  'use strict';
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isiOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isLocalFile=()=>location.protocol==='file:';
  let deferredPrompt=null;

  function icon(type){
    const common='viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"';
    if(type==='flash') return `<svg ${common}><path d="M13.2 2 6.8 12.1h4.2L9.8 22l7.4-11.2h-4L13.2 2Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;
    if(type==='mobile') return `<svg ${common}><rect x="7" y="2.75" width="10" height="18.5" rx="2.5" stroke="currentColor" stroke-width="1.9"/><path d="M10 6.25h4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1" fill="currentColor"/></svg>`;
    if(type==='cloud') return `<svg ${common}><path d="M8.8 18.5a4.8 4.8 0 0 1-.7-9.55 5.8 5.8 0 0 1 10.96 1.96A3.92 3.92 0 1 1 18 18.5H8.8Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;
    if(type==='share') return `<svg ${common}><path d="M12 15.2V4.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="m8.1 7.8 3.9-4 3.9 4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13.8v3.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
    if(type==='menu') return `<svg ${common}><path d="M7 6h10" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M7 12h10" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M7 18h10" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
    return '';
  }

  function ensureUI(){
    if(document.getElementById('pwa-install-overlay')) return;
    const wrap=document.createElement('div');
    wrap.id='pwa-install-overlay';
    wrap.setAttribute('role','dialog');
    wrap.setAttribute('aria-modal','true');
    wrap.innerHTML=`<div id="pwa-install-card">
      <button id="pwa-install-close" aria-label="Cerrar">×</button>
      <div id="pwa-install-header">
        <div id="pwa-install-brand">
          <img id="pwa-install-icon" src="/bcp-install-192-v8.png" alt="Icono de la aplicación">
          <div>
            <span id="pwa-install-badge">Instalación recomendada</span>
            <h2 id="pwa-install-title">Instala la aplicación</h2>
            <p id="pwa-install-sub">Accede desde la pantalla de inicio, en pantalla completa y con soporte sin conexión para los recursos locales.</p>
          </div>
        </div>
      </div>
      <div id="pwa-install-benefits">
        <div class="pwa-benefit"><span class="pwa-benefit-icon">${icon('flash')}</span><span class="pwa-benefit-label">Acceso directo</span></div>
        <div class="pwa-benefit"><span class="pwa-benefit-icon">${icon('mobile')}</span><span class="pwa-benefit-label">Pantalla completa</span></div>
        <div class="pwa-benefit"><span class="pwa-benefit-icon">${icon('cloud')}</span><span class="pwa-benefit-label">Modo sin conexión</span></div>
      </div>
      <div id="pwa-install-help" hidden></div>
      <button id="pwa-install-btn">Instalar ahora</button>
      <button id="pwa-install-later">Más tarde</button>
    </div>`;
    document.body.appendChild(wrap);
    const close=()=>{wrap.classList.remove('pwa-show');sessionStorage.setItem('pwaInstallDismissed','1')};
    document.getElementById('pwa-install-close').onclick=close;
    document.getElementById('pwa-install-later').onclick=close;
    wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
    document.getElementById('pwa-install-btn').onclick=triggerInstall;
    updateUI();
  }

  function setHelp(html, show=false){
    const help=document.getElementById('pwa-install-help');
    if(!help) return;
    help.innerHTML=html;
    help.hidden=!show;
  }

  function revealHelp(){
    const help=document.getElementById('pwa-install-help');
    if(!help) return;
    help.hidden=false;
    help.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function updateUI(){
    const btn=document.getElementById('pwa-install-btn');
    if(!btn) return;

    if(isiOS()){
      setHelp(
        `<div class="pwa-help-head"><span class="pwa-help-icon">${icon('share')}</span><strong>Instalación en iPhone / iPad</strong></div>
        <ol class="pwa-help-steps">
          <li>Abre esta app en <b>Safari</b>.</li>
          <li>Toca el botón <b>Compartir</b>.</li>
          <li>Selecciona <b>Agregar a pantalla de inicio</b>.</li>
        </ol>`,
        true
      );
      btn.textContent='Ver instrucciones';
      btn.disabled=false;
      btn.onclick=revealHelp;
    }else if(deferredPrompt){
      setHelp('', false);
      btn.textContent='Instalar ahora';
      btn.disabled=false;
      btn.onclick=triggerInstall;
    }else{
      const localNote=isLocalFile()
        ? `<div class="pwa-help-note">La app está abierta en modo local. Para habilitar la instalación completa como PWA, publícala en un hosting con <b>HTTPS</b>.</div>`
        : '';
      setHelp(
        `<div class="pwa-help-head"><span class="pwa-help-icon">${icon('menu')}</span><strong>Instalación manual</strong></div>
        <ol class="pwa-help-steps">
          <li>Abre el menú del navegador.</li>
          <li>Busca la opción <b>Instalar aplicación</b> o <b>Agregar a pantalla principal</b>.</li>
          <li>Confirma la instalación.</li>
        </ol>${localNote}`,
        false
      );
      btn.textContent='Cómo instalar';
      btn.disabled=false;
      btn.onclick=revealHelp;
    }
  }

  async function triggerInstall(){
    if(!deferredPrompt){updateUI();return}
    const btn=document.getElementById('pwa-install-btn');
    try{
      btn.disabled=true;
      btn.textContent='Preparando instalación...';
      await deferredPrompt.prompt();
      const choice=await deferredPrompt.userChoice;
      if(choice&&choice.outcome==='accepted'){
        document.getElementById('pwa-install-overlay')?.classList.remove('pwa-show');
      }
      deferredPrompt=null;
    }catch(e){}
    finally{
      if(btn){btn.disabled=false;updateUI()}
    }
  }

  function maybeShow(){
    if(isStandalone()||sessionStorage.getItem('pwaInstallDismissed')==='1') return;
    ensureUI();
    setTimeout(()=>document.getElementById('pwa-install-overlay')?.classList.add('pwa-show'),900);
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;updateUI();maybeShow()});
  window.addEventListener('appinstalled',()=>{document.getElementById('pwa-install-overlay')?.classList.remove('pwa-show');deferredPrompt=null});
  window.addEventListener('DOMContentLoaded',()=>{if(!isStandalone()) maybeShow()});

  if('serviceWorker' in navigator && location.protocol!=='file:'){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));
  }

  function toast(text){let t=document.getElementById('pwa-offline-toast');if(!t){t=document.createElement('div');t.id='pwa-offline-toast';document.body.appendChild(t)}t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
  window.addEventListener('offline',()=>toast('Sin internet · usando modo offline'));
  window.addEventListener('online',()=>toast('Conexión restaurada'));
})();
