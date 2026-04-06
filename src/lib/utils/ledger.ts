import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase/firestore";
import { TransactionType, LedgerEntry } from "@/lib/types";

interface LedgerInput {
  transactionId: string;
  date: Timestamp;
  type: TransactionType;
  amount: number;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
}

export function createLedgerEntries(input: LedgerInput): Omit<LedgerEntry, "id">[] {
  const { transactionId, date, type, amount, accountId, accountName, toAccountId, toAccountName } = input;
  const now = Timestamp.now();

  const baseEntry = {
    transactionId,
    date,
    sourceType: type,
    createdAt: now,
  };

  switch (type) {
    case "Expense":
      return [
        { ...baseEntry, accountId, accountName, delta: -amount },
      ];

    case "Income":
      return [
        { ...baseEntry, accountId, accountName, delta: amount },
      ];

    case "Transfer":
      if (!toAccountId || !toAccountName) throw new Error("Transfer requires toAccount");
      return [
        { ...baseEntry, accountId, accountName, delta: -amount },
        { ...baseEntry, accountId: toAccountId, accountName: toAccountName, delta: amount },
      ];

    case "Investment Contribution":
      if (!toAccountId || !toAccountName) throw new Error("Investment Contribution requires toAccount");
      return [
        { ...baseEntry, accountId, accountName, delta: -amount },
        { ...baseEntry, accountId: toAccountId, accountName: toAccountName, delta: amount },
      ];

    case "Loan Repayment":
      if (!toAccountId || !toAccountName) throw new Error("Loan Repayment requires loan account");
      return [
        { ...baseEntry, accountId, accountName, delta: -amount },
        { ...baseEntry, accountId: toAccountId, accountName: toAccountName, delta: -amount },
      ];

    case "Interest Charge":
      return [
        { ...baseEntry, accountId, accountName, delta: amount },
      ];

    case "Reversal":
      // For reversals, the caller should pass the opposite delta direction
      // amount is positive, but we negate the original transaction's effect
      // If original was Expense (delta: -amount), reversal is (delta: +amount)
      // The caller determines the correct sign by looking at original transaction
      return [
        { ...baseEntry, accountId, accountName, delta: amount },
      ];

    default:
      throw new Error(`Unknown transaction type: ${type}`);
  }
}

export function generateEntryId(): string {
  return uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
}
