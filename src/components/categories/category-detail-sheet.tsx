"use client";

import { useEffect, useState } from "react";
import { Category, Transaction } from "@/lib/types";
import { getTransactions } from "@/lib/services/transactions.service";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { History, Info, Edit2, TrendingDown, TrendingUp } from "lucide-react";

interface CategoryDetailSheetProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (category: Category) => void;
}

export function CategoryDetailSheet({
  category,
  open,
  onOpenChange,
  onEdit,
}: CategoryDetailSheetProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && category && user) {
      setLoading(true);
      getTransactions(user.uid, { categoryId: category.id })
        .then(({ transactions }) => setTransactions(transactions))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, category, user]);

  if (!category) return null;

  const isExpense = category.transactionType === "Expense";
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const txCount = transactions.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden !p-0">
        <div className="p-6 pb-4">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{category.name}</SheetTitle>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => { onEdit(category); onOpenChange(false); }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Badge variant={isExpense ? "destructive" : "default"}>
                  {category.transactionType}
                </Badge>
              </div>
            </div>
            {category.description && (
              <SheetDescription>{category.description}</SheetDescription>
            )}
          </SheetHeader>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">All-Time Total</p>
                <p className={`font-semibold text-sm ${isExpense ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(total)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Transactions</p>
                <p className="font-semibold text-sm">{txCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</p>
                <p className="font-semibold text-sm">{category.status}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Avg. Transaction</p>
                <p className="font-semibold text-sm">{txCount > 0 ? formatCurrency(total / txCount) : "—"}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />
        </div>

        {/* Transaction History */}
        <div className="flex-1 flex flex-col min-h-0 bg-muted/10">
          <div className="px-6 py-3 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10 border-b">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              Transaction History
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
                  <p className="text-sm">No transactions in this category yet.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      isExpense ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {isExpense
                        ? <TrendingDown className="h-4 w-4" />
                        : <TrendingUp className="h-4 w-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className={`text-sm font-semibold whitespace-nowrap ${
                          isExpense ? "text-red-600" : "text-green-600"
                        }`}>
                          {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.transactionDate.toDate())} • {tx.accountName}
                      </p>
                      {tx.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                          "{tx.notes}"
                        </p>
                      )}
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
