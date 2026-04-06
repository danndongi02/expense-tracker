"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { subscribeToTransactions } from "@/lib/services/transactions.service";
import { useAuth } from "@/lib/context/auth-context";

export function useTransactions(limitCount: number = 50) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTransactions(
      user.uid,
      (data) => {
        setTransactions(data);
        setLoading(false);
      },
      limitCount
    );
    return unsubscribe;
  }, [user, limitCount]);

  return { transactions, loading };
}
