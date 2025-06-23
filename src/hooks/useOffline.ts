"use client"

import { useEffect } from 'react';
import { useOfflineContext } from '../contexts/OfflineContext';

export function useOffline() {
  const { isOnline } = useOfflineContext();

  useEffect(() => {
    // Optionally, add more advanced connectivity checks here
  }, []);

  return isOnline;
} 