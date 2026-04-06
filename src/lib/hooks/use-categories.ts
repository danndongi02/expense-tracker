"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/types";
import { subscribeToCategoreis } from "@/lib/services/categories.service";
import { useAuth } from "@/lib/context/auth-context";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCategoreis(user.uid, (data) => {
      setCategories(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const activeCategories = categories.filter((c) => c.status === "Active");
  const expenseCategories = activeCategories.filter((c) => c.transactionType === "Expense");
  const incomeCategories = activeCategories.filter((c) => c.transactionType === "Income");

  return { categories, activeCategories, expenseCategories, incomeCategories, loading };
}
