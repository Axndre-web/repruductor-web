const fileInput = document.getElementById("fileInput");

const videoPlayer = document.getElementById("videoPlayer");
const audioPlayer = document.getElementById("audioPlayer");

const mediaContainer = document.getElementById("mediaContainer");
const emptyState = document.getElementById("emptyState");

const playBtn = document.getElementById("playBtn");
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");

const progress = document.getElementById("progress");
const currentTime = document.getElementById("currentTime");
const duration = document.getElementById("duration");

const volume = document.getElementById("volume");
const volumeValue = document.getElementById("volumeValue");
const muteBtn = document.getElementById("muteBtn");

const fullscreenBtn = document.getElementById("fullscreenBtn");

const currentTitle = document.getElementById("currentTitle");
const mediaType = document.getElementById("mediaType");

const playlistElement = document.getElementById("playlist");
const trackCount = document.getElementById("trackCount");
const clearPlaylistBtn = document.getElementById("clearPlaylist");

let playlist = [];
let currentIndex = -1;
let activeMedia = null;
let lastVolume = 1;


/* =========================
   CARGAR ARCHIVOS
========================= */

fileInput.addEventListener("change", (event) => {

    const files = Array.from(event.target.files);

    files.forEach(file => {

        if (!file.type.startsWith("audio/") &&
            !file.type.startsWith("video/")) {
            return;
        }

        playlist.push({
            file: file,
            url: URL.createObjectURL(file),
            name: file.name,
            type: file.type
        });

    });

    renderPlaylist();

    if (currentIndex === -1 && playlist.length > 0) {
        loadTrack(0);
    }

    fileInput.value = "";
});


/* =========================
   CARGAR PISTA
========================= */

function loadTrack(index, autoplay = true) {

    if (index < 0 || index >= playlist.length) {
        return;
    }

    currentIndex = index;

    const track = playlist[index];

    stopPlayers();

    if (track.type.startsWith("video/")) {

        activeMedia = videoPlayer;

        videoPlayer.src = track.url;
        videoPlayer.classList.add("active");

        audioPlayer.removeAttribute("src");

        fullscreenBtn.classList.add("visible");

        mediaType.textContent = "VÍDEO";

    } else {

        activeMedia = audioPlayer;

        audioPlayer.src = track.url;

        videoPlayer.classList.remove("active");
        videoPlayer.removeAttribute("src");

        fullscreenBtn.classList.remove("visible");

        mediaType.textContent = "AUDIO";
    }

    emptyState.classList.add("hidden");

    currentTitle.textContent = track.name;

    activeMedia.volume = Number(volume.value);

    renderPlaylist();

    if (autoplay) {
        activeMedia.play().catch(() => {});
    }
}


/* =========================
   PLAY / PAUSE
========================= */

playBtn.addEventListener("click", togglePlay);

function togglePlay() {

    if (!activeMedia) {
        if (playlist.length > 0) {
            loadTrack(0);
        }
        return;
    }

    if (activeMedia.paused) {
        activeMedia.play();
    } else {
        activeMedia.pause();
    }
}


/* =========================
   ACTUALIZAR BOTÓN PLAY
========================= */

function updatePlayButton() {

    if (!activeMedia || activeMedia.paused) {
        playBtn.textContent = "▶";
        playBtn.title = "Reproducir";
    } else {
        playBtn.textContent = "⏸";
        playBtn.title = "Pausar";
    }
}


/* =========================
   TIEMPO Y PROGRESO
========================= */

function updateProgress() {

    if (!activeMedia) {
        return;
    }

    const current = activeMedia.currentTime || 0;
    const total = activeMedia.duration || 0;

    if (total > 0) {
        progress.value = (current / total) * 100;
    } else {
        progress.value = 0;
    }

    currentTime.textContent = formatTime(current);
    duration.textContent = formatTime(total);
}


