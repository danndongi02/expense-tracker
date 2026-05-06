"use client";

import { useTransactions } from "@/lib/hooks/use-transactions";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { useBalances } from "@/lib/hooks/use-balances";
import { useLoans } from "@/lib/hooks/use-loans";
import { useBudgets } from "@/lib/hooks/use-budgets";
import { usePeriodFilter } from "@/lib/context/period-filter-context";
import { format } from "date-fns";

import { PeriodSelector } from "@/components/dashboard/period-selector";
import { NetWorthCard } from "@/components/dashboard/net-worth-card";
import { IncomeVsExpensesCard } from "@/components/dashboard/income-vs-expenses-card";
import { AccountBalancesCard } from "@/components/dashboard/account-balances-card";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { SpendingByCategoryCard } from "@/components/dashboard/spending-by-category-card";
import { IncomeByCategoryCard } from "@/components/dashboard/income-by-category-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { LoanSummaryCard } from "@/components/dashboard/loan-summary-card";
import { FinancialKpiCard } from "@/components/dashboard/financial-kpi-card";
import { BudgetOverviewCard } from "@/components/budgets/budget-overview-card";
import { SavingsGoalOverviewCard } from "@/components/dashboard/savings-goal-overview-card";

export default function DashboardPage() {
  const { transactions, loading: txLoading } = useTransactions(200);
  const {
    spendingByCategory,
    incomeByCategory,
    incomeVsExpenses,
    monthlyTrend,
    trendData,
    trendGranularity,
    setTrendGranularity,
    filteredTransactions,
    financialKPIs,
  } = useAnalytics(transactions);
  const {
    balances,
    assetsTotal,
    investmentsTotal,
    liabilitiesTotal,
    netWorth,
    loading: balancesLoading,
  } = useBalances();
  const { loans, loading: loansLoading } = useLoans();
  const { preset } = usePeriodFilter();
  const currentMonth = format(new Date(), "yyyy-MM");
  const { budgets: currentMonthBudgets } = useBudgets(currentMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <PeriodSelector />
      </div>

      {/* Financial Health KPIs */}
      <FinancialKpiCard kpis={financialKPIs} loading={txLoading} />

      {/* Row 1: Net Worth + Income vs Expenses */}
      <div className="grid gap-4 md:grid-cols-2">
        <NetWorthCard
          assetsTotal={assetsTotal}
          investmentsTotal={investmentsTotal}
          liabilitiesTotal={liabilitiesTotal}
          netWorth={netWorth}
          loading={balancesLoading}
        />
        <IncomeVsExpensesCard
          totalIncome={incomeVsExpenses.totalIncome}
          totalExpenses={incomeVsExpenses.totalExpenses}
          netCashFlow={incomeVsExpenses.netCashFlow}
          loading={txLoading}
        />
      </div>

      {/* Row 2: Trend Chart */}
      <MonthlyTrendChart
        data={trendData}
        loading={txLoading}
        granularity={trendGranularity}
        onGranularityChange={setTrendGranularity}
      />

      {/* Row 3: Spending by Category + Income by Category */}
      <div className="grid gap-4 md:grid-cols-2">
        <SpendingByCategoryCard
          data={spendingByCategory}
          loading={txLoading}
          budgets={preset === "current-month" ? currentMonthBudgets : []}
        />
        <IncomeByCategoryCard data={incomeByCategory} loading={txLoading} />
      </div>

      {/* Budget Overview */}
      <BudgetOverviewCard transactions={transactions} loading={txLoading} />

      {/* Savings Goals Overview */}
      <SavingsGoalOverviewCard balances={balances} loading={balancesLoading} />

      {/* Row 4: Account Balances + Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2">
        <AccountBalancesCard balances={balances} loading={balancesLoading} />
        <RecentTransactionsCard
          transactions={filteredTransactions}
          loading={txLoading}
        />
      </div>

      {/* Row 5: Loan Summary */}
      <LoanSummaryCard loans={loans} loading={loansLoading} />
    </div>
  );
}
