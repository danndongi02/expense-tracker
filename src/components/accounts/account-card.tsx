"use client";

import { AccountBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: AccountBalance;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const { account: acc, currentBalance } = account;

  return (
    <Card
      size="sm"
      className={cn(
        "cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/30",
        acc.status === "Inactive" && "opacity-60"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{acc.name}</CardTitle>
          <Badge variant="secondary">{acc.type}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{acc.subtype}</p>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-lg font-semibold",
            currentBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}
        >
          {formatCurrency(currentBalance)}
        </p>
      </CardContent>
    </Card>
  );
}