progress.addEventListener("input", () => {

    if (!activeMedia || !activeMedia.duration) {
        return;
    }

    activeMedia.currentTime =
        (Number(progress.value) / 100) * activeMedia.duration;
});


/* =========================
   AVANZAR / RETROCEDER
========================= */

backBtn.addEventListener("click", () => {

    if (!activeMedia) return;

    activeMedia.currentTime =
        Math.max(0, activeMedia.currentTime - 10);
});


forwardBtn.addEventListener("click", () => {

    if (!activeMedia) return;

    activeMedia.currentTime =
        Math.min(
            activeMedia.duration || Infinity,
            activeMedia.currentTime + 10
        );
});


/* =========================
   VOLUMEN
========================= */

volume.addEventListener("input", () => {

    const value = Number(volume.value);

    if (activeMedia) {
        activeMedia.volume = value;
        activeMedia.muted = value === 0;
    }

    if (value > 0) {
        lastVolume = value;
    }

    volumeValue.textContent = `${Math.round(value * 100)}%`;

    updateMuteIcon();
});


muteBtn.addEventListener("click", () => {

    if (!activeMedia) return;

    if (activeMedia.muted || activeMedia.volume === 0) {

        activeMedia.muted = false;

        const newVolume = lastVolume || 1;

        activeMedia.volume = newVolume;
        volume.value = newVolume;

    } else {

        lastVolume = activeMedia.volume;

        activeMedia.muted = true;
        volume.value = 0;
    }

    volumeValue.textContent =
        `${Math.round(Number(volume.value) * 100)}%`;

    updateMuteIcon();
});


function updateMuteIcon() {

    if (!activeMedia || activeMedia.muted ||
        Number(volume.value) === 0) {

        muteBtn.textContent = "🔇";

    } else if (Number(volume.value) < 0.5) {

        muteBtn.textContent = "🔉";

    } else {

        muteBtn.textContent = "🔊";
    }
}


/* =========================
   PANTALLA COMPLETA
========================= */

fullscreenBtn.addEventListener("click", () => {

    if (!activeMedia || activeMedia !== videoPlayer) {
        return;
    }

    if (document.fullscreenElement) {

        document.exitFullscreen();

    } else {

        if (videoPlayer.requestFullscreen) {
            videoPlayer.requestFullscreen();
        }
    }
});


/* =========================
   FINAL DE PISTA
========================= */

videoPlayer.addEventListener("ended", playNext);
audioPlayer.addEventListener("ended", playNext);


function playNext() {

    if (playlist.length === 0) {
        return;
    }

    if (currentIndex < playlist.length - 1) {

        loadTrack(currentIndex + 1);

    } else {

        loadTrack(0);
    }
}


/* =========================
   EVENTOS DEL REPRODUCTOR
========================= */

[videoPlayer, audioPlayer].forEach(player => {

    player.addEventListener("play", updatePlayButton);
    player.addEventListener("pause", updatePlayButton);
    player.addEventListener("timeupdate", updateProgress);

    player.addEventListener("loadedmetadata", () => {
        updateProgress();
    });
});


/* =========================
   PLAYLIST
========================= */

function renderPlaylist() {

    trackCount.textContent = playlist.length;

    if (playlist.length === 0) {

        playlistElement.innerHTML = `
            <div class="playlist-empty">
                <span>🎵</span>
                <p>Tu lista está vacía</p>
                <small>Carga archivos para añadirlos</small>
            </div>
        `;

        return;
    }

    playlistElement.innerHTML = "";

    playlist.forEach((track, index) => {

        const item = document.createElement("div");

        item.className =
            `track ${index === currentIndex ? "active" : ""}`;

        item.innerHTML = `
            <span class="track-number">
                ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="track-icon">
                ${track.type.startsWith("video/") ? "🎬" : "🎵"}
            </span>

            <div class="track-info">
                <span class="track-name"
                      title="${escapeHTML(track.name)}">
                    ${escapeHTML(track.name)}
                </span>

                <span class="track-type">
                    ${track.type.startsWith("video/")
                        ? "Vídeo"
                        : "Audio"}
                </span>
            </div>

            <button class="remove-track"
                    data-index="${index}"
                    title="Eliminar">
                ✕
            </button>
        `;

        item.addEventListener("click", (event) => {

            if (event.target.closest(".remove-track")) {
                return;
            }

            loadTrack(index);
        });

        const removeButton =
            item.querySelector(".remove-track");

        removeButton.addEventListener("click", (event) => {

            event.stopPropagation();

            removeTrack(index);
        });

        playlistElement.appendChild(item);
    });
}


