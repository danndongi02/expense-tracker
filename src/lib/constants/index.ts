import { TransactionType, AccountType, CategoryTransactionType } from "@/lib/types";

export const TRANSACTION_TYPES: TransactionType[] = [
  "Expense",
  "Income",
  "Transfer",
  "Investment Contribution",
  "Loan Repayment",
  "Reversal",
  "Interest Charge",
];

export const ACCOUNT_TYPES: AccountType[] = ["Asset", "Liability", "Investment"];

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  Expense: "destructive",
  Income: "default",
  Transfer: "secondary",
  "Investment Contribution": "outline",
  "Loan Repayment": "outline",
  Reversal: "secondary",
  "Interest Charge": "destructive",
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  Asset: "hsl(142, 76%, 36%)",
  Liability: "hsl(0, 84%, 60%)",
  Investment: "hsl(217, 91%, 60%)",
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Transport", description: "Fare, fuel" },
  { name: "Food & Dining", description: "Snacks, eating out, ordering, drinks, alcohol" },
  { name: "Savings & Investments", description: "All savings and investments" },
  { name: "Bills & Subscriptions", description: "Spotify, internet, minutes" },
  { name: "Loan repayment", description: "Loan repayment" },
  { name: "Family & Friends", description: "Sending to family or friends, gifting" },
  { name: "Shopping", description: "Buying of essentials and room shopping" },
  { name: "Personal development", description: "Books, scholarships, clothes, personal things" },
  { name: "Misc.", description: "Anything that doesn't fall in any of the categories" },
  { name: "Entertainment", description: "Going out, drinks & liquor, sherehe" },
  { name: "Transaction costs", description: "Transaction costs" },
  { name: "Church", description: "Anything to do with the church" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Intric Solves", description: "Main job" },
  { name: "Dev work", description: "Any other dev work like side projects" },
  { name: "Freelance", description: "Upwork" },
  { name: "Family & Friends", description: "Received from family and friends" },
  { name: "Other", description: "Any other unexpected income" },
];

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(142, 76%, 36%)",
  "hsl(262, 83%, 58%)",
  "hsl(24, 95%, 53%)",
  "hsl(43, 96%, 56%)",
  "hsl(187, 85%, 43%)",
  "hsl(330, 81%, 60%)",
  "hsl(200, 80%, 50%)",
];
