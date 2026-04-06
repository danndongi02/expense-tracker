"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useNetWorthHistory } from "@/lib/hooks/use-net-worth";
import {
  computeSpendingByCategory,
  computeMonthlyTrend,
} from "@/lib/services/analytics.service";
import { formatCurrency } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";

function formatMonthLabel(monthKey: string): string {
  try {
    const date = parseISO(`${monthKey}-01`);
    return format(date, "MMM yyyy");
  } catch {
    return monthKey;
  }
}

// --- Chart Configs ---

const netWorthChartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "oklch(0.62 0.19 260)",
  },
  assetsTotal: {
    label: "Assets",
    color: "oklch(0.72 0.17 142)",
  },
  investmentsTotal: {
    label: "Investments",
    color: "oklch(0.65 0.17 45)",
  },
  liabilitiesTotal: {
    label: "Liabilities",
    color: "oklch(0.64 0.2 16)",
  },
} satisfies ChartConfig;

const incomeExpenseChartConfig = {
  income: {
    label: "Income",
    color: "oklch(0.72 0.17 142)",
  },
  expenses: {
    label: "Expenses",
    color: "oklch(0.64 0.2 16)",
  },
} satisfies ChartConfig;

const CATEGORY_COLORS = [
  "oklch(0.64 0.2 16)",
  "oklch(0.65 0.17 45)",
  "oklch(0.72 0.17 142)",
  "oklch(0.62 0.19 260)",
  "oklch(0.65 0.18 310)",
  "oklch(0.7 0.12 70)",
  "oklch(0.6 0.15 200)",
  "oklch(0.55 0.2 340)",
];

// --- Components ---

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

function EmptyChart({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const { transactions, loading: txLoading } = useTransactions(500);
  const { snapshots, loading: snapshotsLoading } = useNetWorthHistory();

  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(transactions),
    [transactions]
  );

  const spendingByCategory = useMemo(
    () => computeSpendingByCategory(transactions),
    [transactions]
  );

  const topCategories = useMemo(
    () => spendingByCategory.slice(0, 5),
    [spendingByCategory]
  );

  // Build monthly spending by top 5 categories
  const monthlyByCategory = useMemo(() => {
    if (topCategories.length === 0) return [];

    const categoryNames = topCategories.map((c) => c.category);
    const monthMap = new Map<string, Record<string, number>>();

    for (const tx of transactions) {
      if (tx.type !== "Expense") continue;
      const cat = tx.categoryName || "Uncategorized";
      if (!categoryNames.includes(cat)) continue;

      const monthKey = format(tx.transactionDate.toDate(), "yyyy-MM");
      const current = monthMap.get(monthKey) || {};
      current[cat] = (current[cat] || 0) + tx.amount;
      monthMap.set(monthKey, current);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }, [transactions, topCategories]);

  const monthlyCategoryChartConfig: ChartConfig = useMemo(() => {
    return Object.fromEntries(
      topCategories.map((item, index) => [
        item.category,
        {
          label: item.category,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        },
      ])
    );
  }, [topCategories]);

  // Horizontal bar chart config for top spending
  const topSpendingChartConfig: ChartConfig = useMemo(() => {
    return Object.fromEntries(
      spendingByCategory.map((item, index) => [
        item.category,
        {
          label: item.category,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        },
      ])
    );
  }, [spendingByCategory]);

  const loading = txLoading || snapshotsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Net Worth Over Time */}
        {loading ? (
          <ChartSkeleton title="Net Worth Over Time" />
        ) : snapshots.length === 0 ? (
          <EmptyChart
            title="Net Worth Over Time"
            message="No net worth snapshots yet. Take a snapshot in Settings to start tracking."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Net Worth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={netWorthChartConfig}
                className="h-[300px] w-full"
              >
                <LineChart data={snapshots} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="snapshotMonth"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}K`
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) =>
                          formatMonthLabel(label as string)
                        }
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-muted-foreground">
                              {netWorthChartConfig[
                                name as keyof typeof netWorthChartConfig
                              ]?.label ?? name}
                            </span>
                            <span className="font-mono font-medium">
                              {formatCurrency(value as number)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="var(--color-netWorth)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="assetsTotal"
                    stroke="var(--color-assetsTotal)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="investmentsTotal"
                    stroke="var(--color-investmentsTotal)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="liabilitiesTotal"
                    stroke="var(--color-liabilitiesTotal)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Income vs Expense Trend */}
        {loading ? (
          <ChartSkeleton title="Monthly Income vs Expenses" />
        ) : monthlyTrend.length === 0 ? (
          <EmptyChart
            title="Monthly Income vs Expenses"
            message="No transaction data available yet."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={incomeExpenseChartConfig}
                className="h-[300px] w-full"
              >
                <BarChart data={monthlyTrend} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}K`
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) =>
                          formatMonthLabel(label as string)
                        }
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-muted-foreground">
                              {incomeExpenseChartConfig[
                                name as keyof typeof incomeExpenseChartConfig
                              ]?.label ?? name}
                            </span>
                            <span className="font-mono font-medium">
                              {formatCurrency(value as number)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="income"
                    fill="var(--color-income)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="var(--color-expenses)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Spending Categories - Horizontal Bar */}
        {loading ? (
          <ChartSkeleton title="Top Spending Categories" />
        ) : spendingByCategory.length === 0 ? (
          <EmptyChart
            title="Top Spending Categories"
            message="No expense data available yet."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={topSpendingChartConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={spendingByCategory}
                  layout="vertical"
                  accessibilityLayer
                  margin={{ left: 20 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}K`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="category"
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-muted-foreground">
                              {name}
                            </span>
                            <span className="font-mono font-medium">
                              {formatCurrency(value as number)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="amount"
                    radius={[0, 4, 4, 0]}
                    fill="oklch(0.62 0.19 260)"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Spending by Top Categories */}
        {loading ? (
          <ChartSkeleton title="Monthly Spending by Top Categories" />
        ) : monthlyByCategory.length === 0 ? (
          <EmptyChart
            title="Monthly Spending by Top Categories"
            message="No expense data available yet."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending by Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={monthlyCategoryChartConfig}
                className="h-[300px] w-full"
              >
                <LineChart data={monthlyByCategory} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000).toFixed(0)}K`
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) =>
                          formatMonthLabel(label as string)
                        }
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-muted-foreground">
                              {monthlyCategoryChartConfig[
                                name as keyof typeof monthlyCategoryChartConfig
                              ]?.label ?? name}
                            </span>
                            <span className="font-mono font-medium">
                              {formatCurrency(value as number)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {topCategories.map((cat, index) => (
                    <Line
                      key={cat.category}
                      type="monotone"
                      dataKey={cat.category}
                      stroke={
                        CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                      }
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
