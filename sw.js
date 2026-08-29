const CACHE_NAME = "neon-player-x-v3";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


/* =========================================
   INSTALL
========================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    async cache => {

                        await Promise.all(

                            APP_SHELL.map(
                                async asset => {

                                    try{

                                        await cache.add(
                                            asset
                                        );

                                    }catch(error){

                                        console.warn(
                                            "No se pudo cachear:",
                                            asset
                                        );
                                    }
                                }
                            )
                        );
                    }
                )
                .then(
                    () =>
                        self.skipWaiting()
                )
        );
    }
);


/* =========================================
   ACTIVATE
========================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    keys =>
                        Promise.all(

                            keys

                                .filter(
                                    key =>
                                        key !==
                                        CACHE_NAME
                                )

                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )
                        )
                )

                .then(
                    () =>
                        self.clients.claim()
                )
        );
    }
);


/* =========================================
   FETCH
========================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        if(
            request.method !==
            "GET"
        ){
            return;
        }

        const url =
            new URL(
                request.url
            );

        /*
         * Solo recursos de la propia app.
         * Los streams de radio externos
         * NO pasan por el Service Worker.
         */

        if(
            url.origin !==
            self.location.origin
        ){
            return;
        }

        event.respondWith(

            caches
                .match(request)
                .then(
                    cached => {

                        if(cached){
                            return cached;
                        }

                        return fetch(
                            request
                        )
                        .then(
                            response => {

                                if(
                                    !response ||
                                    response.status !== 200 ||
                                    response.type !== "basic"
                                ){
                                    return response;
                                }

                                const copy =
                                    response.clone();

                                caches
                                    .open(
                                        CACHE_NAME
                                    )
                                    .then(
                                        cache =>
                                            cache
                                                .put(
                                                    request,
                                                    copy
                                                )
                                                .catch(
                                                    () => {}
                                                )
                                    );

                                return response;
                            }
                        )
                        .catch(
                            () =>
                                caches.match(
                                    "./index.html"
                                )
                        );
                    }
                )
        );
    }
);
