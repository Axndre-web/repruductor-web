const $ = id => document.getElementById(id);

const fileInput = $("fileInput");
const videoPlayer = $("videoPlayer");
const audioPlayer = $("audioPlayer");
const radioAudio = $("radioAudio");

const visualizer = $("visualizer");
const visualizerContainer = $("visualizerContainer");
const emptyState = $("emptyState");

const playBtn = $("playBtn");
const backBtn = $("backBtn");
const forwardBtn = $("forwardBtn");
const shuffleBtn = $("shuffleBtn");
const repeatBtn = $("repeatBtn");
const favoriteBtn = $("favoriteBtn");

const progress = $("progress");
const currentTime = $("currentTime");
const duration = $("duration");

const volume = $("volume");
const volumeValue = $("volumeValue");
const muteBtn = $("muteBtn");

const fullscreenBtn = $("fullscreenBtn");
const currentTitle = $("currentTitle");
const currentMeta = $("currentMeta");
const mediaType = $("mediaType");

const playlistElement = $("playlist");
const trackCount = $("trackCount");
const clearPlaylistBtn = $("clearPlaylist");

const myMusicList = $("myMusicList");
const favoritesList = $("favoritesList");
const historyList = $("historyList");

const radioPlay = $("radioPlay");
const radioName = $("radioName");
const radioGenre = $("radioGenre");
const radioStatus = $("radioStatus");
const radioVolume = $("radioVolume");
const radioVolumeValue = $("radioVolumeValue");
const radioList = $("radioList");
const radioFavorite = $("radioFavorite");

let playlist = [];
let currentIndex = -1;
let activeMedia = null;
let lastVolume = 1;

let shuffle = false;
let repeat = "off";

let playlistCategory = "all";
let playlistSearch = "";

let currentRadio = -1;
let radioFilter = "all";
let radioSearch = "";

let sleepTimer = null;
let sleepEnd = null;

let favorites = JSON.parse(
    localStorage.getItem("neonFavorites") || "[]"
);

let favoriteRadios = JSON.parse(
    localStorage.getItem("neonFavoriteRadios") || "[]"
);

let history = JSON.parse(
    localStorage.getItem("neonHistory") || "[]"
);

const themes = ["purple", "blue", "synthwave", "matrix"];
let themeIndex = themes.indexOf(
    localStorage.getItem("neonTheme") || "purple"
);

if (themeIndex < 0) themeIndex = 0;


/* =========================================
   MI MUSICA
========================================= */

const miMusica = Array.from(
    {length:25},
    (_,i) => {
        const numero = String(i + 1).padStart(2,"0");

        return {
            name:`${numero}-cancion.mp3`,
            url:`musica/${numero}-cancion.mp3`,
            type:"audio/mp3",
            personal:true
        };
    }
);


/* =========================================
   RADIOS
========================================= */

const radios = [

    {
        name:"LOS40 España",
        country:"España",
        genre:"Pop / Éxitos",
        tags:["Pop"],
        icon:"🇪🇸",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/Los40.mp3",
        web:"https://los40.com/"
    },

    {
        name:"LOS40 Classic",
        country:"España",
        genre:"Clásicos",
        tags:["Clásica"],
        icon:"🎸",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3",
        web:"https://los40.com/"
    },

    {
        name:"LOS40 Urban",
        country:"España",
        genre:"Urbano / Reguetón",
        tags:["Urbano"],
        icon:"🔥",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_URBAN.mp3",
        web:"https://los40.com/"
    },

    {
        name:"LOS40 Dance",
        country:"Europa",
        genre:"Dance / Electrónica",
        tags:["Urbano"],
        icon:"💿",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_DANCE.mp3",
        web:"https://los40.com/"
    },

    {
        name:"KISS FM",
        country:"España",
        genre:"80s / 90s / Pop",
        tags:["Pop"],
        icon:"💜",
        url:"https://kissfm.kissfmradio.cires21.com/kissfm.mp3",
        web:"https://www.kissfm.es/"
    },

    {
        name:"Radio Nacional",
        country:"España",
        genre:"Actualidad / Música",
        tags:["Pop"],
        icon:"🇪🇸",
        url:"https://dispatcher.rndfnk.com/crtve/rne1/main/mp3/high",
        web:"https://www.rtve.es/play/radio/rne/"
    },

    {
        name:"Radio 3",
        country:"España",
        genre:"Música alternativa",
        tags:["Pop","Urbano"],
        icon:"🎧",
        url:"https://radio3.rtveradio.cires21.com/radio3_hc.mp3",
        web:"https://www.rtve.es/play/radio/radio-3/"
    },

    {
        name:"Radio Clásica",
        country:"España",
        genre:"Música clásica",
        tags:["Clásica"],
        icon:"🎻",
        url:"https://radioclasica.rtveradio.cires21.com/radioclasica_hc.mp3",
        web:"https://www.rtve.es/play/radio/"
    },

    {
        name:"Cadena Dial",
        country:"España",
        genre:"Pop en español",
        tags:["Pop"],
        icon:"🎤",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3",
        web:"https://www.cadenadial.com/"
    },

    {
        name:"Radiolé",
        country:"España",
        genre:"Español / Latino",
        tags:["Pop"],
        icon:"💃",
        url:"https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOLE.mp3",
        web:"https://www.radiole.com/"
    }
];


/* =========================================
   STORAGE
========================================= */

function saveData(){
    localStorage.setItem(
        "neonFavorites",
        JSON.stringify(favorites)
    );

    localStorage.setItem(
        "neonFavoriteRadios",
        JSON.stringify(favoriteRadios)
    );

    localStorage.setItem(
        "neonHistory",
        JSON.stringify(history.slice(0,50))
    );
}


/* =========================================
   TEMA
========================================= */

