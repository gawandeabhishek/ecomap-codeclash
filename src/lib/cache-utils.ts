export const CACHE_VERSION = 'v1';
export const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
export const ROUTES_CACHE = `routes-${CACHE_VERSION}`;
export const API_CACHE = `api-${CACHE_VERSION}`;
export const OFFLINE_CACHE = `offline-${CACHE_VERSION}`;

export async function cleanupOldCaches() {
  const keys = await caches.keys();
  const valid = [APP_SHELL_CACHE, ROUTES_CACHE, API_CACHE, OFFLINE_CACHE];
  await Promise.all(keys.filter(k => !valid.includes(k)).map(k => caches.delete(k)));
}

// Mock LRU eviction (real LRU would need IndexedDB or custom logic)
export async function lruEvict(cacheName: string, maxItems: number) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  if (requests.length > maxItems) {
    await cache.delete(requests[0]);
  }
}

export async function inspectCache(cacheName: string) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.map(req => req.url);
} 