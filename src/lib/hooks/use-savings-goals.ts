"use client";

import { useState, useEffect } from "react";
import { SavingsGoal } from "@/lib/types";
import { subscribeToSavingsGoals } from "@/lib/services/savings-goals.service";
import { useAuth } from "@/lib/context/auth-context";

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToSavingsGoals(user.uid, (data) => {
      setGoals(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const activeGoals = goals.filter((g) => g.status === "Active");

  return { goals, activeGoals, loading };
}
