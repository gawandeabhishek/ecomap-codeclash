"use client";

import { Benefits } from "@/components/benefits";
import { CTA } from "@/components/cta";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import PricingClientWrapper from "@/components/PricingClientWrapper";
import { Testimonials } from "@/components/testimonials";
import { useEffect, useState } from "react";

function SubscriptionStatus() {
  const [status, setStatus] = useState<null | { active: boolean }>(null);
  useEffect(() => {
    fetch("/api/payment/status")
      .then((res) => res.json())
      .then(setStatus);
  }, []);
  if (!status) return null;

  console.log("status", status);
  return (
    <div className="my-8 text-center">
      {status.active ? (
        <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
          Premium subscription active: Full offline caching enabled
        </div>
      ) : (
        <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
          Free plan: Limited offline features. Upgrade for full offline
          navigation!
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <SubscriptionStatus />
      <Features />
      <Benefits />
      <Testimonials />
      <PricingClientWrapper />
      <CTA />
      <Footer />
    </div>
  );
}
