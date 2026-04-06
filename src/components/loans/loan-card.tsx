"use client";

import { Loan } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface LoanCardProps {
  loan: Loan;
  onClick: () => void;
}

export function LoanCard({ loan, onClick }: LoanCardProps) {
  const paidOff = loan.originalPrincipal - loan.currentBalance;
  const progressPercent =
    loan.originalPrincipal > 0
      ? Math.min(100, Math.max(0, (paidOff / loan.originalPrincipal) * 100))
      : 0;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{loan.name}</CardTitle>
            <CardDescription>{loan.linkedAccountName}</CardDescription>
          </div>
          <Badge
            variant={loan.status === "Active" ? "default" : "secondary"}
          >
            {loan.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">
            {formatCurrency(loan.currentBalance)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Paid off</span>
            <span>{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Original Principal</p>
            <p className="font-medium">
              {formatCurrency(loan.originalPrincipal)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Interest Rate</p>
            <p className="font-medium">
              {loan.interestRate}% {loan.interestFrequency !== "None" ? loan.interestFrequency : ""}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Total Interest Paid</p>
            <p className="font-medium">
              {formatCurrency(loan.totalInterestPaid)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
