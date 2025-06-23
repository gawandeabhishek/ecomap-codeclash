// LocalStorage helpers
export function setLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocal<T>(key: string): T | null {
  const val = localStorage.getItem(key);
  return val ? (JSON.parse(val) as T) : null;
}

export function removeLocal(key: string) {
  localStorage.removeItem(key);
}

// IndexedDB mock helpers (replace with real logic as needed)
export async function setIndexedDB() {
  // Implement with idb-keyval or similar in real app
  return Promise.resolve();
}
