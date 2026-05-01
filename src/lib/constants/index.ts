import { TransactionType, AccountType, CategoryTransactionType, AssetSubtype, LiabilitySubtype, InvestmentSubtype } from "@/lib/types";

export const TRANSACTION_TYPES: TransactionType[] = [
  "Expense",
  "Income",
  "Transfer",
  "Investment Contribution",
  "Investment Withdrawal",
  "Interest Earned",
  "Dividend",
  "Loan Repayment",
  "Reversal",
  "Interest Charge",
];

export const ACCOUNT_TYPES: AccountType[] = ["Asset", "Liability", "Investment"];

export const ASSET_SUBTYPES: AssetSubtype[] = [
  "Checking Account",
  "Savings Account",
  "Cash",
  "M-Pesa",
  "Fixed Deposit",
  "Call Deposit",
  "Receivable",
  "Other",
];

export const LIABILITY_SUBTYPES: LiabilitySubtype[] = [
  "Personal Loan",
  "Salary Advance",
  "Credit Card",
  "Overdraft",
  "SACCO Loan",
  "Mortgage",
  "HELB Loan",
  "Other Loan",
];

export const INVESTMENT_SUBTYPES: InvestmentSubtype[] = [
  "SACCO Shares",
  "Money Market Fund",
  "Treasury Bills",
  "Treasury Bonds",
  "NSE Stocks",
  "Unit Trust",
  "Real Estate",
  "Crypto",
  "Other",
];

export const ACCOUNT_SUBTYPES: Record<AccountType, readonly string[]> = {
  Asset: ASSET_SUBTYPES,
  Liability: LIABILITY_SUBTYPES,
  Investment: INVESTMENT_SUBTYPES,
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  Expense: "destructive",
  Income: "default",
  Transfer: "secondary",
  "Investment Contribution": "outline",
  "Investment Withdrawal": "outline",
  "Interest Earned": "default",
  Dividend: "default",
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
  { name: "Transport", description: "Fare, fuel, matatu, Uber" },
  { name: "Food & Dining", description: "Snacks, eating out, ordering in, drinks" },
  { name: "Utilities", description: "Electricity, water, internet, gas" },
  { name: "Rent / Housing", description: "Rent, service charge, caretaker" },
  { name: "Healthcare", description: "Hospital, pharmacy, insurance premiums" },
  { name: "Education", description: "School fees, books, courses" },
  { name: "Personal Care", description: "Haircut, salon, toiletries" },
  { name: "Shopping / Clothing", description: "Clothes, shoes, household items" },
  { name: "Entertainment", description: "Going out, events, streaming, sherehe" },
  { name: "Family & Friends", description: "Sending to family or friends, gifting" },
  { name: "Church / Charity", description: "Tithe, offerings, donations" },
  { name: "Bills & Subscriptions", description: "Spotify, Netflix, recurring software" },
  { name: "Transaction costs", description: "M-Pesa charges, bank fees, transfer fees" },
  { name: "Miscellaneous", description: "Anything that doesn't fit another category" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary / Employment", description: "Monthly salary or wages" },
  { name: "Freelance Work", description: "Upwork, contract, one-off client projects" },
  { name: "Business Income", description: "Revenue from a business you run" },
  { name: "Investment Returns", description: "Dividends, interest, capital gains" },
  { name: "Family & Friends", description: "Money received from family or friends" },
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
