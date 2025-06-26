"use client";
import dynamic from "next/dynamic";

const Pricing = dynamic(() => import("./pricing").then((mod) => mod.Pricing), {
  ssr: false,
});

export default function PricingClientWrapper() {
  return <Pricing />;
}
