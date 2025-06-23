export interface SyncQueueItem {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
}

export interface CacheStatus {
  name: string;
  size: number;
  lastUpdated: number;
}

export interface OfflineContextType {
  isOnline: boolean;
  swRegistered: boolean;
  cacheStatus: string;
  syncQueue: SyncQueueItem[];
  setCacheStatus: (status: string) => void;
  setSyncQueue: (queue: SyncQueueItem[]) => void;
} 