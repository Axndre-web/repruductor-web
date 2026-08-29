const CACHE_NAME="neon-player-x-global-v5";

const APP_SHELL=[
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./config.js",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener(
    "install",
    event=>{
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(
                    async cache=>{
                        await Promise.all(
                            APP_SHELL.map(
                                async asset=>{
                                    try{
                                        await cache.add(asset);
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
                    ()=>self.skipWaiting()
                )
        );
    }
);

self.addEventListener(
    "activate",
    event=>{
        event.waitUntil(
            caches
                .keys()
                .then(
                    keys=>
                        Promise.all(
                            keys
                                .filter(
                                    key=>
                                        key!==CACHE_NAME
                                )
                                .map(
                                    key=>
                                        caches.delete(key)
                                )
                        )
                )
                .then(
                    ()=>self.clients.claim()
                )
        );
    }
);

self.addEventListener(
    "fetch",
    event=>{

        const request =
            event.request;

        if(request.method!=="GET"){
            return;
        }

        const url =
            new URL(request.url);

        /*
         * Solo interceptamos recursos propios.
         * Los streams externos de radio no pasan
         * por el Service Worker.
         */

        if(
            url.origin!==
            self.location.origin
        ){
            return;
        }

        event.respondWith(

            caches
                .match(request)
                .then(
                    cached=>{

                        if(cached){
                            return cached;
                        }

                        return fetch(
                            request
                        )
                        .then(
                            response=>{

                                if(
                                    !response ||
                                    response.status!==200 ||
                                    response.type!=="basic"
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
                                        cache=>
                                            cache
                                                .put(
                                                    request,
                                                    copy
                                                )
                                                .catch(
                                                    ()=>{}
                                                )
                                    );

                                return response;
                            }
                        )
                        .catch(
                            ()=>caches.match(
                                "./index.html"
                            )
                        );
                    }
                )
        );
    }
);
