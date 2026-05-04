"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { budgetSchema } from "@/lib/utils/validators";
import { createBudget, updateBudget } from "@/lib/services/budgets.service";
import { useAuth } from "@/lib/context/auth-context";
import { useCategories } from "@/lib/hooks/use-categories";
import { Budget } from "@/lib/types";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BudgetFormInput = z.input<typeof budgetSchema>;
type BudgetFormValues = z.output<typeof budgetSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  budget?: Budget;
  existingCategoryIds: string[];
  onDelete?: (budget: Budget) => void;
}

export function BudgetForm({
  open,
  onOpenChange,
  month,
  budget,
  existingCategoryIds,
  onDelete,
}: BudgetFormProps) {
  const { user } = useAuth();
  const { expenseCategories } = useCategories();
  const isEditing = !!budget;

  const formattedMonth = format(parseISO(month + "-01"), "MMMM yyyy");

  const availableCategories = expenseCategories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  );

  const form = useForm<BudgetFormInput, unknown, BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? {
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          month: budget.month,
          budgetAmount: budget.budgetAmount,
          alertThreshold: budget.alertThreshold,
        }
      : {
          categoryId: "",
          categoryName: "",
          month,
          budgetAmount: 0,
          alertThreshold: 75,
        },
  });

  async function onSubmit(data: BudgetFormValues) {
    if (!user) return;

    try {
      if (isEditing && budget) {
        await updateBudget(user.uid, budget.id, {
          budgetAmount: data.budgetAmount,
          alertThreshold: data.alertThreshold,
        });
        toast.success("Budget updated");
      } else {
        await createBudget(user.uid, {
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          month: data.month,
          budgetAmount: data.budgetAmount,
          alertThreshold: data.alertThreshold,
        });
        toast.success("Budget created");
      }
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save budget");
    }
  }

  return (
    <Dialog key={budget?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Budget" : "Add Budget"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the budget details below."
              : "Fill in the details to create a new budget."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Month display */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Month</span>
              <Badge variant="secondary">{formattedMonth}</Badge>
            </div>

            {/* Category — Select when creating, read-only text when editing */}
            {isEditing ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{budget.categoryName}</p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const category = expenseCategories.find((c) => c.id === value);
                        form.setValue("categoryName", category?.name ?? "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map((category) => (
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
            )}

            <FormField
              control={form.control}
              name="budgetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Budget (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      {...field}
                      value={field.value === 0 ? "" : field.value}
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
              name="alertThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Threshold (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="75"
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Show warning when spending reaches this % of budget
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {isEditing && onDelete && budget ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onDelete(budget);
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
                    ? "Update Budget"
                    : "Create Budget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
