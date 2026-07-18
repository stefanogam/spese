const CACHE_NAME = "spese-pwa-locale-v105";

// Tempo massimo di attesa della rete prima di servire la cache.
// Senza questo limite, in assenza di connettività reale (Wi-Fi senza
// internet, segnale senza dati, DNS che non risponde) la fetch resta
// appesa a lungo e l'app sembra "attendere la connessione" all'avvio.
const NETWORK_TIMEOUT_MS = 3000;

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  // Risorse di terze parti (es. script Google): lasciamo fare al browser,
  // senza intercettarle. Offline falliranno da sole senza bloccare l'app.
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigate = event.request.mode === "navigate";
  const cacheKey = isNavigate ? "./index.html" : event.request;

  event.respondWith((async () => {
    // Strategia: prima la rete (per avere sempre l'ultima versione), ma
    // con un timeout breve; se la rete non risponde in tempo, si serve
    // subito la copia in cache e l'app parte anche offline.
    const networkPromise = fetch(event.request, { cache: "no-store" })
      .then(response => {
        // Aggiorna la cache solo con risposte valide, per non
        // sovrascrivere una copia buona con una pagina di errore.
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, copy));
        }
        return response;
      });

    const timeout = new Promise(resolve =>
      setTimeout(() => resolve("__timeout__"), NETWORK_TIMEOUT_MS)
    );

    const winner = await Promise.race([
      networkPromise.catch(() => "__network_error__"),
      timeout
    ]);

    if (winner !== "__timeout__" && winner !== "__network_error__") {
      return winner;
    }

    // Rete lenta o assente: prova la cache.
    const cached = await caches.match(cacheKey);
    if (cached) return cached;

    // Nessuna copia in cache (es. primo avvio con file nuovo): come
    // ultima possibilità attendi comunque la rete.
    try {
      return await networkPromise;
    } catch {
      if (isNavigate) {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      return new Response("Offline: contenuto non disponibile.", {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