function applyTheme(){
    document.body.removeAttribute("data-theme");

    const theme = themes[themeIndex];

    if(theme !== "purple"){
        document.body.dataset.theme = theme;
    }

    localStorage.setItem("neonTheme",theme);
}

$("themeBtn").addEventListener("click",() => {

    themeIndex =
        (themeIndex + 1) % themes.length;

    applyTheme();

    const names = {
        purple:"Neon Purple",
        blue:"Cyber Blue",
        synthwave:"Synthwave",
        matrix:"Matrix"
    };

    showToast(`Tema: ${names[themes[themeIndex]]}`);
});

applyTheme();


/* =========================================
   NAVEGACIÓN
========================================= */

function openSection(section){

    document
        .querySelectorAll(".page-section")
        .forEach(el =>
            el.classList.remove("active")
        );

    document
        .querySelectorAll(".nav-btn")
        .forEach(el =>
            el.classList.remove("active")
        );

    const target = $(`section-${section}`);

    if(target){
        target.classList.add("active");
    }

    const nav = document.querySelector(
        `.nav-btn[data-section="${section}"]`
    );

    if(nav){
        nav.classList.add("active");
    }

    if(section === "favorites")
        renderFavorites();

    if(section === "history")
        renderHistory();
}

document
    .querySelectorAll("[data-section]")
    .forEach(button => {

        button.addEventListener("click",() => {

            openSection(
                button.dataset.section
            );

        });
    });


/* =========================================
   ARCHIVOS
========================================= */

fileInput.addEventListener("change",e => {

    [...e.target.files].forEach(file => {

        if(
            !file.type.startsWith("audio/") &&
            !file.type.startsWith("video/")
        ){
            return;
        }

        playlist.push({
            file,
            url:URL.createObjectURL(file),
            name:file.name,
            type:file.type,
            temporary:true
        });
    });

    renderPlaylist();

    if(
        currentIndex === -1 &&
        playlist.length
    ){
        loadTrack(0);
    }

    fileInput.value = "";
});


/* =========================================
   CARGAR TRACK
========================================= */

function loadTrack(index,autoplay=true){

    if(
        index < 0 ||
        index >= playlist.length
    ) return;

    currentIndex = index;

    const track = playlist[index];

    stopPlayers();

    visualizerContainer.classList.add(
        "changing"
    );

    setTimeout(() => {
        visualizerContainer.classList.remove(
            "changing"
        );
    },350);

    if(track.type.startsWith("video/")){

        activeMedia = videoPlayer;

        videoPlayer.src = track.url;
        videoPlayer.classList.add("active");

        audioPlayer.removeAttribute("src");

        fullscreenBtn.classList.add("visible");

        mediaType.textContent = "VÍDEO";
        currentMeta.textContent = "Archivo de vídeo";

    }else{

        activeMedia = audioPlayer;

        audioPlayer.src = track.url;

        videoPlayer.classList.remove("active");
        videoPlayer.removeAttribute("src");

        fullscreenBtn.classList.remove("visible");

        mediaType.textContent = "AUDIO";
        currentMeta.textContent = track.personal
            ? "Mi biblioteca"
            : "Archivo local";
    }

    emptyState.classList.add("hidden");

    currentTitle.textContent = track.name;

    activeMedia.volume =
        Number(volume.value);

    renderPlaylist();
    updateFavoriteButton();
    updateMyMusicActive();

    addHistory(track);

    if(autoplay){
        registerGlobalPlay({
            type:track.type.startsWith("video/") ? "video" : "audio",
            name:track.name
        });
        activeMedia.play().catch(()=>{});
    }

    updatePlayButton();
}


/* =========================================
   PLAY / PAUSE
========================================= */

function stopPlayers(){
    videoPlayer.pause();
    audioPlayer.pause();
}

function togglePlay(){

    if(!activeMedia){

        if(playlist.length){
            loadTrack(0);
        }

        return;
    }

    activeMedia.paused
        ? activeMedia.play().catch(()=>{})
        : activeMedia.pause();
}

playBtn.addEventListener(
    "click",
    togglePlay
);

function updatePlayButton(){

    const playing =
        activeMedia &&
        !activeMedia.paused;

    playBtn.textContent =
        playing ? "⏸" : "▶";

    playBtn.classList.toggle(
        "playing",
        playing
    );

    visualizerContainer.classList.toggle(
        "playing",
        playing
    );

    $("visualizerStatus").textContent =
        playing ? "● PLAYING" : "● PAUSED";

    $("visualizerStatus").classList.toggle(
        "playing",
        playing
    );
}


/* =========================================
   PROGRESO
========================================= */

function updateProgress(){

    if(!activeMedia) return;

    const current =
        activeMedia.currentTime || 0;

    const total =
        activeMedia.duration || 0;

    progress.value =
        total ? current / total * 100 : 0;

    currentTime.textContent =
        formatTime(current);

    duration.textContent =
        formatTime(total);
}

