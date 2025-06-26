"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import ServiceWorkerSetup from "@/components/ServiceWorkerSetup";

export default function ConditionalServiceWorkerSetup() {
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

  if (!enabled) return null;
  return <ServiceWorkerSetup />;
}
