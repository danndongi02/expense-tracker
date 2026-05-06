"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { savingsGoalSchema } from "@/lib/utils/validators";
import { createSavingsGoal, updateSavingsGoal } from "@/lib/services/savings-goals.service";
import { useAuth } from "@/lib/context/auth-context";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { SavingsGoal } from "@/lib/types";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SavingsGoalFormInput = z.input<typeof savingsGoalSchema>;
type SavingsGoalFormValues = z.output<typeof savingsGoalSchema>;

interface SavingsGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: SavingsGoal;
  onDelete?: (goal: SavingsGoal) => void;
}

export function SavingsGoalForm({
  open,
  onOpenChange,
  goal,
  onDelete,
}: SavingsGoalFormProps) {
  const { user } = useAuth();
  const { activeAccounts } = useAccounts();
  const isEditing = !!goal;

  const form = useForm<SavingsGoalFormInput, unknown, SavingsGoalFormValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: goal
      ? {
          name: goal.name,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate.toDate(),
          linkedAccountId: goal.linkedAccountId ?? "",
          linkedAccountName: goal.linkedAccountName ?? "",
          notes: goal.notes ?? "",
          status: goal.status,
        }
      : {
          name: "",
          targetAmount: 0,
          targetDate: addDays(new Date(), 90),
          linkedAccountId: "",
          linkedAccountName: "",
          notes: "",
          status: "Active",
        },
  });

  async function onSubmit(data: SavingsGoalFormValues) {
    if (!user) return;
    try {
      const payload = {
        name: data.name,
        targetAmount: data.targetAmount,
        targetDate: Timestamp.fromDate(data.targetDate),
        linkedAccountId: data.linkedAccountId || undefined,
        linkedAccountName: data.linkedAccountName || undefined,
        notes: data.notes || undefined,
        status: data.status,
      };

      if (isEditing && goal) {
        await updateSavingsGoal(user.uid, goal.id, payload);
        toast.success("Goal updated");
      } else {
        await createSavingsGoal(user.uid, payload);
        toast.success("Goal created");
      }

      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save goal");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the goal details below."
              : "Set a target and optionally link it to an account for automatic progress tracking."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Emergency Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Amount */}
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      {...field}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Date */}
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value instanceof Date
                          ? format(field.value, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Linked Account */}
            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Linked Account{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const account = activeAccounts.find((a) => a.id === value);
                      form.setValue("linkedAccountName", account?.name ?? "");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Progress auto-updates from this account&apos;s live balance.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status — edit mode only */}
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Achieved">Achieved</SelectItem>
                        <SelectItem value="Abandoned">Abandoned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about this goal..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {isEditing && onDelete && goal ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(goal);
                    onOpenChange(false);
                  }}
                  disabled={form.formState.isSubmitting}
                >
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Update Goal"
                    : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
