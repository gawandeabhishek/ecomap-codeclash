export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export function onOnline(callback: () => void) {
  window.addEventListener('online', callback);
}

export function onOffline(callback: () => void) {
  window.addEventListener('offline', callback);
}

export function removeOnline(callback: () => void) {
  window.removeEventListener('online', callback);
}

export function removeOffline(callback: () => void) {
  window.removeEventListener('offline', callback);
}

export function periodicConnectivityCheck(interval = 10000, onChange: (online: boolean) => void) {
  let lastStatus = isOnline();
  const check = () => {
    const status = isOnline();
    if (status !== lastStatus) {
      onChange(status);
      lastStatus = status;
    }
  };
  const id = setInterval(check, interval);
  return () => clearInterval(id);
} 