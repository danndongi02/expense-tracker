"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FinancialKPIs } from "@/lib/services/analytics.service";

interface KpiTileProps {
  label: string;
  value: number | null;
  thresholds: { green: (v: number) => boolean; amber: (v: number) => boolean };
  description: string;
}

function KpiTile({ label, value, thresholds, description }: KpiTileProps) {
  const status =
    value === null
      ? "neutral"
      : thresholds.green(value)
      ? "green"
      : thresholds.amber(value)
      ? "amber"
      : "red";

  const statusClass = {
    neutral: "text-muted-foreground",
    green: "text-green-600",
    amber: "text-amber-500",
    red: "text-red-600",
  }[status];

  const badgeClass = {
    neutral: "bg-muted text-muted-foreground",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }[status];

  const badgeLabel = { neutral: "—", green: "Good", amber: "Watch", red: "High" }[status];

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </span>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", badgeClass)}>
          {badgeLabel}
        </span>
      </div>
      <span className={cn("text-2xl font-bold", statusClass)}>
        {value === null ? "—" : `${value.toFixed(1)}%`}
      </span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  );
}

interface FinancialKpiCardProps {
  kpis: FinancialKPIs;
  loading: boolean;
}

export function FinancialKpiCard({ kpis, loading }: FinancialKpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <KpiTile
          label="Savings Rate"
          value={kpis.savingsRate}
          thresholds={{
            green: (v) => v >= 20,
            amber: (v) => v >= 10,
          }}
          description="(Income − Expenses) ÷ Income"
        />
        <KpiTile
          label="Expense Ratio"
          value={kpis.expenseRatio}
          thresholds={{
            green: (v) => v <= 70,
            amber: (v) => v <= 90,
          }}
          description="Expenses ÷ Income"
        />
        <KpiTile
          label="Debt-to-Income"
          value={kpis.debtToIncome}
          thresholds={{
            green: (v) => v <= 30,
            amber: (v) => v <= 40,
          }}
          description="Loan Repayments ÷ Income"
        />
      </CardContent>
    </Card>
  );
}
