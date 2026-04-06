"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useBalances } from "@/lib/hooks/use-balances";
import { Account, AccountBalance } from "@/lib/types";
import { AccountForm } from "@/components/accounts/account-form";
import { AccountCard } from "@/components/accounts/account-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { AccountDetailSheet } from "@/components/accounts/account-detail-sheet";
import { deleteAccount } from "@/lib/services/accounts.service";

export default function AccountsPage() {
  const { user } = useAuth();
  const { balances, loading } = useBalances();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailAccount, setDetailAccount] = useState<AccountBalance | null>(null);

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAccount(user.uid, deleteTarget.id);
      toast.success("Account deleted successfully");
      setDeleteTarget(null);
      setFormOpen(false);
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }

  const assets = balances.filter((b) => b.account.type === "Asset");
  const liabilities = balances.filter((b) => b.account.type === "Liability");
  const investments = balances.filter((b) => b.account.type === "Investment");

  function handleEdit(accountBalance: AccountBalance) {
    setEditingAccount(accountBalance.account);
    setFormOpen(true);
  }

  function handleCardClick(accountBalance: AccountBalance) {
    setDetailAccount(accountBalance);
  }

  function handleAdd() {
    setEditingAccount(undefined);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingAccount(undefined);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <Button onClick={handleAdd}>
          <PlusIcon data-icon="inline-start" />
          Add Account
        </Button>
      </div>

      {loading ? (
        <AccountsSkeleton />
      ) : (
        <div className="space-y-8">
          <AccountSection
            title="Assets"
            accounts={assets}
            onEdit={handleCardClick}
          />
          <AccountSection
            title="Liabilities"
            accounts={liabilities}
            onEdit={handleCardClick}
          />
          <AccountSection
            title="Investments"
            accounts={investments}
            onEdit={handleCardClick}
          />
        </div>
      )}

      <AccountForm
        open={formOpen}
        onOpenChange={handleFormClose}
        account={editingAccount}
        onDelete={(acc) => {
          setFormOpen(false);
          setDeleteTarget(acc);
        }}
        key={editingAccount?.id ?? "new"}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Account"
        description="Are you sure you want to delete this account?"
        warningText="This permanently removes the account and all associated ledger data. This cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <AccountDetailSheet
        accountBalance={detailAccount}
        open={!!detailAccount}
        onOpenChange={(open) => { if (!open) setDetailAccount(null); }}
        onEdit={handleEdit}
      />
    </div>
  );
}

function AccountSection({
  title,
  accounts,
  onEdit,
}: {
  title: string;
  accounts: AccountBalance[];
  onEdit: (account: AccountBalance) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-muted-foreground">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((ab) => (
          <AccountCard
            key={ab.account.id}
            account={ab}
            onClick={() => onEdit(ab)}
          />
        ))}
      </div>
    </section>
  );
}

function AccountsSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((card) => (
              <Skeleton key={card} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
