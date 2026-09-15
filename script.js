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
 function orbFrame(now){if(!orb||!oCtx)return;const dt=Math.min(.035,(now-t||16)/1000);t=now;life+=dt; if(Math.random()<.008)pick();let ax=(target.x-x)*.18,ay=(target.y-y)*.18;vx+=ax*dt;vy+=ay*dt;vx*=.992;vy*=.992;x+=vx; y+=vy; const r=orb.clientWidth/2;x=Math.max(r,Math.min(innerWidth-r,x));y=Math.max(r,Math.min(innerHeight-r,y));if(x<=r||x>=innerWidth-r)vx*=-.65;if(y<=r||y>=innerHeight-r)vy*=-.65;trail.push({x,y,a:1});const max=18+Math.min(42,Math.floor(life/25));if(trail.length>max)trail.splice(0,trail.length-max);oCtx.clearRect(0,0,orb.clientWidth,orb.clientHeight);const c=mood();trail.forEach((p,i)=>{const a=(i/trail.length)*.32;oCtx.globalAlpha=a;oCtx.fillStyle=c;oCtx.beginPath();oCtx.arc(p.x-x+orb.clientWidth/2,p.y-y+orb.clientHeight/2,1.2+(i/trail.length)*2,0,Math.PI*2);oCtx.fill()});oCtx.globalAlpha=1;const g=oCtx.createRadialGradient(19,19,1,19,19,18);g.addColorStop(0,'#fff');g.addColorStop(.18,c);g.addColorStop(.5,c);g.addColorStop(1,'transparent');oCtx.fillStyle=g;oCtx.shadowBlur=15+studioGlow*5;oCtx.shadowColor=c;oCtx.beginPath();oCtx.arc(19,19,11+Math.sin(now/230)*1.2,0,Math.PI*2);oCtx.fill();oCtx.shadowBlur=0;if(life>75){for(let i=0;i<3;i++){const a=now/900+i*2.1;oCtx.fillStyle=c;oCtx.beginPath();oCtx.arc(19+Math.cos(a)*14,19+Math.sin(a)*14,1.2,0,Math.PI*2);oCtx.fill()}}orb.style.transform=`translate3d(${x-19}px,${y-19}px,0) scale(${Math.hypot(vx,vy)>5?.72:1})`;requestAnimationFrame(orbFrame)}
 orb?.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};orb.setPointerCapture?.(e.pointerId)});orb?.addEventListener('pointerup',e=>{if(!down)return;const dt=Math.max(16,performance.now()-down.time),dx=e.clientX-down.x,dy=e.clientY-down.y,impact=Math.hypot(dx,dy)/dt;hits++;window.__neonOrbHitHook?.();if(impact>.8){vx-=dx*.12;vy-=dy*.12}else{vx-=dx*.035||.6;vy-=dy*.035||-.5}target={x:x-vx*18,y:y-vy*18};trail.push({x,y,a:1});down=null});window.addEventListener('resize',resizeOrb);resizeOrb();pick();requestAnimationFrame(orbFrame);
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
    if($('#evoRewardLevel')){const total=Number(localStorage.neonOrbHits||0)+Number(localStorage.neonLocalPlays||0);$('#evoRewardLevel').textContent='NIVEL '+Math.max(1,1+Math.floor(total/10));$('#evoRewardMeta').textContent=total+' interacciones registradas.'}
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
