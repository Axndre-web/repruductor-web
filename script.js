const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const stations=[
 ['LOS40','40','Éxitos · Pop','#ff315d','https://play.los40.com/'],['LOS40 Classic','40C','Clásicos','#ff5b35','https://play.los40.com/'],['LOS40 Dance','40D','Dance · Electrónica','#b74cff','https://play.los40.com/'],['LOS40 Urban','40U','Urban · Hits','#ff3ba7','https://play.los40.com/'],['Europa FM','EF','Pop · Rock','#7b5cff','https://www.europafm.com/'],['KISS FM','KISS','Pop · Rock','#ff4d8d','https://www.kissfm.es/'],['Radiolé','RL','Española','#ff9d28','https://www.radiole.com/'],['Rock FM','RF','Rock · Clásicos','#e33b4e','https://www.rockfm.fm/'],['Radio MARCA','RM','Deporte · Directo','#e52435','https://www.marca.com/radio.html'],['COPE Deportes','COPE','Deportes · Directo','#50a7ff','https://www.cope.es/'],['RAC1','R1','Actualidad · Deporte','#ffcc31','https://www.rac1.cat/'],['RNE','RNE','Radio Nacional','#49d7ff','https://www.rtve.es/radio/']
];
const themes=[['neon-dark','NEON DARK','Negro + morado'],['cyber-blue','CYBER BLUE','Tecnología futurista'],['fire-red','FIRE RED','Pasión y poder'],['toxic-green','TOXIC GREEN','Energía extrema'],['gold-elite','GOLD ELITE','Premium oscuro'],['ice-white','ICE WHITE','Pureza digital'],['ocean-teal','OCEAN TEAL','Fluidez total'],['violet-nebula','VIOLET NEBULA','Espacio infinito'],['matte-black','MATTE BLACK','Elegancia total'],['neon-orange','NEON ORANGE','Vibra al máximo'],['rainbow-tech','RAINBOW TECH','Sin límites'],['midnight-crimson','MIDNIGHT CRIMSON','Noche intensa']];
const streams={
  0:'https://playerservices.streamtheworld.com/api/livestream-redirect/Los40.mp3',
  1:'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3',
  2:'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_DANCE.mp3',
  3:'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_URBAN.mp3',
  4:'https://one.cloudstreaming.eu/proxy/europa/stream',
  5:'https://kissfm.kissfmradio.cires21.com/kissfm.mp3',
  6:'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOLE.mp3',
  7:'https://rockfm-cope-rrcast.flumotion.com/cope/rockfm-low.mp3',
  8:'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMARCA_NACIONAL.mp3',
  9:'https://flucast09-h-cloud.flumotion.com/cope/net1.mp3',
  10:'https://playerservices.streamtheworld.com/api/livestream-redirect/RAC_1.mp3',
  11:'https://dispatcher.rndfnk.com/crtve/rne1/mad/mp3/high'
};
const audio=$('#radioAudio');let active=0,cart=[];
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function loadAds(){const grid=$('#adsGrid');if(!grid)return;fetch('./ads.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('ads.json '+r.status);return r.json()}).then(data=>{const ads=(Array.isArray(data)?data:[]).filter(a=>a&&a.active&&a.text).sort((a,b)=>(Number(a.priority)||999)-(Number(b.priority)||999));if(!ads.length){grid.innerHTML='<article class="ad-card"><span class="ad-kicker">NEON ADS</span><strong>SIN PROMOCIONES ACTIVAS</strong><small>La red de anuncios está preparada.</small></article>';return}grid.innerHTML=ads.map((a,i)=>{const link=typeof a.link==='string'&&/^https?:\/\//i.test(a.link)?a.link:'';const target=a.target==='_self'?'_self':'_blank';const button=esc(a.button||'ABRIR');const image=typeof a.image==='string'&&a.image.trim()?`<img class="ad-image" src="${esc(a.image)}" alt="">`:'';const action=link?`<a class="btn mini ad-action" href="${esc(link)}" target="${target}" rel="noopener noreferrer">${button} ↗</a>`:'';return `<article class="ad-card" data-ad-index="${i}">${image}<div class="ad-content"><span class="ad-kicker">NEON SIGNAL ${String(i+1).padStart(2,'0')}</span><strong>${esc(a.text)}</strong><small>${esc(a.subtext||'')}</small>${action}</div></article>`}).join('')}).catch(err=>{grid.innerHTML='<article class="ad-card ad-error"><span class="ad-kicker">NEON ADS</span><strong>RED DE ANUNCIOS EN ESPERA</strong><small>No se pudo cargar ads.json. El resto de NEON PLAYER X continúa funcionando.</small></article>';console.warn('NEON ADS:',err)})}

function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove('show'),2600)}
function renderThemes(){const g=$('#themeGrid');g.innerHTML=themes.map((t,i)=>`<article class="theme-card ${t[0]===localStorage.neonTheme?'selected':''}" data-theme="${t[0]}" data-index="${i}" style="--tc:var(--accent)"><div class="theme-orb"></div><h3>${t[1]}</h3><p>${t[2]}</p></article>`).join('');$$('.theme-card').forEach(c=>c.onclick=()=>applyTheme(c.dataset.theme));updateThemeButton()}
function applyTheme(name){document.body.dataset.theme=name;localStorage.neonTheme=name;$$('.theme-card').forEach(x=>x.classList.toggle('selected',x.dataset.theme===name));updateThemeButton();toast('Tema '+(themes.find(t=>t[0]===name)?.[1]||name)+' activado')}
function updateThemeButton(){const b=$('#themeCycle');if(!b)return;const i=Math.max(0,themes.findIndex(t=>t[0]===document.body.dataset.theme));b.dataset.themeIndex=i;b.querySelector('span').textContent=themes[i]?.[1]||'TEMA'}
function cycleTheme(){const i=Math.max(0,themes.findIndex(t=>t[0]===document.body.dataset.theme));applyTheme(themes[(i+1)%themes.length][0])}
function renderStations(){const g=$('#radioGrid');g.innerHTML=stations.map((r,i)=>`<article class="radio-card ${i===active?'active':''}" data-i="${i}" style="--station:${r[3]}"><div class="station-logo">${r[1]}</div><div><b>${r[0]}</b><small>${r[2]}</small></div><span class="listen">▶</span></article>`).join('');$$('.radio-card').forEach(c=>c.onclick=()=>playStation(+c.dataset.i))}
function makeWave(){const w=$('#wave');w.innerHTML=Array.from({length:11},()=>'<i></i>').join('')}
function playStation(i){
  active=i;
  const r=stations[i],url=streams[i];
  $$('.radio-card').forEach(c=>c.classList.toggle('active',+c.dataset.i===i));
  $('#radioName').textContent=r[0];
  $('#radioGenre').textContent=r[2]+' · reproducción integrada';
  $('#stageLogo').textContent=r[1];
  $('#stageLogo').style.color=r[3];
  $('#radioWeb').href=r[4];
  $('#radioStatus').textContent='● CONECTANDO';
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  if(!url){
    $('#radioStatus').textContent='● WEB OFICIAL';
    toast(r[0]+' · sin stream directo disponible');
    return;
  }
  audio.src=url;
  audio.load();
  audio.play().then(()=>{
    $('#radioStatus').textContent='● EN DIRECTO';
    toast(r[0]+' · reproduciendo');
  }).catch(()=>{
    $('#radioStatus').textContent='● REQUIERE WEB';
    toast(r[0]+' · el navegador no pudo iniciar el stream. Pulsa ▶ o WEB OFICIAL.');
  });
}

