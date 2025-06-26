"use client";
import ConditionalServiceWorkerSetup from "@/components/ConditionalServiceWorkerSetup";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { OfflineProvider } from "../contexts/OfflineContext";
import ServiceWorkerStatus from "./offline/ServiceWorkerStatus";
import SyncStatus from "./offline/SyncStatus";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setEnabled(false);
      return;
    }
    async function checkSub() {
      try {
        const res = await fetch("/api/payment/status");
        const data = await res.json();
        setEnabled(!!data.active);
      } catch {
        setEnabled(false);
      }
    }
    checkSub();
  }, [isSignedIn]);

  if (!enabled) return <>{children}</>;

  return (
    <OfflineProvider>
      <ServiceWorkerStatus />
      <SyncStatus />
      <ConditionalServiceWorkerSetup />
      {children}
    </OfflineProvider>
  );
}
