"use client";

import { useState, useEffect } from "react";
import { Loan } from "@/lib/types";
import { subscribeToLoans } from "@/lib/services/loans.service";
import { useAuth } from "@/lib/context/auth-context";

export function useLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToLoans(user.uid, (data) => {
      setLoans(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const activeLoans = loans.filter((l) => l.status === "Active");
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.currentBalance, 0);

  return { loans, activeLoans, totalDebt, loading };
}
