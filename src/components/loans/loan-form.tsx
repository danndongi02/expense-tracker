"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { loanSchema } from "@/lib/utils/validators";
import { createLoan, updateLoan } from "@/lib/services/loans.service";
import { useAuth } from "@/lib/context/auth-context";
import { Account, Loan } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

type LoanFormInput = z.input<typeof loanSchema>;
type LoanFormValues = z.output<typeof loanSchema>;

interface LoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan;
  onSuccess?: () => void;
  onDelete?: (loan: Loan) => void;
  accounts: Account[];
}

export function LoanForm({
  open,
  onOpenChange,
  loan,
  onSuccess,
  onDelete,
  accounts,
}: LoanFormProps) {
  const { user } = useAuth();
  const isEditing = !!loan;
  const [dateOpen, setDateOpen] = useState(false);

  const liabilityAccounts = accounts.filter(
    (a) => a.type === "Liability" && a.status === "Active"
  );

  const form = useForm<LoanFormInput, unknown, LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: loan
      ? {
          name: loan.name,
          linkedAccountId: loan.linkedAccountId,
          originalPrincipal: loan.originalPrincipal,
          interestRate: loan.interestRate,
          interestFrequency: loan.interestFrequency,
          startDate: loan.startDate.toDate(),
          status: loan.status,
          notes: loan.notes ?? "",
        }
      : {
          name: "",
          linkedAccountId: "",
          originalPrincipal: 0,
          interestRate: 0,
          interestFrequency: "Monthly",
          startDate: new Date(),
          status: "Active",
          notes: "",
        },
  });

  async function onSubmit(data: LoanFormValues) {
    if (!user) return;

    try {
      const account = accounts.find((a) => a.id === data.linkedAccountId);

      const payload = {
        name: data.name,
        linkedAccountId: data.linkedAccountId,
        linkedAccountName: account?.name ?? "",
        originalPrincipal: data.originalPrincipal,
        interestRate: data.interestRate,
        interestFrequency: data.interestFrequency,
        startDate: Timestamp.fromDate(data.startDate),
        status: data.status,
        notes: data.notes || undefined,
      };

      if (isEditing && loan) {
        await updateLoan(user.uid, loan.id, payload);
        toast.success("Loan updated successfully");
      } else {
        await createLoan(user.uid, payload);
        toast.success("Loan created successfully");
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update loan" : "Failed to create loan"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Loan" : "Add Loan"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the loan details below."
              : "Fill in the details to create a new loan."}
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
                    <Input placeholder="Loan name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Account</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={liabilityAccounts.map((a) => ({ value: a.id, label: a.name }))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select liability account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {liabilityAccounts.map((account) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalPrincipal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Principal</FormLabel>
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
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate %</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="interestFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Bi-Monthly">Bi-Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Bi-Yearly">Bi-Yearly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                      <SelectItem value="Paid Off">Paid Off</SelectItem>
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
              {isEditing && onDelete && loan ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(loan)}
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
                    ? "Update Loan"
                    : "Create Loan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
