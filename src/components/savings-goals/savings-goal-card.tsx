"use client";

import { differenceInDays, format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { SavingsGoal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusBadgeVariant: Record<
  SavingsGoal["status"],
  "default" | "secondary" | "destructive"
> = {
  Active: "default",
  Achieved: "secondary",
  Abandoned: "destructive",
};

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}

export function SavingsGoalCard({ goal, onEdit, onDelete }: SavingsGoalCardProps) {
  const currentAmount = goal.currentAmount ?? 0;
  const hasLinkedAccount = !!goal.linkedAccountId;
  const percentage = goal.targetAmount > 0
    ? Math.min((currentAmount / goal.targetAmount) * 100, 100)
    : 0;
  const daysRemaining = differenceInDays(goal.targetDate.toDate(), new Date());
  const isOverdue = daysRemaining < 0 && goal.status === "Active";

  const progressBarColor =
    !hasLinkedAccount
      ? "bg-muted-foreground/30"
      : percentage >= 100
        ? "bg-green-500"
        : isOverdue
          ? "bg-red-500"
          : "bg-blue-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base leading-tight">{goal.name}</CardTitle>
            {goal.linkedAccountName && (
              <p className="text-xs text-muted-foreground truncate">
                {goal.linkedAccountName}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant={statusBadgeVariant[goal.status]}>{goal.status}</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(goal)}
              aria-label="Edit goal"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(goal)}
              aria-label="Delete goal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {hasLinkedAccount ? formatCurrency(currentAmount) : "—"}
            </span>
            <span className="text-muted-foreground">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", progressBarColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p
            className={cn(
              "text-xs",
              percentage >= 100 ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {hasLinkedAccount
              ? `${percentage.toFixed(1)}% complete`
              : "No linked account — progress not tracked"}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Target: {format(goal.targetDate.toDate(), "dd MMM yyyy")}</span>
          {goal.status === "Active" && (
            <span className={cn(isOverdue && "text-red-600 font-medium")}>
              {isOverdue
                ? `${Math.abs(daysRemaining)}d overdue`
                : daysRemaining === 0
                  ? "Due today"
                  : `${daysRemaining}d left`}
            </span>
          )}
        </div>

        {goal.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{goal.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
