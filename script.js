const $ = id => document.getElementById(id);

const fileInput = $("fileInput");
const videoPlayer = $("videoPlayer");
const audioPlayer = $("audioPlayer");
const emptyState = $("emptyState");

const playBtn = $("playBtn");
const backBtn = $("backBtn");
const forwardBtn = $("forwardBtn");

const progress = $("progress");
const currentTime = $("currentTime");
const duration = $("duration");

const volume = $("volume");
const volumeValue = $("volumeValue");
const muteBtn = $("muteBtn");

const fullscreenBtn = $("fullscreenBtn");
const mediaContainer = $("mediaContainer");

const currentTitle = $("currentTitle");
const mediaType = $("mediaType");

const playlistElement = $("playlist");
const trackCount = $("trackCount");
const clearPlaylistBtn = $("clearPlaylist");

const myMusicList = $("myMusicList");

let playlist = [];
let currentIndex = -1;
let activeMedia = null;
let lastVolume = 1;


/* =========================================
   MI MUSICA
========================================= */

const miMusica = Array.from(
    { length: 25 },
    (_, i) => {

        const numero =
            String(i + 1).padStart(2, "0");

        return {
            name: `${numero}-cancion.mp3`,
            url: `musica/${numero}-cancion.mp3`,
            type: "audio/mp3",
            personal: true
        };
    }
);


/* =========================================
   ARCHIVOS
========================================= */

fileInput.addEventListener("change", e => {

    [...e.target.files].forEach(file => {

        if (
            !file.type.startsWith("audio/") &&
            !file.type.startsWith("video/")
        ) return;

        playlist.push({
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            temporary: true
        });
    });

    renderPlaylist();

    if (
        currentIndex === -1 &&
        playlist.length
    ) {
        loadTrack(0);
    }

    fileInput.value = "";
});


/* =========================================
   CARGAR CANCION
========================================= */

function loadTrack(index, autoplay = true) {

    if (
        index < 0 ||
        index >= playlist.length
    ) return;

    currentIndex = index;

    mediaContainer.classList.remove(
        "media-changing"
    );

    void mediaContainer.offsetWidth;

    mediaContainer.classList.add(
        "media-changing"
    );

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

    activeMedia.volume =
        Number(volume.value);

    renderPlaylist();
    updateMyMusicActive();

    if (autoplay) {
        activeMedia.play().catch(() => {});
    }

    updatePlayButton();
}


function stopPlayers() {

    videoPlayer.pause();
    audioPlayer.pause();
}


/* =========================================
   PLAY / PAUSE
========================================= */

playBtn.addEventListener(
    "click",
    togglePlay
);

function togglePlay() {

    if (!activeMedia) {

        if (playlist.length) {
            loadTrack(0);
        }

        return;
    }

    activeMedia.paused
        ? activeMedia.play().catch(() => {})
        : activeMedia.pause();
}


function updatePlayButton() {

    const playing =
        activeMedia &&
        !activeMedia.paused;

    playBtn.textContent =
        playing ? "⏸" : "▶";

    playBtn.classList.toggle(
        "playing",
        playing
    );

    mediaContainer.classList.toggle(
        "playing",
        playing
    );

    updateEqualizer();
}


/* =========================================
   ECUALIZADOR
========================================= */

