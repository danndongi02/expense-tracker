"use client";

import { Subscription } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

interface UpcomingPaymentsProps {
  subscriptions: Subscription[];
}

export function UpcomingPayments({ subscriptions }: UpcomingPaymentsProps) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcoming = subscriptions
    .filter((s) => {
      if (s.status !== "Active") return false;
      const due = s.nextDueDate.toDate();
      return due >= now && due <= in30Days;
    })
    .sort((a, b) => a.nextDueDate.toDate().getTime() - b.nextDueDate.toDate().getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="size-4" />
          Upcoming Payments (Next 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming payments in the next 30 days.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((sub) => {
              const dueDate = sub.nextDueDate.toDate();
              const daysUntil = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(dueDate)} &middot; {sub.accountName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(sub.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysUntil === 0
                        ? "Due today"
                        : daysUntil === 1
                          ? "Due tomorrow"
                          : `In ${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
