"use client";

import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { deleteTransaction, reverseTransaction } from "@/lib/services/transactions.service";
import { Transaction } from "@/lib/types";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { useState } from "react";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions();

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(user.uid, deleteTarget.id, deleteTarget.transactionId);
      toast.success("Transaction deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete transaction");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleReverse(transaction: Transaction) {
    if (!user) return;
    try {
      await reverseTransaction(user.uid, transaction);
      toast.success("Transaction reversed successfully");
    } catch (error) {
      toast.error("Failed to reverse transaction");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button render={<Link href="/transactions/new" />} nativeButton={false}>
          <PlusIcon data-icon="inline-start" />
          New Transaction
        </Button>
      </div>

      {loading ? (
        <TransactionsSkeleton />
      ) : (
        <TransactionTable
          transactions={transactions}
          onDelete={setDeleteTarget}
          onReverse={handleReverse}
        />
      )}

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction?"
        warningText="This permanently removes the transaction and its ledger entries. Account balances will be adjusted."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
