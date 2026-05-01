import { z } from "zod";
import { ACCOUNT_SUBTYPES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["Asset", "Liability", "Investment"]),
  subtype: z.string().min(1, "Subtype is required"),
  openingBalance: z.number(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  
  isLoan: z.boolean().default(false).optional(),
  loanName: z.string().optional(),
  loanPrincipal: z.number().optional(),
  loanInterestRate: z.number().optional(),
  loanInterestFrequency: z.enum([
    "Monthly", "Yearly", "Daily", "None", "Bi-Monthly", "Quarterly", "Bi-Yearly"
  ]).optional(),
  loanStartDate: z.date().optional(),
  loanNotes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "Liability" && data.isLoan) {
    if (!data.loanName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Loan name is required", path: ["loanName"] });
    }
    if (data.loanPrincipal === undefined || data.loanPrincipal <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Principal must be positive", path: ["loanPrincipal"] });
    }
    if (data.loanInterestRate === undefined || data.loanInterestRate < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Interest rate cannot be negative", path: ["loanInterestRate"] });
    }
    if (!data.loanInterestFrequency) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Interest frequency is required", path: ["loanInterestFrequency"] });
    }
    if (!data.loanStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start date is required", path: ["loanStartDate"] });
    }
  }

  const validSubtypes = ACCOUNT_SUBTYPES[data.type];
  if (validSubtypes && !validSubtypes.includes(data.subtype)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a valid subtype for this account type",
      path: ["subtype"],
    });
  }
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  transactionType: z.enum(["Expense", "Income"]),
  description: z.string().default(""),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

const baseTransactionSchema = z.object({
  transactionDate: z.date(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

export const expenseSchema = baseTransactionSchema.extend({
  type: z.literal("Expense"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  transactionCost: z.number().min(0).optional().default(0),
});

export const incomeSchema = baseTransactionSchema.extend({
  type: z.literal("Income"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
});

export const transferSchema = baseTransactionSchema.extend({
  type: z.literal("Transfer"),
  accountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().min(1, "To account is required"),
}).refine((data) => data.accountId !== data.toAccountId, {
  message: "From and To accounts must be different",
  path: ["toAccountId"],
});

export const investmentContributionSchema = baseTransactionSchema.extend({
  type: z.literal("Investment Contribution"),
  accountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().min(1, "Investment account is required"),
}).refine((data) => data.accountId !== data.toAccountId, {
  message: "From and To accounts must be different",
  path: ["toAccountId"],
});

export const investmentWithdrawalSchema = baseTransactionSchema.extend({
  type: z.literal("Investment Withdrawal"),
  accountId: z.string().min(1, "Investment account is required"),
  toAccountId: z.string().min(1, "Destination account is required"),
}).refine((data) => data.accountId !== data.toAccountId, {
  message: "Investment and destination accounts must be different",
  path: ["toAccountId"],
});

export const interestEarnedSchema = baseTransactionSchema.extend({
  type: z.literal("Interest Earned"),
  accountId: z.string().min(1, "Account is required"),
});

export const dividendSchema = baseTransactionSchema.extend({
  type: z.literal("Dividend"),
  accountId: z.string().min(1, "Account is required"),
});

export const loanRepaymentSchema = baseTransactionSchema.extend({
  type: z.literal("Loan Repayment"),
  accountId: z.string().min(1, "Payment account is required"),
  toAccountId: z.string().min(1, "Loan account is required"),
});

export const reversalSchema = baseTransactionSchema.extend({
  type: z.literal("Reversal"),
  accountId: z.string().min(1, "Account is required"),
  originalTransactionId: z.string().min(1, "Original transaction is required"),
});

export const interestChargeSchema = baseTransactionSchema.extend({
  type: z.literal("Interest Charge"),
  accountId: z.string().min(1, "Loan account is required"),
});

export const transactionSchema = z.discriminatedUnion("type", [
  expenseSchema,
  incomeSchema,
  transferSchema,
  investmentContributionSchema,
  investmentWithdrawalSchema,
  interestEarnedSchema,
  dividendSchema,
  loanRepaymentSchema,
  reversalSchema,
  interestChargeSchema,
]);

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum(["Weekly", "Monthly", "Quarterly", "Yearly"]),
  billingDay: z.number().min(1).max(31),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["Active", "Paused", "Cancelled"]).default("Active"),
  notes: z.string().optional(),
});

export const loanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  linkedAccountId: z.string().min(1, "Linked account is required"),
  originalPrincipal: z.number().positive("Principal must be positive"),
  interestRate: z.number().min(0),
  interestFrequency: z.enum([
    "Monthly",
    "Yearly",
    "Daily",
    "None",
    "Bi-Monthly",
    "Quarterly",
    "Bi-Yearly"
  ]),
  startDate: z.date(),
  status: z.enum(["Active", "Paid Off"]).default("Active"),
  notes: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
export type LoanFormData = z.infer<typeof loanSchema>;

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  categoryName: z.string().min(1, "Category name is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Must be yyyy-MM format"),
  budgetAmount: z.number().positive("Budget amount must be greater than 0"),
  alertThreshold: z.number().min(0).max(100).default(75),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
