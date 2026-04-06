"use client";

import { useState } from "react";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { Subscription } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { UpcomingPayments } from "@/components/subscriptions/upcoming-payments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { SubscriptionDetailSheet } from "@/components/subscriptions/subscription-detail-sheet";
import { deleteSubscription } from "@/lib/services/subscriptions.service";
import { useAuth } from "@/lib/context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { subscriptions, summary, loading } = useSubscriptions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailSub, setDetailSub] = useState<Subscription | null>(null);

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSubscription(user.uid, deleteTarget.id);
      toast.success("Subscription deleted successfully");
      setDeleteTarget(null);
      setFormOpen(false);
    } catch (error) {
      toast.error("Failed to delete subscription");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEdit(sub: Subscription) {
    setEditingSub(sub);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingSub(undefined);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingSub(undefined);
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default" as const;
      case "Paused":
        return "secondary" as const;
      case "Cancelled":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <Button onClick={handleAdd}>
          <PlusIcon data-icon="inline-start" />
          Add Subscription
        </Button>
      </div>

      {loading ? (
        <SubscriptionsSkeleton />
      ) : (
        <>
          {/* Summary Bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-bold">{summary.activeCount}</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.monthlyCost)}
                </p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <p className="text-sm text-muted-foreground">Yearly Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.yearlyCost)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions Table */}
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No subscriptions yet. Add your first subscription to get
                  started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow
                        key={sub.id}
                        className="cursor-pointer"
                        onClick={() => setDetailSub(sub)}
                      >
                        <TableCell className="font-medium">
                          {sub.name}
                        </TableCell>
                        <TableCell>{formatCurrency(sub.amount)}</TableCell>
                        <TableCell>{sub.frequency}</TableCell>
                        <TableCell>
                          {formatDate(sub.nextDueDate.toDate())}
                        </TableCell>
                        <TableCell>{sub.accountName}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(sub.status)}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Payments */}
          <UpcomingPayments subscriptions={subscriptions} />
        </>
      )}

      <SubscriptionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        subscription={editingSub}
        accounts={accounts}
        categories={categories}
        onDelete={(sub) => {
          setFormOpen(false);
          setDeleteTarget(sub);
        }}
        key={editingSub?.id ?? "new"}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription?"
        warningText="This permanently removes the subscription and its upcoming billing reminders."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <SubscriptionDetailSheet
        subscription={detailSub}
        open={!!detailSub}
        onOpenChange={(open) => { if (!open) setDetailSub(null); }}
        onEdit={handleEdit}
      />
    </div>
  );
}

function SubscriptionsSkeleton() {
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
