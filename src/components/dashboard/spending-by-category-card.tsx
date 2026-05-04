"use client";

import React from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { CategoryBreakdown } from "@/lib/services/analytics.service";
import { Budget } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SpendingByCategoryCardProps {
  data: CategoryBreakdown[];
  loading: boolean;
  budgets?: Budget[];
}

const CHART_COLORS = [
  "oklch(0.64 0.2 16)",
  "oklch(0.65 0.17 45)",
  "oklch(0.72 0.17 142)",
  "oklch(0.62 0.19 260)",
  "oklch(0.65 0.18 310)",
  "oklch(0.7 0.12 70)",
  "oklch(0.6 0.15 200)",
  "oklch(0.55 0.2 340)",
];

export function SpendingByCategoryCard({
  data,
  loading,
  budgets,
}: SpendingByCategoryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No spending data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  const topCategories = data.slice(0, 8);

  const chartConfig: ChartConfig = Object.fromEntries(
    topCategories.map((item, index) => [
      item.category,
      {
        label: item.category,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ])
  );

  const chartData = topCategories.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="category"
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium">
                        {formatCurrency(value as number)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.category} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {budgets && budgets.length > 0 ? (
          <div className="mt-4 grid grid-cols-[1fr_auto_auto_auto] gap-2">
            {topCategories.map((item, index) => {
              const matchingBudget = budgets?.find((b) => b.categoryName === item.category);
              let vsBudgetEl: React.ReactNode = <span className="text-muted-foreground">—</span>;
              if (matchingBudget) {
                const pct = (item.amount / matchingBudget.budgetAmount) * 100;
                const color =
                  pct >= 100
                    ? "text-red-600"
                    : pct >= matchingBudget.alertThreshold
                    ? "text-amber-600"
                    : "text-green-600";
                vsBudgetEl = <span className={cn("font-medium", color)}>{pct.toFixed(0)}%</span>;
              }
              return (
                <React.Fragment key={item.category}>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="ml-auto font-medium">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground self-center">
                    {matchingBudget ? formatCurrency(matchingBudget.budgetAmount) : "—"}
                  </span>
                  <span className="text-sm self-center">{vsBudgetEl}</span>
                  <span />
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {topCategories.map((item, index) => (
              <div key={item.category} className="flex items-center gap-2 text-sm">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="truncate text-muted-foreground">
                  {item.category}
                </span>
                <span className="ml-auto font-medium">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