function createEqualizer() {

    const equalizer =
        document.createElement("div");

    equalizer.className =
        "equalizer";

    equalizer.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
    `;

    return equalizer;
}


function updateEqualizer() {

    document
        .querySelectorAll(".equalizer")
        .forEach(eq => {
            eq.classList.remove("playing");
        });

    if (
        !activeMedia ||
        activeMedia.paused
    ) return;

    const activeTrack =
        document.querySelector(
            ".track.active"
        );

    if (!activeTrack) return;

    let equalizer =
        activeTrack.querySelector(
            ".equalizer"
        );

    if (!equalizer) {

        equalizer =
            createEqualizer();

        const number =
            activeTrack.querySelector(
                ".track-number"
            );

        if (number) {
            number.replaceWith(equalizer);
        }
    }

    equalizer.classList.add("playing");
}


/* =========================================
   PROGRESO
========================================= */

function updateProgress() {

    if (!activeMedia) return;

    const current =
        activeMedia.currentTime || 0;

    const total =
        activeMedia.duration || 0;

    progress.value =
        total
            ? current / total * 100
            : 0;

    currentTime.textContent =
        formatTime(current);

    duration.textContent =
        formatTime(total);
}


progress.addEventListener("input", () => {

    if (
        !activeMedia ||
        !activeMedia.duration
    ) return;

    activeMedia.currentTime =
        progress.value / 100 *
        activeMedia.duration;
});


/* =========================================
   AVANCE
========================================= */

backBtn.addEventListener("click", () => {

    if (!activeMedia) return;

    activeMedia.currentTime =
        Math.max(
            0,
            activeMedia.currentTime - 10
        );
});


forwardBtn.addEventListener("click", () => {

    if (!activeMedia) return;

    activeMedia.currentTime =
        Math.min(
            activeMedia.duration || Infinity,
            activeMedia.currentTime + 10
        );
});


/* =========================================
   VOLUMEN
========================================= */

volume.addEventListener("input", () => {

    const value =
        Number(volume.value);

    if (activeMedia) {
        activeMedia.volume = value;
        activeMedia.muted = value === 0;
    }

    if (value > 0) {
        lastVolume = value;
    }

    volumeValue.textContent =
        `${Math.round(value * 100)}%`;

    updateMuteIcon();
});


muteBtn.addEventListener("click", () => {

    if (!activeMedia) return;

    if (
        activeMedia.muted ||
        activeMedia.volume === 0
    ) {

        activeMedia.muted = false;

        const value =
            lastVolume || 1;

        activeMedia.volume = value;
        volume.value = value;

    } else {

        lastVolume =
            activeMedia.volume;

        activeMedia.muted = true;
        volume.value = 0;
    }

    volumeValue.textContent =
        `${Math.round(
            Number(volume.value) * 100
        )}%`;

    updateMuteIcon();
});


function updateMuteIcon() {

    if (
        !activeMedia ||
        activeMedia.muted ||
        Number(volume.value) === 0
    ) {
        muteBtn.textContent = "🔇";
    } else if (
        Number(volume.value) < .5
    ) {
        muteBtn.textContent = "🔉";
    } else {
        muteBtn.textContent = "🔊";
    }
}


/* =========================================
   PANTALLA COMPLETA
========================================= */

fullscreenBtn.addEventListener("click", () => {

    if (activeMedia !== videoPlayer)
        return;

    document.fullscreenElement
        ? document.exitFullscreen()
        : videoPlayer.requestFullscreen?.();
});


/* =========================================
   SIGUIENTE
========================================= */

videoPlayer.addEventListener(
    "ended",
    playNext
);

audioPlayer.addEventListener(
    "ended",
    playNext
);

function playNext() {

    if (!playlist.length) return;

    loadTrack(
        currentIndex <
        playlist.length - 1
            ? currentIndex + 1
            : 0
    );
}


/* =========================================
   EVENTOS
========================================= */

[videoPlayer, audioPlayer]
.forEach(player => {

    player.addEventListener(
        "play",
        updatePlayButton
    );

    player.addEventListener(
        "pause",
        updatePlayButton
    );

    player.addEventListener(
        "timeupdate",
        updateProgress
    );

    player.addEventListener(
        "loadedmetadata",
        updateProgress
    );

    player.addEventListener(
        "ended",
        updatePlayButton
    );
});


/* =========================================
   PLAYLIST
========================================= */

function renderPlaylist() {

    trackCount.textContent =
        playlist.length;

    if (!playlist.length) {

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

        const item =
            document.createElement("div");

        item.className =
            `track ${
                index === currentIndex
                    ? "active"
                    : ""
            }`;

        item.innerHTML = `
            <span class="track-number">
                ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="track-icon">
                ${
                    track.type.startsWith("video/")
                        ? "🎬"
                        : "🎵"
                }
            </span>

            <div class="track-info">
                <span class="track-name">
                    ${escapeHTML(track.name)}
                </span>

                <span class="track-type">
                    ${
                        track.type.startsWith("video/")
                            ? "Vídeo"
                            : "Audio"
                    }
                </span>
            </div>

            <button class="remove-track"
                    title="Eliminar">
                ✕
            </button>
        `;

        item.addEventListener("click", e => {

            if (
                e.target.closest(".remove-track")
            ) return;

            loadTrack(index);
        });

        item.querySelector(
            ".remove-track"
        ).addEventListener(
            "click",
            e => {

                e.stopPropagation();

                removeTrack(index);
            }
        );

        playlistElement.appendChild(item);
    });

    updateEqualizer();
}


function removeTrack(index) {

    const track = playlist[index];

    if (
        track?.temporary &&
        track.url
    ) {
        URL.revokeObjectURL(track.url);
    }

    const wasCurrent =
        index === currentIndex;

    playlist.splice(index, 1);

    if (!playlist.length) {

        resetPlayer();
        currentIndex = -1;

    } else if (wasCurrent) {

        currentIndex = -1;

        loadTrack(
            Math.min(
                index,
                playlist.length - 1
            )
        );

    } else {

        if (index < currentIndex)
            currentIndex--;

        renderPlaylist();
    }

    updateMyMusicActive();
}


clearPlaylistBtn.addEventListener(
    "click",
    () => {

        playlist.forEach(track => {

            if (
                track.temporary &&
                track.url
            ) {
                URL.revokeObjectURL(
                    track.url
                );
            }
        });

        playlist = [];

        resetPlayer();

        currentIndex = -1;

        renderPlaylist();
        updateMyMusicActive();
    }
);


/* =========================================
   RESET
========================================= */

function resetPlayer() {

    stopPlayers();

    videoPlayer.classList.remove("active");

    videoPlayer.removeAttribute("src");
    audioPlayer.removeAttribute("src");

    activeMedia = null;

    emptyState.classList.remove("hidden");

    fullscreenBtn.classList.remove("visible");

    mediaContainer.classList.remove(
        "playing",
        "media-changing"
    );

    currentTitle.textContent =
        "Ningún archivo seleccionado";

    mediaType.textContent = "---";

    progress.value = 0;

    currentTime.textContent = "00:00";
    duration.textContent = "00:00";

    playBtn.textContent = "▶";
    playBtn.classList.remove("playing");
}


/* =========================================
   MI MUSICA
========================================= */

function renderMyMusic() {

    myMusicList.innerHTML = "";

    miMusica.forEach((song, index) => {

        const item =
            document.createElement("div");

        item.className = "my-song";
        item.dataset.url = song.url;

        item.innerHTML = `
            <span class="my-song-number">
                ${String(index + 1).padStart(2, "0")}
            </span>

            <span class="my-song-icon">
                🎵
            </span>

            <div class="my-song-info">
                <span class="my-song-name">
                    ${escapeHTML(song.name)}
                </span>

                <span class="my-song-type">
                    MP3 • Mi biblioteca
                </span>
            </div>

            <button class="my-song-play">
                ▶
            </button>
        `;

        item.addEventListener(
            "click",
            () => playPersonalSong(song)
        );

        myMusicList.appendChild(item);
    });
}


function playPersonalSong(song) {

    const existing =
        playlist.findIndex(
            track => track.url === song.url
        );

    if (existing !== -1) {

        loadTrack(existing);

    } else {

        playlist.push({
            file:null,
            url:song.url,
            name:song.name,
            type:song.type,
            personal:true
        });

        renderPlaylist();

        loadTrack(
            playlist.length - 1
        );
    }

    updateMyMusicActive();
}


function updateMyMusicActive() {

    document
        .querySelectorAll(".my-song")
        .forEach(item => {

            item.classList.remove("active");

            if (
                activeMedia &&
                playlist[currentIndex] &&
                playlist[currentIndex].url ===
                item.dataset.url
            ) {
                item.classList.add("active");
            }
        });
}


/* =========================================
   RADIO
========================================= */

const radioAudio = $("radioAudio");
const radioPlay = $("radioPlay");
const radioName = $("radioName");
const radioGenre = $("radioGenre");
const radioStatus = $("radioStatus");
const radioVolume = $("radioVolume");
const radioVolumeValue = $("radioVolumeValue");
const radioList = $("radioList");

const radios = [

    {
        name:"LOS40 España",
        country:"España",
        genre:"Pop / Éxitos",
        icon:"🇪🇸",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/Los40.mp3",
        web:"https://los40.com/"
    },

    {
        name:"LOS40 Classic",
        country:"España",
        genre:"Clásicos",
        icon:"🎸",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3",
        web:"https://los40.com/"
    },

    {
        name:"LOS40 Urban",
        country:"España",
        genre:"Urbano / Reguetón",
        icon:"🔥",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_URBAN.mp3",
        web:"https://los40.com/"
    },

    {
        name:"LOS40 Dance",
        country:"Europa",
        genre:"Dance / Electrónica",
        icon:"💿",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_DANCE.mp3",
        web:"https://los40.com/"
    },

    {
        name:"KISS FM",
        country:"España",
        genre:"80s / 90s / Pop",
        icon:"💜",
        url:"https://kissfm.kissfmradio.cires21.com/kissfm.mp3",
        web:"https://www.kissfm.es/"
    },

    {
        name:"Radio Nacional",
        country:"España",
        genre:"Actualidad / Música",
        icon:"🇪🇸",
        url:"https://dispatcher.rndfnk.com/crtve/rne1/main/mp3/high",
        web:"https://www.rtve.es/play/radio/rne/"
    },

    {
        name:"Radio 3",
        country:"España",
        genre:"Música alternativa",
        icon:"🎧",
        url:"https://radio3.rtveradio.cires21.com/radio3_hc.mp3",
        web:"https://www.rtve.es/play/radio/radio-3/"
    },

    {
        name:"Radio Clásica",
        country:"España",
        genre:"Clásica",
        icon:"🎻",
        url:"https://radioclasica.rtveradio.cires21.com/radioclasica_hc.mp3",
        web:"https://www.rtve.es/play/radio/"
    },

    {
        name:"Cadena Dial",
        country:"España",
        genre:"Pop en español",
        icon:"🎤",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3",
        web:"https://www.cadenadial.com/"
    },

    {
        name:"Radiolé",
        country:"España",
        genre:"Español / Latino",
        icon:"💃",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOLE.mp3",
        web:"https://www.radiole.com/"
    }
];

let currentRadio = -1;


/* =========================================
   RADIOS
========================================= */

function renderRadios(filter = "all") {

    radioList.innerHTML = "";

    radios
        .filter(r =>
            filter === "all" ||
            r.country === filter ||
            r.genre.toLowerCase().includes(
                filter.toLowerCase()
            )
        )
        .forEach((radio, index) => {

            const item =
                document.createElement("div");

            item.className =
                `radio-item ${
                    index === currentRadio
                        ? "active"
                        : ""
                }`;

            item.innerHTML = `
                <span class="radio-item-icon">
                    ${radio.icon}
                </span>

                <div class="radio-item-info">
                    <span class="radio-item-name">
                        ${escapeHTML(radio.name)}
                    </span>

                    <span class="radio-item-genre">
                        ${escapeHTML(radio.genre)}
                    </span>
                </div>

                <span class="radio-item-play">
                    ▶
                </span>
            `;

            item.addEventListener(
                "click",
                () => playRadio(index)
            );

            radioList.appendChild(item);
        });
}


function playRadio(index) {

    const radio = radios[index];

    if (!radio) return;

    currentRadio = index;

    radioAudio.src = radio.url;
    radioAudio.volume =
        Number(radioVolume.value);

    radioAudio.play()
        .then(() => {

            radioName.textContent =
                radio.name;

            radioGenre.textContent =
                radio.genre;

            radioStatus.textContent =
                "● EN DIRECT";

            radioStatus.classList.add(
                "live"
            );

            radioPlay.textContent =
                "⏸";

            renderRadios(
                document
                    .querySelector(
                        ".radio-filter.active"
                    )
                    ?.dataset.filter ||
                "all"
            );
        })
        .catch(() => {

            radioStatus.textContent =
                "NO DISPONIBLE";

            radioStatus.classList.remove(
                "live"
            );

            radioPlay.textContent =
                "▶";

            if (
                confirm(
                    `${radio.name} no permite la reproducción directa en este navegador.\n\n¿Abrir su web oficial?`
                )
            ) {
                window.open(
                    radio.web,
                    "_blank",
                    "noopener"
                );
            }
        });
}


radioPlay.addEventListener(
    "click",
    () => {

        if (!radioAudio.src) {

            if (radios.length)
                playRadio(0);

            return;
        }

        if (radioAudio.paused) {

            radioAudio.play()
                .catch(() => {});

        } else {

            radioAudio.pause();
        }
    }
);


radioAudio.addEventListener(
    "play",
    () => {

        radioPlay.textContent = "⏸";

        radioStatus.textContent =
            "● EN DIRECT";

        radioStatus.classList.add(
            "live"
        );
    }
);


radioAudio.addEventListener(
    "pause",
    () => {

        radioPlay.textContent = "▶";

        radioStatus.textContent =
            "PAUSADA";

        radioStatus.classList.remove(
            "live"
        );
    }
);


radioAudio.addEventListener(
    "error",
    () => {

        radioStatus.textContent =
            "SEÑAL NO DISPONIBLE";

        radioStatus.classList.remove(
            "live"
        );
    }
);


/* =========================================
   VOLUMEN RADIO
========================================= */

radioVolume.addEventListener(
    "input",
    () => {

        const value =
            Number(radioVolume.value);

        radioAudio.volume = value;

        radioVolumeValue.textContent =
            `${Math.round(value * 100)}%`;
    }
);


/* =========================================
   FILTROS
========================================= */

document
    .querySelectorAll(".radio-filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".radio-filter"
                    )
                    .forEach(b =>
                        b.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );

                renderRadios(
                    button.dataset.filter
                );
            }
        );
    });


/* =========================================
   TECLADO
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (!activeMedia) return;

        if (
            event.target.tagName === "INPUT" ||
            event.target.tagName === "TEXTAREA"
        ) return;

        switch (event.code) {

            case "Space":
                event.preventDefault();
                togglePlay();
                break;

            case "ArrowLeft":
                activeMedia.currentTime =
                    Math.max(
                        0,
                        activeMedia.currentTime - 5
                    );
                break;

            case "ArrowRight":
                activeMedia.currentTime =
                    Math.min(
                        activeMedia.duration ||
                        Infinity,
                        activeMedia.currentTime + 5
                    );
                break;

            case "ArrowUp":
                event.preventDefault();

                activeMedia.volume =
                    Math.min(
                        1,
                        activeMedia.volume + .05
                    );

                volume.value =
                    activeMedia.volume;

                volumeValue.textContent =
                    `${Math.round(
                        activeMedia.volume * 100
                    )}%`;

                break;

            case "ArrowDown":
                event.preventDefault();

                activeMedia.volume =
                    Math.max(
                        0,
                        activeMedia.volume - .05
                    );

                volume.value =
                    activeMedia.volume;

                volumeValue.textContent =
                    `${Math.round(
                        activeMedia.volume * 100
                    )}%`;

                break;
        }
    }
);


/* =========================================
   UTILIDADES
========================================= */

function formatTime(seconds) {

    if (!Number.isFinite(seconds))
        return "00:00";

    seconds =
        Math.max(
            0,
            Math.floor(seconds)
        );

    return `${String(
        Math.floor(seconds / 60)
    ).padStart(2,"0")}:${String(
        seconds % 60
    ).padStart(2,"0")}`;
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================================
   INICIO
========================================= */

renderPlaylist();
renderMyMusic();
renderRadios();

volumeValue.textContent = "100%";
radioVolumeValue.textContent = "100%";