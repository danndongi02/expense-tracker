"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { subscriptionSchema } from "@/lib/utils/validators";
import {
  createSubscription,
  updateSubscription,
} from "@/lib/services/subscriptions.service";
import { useAuth } from "@/lib/context/auth-context";
import { Account, Category, Subscription } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
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

type SubscriptionFormInput = z.input<typeof subscriptionSchema>;
type SubscriptionFormValues = z.output<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription;
  onSuccess?: () => void;
  onDelete?: (subscription: Subscription) => void;
  accounts: Account[];
  categories: Category[];
}

function computeNextDueDate(billingDay: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  // Clamp billing day to valid day in target month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(billingDay, daysInCurrentMonth);

  if (clampedDay >= today) {
    return new Date(year, month, clampedDay);
  }

  // Next month
  const nextMonth = month + 1;
  const daysInNextMonth = new Date(year, nextMonth + 1, 0).getDate();
  const clampedNextDay = Math.min(billingDay, daysInNextMonth);
  return new Date(year, nextMonth, clampedNextDay);
}

export function SubscriptionForm({
  open,
  onOpenChange,
  subscription,
  onSuccess,
  onDelete,
  accounts,
  categories,
}: SubscriptionFormProps) {
  const { user } = useAuth();
  const isEditing = !!subscription;

  const form = useForm<SubscriptionFormInput, unknown, SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: subscription
      ? {
          name: subscription.name,
          amount: subscription.amount,
          frequency: subscription.frequency,
          billingDay: subscription.billingDay,
          accountId: subscription.accountId,
          categoryId: subscription.categoryId,
          status: subscription.status,
          notes: subscription.notes ?? "",
        }
      : {
          name: "",
          amount: 0,
          frequency: "Monthly",
          billingDay: 1,
          accountId: "",
          categoryId: "",
          status: "Active",
          notes: "",
        },
  });

  async function onSubmit(data: SubscriptionFormValues) {
    if (!user) return;

    try {
      const account = accounts.find((a) => a.id === data.accountId);
      const category = categories.find((c) => c.id === data.categoryId);
      const nextDueDate = computeNextDueDate(data.billingDay);

      const payload = {
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        billingDay: data.billingDay,
        accountId: data.accountId,
        accountName: account?.name ?? "",
        categoryId: data.categoryId,
        categoryName: category?.name ?? "",
        status: data.status,
        notes: data.notes || undefined,
        nextDueDate: Timestamp.fromDate(nextDueDate),
      };

      if (isEditing && subscription) {
        await updateSubscription(user.uid, subscription.id, payload);
        toast.success("Subscription updated successfully");
      } else {
        await createSubscription(user.uid, payload);
        toast.success("Subscription created successfully");
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        isEditing
          ? "Failed to update subscription"
          : "Failed to create subscription"
      );
    }
  }

  const expenseCategories = categories.filter(
    (c) => c.transactionType === "Expense" && c.status === "Active"
  );
  const activeAccounts = accounts.filter((a) => a.status === "Active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the subscription details below."
              : "Fill in the details to create a new subscription."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Subscription name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={activeAccounts.map((a) => ({ value: a.id, label: a.name }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {isEditing && onDelete && subscription ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(subscription)}
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
                    ? "Update Subscription"
                    : "Create Subscription"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
