"use client";

import { useState, useEffect } from "react";
import { Budget } from "@/lib/types";
import { subscribeToMonthBudgets } from "@/lib/services/budgets.service";
import { useAuth } from "@/lib/context/auth-context";

export function useBudgets(month: string) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMonthBudgets(user.uid, month, (data) => {
      setBudgets(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user, month]);

  return { budgets, loading };
}
