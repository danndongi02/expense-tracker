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

interface NetWorthCardProps {
  assetsTotal: number;
  investmentsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  loading: boolean;
}

export function NetWorthCard({
  assetsTotal,
  investmentsTotal,
  liabilitiesTotal,
  netWorth,
  loading,
}: NetWorthCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Worth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Worth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p
          className={cn(
            "text-2xl font-bold",
            netWorth >= 0 ? "text-green-600" : "text-red-600"
          )}
        >
          {formatCurrency(netWorth)}
        </p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Assets</span>
            <span className="font-medium">{formatCurrency(assetsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Investments</span>
            <span className="font-medium">
              {formatCurrency(investmentsTotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Liabilities</span>
            <span className="font-medium text-red-600">
              {formatCurrency(liabilitiesTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
