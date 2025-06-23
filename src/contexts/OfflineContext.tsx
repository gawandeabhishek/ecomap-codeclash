"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SyncQueueItem } from '../types/offline';

export type OfflineContextType = {
  isOnline: boolean;
  swRegistered: boolean;
  cacheStatus: string;
  syncQueue: SyncQueueItem[];
  setCacheStatus: (status: string) => void;
  setSyncQueue: (queue: SyncQueueItem[]) => void;
};

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistered, setSwRegistered] = useState(false);
  const [cacheStatus, setCacheStatus] = useState('');
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service worker registration status
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setSwRegistered(true)).catch(() => setSwRegistered(false));
    }
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, swRegistered, cacheStatus, setCacheStatus, syncQueue, setSyncQueue }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOfflineContext = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOfflineContext must be used within OfflineProvider');
  return context;
}; 