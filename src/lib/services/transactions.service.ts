import {
  getUserCollection,
  getUserDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  writeBatch,
  db,
  QuerySnapshot,
} from "@/lib/firebase/firestore";
import { doc, runTransaction } from "firebase/firestore";
import { Transaction, LedgerEntry, TransactionType, Loan } from "@/lib/types";
import { createLedgerEntries, generateEntryId } from "@/lib/utils/ledger";
import { formatTransactionId } from "@/lib/utils/transaction-id";

function mapDoc(d: any): Transaction {
  return { id: d.id, ...d.data() } as Transaction;
}

export async function initializeTransactionCounter(userId: string): Promise<void> {
  await setDoc(getUserDoc(userId, "counters", "transactions"), {
    lastSequence: 0,
  });
}

async function getNextSequence(userId: string): Promise<number> {
  const counterRef = doc(db, "users", userId, "counters", "transactions");
  let newSequence = 0;

  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const current = counterDoc.exists() ? counterDoc.data()!.lastSequence : 0;
    newSequence = current + 1;
    if (counterDoc.exists()) {
      transaction.update(counterRef, { lastSequence: newSequence });
    } else {
      transaction.set(counterRef, { lastSequence: newSequence });
    }
  });

  return newSequence;
}

async function findLoanByLinkedAccount(userId: string, accountId: string): Promise<Loan | null> {
  const q = query(
    getUserCollection(userId, "loans"),
    where("linkedAccountId", "==", accountId),
    where("status", "==", "Active"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Loan;
}

export interface CreateTransactionInput {
  transactionDate: Date;
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
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<string> {
  const sequence = await getNextSequence(userId);
  const txId = formatTransactionId(sequence);
  const now = Timestamp.now();
  const txDate = Timestamp.fromDate(input.transactionDate);

  const batch = writeBatch(db);

  // Create transaction document
  const txRef = doc(getUserCollection(userId, "transactions"));
  const txData: Omit<Transaction, "id"> = {
    transactionId: txId,
    sequenceNumber: sequence,
    timestamp: now,
    transactionDate: txDate,
    type: input.type,
    description: input.description,
    amount: input.amount,
    accountId: input.accountId,
    accountName: input.accountName,
    processed: true,
    createdAt: now,
    updatedAt: now,
    ...(input.toAccountId !== undefined && { toAccountId: input.toAccountId }),
    ...(input.toAccountName !== undefined && { toAccountName: input.toAccountName }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.categoryName !== undefined && { categoryName: input.categoryName }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.originalTransactionId !== undefined && { originalTransactionId: input.originalTransactionId }),
  };
  batch.set(txRef, txData);

  // Create ledger entries
  const entries = createLedgerEntries({
    transactionId: txId,
    date: txDate,
    type: input.type,
    amount: input.amount,
    accountId: input.accountId,
    accountName: input.accountName,
    toAccountId: input.toAccountId,
    toAccountName: input.toAccountName,
  });

  for (const entry of entries) {
    const entryRef = doc(getUserCollection(userId, "ledgerEntries"));
    batch.set(entryRef, {
      ...entry,
      id: generateEntryId(),
    });
  }

  // Fix #1: Loan balance update is now inside the same writeBatch for atomicity.
  if (input.type === "Loan Repayment" && input.toAccountId) {
    const loan = await findLoanByLinkedAccount(userId, input.toAccountId);
    if (loan) {
      const loanRef = getUserDoc(userId, "loans", loan.id);
      const newBalance = loan.currentBalance - input.amount;
      batch.update(loanRef, {
        currentBalance: newBalance,
        status: newBalance <= 0 ? "Paid Off" : "Active",
        updatedAt: now,
      });
    }
  } else if (input.type === "Interest Charge" && input.accountId) {
    const loan = await findLoanByLinkedAccount(userId, input.accountId);
    if (loan) {
      const loanRef = getUserDoc(userId, "loans", loan.id);
      batch.update(loanRef, {
        currentBalance: loan.currentBalance + input.amount,
        totalInterestPaid: loan.totalInterestPaid + input.amount,
        updatedAt: now,
      });
    }
  }

  await batch.commit();

  return txId;
}

export async function getTransactions(
  userId: string,
  options?: {
    type?: TransactionType;
    accountId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
    lastDoc?: any;
  }
): Promise<{ transactions: Transaction[]; lastDoc: any }> {
  const constraints: any[] = [orderBy("transactionDate", "desc")];

  if (options?.type) {
    constraints.unshift(where("type", "==", options.type));
  }
  if (options?.accountId) {
    constraints.unshift(where("accountId", "==", options.accountId));
  }
  if (options?.categoryId) {
    constraints.unshift(where("categoryId", "==", options.categoryId));
  }
  if (options?.startDate) {
    constraints.push(where("transactionDate", ">=", Timestamp.fromDate(options.startDate)));
  }
  if (options?.endDate) {
    constraints.push(where("transactionDate", "<=", Timestamp.fromDate(options.endDate)));
  }
  if (options?.lastDoc) {
    constraints.push(startAfter(options.lastDoc));
  }
  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = query(getUserCollection(userId, "transactions"), ...constraints);
  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map(mapDoc);
  const last = snapshot.docs[snapshot.docs.length - 1] || null;

  return { transactions, lastDoc: last };
}

export async function getRecentTransactions(
  userId: string,
  count: number = 10
): Promise<Transaction[]> {
  const q = query(
    getUserCollection(userId, "transactions"),
    orderBy("transactionDate", "desc"),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void,
  limitCount: number = 50
) {
  const q = query(
    getUserCollection(userId, "transactions"),
    orderBy("transactionDate", "desc"),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function deleteTransaction(
  userId: string,
  transactionDocId: string,
  transactionId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Delete the transaction
  batch.delete(getUserDoc(userId, "transactions", transactionDocId));

  // Delete associated ledger entries
  const ledgerQuery = query(
    getUserCollection(userId, "ledgerEntries"),
    where("transactionId", "==", transactionId)
  );
  const ledgerSnapshot = await getDocs(ledgerQuery);
  ledgerSnapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();
}

export async function getTransactionByTxId(
  userId: string,
  transactionId: string
): Promise<Transaction | null> {
  const q = query(
    getUserCollection(userId, "transactions"),
    where("transactionId", "==", transactionId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDoc(snapshot.docs[0]);
}

export async function reverseTransaction(
  userId: string,
  original: Transaction
): Promise<string> {
  const sequence = await getNextSequence(userId);
  const txId = formatTransactionId(sequence);
  const now = Timestamp.now();

  const batch = writeBatch(db);

  // Reversal transaction document
  const txRef = doc(getUserCollection(userId, "transactions"));
  batch.set(txRef, {
    transactionId: txId,
    sequenceNumber: sequence,
    timestamp: now,
    transactionDate: now,
    type: "Reversal" as const,
    description: `Reversal of ${original.transactionId}: ${original.description}`,
    amount: original.amount,
    accountId: original.accountId,
    accountName: original.accountName,
    ...(original.toAccountId && { toAccountId: original.toAccountId }),
    ...(original.toAccountName && { toAccountName: original.toAccountName }),
    originalTransactionId: original.transactionId,
    processed: true,
    createdAt: now,
    updatedAt: now,
  });

  // Negated ledger entries (computed directly, not via createLedgerEntries)
  const entries = computeReversalEntries(original, txId, now);
  for (const entry of entries) {
    const entryRef = doc(getUserCollection(userId, "ledgerEntries"));
    batch.set(entryRef, { ...entry, id: generateEntryId() });
  }

  // Fix #2: Apply inverse loan adjustment inside the same batch.
  if (original.type === "Loan Repayment" && original.toAccountId) {
    // Reversing a repayment: add the amount back to the loan balance.
    const loan = await findLoanByLinkedAccount(userId, original.toAccountId);
    if (loan) {
      const loanRef = getUserDoc(userId, "loans", loan.id);
      const restoredBalance = loan.currentBalance + original.amount;
      batch.update(loanRef, {
        currentBalance: restoredBalance,
        status: "Active",
        updatedAt: now,
      });
    }
  } else if (original.type === "Interest Charge" && original.accountId) {
    // Reversing an interest charge: subtract the amount from balance and totalInterestPaid.
    const loan = await findLoanByLinkedAccount(userId, original.accountId);
    if (loan) {
      const loanRef = getUserDoc(userId, "loans", loan.id);
      batch.update(loanRef, {
        currentBalance: loan.currentBalance - original.amount,
        totalInterestPaid: Math.max(0, loan.totalInterestPaid - original.amount),
        updatedAt: now,
      });
    }
  }

  await batch.commit();
  return txId;
}

function computeReversalEntries(
  original: Transaction,
  txId: string,
  date: Timestamp
): Omit<LedgerEntry, "id">[] {
  const base = {
    transactionId: txId,
    date,
    sourceType: "Reversal" as TransactionType,
    createdAt: date,
  };

  switch (original.type) {
    case "Expense":
      return [{ ...base, accountId: original.accountId, accountName: original.accountName, delta: original.amount }];
    case "Income":
    case "Interest Earned":
    case "Dividend":
      return [{ ...base, accountId: original.accountId, accountName: original.accountName, delta: -original.amount }];
    case "Transfer":
    case "Investment Contribution":
    case "Investment Withdrawal":
      return [
        { ...base, accountId: original.accountId, accountName: original.accountName, delta: original.amount },
        { ...base, accountId: original.toAccountId!, accountName: original.toAccountName!, delta: -original.amount },
      ];
    case "Loan Repayment":
      return [
        { ...base, accountId: original.accountId, accountName: original.accountName, delta: original.amount },
        { ...base, accountId: original.toAccountId!, accountName: original.toAccountName!, delta: original.amount },
      ];
    case "Interest Charge":
      return [{ ...base, accountId: original.accountId, accountName: original.accountName, delta: -original.amount }];
    default:
      return [];
  }
}

export async function getAccountTransactions(
  userId: string,
  accountId: string
): Promise<Transaction[]> {
  // Two queries: transactions where this is the primary account, and where it's the destination
  const [fromSnap, toSnap] = await Promise.all([
    getDocs(query(
      getUserCollection(userId, "transactions"),
      where("accountId", "==", accountId),
      orderBy("transactionDate", "desc")
    )),
    getDocs(query(
      getUserCollection(userId, "transactions"),
      where("toAccountId", "==", accountId),
      orderBy("transactionDate", "desc")
    )),
  ]);

  const seen = new Set<string>();
  const all: Transaction[] = [];
  for (const doc of [...fromSnap.docs, ...toSnap.docs]) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      all.push(mapDoc(doc));
    }
  }
  return all.sort((a, b) =>
    b.transactionDate.toMillis() - a.transactionDate.toMillis()
  );
}

export async function getLoanTransactions(
  userId: string,
  linkedAccountId: string
): Promise<Transaction[]> {
  const q = query(
    getUserCollection(userId, "transactions"),
    where("type", "in", ["Loan Repayment", "Interest Charge"]),
    orderBy("transactionDate", "desc")
  );

  const snapshot = await getDocs(q);
  // Manual filter for accountId or toAccountId matching linkedAccountId
  // Since Firestore doesn't support (accountId == X OR toAccountId == X) with "in" query easily
  return snapshot.docs
    .map(mapDoc)
    .filter(
      (tx) =>
        tx.accountId === linkedAccountId || tx.toAccountId === linkedAccountId
    );
}
