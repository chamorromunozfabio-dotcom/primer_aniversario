/* Nuestro año — service worker.
   https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API

   Qué hace y qué NO hace, a propósito:
   - Guarda el "esqueleto" de la página (html, css, js, iconos) para que la
     dedicatoria abra al instante y siga funcionando sin internet.
   - Guarda las fotos que se van viendo, para que no se vuelvan a descargar.
   - NO guarda los videos: la carpeta pesa más de 100 MB y el almacenamiento
     del navegador se llenaría o la app dejaría de poder instalarse.

   Para publicar un cambio hay que subir de versión la constante VERSION: eso
   borra las cachés viejas y baja los archivos nuevos.

   Este archivo vive en la raíz del sitio y no en js/ a propósito: un service
   worker solo puede controlar la carpeta donde está (o una subcarpeta). Si
   estuviera en js/, no podría abarcar la página principal, y para agrandarle
   el permiso haría falta el header Service-Worker-Allowed, que en GitHub
   Pages no se puede mandar. */
const VERSION = "v3";

/* El scope siempre termina en "/", así que sirve de base para resolver rutas
   relativas. Hace que todo funcione igual si la página se publica en la raíz
   de un dominio o en una subcarpeta (como en GitHub Pages). */
const base = self.registration.scope;
const urlDe = (ruta) => new URL(ruta, base).toString();

/* La carpeta de videos, ya como ruta del sitio, para poder compararla. */
const RUTA_VIDEOS = new URL("videos/", base).pathname;

const CACHE_SHELL = `aniversario-shell-${VERSION}`;
const CACHE_FOTOS = `aniversario-fotos-${VERSION}`;

/* El esqueleto se guarda en install. Las rutas pasan por urlDe() para que se
   resuelvan contra el scope y no contra la carpeta del archivo: así, si
   algún día se limita el scope a una subcarpeta, sigue funcionando solo. */
const SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/estilo.css",
  "js/script.js",
  "js/sprites.js",
  "js/audio.js",
  "js/juegos.js",
  "js/juegos-lista.js",
  "img/icono-192.png",
  "img/icono-512.png",
  "img/icono-maskable-512.png",
  "img/apple-touch-icon.png"
];

/* Las fotos de la galería pesan bastante (hay una de 2,5 MB). No se descargan
   todas al instalar, sino a medida que se van viendo. */
const LIMITE_FOTO = 6 * 1024 * 1024;

/* El index.html lleva ?v= en el css y el js para que el navegador no se
   quede con la versión vieja. Para la caché da igual: se guarda sin ese
   parámetro, así una sola copia sirve para cualquier ?v= que se ponga. */
function sinVersion(url) {
  const u = new URL(url);
  u.searchParams.delete("v");
  return u.toString();
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_SHELL)
      .then((cache) =>
        /* addAll se cae entero si un archivo falta, y entonces no se
           instala nada. Así cada uno va por su lado. */
        Promise.all(SHELL.map((ruta) => cache.add(urlDe(ruta)).catch(() => {})))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith("aniversario-") && !n.endsWith(VERSION))
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  /* Solo GET y solo lo nuestro: las fuentes de Google y los iframes de
     Spotify los deja pasar de largo, el navegador los maneja por su cuenta. */
  if (peticion.method !== "GET") return;
  if (new URL(peticion.url).origin !== self.location.origin) return;

  const url = new URL(peticion.url);

  /* Los videos no se cachean, y además los <video> piden rangos de bytes
     (Range), que un archivo cacheado no podría responder bien. */
  if (url.pathname.startsWith(RUTA_VIDEOS)) return;
  if (peticion.headers.has("range")) return;

  /* Si el usuario navega, primero se intenta la red y, si no hay, la copia
     guardada. Así la página siempre muestra lo último que se publicó. */
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(urlDe("index.html"), copia));
          }
          return respuesta;
        })
        .catch(async () => {
          const guardada = await caches.match(urlDe("index.html"), { cacheName: CACHE_SHELL });
          return guardada || Response.error();
        })
    );
    return;
  }

  const esFoto = peticion.destination === "image";

  if (esFoto) {
    /* Fotos: se muestra la copia guardada al instante y, por detrás, se
       descarga la versión nueva para la próxima vez. Los iconos de la app
       también entran por acá, y esos ya estaban en la caché del esqueleto. */
    evento.respondWith(
      caches.open(CACHE_FOTOS).then(async (cache) => {
        const guardada =
          (await cache.match(sinVersion(peticion.url))) ||
          (await caches.match(sinVersion(peticion.url), { cacheName: CACHE_SHELL }));

        const red = fetch(peticion)
          .then((respuesta) => {
            const tamano = Number(respuesta.headers.get("content-length") || 0);
            if (respuesta.ok && tamano <= LIMITE_FOTO) cache.put(sinVersion(peticion.url), respuesta.clone());
            return respuesta;
          })
          .catch(() => null);

        return guardada || (await red) || Response.error();
      })
    );
    return;
  }

  /* El resto del esqueleto (css, js, manifest): primero la red y, si no hay,
     lo guardado. */
  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE_SHELL).then((cache) => cache.put(sinVersion(peticion.url), copia));
        }
        return respuesta;
      })
      .catch(async () => {
        const guardada = await caches.match(sinVersion(peticion.url), { cacheName: CACHE_SHELL });
        return guardada || Response.error();
      })
  );
});
