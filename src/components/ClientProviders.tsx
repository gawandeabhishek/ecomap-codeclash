"use client";
import { useAuth } from "@clerk/nextjs";
import { OfflineProvider } from "../contexts/OfflineContext";
import OfflineIndicator from "./offline/OfflineIndicator";
import ServiceWorkerStatus from "./offline/ServiceWorkerStatus";
import SyncStatus from "./offline/SyncStatus";
import ConditionalServiceWorkerSetup from "@/components/ConditionalServiceWorkerSetup";
import { useEffect, useState } from "react";

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
      <OfflineIndicator />
      <ServiceWorkerStatus />
      <SyncStatus />
      <ConditionalServiceWorkerSetup />
      {children}
    </OfflineProvider>
  );
}
