"use client";

import { useEffect, useState } from "react";
import { Subscription, Transaction } from "@/lib/types";
import { getTransactions } from "@/lib/services/transactions.service";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { History, Info, Edit2, CalendarClock, TrendingDown } from "lucide-react";

interface SubscriptionDetailSheetProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (subscription: Subscription) => void;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "Active": return "default" as const;
    case "Paused": return "secondary" as const;
    case "Cancelled": return "destructive" as const;
    default: return "outline" as const;
  }
};

export function SubscriptionDetailSheet({
  subscription,
  open,
  onOpenChange,
  onEdit,
}: SubscriptionDetailSheetProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && subscription && user) {
      setLoading(true);
      // Fetch expense transactions for this subscription's category + account
      getTransactions(user.uid, { categoryId: subscription.categoryId })
        .then(({ transactions: txs }) =>
          setTransactions(txs.filter((tx) => tx.accountId === subscription.accountId))
        )
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, subscription, user]);

  if (!subscription) return null;

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden !p-0">
        <div className="p-6 pb-4">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{subscription.name}</SheetTitle>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => { onEdit(subscription); onOpenChange(false); }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Badge variant={statusVariant(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Amount</p>
                <p className="font-semibold text-sm">{formatCurrency(subscription.amount)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Frequency</p>
                <p className="font-semibold text-sm">{subscription.frequency}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Next Due</p>
                <p className="font-semibold text-sm flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(subscription.nextDueDate.toDate())}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Paid</p>
                <p className="font-semibold text-sm text-red-600">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none col-span-2">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Account · Category</p>
                <p className="font-semibold text-sm truncate">{subscription.accountName} · {subscription.categoryName}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />
        </div>

        {/* Payment History */}
        <div className="flex-1 flex flex-col min-h-0 bg-muted/10">
          <div className="px-6 py-3 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-b">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              Payment History
            </h3>
            {loading && <Skeleton className="h-4 w-16" />}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 pt-2 space-y-4">
              {loading && transactions.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No payments recorded yet.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-red-100 text-red-700">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-sm font-semibold whitespace-nowrap text-red-600">
                          -{formatCurrency(tx.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.transactionDate.toDate())}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
