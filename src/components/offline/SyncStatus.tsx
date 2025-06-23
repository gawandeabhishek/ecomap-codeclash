"use client"

import { useOfflineContext } from '../../contexts/OfflineContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function SyncStatus() {
  const { syncQueue } = useOfflineContext();
  const hasQueue = syncQueue.length > 0;

  return (
    <AnimatePresence>
      {hasQueue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-28 left-1/2 z-50 -translate-x-1/2"
        >
          <Badge className="bg-yellow-500 text-white px-4 py-2 shadow-lg rounded-full">
            <span className="mr-2">⏳</span>
            Syncing {syncQueue.length} queued request{syncQueue.length > 1 ? 's' : ''}...
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 