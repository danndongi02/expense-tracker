import { Transaction } from "@/lib/types";
import { formatMonthKey, formatWeekKey, formatDayKey } from "@/lib/utils/date";

export type TrendGranularity = "daily" | "weekly" | "monthly";

export interface CategoryBreakdown {
  category: string;
  amount: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export function computeSpendingByCategory(transactions: Transaction[]): CategoryBreakdown[] {
  const map = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "Expense" && tx.type !== "Loan Repayment") continue;
    const cat = tx.type === "Loan Repayment" ? "Loan Repayment" : (tx.categoryName || "Uncategorized");
    map.set(cat, (map.get(cat) || 0) + tx.amount);
  }

  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeIncomeByCategory(transactions: Transaction[]): CategoryBreakdown[] {
  const map = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === "Income") {
      const cat = tx.categoryName || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + tx.amount);
    } else if (tx.type === "Interest Earned") {
      const cat = tx.categoryName || "Interest Earned";
      map.set(cat, (map.get(cat) || 0) + tx.amount);
    } else if (tx.type === "Dividend") {
      const cat = tx.categoryName || "Dividend";
      map.set(cat, (map.get(cat) || 0) + tx.amount);
    }
  }

  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeIncomeVsExpenses(transactions: Transaction[]): {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.type === "Income" || tx.type === "Interest Earned" || tx.type === "Dividend") {
      totalIncome += tx.amount;
    } else if (tx.type === "Expense") {
      totalExpenses += tx.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
  };
}

export function computeMonthlyTrend(transactions: Transaction[]): MonthlyTrend[] {
  const map = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const monthKey = formatMonthKey(tx.transactionDate.toDate());
    const current = map.get(monthKey) || { income: 0, expenses: 0 };

    if (tx.type === "Income" || tx.type === "Interest Earned" || tx.type === "Dividend") current.income += tx.amount;
    else if (tx.type === "Expense") current.expenses += tx.amount;

    map.set(monthKey, current);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));
}

export interface TrendPoint {
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export function computeWeeklyTrend(transactions: Transaction[]): TrendPoint[] {
  const map = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const key = formatWeekKey(tx.transactionDate.toDate());
    const current = map.get(key) || { income: 0, expenses: 0 };
    if (tx.type === "Income" || tx.type === "Interest Earned" || tx.type === "Dividend") current.income += tx.amount;
    else if (tx.type === "Expense") current.expenses += tx.amount;
    map.set(key, current);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({
      label,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));
}

export function computeDailyTrend(transactions: Transaction[]): TrendPoint[] {
  const map = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const key = formatDayKey(tx.transactionDate.toDate());
    const current = map.get(key) || { income: 0, expenses: 0 };
    if (tx.type === "Income" || tx.type === "Interest Earned" || tx.type === "Dividend") current.income += tx.amount;
    else if (tx.type === "Expense") current.expenses += tx.amount;
    map.set(key, current);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({
      label,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));
}

export function computeTrend(
  transactions: Transaction[],
  granularity: TrendGranularity
): TrendPoint[] {
  switch (granularity) {
    case "daily":
      return computeDailyTrend(transactions);
    case "weekly":
      return computeWeeklyTrend(transactions);
    case "monthly":
    default:
      return computeMonthlyTrend(transactions).map((m) => ({
        label: m.month,
        income: m.income,
        expenses: m.expenses,
        net: m.net,
      }));
  }
}

export interface FinancialKPIs {
  savingsRate: number | null;
  expenseRatio: number | null;
  debtToIncome: number | null;
  totalIncome: number;
  totalExpenses: number;
  totalLoanRepayments: number;
}

export function computeFinancialKPIs(transactions: Transaction[]): FinancialKPIs {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalLoanRepayments = 0;

  for (const tx of transactions) {
    if (tx.type === "Income" || tx.type === "Interest Earned" || tx.type === "Dividend") {
      totalIncome += tx.amount;
    } else if (tx.type === "Expense") {
      totalExpenses += tx.amount;
    } else if (tx.type === "Loan Repayment") {
      totalLoanRepayments += tx.amount;
    }
  }

  return {
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null,
    expenseRatio: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : null,
    debtToIncome: totalIncome > 0 ? (totalLoanRepayments / totalIncome) * 100 : null,
    totalIncome,
    totalExpenses,
    totalLoanRepayments,
  };
}
