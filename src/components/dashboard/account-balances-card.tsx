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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { AccountBalance } from "@/lib/types";

interface AccountBalancesCardProps {
  balances: AccountBalance[];
  loading: boolean;
}

const typeBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  Asset: "default",
  Liability: "destructive" as "default",
  Investment: "secondary",
};

export function AccountBalancesCard({
  balances,
  loading,
}: AccountBalancesCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No accounts found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((b) => (
              <TableRow key={b.account.id}>
                <TableCell className="font-medium">
                  {b.account.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      b.account.type === "Liability"
                        ? "destructive"
                        : b.account.type === "Investment"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {b.account.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    b.currentBalance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {formatCurrency(b.currentBalance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