progress.addEventListener("input",() => {

    if(
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

backBtn.addEventListener("click",() => {

    if(!activeMedia) return;

    activeMedia.currentTime =
        Math.max(
            0,
            activeMedia.currentTime - 10
        );
});

forwardBtn.addEventListener("click",() => {

    if(!activeMedia) return;

    activeMedia.currentTime =
        Math.min(
            activeMedia.duration || Infinity,
            activeMedia.currentTime + 10
        );
});


/* =========================================
   SHUFFLE / REPEAT
========================================= */

shuffleBtn.addEventListener("click",() => {

    shuffle = !shuffle;

    shuffleBtn.classList.toggle(
        "active",
        shuffle
    );

    $("shuffleStatus").textContent =
        shuffle
            ? "ALEATORIO ON"
            : "ALEATORIO OFF";
});

repeatBtn.addEventListener("click",() => {

    if(repeat === "off"){
        repeat = "one";
    }else if(repeat === "one"){
        repeat = "all";
    }else{
        repeat = "off";
    }

    repeatBtn.classList.toggle(
        "active",
        repeat !== "off"
    );

    repeatBtn.textContent =
        repeat === "one"
            ? "🔂"
            : "🔁";

    $("repeatStatus").textContent =
        repeat === "one"
            ? "REPETIR CANCIÓN"
            : repeat === "all"
                ? "REPETIR PLAYLIST"
                : "REPETIR OFF";
});


/* =========================================
   SIGUIENTE
========================================= */

function playNext(){

    if(!playlist.length) return;

    if(repeat === "one"){

        loadTrack(currentIndex);

        return;
    }

    let next;

    if(shuffle && playlist.length > 1){

        do{
            next =
                Math.floor(
                    Math.random() *
                    playlist.length
                );
        }while(next === currentIndex);

    }else{

        next = currentIndex + 1;

        if(next >= playlist.length){

            if(repeat === "all"){
                next = 0;
            }else{
                updatePlayButton();
                return;
            }
        }
    }

    loadTrack(next);
}

videoPlayer.addEventListener(
    "ended",
    playNext
);

audioPlayer.addEventListener(
    "ended",
    playNext
);


/* =========================================
   EVENTOS MEDIA
========================================= */

[videoPlayer,audioPlayer]
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
});


/* =========================================
   FAVORITOS
========================================= */

function trackKey(track){

    if(!track) return "";

    return `${track.name}::${track.url}`;
}

function isFavorite(track){

    return favorites.includes(
        trackKey(track)
    );
}

function toggleFavorite(track){

    if(!track) return;

    const key = trackKey(track);

    if(favorites.includes(key)){

        favorites =
            favorites.filter(
                item => item !== key
            );

        showToast("Eliminado de favoritos");

    }else{

        favorites.push(key);

        showToast("❤️ Añadido a favoritos");
    }

    saveData();

    updateFavoriteButton();
    renderPlaylist();
    renderFavorites();
    updateCounters();
}

favoriteBtn.addEventListener(
    "click",
    () => {

        if(activeMedia && playlist[currentIndex]){
            toggleFavorite(
                playlist[currentIndex]
            );
        }
    }
);

function updateFavoriteButton(){

    const active =
        playlist[currentIndex];

    const favorite =
        active && isFavorite(active);

    favoriteBtn.textContent =
        favorite ? "♥" : "♡";

    favoriteBtn.classList.toggle(
        "active",
        favorite
    );
}


/* =========================================
   PLAYLIST
========================================= */

function renderPlaylist(){

    trackCount.textContent =
        playlist.length;

    const filtered =
        playlist.filter((track,index) => {

            const search =
                playlistSearch.toLowerCase();

            const matchesSearch =
                !search ||
                track.name
                    .toLowerCase()
                    .includes(search);

            let matchesCategory = true;

            if(playlistCategory === "audio"){
                matchesCategory =
                    track.type.startsWith("audio/");
            }

            if(playlistCategory === "video"){
                matchesCategory =
                    track.type.startsWith("video/");
            }

            if(playlistCategory === "favorites"){
                matchesCategory =
                    isFavorite(track);
            }

            return matchesSearch &&
                   matchesCategory;
        });

    if(!filtered.length){

        playlistElement.innerHTML = `
            <div class="playlist-empty">
                <span>🎵</span>
                <p>${
                    playlist.length
                        ? "No se encontraron resultados"
                        : "Tu lista está vacía"
                }</p>
                <small>${
                    playlist.length
                        ? "Prueba con otra búsqueda"
                        : "Carga archivos para comenzar"
                }</small>
            </div>
        `;

        return;
    }

    playlistElement.innerHTML = "";

    filtered.forEach(track => {

        const index =
            playlist.indexOf(track);

        const item =
            document.createElement("div");

        item.className =
            `track ${
                index === currentIndex
                    ? "active"
                    : ""
            }`;

        const favorite =
            isFavorite(track);

        item.innerHTML = `
            <span class="track-number">
                ${String(index + 1).padStart(2,"0")}
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

            <button class="track-favorite ${
                favorite ? "active" : ""
            }">
                ${favorite ? "♥" : "♡"}
            </button>

            <button class="remove-track">
                ✕
            </button>
        `;

        item.addEventListener("click",e => {

            if(
                e.target.closest(".remove-track") ||
                e.target.closest(".track-favorite")
            ) return;

            loadTrack(index);
        });

        item.querySelector(
            ".track-favorite"
        ).addEventListener(
            "click",
            e => {

                e.stopPropagation();

                toggleFavorite(track);
            }
        );

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
}

$("playlistSearch").addEventListener(
    "input",
    e => {

        playlistSearch =
            e.target.value;

        renderPlaylist();
    }
);

document
    .querySelectorAll(".category-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".category-btn")
                    .forEach(b =>
                        b.classList.remove("active")
                    );

                button.classList.add("active");

                playlistCategory =
                    button.dataset.category;

                renderPlaylist();
            }
        );
    });


/* =========================================
   ELIMINAR
========================================= */

function removeTrack(index){

    const track = playlist[index];

    if(
        track &&
        track.temporary &&
        track.url
    ){
        URL.revokeObjectURL(track.url);
    }

    const wasCurrent =
        index === currentIndex;

    playlist.splice(index,1);

    if(!playlist.length){

        resetPlayer();
        currentIndex = -1;

    }else if(wasCurrent){

        currentIndex = -1;

        loadTrack(
            Math.min(
                index,
                playlist.length - 1
            )
        );

    }else{

        if(index < currentIndex){
            currentIndex--;
        }

        renderPlaylist();
    }

    updateFavoriteButton();
}

clearPlaylistBtn.addEventListener(
    "click",
    () => {

        playlist.forEach(track => {

            if(
                track.temporary &&
                track.url
            ){
                URL.revokeObjectURL(track.url);
            }
        });

        playlist = [];

        resetPlayer();

        currentIndex = -1;

        renderPlaylist();
    }
);


