"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { accountSchema, type AccountFormData } from "@/lib/utils/validators";
import { createAccount, updateAccount, createAccountWithLoan } from "@/lib/services/accounts.service";
import { useAuth } from "@/lib/context/auth-context";
import { Account } from "@/lib/types";

// z.input = form input type (status is optional due to .default())
// z.output = resolved type after defaults (status is always present)
type AccountFormInput = z.input<typeof accountSchema>;
type AccountFormValues = z.output<typeof accountSchema>;
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSuccess?: () => void;
  onDelete?: (account: Account) => void;
}

export function AccountForm({
  open,
  onOpenChange,
  account,
  onSuccess,
  onDelete,
}: AccountFormProps) {
  const { user } = useAuth();
  const isEditing = !!account;
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<AccountFormInput, unknown, AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          openingBalance: account.openingBalance,
          status: account.status,
        }
      : {
          name: "",
          type: "Asset",
          subtype: "",
          openingBalance: 0,
          status: "Active",
          isLoan: false,
          loanName: "",
          loanPrincipal: 0,
          loanInterestRate: 0,
          loanInterestFrequency: "Monthly",
          loanStartDate: new Date(),
        },
  });

  const selectedType = form.watch("type");
  const isLoan = form.watch("isLoan");
  const showLoanFields = !isEditing && selectedType === "Liability" && isLoan;
  const accountName = form.watch("name");
  const openingBalance = form.watch("openingBalance");

  useEffect(() => {
    if (showLoanFields) {
      form.setValue("loanName", accountName, { shouldValidate: false });
    }
  }, [accountName, showLoanFields]);

  useEffect(() => {
    if (showLoanFields) {
      form.setValue("loanPrincipal", openingBalance, { shouldValidate: false });
    }
  }, [openingBalance, showLoanFields]);

  async function onSubmit(data: AccountFormValues) {
    if (!user) return;

    try {
      const { 
        isLoan, loanName, loanPrincipal, loanInterestRate, 
        loanInterestFrequency, loanStartDate, loanNotes, 
        ...accountData 
      } = data;

      if (isEditing && account) {
        await updateAccount(user.uid, account.id, accountData);
        toast.success("Account updated successfully");
      } else {
        if (data.type === "Liability" && data.isLoan) {
          await createAccountWithLoan(user.uid, accountData, {
            name: loanName!,
            originalPrincipal: loanPrincipal!,
            interestRate: loanInterestRate!,
            interestFrequency: loanInterestFrequency as any,
            startDate: Timestamp.fromDate(loanStartDate!),
            status: "Active",
            notes: loanNotes,
          });
        } else {
          await createAccount(user.uid, accountData);
        }
        toast.success("Account created successfully");
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update account" : "Failed to create account"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Account" : "Add Account"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the account details below."
              : "Fill in the details to create a new account."}
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
                    <Input placeholder="Account name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Asset">Asset</SelectItem>
                      <SelectItem value="Liability">Liability</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtype</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mobile Money, Bank Account, MMF"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Balance</FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && selectedType === "Liability" && (
              <FormField
                control={form.control}
                name="isLoan"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        This is a loan
                      </FormLabel>
                      <DialogDescription>
                        Create a linked loan tracker for this liability.
                      </DialogDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {showLoanFields && (
              <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium text-sm text-muted-foreground mb-4">Loan Details</h4>
                <FormField
                  control={form.control}
                  name="loanName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Car Loan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loanPrincipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principal</FormLabel>
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
                    name="loanInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="loanInterestFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Freq.</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
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
                    name="loanStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col pt-2">
                        <FormLabel className="mb-2 max-lg:mb-[0.6rem]">Start Date</FormLabel>
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
                </div>

                <FormField
                  control={form.control}
                  name="loanNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              {isEditing && onDelete && account ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(account)}
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
                    ? "Update Account"
                    : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
