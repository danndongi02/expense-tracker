"use client";

import { useState, useMemo } from "react";
import { format, parseISO, addMonths, subMonths } from "date-fns";
import { PlusIcon, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useBudgets } from "@/lib/hooks/use-budgets";
import { useAuth } from "@/lib/context/auth-context";
import { Budget } from "@/lib/types";
import { deleteBudget, copyBudgetsFromMonth } from "@/lib/services/budgets.service";
import {
  computeBudgetVsActual,
  computeBudgetSummary,
} from "@/lib/services/analytics.service";
import { BudgetForm } from "@/components/budgets/budget-form";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// ─── Status color maps ────────────────────────────────────────────────────────

const statusBarColor = {
  ok: "bg-green-500",
  warning: "bg-amber-500",
  exceeded: "bg-red-500",
} as const;

const statusTextColor = {
  ok: "text-green-600",
  warning: "text-amber-500",
  exceeded: "text-red-600",
} as const;

const statusBadgeVariant = {
  ok: "default",
  warning: "secondary",
  exceeded: "destructive",
} as const;

const statusLabel = {
  ok: "On Track",
  warning: "Warning",
  exceeded: "Exceeded",
} as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BudgetsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetsPage() {
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const { budgets, loading: budgetsLoading } = useBudgets(selectedMonth);
  const { transactions, loading: txLoading } = useTransactions(500);

  // ── Month navigation ────────────────────────────────────────────────────────

  function prevMonth() {
    setSelectedMonth(
      format(subMonths(parseISO(selectedMonth + "-01"), 1), "yyyy-MM")
    );
  }

  function nextMonth() {
    setSelectedMonth(
      format(addMonths(parseISO(selectedMonth + "-01"), 1), "yyyy-MM")
    );
  }

  const monthLabel = format(parseISO(selectedMonth + "-01"), "MMMM yyyy");
  const prevMonthLabel = format(
    subMonths(parseISO(selectedMonth + "-01"), 1),
    "MMMM yyyy"
  );

  // ── Budget vs actual computation ────────────────────────────────────────────

  const { comparisons, summary } = useMemo(() => {
    const reversalOriginalIds = new Set(
      transactions
        .filter((t) => t.type === "Reversal" && t.originalTransactionId)
        .map((t) => t.originalTransactionId!)
    );

    const monthExpenses = transactions.filter(
      (t) =>
        t.type === "Expense" &&
        !reversalOriginalIds.has(t.id) &&
        format(t.transactionDate.toDate(), "yyyy-MM") === selectedMonth
    );

    const comparisons = computeBudgetVsActual(monthExpenses, budgets);
    const summary = computeBudgetSummary(comparisons);
    return { comparisons, summary };
  }, [transactions, budgets, selectedMonth]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const existingCategoryIds = budgets.map((b) => b.categoryId);

  function handleAdd() {
    setEditingBudget(undefined);
    setFormOpen(true);
  }

  function handleEdit(budget: Budget) {
    setEditingBudget(budget);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingBudget(undefined);
  }

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBudget(user.uid, deleteTarget.id);
      toast.success("Budget deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete budget");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCopyFromLastMonth() {
    if (!user) return;
    const prevMonthKey = format(
      subMonths(parseISO(selectedMonth + "-01"), 1),
      "yyyy-MM"
    );
    setIsCopying(true);
    try {
      await copyBudgetsFromMonth(user.uid, prevMonthKey, selectedMonth);
      toast.success("Budgets copied from last month");
    } catch {
      toast.error("Failed to copy budgets");
    } finally {
      setIsCopying(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
      </div>

      {/* Sub-header: month navigation + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center font-medium">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleAdd}>
          <PlusIcon data-icon="inline-start" />
          Add Budget
        </Button>
      </div>

      {budgetsLoading || txLoading ? (
        <BudgetsSkeleton />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Total Budgeted</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalBudgeted)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.totalSpent)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Categories Over Budget
                </p>
                <p className="text-2xl font-bold">{summary.categoriesOver}</p>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  No budgets for {monthLabel}.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopyFromLastMonth}
                    disabled={isCopying}
                  >
                    {isCopying ? "Copying..." : `Copy from ${prevMonthLabel}`}
                  </Button>
                  <Button onClick={handleAdd}>
                    <PlusIcon data-icon="inline-start" />
                    Add Budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Budget (KES)</TableHead>
                      <TableHead>Spent (KES)</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>% Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisons.map((comparison) => (
                      <TableRow key={comparison.budget.id}>
                        <TableCell className="font-medium">
                          {comparison.budget.categoryName}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(comparison.budget.budgetAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(comparison.actual)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            Math.max(
                              0,
                              comparison.budget.budgetAmount - comparison.actual
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  statusBarColor[comparison.status]
                                )}
                                style={{
                                  width: `${Math.min(comparison.percentage, 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-sm",
                                statusTextColor[comparison.status]
                              )}
                            >
                              {comparison.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant[comparison.status]}
                          >
                            {statusLabel[comparison.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(comparison.budget)}
                              aria-label="Edit budget"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget(comparison.budget)
                              }
                              aria-label="Delete budget"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogs */}
      <BudgetForm
        open={formOpen}
        onOpenChange={handleFormClose}
        month={selectedMonth}
        budget={editingBudget}
        existingCategoryIds={existingCategoryIds}
        onDelete={(b) => {
          setFormOpen(false);
          setDeleteTarget(b);
        }}
        key={editingBudget?.id ?? "new"}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Budget"
        description={`Remove budget for ${deleteTarget?.categoryName}?`}
        warningText="This removes the budget limit. Your spending history is not affected."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
