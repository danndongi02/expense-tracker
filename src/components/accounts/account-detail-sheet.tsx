"use client";

import { useEffect, useState } from "react";
import { AccountBalance, Transaction } from "@/lib/types";
import { getAccountTransactions } from "@/lib/services/transactions.service";
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
import { History, Info, Edit2, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

interface AccountDetailSheetProps {
  accountBalance: AccountBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (accountBalance: AccountBalance) => void;
}

function getTxDisplay(tx: Transaction, accountId: string): {
  label: string;
  amount: string;
  isCredit: boolean;
  icon: "in" | "out" | "transfer";
} {
  const isTo = tx.toAccountId === accountId;

  switch (tx.type) {
    case "Income":
      return { label: tx.categoryName ?? "Income", amount: `+${formatCurrency(tx.amount)}`, isCredit: true, icon: "in" };
    case "Expense":
      return { label: tx.categoryName ?? "Expense", amount: `-${formatCurrency(tx.amount)}`, isCredit: false, icon: "out" };
    case "Transfer":
    case "Investment Contribution":
      return isTo
        ? { label: `From ${tx.accountName}`, amount: `+${formatCurrency(tx.amount)}`, isCredit: true, icon: "in" }
        : { label: `To ${tx.toAccountName}`, amount: `-${formatCurrency(tx.amount)}`, isCredit: false, icon: "out" };
    case "Loan Repayment":
      return isTo
        ? { label: `From ${tx.accountName}`, amount: `-${formatCurrency(tx.amount)}`, isCredit: false, icon: "out" }
        : { label: `To ${tx.toAccountName}`, amount: `-${formatCurrency(tx.amount)}`, isCredit: false, icon: "out" };
    case "Interest Charge":
      return { label: "Interest Charge", amount: `+${formatCurrency(tx.amount)}`, isCredit: false, icon: "out" };
    case "Reversal":
      return { label: "Reversal", amount: `+${formatCurrency(tx.amount)}`, isCredit: true, icon: "transfer" };
    default:
      return { label: tx.type, amount: formatCurrency(tx.amount), isCredit: true, icon: "transfer" };
  }
}

export function AccountDetailSheet({
  accountBalance,
  open,
  onOpenChange,
  onEdit,
}: AccountDetailSheetProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && accountBalance && user) {
      setLoading(true);
      getAccountTransactions(user.uid, accountBalance.account.id)
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, accountBalance, user]);

  if (!accountBalance) return null;

  const { account, currentBalance } = accountBalance;
  const isPositive = currentBalance >= 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden !p-0">
        <div className="p-6 pb-4">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{account.name}</SheetTitle>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => { onEdit(accountBalance); onOpenChange(false); }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Badge variant="secondary">{account.type}</Badge>
              </div>
            </div>
            <SheetDescription>{account.subtype}</SheetDescription>
          </SheetHeader>

          {/* Balance */}
          <div className="mb-6">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Current Balance</p>
            <p className={`text-3xl font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(currentBalance)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Opening Balance</p>
                <p className="font-semibold text-sm">{formatCurrency(account.openingBalance)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</p>
                <p className="font-semibold text-sm">{account.status}</p>
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
                  <p className="text-sm">No transactions yet.</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const display = getTxDisplay(tx, account.id);
                  const IconComp = display.icon === "in" ? ArrowDownLeft : display.icon === "out" ? ArrowUpRight : ArrowLeftRight;
                  return (
                    <div key={tx.id} className="flex items-start gap-3">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        display.isCredit
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          <p className={`text-sm font-semibold whitespace-nowrap ${
                            display.isCredit ? "text-green-600" : "text-red-600"
                          }`}>
                            {display.amount}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.transactionDate.toDate())} • {display.label}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
