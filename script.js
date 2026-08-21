const audio = document.getElementById('audioPlayer');
const btnPlay = document.getElementById('btnPlay');
const btnMute = document.getElementById('btnMute');
const btnBack = document.getElementById('btnBack');
const btnNext = document.getElementById('btnNext');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const playlist = document.getElementById('playlist');
const template = document.getElementById('trackTemplate');
const progressBar = document.getElementById('progressBar');
const trackTitle = document.getElementById('trackTitle');
const trackNumber = document.getElementById('trackNumber');
const timeDisplay = document.getElementById('timeDisplay');
const durationDisplay = document.getElementById('durationDisplay');
const fileCount = document.getElementById('fileCount');
const statusText = document.getElementById('statusText');
const modeMusic = document.getElementById('modeMusic');
const modeRadio = document.getElementById('modeRadio');
const modeNews = document.getElementById('modeNews');
const radioPanel = document.getElementById('radioPanel');
const newsPanel = document.getElementById('newsPanel');
const stationGrid = document.getElementById('stationGrid');
const newsList = document.getElementById('newsList');
const refreshNews = document.getElementById('refreshNews');
const visitCount = document.getElementById('visitCount');
const volumeBar = document.getElementById('volumeBar');
const volumeValue = document.getElementById('volumeValue');
const speedBar = document.getElementById('speedBar');
const speedValue = document.getElementById('speedValue');
const equalizerBtn = document.getElementById('equalizerBtn');
const volumeToggle = document.getElementById('volumeToggle');
const speedToggle = document.getElementById('speedToggle');
const volumePanel = document.getElementById('volumePanel');
const speedPanel = document.getElementById('speedPanel');
const equalizerPanel = document.getElementById('equalizerPanel');
const bassBar = document.getElementById('bassBar');
const trebleBar = document.getElementById('trebleBar');
const bassValue = document.getElementById('bassValue');
const trebleValue = document.getElementById('trebleValue');
const onlineClock = document.getElementById('onlineClock');
const newsFilters = document.querySelectorAll('.news-filter');
const vrPreview = document.getElementById('vrPreview');
const vrClose = document.getElementById('vrClose');
const vrStatus = document.getElementById('vrStatus');
const crossfader = document.getElementById('crossfader');
const cueButtons = document.querySelectorAll('.cue-btn');
const deckPlayA = document.getElementById('deckPlayA');
const deckPlayB = document.getElementById('deckPlayB');
const deckATitle = document.getElementById('deckATitle');
const deckBTitle = document.getElementById('deckBTitle');
const syncDecks = document.getElementById('syncDecks');
const resetMix = document.getElementById('resetMix');
const radioFilters = document.querySelectorAll('.radio-filter');
const playlistDrop = document.getElementById('playlistDrop');
const radioAudioA = document.getElementById('radioAudioA');
const radioAudioB = document.getElementById('radioAudioB');
const radioChannelA = document.getElementById('radioChannelA');
const radioChannelB = document.getElementById('radioChannelB');
const radioPlayMix = document.getElementById('radioPlayMix');
const radioStopMix = document.getElementById('radioStopMix');
const radioCrossfader = document.getElementById('radioCrossfader');
let selectedRadioChannel = 'A';
let tracks = [];
let currentTrack = -1;
let activeFeed = 'tech';
let audioContext;
let bassFilter;
let trebleFilter;
audio.volume = Number(volumeBar.value);

function updateClock() {
  onlineClock.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false });
}

async function openVrWatermarkTest() {
  vrPreview.hidden = false;
  document.body.classList.add('vr-active');
  vrStatus.textContent = 'PREVISUALIZACIÓN ESPACIAL ACTIVA';
  if (!navigator.xr) {
    vrStatus.textContent = 'MODO COMPATIBLE ACTIVO // WEBXR NO DISPONIBLE';
    return;
  }
  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
    vrStatus.textContent = supported ? 'WEBXR DISPONIBLE // MARCA LISTA PARA ESCENA VR' : 'PREVIEW 3D ACTIVA // VISOR VR NO DETECTADO';
  } catch (error) {
    vrStatus.textContent = 'PREVIEW 3D ACTIVA // WEBXR REQUIERE HTTPS';
  }
}

