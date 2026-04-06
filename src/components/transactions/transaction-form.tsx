"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/context/auth-context";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { createTransaction } from "@/lib/services/transactions.service";
import { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const TRANSACTION_TYPES: TransactionType[] = [
  "Expense",
  "Income",
  "Transfer",
  "Investment Contribution",
  "Loan Repayment",
  "Reversal",
  "Interest Charge",
];

const transactionFormSchema = z
  .object({
    type: z.enum([
      "Expense",
      "Income",
      "Transfer",
      "Investment Contribution",
      "Loan Repayment",
      "Reversal",
      "Interest Charge",
    ]),
    transactionDate: z.date({ error: "Transaction date is required" }),
    description: z.string().min(1, "Description is required"),
    amount: z.number({ error: "Amount is required" }).positive("Amount must be positive"),
    accountId: z.string().optional(),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    originalTransactionId: z.string().optional(),
    notes: z.string().optional(),
    transactionCost: z.number().min(0).optional().default(0),
  })
  .superRefine((data, ctx) => {
    const type = data.type;

    if (type === "Expense" || type === "Income") {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account is required",
          path: ["accountId"],
        });
      }
      if (!data.categoryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Category is required",
          path: ["categoryId"],
        });
      }
    }

    if (type === "Transfer" || type === "Investment Contribution" || type === "Loan Repayment") {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "From account is required",
          path: ["accountId"],
        });
      }
      if (!data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "To account is required",
          path: ["toAccountId"],
        });
      }
      if (type === "Transfer" && data.accountId && data.toAccountId && data.accountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "From and To accounts must be different",
          path: ["toAccountId"],
        });
      }
    }

    if (type === "Reversal") {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account is required",
          path: ["accountId"],
        });
      }
      if (!data.originalTransactionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Original transaction ID is required",
          path: ["originalTransactionId"],
        });
      }
    }

    if (type === "Interest Charge") {
      if (!data.accountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Loan account is required",
          path: ["accountId"],
        });
      }
    }
  });

type TransactionFormInput = z.input<typeof transactionFormSchema>;
type TransactionFormValues = z.output<typeof transactionFormSchema>;

