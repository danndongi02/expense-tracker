# Expense Tracker — Developer Reference

> **Type:** Reference  
> **Audience:** Developer (yourself)  
> **Purpose:** A complete technical snapshot of the application as of April 2026 — architecture, schema, services, hooks, components, and implementation status.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Application Architecture](#3-application-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Routing & Page Inventory](#5-routing--page-inventory)
6. [Firestore Data Schema](#6-firestore-data-schema)
7. [Security Rules & Indexes](#7-security-rules--indexes)
8. [Type System](#8-type-system)
9. [Constants](#9-constants)
10. [Services Layer](#10-services-layer)
11. [Utility Functions](#11-utility-functions)
12. [Custom Hooks](#12-custom-hooks)
13. [React Context Providers](#13-react-context-providers)
14. [Component Inventory](#14-component-inventory)
15. [Cloud Functions](#15-cloud-functions)
16. [Environment & Configuration](#16-environment--configuration)
17. [Implementation Status](#17-implementation-status)

---

## 1. Project Overview

A personal finance dashboard replacing a Google Sheets workflow. The app tracks income and expenses, manages multiple bank/investment/liability accounts, monitors loans and recurring subscriptions, and provides analytics charts and a net worth tracker.

**Firebase project ID:** `extended-spark-490207-s2`  
**Currency:** KES (Kenyan Shilling) — hard-coded throughout.  
**Default income sources pre-seeded:** Intric Solves, Dev work, Freelance, Family & Friends, Other.

---

## 2. Technology Stack

| Dependency | Version | Role |
|---|---|---|
| Next.js | 16.2.1 | App framework (App Router) |
| React | 19.2.4 | UI runtime |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling |
| shadcn/ui | ^4.1.0 | Component library |
| Firebase | ^12.11.0 | Auth + Firestore backend |
| Recharts | ^2.15.4 | Data visualisation charts |
| React Hook Form | ^7.71.2 | Form state management |
| Zod | ^4.3.6 | Form schema validation |
| date-fns | ^4.1.0 | Date arithmetic and formatting |
| sonner | ^2.0.7 | Toast notifications |
| lucide-react | ^0.577.0 | Icon set |
| next-themes | ^0.4.6 | Light/dark mode |
| uuid | ^13.0.0 | Ledger entry ID generation |
| cmdk | ^1.1.1 | Command palette (used by shadcn Command component) |
| react-day-picker | ^9.14.0 | Calendar date picker |
| @base-ui/react | ^1.3.0 | Accessible base primitives |
| class-variance-authority | ^0.7.1 | Variant-based CSS classes |

> **Note:** This is Next.js 16 with React 19. APIs, conventions, and App Router behaviour differ significantly from Next.js 13–14. Always read `node_modules/next/dist/docs/` for anything Next.js-specific before coding.

---

## 3. Application Architecture

### Data flow

```
Firestore (cloud)
    │
    ▼  onSnapshot (real-time) or one-off getDocs
Services layer  (src/lib/services/*.service.ts)
    │
    ▼  called by
Custom hooks    (src/lib/hooks/use-*.ts)
    │
    ▼  provide state to
React components / pages
```

### Key architectural patterns

**Double-entry bookkeeping.** Every transaction that affects a balance also writes one or more `LedgerEntry` documents. Account balances are never stored directly — they are always computed as `openingBalance + SUM(ledgerDelta)`. This means the ledger is the source of truth for balances.

**Atomic batch writes.** Operations that must be consistent (transaction + ledger entries, account + loan) use Firestore `writeBatch`. The transaction counter uses `runTransaction` for atomic increment.

**Sequence-numbered transactions.** A Firestore counter document at `users/{uid}/counters/transactions` tracks `lastSequence`. Each new transaction atomically increments it and gets a formatted ID like `TX-000001`.

**Real-time subscriptions.** The hooks layer uses `onSnapshot` for live updates. Accounts, ledger entries, transactions, loans, subscriptions, and net worth snapshots all update in real time without page refreshes.

**Period filter context.** Dashboard analytics are scoped to a date range held in `PeriodFilterContext`. All analytic hooks/components read from this context so they all stay in sync when the period changes.

**Zod discriminated union for transactions.** The transaction form uses a `z.discriminatedUnion("type", [...])` schema, so validation rules change per transaction type without needing conditional form logic outside of the schema.

---

## 4. Directory Structure

```
expense-tracker/
├── src/
│   ├── app/
│   │   ├── (auth)/                     # Route group — no dashboard layout
│   │   │   ├── layout.tsx              # Redirects authenticated users to /
│   │   │   ├── login/page.tsx          # Sign-in page
│   │   │   └── register/page.tsx       # Sign-up page
│   │   ├── (dashboard)/                # Route group — uses dashboard layout
│   │   │   ├── layout.tsx              # Sidebar + header wrapper, PeriodFilterProvider
│   │   │   ├── page.tsx                # / — main dashboard
│   │   │   ├── accounts/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   ├── loans/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx            # Transaction list
│   │   │   │   └── new/page.tsx        # New transaction form
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── layout.tsx                  # Root layout — AuthProvider, ThemeProvider, Toaster
│   │   ├── globals.css                 # Tailwind base + CSS custom properties
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ui/                         # 27 shadcn/ui primitive components
│   │   ├── shared/                     # App-wide layout components
│   │   ├── accounts/                   # Account domain components
│   │   ├── categories/                 # Category domain components
│   │   ├── dashboard/                  # Dashboard card widgets
│   │   ├── loans/                      # Loan domain components
│   │   ├── subscriptions/              # Subscription domain components
│   │   └── transactions/               # Transaction domain components
│   ├── hooks/
│   │   └── use-mobile.ts               # Detects mobile viewport (shadcn sidebar util)
│   └── lib/
│       ├── firebase/
│       │   ├── config.ts               # Firebase app initialisation, exports auth + db
│       │   ├── auth.ts                 # signUp, signIn, signOut
│       │   └── firestore.ts            # Re-exports Firestore helpers + collection helpers
│       ├── context/
│       │   ├── auth-context.tsx        # AuthProvider, useAuth()
│       │   └── period-filter-context.tsx  # PeriodFilterProvider, usePeriodFilter()
│       ├── hooks/                      # Data-fetching hooks (call services)
│       ├── services/                   # Firestore read/write operations
│       ├── types/
│       │   └── index.ts                # All TypeScript types and interfaces
│       ├── constants/
│       │   └── index.ts                # Enums, colors, default category lists
│       ├── utils/
│       │   ├── currency.ts
│       │   ├── date.ts
│       │   ├── ledger.ts               # createLedgerEntries(), generateEntryId()
│       │   ├── loan-projection.ts      # estimateNextInterestDate()
│       │   ├── transaction-id.ts       # formatTransactionId()
│       │   └── validators.ts           # All Zod schemas
│       └── utils.ts                    # shadcn cn() helper
├── functions/
│   ├── src/index.ts                    # Cloud Functions entry point (empty template)
│   ├── package.json
│   └── tsconfig.json
├── .firebaserc                         # Firebase project binding
├── firebase.json                       # Firestore rules + indexes config paths
├── firestore.rules
├── firestore.indexes.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config (via postcss.config.mjs)
├── components.json                     # shadcn/ui config
├── .env.local                          # Firebase secrets (not committed)
└── .env.local.example
```

---

## 5. Routing & Page Inventory

| Route | File | Description | Key data dependencies |
|---|---|---|---|
| `/login` | `(auth)/login/page.tsx` | Email/password sign-in | Firebase Auth |
| `/register` | `(auth)/register/page.tsx` | Account creation | Firebase Auth, seedDefaultCategories, initializeTransactionCounter |
| `/` | `(dashboard)/page.tsx` | Main dashboard — 8 widget cards | useTransactions, useBalances, useLoans, useAnalytics, usePeriodFilter |
| `/transactions` | `(dashboard)/transactions/page.tsx` | Paginated transaction table with delete/reverse actions | useTransactions |
| `/transactions/new` | `(dashboard)/transactions/new/page.tsx` | New transaction form | useAccounts, useCategories, createTransaction |
| `/accounts` | `(dashboard)/accounts/page.tsx` | Account cards grouped by type | useAccounts, useBalances |
| `/categories` | `(dashboard)/categories/page.tsx` | Expense + income category lists | useCategories |
| `/loans` | `(dashboard)/loans/page.tsx` | Loan cards | useLoans |
| `/subscriptions` | `(dashboard)/subscriptions/page.tsx` | Subscription table + upcoming payments | useSubscriptions |
| `/reports` | `(dashboard)/reports/page.tsx` | 4 analytics charts | useNetWorth, useTransactions, useAnalytics |
| `/settings` | `(dashboard)/settings/page.tsx` | Profile info, net worth snapshot trigger | useAuth, takeNetWorthSnapshot |

### Layout hierarchy

```
RootLayout (AuthProvider, ThemeProvider, Toaster)
└── (auth)/layout.tsx  — redirects logged-in users
└── (dashboard)/layout.tsx  — AppSidebar + Header + PeriodFilterProvider
    └── page content
```

---

## 6. Firestore Data Schema

All user data lives under the path prefix `/users/{userId}/`. The root `users/{userId}` document is the user profile.

### `/users/{userId}` — UserProfile

| Field | Type | Notes |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `email` | string | |
| `displayName` | string | Set on register |
| `currency` | `"KES"` | Hard-coded |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

---

### `/users/{userId}/accounts/{accountId}` — Account

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `name` | string | e.g. "KCB Current" |
| `type` | `"Asset" \| "Liability" \| "Investment"` | |
| `subtype` | string | e.g. "Checking", "Credit Card", "Portfolio" |
| `openingBalance` | number | KES. Balance at account creation. |
| `status` | `"Active" \| "Inactive"` | Only Active accounts count toward net worth |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

---

### `/users/{userId}/categories/{categoryId}` — Category

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `name` | string | |
| `transactionType` | `"Expense" \| "Income"` | Controls which form fields show it |
| `status` | `"Active" \| "Inactive"` | |
| `description` | string | |
| `createdAt` | Timestamp | |

---

### `/users/{userId}/transactions/{transactionId}` — Transaction

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `transactionId` | string | Formatted sequence: `TX-000001` |
| `sequenceNumber` | number | Raw integer from counter |
| `timestamp` | Timestamp | Write time (server time) |
| `transactionDate` | Timestamp | User-entered date |
| `type` | TransactionType | See §8 for all values |
| `description` | string | |
| `amount` | number | Always positive |
| `accountId` | string | Primary account |
| `accountName` | string | Denormalised for display |
| `toAccountId` | string? | Destination account (Transfer, Investment Contribution, Loan Repayment) |
| `toAccountName` | string? | Denormalised |
| `categoryId` | string? | Only on Expense and Income |
| `categoryName` | string? | Denormalised |
| `notes` | string? | Optional free-text |
| `originalTransactionId` | string? | Set on Reversal type |
| `processed` | boolean | Always `true` — reserved for future use |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

---

### `/users/{userId}/ledgerEntries/{entryId}` — LedgerEntry

| Field | Type | Notes |
|---|---|---|
| `id` | string | Short UUID (8 chars, uppercase) |
| `transactionId` | string | Links back to the transaction (`TX-000001` format) |
| `date` | Timestamp | Same as `transactionDate` of the parent transaction |
| `accountId` | string | Account this entry affects |
| `accountName` | string | Denormalised |
| `delta` | number | Signed amount. Negative = debit (money leaves account). Positive = credit. |
| `sourceType` | TransactionType | The transaction type that generated this entry |
| `createdAt` | Timestamp | |

**Delta rules by transaction type:**

| Transaction Type | Entries Generated |
|---|---|
| Expense | 1 entry: `accountId`, delta = `-amount` |
| Income | 1 entry: `accountId`, delta = `+amount` |
| Transfer | 2 entries: `accountId` delta = `-amount`, `toAccountId` delta = `+amount` |
| Investment Contribution | 2 entries: `accountId` delta = `-amount`, `toAccountId` delta = `+amount` |
| Loan Repayment | 2 entries: `accountId` delta = `-amount`, `toAccountId` delta = `-amount` (reduces liability) |
| Interest Charge | 1 entry: `accountId` delta = `+amount` (increases liability) |
| Reversal | Opposite deltas of the original transaction |

---

### `/users/{userId}/subscriptions/{subscriptionId}` — Subscription

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `name` | string | e.g. "Spotify" |
| `amount` | number | KES |
| `frequency` | `"Weekly" \| "Monthly" \| "Quarterly" \| "Yearly"` | |
| `billingDay` | number | Day of month (1–31) |
| `nextDueDate` | Timestamp | Manually managed — not auto-incremented |
| `accountId` | string | Account to be charged |
| `accountName` | string | Denormalised |
| `categoryId` | string | |
| `categoryName` | string | Denormalised |
| `status` | `"Active" \| "Paused" \| "Cancelled"` | |
| `notes` | string? | |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

> **Known gap:** `nextDueDate` is never auto-updated. After a billing cycle passes, you must manually update it. There is no Cloud Function automating this yet.

---

### `/users/{userId}/loans/{loanId}` — Loan

| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `name` | string | e.g. "KCB Salary Advance" |
| `linkedAccountId` | string | The Liability account this loan belongs to |
| `linkedAccountName` | string | Denormalised |
| `originalPrincipal` | number | KES — amount at origination |
| `interestRate` | number | Percentage per `interestFrequency` period |
| `interestFrequency` | InterestFrequency | See §8 |
| `startDate` | Timestamp | |
| `currentBalance` | number | Decremented by repayments, incremented by interest charges |
| `totalInterestPaid` | number | Running total of all Interest Charge amounts |
| `status` | `"Active" \| "Paid Off"` | Auto-set to "Paid Off" when `currentBalance <= 0` |
| `notes` | string? | |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

---

### `/users/{userId}/netWorthSnapshots/{snapshotId}` — NetWorthSnapshot

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as `snapshotMonth` |
| `snapshotMonth` | string | `"yyyy-MM"` format, e.g. `"2026-04"` |
| `assetsTotal` | number | Sum of all active Asset account balances |
| `investmentsTotal` | number | Sum of all active Investment account balances |
| `liabilitiesTotal` | number | Sum of all active Liability account balances |
| `netWorth` | number | `assetsTotal + investmentsTotal - liabilitiesTotal` |
| `createdAt` | Timestamp | |

> The document ID is the `snapshotMonth` key, so taking a snapshot for the same month overwrites the previous one. This is intentional.

---

### `/users/{userId}/counters/transactions` — TransactionCounter

| Field | Type | Notes |
|---|---|---|
| `lastSequence` | number | Incremented atomically on each new transaction |

---

## 7. Security Rules & Indexes

### Security rules (`firestore.rules`)

Simple owner-only access. All collections are protected by:

```
function isOwner(userId) {
  return request.auth != null && request.auth.uid == userId;
}
```

Every subcollection under `/users/{userId}/` grants `read, write` only to the owner. There are no public collections and no cross-user queries.

### Composite indexes (`firestore.indexes.json`)

| Collection | Fields | Purpose |
|---|---|---|
| `transactions` | `type ASC`, `transactionDate DESC` | Filter by type, sorted by date |
| `transactions` | `accountId ASC`, `transactionDate DESC` | Filter by account, sorted by date |
| `transactions` | `toAccountId ASC`, `transactionDate DESC` | Filter by destination account |
| `transactions` | `categoryId ASC`, `transactionDate DESC` | Filter by category |
| `ledgerEntries` | `accountId ASC`, `date DESC` | Get ledger history for an account |

---

## 8. Type System

All types are in [src/lib/types/index.ts](src/lib/types/index.ts).

### Union types

```typescript
AccountType       = "Asset" | "Liability" | "Investment"
AccountStatus     = "Active" | "Inactive"

TransactionType   = "Expense" | "Income" | "Transfer"
                  | "Investment Contribution" | "Loan Repayment"
                  | "Reversal" | "Interest Charge"

CategoryTransactionType = "Expense" | "Income"
CategoryStatus          = "Active" | "Inactive"

SubscriptionFrequency = "Weekly" | "Monthly" | "Quarterly" | "Yearly"
SubscriptionStatus    = "Active" | "Paused" | "Cancelled"

LoanStatus        = "Active" | "Paid Off"
InterestFrequency = "Daily" | "Monthly" | "Bi-Monthly" | "Quarterly"
                  | "Bi-Yearly" | "Yearly" | "None"
```

### Interfaces

| Interface | Purpose |
|---|---|
| `UserProfile` | Root user document shape |
| `Account` | Bank/investment/liability account |
| `Category` | Expense or income category |
| `Transaction` | Financial transaction record |
| `LedgerEntry` | Individual debit/credit entry |
| `Subscription` | Recurring billing entry |
| `Loan` | Debt record with interest tracking |
| `NetWorthSnapshot` | Monthly financial snapshot |
| `TransactionCounter` | Counter doc shape (`{ lastSequence: number }`) |
| `AccountBalance` | Computed type: account + `ledgerDelta` + `currentBalance` + `balanceCheck` |

---

## 9. Constants

All constants are in [src/lib/constants/index.ts](src/lib/constants/index.ts).

| Export | Type | Value |
|---|---|---|
| `TRANSACTION_TYPES` | `TransactionType[]` | All 7 transaction types |
| `ACCOUNT_TYPES` | `AccountType[]` | `["Asset", "Liability", "Investment"]` |
| `TRANSACTION_TYPE_COLORS` | `Record<TransactionType, string>` | shadcn Badge variant per type (e.g. Expense → "destructive") |
| `ACCOUNT_TYPE_COLORS` | `Record<AccountType, string>` | HSL strings for chart/UI colouring |
| `DEFAULT_EXPENSE_CATEGORIES` | `{ name, description }[]` | 12 categories seeded on signup |
| `DEFAULT_INCOME_CATEGORIES` | `{ name, description }[]` | 5 categories seeded on signup |
| `CHART_COLORS` | `string[]` | 12 HSL colour strings used in Recharts pie/bar charts |

**Default expense categories:** Transport, Food & Dining, Savings & Investments, Bills & Subscriptions, Loan repayment, Family & Friends, Shopping, Personal development, Misc., Entertainment, Transaction costs, Church.

**Default income categories:** Intric Solves, Dev work, Freelance, Family & Friends, Other.

---

## 10. Services Layer

Services are pure async functions that talk to Firestore. They never hold state. All take `userId: string` as the first argument.

### `accounts.service.ts`

| Function | Description |
|---|---|
| `getAccounts(userId)` | All accounts, ordered by name |
| `getAccountsByType(userId, type)` | Active accounts of a specific type |
| `getActiveAccounts(userId)` | All Active accounts |
| `subscribeToAccounts(userId, callback)` | Real-time listener; returns unsubscribe fn |
| `createAccount(userId, data)` | Creates account; returns Firestore doc ID |
| `updateAccount(userId, accountId, data)` | Partial update; auto-sets `updatedAt` |
| `deleteAccount(userId, accountId)` | Hard delete |
| `createAccountWithLoan(userId, accountData, loanData)` | Atomic batch: creates account + linked loan simultaneously |

---

### `categories.service.ts`

| Function | Description |
|---|---|
| `getCategories(userId)` | All categories |
| `getCategoriesByType(userId, type)` | Filter by `"Expense"` or `"Income"` |
| `subscribeToCategoreis(userId, callback)` | Real-time listener (note: typo in function name — `subscribeToCategoreis`) |
| `createCategory(userId, data)` | Returns doc ID |
| `updateCategory(userId, categoryId, data)` | Partial update |
| `deleteCategory(userId, categoryId)` | Hard delete |
| `seedDefaultCategories(userId)` | Called on signup; batch-creates 17 default categories |

---

### `transactions.service.ts`

| Function | Description |
|---|---|
| `initializeTransactionCounter(userId)` | Called on signup; sets `lastSequence: 0` |
| `createTransaction(userId, input)` | Atomically: increments counter, creates TX doc, creates ledger entries. Then (outside batch) updates linked loan if type is Loan Repayment or Interest Charge. Returns `transactionId` (e.g. `"TX-000001"`) |
| `getTransactions(userId, options?)` | Paginated query with optional filters: `type`, `accountId`, `categoryId`, `startDate`, `endDate`, `limitCount`, `lastDoc`. Returns `{ transactions, lastDoc }` |
| `getRecentTransactions(userId, count)` | Shortcut: last N transactions by date |
| `subscribeToTransactions(userId, callback, limitCount)` | Real-time listener for latest N transactions (default 50) |
| `deleteTransaction(userId, transactionDocId, transactionId)` | Batch-deletes transaction + all associated ledger entries |
| `getTransactionByTxId(userId, transactionId)` | Lookup by formatted ID (e.g. `"TX-000042"`) |
| `reverseTransaction(userId, original)` | Creates a Reversal transaction with negated ledger entries. Does NOT delete original. |
| `getAccountTransactions(userId, accountId)` | All transactions where `accountId` OR `toAccountId` matches. Deduplicates and sorts by date. |
| `getLoanTransactions(userId, linkedAccountId)` | All Loan Repayment and Interest Charge transactions for a linked account |

**Important implementation detail in `createTransaction`:** the loan balance update happens *after* the batch commit, not inside it. This means if the loan update fails, the transaction and ledger entries will exist without the loan balance being updated.

---

### `ledger.service.ts`

| Function | Description |
|---|---|
| `getLedgerEntries(userId)` | All ledger entries |
| `getLedgerEntriesByAccount(userId, accountId)` | Entries for one account |
| `getLedgerEntriesForPeriod(userId, start, end)` | Date-range filter |
| `subscribeToLedgerEntries(userId, callback)` | Real-time listener — used by `useBalances` |

---

### `loans.service.ts`

| Function | Description |
|---|---|
| `getLoans(userId)` | All loans, ordered by name |
| `getActiveLoans(userId)` | Only `status == "Active"` |
| `subscribeToLoans(userId, callback)` | Real-time listener |
| `createLoan(userId, data)` | Sets `currentBalance = originalPrincipal`, `totalInterestPaid = 0` |
| `updateLoan(userId, loanId, data)` | Partial update |
| `deleteLoan(userId, loanId)` | Hard delete |
| `recordLoanRepayment(userId, loanId, amount)` | Decrements `currentBalance`; sets status to "Paid Off" if `<= 0` |
| `recordInterestCharge(userId, loanId, amount)` | Increments `currentBalance` and `totalInterestPaid` |

---

### `subscriptions.service.ts`

| Function | Description |
|---|---|
| `getSubscriptions(userId)` | All subscriptions |
| `getActiveSubscriptions(userId)` | Status == "Active", ordered by `nextDueDate` |
| `subscribeToSubscriptions(userId, callback)` | Real-time listener |
| `createSubscription(userId, data)` | Returns doc ID |
| `updateSubscription(userId, subId, data)` | Partial update |
| `deleteSubscription(userId, subId)` | Hard delete |
| `computeSubscriptionSummary(subscriptions)` | Pure function (no Firestore). Returns: `activeCount`, `monthlyCost` (normalised from all frequencies), `yearlyCost`, `dueIn7Days[]`, `dueIn30Days[]`. Weekly uses multiplier 4.33. |

---

### `balances.service.ts`

| Function | Description |
|---|---|
| `getAccountBalances(userId)` | One-shot: fetches accounts + ledger entries, then calls `computeBalances` |
| `computeBalances(accounts, ledgerEntries)` | Pure function. Builds a delta map from ledger entries, returns `AccountBalance[]` with `currentBalance = openingBalance + ledgerDelta` |
| `computeNetWorth(balances)` | Pure function. Sums by account type (skips Inactive). Returns `{ assetsTotal, investmentsTotal, liabilitiesTotal, netWorth }`. Formula: `netWorth = assets + investments - liabilities` |

---

### `net-worth.service.ts`

| Function | Description |
|---|---|
| `getNetWorthSnapshots(userId)` | All snapshots, ordered by `snapshotMonth` |
| `subscribeToNetWorthSnapshots(userId, callback)` | Real-time listener |
| `takeNetWorthSnapshot(userId)` | Computes current net worth (via `getAccountBalances` + `computeNetWorth`), writes to `netWorthSnapshots/{yyyy-MM}`. Overwrites existing snapshot for the month. |

---

### `analytics.service.ts`

All functions are pure (take a `Transaction[]` array, return computed data).

| Function | Returns | Notes |
|---|---|---|
| `computeSpendingByCategory(transactions)` | `CategoryBreakdown[]` | Includes Expense and Loan Repayment types. Sorted descending by amount. |
| `computeIncomeByCategory(transactions)` | `CategoryBreakdown[]` | Income type only. Sorted descending. |
| `computeIncomeVsExpenses(transactions)` | `{ totalIncome, totalExpenses, netCashFlow }` | Only counts Income and Expense types. |
| `computeMonthlyTrend(transactions)` | `MonthlyTrend[]` | Grouped by `yyyy-MM`. Income and Expense only. |
| `computeWeeklyTrend(transactions)` | `TrendPoint[]` | Grouped by week start (Monday). |
| `computeDailyTrend(transactions)` | `TrendPoint[]` | Grouped by `yyyy-MM-dd`. |
| `computeTrend(transactions, granularity)` | `TrendPoint[]` | Dispatcher for the three granularities. |

---

## 11. Utility Functions

### `lib/utils/currency.ts`

| Function | Signature | Output example |
|---|---|---|
| `formatCurrency(amount)` | `(number) => string` | `"KES 12,500.00"` |
| `formatCurrencyShort(amount)` | `(number) => string` | `"KES 12.5K"` or `"KES 1.2M"` |

Locale: uses `en-KE` with `KES` currency code.

---

### `lib/utils/date.ts`

| Function | Output example | Notes |
|---|---|---|
| `formatDate(date)` | `"Apr 6, 2026"` | |
| `formatDateShort(date)` | `"Apr 6"` | |
| `formatMonthYear(date)` | `"Apr 2026"` | |
| `formatMonthKey(date)` | `"2026-04"` | Used as Firestore keys and chart labels |
| `formatWeekKey(date)` | `"2026-03-30"` | ISO date of Monday that week starts on |
| `formatDayKey(date)` | `"2026-04-06"` | |
| `getCurrentMonthRange()` | `{ start: Date, end: Date }` | From month start to now |
| `getMonthRange(date)` | `{ start, end }` | Full calendar month |
| `getLastNMonths(n)` | `{ start, end }` | From start of N-1 months ago to now |
| `isInDateRange(date, start, end)` | `boolean` | Wrapper around date-fns `isWithinInterval` |

Also re-exports: `parseISO`, `format`, `startOfMonth`, `endOfMonth`, `startOfWeek`, `subMonths` from date-fns.

---

### `lib/utils/ledger.ts`

**`createLedgerEntries(input): Omit<LedgerEntry, "id">[]`**

Generates the correct ledger entries for each transaction type. See the delta rules table in §6. Throws if a required `toAccountId` is missing (Transfer, Investment Contribution, Loan Repayment).

**`generateEntryId(): string`**

Returns an 8-character uppercase alphanumeric string (truncated UUID, no dashes).

---

### `lib/utils/loan-projection.ts`

**`estimateNextInterestDate(startDate, frequency): Date | null`**

Walks forward from `startDate` by the frequency interval until it finds a future date. Returns `null` if frequency is `"None"`. Used in the Loan Detail Sheet to show when the next interest charge is expected.

---

### `lib/utils/transaction-id.ts`

**`formatTransactionId(sequence): string`**

Pads the integer to 6 digits: `formatTransactionId(42)` → `"TX-000042"`.

---

### `lib/utils/validators.ts`

All Zod schemas and their inferred TypeScript types:

| Schema | Exported type | Description |
|---|---|---|
| `loginSchema` | `LoginFormData` | `email`, `password` |
| `registerSchema` | `RegisterFormData` | `displayName`, `email`, `password`, `confirmPassword` (with match refinement) |
| `accountSchema` | `AccountFormData` | All account fields + optional loan sub-form (validated via `superRefine` only when `type === "Liability" && isLoan === true`) |
| `categorySchema` | `CategoryFormData` | `name`, `transactionType`, `description`, `status` |
| `transactionSchema` | `TransactionFormData` | Discriminated union of 7 sub-schemas (one per transaction type) |
| `subscriptionSchema` | `SubscriptionFormData` | All subscription fields |
| `loanSchema` | `LoanFormData` | All loan fields |

**Transaction sub-schemas:**

| Sub-schema | Required fields beyond base |
|---|---|
| `expenseSchema` | `accountId`, `categoryId`, optional `transactionCost` |
| `incomeSchema` | `accountId`, `categoryId` |
| `transferSchema` | `accountId`, `toAccountId` (must differ from `accountId`) |
| `investmentContributionSchema` | `accountId`, `toAccountId` |
| `loanRepaymentSchema` | `accountId` (payment source), `toAccountId` (loan account) |
| `reversalSchema` | `accountId`, `originalTransactionId` |
| `interestChargeSchema` | `accountId` (the loan/liability account) |

Base fields on all transaction schemas: `transactionDate`, `description`, `amount` (positive), `notes?`.

---

## 12. Custom Hooks

All hooks in `src/lib/hooks/`. All require `AuthProvider` in the tree and call `useAuth()` internally.

### `use-accounts.ts` — `useAccounts()`

Subscribes to `accounts` collection via `subscribeToAccounts`.

**Returns:**
```typescript
{
  accounts: Account[]           // all accounts
  activeAccounts: Account[]     // status === "Active"
  assetAccounts: Account[]      // type === "Asset", active
  liabilityAccounts: Account[]  // type === "Liability", active
  investmentAccounts: Account[] // type === "Investment", active
  loading: boolean
}
```

---

### `use-transactions.ts` — `useTransactions(limit?)`

Subscribes to latest N transactions (default 50).

**Returns:** `{ transactions: Transaction[], loading: boolean }`

---

### `use-categories.ts` — `useCategories()`

**Returns:**
```typescript
{
  categories: Category[]
  activeCategories: Category[]
  expenseCategories: Category[]   // active + transactionType === "Expense"
  incomeCategories: Category[]    // active + transactionType === "Income"
  loading: boolean
}
```

---

### `use-balances.ts` — `useBalances()`

Opens **two** simultaneous `onSnapshot` listeners — one for accounts, one for ledger entries. Only sets `loading = false` once both have emitted at least once.

**Returns:**
```typescript
{
  balances: AccountBalance[]
  assetsTotal: number
  investmentsTotal: number
  liabilitiesTotal: number
  netWorth: number
  loading: boolean
}
```

---

### `use-loans.ts` — `useLoans()`

**Returns:**
```typescript
{
  loans: Loan[]
  activeLoans: Loan[]
  totalDebt: number   // sum of currentBalance across all active loans
  loading: boolean
}
```

---

### `use-subscriptions.ts` — `useSubscriptions()`

**Returns:**
```typescript
{
  subscriptions: Subscription[]
  summary: {
    activeCount: number
    monthlyCost: number
    yearlyCost: number
    dueIn7Days: Subscription[]
    dueIn30Days: Subscription[]
  }
  loading: boolean
}
```

---

### `use-analytics.ts` — `useAnalytics(transactions)`

Takes a `Transaction[]` array. Reads date range from `usePeriodFilter()`. Filters transactions to the period internally before computing analytics. `monthlyTrend` and `trendData` use the full unfiltered `transactions` array.

**Returns:**
```typescript
{
  filteredTransactions: Transaction[]
  spendingByCategory: CategoryBreakdown[]
  incomeByCategory: CategoryBreakdown[]
  incomeVsExpenses: { totalIncome, totalExpenses, netCashFlow }
  monthlyTrend: MonthlyTrend[]
  trendData: TrendPoint[]
  trendGranularity: TrendGranularity
  setTrendGranularity: (g: TrendGranularity) => void
}
```

---

### `use-net-worth.ts` — `useNetWorth()`

**Returns:** `{ snapshots: NetWorthSnapshot[], loading: boolean }`

---

## 13. React Context Providers

### `AuthContext` — `src/lib/context/auth-context.tsx`

Wraps the entire app (`app/layout.tsx`). Listens to `onAuthStateChanged`.

```typescript
useAuth() => { user: User | null, loading: boolean }
```

`User` is the Firebase Auth `User` object. `loading` is `true` until the first auth state event fires (prevents flash of unauthenticated UI).

---

### `PeriodFilterContext` — `src/lib/context/period-filter-context.tsx`

Wraps the dashboard layout only (`(dashboard)/layout.tsx`). Controls the date range used by all analytics.

```typescript
usePeriodFilter() => {
  startDate: Date
  endDate: Date
  preset: PeriodPreset
  setPreset: (preset: PeriodPreset) => void
  setCustomRange: (start: Date, end: Date) => void
}
```

**Available presets:**

| Preset | Range |
|---|---|
| `"current-month"` | Start of current month → now |
| `"last-month"` | Full previous calendar month |
| `"last-3-months"` | Start of 2 months ago → now |
| `"last-6-months"` | Start of 5 months ago → now |
| `"custom"` | User-defined via `setCustomRange` |

Default: `"current-month"`.

---

## 14. Component Inventory

### Shared — `src/components/shared/`

| Component | File | Description |
|---|---|---|
| `AppSidebar` | `app-sidebar.tsx` | Navigation sidebar. 8 links: Dashboard, Transactions, Accounts, Categories, Loans, Subscriptions, Reports, Settings. Footer has user profile + sign-out dropdown. |
| `Header` | `header.tsx` | Top bar. Shows breadcrumb, light/dark theme toggle, user avatar + dropdown. |
| `ConfirmActionDialog` | `confirm-action-dialog.tsx` | Reusable modal. Props: `open`, `onConfirm`, `onCancel`, `title`, `description`. Used for delete confirmations. |

---

### Accounts — `src/components/accounts/`

| Component | Description |
|---|---|
| `AccountCard` | Displays account name, current balance (KES), account type with colour indicator, status badge. |
| `AccountDetailSheet` | Right-side Sheet panel. Shows account metadata and all transactions for the account (calls `getAccountTransactions`). |
| `AccountForm` | Create/edit form. When `type === "Liability"` and user checks "Link to Loan", expands to show loan sub-fields. On submit calls `createAccountWithLoan` or `createAccount`/`updateAccount`. |

---

### Categories — `src/components/categories/`

| Component | Description |
|---|---|
| `CategoryForm` | Create/edit. Fields: name, type (Expense/Income), description, status. |
| `CategoryList` | Renders a list of categories with name, status badge, description. Edit and detail buttons per row. |
| `CategoryDetailSheet` | Shows category name, type, description, status. |

---

### Loans — `src/components/loans/`

| Component | Description |
|---|---|
| `LoanCard` | Shows loan name, linked account, principal, current balance, interest rate + frequency, status badge. |
| `LoanDetailSheet` | Full loan details. Shows repayment history (calls `getLoanTransactions`), next interest date (via `estimateNextInterestDate`), total interest paid. |
| `LoanForm` | Create/edit. Fields: name, linked account (Liability accounts only), principal, interest rate, frequency, start date, notes. |

---

### Subscriptions — `src/components/subscriptions/`

| Component | Description |
|---|---|
| `SubscriptionForm` | Create/edit. Fields: name, amount, frequency, billing day, account, category, status, notes. |
| `SubscriptionDetailSheet` | Shows all subscription fields including next due date. |
| `UpcomingPayments` | Two sections: "Due in 7 days" and "Due in 30 days". Reads from `useSubscriptions().summary`. |

---

### Transactions — `src/components/transactions/`

| Component | Description |
|---|---|
| `TransactionForm` | The main form at `/transactions/new`. A `<Select>` for type drives which fields appear. Uses the `transactionSchema` discriminated union for validation. |
| `TransactionTable` | Table of transactions. Columns: date, TX ID, type badge, description, amount, account(s), category, actions. Delete and Reverse buttons per row. |
| `ReversalConfirmDialog` | Confirmation dialog before calling `reverseTransaction`. Shows the original transaction details. |

---

### Dashboard — `src/components/dashboard/`

| Component | Key data source | Description |
|---|---|---|
| `NetWorthCard` | `useBalances()` | Shows total assets, investments, liabilities, net worth in KES. Has loading skeleton. |
| `IncomeVsExpensesCard` | `useAnalytics(transactions)` | Bar or summary showing `totalIncome`, `totalExpenses`, `netCashFlow`. |
| `AccountBalancesCard` | `useBalances()` | Lists current balance per account, grouped by type. |
| `SpendingByCategoryCard` | `useAnalytics(transactions)` | Pie/donut chart of expense categories. Uses `CHART_COLORS`. |
| `IncomeByCategoryCard` | `useAnalytics(transactions)` | Pie/donut chart of income categories. |
| `MonthlyTrendChart` | `useAnalytics(transactions)` | Line or bar chart. Has granularity selector (Daily / Weekly / Monthly). |
| `RecentTransactionsCard` | `useTransactions()` + `usePeriodFilter()` | Last 10 transactions within the selected period. |
| `LoanSummaryCard` | `useLoans()` | Lists active loans: name, original principal, current balance, interest rate. Shows `totalDebt`. |
| `PeriodSelector` | `usePeriodFilter()` | Dropdown for preset periods + custom date range picker. Placed in the dashboard header area. |

---

### UI Primitives — `src/components/ui/`

27 shadcn/ui components: `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `chart`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `form`, `input`, `input-group`, `label`, `popover`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`.

The `chart` component is a Recharts wrapper that handles theming and colour resolution from CSS variables.

---

## 15. Cloud Functions

**File:** `functions/src/index.ts`

Currently an empty template. The functions directory is fully configured for deployment (Node.js 18, TypeScript, `firebase.json` wired up) but no functions are implemented.

**Intended future use:**
- Automated monthly subscription `nextDueDate` advancement
- Scheduled interest accrual on loans
- Monthly net worth snapshot automation

---

## 16. Environment & Configuration

### `.env.local` keys

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

All prefixed with `NEXT_PUBLIC_` so they are available in client-side code. See `.env.local.example` for the full list.

### `next.config.ts`

Standard Next.js config. No custom rewrites, redirects, or webpack modifications at this stage.

### `tsconfig.json`

Standard Next.js TypeScript config with `@/*` path alias pointing to `src/*`.

### `components.json` (shadcn)

Configures shadcn CLI: style = "default", Tailwind CSS, component path `@/components/ui`, utils at `@/lib/utils`.

### Firebase project

- **Project ID:** `extended-spark-490207-s2`
- **Firebase rules file:** `firestore.rules`
- **Firebase indexes file:** `firestore.indexes.json`
- **Functions runtime:** Node.js 18

---

## 17. Implementation Status

### Fully implemented

- Firebase Auth (sign up, sign in, sign out)
- User profile creation + default category seeding on signup
- Transaction counter initialisation on signup
- All 7 transaction types with correct ledger entry generation
- Transaction reversal (creates a counterpart transaction, does not delete original)
- Account CRUD (Asset, Liability, Investment)
- Atomic account + loan creation
- Category CRUD
- Loan CRUD with repayment and interest charge tracking
- Subscription CRUD with monthly cost normalisation
- Real-time balance computation from ledger (double-entry)
- Net worth computation and manual monthly snapshots
- All analytics functions (spending by category, income by category, income vs expenses, monthly/weekly/daily trend)
- Full dashboard with 8 widgets
- Transaction table with delete and reverse actions
- Reports page with 4 Recharts visualisations
- Period filter context across the entire dashboard
- Responsive sidebar (collapses on mobile)
- Light/dark theme toggle

### Scaffolded but not implemented

- **Cloud Functions** — directory and config exist but `functions/src/index.ts` is empty
- **Subscription `nextDueDate` auto-advancement** — date must be updated manually after each billing cycle
- **Automated interest accrual** — no scheduled function; interest must be recorded manually via the Interest Charge transaction type
- **Automated monthly net worth snapshots** — the button on Settings triggers a manual snapshot; no Cloud Function automates this

### Known issues / gaps

- `subscribeToCategoreis` in `categories.service.ts` has a typo in the function name (extra `e`).
- Loan balance update in `createTransaction` runs outside the batch write. If it fails, the transaction exists but the loan balance is not updated.
- `nextDueDate` on subscriptions is static — no logic to advance it after a billing period passes.
- The `reverseTransaction` function does not update loan balances (i.e., reversing a Loan Repayment does not re-increment the loan's `currentBalance`).
- The `Reports` page uses `useNetWorth` for the net worth over time chart, but if no snapshots have been taken, the chart is empty with a graceful empty state.
