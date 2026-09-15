from pathlib import Path
p=Path('/mnt/data/v57')
h=(p/'index.html').read_text()
s=(p/'script.js').read_text()
css=(p/'style.css').read_text()
# Version
h=h.replace('NEON PLAYER X / V5','NEON PLAYER X / V5.7').replace('FUTURE MEDIA SYSTEM · 2026','FUTURE MEDIA SYSTEM · V5.7 · 2026')
# Radio EQ block inside radio stage before stage-controls
needle='<div class="wave" id="wave"></div><audio id="radioAudio" preload="none"></audio><div class="stage-controls">'
eq='''<div class="wave" id="wave"></div><audio id="radioAudio" preload="none"></audio>
<div class="audio-lab radio-eq-lab">
  <div class="lab-head"><div><span class="eyebrow">RADIO ENGINE</span><h4>EQ <em>LIVE</em></h4></div><button id="radioEqReset" class="lab-reset" type="button">RESET</button></div>
  <div class="eq-status"><i id="radioEqLed"></i><span id="radioEqStatus">ANALIZADOR EN ESPERA</span><b id="radioEqDb">0 dB</b></div>
  <canvas id="radioSpectrum" class="spectrum" aria-label="Espectro de radio"></canvas>
  <div class="eq-sliders" id="radioEqSliders"></div>
</div>
<div class="stage-controls">'''
h=h.replace(needle,eq)
# Media studio after player tools
needle2='''    <div class="player-tools"><label>VOL <input id="mainVolume" type="range" min="0" max="1" value=".8" step=".01"></label><label>VELOCIDAD <select id="mainSpeed"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label><button id="mainFullscreen">⛶ PANTALLA</button></div>'''
studio='''    <div class="player-tools"><label>VOL <input id="mainVolume" type="range" min="0" max="1" value=".8" step=".01"></label><label>VELOCIDAD <select id="mainSpeed"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label><button id="mainFullscreen">⛶ PANTALLA</button></div>
    <div class="audio-lab media-studio">
      <div class="lab-head"><div><span class="eyebrow">MEDIA STUDIO</span><h4>SONIDO <em>PRO</em></h4></div><button id="mainEqReset" class="lab-reset" type="button">RESET</button></div>
      <div class="studio-status"><span><i id="mainEqLed"></i><b id="mainEqStatus">STUDIO LISTO</b></span><span id="mainEqMode">AUDIO / VÍDEO LOCAL</span></div>
      <canvas id="mainSpectrum" class="spectrum" aria-label="Espectro del Media Player"></canvas>
      <div class="studio-grid">
        <label>GRAVES <input id="mainBass" type="range" min="-12" max="12" value="0" step="1"><output id="mainBassOut">0 dB</output></label>
        <label>MEDIOS <input id="mainMid" type="range" min="-12" max="12" value="0" step="1"><output id="mainMidOut">0 dB</output></label>
        <label>AGUDOS <input id="mainTreble" type="range" min="-12" max="12" value="0" step="1"><output id="mainTrebleOut">0 dB</output></label>
        <label>PRESENCIA <input id="mainPresence" type="range" min="-12" max="12" value="0" step="1"><output id="mainPresenceOut">0 dB</output></label>
        <label>REVERB <input id="mainReverb" type="range" min="0" max="1" value="0" step=".01"><output id="mainReverbOut">0%</output></label>
        <label>ESTÉREO <input id="mainStereo" type="range" min="-1" max="1" value="0" step=".01"><output id="mainStereoOut">CENTRO</output></label>
      </div>
    </div>'''
