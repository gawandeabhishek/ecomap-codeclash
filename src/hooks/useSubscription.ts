import { useState, useEffect } from "react";

export interface SubscriptionData {
  active: boolean;
  subscription?: {
    id: string;
    status: string;
    expiresAt: string;
    plan: string;
  };
}

export function useSubscription() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    active: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/payment/status");
      const status = await res.json();
      setSubscriptionData(status);
    } catch (err: any) {
      setError(err.message || "Failed to check subscription status");
      setSubscriptionData({ active: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    ...subscriptionData,
    loading,
    error,
    refetch: checkSubscription,
  };
}
