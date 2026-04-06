"use client";

import { useState, useEffect } from "react";
import { Subscription } from "@/lib/types";
import { subscribeToSubscriptions, computeSubscriptionSummary } from "@/lib/services/subscriptions.service";
import { useAuth } from "@/lib/context/auth-context";

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToSubscriptions(user.uid, (data) => {
      setSubscriptions(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const summary = computeSubscriptionSummary(subscriptions);

  return { subscriptions, summary, loading };
}
