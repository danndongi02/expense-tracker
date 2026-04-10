"use client";

import { useState } from "react";
import { Transaction, TransactionType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { ReversalConfirmDialog } from "@/components/transactions/reversal-confirm-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (transaction: Transaction) => void;
  onReverse: (transaction: Transaction) => void;
}

function getTypeBadgeVariant(
  type: TransactionType
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "Expense":
      return "destructive";
    case "Income":
    case "Interest Earned":
    case "Dividend":
      return "default";
    case "Transfer":
    case "Investment Contribution":
    case "Investment Withdrawal":
      return "secondary";
    case "Loan Repayment":
      return "outline";
    case "Reversal":
      return "outline";
    case "Interest Charge":
      return "destructive";
    default:
      return "default";
  }
}

function getAmountColor(type: TransactionType): string {
  switch (type) {
    case "Income":
    case "Interest Earned":
    case "Dividend":
      return "text-green-600 dark:text-green-400";
    case "Expense":
    case "Interest Charge":
      return "text-red-600 dark:text-red-400";
    case "Transfer":
    case "Investment Contribution":
    case "Investment Withdrawal":
    case "Loan Repayment":
      return "text-blue-600 dark:text-blue-400";
    case "Reversal":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "";
  }
}

function getAmountPrefix(type: TransactionType): string {
  switch (type) {
    case "Income":
    case "Interest Earned":
    case "Dividend":
      return "+";
    case "Expense":
    case "Interest Charge":
      return "-";
    default:
      return "";
  }
}

function getAccountDisplay(transaction: Transaction): string {
  if (transaction.toAccountName) {
    return `${transaction.accountName} -> ${transaction.toAccountName}`;
  }
  return transaction.accountName;
}

export function TransactionTable({ transactions, onDelete, onReverse }: TransactionTableProps) {
  const [reversalTarget, setReversalTarget] = useState<Transaction | null>(null);
  const [isReversing, setIsReversing] = useState(false);

  async function handleConfirmReversal() {
    if (!reversalTarget) return;
    setIsReversing(true);
    await onReverse(reversalTarget);
    setIsReversing(false);
    setReversalTarget(null);
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No transactions found. Create your first transaction to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>TX ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>
              {formatDate(tx.transactionDate.toDate())}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {tx.transactionId}
            </TableCell>
            <TableCell>
              <Badge variant={getTypeBadgeVariant(tx.type)}>{tx.type}</Badge>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {tx.description}
            </TableCell>
            <TableCell className={`text-right font-medium ${getAmountColor(tx.type)}`}>
              {getAmountPrefix(tx.type)}
              {formatCurrency(tx.amount)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {getAccountDisplay(tx)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {tx.categoryName || "-"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                  <MoreHorizontalIcon className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={tx.type === "Reversal"}
                    onClick={() => setReversalTarget(tx)}
                  >
                    <RotateCcwIcon className="mr-2" />
                    Reverse
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(tx)}>
                    <Trash2Icon className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <ReversalConfirmDialog
      transaction={reversalTarget}
      isSubmitting={isReversing}
      onConfirm={handleConfirmReversal}
      onClose={() => setReversalTarget(null)}
    />
    </>
  );
}