function closeVrWatermarkTest() {
  vrPreview.hidden = true;
  document.body.classList.remove('vr-active');
}

function registerVisit() {
  const storageKey = 'axndre-neon-tape-visits';
  const visits = Number(localStorage.getItem(storageKey) || 0) + 1;
  localStorage.setItem(storageKey, String(visits));
  visitCount.textContent = visits.toLocaleString('es-ES');
}

const stations = [
  { name: 'LOS40 Urban', genre: 'Urbano / España', style: 'urban', url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40URBAN.mp3', color: 'pink' },
  { name: 'Hit FM', genre: 'Dance / urbano', style: 'urban', url: 'https://hitfm.ondemand.stream.radiojar.com/8s5u5tpdtwzuv', color: 'blue' },
  { name: 'Hip Hop Hits', genre: 'Hip hop / rap', style: 'hiphop', url: 'https://streaming.radio.co/s7748d7e3a/listen', color: 'violet' },
  { name: 'Urban Radio', genre: 'R&B / hip hop', style: 'hiphop', url: 'https://stream.zeno.fm/0r0xa792kwzuv', color: 'blue' },
  { name: 'Bachata Radio', genre: 'Bachata / latina', style: 'latin', url: 'https://stream.zeno.fm/4wz7kq8z4qzuv', color: 'pink' },
  { name: 'Salsa Caribe', genre: 'Salsa / tropical', style: 'latin', url: 'https://stream.zeno.fm/8s4u5v0n6qzuv', color: 'lime' },
  { name: 'Onda Cero', genre: 'Actualidad / radio', style: 'all', url: 'https://atres-live-ondacero.flumotion.com/ondacero/stream.mp3', color: 'violet' },
  { name: 'Radio Marca', genre: 'Deportes en directo', style: 'all', url: 'https://radiomarca-cope.flumotion.com/radiomarca/radiomarca.mp3', color: 'lime' }
];

const newsFeeds = {
  tech: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
  science: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  crypto: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  latam: 'https://feeds.bbci.co.uk/mundo/rss.xml'
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '00:00';
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

function renderPlaylist() {
  playlist.innerHTML = '';
  if (!tracks.length) {
    playlist.innerHTML = '<li class="empty-state">Aun no hay pistas cargadas.</li>';
  }
  tracks.forEach((track, index) => {
    const item = template.content.cloneNode(true);
    const row = item.querySelector('.track-item');
    row.querySelector('.track-index').textContent = String(index + 1).padStart(2, '0');
    row.querySelector('.track-name').textContent = track.name;
    row.querySelector('.track-button').addEventListener('click', () => loadTrack(index, true));
    if (index === currentTrack) row.classList.add('current');
    playlist.appendChild(item);
  });
  fileCount.textContent = `${tracks.length} FILE${tracks.length === 1 ? '' : 'S'}`;
}

function loadTrack(index, autoplay = false) {
  if (!tracks[index]) return;
  currentTrack = index;
  audio.src = tracks[index].url;
  trackTitle.textContent = tracks[index].name.replace(/\.[^/.]+$/, '');
  trackNumber.textContent = `TRACK ${String(index + 1).padStart(2, '0')}`;
  statusText.textContent = 'LOADING TRACK';
  renderPlaylist();
  if (autoplay) audio.play().catch(() => {});
}

function addFiles(files) {
  [...files].filter((file) => file.type.startsWith('audio/') || /\.mp3$/i.test(file.name)).forEach((file) => {
    tracks.push({ name: file.name, url: URL.createObjectURL(file) });
  });
  if (currentTrack === -1 && tracks.length) loadTrack(0);
  renderPlaylist();
}

function renderStations(style = 'all') {
  const visibleStations = stations.filter((station) => style === 'all' || station.style === style);
  stationGrid.innerHTML = visibleStations.map((station) => `<article class="station-card ${station.color}"><span class="station-live">LIVE</span><strong>${station.name}</strong><small>${station.genre}</small><div class="station-actions"><button type="button" data-radio-channel="A" data-station="${stations.indexOf(station)}">A</button><button type="button" data-radio-channel="B" data-station="${stations.indexOf(station)}">B</button></div></article>`).join('');
  stationGrid.querySelectorAll('[data-station]').forEach((button) => button.addEventListener('click', () => loadRadioChannel(Number(button.dataset.station), button.dataset.radioChannel)));
}

function playStation(index) {
  const station = stations[index];
  if (!station) return;
  audio.src = station.url;
  audio.load();
  trackTitle.textContent = station.name.toUpperCase();
  deckATitle.textContent = station.name.toUpperCase();
  deckBTitle.textContent = 'NEXT // ' + station.genre.toUpperCase();
  trackNumber.textContent = 'LIVE // FM';
  statusText.textContent = 'CONNECTING TO RADIO';
  audio.play().catch(() => { statusText.textContent = 'PRESS PLAY TO CONNECT'; });
}

function loadRadioChannel(index, channel = selectedRadioChannel) {
  const station = stations[index];
  if (!station) return;
  selectedRadioChannel = channel;
  const player = channel === 'A' ? radioAudioA : radioAudioB;
  const label = channel === 'A' ? radioChannelA : radioChannelB;
  player.src = station.url;
  player.load();
  label.textContent = `${channel} // ${station.name.toUpperCase()}`;
  radioChannelA.classList.toggle('active', channel === 'A');
  radioChannelB.classList.toggle('active', channel === 'B');
  statusText.textContent = `RADIO ${channel} LISTA // ${station.name.toUpperCase()}`;
}

function updateRadioMix() {
  const mix = Number(radioCrossfader.value) / 100;
  radioAudioA.volume = 1 - mix;
  radioAudioB.volume = mix;
}

function playDeckA() {
  if (!tracks.length) {
    fileInput.click();
    return;
  }
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

function prepareDeckB() {
  const nextIndex = currentTrack < tracks.length - 1 ? currentTrack + 1 : 0;
  if (!tracks[nextIndex]) {
    statusText.textContent = 'CARGA UNA SEGUNDA PISTA PARA DECK B';
    return;
  }
  deckBTitle.textContent = tracks[nextIndex].name.replace(/\.[^/.]+$/, '').toUpperCase();
  statusText.textContent = `DECK B LISTO // TRACK ${String(nextIndex + 1).padStart(2, '0')}`;
}

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

async function loadNews(feedName = activeFeed) {
  activeFeed = feedName;
  newsList.innerHTML = '<p class="news-loading">CARGANDO TITULARES...</p>';
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(newsFeeds[feedName])}`);
    const data = await response.json();
    const items = (data.items || []).slice(0, 6);
    newsList.innerHTML = items.length ? items.map((item) => `<a class="news-item" href="${escapeHtml(item.link)}" target="_blank" rel="noopener"><time>${new Date(item.pubDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</time><strong>${escapeHtml(item.title)}</strong><span>ABRIR NOTICIA ↗</span></a>`).join('') : '<p class="news-loading">NO HAY TITULARES DISPONIBLES.</p>';
  } catch (error) {
    newsList.innerHTML = '<p class="news-loading">NO SE PUDO CONECTAR AL FEED. INTENTA ACTUALIZAR.</p>';
  }
}

function togglePanel(button, panel) {
  const isOpen = button.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.control-toggle').forEach((control) => control.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll('.control-panel').forEach((control) => { control.hidden = true; });
  button.setAttribute('aria-expanded', String(!isOpen));
  panel.hidden = isOpen;
}

function ensureAudioGraph() {
  if (audioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext = new AudioContextClass();
  const source = audioContext.createMediaElementSource(audio);
  bassFilter = audioContext.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 180;
  trebleFilter = audioContext.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 3500;
  source.connect(bassFilter).connect(trebleFilter).connect(audioContext.destination);
  audioContext.resume().catch(() => {});
}

function setMode(mode) {
  const isRadio = mode === 'radio';
  const isNews = mode === 'news';
  [modeMusic, modeRadio, modeNews].forEach((button) => button.classList.remove('active'));
  (isRadio ? modeRadio : isNews ? modeNews : modeMusic).classList.add('active');
  radioPanel.hidden = !isRadio;
  newsPanel.hidden = !isNews;
  dropZone.hidden = isRadio || isNews;
  document.querySelector('.playlist-panel').hidden = isRadio || isNews;
  if (isNews && !newsList.querySelector('.news-item')) loadNews();
}

btnPlay.addEventListener('click', () => {
  if (!tracks.length) {
    fileInput.click();
    return;
  }
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
});

btnMute.addEventListener('click', () => {
  audio.muted = !audio.muted;
  btnMute.classList.toggle('active', audio.muted);
  btnMute.textContent = audio.muted ? 'MUTE' : 'VOL';
});

btnBack.addEventListener('click', () => loadTrack(Math.max(0, currentTrack - 1), true));
btnNext.addEventListener('click', () => loadTrack(Math.min(tracks.length - 1, currentTrack + 1), true));
fileInput.addEventListener('change', (event) => addFiles(event.target.files));
playlistDrop.addEventListener('click', () => fileInput.click());
playlistDrop.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });
['dragenter', 'dragover'].forEach((eventName) => playlistDrop.addEventListener(eventName, (event) => { event.preventDefault(); playlistDrop.classList.add('dragging'); }));
['dragleave', 'drop'].forEach((eventName) => playlistDrop.addEventListener(eventName, (event) => { event.preventDefault(); playlistDrop.classList.remove('dragging'); }));
playlistDrop.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); }));
dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
audio.addEventListener('play', () => { btnPlay.textContent = 'PAUSE'; statusText.textContent = 'PLAYING NOW'; });
audio.addEventListener('pause', () => { btnPlay.textContent = 'PLAY'; if (audio.currentTime) statusText.textContent = 'PAUSED'; });
audio.addEventListener('ended', () => { if (currentTrack < tracks.length - 1) loadTrack(currentTrack + 1, true); });
audio.addEventListener('loadedmetadata', () => { durationDisplay.textContent = formatTime(audio.duration); statusText.textContent = 'READY TO PLAY'; });
audio.addEventListener('timeupdate', () => { progressBar.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0; timeDisplay.textContent = formatTime(audio.currentTime); });
progressBar.addEventListener('input', () => { if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration; });
volumeBar.addEventListener('input', () => {
  audio.volume = Number(volumeBar.value);
  audio.muted = audio.volume === 0;
  volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
  volumeToggle.querySelector('output').textContent = volumeValue.textContent;
  volumePanel.querySelector('output').textContent = volumeValue.textContent;
  btnMute.classList.toggle('active', audio.muted);
});
speedBar.addEventListener('input', () => {
  audio.playbackRate = Number(speedBar.value);
  speedValue.textContent = `${audio.playbackRate.toFixed(2)}x`;
  speedToggle.querySelector('output').textContent = speedValue.textContent;
  speedPanel.querySelector('output').textContent = speedValue.textContent;
});
volumeToggle.addEventListener('click', () => togglePanel(volumeToggle, volumePanel));
speedToggle.addEventListener('click', () => togglePanel(speedToggle, speedPanel));
equalizerBtn.addEventListener('click', () => togglePanel(equalizerBtn, equalizerPanel));
document.querySelectorAll('[data-speed]').forEach((button) => button.addEventListener('click', () => {
  speedBar.value = button.dataset.speed;
  speedBar.dispatchEvent(new Event('input'));
  document.querySelectorAll('[data-speed]').forEach((preset) => preset.classList.toggle('active', preset === button));
}));
bassBar.addEventListener('input', () => {
  ensureAudioGraph();
  if (bassFilter) bassFilter.gain.value = Number(bassBar.value);
  bassValue.textContent = `${bassBar.value} dB`;
  equalizerBtn.querySelector('output').textContent = 'CUSTOM';
});
trebleBar.addEventListener('input', () => {
  ensureAudioGraph();
  if (trebleFilter) trebleFilter.gain.value = Number(trebleBar.value);
  trebleValue.textContent = `${trebleBar.value} dB`;
  equalizerBtn.querySelector('output').textContent = 'CUSTOM';
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.control-toggle').forEach((control) => control.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll('.control-panel').forEach((control) => { control.hidden = true; });
});
document.addEventListener('click', (event) => {
  if (event.target.closest('.control-menu')) return;
  document.querySelectorAll('.control-toggle').forEach((control) => control.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll('.control-panel').forEach((control) => { control.hidden = true; });
});
cueButtons.forEach((button) => button.addEventListener('click', () => {
  const active = button.getAttribute('aria-pressed') !== 'true';
  cueButtons.forEach((cue) => { cue.setAttribute('aria-pressed', 'false'); cue.classList.remove('active'); });
  button.setAttribute('aria-pressed', String(active));
  button.classList.toggle('active', active);
}));
deckPlayA.addEventListener('click', playDeckA);
deckPlayB.addEventListener('click', () => {
  if (!tracks.length) {
    fileInput.click();
    return;
  }
  const nextIndex = currentTrack < tracks.length - 1 ? currentTrack + 1 : 0;
  loadTrack(nextIndex, true);
  deckBTitle.textContent = tracks[nextIndex].name.replace(/\.[^/.]+$/, '').toUpperCase();
});
syncDecks.addEventListener('click', () => {
  speedBar.value = '1';
  speedBar.dispatchEvent(new Event('input'));
  statusText.textContent = 'DECKS SINCRONIZADOS // 128 BPM';
});
resetMix.addEventListener('click', () => {
  crossfader.value = '50';
  crossfader.dispatchEvent(new Event('input'));
});
crossfader.addEventListener('input', () => {
  const mix = Number(crossfader.value);
  crossfader.closest('.dj-mixer').style.setProperty('--mix-position', `${mix}%`);
});
radioFilters.forEach((filter) => filter.addEventListener('click', () => {
  radioFilters.forEach((button) => button.classList.toggle('active', button === filter));
  renderStations(filter.dataset.genre);
}));
radioChannelA.addEventListener('click', () => { selectedRadioChannel = 'A'; radioChannelA.classList.add('active'); radioChannelB.classList.remove('active'); });
radioChannelB.addEventListener('click', () => { selectedRadioChannel = 'B'; radioChannelB.classList.add('active'); radioChannelA.classList.remove('active'); });
radioPlayMix.addEventListener('click', () => {
  updateRadioMix();
  Promise.all([radioAudioA.play(), radioAudioB.play()]).catch(() => { statusText.textContent = 'PULSA PLAY MIX PARA CONECTAR LAS RADIOS'; });
  statusText.textContent = 'RADIO MIX // A + B EN DIRECTO';
});
radioStopMix.addEventListener('click', () => { radioAudioA.pause(); radioAudioB.pause(); statusText.textContent = 'RADIO MIX DETENIDA'; });
radioCrossfader.addEventListener('input', updateRadioMix);
updateRadioMix();
newsFilters.forEach((filter) => filter.addEventListener('click', () => {
  newsFilters.forEach((button) => { button.classList.toggle('active', button === filter); button.setAttribute('aria-selected', String(button === filter)); });
  loadNews(filter.dataset.feed);
}));
vrClose.addEventListener('click', closeVrWatermarkTest);
vrPreview.addEventListener('click', (event) => { if (event.target === vrPreview) closeVrWatermarkTest(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !vrPreview.hidden) closeVrWatermarkTest(); });
modeMusic.addEventListener('click', () => setMode('music'));
modeRadio.addEventListener('click', () => setMode('radio'));
modeNews.addEventListener('click', () => setMode('news'));
refreshNews.addEventListener('click', loadNews);
renderStations();
registerVisit();
updateClock();
setInterval(updateClock, 1000);