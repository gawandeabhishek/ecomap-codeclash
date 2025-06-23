"use client";
import { OfflineProvider } from "../contexts/OfflineContext";
import OfflineIndicator from "./offline/OfflineIndicator";
import ServiceWorkerStatus from "./offline/ServiceWorkerStatus";
import SyncStatus from "./offline/SyncStatus";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OfflineProvider>
      <OfflineIndicator />
      <ServiceWorkerStatus />
      <SyncStatus />
      {children}
    </OfflineProvider>
  );
}
