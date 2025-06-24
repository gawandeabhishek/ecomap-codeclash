// Service Worker for Location-Based Offline Functionality
const CACHE_VERSION = "v5"; // Updated version
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const ROUTES_CACHE = `routes-${CACHE_VERSION}`;
const LOCATION_DATA_CACHE = `location-data-${CACHE_VERSION}`;
const VECTOR_TILE_CACHE = `vector-tiles-${CACHE_VERSION}`;

// Define OFFLINE_MAP_STYLE first!
const OFFLINE_MAP_STYLE = "/offline-map-style.json";

const APP_SHELL_FILES = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  "/navigation",
  "/offline",
  OFFLINE_MAP_STYLE,
];

const DEBUG = true;

const PRE_CACHED_TILES = [
  "/vector-tiles/12/1205/1540.png",
  "/vector-tiles/12/1205/1541.png",
  "/vector-tiles/12/1206/1540.png",
  "/vector-tiles/12/1206/1541.png",
  "/vector-tiles/0/0/0.png", // world tile for low zoom
];

function log(...args) {
  if (DEBUG) console.log("[SW]", ...args);
}

function isHttpRequest(request) {
  return request.url.startsWith("http:") || request.url.startsWith("https:");
}

self.addEventListener("install", (event) => {
  log("Installing service worker...");

  // Create offline map style object
  const offlineStyle = {
    version: 8,
    name: "Offline Map",
    sources: {
      "osm-cached": {
        type: "raster",
        tiles: ["/vector-tiles/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#e0e0e0" },
      },
      {
        id: "osm-cached-layer",
        type: "raster",
        source: "osm-cached",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };

  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      log("Caching app shell...");
      // Cache offline map style
      cache.put(
        new Request(OFFLINE_MAP_STYLE),
        new Response(JSON.stringify(offlineStyle))
      );

      // Cache essential files without using addAll
      const filesToCache = APP_SHELL_FILES.filter(
        (file) => file !== OFFLINE_MAP_STYLE
      );
      return Promise.all(
        filesToCache.map((file) =>
          cache.add(file).catch((e) => log(`Failed to cache ${file}`, e))
        )
      );
    })
  );

  event.waitUntil(
    (async () => {
      const cache = await caches.open(VECTOR_TILE_CACHE);
      await Promise.all(
        PRE_CACHED_TILES.map(async (tileUrl) => {
          try {
            const response = await fetch(tileUrl);
            if (response.ok) {
              await cache.put(tileUrl, response.clone());
            }
          } catch (e) {
            // Ignore fetch errors
          }
        })
      );
    })()
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  log("Activating service worker...");
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![
                  APP_SHELL_CACHE,
                  ROUTES_CACHE,
                  LOCATION_DATA_CACHE,
                  VECTOR_TILE_CACHE,
                ].includes(key)
            )
            .map((key) => {
              log("Deleting old cache:", key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isHttpRequest(request)) return;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Handle offline map style request
  if (url.pathname === OFFLINE_MAP_STYLE) {
    event.respondWith(caches.match(new Request(OFFLINE_MAP_STYLE)));
    return;
  }

  // Handle location data caching
  if (url.pathname.startsWith("/location-data/")) {
    event.respondWith(handleLocationDataRequest(request));
    return;
  }

  // Handle vector tile requests
  if (url.pathname.startsWith("/vector-tiles/")) {
    const match = url.pathname.match(
      /\/vector-tiles\/(\d+)\/(\d+)\/(\d+)\.png/
    );
    if (match) {
      const z = parseInt(match[1]);
      if (z < 6) {
        event.respondWith(caches.match("/vector-tiles/0/0/0.png"));
        return;
      }
    }
    event.respondWith(
      (async () => {
        const cache = await caches.open(VECTOR_TILE_CACHE);
        const cached = await cache.match(request.url);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request.url, response.clone());
            return response;
          }
        } catch (e) {
          // Ignore fetch errors
        }
        // Return blank tile if not found
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#e0e0e0"/></svg>',
          { headers: { "Content-Type": "image/svg+xml" } }
        );
      })()
    );
    return;
  }

  // Handle navigation routes
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default strategy: Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache if response is valid and not already used
        if (response.status === 200 && response.body) {
          const cacheName = getCacheForRequest(request);
          const clonedResponse = response.clone();
          caches
            .open(cacheName)
            .then((cache) => cache.put(request, clonedResponse));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle location data requests
async function handleLocationDataRequest(request) {
  if (!isHttpRequest(request)) return fetch(request);
  const cache = await caches.open(LOCATION_DATA_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    log("Cache hit (location data):", request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.status === 200 && response.body) {
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
    }
    return response;
  } catch (err) {
    log("Location data fetch failed:", request.url);
    return new Response("", { status: 404 });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.status === 200 && response.body) {
      const clonedResponse = response.clone();
      caches
        .open(ROUTES_CACHE)
        .then((cache) => cache.put(request, clonedResponse));
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback to offline page
    return caches.match("/offline");
  }
}

// Determine appropriate cache for request
function getCacheForRequest(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/vector-tiles/")) return VECTOR_TILE_CACHE;
  if (url.pathname.startsWith("/location-data/")) return LOCATION_DATA_CACHE;
  if (request.mode === "navigate") return ROUTES_CACHE;
  return APP_SHELL_CACHE;
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_LOCATION_CACHE") {
    const { locationKey, cities } = event.data;
    log(`Updating location cache for ${locationKey}`);

    event.waitUntil(
      caches.open(LOCATION_DATA_CACHE).then((cache) => {
        return cache.put(
          new Request(`/location-data/${locationKey}`),
          new Response(JSON.stringify(cities))
        );
      })
    );
  }
});
