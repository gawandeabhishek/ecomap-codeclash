"use client";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function EnsureUser() {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/authenticate-user", { method: "POST" });
    }
  }, [isSignedIn]);

  return null;
}