audio.addEventListener('playing',()=>{ $('#radioStatus').textContent='● EN DIRECTO'; });
audio.addEventListener('waiting',()=>{ $('#radioStatus').textContent='● CARGANDO'; });
audio.addEventListener('error',()=>{ if(streams[active]){ $('#radioStatus').textContent='● ERROR DE STREAM'; toast(stations[active][0]+' · stream no disponible ahora. Prueba WEB OFICIAL.'); }});
function renderCart(){const count=cart.reduce((a,x)=>a+x.qty,0),total=cart.reduce((a,x)=>a+x.qty*x.price,0);$('#cartCount').textContent=count;$('#cartTotal').textContent=total.toFixed(2).replace('.',',')+' €';$('#cartItems').innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><span>${esc(x.name)} × ${x.qty}</span><b>${(x.qty*x.price).toFixed(2).replace('.',',')} €</b></div>`).join(''):'<p>Tu carrito está vacío.</p>'}
$$('.add').forEach(b=>b.onclick=()=>{const n=b.dataset.product,p=+b.dataset.price;const x=cart.find(x=>x.name===n);x?x.qty++:cart.push({name:n,price:p,qty:1});renderCart();toast('Producto añadido al carrito')});
$('#whatsapp').onclick=()=>{if(!cart.length)return toast('Añade un producto antes de enviar el pedido');const name=$('#customerName').value||'Cliente';const phone=$('#customerPhone').value||'No indicado';const addr=$('#customerAddress').value||'Recogida Renfe Azuqueca';const date=$('#deliveryDate').value||'A confirmar';const total=cart.reduce((a,x)=>a+x.qty*x.price,0).toFixed(2);const text=`¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.%0A%0A👤 *Nombre:* ${encodeURIComponent(name)}%0A🥟 *Cantidad:* ${cart.reduce((a,x)=>a+x.qty,0)}%0A💶 *Total:* ${total} €%0A📦 *Entrega:* ${encodeURIComponent(addr)}%0A📅 *Fecha:* ${encodeURIComponent(date)}%0A📱 *Teléfono:* ${encodeURIComponent(phone)}`;window.open('https://wa.me/34602487576?text='+text,'_blank')};
// === V5.6 EVOLUTION CORE ===
const orderHistory=JSON.parse(localStorage.neonOrderHistory||'[]');
function saveOrders(){localStorage.neonOrderHistory=JSON.stringify(orderHistory.slice(-20));}
function updateEvolution(){
  const evoP=$('#evoPlayback'), evoPM=$('#evoPlaybackMeta');
  const radioOn=audio&&!audio.paused&&!audio.ended, mainOn=typeof currentMain==='function'&&currentMain()&&!currentMain().paused&&!currentMain().ended;
  if(evoP){evoP.textContent=radioOn?'RADIO EN DIRECTO':mainOn?'MEDIA PLAYER':'EN ESPERA';evoPM.textContent=radioOn?(stations[active]?.[0]||'Emisora activa'):mainOn?(mainFiles[mainIndex]?.name||'Archivo local'):'Radio / Media Player';}
  const info=rewardInfo(); const mins=Math.floor(rewardState.seconds/60);
  if($('#evoRewardLevel'))$('#evoRewardLevel').textContent=info.cur[0];
  if($('#evoRewardMeta'))$('#evoRewardMeta').textContent=rewardState.points+' puntos · '+mins+' min';
  const last=orderHistory.at(-1);
  if($('#evoLastOrder'))$('#evoLastOrder').textContent=last?.id||'NINGUNO';
  if($('#evoLastOrderMeta'))$('#evoLastOrderMeta').textContent=last?last.total+' € · '+last.date:'Aún no hay compras confirmadas';
}
function renderOrderHistory(){
  const box=$('#orderHistory'); if(!box)return;
  if(!orderHistory.length){box.innerHTML='<p>No hay pedidos confirmados todavía.</p>';return;}
  box.innerHTML='<div class="history-list">'+orderHistory.slice().reverse().map(o=>`<article><b>${esc(o.id)}</b><span>${esc(o.items)}</span><strong>${esc(o.total)} €</strong><small>${esc(o.date)}</small></article>`).join('')+'</div>';
}
$('#showOrders')?.addEventListener('click',()=>{const b=$('#orderHistory');b.hidden=!b.hidden;if(!b.hidden)renderOrderHistory()});
$('#paymentDiagnostics')?.addEventListener('click',()=>{
  const checks=[['Carrito',cart.length?'OK':'VACÍO'],['Total',cartSnapshot().total>0?money(cartSnapshot().total)+' €':'NO VÁLIDO'],['SDK',window.paypal?.Buttons?'CARGADO':'SE CARGARÁ AL ABRIR'],['Cliente PayPal',PAYPAL_CLIENT_ID?'CONFIGURADO':'FALTA'],['Moneda','EUR']];
  const text=checks.map(x=>x[0]+': '+x[1]).join(' · '); setPayStatus(text); toast('Diagnóstico PayPal actualizado');
});
['playing','pause','ended'].forEach(ev=>{audio.addEventListener(ev,updateEvolution)});
setInterval(updateEvolution,1500);

// === V5.5.2 PAYPAL DYNAMIC CHECKOUT ===
const PAYPAL_CLIENT_ID='BAAE-_0bpY5bp5POKN2LqiDTn-tTh6E7JiCQ_pAPSeU4hOum0sHF1sMJzQ0APl7YKnk-QTxE_2VN90Dy4';
let paypalLoading=null,paypalRendered=false,paypalBusy=false;
function money(n){return Number(n||0).toFixed(2)}
function cartSnapshot(){
  const items=cart.map(x=>({name:x.name,price:Number(x.price),qty:Number(x.qty)}));
  const total=items.reduce((a,x)=>a+x.price*x.qty,0);
  const qty=items.reduce((a,x)=>a+x.qty,0);
  return {items,total,qty};
}
function loadPayPalSDK(){
  if(window.paypal?.Buttons)return Promise.resolve(window.paypal);
  if(paypalLoading)return paypalLoading;
  paypalLoading=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(PAYPAL_CLIENT_ID)+'&components=buttons&currency=EUR&intent=capture&commit=true';
    s.async=true;
    s.onload=()=>window.paypal?.Buttons?resolve(window.paypal):reject(new Error('SDK no disponible'));
    s.onerror=()=>reject(new Error('No se pudo cargar PayPal'));
    document.head.appendChild(s);
  });
  return paypalLoading;
}
function paymentCustomer(){
  return {
    name:($('#customerName')?.value||'Cliente').trim(),
    phone:($('#customerPhone')?.value||'No indicado').trim(),
    address:($('#customerAddress')?.value||'Recogida Renfe Azuqueca').trim(),
    date:($('#deliveryDate')?.value||'A confirmar')
  };
}
function setPayStatus(t,good=false){
  const e=$('#payStatus'); if(e)e.textContent=t;
  e?.classList.toggle('pay-ok',good);
}
function openPayModal(){
  const snap=cartSnapshot();
  if(!snap.items.length)return toast('Añade un producto antes de pagar');
  if(snap.total<=0)return toast('El total del pedido no es válido');
  $('#paySummaryProduct').textContent=snap.items.map(x=>x.name+' × '+x.qty).join(', ');
  $('#paySummaryTotal').textContent=money(snap.total).replace('.',',')+' €';
  $('#payModal').classList.add('open');$('#payModal').setAttribute('aria-hidden','false');
  setPayStatus('Comprobando PayPal…');
  if(paypalRendered)return;
  loadPayPalSDK().then(pp=>{
    if(paypalRendered)return;
    const box=$('#paypal-container-NPCYVHY6AHTGL'); box.innerHTML='';
    pp.Buttons({
      style:{layout:'vertical',shape:'rect',label:'paypal',height:42},
      createOrder:(data,actions)=>{
        const current=cartSnapshot();
        if(!current.items.length||current.total<=0) return Promise.reject(new Error('Carrito vacío o total inválido'));
        const customer=paymentCustomer();
        return actions.order.create({
          intent:'CAPTURE',
          purchase_units:[{
            description:'Multimedia Neon Player X',
            custom_id:'NEON-PLAYER-X',
            amount:{currency_code:'EUR',value:money(current.total),breakdown:{item_total:{currency_code:'EUR',value:money(current.total)}}},
            items:current.items.map(x=>({name:x.name,unit_amount:{currency_code:'EUR',value:money(x.price)},quantity:String(x.qty),category:'DIGITAL'}))
          }],
          application_context:{shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}
        });
      },
      onClick:()=>{setPayStatus('Abriendo checkout seguro de PayPal…');},
      onApprove:(data,actions)=>{
        if(paypalBusy)return;
        paypalBusy=true;setPayStatus('Procesando el pago…');
        return actions.order.capture().then(details=>{
          const status=details?.status||'COMPLETED';
          const capture=details?.purchase_units?.[0]?.payments?.captures?.[0];
          const captureStatus=capture?.status||status;
          if(captureStatus!=='COMPLETED')throw new Error('El pago no quedó completado');
          const orderId=data?.orderID||details?.id||'—';
          setPayStatus('✓ Pago completado correctamente · Pedido '+orderId,true);
          toast('Pago PayPal completado');
          localStorage.neonLastPayPalOrder=orderId;
          localStorage.neonLastPayPalDate=new Date().toISOString();
          orderHistory.push({id:orderId,total:money(current.total),items:current.items.map(x=>x.name+' × '+x.qty).join(', '),date:new Date().toLocaleString('es-ES')});
          saveOrders(); renderOrderHistory(); updateEvolution();
          // Conservamos el pedido para WhatsApp/gestión y vaciamos el carrito solo tras captura confirmada.
          cart=[];renderCart();
          setTimeout(closePayModal,1800);
        }).catch(err=>{
          paypalBusy=false;setPayStatus('⚠ No se pudo confirmar el pago. No cierres la página; revisa PayPal y vuelve a intentarlo.');
          console.error('NEON PAYPAL CAPTURE',err);toast('PayPal no pudo confirmar el pago');
        });
      },
      onCancel:()=>{paypalBusy=false;setPayStatus('Pago cancelado. Tu carrito sigue intacto.');toast('Pago cancelado');},
      onError:(err)=>{paypalBusy=false;setPayStatus('⚠ PayPal informó de un error. Tu carrito sigue intacto.');console.error('NEON PAYPAL ERROR',err);toast('Error de PayPal');}
    }).render('#paypal-container-NPCYVHY6AHTGL');
    paypalRendered=true;setPayStatus('✓ PayPal listo. Selecciona PayPal para continuar.');
  }).catch(err=>{console.error('NEON PAYPAL SDK',err);setPayStatus('⚠ No se pudo cargar PayPal. Comprueba tu conexión, bloqueadores y cookies.');toast('PayPal no pudo cargarse');});
}
function closePayModal(){const m=$('#payModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
$('#paypal').onclick=openPayModal;$('#payClose')?.addEventListener('click',closePayModal);$$('[data-close-pay]').forEach(e=>e.addEventListener('click',closePayModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePayModal()});
$('#radioPlay').onclick=()=>{if(!audio.src||audio.src.endsWith('/'))return playStation(active);audio.paused?audio.play():audio.pause()};$('#radioVolume').oninput=e=>audio.volume=e.target.value;
function clock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('es-ES');$('#date').textContent=d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})}setInterval(clock,1000);clock();
let v=+(localStorage.neonVisits||0)+1;localStorage.neonVisits=v;$('#visits').textContent=String(v).padStart(6,'0');
const saved=localStorage.neonTheme||'neon-dark';document.body.dataset.theme=saved;loadAds();renderThemes();renderStations();makeWave();audio.volume=.8;
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.08});$$('.reveal').forEach(e=>io.observe(e));
$('#menuToggle').onclick=()=>$('#nav').classList.toggle('open');$$('.nav-link').forEach(a=>a.onclick=()=>$('#nav').classList.remove('open'));
$$('.nav-link').forEach(a=>a.addEventListener('click',()=>$$('.nav-link').forEach(x=>x.classList.toggle('active',x===a))));

// MEDIA DOCK: archivos locales sin abandonar la página
const filePicker=$('#filePicker'),dropzone=$('#dropzone'),fileQueue=$('#fileQueue'),dockNow=$('#dockNow'),dockMeta=$('#dockMeta'),dockCover=$('#dockCover'),clearFiles=$('#clearFiles');
let localFiles=[],localObjectUrl='';
function renderFileQueue(){fileQueue.innerHTML=localFiles.map((f,i)=>`<button class="local-file ${i===0?'active':''}" data-file="${i}" type="button"><span>${f.type.startsWith('video')?'▣':f.type.startsWith('image')?'▧':'♫'}</span><b>${esc(f.name)}</b><small>${Math.round(f.size/1024)} KB</small></button>`).join('');$$('.local-file').forEach(b=>b.onclick=()=>playLocal(+b.dataset.file))}
function addLocalFiles(list){[...list].filter(f=>f.type.startsWith('audio/')||f.type.startsWith('video/')||f.type.startsWith('image/')).forEach(f=>localFiles.push(f));renderFileQueue();if(localFiles.length)playLocal(localFiles.length-1);toast(localFiles.length+' archivo(s) en Media Dock')}
function playLocal(i){const f=localFiles[i];if(!f)return;if(localObjectUrl)URL.revokeObjectURL(localObjectUrl);localObjectUrl=URL.createObjectURL(f);const player=document.querySelector('.media-player');if(f.type.startsWith('image/')){dockCover.innerHTML=`<img src="${localObjectUrl}" alt="">`;dockNow.textContent=f.name;dockMeta.textContent='Imagen local · disponible en el dock';return}dockNow.textContent=f.name;dockMeta.textContent=(f.type.startsWith('video/')?'Vídeo local':'Audio local')+' · reproducción instantánea';dockCover.innerHTML=f.type.startsWith('video/')?'<span class="dock-video">▶</span>':'<span class="dock-note">♫</span>';let media=document.querySelector('#localMedia');if(!media){media=document.createElement(f.type.startsWith('video/')?'video':'audio');media.id='localMedia';media.controls=true;media.preload='metadata';media.className='local-media';player.appendChild(media)}media.src=localObjectUrl;media.style.display='block';media.play().catch(()=>{});activityLocal()}
function activityLocal(){localStorage.neonLocalPlays=+(localStorage.neonLocalPlays||0)+1}
filePicker?.addEventListener('change',e=>addLocalFiles(e.target.files));dropzone?.addEventListener('dragover',e=>{e.preventDefault();dropzone.classList.add('dragover')});dropzone?.addEventListener('dragleave',()=>dropzone.classList.remove('dragover'));dropzone?.addEventListener('drop',e=>{e.preventDefault();dropzone.classList.remove('dragover');addLocalFiles(e.dataTransfer.files)});$('#pickFiles')?.addEventListener('click',e=>{e.preventDefault();filePicker.click()});clearFiles?.addEventListener('click',()=>{localFiles=[];fileQueue.innerHTML='';dockNow.textContent='Sin archivo seleccionado';dockMeta.textContent='Arrastra archivos para reproducirlos aquí.';if(localObjectUrl){URL.revokeObjectURL(localObjectUrl);localObjectUrl=''};const m=$('#localMedia');if(m)m.remove();toast('Media Dock limpiado')});
$('#themeCycle')?.addEventListener('click',cycleTheme);

// === MAIN MEDIA PLAYER LAB ===
const mainAudio=$('#mainAudio');let mainVideo=$('#mainVideo');const mainPicker=$('#mainFilePicker'),mainDrop=$('#mainDropzone'),mainQueue=$('#mainQueue');
let mainFiles=[],mainIndex=-1,mainObjectUrl='';
function fmtTime(sec){if(!Number.isFinite(sec))return '00:00';const m=Math.floor(sec/60),s=Math.floor(sec%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function renderMainQueue(){if(!mainQueue)return;$('#mainQueueCount').textContent=mainFiles.length;mainQueue.innerHTML=mainFiles.length?mainFiles.map((f,i)=>`<button class="main-queue-item ${i===mainIndex?'active':''}" data-main-file="${i}" type="button"><span class="q-type">${f.type.startsWith('video')?'VID':'AUD'}</span><span><b>${esc(f.name)}</b><small>${Math.max(1,Math.round(f.size/1024))} KB</small></span><span>›</span></button>`).join(''):'<p>Aún no has añadido archivos.</p>';$$('.main-queue-item').forEach(b=>b.onclick=()=>loadMainFile(+b.dataset.mainFile,true))}
function resetMainMedia(){[mainAudio,mainVideo].forEach(m=>{m.pause();m.removeAttribute('src');m.load();m.style.display='none'});$('.pro-player')?.classList.remove('video-mode','playing');if(mainObjectUrl){URL.revokeObjectURL(mainObjectUrl);mainObjectUrl=''}}
function loadMainFile(i,auto=true){const f=mainFiles[i];if(!f)return;mainIndex=i;resetMainMedia();mainObjectUrl=URL.createObjectURL(f);const isVideo=f.type.startsWith('video/'),m=isVideo?mainVideo:mainAudio;m.src=mainObjectUrl;m.style.display='block';$('.pro-player')?.classList.toggle('video-mode',isVideo);$('#mainNow').textContent=f.name;$('#mainMeta').textContent=(isVideo?'Vídeo local':'Audio local')+' · listo para probar';$('#mainCover').innerHTML=isVideo?'<video id="mainVideo" preload="metadata" playsinline></video>':'<img src="icon-192.png" alt="NEON PLAYER X">';if(isVideo){mainVideo=$('#mainVideo');mainVideo.src=mainObjectUrl;mainVideo.muted=false;mainVideo.volume=+$('#mainVolume').value;mainVideo.playbackRate=+$('#mainSpeed').value}else{mainAudio.volume=+$('#mainVolume').value;mainAudio.playbackRate=+$('#mainSpeed').value}bindMainEvents();renderMainQueue();if(auto)m.play().then(()=>$('.pro-player')?.classList.add('playing')).catch(()=>{});}
function bindMainEvents(){[mainAudio,mainVideo].forEach(m=>{m.onloadedmetadata=()=>{$('#mainDuration').textContent=fmtTime(m.duration)};m.ontimeupdate=()=>{if(m.duration){$('#mainSeek').value=(m.currentTime/m.duration)*100;$('#mainCurrent').textContent=fmtTime(m.currentTime)}};m.onplay=()=>{$('.pro-player')?.classList.add('playing');$('#mainPlay').textContent='❚❚'};m.onpause=()=>{$('.pro-player')?.classList.remove('playing');$('#mainPlay').textContent='▶'};m.onended=()=>nextMain()})}
function currentMain(){return mainFiles[mainIndex]?($('.pro-player')?.classList.contains('video-mode')?mainVideo:mainAudio):null}
function nextMain(){if(!mainFiles.length)return;let n=$('#mainShuffle').classList.contains('active')?Math.floor(Math.random()*mainFiles.length):(mainIndex+1)%mainFiles.length;loadMainFile(n,true)}
function prevMain(){if(!mainFiles.length)return;const m=currentMain();if(m&&m.currentTime>4){m.currentTime=0;return}loadMainFile((mainIndex-1+mainFiles.length)%mainFiles.length,true)}
function addMainFiles(files){const valid=[...files].filter(f=>f.type.startsWith('audio/')||f.type.startsWith('video/'));if(!valid.length)return toast('Selecciona archivos de audio o vídeo');mainFiles.push(...valid);renderMainQueue();loadMainFile(mainFiles.length-valid.length,true);toast(valid.length+' archivo(s) añadido(s) al Media Player')}
mainPicker?.addEventListener('change',e=>{addMainFiles(e.target.files);e.target.value=''});mainDrop?.addEventListener('dragover',e=>{e.preventDefault();mainDrop.classList.add('dragover')});mainDrop?.addEventListener('dragleave',()=>mainDrop.classList.remove('dragover'));mainDrop?.addEventListener('drop',e=>{e.preventDefault();mainDrop.classList.remove('dragover');addMainFiles(e.dataTransfer.files)});$('#mainPickFiles')?.addEventListener('click',()=>mainPicker.click());
$('#mainPlay')?.addEventListener('click',()=>{const m=currentMain();if(!m){if(mainFiles.length)loadMainFile(0,true);else toast('Añade música o vídeo para probar el reproductor');return}m.paused?m.play().catch(()=>{}):m.pause()});$('#mainNext')?.addEventListener('click',nextMain);$('#mainPrev')?.addEventListener('click',prevMain);$('#mainShuffle')?.addEventListener('click',e=>e.currentTarget.classList.toggle('active'));$('#mainLoop')?.addEventListener('click',e=>{e.currentTarget.classList.toggle('active');const m=currentMain();if(m)m.loop=e.currentTarget.classList.contains('active')});$('#mainSeek')?.addEventListener('input',e=>{const m=currentMain();if(m&&m.duration)m.currentTime=(+e.target.value/100)*m.duration});$('#mainVolume')?.addEventListener('input',e=>{[mainAudio,mainVideo].forEach(m=>m.volume=+e.target.value)});$('#mainSpeed')?.addEventListener('change',e=>{[mainAudio,mainVideo].forEach(m=>m.playbackRate=+e.target.value)});$('#mainFullscreen')?.addEventListener('click',()=>{const m=currentMain();if(m&&m.requestFullscreen)m.requestFullscreen().catch(()=>{})});$('#mainClearQueue')?.addEventListener('click',()=>{mainFiles=[];mainIndex=-1;resetMainMedia();$('#mainNow').textContent='NEON PLAYER X';$('#mainMeta').textContent='Añade un archivo para comenzar la prueba · audio y vídeo locales';$('#mainCurrent').textContent='00:00';$('#mainDuration').textContent='00:00';$('#mainSeek').value=0;renderMainQueue();toast('Lista de prueba limpiada')});
bindMainEvents();renderMainQueue();


// === V5.5 LIVE REWARD ENGINE ===
const rewardState={points:+(localStorage.neonPoints||0),seconds:+(localStorage.neonRewardSeconds||0),lastTick:0};
const rewardLevels=[['NOVATO',0],['EXPLORADOR',100],['NEON',300],['ELITE',700],['LEGEND',1500]];
function rewardInfo(){let idx=0;for(let i=0;i<rewardLevels.length;i++)if(rewardState.points>=rewardLevels[i][1])idx=i;const cur=rewardLevels[idx],next=rewardLevels[idx+1];const span=next?next[1]-cur[1]:1;const pct=next?Math.min(100,Math.round((rewardState.points-cur[1])/span*100)):100;return {idx,cur,next,pct}}
function saveReward(){localStorage.neonPoints=rewardState.points;localStorage.neonRewardSeconds=rewardState.seconds}
function renderRewards(){const info=rewardInfo();const min=Math.floor(rewardState.seconds/60);$('#neonPoints')&&($('#neonPoints').textContent=rewardState.points.toLocaleString('es-ES'));$('#neonLevel')&&($('#neonLevel').textContent=info.cur[0]+' · '+info.pct+'%');$('#rewardPointsBig')&&($('#rewardPointsBig').textContent=rewardState.points.toLocaleString('es-ES'));$('#rewardLevel')&&($('#rewardLevel').textContent=info.cur[0]);$('#rewardLevelName')&&($('#rewardLevelName').textContent=info.cur[0]);$('#rewardLevelBadge')&&($('#rewardLevelBadge').textContent=String(info.idx+1).padStart(2,'0'));$('#rewardMinutes')&&($('#rewardMinutes').textContent=min.toLocaleString('es-ES'));$('#rewardNext')&&($('#rewardNext').textContent=info.next?String(info.next[1]-rewardState.points):'∞');$('#rewardProgress')&&($('#rewardProgress').style.width=info.pct+'%');$('#rewardActivity')&&($('#rewardActivity').textContent=(rewardState.points?'Sistema activo · '+rewardState.points+' puntos acumulados.':'Activa la radio o el Media Player para comenzar.'))}
function rewardTick(){const radioOn=audio&&!audio.paused&&!audio.ended;const mainOn=typeof currentMain==='function'&&currentMain()&&!currentMain().paused&&!currentMain().ended;if(!document.hidden&&(radioOn||mainOn)){rewardState.seconds++;if(rewardState.seconds%60===0){rewardState.points++;saveReward();renderRewards();toast('+1 punto NEON · actividad de reproducción')}}}
setInterval(rewardTick,1000);renderRewards();updateEvolution();

// === V5.5 PHANTOM / SOLANA HUB ===
function shortWallet(a){return a?a.slice(0,4)+'…'+a.slice(-4):''}
async function connectPhantom(){const btn=$('#connectPhantom'),status=$('#walletStatus'),addr=$('#walletAddress');const provider=window.phantom?.solana||window.solana;if(!provider||!provider.isPhantom){toast('Phantom no está disponible en este navegador');if(addr)addr.textContent='Instala o abre Phantom para conectar la wallet.';return}try{btn&&(btn.disabled=true,btn.textContent='CONECTANDO…');const res=await provider.connect();const pub=res?.publicKey?.toString?.()||provider.publicKey?.toString?.();if(pub){localStorage.neonWalletConnected='1';localStorage.neonWalletAddress=pub;status&&(status.textContent='PHANTOM CONECTADA');addr&&(addr.textContent=shortWallet(pub)+' · Solana · conexión activa');toast('Phantom conectada correctamente')}}catch(e){toast('Conexión Phantom cancelada');}finally{btn&&(btn.disabled=false,btn.textContent='CONECTAR PHANTOM')}}
$('#connectPhantom')?.addEventListener('click',connectPhantom);
async function disconnectPhantom(){const provider=window.phantom?.solana||window.solana;try{await provider?.disconnect?.()}catch(e){}localStorage.removeItem('neonWalletConnected');localStorage.removeItem('neonWalletAddress');if($('#walletStatus'))$('#walletStatus').textContent='PHANTOM NO CONECTADA';if($('#walletAddress'))$('#walletAddress').textContent='Puedes conectar tu wallet desde este dispositivo.';toast('Phantom desconectada');}
window.neonDisconnectPhantom=disconnectPhantom;
(function restoreWallet(){const a=localStorage.neonWalletAddress;if(a&&$('#walletStatus')){$('#walletStatus').textContent='PHANTOM CONECTADA';$('#walletAddress').textContent=shortWallet(a)+' · Solana · conexión guardada en este dispositivo'}})();

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
