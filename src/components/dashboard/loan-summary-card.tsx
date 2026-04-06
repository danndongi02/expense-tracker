"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { Loan } from "@/lib/types";

interface LoanSummaryCardProps {
  loans: Loan[];
  loading: boolean;
}

export function LoanSummaryCard({ loans, loading }: LoanSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeLoans = loans.filter((l) => l.status === "Active");

  if (activeLoans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active loans.</p>
        </CardContent>
      </Card>
    );
  }

  const totalBalance = activeLoans.reduce(
    (sum, l) => sum + l.currentBalance,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Loans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Outstanding</span>
          <span className="font-bold text-red-600">
            {formatCurrency(totalBalance)}
          </span>
        </div>
        <div className="space-y-3">
          {activeLoans.map((loan) => (
            <div
              key={loan.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{loan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Interest paid: {formatCurrency(loan.totalInterestPaid)}
                </p>
              </div>
              <p className="font-medium text-red-600">
                {formatCurrency(loan.currentBalance)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
