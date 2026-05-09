import {
  getUserCollection,
  getUserDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
} from "@/lib/firebase/firestore";
import { SavingsGoal } from "@/lib/types";

function mapDoc(d: any): SavingsGoal {
  return { id: d.id, ...d.data() } as SavingsGoal;
}

export function subscribeToSavingsGoals(
  userId: string,
  callback: (goals: SavingsGoal[]) => void
): () => void {
  const q = query(
    getUserCollection(userId, "savingsGoals"),
    orderBy("name", "asc")
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const q = query(
    getUserCollection(userId, "savingsGoals"),
    orderBy("name", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function createSavingsGoal(
  userId: string,
  data: Omit<SavingsGoal, "id" | "createdAt" | "updatedAt" | "currentAmount">
): Promise<string> {
  const docRef = await addDoc(getUserCollection(userId, "savingsGoals"), {
    ...data,
    currentAmount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(getUserDoc(userId, "savingsGoals", goalId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
  await deleteDoc(getUserDoc(userId, "savingsGoals", goalId));
}
