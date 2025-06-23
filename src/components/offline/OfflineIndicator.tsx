"use client"

import { useOfflineContext } from '../../contexts/OfflineContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function OfflineIndicator() {
  const { isOnline } = useOfflineContext();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
        >
          <Badge className="bg-red-500 text-white px-4 py-2 shadow-lg rounded-full">
            <span className="mr-2">🔴</span>
            Offline: Some features may be unavailable
          </Badge>
        </motion.div>
      )}
      {isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
        >
          <Badge className="bg-green-500 text-white px-4 py-2 shadow-lg rounded-full">
            <span className="mr-2">🟢</span>
            Online: All features available
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 