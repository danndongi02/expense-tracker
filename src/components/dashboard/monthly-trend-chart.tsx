"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { formatCurrency } from "@/lib/utils/currency";
import { TrendPoint, TrendGranularity } from "@/lib/services/analytics.service";
import { format, parseISO } from "date-fns";

interface TrendChartProps {
  data: TrendPoint[];
  loading: boolean;
  granularity: TrendGranularity;
  onGranularityChange: (g: TrendGranularity) => void;
}

const chartConfig = {
  income: {
    label: "Income",
    color: "oklch(0.72 0.17 142)",
  },
  expenses: {
    label: "Expenses",
    color: "oklch(0.64 0.2 16)",
  },
} satisfies ChartConfig;

const GRANULARITY_OPTIONS: { value: TrendGranularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function formatTickLabel(value: string, granularity: TrendGranularity): string {
  try {
    if (granularity === "monthly") {
      const date = parseISO(`${value}-01`);
      return format(date, "MMM yyyy");
    }
    if (granularity === "weekly") {
      const date = parseISO(value);
      return `W/${format(date, "MMM d")}`;
    }
    // daily
    const date = parseISO(value);
    return format(date, "MMM d");
  } catch {
    return value;
  }
}

const TITLE: Record<TrendGranularity, string> = {
  daily: "Daily Trend",
  weekly: "Weekly Trend",
  monthly: "Monthly Trend",
};

export function MonthlyTrendChart({
  data,
  loading,
  granularity,
  onGranularityChange,
}: TrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{TITLE[granularity]}</CardTitle>
        <div className="inline-flex rounded-lg border bg-muted p-1 text-xs">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onGranularityChange(opt.value)}
              className={`px-3 py-1 rounded-md transition-colors ${
                granularity === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transaction data available yet.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={data} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(v) => formatTickLabel(v, granularity)}
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
                    labelFormatter={(label) => formatTickLabel(label as string, granularity)}
                    formatter={(value, name) => (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
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
        )}
      </CardContent>
    </Card>
  );
}
