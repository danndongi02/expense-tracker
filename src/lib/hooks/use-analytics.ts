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

  const validFilteredTransactions = useMemo(() => {
    const reversedIds = new Set<string>();
    for (const tx of filteredTransactions) {
      if (tx.type === "Reversal" && tx.originalTransactionId) {
        reversedIds.add(tx.originalTransactionId);
      }
    }
    return filteredTransactions.filter(
      (tx) => tx.type !== "Reversal" && !reversedIds.has(tx.transactionId)
    );
  }, [filteredTransactions]);

  const validTransactions = useMemo(() => {
    const reversedIds = new Set<string>();
    for (const tx of transactions) {
      if (tx.type === "Reversal" && tx.originalTransactionId) {
        reversedIds.add(tx.originalTransactionId);
      }
    }
    return transactions.filter(
      (tx) => tx.type !== "Reversal" && !reversedIds.has(tx.transactionId)
    );
  }, [transactions]);

  const spendingByCategory = useMemo(
    () => computeSpendingByCategory(validFilteredTransactions),
    [validFilteredTransactions]
  );

  const incomeByCategory = useMemo(
    () => computeIncomeByCategory(validFilteredTransactions),
    [validFilteredTransactions]
  );

  const incomeVsExpenses = useMemo(
    () => computeIncomeVsExpenses(validFilteredTransactions),
    [validFilteredTransactions]
  );

  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(validTransactions),
    [validTransactions]
  );

  const trendData = useMemo(
    () => computeTrend(validTransactions, trendGranularity),
    [validTransactions, trendGranularity]
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
