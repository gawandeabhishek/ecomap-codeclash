"use client"

import { useEffect } from 'react';
import { useOfflineContext } from '../contexts/OfflineContext';

export function useServiceWorker() {
  const { setCacheStatus } = useOfflineContext();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          setCacheStatus('Service Worker registered');
        })
        .catch(() => {
          setCacheStatus('Service Worker registration failed');
        });
    }
  }, [setCacheStatus]);
} 