/* =========================
   ELIMINAR PISTA
========================= */

function removeTrack(index) {

    const wasCurrent = index === currentIndex;

    URL.revokeObjectURL(playlist[index].url);

    playlist.splice(index, 1);

    if (playlist.length === 0) {

        resetPlayer();
        currentIndex = -1;

    } else if (wasCurrent) {

        const newIndex =
            Math.min(index, playlist.length - 1);

        currentIndex = -1;

        loadTrack(newIndex);

    } else if (index < currentIndex) {

        currentIndex--;

        renderPlaylist();

    } else {

        renderPlaylist();
    }
}


/* =========================
   VACIAR PLAYLIST
========================= */

clearPlaylistBtn.addEventListener("click", () => {

    playlist.forEach(track => {
        URL.revokeObjectURL(track.url);
    });

    playlist = [];

    resetPlayer();

    currentIndex = -1;

    renderPlaylist();
});


/* =========================
   REINICIAR REPRODUCTOR
========================= */

function resetPlayer() {

    stopPlayers();

    videoPlayer.classList.remove("active");

    videoPlayer.removeAttribute("src");
    audioPlayer.removeAttribute("src");

    activeMedia = null;

    emptyState.classList.remove("hidden");

    fullscreenBtn.classList.remove("visible");

    currentTitle.textContent =
        "Ningún archivo seleccionado";

    mediaType.textContent = "---";

    progress.value = 0;

    currentTime.textContent = "00:00";
    duration.textContent = "00:00";

    playBtn.textContent = "▶";
}


/* =========================
   DETENER REPRODUCTORES
========================= */

function stopPlayers() {

    videoPlayer.pause();
    audioPlayer.pause();
}


/* =========================
   FORMATO DE TIEMPO
========================= */

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "00:00";
    }

    seconds = Math.max(0, Math.floor(seconds));

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


/* =========================
   SEGURIDAD PARA NOMBRES
========================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================
   ATAJOS DE TECLADO
========================= */

document.addEventListener("keydown", (event) => {

    if (!activeMedia) {
        return;
    }

    // No interferir cuando el usuario está escribiendo
    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
    ) {
        return;
    }

    switch (event.code) {

        case "Space":
            event.preventDefault();
            togglePlay();
            break;

        case "ArrowLeft":
            activeMedia.currentTime =
                Math.max(0, activeMedia.currentTime - 5);
            break;

        case "ArrowRight":
            activeMedia.currentTime =
                Math.min(
                    activeMedia.duration || Infinity,
                    activeMedia.currentTime + 5
                );
            break;

        case "ArrowUp":
            event.preventDefault();

            activeMedia.volume =
                Math.min(1, activeMedia.volume + 0.05);

            volume.value = activeMedia.volume;

            volumeValue.textContent =
                `${Math.round(activeMedia.volume * 100)}%`;

            updateMuteIcon();
            break;

        case "ArrowDown":
            event.preventDefault();

            activeMedia.volume =
                Math.max(0, activeMedia.volume - 0.05);

            volume.value = activeMedia.volume;

            volumeValue.textContent =
                `${Math.round(activeMedia.volume * 100)}%`;

            updateMuteIcon();
            break;
    }
});


/* =========================
   INICIO
========================= */

renderPlaylist();
updateMuteIcon();