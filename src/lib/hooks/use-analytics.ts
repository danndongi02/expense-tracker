"use client";

import { useMemo, useState, useCallback } from "react";
import { Transaction } from "@/lib/types";
import { usePeriodFilter } from "@/lib/context/period-filter-context";
import {
  computeSpendingByCategory,
  computeIncomeByCategory,
  computeIncomeVsExpenses,
  computeMonthlyTrend,
  computeTrend,
  type TrendGranularity,
  type TrendPoint,
} from "@/lib/services/analytics.service";

export function useAnalytics(transactions: Transaction[]) {
  const { startDate, endDate } = usePeriodFilter();
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>("monthly");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = tx.transactionDate.toDate();
      return txDate >= startDate && txDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  const spendingByCategory = useMemo(
    () => computeSpendingByCategory(filteredTransactions),
    [filteredTransactions]
  );

  const incomeByCategory = useMemo(
    () => computeIncomeByCategory(filteredTransactions),
    [filteredTransactions]
  );

  const incomeVsExpenses = useMemo(
    () => computeIncomeVsExpenses(filteredTransactions),
    [filteredTransactions]
  );

  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(transactions),
    [transactions]
  );

  const trendData = useMemo(
    () => computeTrend(transactions, trendGranularity),
    [transactions, trendGranularity]
  );

  return {
    filteredTransactions,
    spendingByCategory,
    incomeByCategory,
    incomeVsExpenses,
    monthlyTrend,
    trendData,
    trendGranularity,
    setTrendGranularity,
  };
}
