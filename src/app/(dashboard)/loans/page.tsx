"use client";

import { useState } from "react";
import { useLoans } from "@/lib/hooks/use-loans";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { Loan } from "@/lib/types";

import { LoanForm } from "@/components/loans/loan-form";
import { LoanCard } from "@/components/loans/loan-card";
import { LoanDetailSheet } from "@/components/loans/loan-detail-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { deleteLoan } from "@/lib/services/loans.service";
import { useAuth } from "@/lib/context/auth-context";

export default function LoansPage() {
  const { user } = useAuth();
  const { loans, loading } = useLoans();
  const { accounts } = useAccounts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>();
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteLoan(user.uid, deleteTarget.id);
      toast.success("Loan deleted successfully");
      setDeleteTarget(null);
      setFormOpen(false);
    } catch (error) {
      toast.error("Failed to delete loan");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEdit(loan: Loan) {
    setEditingLoan(loan);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingLoan(undefined);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingLoan(undefined);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loans</h1>
        <Button onClick={handleAdd}>
          <PlusIcon data-icon="inline-start" />
          Add Loan
        </Button>
      </div>

      {loading ? (
        <LoansSkeleton />
      ) : loans.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">
            No loans yet. Add your first loan to start tracking.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onClick={() => setSelectedLoan(loan)}
            />
          ))}
        </div>
      )}

      <LoanDetailSheet
        loan={selectedLoan}
        open={!!selectedLoan}
        onOpenChange={(open) => !open && setSelectedLoan(null)}
        onEdit={handleEdit}
      />

      <LoanForm
        open={formOpen}
        onOpenChange={handleFormClose}
        loan={editingLoan}
        accounts={accounts}
        onDelete={(loan) => {
          setFormOpen(false);
          setDeleteTarget(loan);
        }}
        key={editingLoan?.id ?? "new"}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Loan"
        description="Are you sure you want to delete this loan?"
        warningText="This removes all loan tracking data. The linked liability account will not be deleted."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function LoansSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}
