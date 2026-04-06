"use client";

import { TransactionForm } from "@/components/transactions/transaction-form";

export default function NewTransactionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Transaction</h1>
      <TransactionForm />
    </div>
  );
}
