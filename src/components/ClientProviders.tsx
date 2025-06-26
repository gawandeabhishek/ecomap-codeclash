"use client";
import ConditionalServiceWorkerSetup from "@/components/ConditionalServiceWorkerSetup";
import { OfflineProvider } from "../contexts/OfflineContext";
import ServiceWorkerStatus from "./offline/ServiceWorkerStatus";
import SyncStatus from "./offline/SyncStatus";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OfflineProvider>
      <ServiceWorkerStatus />
      <SyncStatus />
      <ConditionalServiceWorkerSetup />
      {children}
    </OfflineProvider>
  );
}