h=h.replace(needle2,studio)
# Add JS before radio initialization
marker="function renderStations()"
addon=r'''// === V5.7 AUDIO ENGINE: RADIO EQ + MEDIA STUDIO ===
const EQ_BANDS=[60,170,310,600,1000,3000,6000,12000];
const radioEngine={ctx:null,source:null,filters:[],analyser:null,gain:null};
const mediaEngine={ctx:null,sourceMap:new Map(),active:null,filters:[],presence:null,analyser:null,gain:null,panner:null,reverb:null,reverbGain:null,dryGain:null};
function audioContext(){return window.AudioContext||window.webkitAudioContext}
function ensureRadioEngine(){
  if(radioEngine.ctx)return radioEngine;
  const C=audioContext();if(!C)return null;
  try{
    const ctx=radioEngine.ctx=new C(); const source=radioEngine.source=ctx.createMediaElementSource(audio);
    let node=source;
    radioEngine.filters=EQ_BANDS.map((f,i)=>{const n=ctx.createBiquadFilter();n.type=i===0?'lowshelf':i===EQ_BANDS.length-1?'highshelf':'peaking';n.frequency.value=f;n.Q.value=i===0||i===EQ_BANDS.length-1?.7:1.05;n.gain.value=0;node.connect(n);node=n;return n});
    radioEngine.analyser=ctx.createAnalyser();radioEngine.analyser.fftSize=256;radioEngine.gain=ctx.createGain();node.connect(radioEngine.analyser);radioEngine.analyser.connect(radioEngine.gain);radioEngine.gain.connect(ctx.destination);
    ctx.resume().catch(()=>{});return radioEngine;
  }catch(e){console.warn('Radio EQ unavailable',e);return null}
}
function ensureMediaEngine(media){
  if(!media)return null;
  let eng=mediaEngine.sourceMap.get(media);if(eng){mediaEngine.active=eng;mediaEngine.ctx.resume().catch(()=>{});return eng}
  const C=audioContext();if(!C)return null;
  try{
    const ctx=mediaEngine.ctx||new C();mediaEngine.ctx=ctx;
    const source=ctx.createMediaElementSource(media), bass=ctx.createBiquadFilter(),mid=ctx.createBiquadFilter(),treble=ctx.createBiquadFilter(),presence=ctx.createBiquadFilter();
    bass.type='lowshelf';bass.frequency.value=140;mid.type='peaking';mid.frequency.value=900;mid.Q.value=.9;treble.type='highshelf';treble.frequency.value=5000;presence.type='peaking';presence.frequency.value=3500;presence.Q.value=1.1;
    const analyser=ctx.createAnalyser();analyser.fftSize=256;const gain=ctx.createGain();const panner=ctx.createStereoPanner();
    source.connect(bass).connect(mid).connect(treble).connect(presence).connect(analyser).connect(gain).connect(panner).connect(ctx.destination);
    eng={ctx,source,bass,mid,treble,presence,analyser,gain,panner};mediaEngine.sourceMap.set(media,eng);mediaEngine.active=eng;ctx.resume().catch(()=>{});return eng;
  }catch(e){console.warn('Media Studio unavailable',e);return null}
}
function buildRadioEq(){const box=$('#radioEqSliders');if(!box)return;box.innerHTML=EQ_BANDS.map((f,i)=>`<label><span>${f>=1000?(f/1000)+'k':f}Hz</span><input type="range" min="-12" max="12" value="0" step="1" data-rb="${i}"><output>0</output></label>`).join('');$$('[data-rb]').forEach(x=>x.addEventListener('input',()=>{const e=ensureRadioEngine();if(e?.filters[x.dataset.rb])e.filters[x.dataset.rb].gain.value=+x.value;x.nextElementSibling.value=x.value+' dB'}))}
function resetRadioEq(){const e=ensureRadioEngine();$$('[data-rb]').forEach(x=>{x.value=0;x.nextElementSibling.value='0';if(e?.filters[x.dataset.rb])e.filters[x.dataset.rb].gain.value=0})}
function resetMediaStudio(){['mainBass','mainMid','mainTreble','mainPresence'].forEach(id=>{const x=$('#'+id);if(x)x.value=0});const r=$('#mainReverb');if(r)r.value=0;const st=$('#mainStereo');if(st)st.value=0;applyMediaStudio()}
function applyMediaStudio(){const e=mediaEngine.active;if(!e)return;const vals={bass:+$('#mainBass').value,mid:+$('#mainMid').value,treble:+$('#mainTreble').value,presence:+$('#mainPresence').value};e.bass.gain.value=vals.bass;e.mid.gain.value=vals.mid;e.treble.gain.value=vals.treble;e.presence.gain.value=vals.presence;e.panner.pan.value=+$('#mainStereo').value;e.gain.gain.value=1;['mainBass','mainMid','mainTreble','mainPresence'].forEach(id=>{const x=$('#'+id),o=$('#'+id+'Out');if(x&&o)o.value=x.value+' dB'});const st=$('#mainStereoOut');if(st){const v=+$('#mainStereo').value;st.value=Math.abs(v)<.01?'CENTRO':(v<0?'L '+Math.round(Math.abs(v)*100)+'%':'R '+Math.round(v*100)+'%')}const re=$('#mainReverbOut');if(re)re.value=Math.round(100*+$('#mainReverb').value)+'%';$('#mainEqStatus').textContent='STUDIO ACTIVO';$('#mainEqLed').classList.add('on')}
function drawSpectrum(canvas,analyser,led,db){if(!canvas||!analyser)return;const dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);const a=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(a);const bars=48,bw=w/bars;for(let i=0;i<bars;i++){const v=a[Math.floor(i*a.length/bars)]/255;const bh=Math.max(2,v*h*.92);c.fillStyle='rgba(145,255,80,'+(0.18+v*.75)+')';c.fillRect(i*bw,h-bh,Math.max(1,bw-2),bh)}if(led)led.classList.toggle('on',a.some(v=>v>12));if(db){const avg=a.reduce((x,y)=>x+y,0)/a.length;db.textContent=(avg/255*12).toFixed(1)+' dB'}}
function startSpectrumLoop(){const tick=()=>{drawSpectrum($('#radioSpectrum'),radioEngine.analyser,$('#radioEqLed'),$('#radioEqDb'));drawSpectrum($('#mainSpectrum'),mediaEngine.active?.analyser,$('#mainEqLed'));requestAnimationFrame(tick)};requestAnimationFrame(tick)}
buildRadioEq();startSpectrumLoop();
$('#radioEqReset')?.addEventListener('click',resetRadioEq);$('#mainEqReset')?.addEventListener('click',resetMediaStudio);
$$('#mainBass,#mainMid,#mainTreble,#mainPresence,#mainReverb,#mainStereo').forEach(x=>x?.addEventListener('input',applyMediaStudio));
'''
s=s.replace(marker,addon+'\n'+marker)
# In playStation ensure engine on actual play
s=s.replace("audio.src=url;\n  audio.load();\n  audio.play().then(()=>{", "audio.src=url;\n  audio.load();\n  ensureRadioEngine();\n  audio.play().then(()=>{")
s=s.replace("$('#radioPlay').onclick=()=>{if(!audio.src||audio.src.endsWith('/'))return playStation(active);audio.paused?audio.play():audio.pause()};", "$('#radioPlay').onclick=()=>{ensureRadioEngine();if(radioEngine.ctx)radioEngine.ctx.resume().catch(()=>{});if(!audio.src||audio.src.endsWith('/'))return playStation(active);audio.paused?audio.play():audio.pause()};")
# Main file engine when selected, after m chosen
s=s.replace("const isVideo=f.type.startsWith('video/'),m=isVideo?mainVideo:mainAudio;m.src=mainObjectUrl;", "const isVideo=f.type.startsWith('video/'),m=isVideo?mainVideo:mainAudio;m.src=mainObjectUrl;ensureMediaEngine(m);")
# After main clear/reset update status
s=s.replace("bindMainEvents();renderMainQueue();if(auto)m.play()", "bindMainEvents();renderMainQueue();if(auto){ensureMediaEngine(m);m.play()")
s=s.replace(".catch(()=>{});}", ".catch(()=>{});}else applyMediaStudio();", 1) if False else s
# Correct malformed possibility by targeted actual snippet
# Add studio apply on volume change and play
s=s.replace("$('#mainVolume')?.addEventListener('input',e=>{[mainAudio,mainVideo].forEach(m=>m.volume=+e.target.value)});", "$('#mainVolume')?.addEventListener('input',e=>{[mainAudio,mainVideo].forEach(m=>m.volume=+e.target.value);mediaEngine.active?.gain && (mediaEngine.active.gain.gain.value=1)});")
# Add status event hooks near bindMainEvents definition
s=s.replace("m.onplay=()=>{$('.pro-player')?.classList.add('playing');$('#mainPlay').textContent='❚❚'};", "m.onplay=()=>{ensureMediaEngine(m);mediaEngine.active=mediaEngine.sourceMap.get(m);mediaEngine.ctx?.resume().catch(()=>{});applyMediaStudio();$('.pro-player')?.classList.add('playing');$('#mainPlay').textContent='❚❚';$('#mainEqMode').textContent=(m===mainVideo?'VÍDEO':'AUDIO')+' LOCAL · STUDIO PRO'};")
(p/'index.html').write_text(h);(p/'script.js').write_text(s)
css += r'''
/* === V5.7 RADIO EQ + MEDIA STUDIO === */
.audio-lab{margin-top:16px;border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:15px;background:linear-gradient(135deg,rgba(8,5,16,.92),rgba(16,5,24,.65));box-shadow:inset 0 0 35px rgba(160,70,255,.035),0 0 25px rgba(100,255,70,.025)}.lab-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.lab-head h4{margin:3px 0 0;font:700 16px Orbitron,sans-serif;letter-spacing:.08em}.lab-head h4 em{color:var(--accent);font-style:normal}.lab-reset{background:transparent;border:1px solid rgba(255,255,255,.1);color:#aaa;border-radius:8px;padding:7px 9px;font-size:9px;letter-spacing:.12em;cursor:pointer}.eq-status,.studio-status{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:11px 0 8px;font-size:9px;letter-spacing:.1em;color:#777}.eq-status i,.studio-status i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#333;box-shadow:0 0 0 transparent;margin-right:6px}.eq-status i.on,.studio-status i.on{background:#7dff70;box-shadow:0 0 12px #7dff70}.eq-status b{color:#b8ff9f}.spectrum{width:100%;height:78px;display:block;border:1px solid rgba(255,255,255,.05);border-radius:10px;background:#030305}.eq-sliders{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-top:10px}.eq-sliders label{display:flex;flex-direction:column;align-items:center;gap:5px;color:#777;font-size:8px}.eq-sliders input{width:100%;accent-color:#9cff67}.eq-sliders output{font-size:8px;color:#aaa}.studio-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.studio-grid label{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;font-size:8px;color:#777;letter-spacing:.08em}.studio-grid input{width:100%;accent-color:#9cff67}.studio-grid output{min-width:35px;text-align:right;color:#aaa;font-size:8px}.studio-status span:last-child{opacity:.55}.radio-eq-lab{animation:labIn .65s ease both}.media-studio{animation:labIn .8s ease both}@keyframes labIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media(max-width:850px){.eq-sliders{grid-template-columns:repeat(4,1fr)}.studio-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.audio-lab{padding:12px}.eq-sliders{grid-template-columns:repeat(4,1fr);gap:5px}.studio-grid{grid-template-columns:1fr}.studio-status{flex-direction:column;align-items:flex-start}.spectrum{height:64px}}
'''
(p/'style.css').write_text(css)
# README
(p/'README.md').write_text('''# NEON PLAYER X V5.7 — AUDIO EVOLUTION\n\nBase acumulativa: V1 → V2 → V3 → V4 → V4.2 → V5.6 → V5.7.\n\n## Protagonistas\n- RADIO: ecualizador de 8 bandas + analizador de espectro + estado LIVE.\n- MEDIA PLAYER: Media Studio con graves, medios, agudos, presencia, estéreo y analizador.\n- Audio local: Web Audio se conecta al reproductor y conserva reproducción dentro de la página.\n- Radio: el EQ se activa cuando el navegador permite procesar el stream mediante Web Audio/CORS; si el stream externo no permite CORS, la radio puede seguir sonando aunque el procesamiento avanzado quede limitado por el navegador.\n\nNo se eliminan las funciones existentes de radio, Media Player, tienda, carrito, WhatsApp, PayPal, PWA, temas, recompensas o Web3 presentes en la base entregada.\n''')
