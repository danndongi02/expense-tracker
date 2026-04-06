import {
  getUserCollection,
  getUserDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  writeBatch,
  db,
  doc
} from "@/lib/firebase/firestore";
import { Account, AccountType, Loan } from "@/lib/types";

function mapDoc(doc: any): Account {
  return { id: doc.id, ...doc.data() } as Account;
}

export async function getAccounts(userId: string): Promise<Account[]> {
  const q = query(getUserCollection(userId, "accounts"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getAccountsByType(
  userId: string,
  type: AccountType
): Promise<Account[]> {
  const q = query(
    getUserCollection(userId, "accounts"),
    where("type", "==", type),
    where("status", "==", "Active"),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getActiveAccounts(userId: string): Promise<Account[]> {
  const q = query(
    getUserCollection(userId, "accounts"),
    where("status", "==", "Active"),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToAccounts(
  userId: string,
  callback: (accounts: Account[]) => void
) {
  const q = query(getUserCollection(userId, "accounts"), orderBy("name"));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function createAccount(
  userId: string,
  data: Omit<Account, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(getUserCollection(userId, "accounts"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateAccount(
  userId: string,
  accountId: string,
  data: Partial<Account>
): Promise<void> {
  await updateDoc(getUserDoc(userId, "accounts", accountId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteAccount(userId: string, accountId: string): Promise<void> {
  await deleteDoc(getUserDoc(userId, "accounts", accountId));
}

export async function createAccountWithLoan(
  userId: string,
  accountData: Omit<Account, "id" | "createdAt" | "updatedAt">,
  loanData: Omit<Loan, "id" | "createdAt" | "updatedAt" | "linkedAccountId" | "linkedAccountName" | "currentBalance" | "totalInterestPaid">
): Promise<string> {
  const batch = writeBatch(db);
  const now = Timestamp.now();

  const accountRef = doc(getUserCollection(userId, "accounts"));
  batch.set(accountRef, {
    ...accountData,
    createdAt: now,
    updatedAt: now,
  });

  const loanRef = doc(getUserCollection(userId, "loans"));
  batch.set(loanRef, {
    ...loanData,
    linkedAccountId: accountRef.id,
    linkedAccountName: accountData.name,
    currentBalance: loanData.originalPrincipal,
    totalInterestPaid: 0,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  return accountRef.id;
}
