"use client";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { useBudgets } from "@/lib/hooks/use-budgets";
import {
  computeBudgetVsActual,
  computeBudgetSummary,
} from "@/lib/services/analytics.service";
import type { Transaction } from "@/lib/types";

interface BudgetOverviewCardProps {
  transactions: Transaction[]; // Full transaction list (all time, not filtered)
  loading: boolean;            // Loading state from useTransactions
}

export function BudgetOverviewCard({ transactions, loading }: BudgetOverviewCardProps) {
  const currentMonth = format(new Date(), "yyyy-MM");
  const { budgets, loading: budgetsLoading } = useBudgets(currentMonth);

  const monthLabel = format(parseISO(currentMonth + "-01"), "MMMM yyyy");

  const isLoading = loading || budgetsLoading;

  // Build reversal exclusion set and filter to current month's expenses
  const reversalOriginalIds = new Set(
    transactions
      .filter((t) => t.type === "Reversal" && t.originalTransactionId)
      .map((t) => t.originalTransactionId!)
  );
  const monthExpenses = transactions.filter(
    (t) =>
      t.type === "Expense" &&
      !reversalOriginalIds.has(t.id) &&
      format(t.transactionDate.toDate(), "yyyy-MM") === currentMonth
  );

  const comparisons = computeBudgetVsActual(monthExpenses, budgets);
  const summary = computeBudgetSummary(comparisons);

  const statusBarColor: Record<"ok" | "warning" | "exceeded", string> = {
    ok: "bg-green-500",
    warning: "bg-amber-500",
    exceeded: "bg-red-500",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Budget — {monthLabel}</CardTitle>
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Budget — {monthLabel}</CardTitle>
        <Link
          href="/budgets"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Manage →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              No budgets set for {monthLabel}.
            </p>
            <Link
              href="/budgets"
              className="text-sm text-primary hover:underline"
            >
              Set them up →
            </Link>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5 p-3 rounded-lg border bg-card">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Total Budgeted
                </span>
                <span className="text-sm font-bold">
                  {formatCurrency(summary.totalBudgeted)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-lg border bg-card">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Total Spent
                </span>
                <span className="text-sm font-bold">
                  {formatCurrency(summary.totalSpent)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-lg border bg-card">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Over Budget
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      summary.categoriesOver === 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {summary.categoriesOver}
                  </span>
                  {summary.categoriesOver > 0 && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {summary.categoriesOver}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bars — max 8, sorted by % desc (already sorted from computeBudgetVsActual) */}
            <div className="space-y-3">
              {comparisons.slice(0, 8).map(({ budget, actual, percentage, status }) => (
                <div key={budget.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[55%]">
                      {budget.categoryName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(actual)} / {formatCurrency(budget.budgetAmount)}
                    </span>
                  </div>
                  {/* Track */}
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    {/* Inner fill */}
                    <div
                      className={cn("h-full rounded-full transition-all", statusBarColor[status])}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
