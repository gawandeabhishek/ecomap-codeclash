"use client"

import { useEffect } from 'react';
import { useOfflineContext } from '../contexts/OfflineContext';

export function useBackgroundSync() {
  const { setSyncQueue } = useOfflineContext();

  useEffect(() => {
    // Poll or listen for sync queue changes (mock for now)
    setSyncQueue([]); // Replace with real IndexedDB logic
  }, [setSyncQueue]);
} 