export function TransactionForm() {
  const { user } = useAuth();
  const { activeAccounts, assetAccounts, liabilityAccounts, investmentAccounts } = useAccounts();
  const { expenseCategories, incomeCategories } = useCategories();
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "Expense",
      transactionDate: new Date(),
      description: "",
      amount: 0,
      accountId: "",
      toAccountId: "",
      categoryId: "",
      originalTransactionId: "",
      notes: "",
      transactionCost: 0,
    },
  });

  const selectedType = form.watch("type");

  function getAccountOptions() {
    switch (selectedType) {
      case "Expense":
        return assetAccounts;
      case "Income":
        return assetAccounts;
      case "Transfer":
        return activeAccounts;
      case "Investment Contribution":
        return assetAccounts;
      case "Loan Repayment":
        return activeAccounts.filter(
          (a) => a.type === "Asset" || a.type === "Investment"
        );
      case "Reversal":
        return activeAccounts;
      case "Interest Charge":
        return liabilityAccounts;
      default:
        return activeAccounts;
    }
  }

  function getToAccountOptions() {
    switch (selectedType) {
      case "Transfer":
        return activeAccounts;
      case "Investment Contribution":
        return investmentAccounts;
      case "Loan Repayment":
        return liabilityAccounts;
      default:
        return [];
    }
  }

  function getCategoryOptions() {
    switch (selectedType) {
      case "Expense":
        return expenseCategories;
      case "Income":
        return incomeCategories;
      default:
        return [];
    }
  }

  function getAccountLabel() {
    switch (selectedType) {
      case "Transfer":
      case "Investment Contribution":
        return "From Account";
      case "Loan Repayment":
        return "Payment Account";
      case "Interest Charge":
        return "Loan Account";
      default:
        return "Account";
    }
  }

  function getToAccountLabel() {
    switch (selectedType) {
      case "Transfer":
        return "To Account";
      case "Investment Contribution":
        return "Investment Account";
      case "Loan Repayment":
        return "Loan Account";
      default:
        return "To Account";
    }
  }

  const showAccount =
    selectedType === "Expense" ||
    selectedType === "Income" ||
    selectedType === "Transfer" ||
    selectedType === "Investment Contribution" ||
    selectedType === "Loan Repayment" ||
    selectedType === "Reversal" ||
    selectedType === "Interest Charge";

  const showToAccount =
    selectedType === "Transfer" ||
    selectedType === "Investment Contribution" ||
    selectedType === "Loan Repayment";

  const showCategory = selectedType === "Expense" || selectedType === "Income";

  const showOriginalTransaction = selectedType === "Reversal";

  async function onSubmit(data: TransactionFormValues) {
    if (!user) return;

    try {
      const account = activeAccounts.find((a) => a.id === data.accountId);
      const toAccount = data.toAccountId
        ? activeAccounts.find((a) => a.id === data.toAccountId)
        : undefined;
      const allCategories = [...expenseCategories, ...incomeCategories];
      const category = data.categoryId
        ? allCategories.find((c) => c.id === data.categoryId)
        : undefined;

      await createTransaction(user.uid, {
        transactionDate: data.transactionDate,
        type: data.type,
        description: data.description,
        amount: data.amount,
        accountId: data.accountId || "",
        accountName: account?.name || "",
        toAccountId: data.toAccountId || undefined,
        toAccountName: toAccount?.name || undefined,
        categoryId: data.categoryId || undefined,
        categoryName: category?.name || undefined,
        notes: data.notes || undefined,
        originalTransactionId: data.originalTransactionId || undefined,
      });

      if (data.type === "Expense" && data.transactionCost && data.transactionCost > 0) {
        try {
          const tcCategory = expenseCategories.find((c) => c.name === "Transaction costs");
          if (tcCategory) {
            await createTransaction(user.uid, {
              transactionDate: data.transactionDate,
              type: "Expense",
              description: `Transaction cost: ${data.description}`,
              amount: data.transactionCost,
              accountId: data.accountId || "",
              accountName: account?.name || "",
              categoryId: tcCategory.id,
              categoryName: tcCategory.name,
            });
          }
        } catch (error) {
          toast.warning("Expense saved, but transaction cost entry failed — please add it manually");
        }
      }

      toast.success("Transaction created successfully");
      form.reset({
        type: data.type,
        transactionDate: new Date(),
        description: "",
        amount: 0,
        accountId: "",
        toAccountId: "",
        categoryId: "",
        originalTransactionId: "",
        notes: "",
        transactionCost: 0,
      });
    } catch (error) {
      toast.error("Failed to create transaction");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create Transaction</CardTitle>
        <CardDescription>
          Fill in the details below to record a new transaction.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      form.setValue("accountId", "");
                      form.setValue("toAccountId", "");
                      form.setValue("categoryId", "");
                      form.setValue("originalTransactionId", "");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transaction Date */}
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Transaction description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
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

            {/* Transaction Cost (Only for Expense) */}
            {selectedType === "Expense" && (
              <FormField
                control={form.control}
                name="transactionCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Cost (KES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0 — optional"
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
            )}

            {/* Account */}
            {showAccount && (
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getAccountLabel()}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={getAccountOptions().map((a) => ({ value: a.id, label: a.name }))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAccountOptions().map((account) => (
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
            )}

            {/* To Account */}
            {showToAccount && (
              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getToAccountLabel()}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={getToAccountOptions().map((a) => ({ value: a.id, label: a.name }))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getToAccountOptions().map((account) => (
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
            )}

            {/* Category */}
            {showCategory && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={getCategoryOptions().map((c) => ({ value: c.id, label: c.name }))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCategoryOptions().map((category) => (
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

            {/* Original Transaction ID */}
            {showOriginalTransaction && (
              <FormField
                control={form.control}
                name="originalTransactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Transaction ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. TX-000001"
                        {...field}
                      />
                    </FormControl>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Creating..."
                : "Create Transaction"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
