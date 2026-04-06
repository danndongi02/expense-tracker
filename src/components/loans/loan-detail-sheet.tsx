"use client";

import { useEffect, useState } from "react";
import { Loan, Transaction } from "@/lib/types";
import { getLoanTransactions } from "@/lib/services/transactions.service";
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
import { 
  History, 
  TrendingUp, 
  CheckCircle2, 
  ArrowDownIcon, 
  ArrowUpIcon,
  Info,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { estimateNextInterestDate } from "@/lib/utils/loan-projection";

interface LoanDetailSheetProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (loan: Loan) => void;
}

export function LoanDetailSheet({ loan, open, onOpenChange, onEdit }: LoanDetailSheetProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && loan && user) {
      loadTransactions();
    }
  }, [open, loan, user]);

  async function loadTransactions() {
    if (!user || !loan) return;
    setLoading(true);
    try {
      const data = await getLoanTransactions(user.uid, loan.linkedAccountId);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load loan transactions", error);
    } finally {
      setLoading(false);
    }
  }

  if (!loan) return null;

  const principalPaid = Math.max(0, loan.originalPrincipal - loan.currentBalance);
  const progressPercent = Math.min(
    100,
    Math.max(0, (principalPaid / loan.originalPrincipal) * 100)
  );

  const nextInterestDate = estimateNextInterestDate(
    loan.startDate.toDate(),
    loan.interestFrequency
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden !p-0">
        <div className="p-6 pb-4">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">{loan.name}</SheetTitle>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => {
                      onEdit(loan);
                      onOpenChange(false);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Badge variant={loan.status === "Active" ? "default" : "secondary"}>
                  {loan.status}
                </Badge>
              </div>
            </div>
            <SheetDescription>
              Account: {loan.linkedAccountName}
            </SheetDescription>
          </SheetHeader>

          {/* Progress Section */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground whitespace-nowrap">Repayment Progress</span>
              <span className="font-medium">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground italic">
              <span>{formatCurrency(principalPaid)} paid</span>
              <span>{formatCurrency(loan.currentBalance)} remaining</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Principal</p>
                <p className="font-semibold text-sm">{formatCurrency(loan.originalPrincipal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Interest Paid</p>
                <p className="font-semibold text-sm text-amber-600">{formatCurrency(loan.totalInterestPaid)}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Estimated Next Hit</p>
                <p className="font-semibold text-sm">
                  {nextInterestDate ? formatDate(nextInterestDate) : "N/A"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Interest Rate</p>
                <p className="font-semibold text-sm">{loan.interestRate}% <span className="text-[10px] font-normal text-muted-foreground">({loan.interestFrequency})</span></p>
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
                  <p className="text-sm">No linked transactions found.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3 group">
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "Loan Repayment" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {tx.type === "Loan Repayment" ? (
                        <ArrowDownIcon className="h-4 w-4" />
                      ) : (
                        <ArrowUpIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className={`text-sm font-semibold whitespace-nowrap ${
                          tx.type === "Loan Repayment" ? "text-green-600" : "text-amber-600"
                        }`}>
                          {tx.type === "Loan Repayment" ? "-" : "+"}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.transactionDate.toDate())} • {tx.type}
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

        {loan.status === "Paid Off" && (
          <div className="p-6 bg-green-50 border-t border-green-100">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">This loan has been fully paid off!</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
