"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { takeNetWorthSnapshot } from "@/lib/services/net-worth.service";
import { useNetWorthHistory } from "@/lib/hooks/use-net-worth";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SettingsPage() {
  const { user } = useAuth();
  const { snapshots } = useNetWorthHistory();
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  async function handleTakeSnapshot() {
    if (!user) return;
    setSnapshotLoading(true);
    try {
      const snapshot = await takeNetWorthSnapshot(user.uid);
      toast.success(
        `Snapshot taken for ${snapshot.snapshotMonth}. Net worth recorded.`
      );
    } catch (error) {
      console.error("Failed to take snapshot:", error);
      toast.error("Failed to take net worth snapshot. Please try again.");
    } finally {
      setSnapshotLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Email
              </p>
              <p className="text-sm">{user?.email ?? "Not available"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Display Name
              </p>
              <p className="text-sm">
                {user?.displayName ?? "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Net Worth Snapshot Section */}
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Snapshot</CardTitle>
            <CardDescription>
              Capture a point-in-time snapshot of your current net worth based on
              all account balances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastSnapshot && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Snapshot
                </p>
                <p className="text-sm">
                  {lastSnapshot.snapshotMonth} &mdash; taken{" "}
                  {format(lastSnapshot.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            )}
            <Button
              onClick={handleTakeSnapshot}
              disabled={snapshotLoading}
            >
              {snapshotLoading ? "Taking Snapshot..." : "Take Snapshot"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About This App</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This expense tracker helps you manage your personal finances by
              tracking transactions, categorizing spending, monitoring account
              balances, and visualizing your financial trends over time. All data
              is stored securely in your Firebase account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
