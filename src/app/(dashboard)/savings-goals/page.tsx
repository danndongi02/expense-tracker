"use client";

import { useState, useMemo } from "react";
import { PlusIcon, PiggyBank } from "lucide-react";
import { useSavingsGoals } from "@/lib/hooks/use-savings-goals";
import { useBalances } from "@/lib/hooks/use-balances";
import { useAuth } from "@/lib/context/auth-context";
import { SavingsGoal } from "@/lib/types";
import { deleteSavingsGoal } from "@/lib/services/savings-goals.service";
import { formatCurrency } from "@/lib/utils/currency";
import { SavingsGoalForm } from "@/components/savings-goals/savings-goal-form";
import { SavingsGoalCard } from "@/components/savings-goals/savings-goal-card";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function SavingsGoalsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function SavingsGoalsPage() {
  const { user } = useAuth();
  const { goals, activeGoals, loading: goalsLoading } = useSavingsGoals();
  const { balances, loading: balancesLoading } = useBalances();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const balanceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances) {
      map.set(b.account.id, b.currentBalance);
    }
    return map;
  }, [balances]);

  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = activeGoals.reduce((sum, g) => {
    const bal = g.linkedAccountId ? (balanceMap.get(g.linkedAccountId) ?? 0) : 0;
    return sum + Math.max(0, bal);
  }, 0);

  function handleAdd() {
    setEditingGoal(undefined);
    setFormOpen(true);
  }

  function handleEdit(goal: SavingsGoal) {
    setEditingGoal(goal);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingGoal(undefined);
  }

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSavingsGoal(user.uid, deleteTarget.id);
      toast.success("Goal deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete goal");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Button onClick={handleAdd}>
          <PlusIcon data-icon="inline-start" />
          Add Goal
        </Button>
      </div>

      {goalsLoading || balancesLoading ? (
        <SavingsGoalsSkeleton />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSaved)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Goals grid or empty state */}
          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">No savings goals yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a goal to start tracking your savings progress.
                  </p>
                </div>
                <Button onClick={handleAdd}>
                  <PlusIcon data-icon="inline-start" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  currentAmount={
                    goal.linkedAccountId
                      ? (balanceMap.get(goal.linkedAccountId) ?? 0)
                      : 0
                  }
                  hasLinkedAccount={!!goal.linkedAccountId}
                  onEdit={handleEdit}
                  onDelete={(g) => setDeleteTarget(g)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <SavingsGoalForm
        open={formOpen}
        onOpenChange={handleFormClose}
        goal={editingGoal}
        key={editingGoal?.id ?? "new"}
        onDelete={(g) => {
          setFormOpen(false);
          setEditingGoal(undefined);
          setDeleteTarget(g);
        }}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Goal"
        description={`Remove the goal "${deleteTarget?.name}"?`}
        warningText="This action cannot be undone. Your account balances are not affected."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
