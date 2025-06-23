"use client"

// import { useOfflineContext } from '../../contexts/OfflineContext';
import { motion, AnimatePresence } from 'framer-motion';
// import { Badge } from '@/components/ui/badge';

export default function ServiceWorkerStatus() {
  // const { swRegistered, cacheStatus } = useOfflineContext();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-16 left-1/2 z-50 -translate-x-1/2"
      >
        {/* NOTE: for dev purpose */}
        {/* <Badge className={swRegistered ? 'bg-blue-500' : 'bg-gray-400'}>
          {swRegistered ? 'Service Worker Registered' : 'Service Worker Not Registered'}
        </Badge>
        {cacheStatus && (
          <span className="ml-2 text-xs text-gray-600">Cache: {cacheStatus}</span>
        )} */}
      </motion.div>
    </AnimatePresence>
  );
} 