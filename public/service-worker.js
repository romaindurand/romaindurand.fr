self.addEventListener('fetch', function(e) {
    console.log('[ServiceWorker] Fetch', e.request.url);
    if (new URL(e.request.url).protocol === "http:") {
        e.respondWith(
            new Response("plop")
        );
    }
});