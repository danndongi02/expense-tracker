"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface IncomeVsExpensesCardProps {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  loading: boolean;
}

export function IncomeVsExpensesCard({
  totalIncome,
  totalExpenses,
  netCashFlow,
  loading,
}: IncomeVsExpensesCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Income</span>
            <span className="font-medium text-green-600">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Expenses</span>
            <span className="font-medium text-red-600">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Net Cash Flow</span>
            <span
              className={cn(
                "text-lg font-bold",
                netCashFlow >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {formatCurrency(netCashFlow)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
