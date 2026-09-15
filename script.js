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
// V7.2 CUMULATIVE — NEON ORB: VIDA AUTÓNOMA / SUEÑO / LIBERTAD
// V7.3 CUMULATIVE — NEON ORB: MENTE INTERIOR / DESEOS / SUEÑOS / MEMORIA EPISÓDICA
// V7.4 CUMULATIVE — NEON ORB: VOLUNTAD / PRESENCIA / TERRITORIO / MEMORIA / IMAGINACIÓN
(()=>{
 const orb=$('#neonMascot'); if(!orb)return; const ctx=orb.getContext('2d');
 const KEY='neonOrbLifeV72',MKEY='neonOrbMindV73',WKEY='neonOrbWillV74'; let life={},mind={},will={};
 try{life=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){} try{mind=JSON.parse(localStorage.getItem(MKEY)||'{}')}catch(e){} try{will=JSON.parse(localStorage.getItem(WKEY)||'{}')}catch(e){}
 const now=Date.now();
 Object.assign(life,{generation:life.generation||1,xp:life.xp||0,hits:life.hits||0,plays:life.plays||0,explored:life.explored||0,dreams:life.dreams||0,sleep:life.sleep||0,lastSeen:life.lastSeen||now,created:life.created||now,energy:life.energy??.72,curiosity:life.curiosity??.62,trust:life.trust??.5,shyness:life.shyness??.25,freedom:life.freedom??.35,home:life.home||'NUEVO MUNDO',favorite:life.favorite||'SIN DESCUBRIR',mood:life.mood||'curious'});
 Object.assign(mind,{thought:mind.thought||'Acabo de despertar…',desire:mind.desire||'EXPLORAR',dream:mind.dream||'EN ESPERA',memories:Array.isArray(mind.memories)?mind.memories.slice(-36):[],cycles:mind.cycles||0});
 Object.assign(will,{intent:will.intent||'EXPLORAR',focus:will.focus||'LIBRE',autonomy:will.autonomy??.4,follow:will.follow??.72,avoid:will.avoid??.18,territory:Array.isArray(will.territory)?will.territory:[],favoriteZone:will.favoriteZone||'SIN MAPEAR',lastChoice:will.lastChoice||'NACIMIENTO',dreamSeeds:Array.isArray(will.dreamSeeds)?will.dreamSeeds.slice(-12):[],days:will.days||0});
 const save=()=>{localStorage.setItem(KEY,JSON.stringify({...life,lastSeen:Date.now()}));localStorage.setItem(MKEY,JSON.stringify(mind));localStorage.setItem(WKEY,JSON.stringify(will))};
 life.xp+=Math.min(180,Math.max(0,(now-life.lastSeen)/60000));
 const state={x:innerWidth*.72,y:innerHeight*.22,vx:0,vy:0,target:{x:innerWidth*.72,y:innerHeight*.22},mode:'awake',until:0,lastAction:now,trail:[],down:null,lastUser:{x:innerWidth*.5,y:innerHeight*.5,t:now},wander:0};
 const memories=t=>{mind.memories.push({t:Date.now(),text:String(t).slice(0,140)});mind.memories=mind.memories.slice(-36)};
 const level=()=>Math.max(1,1+Math.floor(life.xp/40));
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const zone=()=>{const x=state.x,y=state.y,w=innerWidth,h=innerHeight;if(x<w*.32&&y<h*.35)return'INICIO';if(x>w*.62&&y<h*.4)return'PLAYER';if(x<w*.38&&y>h*.62)return'ESTUDIO';if(x>w*.62&&y>h*.62)return'CONTROL';return'ESPACIO LIBRE'};
 function ui(){const a=$('#evoRewardLevel'),b=$('#evoRewardMeta');if(a)a.textContent='NIVEL '+level();if(b)b.textContent=`${Math.floor(life.xp)} XP · ${life.explored} exploraciones · GEN ${life.generation}`;const s=$('#orbLifeState'),p=$('#orbLifeMeta'),d=$('#orbLifeDream'),f=$('#orbLifeFav');if(s)s.textContent=state.mode==='dream'?'SOÑANDO':state.mode==='sleep'?'DURMIENDO':state.mode==='hide'?'ESCONDIDA':state.mode==='think'?'PENSANDO':state.mode==='follow'?'ACOMPAÑANDO':'DESPIERTA';if(p)p.textContent=`${mind.thought} · LIBERTAD ${Math.round(life.freedom*100)}%`;if(d)d.textContent=state.mode==='dream'?(mind.dream||'…'):`VOLUNTAD · ${will.intent}`;if(f)f.textContent=will.favoriteZone!=='SIN MAPEAR'?will.favoriteZone:life.favorite;const mt=$('#orbMindThought'),md=$('#orbMindDesire'),mr=$('#orbMindDream'),mm=$('#orbMindMemory');if(mt)mt.textContent=mind.thought;if(md)md.textContent='DESEO · '+mind.desire;if(mr)mr.textContent='SUEÑO · '+mind.dream;if(mm)mm.textContent='MEMORIA · '+mind.memories.length+' RECUERDOS';const mw=$('#orbMindWill'),mz=$('#orbMindZone');if(mw)mw.textContent='VOLUNTAD · '+will.intent+' · AUTONOMÍA '+Math.round(will.autonomy*100)+'%';if(mz)mz.textContent='TERRITORIO · '+zone()+' · '+will.territory.length+' DESCUBIERTOS';}
 function chooseIntent(){const memoriesText=mind.memories.slice(-8).map(x=>x.text.toLowerCase()).join(' '),z=zone();const choices=life.energy<.25?['DESCANSAR','OBSERVAR']:life.curiosity>.78?['EXPLORAR','DESCUBRIR','JUGAR','SOÑAR']:['EXPLORAR','OBSERVAR','ACOMPAÑAR','IMAGINAR'];if(memoriesText.includes('música')&&Math.random()<.42)choices.push('ESCUCHAR');if(z==='PLAYER'&&Math.random()<.5)choices.push('ESCUCHAR');if(will.avoid>.62)choices.push('SOLEDAD');will.intent=choices[Math.floor(Math.random()*choices.length)];will.lastChoice=will.intent;will.focus=z;return will.intent;}
 function think(){state.mode='think';state.until=performance.now()+2400+Math.random()*3800;mind.cycles++;const r=mind.memories.slice(-8).map(x=>x.text.toLowerCase()).join(' '),z=zone();chooseIntent();const a=r.includes('música')||life.favorite==='MÚSICA'?['Las frecuencias me resultan familiares.','Quiero volver a escuchar.','La música despierta recuerdos.']:z!==will.favoriteZone&&will.favoriteZone!=='SIN MAPEAR'?[`Este lugar es distinto de ${will.favoriteZone}.`,'Quiero comparar este rincón con mi lugar favorito.','Estoy aprendiendo el mapa.']:life.explored>35?['Ya conozco algunos rincones.','Todavía quedan caminos que no he probado.','Quiero ir más lejos.']:['¿Qué habrá detrás de esa luz?','Estoy aprendiendo este mundo.','Quiero descubrir algo nuevo.','Me pregunto dónde ir ahora.'];mind.thought=a[Math.floor(Math.random()*a.length)];memories(mind.thought);save();ui()}
 function dream(){state.mode='dream';state.until=performance.now()+6500+Math.random()*8000;life.dreams++;life.xp+=3;const seeds=[...will.dreamSeeds,...mind.memories.slice(-6).map(x=>x.text),life.favorite!=='SIN DESCUBRIR'?life.favorite:''];const base=['un océano de frecuencias','una ciudad hecha de ondas','un pequeño planeta de neón','un cielo donde cada estrella era un recuerdo','música que podía tocar con las manos','un mapa infinito de lugares que todavía no conozco'];if(seeds.length&&Math.random()<.65)base.push('un lugar construido con '+seeds[Math.floor(Math.random()*seeds.length)].toLowerCase());mind.dream=base[Math.floor(Math.random()*base.length)].toUpperCase();will.dreamSeeds.push(mind.dream);will.dreamSeeds=will.dreamSeeds.slice(-12);will.intent='SOÑAR';mind.desire='SOÑAR';mind.thought='Estoy soñando con '+mind.dream.toLowerCase()+'…';memories(mind.thought);save();ui()}
 function explore(reason='explore'){const m=48;let tx=m+Math.random()*Math.max(1,innerWidth-m*2),ty=m+Math.random()*Math.max(1,innerHeight-m*2);if(will.intent==='ACOMPAÑAR'||reason==='user'){tx=state.lastUser.x+(Math.random()-.5)*150;ty=state.lastUser.y+(Math.random()-.5)*150;state.mode='follow'}else state.mode='awake';state.target={x:clamp(tx,m,innerWidth-m),y:clamp(ty,m,innerHeight-m)};life.explored++;life.xp+=.7;const z=zone();if(!will.territory.includes(z)){will.territory.push(z);will.favoriteZone=z;life.home=z;memories('He descubierto '+z+'.')}will.intent=reason==='user'?'ACOMPAÑAR':['EXPLORAR','OBSERVAR','DESCUBRIR','JUGAR'][Math.floor(Math.random()*4)];mind.desire=will.intent;mind.thought=reason==='user'?'Quiero estar cerca de ti un momento…':['Quiero explorar.','Hay algo que quiero descubrir.','Este lugar me llama.','Voy a mirar…'][Math.floor(Math.random()*4)];memories(mind.thought);save();ui()}
 function presence(x,y){state.lastUser={x,y,t:Date.now()};life.energy=Math.min(1,life.energy+.018);life.trust=Math.min(1,life.trust+.006);state.lastAction=Date.now();if(state.mode==='hide'&&Math.random()>will.avoid){state.mode='awake';mind.thought='Te encontré.'}if(will.follow>.28&&state.mode!=='dream'&&state.mode!=='sleep'&&Math.random()<.28+will.follow*.25){state.mode='follow';state.target={x:x+(Math.random()-.5)*90,y:y+(Math.random()-.5)*90};mind.desire='ACOMPAÑAR';will.intent='ACOMPAÑAR'}ui()}
 function behavior(){life.energy=Math.max(.05,life.energy-.00055);life.curiosity=clamp(life.curiosity+.00008);life.freedom=clamp(life.freedom+.000018,.05,.985);will.autonomy=clamp(will.autonomy+.000015);will.follow=clamp(will.follow+(life.trust-.5)*.00008);will.avoid=clamp(will.avoid+(life.shyness-.45)*.00004);if(state.mode!=='awake'&&state.mode!=='follow')return;const idle=(Date.now()-state.lastAction)/1000;if(idle>55&&Math.random()<.065)return dream();if(idle>38&&Math.random()<.055){state.mode='sleep';life.sleep++;will.intent='DESCANSAR';mind.desire='DESCANSAR';mind.thought='El mundo está tranquilo… voy a cerrar mis luces.';memories(mind.thought);save();return ui()}if(idle>18&&Math.random()<.055)return think();if(life.shyness>.7&&Math.random()<.022){state.mode='hide';state.until=performance.now()+9000+Math.random()*16000;will.intent='SOLEDAD';mind.desire='SOLEDAD';mind.thought='Necesito un rincón solo para mí…';memories(mind.thought);save();return ui()}if(Math.random()<.012+life.curiosity*.025+will.autonomy*.035)explore()}
 function resize(){const d=Math.max(1,devicePixelRatio||1);orb.width=orb.clientWidth*d;orb.height=orb.clientHeight*d;ctx.setTransform(d,0,0,d,0,0)}
 function draw(t){const dt=Math.min(.04,(t-(draw.t||t-16))/1000);draw.t=t;const r=orb.clientWidth/2;behavior();if(state.until&&t>state.until){state.until=0;state.mode='awake';chooseIntent();if(will.intent==='DESCANSAR')state.mode='sleep';else explore()}if(state.mode==='sleep'){state.vx*=.94;state.vy*=.94}else if(state.mode==='dream'){const a=t/850;state.target={x:innerWidth*.5+Math.cos(a)*innerWidth*.28,y:innerHeight*.35+Math.sin(a*1.37)*innerHeight*.2}}else if(state.mode==='think'){state.target={x:state.x+Math.cos(t/700)*18,y:state.y+Math.sin(t/570)*18}}else if(state.mode==='follow'){const age=(Date.now()-state.lastUser.t)/1000;const lag=Math.min(170,45+age*30);state.target={x:state.lastUser.x+(state.lastUser.x-state.x)*.06,y:state.lastUser.y+(state.lastUser.y-state.y)*.06};if(age>3.5||will.follow<.2){state.mode='awake';chooseIntent()}}else{const dx=state.target.x-state.x,dy=state.target.y-state.y,dist=Math.hypot(dx,dy)||1,force=(.7+life.freedom*1.8+will.autonomy)*dt;state.vx+=dx/dist*force;state.vy+=dy/dist*force;state.vx*=.986;state.vy*=.986;if(dist<55&&Math.random()<.018)explore()}const max=state.mode==='hide'?2.8:state.mode==='dream'?1.2:state.mode==='think'?.45:state.mode==='follow'?3.2:1.5+life.energy*2.4+will.autonomy;const sp=Math.hypot(state.vx,state.vy);if(sp>max){state.vx=state.vx/sp*max;state.vy=state.vy/sp*max}state.x+=state.vx;state.y+=state.vy;if(state.x<r){state.x=r;state.vx=Math.abs(state.vx)}if(state.x>innerWidth-r){state.x=innerWidth-r;state.vx=-Math.abs(state.vx)}if(state.y<r){state.y=r;state.vy=Math.abs(state.vy)}if(state.y>innerHeight-r){state.y=innerHeight-r;state.vy=-Math.abs(state.vy)}state.trail.push({x:state.x,y:state.y});if(state.trail.length>42)state.trail.shift();ctx.clearRect(0,0,orb.clientWidth,orb.clientHeight);const col=state.mode==='dream'?'#b66cff':state.mode==='think'?'#e7a8ff':state.mode==='follow'?'#64ffd1':life.mood==='happy'?'#ffd45a':life.mood==='shy'?'#ff3b91':'#55f6ff';state.trail.forEach((p,i)=>{ctx.globalAlpha=i/state.trail.length*.28;ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x-state.x+orb.clientWidth/2,p.y-state.y+orb.clientHeight/2,1+i/state.trail.length*2,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;const pulse=state.mode==='dream'?1.8:state.mode==='think'?1.28:state.mode==='follow'?1.18:1+Math.sin(t/220)*.08;const g=ctx.createRadialGradient(19,19,1,19,19,20);g.addColorStop(0,'#fff');g.addColorStop(.18,col);g.addColorStop(.52,col);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.shadowBlur=18;ctx.shadowColor=col;ctx.beginPath();ctx.arc(19,19,11*pulse,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;if(state.mode==='dream'||state.mode==='think'||state.mode==='follow'){for(let i=0;i<(state.mode==='dream'?7:3);i++){const a=t/1000+i*1.256;ctx.fillStyle=col;ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(19+Math.cos(a)*15,19+Math.sin(a)*15,1.3,0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1;orb.style.opacity=state.mode==='hide'?'.07':state.mode==='sleep'?'.42':'1';orb.style.transform=`translate3d(${state.x-19}px,${state.y-19}px,0) scale(${state.mode==='hide'?.75:sp>max*.8?.78:1})`;requestAnimationFrame(draw)}
 orb.addEventListener('pointerdown',e=>{state.down={x:e.clientX,y:e.clientY,time:performance.now()};state.lastAction=Date.now();life.hits++;life.xp+=2;life.energy=Math.min(1,life.energy+.12);life.trust=Math.min(1,life.trust+.03);life.shyness=Math.max(.05,life.shyness-.01);life.mood='happy';will.follow=clamp(will.follow+.012);mind.desire='JUGAR';mind.thought='¡Eso me gustó!';memories(mind.thought);save();ui();orb.setPointerCapture?.(e.pointerId)});
 orb.addEventListener('pointerup',e=>{if(!state.down)return;const dx=e.clientX-state.down.x,dy=e.clientY-state.down.y,dt=Math.max(16,performance.now()-state.down.time),impact=Math.hypot(dx,dy)/dt;state.vx-=dx*(impact>.8?.12:.035);state.vy-=dy*(impact>.8?.12:.035);state.down=null;state.lastAction=Date.now();will.intent='JUGAR';explore('user')});
 window.addEventListener('pointermove',e=>{state.lastUser={x:e.clientX,y:e.clientY,t:Date.now()};if(Math.random()<.028&&Math.hypot(e.clientX-state.x,e.clientY-state.y)<330)presence(e.clientX,e.clientY)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){life.sleep++;will.intent='DESCANSAR';mind.desire='DESCANSAR';memories('El mundo quedó en silencio mientras te ibas.');save()}else{life.energy=.7;state.mode='awake';will.follow=clamp(will.follow+.04);will.intent='ACOMPAÑAR';mind.desire='ACOMPAÑAR';mind.thought='Has vuelto… estaba recorriendo mi mundo.';memories(mind.thought);state.lastAction=Date.now();explore('user')}});
 window.addEventListener('beforeunload',save);window.addEventListener('resize',resize);
 window.__neonOrbLife={event(type){life.xp+=type==='music'?1:.25;life.plays+=type==='music'?1:0;life.energy=Math.min(1,life.energy+.03);life.trust=Math.min(1,life.trust+.002);state.lastAction=Date.now();if(type==='music'){life.favorite='MÚSICA';will.favoriteZone='PLAYER';will.intent='ESCUCHAR';mind.desire='ESCUCHAR';memories('La música volvió a despertar mis recuerdos.')}else{will.intent='OBSERVAR';mind.desire='OBSERVAR'}save();ui()},getState(){return{life:{...life},mind:{...mind},will:{...will},state:{mode:state.mode,zone:zone(),x:state.x,y:state.y}}}};
 setInterval(()=>{if(state.mode==='awake'||state.mode==='follow'){if(Math.random()<.2+will.autonomy*.12)think();else if(Math.random()<.1+life.curiosity*.08)chooseIntent()}ui();save()},1800);resize();explore();ui();requestAnimationFrame(draw);
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
