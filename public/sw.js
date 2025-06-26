// Service Worker for Location-Based Offline Functionality
const CACHE_VERSION = "v10"; // Updated version for enhanced caching and error handling
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const ROUTES_CACHE = `routes-${CACHE_VERSION}`;
const LOCATION_DATA_CACHE = `location-data-${CACHE_VERSION}`;
const VECTOR_TILE_CACHE = `vector-tiles-${CACHE_VERSION}`;
const FONT_SPRITE_CACHE = `font-sprite-${CACHE_VERSION}`;
const STATIC_ASSETS_CACHE = `static-assets-${CACHE_VERSION}`; // New cache for static assets

// Define OFFLINE_MAP_STYLE first!
const OFFLINE_MAP_STYLE = "/offline-map-style.json";
const PMTILES_FILE = "/maps/planet.pmtiles"; // Define the PMTiles file path

const APP_SHELL_FILES = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  "/navigation",
  "/offline",
  OFFLINE_MAP_STYLE,
  PMTILES_FILE, // Cache the main pmtiles file
];

const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log("[SW]", ...args);
}

function isHttpRequest(request) {
  return request.url.startsWith("http:") || request.url.startsWith("https:");
}

function isNetworkError(response) {
  return response.status >= 500 || response.status === 0; // 0 is used for local development
}

self.addEventListener("install", (event) => {
  log("Installing service worker...");

  // Create offline map style object for vector tiles (already updated by previous step, ensuring consistency)
  const offlineStyle = {
    version: 8,
    name: "Offline Vector Map",
    sources: {
      openmaptiles: {
        type: "vector",
        url: "mbtiles:///local.mbtiles", // This should point to a local MBTiles or a different offline vector tile source
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#e0e0e0" },
      },
      {
        id: "landuse_park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: ["==", "class", "park"],
        paint: { "fill-color": "#d8e8c8" },
      },
      {
        id: "roads",
        type: "line",
        source: "openmaptiles",
        "source-layer": "road",
        paint: { "line-color": "#ffffff", "line-width": 2 },
      },
      {
        id: "places",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["==", "$type", "Point"],
        layout: {
          "text-field": "{name:en}",
          "text-font": ["Open Sans Regular"],
          "text-size": 12,
        },
        paint: { "text-color": "#333333" },
      },
    ],
  };

  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      log("Caching app shell...");
      // Cache essential files including the main map style JSON
      return Promise.all(
        APP_SHELL_FILES.map((file) =>
          cache.add(file).catch((e) => log(`Failed to cache ${file}`, e))
        )
      );
    })
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
                  FONT_SPRITE_CACHE,
                  STATIC_ASSETS_CACHE, // Include new cache in deletion filter
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

  // Handle offline map style request (for /offline-map-style.json)
  if (url.pathname === OFFLINE_MAP_STYLE) {
    event.respondWith(caches.match(new Request(OFFLINE_MAP_STYLE)));
    return;
  }

  // Handle PMTiles file itself and its internal .pbf requests
  if (url.pathname === PMTILES_FILE || url.pathname.endsWith(".pbf")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VECTOR_TILE_CACHE); // Using VECTOR_TILE_CACHE for PMTiles data
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          log("Cache hit (PMTiles/PBF):", request.url);
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            log("Caching PMTiles/PBF:", request.url);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          log("PMTiles/PBF fetch failed:", request.url, error);
          // Return a 404 response with null body for failed PMTiles/PBF fetches to prevent TypeError
          return new Response(null, {
            status: 404,
            statusText: "Offline PMTiles/PBF or Network Error",
          });
        }
      })()
    );
    return;
  }

  // Generic caching strategy for all other static assets (e.g., Next.js build files, CSS, JS)
  // Cache First, then Network
  if (
    request.url.startsWith(self.location.origin + "/_next/static/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_ASSETS_CACHE);
        let cachedResponse = await cache.match(request);

        if (cachedResponse) {
          log("Cache hit (static asset):", request.url);
          return cachedResponse;
        }

        // If not in cache, try network and cache if successful
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            log("Caching static asset:", request.url);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          } else {
            // If network response is not OK (e.g., 404, 500)
            log(
              "Network response not OK for static asset:",
              request.url,
              networkResponse.status
            );
            // Return a new Response with null body to prevent TypeError
            return new Response(null, {
              status: networkResponse.status,
              statusText:
                networkResponse.statusText || "Not Found (Network not OK)",
            });
          }
        } catch (error) {
          log("Static asset fetch failed (network error):", request.url, error);
          // If network error (offline) and not in cache, return a generic 404 with null body
          return new Response(null, {
            status: 404,
            statusText: "Offline Static Asset or Network Error",
          });
        }
      })()
    );
    return;
  }

  // Handle location data caching
  if (url.pathname.startsWith("/location-data/")) {
    event.respondWith(handleLocationDataRequest(request));
    return;
  }

  // Handle navigation routes
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // For all other requests, try network first, then fall back to cache if available
  // This is a common strategy for API calls or other dynamic content
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        // If the network request is successful, return it and cache it for future use
        if (networkResponse.ok && request.method === "GET") {
          const cache = await caches.open(APP_SHELL_CACHE); // Or a more specific cache if needed
          log("Caching dynamic/API response:", request.url);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        log("Network request failed, checking cache:", request.url, error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          log("Cache hit (dynamic/API fallback):", request.url);
          return cachedResponse;
        }
        // If neither network nor cache has a response, return a generic offline response
        log("No network or cached response for:", request.url);
        return new Response("Offline Content", {
          status: 503,
          statusText: "Service Unavailable (Offline)",
        });
      }
    })()
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
    if (response.status === 200 && response.body) {
      const clonedResponse = response.clone();
      caches
        .open(ROUTES_CACHE)
        .then((cache) => cache.put(request, clonedResponse));
    }
    return response;
  } catch (err) {
    log("Navigation fetch failed:", request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return caches.match("/offline");
  }
}

function getCacheForRequest(request) {
  const url = new URL(request.url);

  if (
    url.hostname.includes("nominatim.openstreetmap.org") ||
    url.hostname.includes("project-osrm.org")
  ) {
    return LOCATION_DATA_CACHE;
  }

  return APP_SHELL_CACHE;
}
