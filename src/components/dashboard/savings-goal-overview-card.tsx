"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { useSavingsGoals } from "@/lib/hooks/use-savings-goals";
import { differenceInDays } from "date-fns";

interface SavingsGoalOverviewCardProps {
  loading: boolean;
}

export function SavingsGoalOverviewCard({ loading }: SavingsGoalOverviewCardProps) {
  const { activeGoals, loading: goalsLoading } = useSavingsGoals();

  const isLoading = loading || goalsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Savings Goals</CardTitle>
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Savings Goals</CardTitle>
        <Link
          href="/savings-goals"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Manage →
        </Link>
      </CardHeader>
      <CardContent>
        {activeGoals.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">No active savings goals.</p>
            <Link href="/savings-goals" className="text-sm text-primary hover:underline">
              Create one →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.slice(0, 5).map((goal) => {
              const current = goal.currentAmount ?? 0;
              const percentage =
                goal.targetAmount > 0
                  ? Math.min((current / goal.targetAmount) * 100, 100)
                  : 0;
              const daysRemaining = differenceInDays(goal.targetDate.toDate(), new Date());
              const isOverdue = daysRemaining < 0;
              const hasLinkedAccount = !!goal.linkedAccountId;

              const barColor = !hasLinkedAccount
                ? "bg-muted-foreground/30"
                : percentage >= 100
                  ? "bg-green-500"
                  : isOverdue
                    ? "bg-red-500"
                    : "bg-blue-500";

              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[55%]">
                      {goal.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hasLinkedAccount
                        ? `${formatCurrency(current)} / ${formatCurrency(goal.targetAmount)}`
                        : formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}%</span>
                    {isOverdue ? (
                      <span className="text-red-600 font-medium">
                        {Math.abs(daysRemaining)}d overdue
                      </span>
                    ) : (
                      <span>{daysRemaining === 0 ? "Due today" : `${daysRemaining}d left`}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {activeGoals.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{activeGoals.length - 5} more goal{activeGoals.length - 5 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
