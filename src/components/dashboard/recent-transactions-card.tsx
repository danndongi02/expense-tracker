"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  loading: boolean;
}

export function RecentTransactionsCard({
  transactions,
  loading,
}: RecentTransactionsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recent = transactions.slice(0, 10);

  if (recent.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transactions recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(tx.transactionDate.toDate())}
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {tx.description}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    tx.type === "Income"
                      ? "text-green-600"
                      : tx.type === "Expense"
                        ? "text-red-600"
                        : ""
                  )}
                >
                  {tx.type === "Income" ? "+" : tx.type === "Expense" ? "-" : ""}
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tx.accountName}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
