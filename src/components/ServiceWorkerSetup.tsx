// src/components/ServiceWorkerSetup.tsx
"use client";

import { useEffect } from "react";

export default function ServiceWorkerSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            { scope: "/", type: "module" }
          );

          console.log("SW registered:", registration);
          // Background Sync API is not widely supported and not present on ServiceWorkerRegistration.
          // If you need background sync, consider feature detection and/or alternative approaches.
          // Removed registration.sync usage to fix TypeScript error.
        } catch (error) {
          console.error("SW registration failed:", error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null;
}
