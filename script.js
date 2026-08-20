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
let tracks = [];
let currentTrack = -1;

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