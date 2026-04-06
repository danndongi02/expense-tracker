import {
  getUserCollection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
} from "@/lib/firebase/firestore";
import { LedgerEntry } from "@/lib/types";

function mapDoc(doc: any): LedgerEntry {
  return { id: doc.id, ...doc.data() } as LedgerEntry;
}

export async function getLedgerEntries(userId: string): Promise<LedgerEntry[]> {
  const q = query(getUserCollection(userId, "ledgerEntries"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getLedgerEntriesByAccount(
  userId: string,
  accountId: string
): Promise<LedgerEntry[]> {
  const q = query(
    getUserCollection(userId, "ledgerEntries"),
    where("accountId", "==", accountId),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getLedgerEntriesForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<LedgerEntry[]> {
  const q = query(
    getUserCollection(userId, "ledgerEntries"),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate)),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToLedgerEntries(
  userId: string,
  callback: (entries: LedgerEntry[]) => void
) {
  const q = query(getUserCollection(userId, "ledgerEntries"), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}