/* =========================================
   RESET
========================================= */

function resetPlayer(){

    stopPlayers();

    videoPlayer.classList.remove("active");

    videoPlayer.removeAttribute("src");
    audioPlayer.removeAttribute("src");

    activeMedia = null;

    emptyState.classList.remove("hidden");

    fullscreenBtn.classList.remove("visible");

    currentTitle.textContent =
        "Ningún archivo seleccionado";

    currentMeta.textContent =
        "Neon Player X";

    mediaType.textContent =
        "---";

    progress.value = 0;

    currentTime.textContent =
        "00:00";

    duration.textContent =
        "00:00";

    playBtn.textContent = "▶";
    playBtn.classList.remove("playing");

    $("visualizerStatus").textContent =
        "● READY";
}


/* =========================================
   MI MUSICA
========================================= */

function renderMyMusic(){

    const search =
        ($("librarySearch").value || "")
            .toLowerCase();

    myMusicList.innerHTML = "";

    const filtered =
        miMusica.filter(song =>
            song.name
                .toLowerCase()
                .includes(search)
        );

    filtered.forEach((song,index) => {

        const item =
            document.createElement("div");

        item.className =
            "my-song";

        item.dataset.url =
            song.url;

        item.innerHTML = `
            <span class="my-song-number">
                ${String(index + 1).padStart(2,"0")}
            </span>

            <span class="my-song-icon">🎵</span>

            <div class="my-song-info">
                <span class="my-song-name">
                    ${escapeHTML(song.name)}
                </span>

                <span class="my-song-type">
                    MP3 · Mi biblioteca
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

    updateMyMusicActive();
}

$("librarySearch").addEventListener(
    "input",
    renderMyMusic
);

function playPersonalSong(song){

    const existing =
        playlist.findIndex(
            track => track.url === song.url
        );

    if(existing !== -1){

        loadTrack(existing);

    }else{

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
}

function updateMyMusicActive(){

    document
        .querySelectorAll(".my-song")
        .forEach(item => {

            item.classList.remove("active");

            if(
                activeMedia &&
                playlist[currentIndex] &&
                playlist[currentIndex].url ===
                item.dataset.url
            ){
                item.classList.add("active");
            }
        });
}


/* =========================================
   HISTORIAL
========================================= */

function addHistory(track){

    if(!track) return;

    const key = trackKey(track);

    history =
        history.filter(
            item => item.key !== key
        );

    history.unshift({
        key,
        name:track.name,
        url:track.url,
        type:track.type,
        time:new Date().toLocaleString("es-ES")
    });

    history =
        history.slice(0,30);

    saveData();

    updateCounters();
}

function renderHistory(){

    if(!history.length){

        historyList.innerHTML = `
            <div class="playlist-empty">
                <span>🕘</span>
                <p>Aún no hay historial</p>
                <small>Las canciones reproducidas aparecerán aquí</small>
            </div>
        `;

        return;
    }

    historyList.innerHTML = "";

    history.forEach(item => {

        const element =
            document.createElement("div");

        element.className =
            "special-item";

        element.innerHTML = `
            <span class="my-song-icon">
                ${
                    item.type.startsWith("video/")
                        ? "🎬"
                        : "🎵"
                }
            </span>

            <div class="special-info">
                <span class="special-name">
                    ${escapeHTML(item.name)}
                </span>

                <span class="special-meta">
                    ${escapeHTML(item.time)}
                </span>
            </div>

            <button class="special-play">
                ▶
            </button>
        `;

        element.addEventListener(
            "click",
            () => playHistoryItem(item)
        );

        historyList.appendChild(element);
    });
}

function playHistoryItem(item){

    const existing =
        playlist.findIndex(
            track =>
                track.url === item.url &&
                track.name === item.name
        );

    if(existing !== -1){

        loadTrack(existing);

    }else{

        playlist.push({
            file:null,
            url:item.url,
            name:item.name,
            type:item.type,
            personal:true
        });

        renderPlaylist();

        loadTrack(
            playlist.length - 1
        );
    }
}

$("clearHistory").addEventListener(
    "click",
    () => {

        history = [];

        saveData();

        renderHistory();
        updateCounters();

        showToast("Historial eliminado");
    }
);


/* =========================================
   FAVORITOS LISTA
========================================= */

function renderFavorites(){

    const favoriteTracks =
        playlist.filter(track =>
            isFavorite(track)
        );

    $("favoriteSectionCount").textContent =
        favoriteTracks.length;

    if(!favoriteTracks.length){

        favoritesList.innerHTML = `
            <div class="playlist-empty">
                <span>❤️</span>
                <p>No tienes favoritos todavía</p>
                <small>Pulsa el corazón de una canción para guardarla</small>
            </div>
        `;

        return;
    }

    favoritesList.innerHTML = "";

    favoriteTracks.forEach(track => {

        const item =
            document.createElement("div");

        item.className =
            "special-item";

        item.innerHTML = `
            <span class="my-song-icon">
                ${
                    track.type.startsWith("video/")
                        ? "🎬"
                        : "🎵"
                }
            </span>

            <div class="special-info">
                <span class="special-name">
                    ${escapeHTML(track.name)}
                </span>

                <span class="special-meta">
                    ${
                        track.type.startsWith("video/")
                            ? "Vídeo"
                            : "Audio"
                    }
                </span>
            </div>

            <button class="special-play">
                ▶
            </button>
        `;

        item.addEventListener(
            "click",
            () => {

                const index =
                    playlist.indexOf(track);

                if(index !== -1){
                    loadTrack(index);
                }
            }
        );

        favoritesList.appendChild(item);
    });
}


/* =========================================
   CONTADORES
========================================= */

function updateCounters(){

    $("favoriteCount").textContent =
        `${favorites.length} canciones`;

    $("historyCount").textContent =
        `${history.length} reproducciones`;

    $("favoriteSectionCount").textContent =
        playlist.filter(
            track => isFavorite(track)
        ).length;
}

updateCounters();


/* =========================================
   VOLUMEN
========================================= */

volume.addEventListener(
    "input",
    () => {

        const value =
            Number(volume.value);

        if(activeMedia){

            activeMedia.volume =
                value;

            activeMedia.muted =
                value === 0;
        }

        if(value > 0){
            lastVolume = value;
        }

        volumeValue.textContent =
            `${Math.round(value * 100)}%`;

        updateMuteIcon();
    }
);

muteBtn.addEventListener(
    "click",
    () => {

        if(!activeMedia) return;

        if(
            activeMedia.muted ||
            activeMedia.volume === 0
        ){

            activeMedia.muted = false;

            const value =
                lastVolume || 1;

            activeMedia.volume =
                value;

            volume.value =
                value;

        }else{

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
    }
);

function updateMuteIcon(){

    if(
        !activeMedia ||
        activeMedia.muted ||
        Number(volume.value) === 0
    ){
        muteBtn.textContent = "🔇";
    }else if(
        Number(volume.value) < .5
    ){
        muteBtn.textContent = "🔉";
    }else{
        muteBtn.textContent = "🔊";
    }
}


/* =========================================
   PANTALLA COMPLETA
========================================= */

fullscreenBtn.addEventListener(
    "click",
    () => {

        if(activeMedia !== videoPlayer)
            return;

        document.fullscreenElement
            ? document.exitFullscreen()
            : visualizerContainer.requestFullscreen?.();
    }
);


/* =========================================
   RADIO
========================================= */

function renderRadios(){

    radioList.innerHTML = "";

    const filtered =
        radios.filter(radio => {

            const query =
                radioSearch.toLowerCase();

            const matchesSearch =
                !query ||
                radio.name.toLowerCase().includes(query) ||
                radio.genre.toLowerCase().includes(query) ||
                radio.country.toLowerCase().includes(query);

            const matchesFilter =
                radioFilter === "all" ||
                radio.country === radioFilter ||
                radio.tags.includes(radioFilter);

            return matchesSearch &&
                   matchesFilter;
        });

    $("radioCount").textContent =
        `${filtered.length} emisoras`;

    filtered.forEach((radio,index) => {

        const realIndex =
            radios.indexOf(radio);

        const item =
            document.createElement("div");

        item.className =
            `radio-item ${
                realIndex === currentRadio
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
                    ${escapeHTML(radio.genre)} · ${escapeHTML(radio.country)}
                </span>
            </div>

            <span class="radio-item-play">
                ${
                    favoriteRadios.includes(radio.name)
                        ? "♥"
                        : "▶"
                }
            </span>
        `;

        item.addEventListener(
            "click",
            () => playRadio(realIndex)
        );

        radioList.appendChild(item);
    });
}

function playRadio(index){

    const radio =
        radios[index];

    if(!radio) return;

    const previousGlobalRadio = currentRadio;
    currentRadio = index;

    if(previousGlobalRadio !== index){
        registerGlobalRadioPlay(radio);
    }

    radioAudio.src =
        radio.url;

    radioAudio.volume =
        Number(radioVolume.value);

    radioName.textContent =
        radio.name;

    radioGenre.textContent =
        radio.genre;

    updateRadioFavorite();

    radioAudio.play()
        .then(() => {

            radioStatus.textContent =
                "● EN DIRECT";

            radioStatus.classList.add("live");

            radioPlay.textContent =
                "⏸";

            renderRadios();

            showToast(
                `📻 Conectado: ${radio.name}`
            );
        })
        .catch(() => {

            radioStatus.textContent =
                "SEÑAL NO DISPONIBLE";

            radioStatus.classList.remove("live");

            radioPlay.textContent =
                "▶";

            showToast(
                `${radio.name}: señal no disponible en este navegador`
            );
        });
}

radioPlay.addEventListener(
    "click",
    () => {

        if(!radioAudio.src){

            playRadio(0);

            return;
        }

        radioAudio.paused
            ? radioAudio.play().catch(()=>{})
            : radioAudio.pause();
    }
);

radioAudio.addEventListener(
    "play",
    () => {

        radioPlay.textContent =
            "⏸";

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

        radioPlay.textContent =
            "▶";

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

radioVolume.addEventListener(
    "input",
    () => {

        const value =
            Number(radioVolume.value);

        radioAudio.volume =
            value;

        radioVolumeValue.textContent =
            `${Math.round(value * 100)}%`;
    }
);

radioFavorite.addEventListener(
    "click",
    () => {

        if(currentRadio < 0) return;

        const radio =
            radios[currentRadio];

        if(
            favoriteRadios.includes(
                radio.name
            )
        ){

            favoriteRadios =
                favoriteRadios.filter(
                    name => name !== radio.name
                );

            showToast(
                "Emisora eliminada de favoritos"
            );

        }else{

            favoriteRadios.push(
                radio.name
            );

            showToast(
                "❤️ Emisora guardada en favoritos"
            );
        }

        saveData();
        updateRadioFavorite();
        renderRadios();
    }
);

function updateRadioFavorite(){

    if(currentRadio < 0){

        radioFavorite.textContent =
            "♡";

        return;
    }

    const active =
        favoriteRadios.includes(
            radios[currentRadio].name
        );

    radioFavorite.textContent =
        active ? "♥" : "♡";

    radioFavorite.classList.toggle(
        "active",
        active
    );
}

document
    .querySelectorAll(".radio-filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".radio-filter")
                    .forEach(b =>
                        b.classList.remove("active")
                    );

                button.classList.add("active");

                radioFilter =
                    button.dataset.filter;

                renderRadios();
            }
        );
    });

$("radioSearch").addEventListener(
    "input",
    e => {

        radioSearch =
            e.target.value;

        renderRadios();
    }
);


/* =========================================
   SLEEP TIMER
========================================= */

$("sleepBtn").addEventListener(
    "click",
    () => {

        $("sleepPanel")
            .classList.toggle("open");
    }
);

document
    .querySelectorAll(
        ".sleep-panel button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const minutes =
                    Number(
                        button.dataset.minutes
                    );

                clearTimeout(sleepTimer);

                sleepEnd =
                    minutes
                        ? Date.now() +
                          minutes * 60000
                        : null;

                if(!minutes){

                    $("sleepStatus").textContent =
                        "Temporizador apagado";

                    return;
                }

                $("sleepStatus").textContent =
                    `Apagado en ${minutes} min`;

                sleepTimer =
                    setTimeout(
                        sleepNow,
                        minutes * 60000
                    );

                showToast(
                    `🌙 Temporizador: ${minutes} minutos`
                );
            }
        );
    });

function sleepNow(){

    if(activeMedia){
        activeMedia.pause();
    }

    radioAudio.pause();

    $("sleepStatus").textContent =
        "Reproducción detenida";

    sleepEnd = null;

    showToast(
        "🌙 Temporizador finalizado"
    );
}


/* =========================================
   TECLADO
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if(
            event.target.tagName === "INPUT" ||
            event.target.tagName === "TEXTAREA"
        ) return;

        if(!activeMedia) return;

        switch(event.code){

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

            case "KeyM":
                muteBtn.click();
                break;

            case "KeyF":
                fullscreenBtn.click();
                break;

            case "KeyN":
                playNext();
                break;
        }
    }
);


/* =========================================
   VISUALIZADOR NEON
========================================= */

let audioContext;
let analyser;
let sourceNode;
let visualizerReady = false;

function initVisualizer(){

    if(visualizerReady) return;

    try{

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        analyser =
            audioContext.createAnalyser();

        analyser.fftSize = 256;

        analyser.smoothingTimeConstant =
            .82;

        sourceNode =
            audioContext.createMediaElementSource(
                audioPlayer
            );

        sourceNode.connect(analyser);
        analyser.connect(
            audioContext.destination
        );

        visualizerReady = true;

    }catch(error){

        console.warn(
            "Visualizer no disponible:",
            error
        );
    }
}

audioPlayer.addEventListener(
    "play",
    () => {

        initVisualizer();

        if(
            audioContext &&
            audioContext.state === "suspended"
        ){
            audioContext.resume();
        }
    }
);

const ctx =
    visualizer.getContext("2d");

function resizeVisualizer(){

    const rect =
        visualizer.getBoundingClientRect();

    const ratio =
        window.devicePixelRatio || 1;

    visualizer.width =
        rect.width * ratio;

    visualizer.height =
        rect.height * ratio;

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resizeVisualizer
);

resizeVisualizer();

function drawVisualizer(){

    requestAnimationFrame(
        drawVisualizer
    );

    const width =
        visualizer.clientWidth;

    const height =
        visualizer.clientHeight;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    if(
        !analyser ||
        !activeMedia ||
        activeMedia.paused
    ){

        drawIdleVisualizer(
            width,
            height
        );

        return;
    }

    const data =
        new Uint8Array(
            analyser.frequencyBinCount
        );

    analyser.getByteFrequencyData(data);

    const bars = 64;

    const gap = 3;

    const barWidth =
        Math.max(
            2,
            width / bars - gap
        );

    const gradient =
        ctx.createLinearGradient(
            0,
            height,
            0,
            height * .15
        );

    gradient.addColorStop(
        0,
        getCSS("--purple")
    );

    gradient.addColorStop(
        .5,
        getCSS("--cyan")
    );

    gradient.addColorStop(
        1,
        getCSS("--pink")
    );

    ctx.shadowBlur = 12;
    ctx.shadowColor =
        getCSS("--purple");

    ctx.fillStyle =
        gradient;

    for(let i=0;i<bars;i++){

        const dataIndex =
            Math.floor(
                i *
                data.length /
                bars
            );

        const value =
            data[dataIndex] / 255;

        const barHeight =
            Math.max(
                3,
                value * height * .7
            );

        const x =
            i * (barWidth + gap);

        const y =
            height - barHeight;

        ctx.fillRect(
            x,
            y,
            barWidth,
            barHeight
        );
    }

    ctx.shadowBlur = 0;
}

function drawIdleVisualizer(
    width,
    height
){

    const time =
        Date.now() / 1000;

    ctx.strokeStyle =
        getCSS("--purple");

    ctx.globalAlpha = .12;

    ctx.lineWidth = 1;

    for(let i=0;i<5;i++){

        ctx.beginPath();

        for(
            let x=0;
            x<=width;
            x+=8
        ){

            const y =
                height / 2 +
                Math.sin(
                    x / 100 +
                    time +
                    i
                ) *
                (10 + i * 5);

            if(x === 0)
                ctx.moveTo(x,y);
            else
                ctx.lineTo(x,y);
        }

        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}

function getCSS(variable){

    return getComputedStyle(
        document.body
    ).getPropertyValue(variable).trim();
}

drawVisualizer();


/* =========================================
   TOAST
========================================= */

function showToast(message){

    const container =
        $("toastContainer");

    const toast =
        document.createElement("div");

    toast.className =
        "toast";

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform =
            "translateX(15px)";

        setTimeout(
            () => toast.remove(),
            250
        );

    },2800);
}


/* =========================================
   UTILIDADES
========================================= */

function formatTime(seconds){

    if(!Number.isFinite(seconds))
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

function escapeHTML(text){

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


/* =========================================
   INICIO
========================================= */

volumeValue.textContent =
    "100%";

radioVolumeValue.textContent =
    "100%";

renderPlaylist();
renderMyMusic();
renderRadios();
renderFavorites();
renderHistory();
updateCounters();

/* =========================================
   NEON PLAYER X — CAPA GLOBAL
========================================= */

const NEON_CONFIG = {
    projectUrl: "",
    publishableKey: "",
    analyticsId: "",
    appVersion: "4.0.0"
};

if(window.NEON_BACKEND_CONFIG){
    NEON_CONFIG.projectUrl =
        window.NEON_BACKEND_CONFIG.projectUrl || "";
    NEON_CONFIG.publishableKey =
        window.NEON_BACKEND_CONFIG.publishableKey || "";
}

if(window.NEON_ANALYTICS_ID){
    NEON_CONFIG.analyticsId =
        window.NEON_ANALYTICS_ID;
}

const NEON_VISITOR_KEY = "neonVisitorIdV1";
const NEON_SESSION_KEY = "neonSessionIdV1";
const NEON_LOCAL_KEY = "neonLocalStatsV1";
const NEON_INSTALL_KEY = "neonInstallRegisteredV1";
const NEON_INSTALL_DISMISSED_KEY = "neonInstallDismissedV1";

const NEON_DEFAULTS = {
    visits:0,
    sessions:0,
    plays:0,
    radioPlays:0,
    installs:0,
    shares:0
};

let neonLocalStats =
    loadNeonLocalStats();

let neonGlobalStats = {
    totalVisits:0,
    uniqueVisitors:0,
    totalSessions:0,
    totalPlays:0,
    totalRadioPlays:0,
    totalInstalls:0,
    totalShares:0
};

function loadNeonLocalStats(){
    try{
        return {
            ...NEON_DEFAULTS,
            ...JSON.parse(
                localStorage.getItem(
                    NEON_LOCAL_KEY
                ) || "{}"
            )
        };
    }catch{
        return {...NEON_DEFAULTS};
    }
}

function saveNeonLocalStats(){
    localStorage.setItem(
        NEON_LOCAL_KEY,
        JSON.stringify(neonLocalStats)
    );
}

function makeRandomId(){
    if(
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ){
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function getNeonVisitorId(){

    let id =
        localStorage.getItem(
            NEON_VISITOR_KEY
        );

    if(!id){
        id = makeRandomId();
        localStorage.setItem(
            NEON_VISITOR_KEY,
            id
        );
    }

    return id;
}

function getNeonSessionId(){

    let id =
        sessionStorage.getItem(
            NEON_SESSION_KEY
        );

    if(!id){
        id = makeRandomId();
        sessionStorage.setItem(
            NEON_SESSION_KEY,
            id
        );
    }

    return id;
}

const neonVisitorId =
    getNeonVisitorId();

const neonSessionId =
    getNeonSessionId();

function globalBackendReady(){
    return Boolean(
        NEON_CONFIG.projectUrl &&
        NEON_CONFIG.publishableKey
    );
}

async function neonRPC(
    name,
    body={}
){

    if(!globalBackendReady()){
        return null;
    }

    const endpoint =
        NEON_CONFIG.projectUrl.replace(/\/$/,"") +
        `/rest/v1/rpc/${name}`;

    try{

        const response =
            await fetch(
                endpoint,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":
                            "application/json",
                        "apikey":
                            NEON_CONFIG.publishableKey,
                        "Authorization":
                            `Bearer ${NEON_CONFIG.publishableKey}`
                    },
                    body:
                        JSON.stringify(body)
                }
            );

        if(!response.ok){
            console.warn(
                "Backend global:",
                response.status
            );
            return null;
        }

        return await response.json();

    }catch(error){

        console.warn(
            "Backend global no disponible:",
            error
        );

        return null;
    }
}

function updateLocalStatsUI(){

    const score =
        Number(neonLocalStats.visits || 0) +
        Number(neonLocalStats.plays || 0) +
        Number(neonLocalStats.installs || 0) +
        Number(neonLocalStats.shares || 0);

    const level =
        score >= 1000 ? 10 :
        score >= 500 ? 9 :
        score >= 250 ? 8 :
        score >= 150 ? 7 :
        score >= 100 ? 6 :
        score >= 60 ? 5 :
        score >= 30 ? 4 :
        score >= 15 ? 3 :
        score >= 5 ? 2 : 1;

    const levelElement =
        $("activityLevel");

    const scoreElement =
        $("activityScore");

    const badge =
        $("activityBadge");

    const footer =
        $("footerActivity");

    if(levelElement)
        levelElement.textContent =
            `NIVEL ${level}`;

    if(scoreElement)
        scoreElement.textContent =
            score;

    if(badge){
        badge.dataset.level =
            String(level);

        badge.title =
            `Nivel ${level} · actividad local`;
    }

    if(footer)
        footer.textContent =
            `NIVEL ${level} · ${score} ACTIVIDAD`;

    document.body.dataset.activityLevel =
        String(level);
}

function updateGlobalStatsUI(){

    const visits =
        Number(
            neonGlobalStats.totalVisits || 0
        );

    const unique =
        Number(
            neonGlobalStats.uniqueVisitors || 0
        );

    if($("globalVisits")){
        $("globalVisits").textContent =
            formatGlobalNumber(visits);
    }

    if($("globalUniqueVisitors")){
        $("globalUniqueVisitors").textContent =
            formatGlobalNumber(unique);
    }

    document.body.dataset.globalReady =
        globalBackendReady()
            ? "1"
            : "0";
}

function formatGlobalNumber(value){

    const n = Number(value || 0);

    if(n < 1000)
        return String(n);

    if(n < 1000000)
        return `${(n/1000).toFixed(
            n >= 10000 ? 0 : 1
        )} K`;

    return `${(n/1000000).toFixed(1)} M`;
}

async function refreshGlobalStats(){

    const result =
        await neonRPC(
            "neon_get_stats"
        );

    if(
        result &&
        typeof result === "object"
    ){

        neonGlobalStats = {
            ...neonGlobalStats,
            ...result
        };
    }

    updateGlobalStatsUI();
}

async function registerGlobalEvent(
    eventType,
    metadata={}
){

    const result =
        await neonRPC(
            "neon_register_event",
            {
                p_event_type:eventType,
                p_visitor_id:neonVisitorId,
                p_session_id:neonSessionId,
                p_metadata:metadata
            }
        );

    if(
        result &&
        typeof result === "object"
    ){

        neonGlobalStats = {
            ...neonGlobalStats,
            ...result
        };

        updateGlobalStatsUI();
    }

    return result;
}

async function registerGlobalVisit(){

    neonLocalStats.visits++;
    neonLocalStats.sessions++;

    saveNeonLocalStats();
    updateLocalStatsUI();

    await registerGlobalEvent(
        "visit",
        {
            version:NEON_CONFIG.appVersion
        }
    );

    await refreshGlobalStats();
}

async function registerGlobalPlay(media={}){

    neonLocalStats.plays++;

    saveNeonLocalStats();
    updateLocalStatsUI();

    await registerGlobalEvent(
        "play",
        {
            media_type:
                media.type || "unknown"
        }
    );
}

async function registerGlobalRadioPlay(radio){

    if(!radio) return;

    neonLocalStats.plays++;
    neonLocalStats.radioPlays++;

    saveNeonLocalStats();
    updateLocalStatsUI();

    await registerGlobalEvent(
        "radio_play",
        {
            radio:
                radio.name || "unknown"
        }
    );
}

function registerGlobalInstall(){

    if(
        localStorage.getItem(
            NEON_INSTALL_KEY
        ) === "1"
    ){
        return;
    }

    localStorage.setItem(
        NEON_INSTALL_KEY,
        "1"
    );

    neonLocalStats.installs++;

    saveNeonLocalStats();
    updateLocalStatsUI();

    registerGlobalEvent(
        "install"
    );
}

async function shareNeonPlayer(){

    const shareData = {
        title:"Neon Player X",
        text:
            "Prueba Neon Player X: música, vídeo y radio online.",
        url:window.location.href
    };

    try{

        if(navigator.share){

            await navigator.share(
                shareData
            );

            neonLocalStats.shares++;

            saveNeonLocalStats();
            updateLocalStatsUI();

            await registerGlobalEvent(
                "share",
                {
                    method:"native"
                }
            );

            showToast(
                "🔗 Compartido"
            );

            return;
        }

        if(
            navigator.clipboard &&
            navigator.clipboard.writeText
        ){

            await navigator.clipboard.writeText(
                window.location.href
            );

            neonLocalStats.shares++;

            saveNeonLocalStats();
            updateLocalStatsUI();

            await registerGlobalEvent(
                "share",
                {
                    method:"clipboard"
                }
            );

            showToast(
                "🔗 Enlace copiado"
            );

            return;
        }

        showToast(
            "No se puede compartir desde este navegador"
        );

    }catch(error){

        if(
            error &&
            error.name === "AbortError"
        ){
            return;
        }

        showToast(
            "No se pudo compartir"
        );
    }
}

function setupGrowthButton(){

    const actions =
        document.querySelector(
            ".top-actions"
        );

    if(
        !actions ||
        $("shareBtn")
    ){
        return;
    }

    const button =
        document.createElement("button");

    button.id = "shareBtn";

    button.className =
        "glass-btn share-btn";

    button.title =
        "Compartir Neon Player X";

    button.textContent =
        "↗ Compartir";

    button.addEventListener(
        "click",
        shareNeonPlayer
    );

    const install =
        $("installBtn");

    if(install)
        actions.insertBefore(
            button,
            install
        );
    else
        actions.appendChild(button);
}

function setupNeonInstall(){

    const install =
        $("installBtn");

    if(!install){
        return;
    }

    let deferredPrompt = null;

    window.addEventListener(
        "beforeinstallprompt",
        event => {

            event.preventDefault();

            deferredPrompt =
                event;

            if(
                localStorage.getItem(
                    NEON_INSTALL_DISMISSED_KEY
                ) !== "1"
            ){

                install.hidden =
                    false;

                install.classList.add(
                    "install-ready"
                );
            }
        }
    );

    install.addEventListener(
        "click",
        async () => {

            if(!deferredPrompt)
                return;

            try{

                await deferredPrompt.prompt();

                const choice =
                    await deferredPrompt.userChoice;

                if(
                    choice &&
                    choice.outcome !==
                    "accepted"
                ){

                    localStorage.setItem(
                        NEON_INSTALL_DISMISSED_KEY,
                        "1"
                    );
                }

            }catch(error){

                console.warn(
                    "Instalación PWA:",
                    error
                );

            }finally{

                deferredPrompt = null;
                install.hidden = true;
            }
        }
    );

    window.addEventListener(
        "appinstalled",
        () => {

            registerGlobalInstall();

            install.hidden =
                true;

            deferredPrompt =
                null;
        }
    );

    if(
        window.matchMedia &&
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches
    ){

        install.hidden = true;
    }
}

function setupNeonAnalytics(){

    const id =
        NEON_CONFIG.analyticsId;

    if(!id)
        return;

    if(
        document.querySelector(
            'script[data-neon-ga="1"]'
        )
    )
        return;

    window.dataLayer =
        window.dataLayer || [];

    window.gtag =
        window.gtag ||
        function(){
            window.dataLayer.push(
                arguments
            );
        };

    const script =
        document.createElement("script");

    script.async = true;

    script.dataset.neonGa =
        "1";

    script.src =
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;

    document.head.appendChild(script);

    window.gtag(
        "js",
        new Date()
    );

    window.gtag(
        "config",
        id,
        {
            app_name:
                "Neon Player X",
            app_version:
                NEON_CONFIG.appVersion
        }
    );
}

updateLocalStatsUI();
updateGlobalStatsUI();
setupGrowthButton();
setupNeonInstall();
setupNeonAnalytics();
registerGlobalVisit();
