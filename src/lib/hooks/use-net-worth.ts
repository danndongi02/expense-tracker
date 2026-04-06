"use client";

import { useState, useEffect } from "react";
import { NetWorthSnapshot } from "@/lib/types";
import { subscribeToNetWorthSnapshots } from "@/lib/services/net-worth.service";
import { useAuth } from "@/lib/context/auth-context";

export function useNetWorthHistory() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNetWorthSnapshots(user.uid, (data) => {
      setSnapshots(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { snapshots, loading };
}
