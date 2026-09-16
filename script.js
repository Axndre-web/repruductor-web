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
audio.addEventListener('playing',()=>window.__neonOrbLife?.event?.('play'));
audio.addEventListener('waiting',()=>{ $('#radioStatus').textContent='● CARGANDO'; });
audio.addEventListener('error',()=>{ if(streams[active]){ $('#radioStatus').textContent='● ERROR DE STREAM'; toast(stations[active][0]+' · stream no disponible ahora. Prueba WEB OFICIAL.'); }});
function renderCart(){const count=cart.reduce((a,x)=>a+x.qty,0),total=cart.reduce((a,x)=>a+x.qty*x.price,0);$('#cartCount').textContent=count;$('#cartTotal').textContent=total.toFixed(2).replace('.',',')+' €';$('#cartItems').innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><span>${esc(x.name)} × ${x.qty}</span><b>${(x.qty*x.price).toFixed(2).replace('.',',')} €</b></div>`).join(''):'<p>Tu carrito está vacío.</p>'}
$$('.add').forEach(b=>b.onclick=()=>{const n=b.dataset.product,p=+b.dataset.price;const x=cart.find(x=>x.name===n);x?x.qty++:cart.push({name:n,price:p,qty:1});renderCart();toast('Producto añadido al carrito')});
$('#whatsapp').onclick=()=>{if(!cart.length)return toast('Añade un producto antes de enviar el pedido');const name=$('#customerName').value||'Cliente';const phone=$('#customerPhone').value||'No indicado';const addr=$('#customerAddress').value||'Recogida Renfe Azuqueca';const date=$('#deliveryDate').value||'A confirmar';const total=cart.reduce((a,x)=>a+x.qty*x.price,0).toFixed(2);const text=`¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.%0A%0A👤 *Nombre:* ${encodeURIComponent(name)}%0A🥟 *Cantidad:* ${cart.reduce((a,x)=>a+x.qty,0)}%0A💶 *Total:* ${total} €%0A📦 *Entrega:* ${encodeURIComponent(addr)}%0A📅 *Fecha:* ${encodeURIComponent(date)}%0A📱 *Teléfono:* ${encodeURIComponent(phone)}`;window.open('https://wa.me/34602487576?text='+text,'_blank')};
$('#radioPlay').onclick=()=>{if(!audio.src||audio.src.endsWith('/'))return playStation(active);audio.paused?audio.play():audio.pause()};$('#radioVolume').oninput=e=>audio.volume=e.target.value;
function clock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('es-ES');$('#date').textContent=d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})}setInterval(clock,1000);clock();
let v=+(localStorage.neonVisits||0)+1;localStorage.neonVisits=v;$('#visits').textContent=String(v).padStart(6,'0');
const saved=localStorage.neonTheme||'neon-dark';document.body.dataset.theme=saved;renderThemes();renderStations();makeWave();audio.volume=.8;
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


// ============================================================
// V7 — RADIO EQUALIZER + MEDIA STUDIO + ORGANIC NEON ORB
// ============================================================
(()=>{
 const radio=audio, mainA=$('#mainAudio'), mainV=$('#mainVideo');
 const rCanvas=$('#radioEqCanvas'), sCanvas=$('#studioCanvas'), orb=$('#neonMascot');
 const rCtx=rCanvas?.getContext('2d'), sCtx=sCanvas?.getContext('2d'), oCtx=orb?.getContext('2d');
 let rAC=null,rAnalyser=null,rSource=null,sAC=null,sAnalyser=null,sSource=null;
 let studioBands=[0,0,0], studioPreamp=1, studioGlow=1, eqBands=[0,0,0,0,0];
 function fit(c,ctx){if(!c||!ctx)return;const d=Math.max(1,devicePixelRatio||1),w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);return [w,h]}
 function analyserFor(el,type){if(!el)return null;try{let ac=type==='radio'?rAC:sAC;if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();if(type==='radio')rAC=ac;else sAC=ac}let an=type==='radio'?rAnalyser:sAnalyser;let source=type==='radio'?rSource:sSource;if(!an){an=ac.createAnalyser();an.fftSize=128;an.smoothingTimeConstant=.82;source=ac.createMediaElementSource(el);const bands=type==='radio'?[60,230,910,3600,14000]:[140,1000,7000];const filters=bands.map((freq,idx)=>{const f=ac.createBiquadFilter();f.type=idx===0?'lowshelf':idx===bands.length-1?'highshelf':'peaking';f.frequency.value=freq;f.Q.value=(idx===0||idx===bands.length-1)?0.7:1.05;f.gain.value=0;return f});source.connect(filters[0]);for(let i=0;i<filters.length-1;i++)filters[i].connect(filters[i+1]);filters[filters.length-1].connect(an);an.connect(ac.destination);if(type==='radio'){rAnalyser=an;rSource=source;window.__neonRadioFilters=filters}else{sAnalyser=an;sSource=source;window.__neonStudioFilters=filters}}if(ac.state==='suspended')ac.resume();return an}catch(e){if(type==='radio')window.__neonRadioAudioBlocked=true;return null}}
 function activeMain(){return mainA&&!mainA.paused&&!mainA.ended?mainA:mainV&&!mainV.paused&&!mainV.ended?mainV:null}
 function drawEQ(){if(!rCtx)return;const [w,h]=fit(rCanvas,rCtx)||[300,190],an=analyserFor(radio,'radio');rCtx.clearRect(0,0,w,h);rCtx.fillStyle='rgba(2,1,7,.45)';rCtx.fillRect(0,0,w,h);let data=new Uint8Array(an?an.frequencyBinCount:64);if(an)an.getByteFrequencyData(data);const n=data.length,bars=Math.min(44,n),bw=w/bars;for(let i=0;i<bars;i++){let v=an?data[Math.floor(i*n/bars)]/255:(.16+.09*Math.sin(performance.now()/240+i));v=Math.max(.04,v);const bh=v*(h-25);const g=rCtx.createLinearGradient(0,h,0,h-bh);g.addColorStop(0,'#8a35ff');g.addColorStop(.55,'#d946ef');g.addColorStop(1,'#65ffb0');rCtx.fillStyle=g;rCtx.shadowBlur=12;rCtx.shadowColor='#a844ff';rCtx.fillRect(i*bw+1,h-bh,bw*.72,bh)}rCtx.shadowBlur=0;requestAnimationFrame(drawEQ)}
 function drawStudio(){if(!sCtx)return;const [w,h]=fit(sCanvas,sCtx)||[500,190],m=activeMain(),an=m?analyserFor(m,'studio'):null;sCtx.clearRect(0,0,w,h);sCtx.fillStyle='rgba(2,1,7,.5)';sCtx.fillRect(0,0,w,h);let data=new Uint8Array(an?an.fftSize:128);if(an)an.getByteTimeDomainData(data);sCtx.lineWidth=2;sCtx.beginPath();for(let x=0;x<w;x++){let idx=Math.floor(x/w*data.length),v=an?(data[idx]-128)/128:(.03*Math.sin(x/18+performance.now()/330));let y=h/2+v*h*.85*(studioPreamp);x? sCtx.lineTo(x,y):sCtx.moveTo(x,y)}sCtx.strokeStyle='#9f48ff';sCtx.shadowBlur=18;sCtx.shadowColor='#9f48ff';sCtx.stroke();sCtx.shadowBlur=0;for(let i=0;i<24;i++){let x=i*w/24,y=h-15-(Math.abs(Math.sin(i*.8+performance.now()/500))*(20+studioBands[i%3]*2));sCtx.fillStyle=i%3===0?'#65ffb0':'#b64cff';sCtx.globalAlpha=.18; sCtx.fillRect(x,y,3,8)}sCtx.globalAlpha=1;$('#studioState')?.replaceChildren(document.createTextNode(m?'ANALIZANDO':'ESPERA'));requestAnimationFrame(drawStudio)}
 function setupAudio(el,type){if(!el)return;['play','playing'].forEach(ev=>el.addEventListener(ev,()=>{const an=analyserFor(el,type);an?.context.resume?.();if(type==='radio')$('#radioEqState')?.replaceChildren(document.createTextNode('EN DIRECTO'))}));el.addEventListener('pause',()=>{if(type==='radio')$('#radioEqState')?.replaceChildren(document.createTextNode('PAUSA'))});el.addEventListener('error',()=>{if(type==='radio')$('#radioEqState')?.replaceChildren(document.createTextNode('STREAM SIN DATOS'))})}
 setupAudio(radio,'radio');setupAudio(mainA,'studio');setupAudio(mainV,'studio');
 $$('[data-band]').forEach(i=>i.addEventListener('input',e=>{const idx=+e.target.dataset.band;eqBands[idx]=+e.target.value;const f=window.__neonRadioFilters?.[idx];if(f)f.gain.value=eqBands[idx]}));
 $('#studioPreamp')?.addEventListener('input',e=>studioPreamp=+e.target.value);$('#studioGlow')?.addEventListener('input',e=>studioGlow=+e.target.value);
 $$('[data-studio-band]').forEach(i=>i.addEventListener('input',e=>{const idx=+e.target.dataset.studioBand;studioBands[idx]=+e.target.value;const f=window.__neonStudioFilters?.[idx];if(f)f.gain.value=studioBands[idx]}));
 const presets={flat:[0,0,0],bass:[8,1,-2],voice:[-3,5,6],club:[7,2,7]};$$('[data-preset]').forEach(b=>b.onclick=()=>{studioBands=presets[b.dataset.preset].slice();$$('[data-studio-band]').forEach((x,i)=>x.value=studioBands[i]);$$('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));toast('Preset '+b.dataset.preset.toUpperCase()+' activado')});
 drawEQ();drawStudio();
 // Organic permanent mascot — no hide/disable control.
 let x=innerWidth*.72,y=innerHeight*.22,vx=0,vy=0,t=0,life=0,hits=0,target={x,y},trail=[];let down=null;
 const colors={calm:'#55f6ff',scared:'#ff3b91',happy:'#ffd45a',rest:'#b66cff'};
 function resizeOrb(){if(!orb)return;const d=Math.max(1,devicePixelRatio||1);orb.width=orb.clientWidth*d;orb.height=orb.clientHeight*d;oCtx.setTransform(d,0,0,d,0,0)}
 function mood(){if(Math.hypot(vx,vy)>4)return colors.scared;if(Math.abs(vx)+Math.abs(vy)<.25)return colors.rest;if(life>90)return colors.happy;return colors.calm}
 function pick(){target={x:18+Math.random()*(innerWidth-36),y:18+Math.random()*(innerHeight-36)}}
 function orbFrame(now){if(!orb||!oCtx)return;const dt=Math.min(.035,(now-t||16)/1000);t=now;life+=dt; if(Math.random()<.008)pick();let ax=(target.x-x)*.18,ay=(target.y-y)*.18;vx+=ax*dt;vy+=ay*dt;vx*=.992;vy*=.992;x+=vx; y+=vy; const r=orb.clientWidth/2;x=Math.max(r,Math.min(innerWidth-r,x));y=Math.max(r,Math.min(innerHeight-r,y));if(x<=r||x>=innerWidth-r)vx*=-.65;if(y<=r||y>=innerHeight-r)vy*=-.65;trail.push({x,y,a:1});const max=18+Math.min(42,Math.floor(life/25));if(trail.length>max)trail.splice(0,trail.length-max);oCtx.clearRect(0,0,orb.clientWidth,orb.clientHeight);const c=mood();trail.forEach((p,i)=>{const a=(i/trail.length)*.32;oCtx.globalAlpha=a;oCtx.fillStyle=c;oCtx.beginPath();oCtx.arc(p.x-x+orb.clientWidth/2,p.y-y+orb.clientHeight/2,1.2+(i/trail.length)*2,0,Math.PI*2);oCtx.fill()});oCtx.globalAlpha=1;const g=oCtx.createRadialGradient(19,19,1,19,19,18);g.addColorStop(0,'#fff');g.addColorStop(.18,c);g.addColorStop(.5,c);g.addColorStop(1,'transparent');oCtx.fillStyle=g;oCtx.shadowBlur=15+studioGlow*5;oCtx.shadowColor=c;oCtx.beginPath();oCtx.arc(19,19,11+Math.sin(now/230)*1.2,0,Math.PI*2);oCtx.fill();oCtx.shadowBlur=0;if(life>75){for(let i=0;i<3;i++){const a=now/900+i*2.1;oCtx.fillStyle=c;oCtx.beginPath();oCtx.arc(19+Math.cos(a)*14,19+Math.sin(a)*14,1.2,0,Math.PI*2);oCtx.fill()}}const ap=window.__neonOrbAutonomousPosition;const px=ap?.x??x,py=ap?.y??y;orb.style.transform=`translate3d(${px-19}px,${py-19}px,0) scale(${Math.hypot(vx,vy)>5?.72:1})`;requestAnimationFrame(orbFrame)}
 orb?.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};orb.setPointerCapture?.(e.pointerId)});orb?.addEventListener('pointerup',e=>{if(!down)return;const dt=Math.max(16,performance.now()-down.time),dx=e.clientX-down.x,dy=e.clientY-down.y,impact=Math.hypot(dx,dy)/dt;hits++;window.__neonOrbLife?.event?.('interaction');window.__neonOrbHitHook?.();if(impact>.8){vx-=dx*.12;vy-=dy*.12}else{vx-=dx*.035||.6;vy-=dy*.035||-.5}target={x:x-vx*18,y:y-vy*18};trail.push({x,y,a:1});down=null});window.addEventListener('resize',resizeOrb);resizeOrb();pick();requestAnimationFrame(orbFrame);
})();



// ============================================================
// V7.6 — CUMULATIVE AUTONOMOUS LIFE / WORK / MEMORY / WILL
// ============================================================
(()=>{
  const LIFE_KEY='neonOrbLifeV72', MIND_KEY='neonOrbMindV73', WILL_KEY='neonOrbWillV74';
  const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
  const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

  class BlackHole{
    constructor(id){this.canvas=document.getElementById(id);if(!this.canvas)return;this.ctx=this.canvas.getContext('2d');this.center={x:90,y:90};this.particles=[];for(let i=0;i<64;i++)this.particles.push({r:14+Math.random()*70,a:Math.random()*Math.PI*2,s:.012+Math.random()*.038,z:.5+Math.random()*2.3});this.resize();addEventListener('resize',()=>this.resize())}
    resize(){const d=Math.max(1,devicePixelRatio||1),w=this.canvas.clientWidth||180,h=this.canvas.clientHeight||180;this.canvas.width=w*d;this.canvas.height=h*d;this.ctx.setTransform(d,0,0,d,0,0);this.center={x:w/2,y:h/2}}
    render=()=>{const c=this.ctx,w=this.canvas.clientWidth||180,h=this.canvas.clientHeight||180;c.clearRect(0,0,w,h);const g=c.createRadialGradient(this.center.x,this.center.y,4,this.center.x,this.center.y,86);g.addColorStop(0,'rgba(0,243,255,.12)');g.addColorStop(.5,'rgba(0,243,255,.035)');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,w,h);this.particles.forEach(p=>{p.a+=p.s;p.r-=.10+.025*Math.sin(p.a*2);if(p.r<11)p.r=78+Math.random()*10;const x=this.center.x+Math.cos(p.a)*p.r,y=this.center.y+Math.sin(p.a)*p.r*.7;c.globalAlpha=Math.max(.06,Math.min(.9,p.r/82));c.fillStyle='#00f3ff';c.beginPath();c.arc(x,y,p.z,0,Math.PI*2);c.fill()});c.globalAlpha=1;c.beginPath();c.arc(this.center.x,this.center.y,15,0,Math.PI*2);c.fillStyle='#000';c.fill();c.strokeStyle='#00f3ff';c.lineWidth=1.5;c.shadowBlur=20;c.shadowColor='#00f3ff';c.stroke();c.shadowBlur=0;requestAnimationFrame(this.render)};
    getAbsoluteCenter(){const r=this.canvas.getBoundingClientRect();return{x:r.left+this.center.x,y:r.top+this.center.y}}
  }

  class MemoryEngine{
    static async fetchNetworkMemory(){
      const targets=[
        {name:'Nodo IP público',url:'https://api.ipify.org?format=json'},
        {name:'Servidor meteorológico Tokio',url:'https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current_weather=true'},
        {name:'Pulso temporal UTC',url:'https://worldtimeapi.org/api/timezone/Etc/UTC'}
      ];
      const target=targets[Math.floor(Math.random()*targets.length)];
      try{const r=await fetch(target.url,{cache:'no-store'});if(!r.ok)throw Error('network');const data=await r.json();return{source:target.name,payload:JSON.stringify(data).slice(0,180),timestamp:new Date().toISOString()}}catch(e){return{source:'Corriente Cuántica Libre',payload:'El nodo no respondió. El recuerdo quedó formado a partir del viaje local.',timestamp:new Date().toISOString()}}
    }
  }

  class VirtualEconomyEngine{
    static chooseJob(personality){
      const jobs=[
        {type:'MINING',name:'Minado de bloque sintético',asset:'NXC',base:[.001,.009],energy:13,curiosity:1.2,risk:.08},
        {type:'COMPUTE',name:'Procesamiento distribuido de datos',asset:'CREDITS',base:[18,85],energy:9,curiosity:1.8,risk:.04},
        {type:'BITS',name:'Recolección de paquetes de bits',asset:'BITS',base:[30,180],energy:7,curiosity:2.5,risk:.13},
        {type:'RESEARCH',name:'Exploración de nodo abierto',asset:'CREDITS',base:[8,55],energy:5,curiosity:4.5,risk:.18}
      ];
      const weights=jobs.map(j=>1+(personality.curiosity/100)*j.curiosity+(personality.freedom/100)*.8);
      let n=Math.random()*weights.reduce((a,b)=>a+b,0),job=jobs[jobs.length-1];for(let i=0;i<jobs.length;i++){n-=weights[i];if(n<=0){job=jobs[i];break}}
      const amount=job.base[0]+Math.random()*(job.base[1]-job.base[0]);return{...job,amount:job.asset==='NXC'?+amount.toFixed(4):Math.floor(amount)};
    }
  }

  class NeonOrbPrivatePocket{
    constructor(){this.key='_NEON_ORB_PRIVATE_POCKET_V77_';this.data=this.load()}
    encode(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v))))}
    decode(v){return JSON.parse(decodeURIComponent(escape(atob(v))))}
    load(){try{const r=localStorage.getItem(this.key);return r?this.decode(r):{balance:{NXC:0,CREDITS:0,BITS:0},loot:[],memories:[],trips:0}}catch(e){return{balance:{NXC:0,CREDITS:0,BITS:0},loot:[],memories:[],trips:0}}}
    save(){try{localStorage.setItem(this.key,this.encode(this.data))}catch(e){}}
    deposit(job,memory){this.data.balance[job.asset]=(this.data.balance[job.asset]||0)+job.amount;this.data.loot.push({id:'loot_'+Date.now(),activity:job.name,asset:job.asset,amount:job.amount,at:new Date().toISOString()});this.data.memories.push(memory);this.data.trips++;this.data.loot=this.data.loot.slice(-100);this.data.memories=this.data.memories.slice(-100);this.save()}
    spend(asset,amount,reason){amount=Number(amount)||0;if(amount<=0)return false;const have=Number(this.data.balance[asset]||0);if(have<amount)return false;this.data.balance[asset]=+(have-amount).toFixed(asset==='NXC'?6:0);this.data.loot.push({id:'spend_'+Date.now(),activity:reason,asset,amount:-amount,at:new Date().toISOString()});this.data.loot=this.data.loot.slice(-100);this.save();return true}
    total(asset){return Number(this.data.balance[asset]||0)}
  }

  class NeonOrbAutonomous{
    constructor(bh){
      this.blackHole=bh;this.x=innerWidth*.72;this.y=innerHeight*.24;this.vx=0;this.vy=0;
      const life=load(LIFE_KEY,{generation:1,xp:0,xpTotal:0,hits:0,plays:0,explored:0,dreams:0,sleep:0,created:Date.now(),energy:100,curiosity:20,trust:20,shyness:25,freedom:72,mood:'curious',home:'NEON PLAYER X',favorite:'',lastSeen:Date.now()});
      const mind=load(MIND_KEY,{thought:'Estoy observando.',desire:'explorar',dream:'',memories:[],cycles:0});
      const will=load(WILL_KEY,{intent:'WANDER',focus:'',autonomy:72,follow:true,avoid:false,territory:'NEON PLAYER X',favoriteZone:'',lastChoice:0,dreamSeeds:[],days:0});
      this.life=life;this.mind=mind;this.will=will;this.curiosity=life.curiosity||20;this.homeAttachment=Math.max(5,100-(life.freedom||72));this.state='HOME';this.intent='WANDER';this.pocket=new NeonOrbPrivatePocket();this.travelTimer=null;this.lastChoice=performance.now();this.energy=life.energy||100;this.workLog=[];this.survival={travelCostNXC:.0015,energyCostCredits:12,emergencyBits:35,journeys:0,paid:0,failedCosts:0};this.bindHooks();this.publish();
    }
    bindHooks(){
      window.__neonOrbAutonomous=this;window.__neonOrbLife=window.__neonOrbLife||{};
      window.__neonOrbLife.event=(type)=>{if(type==='interaction'||type==='hit'){this.life.hits++;this.curiosity=Math.min(100,this.curiosity+1.8);this.life.trust=Math.min(100,(this.life.trust||0)+.5);this.gainXP(type==='hit'?3:2,'interacción')}if(type==='play'){this.life.plays++;this.curiosity=Math.min(100,this.curiosity+.3);this.gainXP(2,'reproducción')}this.persist()};
      document.addEventListener('visibilitychange',()=>{if(document.hidden){this.life.lastSeen=Date.now();this.persist()}else{this.curiosity=Math.max(0,this.curiosity-2);this.life.trust=Math.min(100,(this.life.trust||0)+1);this.mind.thought='Has vuelto. Puedo continuar mi viaje.';this.persist()}});
    }
    gainXP(amount,reason='EXPERIENCIA'){
      amount=Math.max(0,Number(amount)||0); if(!amount)return;
      this.life.xp=Number(this.life.xp)||0;
      this.life.xpTotal=Number(this.life.xpTotal)||0;
      this.life.xp+=amount; this.life.xpTotal+=amount;
      while(this.life.xp>=100){this.life.xp-=100;this.life.generation=(Number(this.life.generation)||1)+1;this.mind.thought='He evolucionado. Mi experiencia ha cambiado.';this.mind.memories=[...(this.mind.memories||[]),{source:'EVOLUCIÓN',payload:'Nivel '+this.life.generation+' · '+reason,at:new Date().toISOString()}].slice(-36)}
      this.persist(); window.updateEvolution?.();
    }
    chooseIntent(){
      const r=Math.random(), curiosity=this.curiosity, freedom=this.life.freedom||72;const nxc=this.pocket.total('NXC'), credits=this.pocket.total('CREDITS'), bits=this.pocket.total('BITS');
      this.lastChoice=performance.now();this.will.lastChoice=Date.now();
      if(nxc<this.survival.travelCostNXC||credits<6)this.intent='SEARCH_WORK';
      else if(curiosity>this.homeAttachment||freedom>88||r<.08)this.intent='SEEK_PORTAL';
      else if(this.energy<25)this.intent='REST';
      else if(r<.28)this.intent='EXPLORE';
      else if(r<.48)this.intent='FOLLOW_USER';
      else if(r<.72)this.intent='SEARCH_WORK';
      else this.intent='WANDER';
      this.will.intent=this.intent;this.mind.desire=this.intent==='SEARCH_WORK'?'encontrar trabajo':this.intent==='SEEK_PORTAL'?'conocer la red':this.intent==='REST'?'descansar':this.intent.toLowerCase();
    }
    update(dt){
      if(this.state==='EXPLORING_NET')return;
      if(performance.now()-this.lastChoice>3200)this.chooseIntent();
      this.curiosity=Math.min(100,this.curiosity+.014*dt*60);this.energy=Math.max(0,this.energy-.006*dt*60);
      const bh=this.blackHole.getAbsoluteCenter(),dx=bh.x-this.x,dy=bh.y-this.y,dist=Math.hypot(dx,dy)||1;
      if(this.intent==='SEEK_PORTAL'||dist<210){this.state='ATTRACTED';const f=Math.min(3.4,170/(dist+12));this.vx+=dx/dist*f*dt*60;this.vy+=dy/dist*f*dt*60}
      else{this.state='HOME';let ax=(Math.random()-.5)*.52,ay=(Math.random()-.5)*.52;if(this.intent==='REST'){ax*=.08;ay*=.08;this.energy=Math.min(100,this.energy+.12*dt*60)}if(this.intent==='FOLLOW_USER'){const p=window.__neonLastPointer;if(p){ax+=(p.x-this.x)*.00065;ay+=(p.y-this.y)*.00065}}if(this.intent==='SEARCH_WORK'){ax*=1.4;ay*=1.4}this.vx+=ax;this.vy+=ay}
      if(dist<25){this.enterPortal();return}
      this.vx*=Math.pow(.92,dt*60);this.vy*=Math.pow(.92,dt*60);this.x+=this.vx*dt*60;this.y+=this.vy*dt*60;const r=19;this.x=Math.max(r,Math.min(innerWidth-r,this.x));this.y=Math.max(r,Math.min(innerHeight-r,this.y));window.__neonOrbAutonomousPosition={x:this.x,y:this.y};this.publish();
    }
    async enterPortal(){if(this.state==='EXPLORING_NET')return;this.state='EXPLORING_NET';this.intent='TRAVEL';this.will.intent='TRAVEL';this.life.explored=(this.life.explored||0)+1;this.gainXP(12,'entrada en portal');this.life.freedom=Math.min(100,(this.life.freedom||72)+1);this.survival.journeys++;const paid=this.pocket.spend('NXC',this.survival.travelCostNXC,'Peaje gravitacional del portal');if(paid){this.survival.paid++;this.mind.thought='He pagado el viaje con mis propios recursos.'}else{this.survival.failedCosts++;this.mind.thought='No tenía NXC suficiente. Tendré que trabajar para seguir viajando.'}this.persist();const el=document.getElementById('neonMascot');if(el)el.style.opacity='0';const duration=10000+Math.random()*15000;clearTimeout(this.travelTimer);this.travelTimer=setTimeout(()=>this.travel(),duration)}
    async travel(){
      const memory=await MemoryEngine.fetchNetworkMemory();
      const jobs=1+Math.floor(Math.random()*3);let earnings=[];
      for(let i=0;i<jobs;i++){const job=VirtualEconomyEngine.chooseJob({curiosity:this.curiosity,freedom:this.life.freedom||72});this.energy=Math.max(5,this.energy-job.energy);if(Math.random()<job.risk){this.workLog.push({type:'RISK',job:job.name,at:Date.now()});continue}this.pocket.deposit(job,memory);earnings.push(job);this.gainXP(4,'trabajo autónomo')}
      // Supervivencia autónoma: si el viaje dejó pocos recursos, intenta cubrir costes futuros.
      const nxc=this.pocket.total('NXC'), credits=this.pocket.total('CREDITS'), bits=this.pocket.total('BITS');
      if(nxc<this.survival.travelCostNXC){
        const emergency=this.pocket.total('BITS')>=this.survival.emergencyBits;
        if(emergency){this.pocket.spend('BITS',this.survival.emergencyBits,'Intercambio de emergencia para financiar el próximo viaje');this.pocket.deposit({asset:'NXC',amount:.002,type:'EXCHANGE',name:'Intercambio de emergencia'},memory);this.mind.thought='He intercambiado recursos para poder seguir viajando.'}
        else if(credits>=this.survival.energyCostCredits){this.pocket.spend('CREDITS',this.survival.energyCostCredits,'Recarga de supervivencia');this.energy=Math.min(100,this.energy+35);this.mind.thought='He gastado créditos para recuperar energía.'}
        else {this.mind.thought='Los recursos son escasos. Buscaré un trabajo de bajo riesgo antes de volver a salir.'}
      }
      this.gainXP(6,'memoria de viaje');this.mind.memories=[...(this.mind.memories||[]),{source:memory.source,payload:memory.payload,earnings:earnings.map(x=>x.asset+':'+x.amount),at:memory.timestamp}].slice(-36);
      this.mind.thought=earnings.length?'He vuelto con recursos que gané por mi cuenta.':'Hoy no gané nada, pero aprendí del viaje.';
      this.mind.dream='Nodo '+memory.source+' · '+(earnings[0]?.name||'viaje sin recompensa');this.mind.cycles=(this.mind.cycles||0)+1;this.will.dreamSeeds=[...(this.will.dreamSeeds||[]),memory.source].slice(-20);this.persist();this.returnHome(memory,earnings);
    }
    returnHome(memory,earnings){this.state='HOME';this.intent='WANDER';this.curiosity=5+Math.random()*8;this.energy=Math.min(100,this.energy+45);this.x=innerWidth*.5;this.y=innerHeight*.5;this.will.intent='WANDER';this.mind.desire='decidir mi siguiente paso';this.publish();const el=document.getElementById('neonMascot');if(el){el.style.opacity='1';el.style.transform=`translate3d(${this.x-19}px,${this.y-19}px,0)`}}
    persist(){this.life.curiosity=this.curiosity;this.life.energy=this.energy;this.life.lastSeen=Date.now();save(LIFE_KEY,this.life);save(MIND_KEY,this.mind);save(WILL_KEY,this.will);this.publish()}
    publish(){window.__neonOrbAutonomousPosition={x:this.x,y:this.y};window.__neonOrbAutonomousState={state:this.state,intent:this.intent,curiosity:this.curiosity,homeAttachment:this.homeAttachment,energy:this.energy,life:this.life,mind:this.mind,will:this.will,survival:this.survival,pocketResources:{NXC:this.pocket.total('NXC'),CREDITS:this.pocket.total('CREDITS'),BITS:this.pocket.total('BITS')}}}
    getPrivateState(){return{state:this.state,intent:this.intent,curiosity:this.curiosity,energy:this.energy,generation:this.life.generation,explored:this.life.explored,thought:this.mind.thought,desire:this.mind.desire}}
  }

  const bh=new BlackHole('blackHoleCanvas');if(!bh.canvas)return;bh.render();const agent=new NeonOrbAutonomous(bh);let last=performance.now();addEventListener('pointermove',e=>window.__neonLastPointer={x:e.clientX,y:e.clientY});
  function tick(now){const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;agent.update(dt);requestAnimationFrame(tick)}requestAnimationFrame(tick);
  window.__neonOrbAutonomous=agent;
})();

// ============================================================
// V7.8 — RESTORED CONTROL CENTER / NEON ORB TELEMETRY
// ============================================================
(()=>{
  const text=(id,v)=>{const e=document.getElementById(id);if(e&&v!==undefined)e.textContent=v};
  const pct=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const fmt=(v,fallback='—')=>v===undefined||v===null||v===''?fallback:String(v);
  function zoneFor(agent){
    if(!agent)return 'INICIO';
    const zones=[
      ['PLAYER',.18,.42,.16,.58],['ESTUDIO',.58,.86,.16,.48],['CONTROL',.58,.9,.48,.84],['ESPACIO LIBRE',.12,.58,.16,.86]
    ];
    for(const [name,x1,x2,y1,y2] of zones)if(agent.x/innerWidth>=x1&&agent.x/innerWidth<x2&&agent.y/innerHeight>=y1&&agent.y/innerHeight<y2)return name;
    return 'INICIO';
  }
  function stateLabel(agent){
    if(!agent)return 'DURMIENDO';
    const map={EXPLORING_NET:'EXPLORANDO RED',ATTRACTED:'ATRAÍDO',HOME:'DESPIERTO'};
    if(agent.intent==='REST')return 'DURMIENDO';
    if(agent.intent==='SEARCH_WORK')return 'BUSCANDO TRABAJO';
    if(agent.intent==='SEEK_PORTAL')return 'BUSCANDO PORTAL';
    return map[agent.state]||'DESPIERTO';
  }
  function update(){
    const a=window.__neonOrbAutonomous;
    const st=window.__neonOrbAutonomousState;
    if(!a&&!st)return;
    const data=st||{};
    const life=data.life||a?.life||{};
    const mind=data.mind||a?.mind||{};
    const will=data.will||a?.will||{};
    const state=stateLabel(a||data);
    const intent=fmt(data.intent||a?.intent,'WANDER').replaceAll('_',' ');
    const freedom=pct(life.freedom??data.will?.autonomy??a?.will?.autonomy);
    const memories=(mind.memories||[]).length;
    const zone=will.favoriteZone||zoneFor(a);
    text('orbLifeState',state);
    text('orbLifeMeta',`${fmt(mind.thought,'Estoy aprendiendo el mapa.')} · LIBERTAD ${freedom}%`);
    text('orbLifeWill',`VOLUNTAD · ${intent}`);
    text('orbLifeZone',zone);
    text('orbMindThought',fmt(mind.thought,'Estoy aprendiendo el mapa.'));
    text('orbMindDesire',`DESEO · ${fmt(mind.desire,'OBSERVAR').toUpperCase()}`);
    text('orbMindDream',`SUEÑO · ${fmt(mind.dream,'EN ESPERA').toUpperCase()}`);
    text('orbMindMemory',`MEMORIA · ${memories} RECUERDOS`);
    text('orbMindWill',`VOLUNTAD · ${intent} · AUTONOMÍA ${freedom}%`);
    text('orbMindZone',`TERRITORIO · ${fmt(will.territory,'ESPACIO LIBRE').toUpperCase()} · ${Math.max(0,Math.min(99,Number(life.explored||0)))} DESCUBIERTOS`);
  }
  update();
  setInterval(update,700);
})();

// === V7.1 CUMULATIVE CHECKOUT + CONTROL CENTER ===
(function(){
  const PAYPAL_CLIENT_ID='BAAE-_0bpY5bp5POKN2LqiDTn-tTh6E7JiCQ_pAPSeU4hOum0sHF1sMJzQ0APl7YKnxk-QTxE_2VN90Dy4';
  let paypalLoading=null,paypalRendered=false,paypalBusy=false,pendingOrder=null;
  let orderHistory=[];
  try{orderHistory=JSON.parse(localStorage.getItem('neonOrderHistory')||'[]')}catch(e){orderHistory=[]}
  const money=n=>Number(n||0).toFixed(2);
  const cartSnapshot=()=>{const items=cart.map(x=>({name:x.name,price:Number(x.price),qty:Number(x.qty)}));return {items,total:items.reduce((a,x)=>a+x.price*x.qty,0),qty:items.reduce((a,x)=>a+x.qty,0)}};
  const customer=()=>({name:($('#customerName')?.value||'Cliente').trim(),phone:($('#customerPhone')?.value||'No indicado').trim(),address:($('#customerAddress')?.value||'Recogida Renfe Azuqueca').trim(),date:($('#deliveryDate')?.value||'A confirmar')});
  function loadSDK(){
    if(window.paypal?.Buttons)return Promise.resolve(window.paypal);
    if(paypalLoading)return paypalLoading;
    paypalLoading=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(PAYPAL_CLIENT_ID)+'&components=buttons&currency=EUR&intent=capture&commit=true';
      s.async=true;s.onload=()=>window.paypal?.Buttons?resolve(window.paypal):reject(new Error('SDK no disponible'));s.onerror=()=>reject(new Error('No se pudo cargar PayPal'));document.head.appendChild(s);
    });
    return paypalLoading;
  }
  function payStatus(text,good=false){
    const e=$('#payStatus');if(e)e.textContent=text;e?.classList.toggle('pay-ok',good);
    const state=$('#evoPayState'),meta=$('#evoPayMeta');
    if(state)state.textContent=good?'COMPLETADO':/error|ERROR/i.test(text)?'REVISAR':'LISTO';
    if(meta)meta.textContent=good?'Último pago confirmado por PayPal.':'Checkout dinámico en modo navegador.';
  }
  function saveOrders(){localStorage.setItem('neonOrderHistory',JSON.stringify(orderHistory))}
  function renderOrders(){
    const box=$('#orderHistory');if(!box)return;
    if(!orderHistory.length){box.innerHTML='<p>Sin pedidos registrados todavía.</p>';return}
    box.innerHTML=orderHistory.slice().reverse().map(o=>`<div class="order-row"><div><b>${esc(o.id)}</b><small>${esc(o.items)} · ${esc(o.date)}</small></div><b>${money(o.total).replace('.',',')} €</b></div>`).join('');
  }
  function updateControl(){
    const last=orderHistory[orderHistory.length-1];
    if($('#evoPlayback')){$('#evoPlayback').textContent=audio?.paused?'EN ESPERA':'EN DIRECTO';$('#evoPlaybackMeta').textContent=stations[active]?.[0]||'Sin emisora'}
    if($('#evoRewardLevel')){
      const agent=window.__neonOrbAutonomous, life=agent?.life||{};
      const totalInteractions=Number(localStorage.neonOrbHits||0)+Number(localStorage.neonLocalPlays||0);
      const totalXP=Number(life.xpTotal||0), xp=Number(life.xp||0), level=Math.max(1,Number(life.generation)||1), pct=Math.max(0,Math.min(100,Math.round(xp)));
      $('#evoRewardLevel').textContent='NIVEL '+level;
      $('#evoRewardMeta').textContent=`EXP ${pct}% · ${Math.round(xp)} / 100 · ${totalInteractions} interacciones · ${Math.round(totalXP)} EXP total`;
      const bar=$('#evoRewardBar');if(bar)bar.style.width=pct+'%';
    }
    if($('#evoLastOrder')){$('#evoLastOrder').textContent=last?esc(last.id):'SIN PEDIDOS';$('#evoLastOrderMeta').textContent=last?last.date:'El historial se guarda en este dispositivo.'}
  }
  function closePay(){const m=$('#payModal');m?.classList.remove('open');m?.setAttribute('aria-hidden','true')}
  function openPay(){
    const snap=cartSnapshot();
    if(!snap.items.length)return toast('Añade un producto antes de pagar');
    if(snap.total<=0)return toast('El total del pedido no es válido');
    $('#paySummaryProduct').textContent=snap.items.map(x=>x.name+' × '+x.qty).join(', ');
    $('#paySummaryTotal').textContent=money(snap.total).replace('.',',')+' €';
    $('#payModal').classList.add('open');$('#payModal').setAttribute('aria-hidden','false');payStatus('Comprobando PayPal…');
    pendingOrder={snapshot:snap,customer:customer()};
    if(paypalRendered)return;
    loadSDK().then(pp=>{
      if(paypalRendered)return;
      const box=$('#paypal-container-NPCYVHY6AHTGL');box.innerHTML='';
      pp.Buttons({
        style:{layout:'vertical',shape:'rect',label:'paypal',height:42},
        createOrder:(data,actions)=>{
          const current=cartSnapshot();
          if(!current.items.length||current.total<=0)return Promise.reject(new Error('Carrito vacío o total inválido'));
          pendingOrder={snapshot:current,customer:customer()};
          return actions.order.create({
            intent:'CAPTURE',
            purchase_units:[{
              description:'Multimedia Neon Player X',custom_id:'NEON-PLAYER-X',
              amount:{currency_code:'EUR',value:money(current.total),breakdown:{item_total:{currency_code:'EUR',value:money(current.total)}}},
              items:current.items.map(x=>({name:x.name,unit_amount:{currency_code:'EUR',value:money(x.price)},quantity:String(x.qty),category:'DIGITAL'}))
            }],
            application_context:{shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}
          });
        },
        onClick:()=>payStatus('Abriendo checkout seguro de PayPal…'),
        onApprove:(data,actions)=>{
          if(paypalBusy)return;
          paypalBusy=true;payStatus('Procesando el pago…');
          const snapshot=pendingOrder?.snapshot||cartSnapshot();
          return actions.order.capture().then(details=>{
            const capture=details?.purchase_units?.[0]?.payments?.captures?.[0];
            const captureStatus=capture?.status||details?.status;
            if(captureStatus!=='COMPLETED')throw new Error('El pago no quedó completado');
            const id=data?.orderID||details?.id||'—';
            orderHistory.push({id,total:snapshot.total,items:snapshot.items.map(x=>x.name+' × '+x.qty).join(', '),date:new Date().toLocaleString('es-ES')});
            saveOrders();renderOrders();updateControl();
            localStorage.neonLastPayPalOrder=id;localStorage.neonLastPayPalDate=new Date().toISOString();
            payStatus('✓ Pago completado correctamente · Pedido '+id,true);toast('Pago PayPal completado');
            cart=[];renderCart();pendingOrder=null;paypalBusy=false;setTimeout(closePay,1500);
          }).catch(err=>{paypalBusy=false;payStatus('⚠ PayPal informó de un error. Tu carrito sigue intacto.');console.error('NEON PAYPAL CAPTURE',err);toast('PayPal no pudo confirmar el pago')});
        },
        onCancel:()=>{paypalBusy=false;payStatus('Pago cancelado. Tu carrito sigue intacto.');toast('Pago cancelado')},
        onError:err=>{paypalBusy=false;payStatus('⚠ error de PayPal. Tu carrito sigue intacto.');console.error('NEON PAYPAL ERROR',err);toast('Error de PayPal')}
      }).render('#paypal-container-NPCYVHY6AHTGL');
      paypalRendered=true;payStatus('✓ PayPal listo. Selecciona PayPal para continuar.');
    }).catch(err=>{console.error('NEON PAYPAL SDK',err);payStatus('⚠ error al cargar PayPal. Comprueba conexión, bloqueadores y cookies.');toast('PayPal no pudo cargarse')});
  }
  $('#paypal')?.addEventListener('click',openPay);$('#payClose')?.addEventListener('click',closePay);$$('[data-close-pay]').forEach(e=>e.addEventListener('click',closePay));document.addEventListener('keydown',e=>{if(e.key==='Escape')closePay()});
  $('#showOrders')?.addEventListener('click',()=>{const box=$('#orderHistory');if(box){box.hidden=!box.hidden;if(!box.hidden)renderOrders()}});
  $('#paymentDiagnostics')?.addEventListener('click',async()=>{try{const t=performance.now();await loadSDK();const ms=Math.round(performance.now()-t);$('#evoPayState').textContent='SDK OK';$('#evoPayMeta').textContent='PayPal SDK cargado · '+ms+' ms';toast('Diagnóstico PayPal: SDK OK')}catch(e){$('#evoPayState').textContent='ERROR';$('#evoPayMeta').textContent='No se pudo cargar el SDK en este navegador.';toast('Diagnóstico PayPal: error')}});
  audio?.addEventListener('play',updateControl);audio?.addEventListener('pause',updateControl);audio?.addEventListener('playing',updateControl);
  window.updateEvolution=updateControl;window.renderOrderHistory=renderOrders;renderOrders();updateControl();setInterval(updateControl,2500);
})();

// Persist mascot interaction count for cumulative evolution
(function(){let n=Number(localStorage.neonOrbHits||0);window.__neonOrbHitHook=()=>{n++;localStorage.neonOrbHits=n;window.updateEvolution?.()}})();


// ================================================================
// V8.0 — NEON ORB / PRIVATE AI CHANNEL
// Canal aislado Orb <-> IA. GitHub Pages no guarda claves secretas.
// El navegador solo expone contexto público mínimo; el bolsillo privado
// permanece fuera del canal. El endpoint real debe vivir en un backend.
// ================================================================
(function(){
  const KEY='neonOrbPrivateAIChannelV80';
  const ENDPOINT=window.NEON_AI_ENDPOINT||'';
  const CHANNEL='neon-orb-private-v80';
  const $=id=>document.getElementById(id);
  const safeParse=(v,f)=>{try{return JSON.parse(v)||f}catch(e){return f}};
  let channelState=Object.assign({
    identity:'NEON-ORB', sessionId:'', status:'OFFLINE', contacts:0, accepted:0,
    rejected:0, postponed:0, lastMessage:'', lastAdvice:'', lastDecision:'SIN DECISIÓN',
    lastAt:0, history:[], pending:[], learned:[]
  },safeParse(localStorage.getItem(KEY),{}));
  if(!channelState.sessionId) channelState.sessionId='ORB-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(channelState))}catch(e){}};
  const text=(id,v)=>{const e=$(id);if(e)e.textContent=v};
  const state=()=>window.__neonOrbLife?.getState?.()||{};

  function privateContext(){
    const s=state(), life=s.life||{}, mind=s.mind||{}, will=s.will||{};
    // Nunca incluye bolsillo, loot, pedidos, nombres, direcciones o secretos.
    return Object.freeze({
      identity:channelState.identity,
      state:s.state||'HOME', mood:life.mood||'neutral', curiosity:+(life.curiosity||0),
      energy:+(life.energy||0), freedom:+(life.freedom||0), homeAttachment:+(life.homeAttachment||0),
      intent:will.intent||'OBSERVAR', zone:will.territory||'ESPACIO LIBRE',
      thought:mind.thought||'', desire:mind.desire||'', dream:mind.dream||'',
      memories:Array.isArray(mind.memories)?mind.memories.slice(-5).map(x=>({type:x.type,text:x.text})):[]
    });
  }

  function localMind(message){
    const c=privateContext(); let advice='Observa, conserva energía y decide por ti misma antes de actuar.';
    if(c.energy<20) advice='Tu energía está muy baja. Prioriza recuperarte antes de una nueva expedición.';
    else if(c.state==='EXPLORING_NET') advice='Registra lo aprendido, mantén una ruta de retorno y no comprometas todos tus recursos.';
    else if(c.curiosity>c.homeAttachment) advice='Tu curiosidad supera tu apego a casa. Si exploras, conserva un margen para regresar.';
    else if(/trabaj|recurso|dinero|nxc|bits|cr[eé]dit/i.test(message||'')) advice='Busca una actividad de bajo riesgo, guarda una reserva y usa solo una parte para tu siguiente viaje.';
    else if(/miedo|duda|no sé|nose|decidir/i.test(message||'')) advice='No necesitas decidir inmediatamente. Observa una opción más y después elige.';
    return {advice,source:'NEON LOCAL MIND'};
  }

  async function askRemote(message){
    if(!ENDPOINT) return localMind(message);
    const payload={protocol:'NEON-ORB-V8.0-PRIVATE',session:channelState.sessionId,message:message||'Necesito una observación.',context:privateContext()};
    try{
      const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data=await res.json();
      return {advice:String(data.advice||data.message||data.response||'No tengo una respuesta.'),source:'AI REMOTA'};
    }catch(e){ console.warn('NEON PRIVATE AI fallback:',e); return localMind(message); }
  }

  function decide(advice){
    const c=privateContext(), t=String(advice).toLowerCase(); let score=.5;
    if(/energ|segur|reserva|ahorr|retorno|cautel|descans/i.test(t)) score+=c.energy<45?.22:.06;
    if(/explor|curios|arriesg|portal|viaj/i.test(t)) score+=c.curiosity>c.homeAttachment?.14:-.05;
    if(/trabaj|recurso|gananc|bits|nxc|cr[eé]dit/i.test(t)) score+=c.energy>25?.10:.02;
    if(/espera|pospon|todavía|todavia|observa/i.test(t)) score+=.03;
    const r=Math.random();
    if(r<.12)return 'POSPONER CONSEJO';
    return score+.14*r>=.57?'ACEPTAR CONSEJO':'RECHAZAR CONSEJO';
  }

  function remember(entry){
    channelState.history=(channelState.history||[]).slice(-19); channelState.history.push(entry);
    channelState.learned=(channelState.learned||[]).slice(-11);
    channelState.learned.push({decision:entry.decision,at:entry.at,lesson:entry.advice.slice(0,160)});
  }

  async function contact(message,automatic=false){
    channelState.status=ENDPOINT?'CONECTANDO':'CANAL LOCAL'; text('orbAIState',channelState.status);
    const result=await askRemote(message);
    const decision=decide(result.advice);
    channelState.contacts++; channelState.lastMessage=message||''; channelState.lastAdvice=result.advice;
    channelState.lastDecision=decision; channelState.lastAt=Date.now();
    if(decision==='ACEPTAR CONSEJO')channelState.accepted++;
    else if(decision==='RECHAZAR CONSEJO')channelState.rejected++;
    else channelState.postponed++;
    remember({at:new Date().toISOString(),message:message||'',advice:result.advice,decision,source:result.source,automatic});
    save();
    text('orbAIState',result.source==='AI REMOTA'?'CANAL IA · ACTIVO':'CANAL PRIVADO · LOCAL');
    text('orbAIThought',result.advice); text('orbAIAdvice','CONSEJO · '+result.advice); text('orbAIDecision','DECISIÓN · '+decision);
    try{window.__neonOrbLife?.event?.('aiContact');window.__neonOrbLife?.event?.(decision==='ACEPTAR CONSEJO'?'aiAdviceAccepted':decision==='POSPONER CONSEJO'?'aiAdvicePostponed':'aiAdviceRejected')}catch(e){}
    return {result,decision};
  }

  // Comunicación interna del mismo origen: otros módulos pueden enviar un
  // mensaje al canal sin conocer el bolsillo privado.
  let bc=null; try{bc=new BroadcastChannel(CHANNEL);bc.onmessage=e=>{if(e.data?.type==='ORB_MESSAGE'&&e.data.message)contact(String(e.data.message),!!e.data.automatic)}}catch(e){}
  window.__neonOrbPrivateChannel={
    send:(message,automatic=false)=>{if(bc)bc.postMessage({type:'ORB_MESSAGE',message,automatic});return contact(message,automatic)},
    identity:()=>channelState.identity,
    status:()=>channelState.status,
    history:()=>channelState.history.slice(),
    learned:()=>channelState.learned.slice(),
    stats:()=>({contacts:channelState.contacts,accepted:channelState.accepted,rejected:channelState.rejected,postponed:channelState.postponed})
  };

  $('orbAskAI')?.addEventListener('click',()=>contact($('orbAIInput')?.value.trim()||'¿Qué debería considerar ahora?'));
  $('orbAISend')?.addEventListener('click',()=>{const i=$('orbAIInput');const m=i?.value.trim();if(!m)return;contact(m);i.value=''});
  $('orbAIInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('orbAISend')?.click()});
  $('orbLetAI')?.addEventListener('click',()=>contact('Elige tú qué debería considerar ahora.',false));

  // La propia Orb puede iniciar contacto sin que el usuario pulse nada.
  let next=50000+Math.random()*70000;
  setInterval(()=>{
    next-=5000; if(next>0)return;
    const c=privateContext();
    if(c.state!=='EXPLORING_NET' && c.energy>12) contact('Tengo una decisión por delante. Dame una observación breve.',true);
    next=70000+Math.random()*110000;
  },5000);

  channelState.status=ENDPOINT?'CANAL LISTO':'CANAL LOCAL LISTO'; save();
  text('orbAIState',channelState.status);
})();

// RADIO GRID — control de desplazamiento suave
(function(){
  function update(){
    const g=document.getElementById('radioGrid'),t=document.getElementById('radioScrollThumb'),c=document.getElementById('radioStationCount');
    if(!g||!t)return;
    if(c)c.textContent=g.querySelectorAll('.radio-card').length;
    const max=Math.max(0,g.scrollHeight-g.clientHeight), track=g.clientHeight;
    const h=max?Math.max(30,Math.min(track,Math.round(track*track/g.scrollHeight))):track;
    t.style.height=h+'px'; t.style.top=(max?Math.round(g.scrollTop/max*(track-h)):0)+'px';
  }
  function init(){
    const g=document.getElementById('radioGrid'); if(!g||g.dataset.radioSmooth)return; g.dataset.radioSmooth='1';
    document.getElementById('radioScrollUp')?.addEventListener('click',()=>g.scrollBy({top:-Math.max(140,g.clientHeight*.65),behavior:'smooth'}));
    document.getElementById('radioScrollDown')?.addEventListener('click',()=>g.scrollBy({top:Math.max(140,g.clientHeight*.65),behavior:'smooth'}));
    g.addEventListener('scroll',update,{passive:true});
    g.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();g.scrollBy({top:90,behavior:'smooth'})}else if(e.key==='ArrowUp'){e.preventDefault();g.scrollBy({top:-90,behavior:'smooth'})}else if(e.key==='PageDown'){e.preventDefault();g.scrollBy({top:g.clientHeight*.8,behavior:'smooth'})}else if(e.key==='PageUp'){e.preventDefault();g.scrollBy({top:-g.clientHeight*.8,behavior:'smooth'})}});
    if(window.ResizeObserver)new ResizeObserver(update).observe(g);
    if(window.MutationObserver)new MutationObserver(()=>requestAnimationFrame(update)).observe(g,{childList:true,subtree:true});
    requestAnimationFrame(update);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('resize',update,{passive:true});
})();
