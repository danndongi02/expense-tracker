import { Timestamp } from "firebase/firestore";

export type AccountType = "Asset" | "Liability" | "Investment";
export type AccountStatus = "Active" | "Inactive";

export type TransactionType =
  | "Expense"
  | "Income"
  | "Transfer"
  | "Investment Contribution"
  | "Investment Withdrawal"
  | "Interest Earned"
  | "Dividend"
  | "Loan Repayment"
  | "Reversal"
  | "Interest Charge";

export type CategoryTransactionType = "Expense" | "Income";
export type CategoryStatus = "Active" | "Inactive";

export type SubscriptionFrequency = "Weekly" | "Monthly" | "Quarterly" | "Yearly";
export type SubscriptionStatus = "Active" | "Paused" | "Cancelled";

export type LoanStatus = "Active" | "Paid Off";
export type InterestFrequency =
  | "Monthly"
  | "Yearly"
  | "Daily"
  | "None"
  | "Bi-Monthly"
  | "Quarterly"
  | "Bi-Yearly";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  currency: "KES";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  subtype: string;
  openingBalance: number;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  transactionType: CategoryTransactionType;
  status: CategoryStatus;
  description: string;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  transactionId: string;
  sequenceNumber: number;
  timestamp: Timestamp;
  transactionDate: Timestamp;
  type: TransactionType;
  description: string;
  amount: number;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  categoryId?: string;
  categoryName?: string;
  notes?: string;
  originalTransactionId?: string;
  processed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  date: Timestamp;
  accountId: string;
  accountName: string;
  delta: number;
  sourceType: TransactionType;
  createdAt: Timestamp;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  billingDay: number;
  nextDueDate: Timestamp;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  status: SubscriptionStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Loan {
  id: string;
  name: string;
  linkedAccountId: string;
  linkedAccountName: string;
  originalPrincipal: number;
  interestRate: number;
  interestFrequency: InterestFrequency;
  startDate: Timestamp;
  currentBalance: number;
  totalInterestPaid: number;
  status: LoanStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NetWorthSnapshot {
  id: string;
  snapshotMonth: string;
  assetsTotal: number;
  investmentsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  createdAt: Timestamp;
}

export interface TransactionCounter {
  lastSequence: number;
}

export interface AccountBalance {
  account: Account;
  ledgerDelta: number;
  currentBalance: number;
  balanceCheck: "OK" | "Error";
}
