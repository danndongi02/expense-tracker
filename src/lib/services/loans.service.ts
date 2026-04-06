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
} from "@/lib/firebase/firestore";
import { Loan } from "@/lib/types";

function mapDoc(doc: any): Loan {
  return { id: doc.id, ...doc.data() } as Loan;
}

export async function getLoans(userId: string): Promise<Loan[]> {
  const q = query(getUserCollection(userId, "loans"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getActiveLoans(userId: string): Promise<Loan[]> {
  const q = query(
    getUserCollection(userId, "loans"),
    where("status", "==", "Active"),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToLoans(
  userId: string,
  callback: (loans: Loan[]) => void
) {
  const q = query(getUserCollection(userId, "loans"), orderBy("name"));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function createLoan(
  userId: string,
  data: Omit<Loan, "id" | "createdAt" | "updatedAt" | "currentBalance" | "totalInterestPaid">
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(getUserCollection(userId, "loans"), {
    ...data,
    currentBalance: data.originalPrincipal,
    totalInterestPaid: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateLoan(
  userId: string,
  loanId: string,
  data: Partial<Loan>
): Promise<void> {
  await updateDoc(getUserDoc(userId, "loans", loanId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteLoan(userId: string, loanId: string): Promise<void> {
  await deleteDoc(getUserDoc(userId, "loans", loanId));
}

export async function recordLoanRepayment(
  userId: string,
  loanId: string,
  amount: number
): Promise<void> {
  const loanRef = getUserDoc(userId, "loans", loanId);
  const loanDoc = await getDocs(query(getUserCollection(userId, "loans"), where("__name__", "==", loanId)));
  if (loanDoc.empty) return;

  const loan = loanDoc.docs[0].data() as Loan;
  const newBalance = loan.currentBalance - amount;

  await updateDoc(loanRef, {
    currentBalance: newBalance,
    status: newBalance <= 0 ? "Paid Off" : "Active",
    updatedAt: Timestamp.now(),
  });
}

export async function recordInterestCharge(
  userId: string,
  loanId: string,
  amount: number
): Promise<void> {
  const loanRef = getUserDoc(userId, "loans", loanId);
  const loanDoc = await getDocs(query(getUserCollection(userId, "loans"), where("__name__", "==", loanId)));
  if (loanDoc.empty) return;

  const loan = loanDoc.docs[0].data() as Loan;

  await updateDoc(loanRef, {
    currentBalance: loan.currentBalance + amount,
    totalInterestPaid: loan.totalInterestPaid + amount,
    updatedAt: Timestamp.now(),
  });
}
