"use strict";

const CACHE_NAME = "rishiman-cache-v2";

const APP_FILES = [
"./",
"./index.html",
"./style.css",
"./app.js",
"./manifest.json",
"./icon-192.png",
"./icon-512.png"
];

// INSTALL
self.addEventListener("install", function (event) {
event.waitUntil(
caches.open(CACHE_NAME)
.then(function (cache) {
return cache.addAll(APP_FILES);
})
.then(function () {
return self.skipWaiting();
})
);
});

// ACTIVATE
self.addEventListener("activate", function (event) {
event.waitUntil(
caches.keys()
.then(function (cacheNames) {
return Promise.all(
cacheNames.map(function (cacheName) {
if (
cacheName.indexOf("rishiman-cache-") === 0 &&
cacheName !== CACHE_NAME
) {
return caches.delete(cacheName);
}

```
        return Promise.resolve(false);
      })
    );
  })
  .then(function () {
    return self.clients.claim();
  })
```

);
});

// FETCH
self.addEventListener("fetch", function (event) {
var request = event.request;

if (request.method !== "GET") {
return;
}

var url = new URL(request.url);

if (url.origin !== self.location.origin) {
return;
}

// Leave media range requests untouched.
if (request.headers.has("range")) {
return;
}

event.respondWith(
caches.match(request)
.then(function (cachedResponse) {
if (cachedResponse) {
return cachedResponse;
}

```
    return fetch(request)
      .then(function (response) {
        if (!response || !response.ok) {
          return response;
        }

        var responseCopy = response.clone();

        caches.open(CACHE_NAME)
          .then(function (cache) {
            cache.put(request, responseCopy);
          })
          .catch(function () {});

        return response;
      })
      .catch(function () {
        if (request.mode === "navigate") {
          return caches.match("./index.html")
            .then(function (indexPage) {
              if (indexPage) {
                return indexPage;
              }

              return new Response(
                "You are offline. Please reconnect and try again.",
                {
                  status: 503,
                  headers: {
                    "Content-Type": "text/plain; charset=utf-8"
                  }
                }
              );
            });
        }

        return new Response(
          "This resource is unavailable offline.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      });
  })
```

);
});
