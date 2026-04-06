"use client";

import { useState, useEffect } from "react";
import { Account } from "@/lib/types";
import { subscribeToAccounts } from "@/lib/services/accounts.service";
import { useAuth } from "@/lib/context/auth-context";

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToAccounts(user.uid, (data) => {
      setAccounts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const activeAccounts = accounts.filter((a) => a.status === "Active");
  const assetAccounts = activeAccounts.filter((a) => a.type === "Asset");
  const liabilityAccounts = activeAccounts.filter((a) => a.type === "Liability");
  const investmentAccounts = activeAccounts.filter((a) => a.type === "Investment");

  return { accounts, activeAccounts, assetAccounts, liabilityAccounts, investmentAccounts, loading };
}
