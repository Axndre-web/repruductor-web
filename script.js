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
let tracks = [];
let currentTrack = -1;

function registerVisit() {
  const storageKey = 'axndre-neon-tape-visits';
  const visits = Number(localStorage.getItem(storageKey) || 0) + 1;
  localStorage.setItem(storageKey, String(visits));
  visitCount.textContent = visits.toLocaleString('es-ES');
}

const stations = [
  { name: 'Radio Paradise', genre: 'Eclectic mix', url: 'https://stream.radioparadise.com/mp3-128', color: 'pink' },
  { name: 'SomaFM Groove', genre: 'Chill / electronica', url: 'https://ice1.somafm.com/groovesalad-128-mp3', color: 'violet' },
  { name: 'NPR News', genre: 'News / talk', url: 'https://npr-ice.streamguys1.com/live.mp3', color: 'lime' },
  { name: 'BBC World Service', genre: 'Noticias globales', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', color: 'blue' }
];

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

function renderStations() {
  stationGrid.innerHTML = stations.map((station, index) => `<button class="station-card ${station.color}" type="button" data-station="${index}"><span class="station-live">LIVE</span><strong>${station.name}</strong><small>${station.genre}</small><span class="station-play">PLAY</span></button>`).join('');
  stationGrid.querySelectorAll('[data-station]').forEach((button) => button.addEventListener('click', () => playStation(Number(button.dataset.station))));
}

function playStation(index) {
  const station = stations[index];
  if (!station) return;
  audio.src = station.url;
  audio.load();
  trackTitle.textContent = station.name.toUpperCase();
  trackNumber.textContent = 'LIVE // FM';
  statusText.textContent = 'CONNECTING TO RADIO';
  audio.play().catch(() => { statusText.textContent = 'PRESS PLAY TO CONNECT'; });
}

async function loadNews() {
  newsList.innerHTML = '<p class="news-loading">CARGANDO TITULARES...</p>';
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fworld%2Frss.xml');
    const data = await response.json();
    const items = (data.items || []).slice(0, 6);
    newsList.innerHTML = items.length ? items.map((item) => `<a class="news-item" href="${item.link}" target="_blank" rel="noopener"><time>${new Date(item.pubDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</time><strong>${item.title}</strong><span>ABRIR NOTICIA ↗</span></a>`).join('') : '<p class="news-loading">NO HAY TITULARES DISPONIBLES.</p>';
  } catch (error) {
    newsList.innerHTML = '<p class="news-loading">NO SE PUDO CONECTAR AL FEED. INTENTA ACTUALIZAR.</p>';
  }
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
modeMusic.addEventListener('click', () => setMode('music'));
modeRadio.addEventListener('click', () => setMode('radio'));
modeNews.addEventListener('click', () => setMode('news'));
refreshNews.addEventListener('click', loadNews);
renderStations();
registerVisit();