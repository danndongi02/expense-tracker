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
  writeBatch,
  db,
  QuerySnapshot,
} from "@/lib/firebase/firestore";
import { doc } from "firebase/firestore";
import { Budget } from "@/lib/types";

function mapDoc(d: any): Budget {
  return { id: d.id, ...d.data() } as Budget;
}

// Real-time subscription for all budgets in a given month
export function subscribeToMonthBudgets(
  userId: string,
  month: string,
  callback: (budgets: Budget[]) => void
): () => void {
  const q = query(
    getUserCollection(userId, "budgets"),
    where("month", "==", month),
    orderBy("categoryName", "asc")
  );
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

// One-time fetch for all budgets in a given month
export async function getBudgetsForMonth(userId: string, month: string): Promise<Budget[]> {
  const q = query(
    getUserCollection(userId, "budgets"),
    where("month", "==", month),
    orderBy("categoryName", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

// Create a new budget document
export async function createBudget(
  userId: string,
  data: Omit<Budget, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(getUserCollection(userId, "budgets"), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

// Update an existing budget
export async function updateBudget(
  userId: string,
  budgetId: string,
  updates: Partial<Pick<Budget, "budgetAmount" | "alertThreshold">>
): Promise<void> {
  await updateDoc(getUserDoc(userId, "budgets", budgetId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Delete a budget
export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  await deleteDoc(getUserDoc(userId, "budgets", budgetId));
}

// Copy all budgets from sourceMonth to targetMonth.
// Uses writeBatch. Skips categories that already have a budget in targetMonth.
export async function copyBudgetsFromMonth(
  userId: string,
  sourceMonth: string,
  targetMonth: string
): Promise<void> {
  const sourceBudgets = await getBudgetsForMonth(userId, sourceMonth);
  if (sourceBudgets.length === 0) return;

  const targetBudgets = await getBudgetsForMonth(userId, targetMonth);
  const existingCategoryIds = new Set(targetBudgets.map((b) => b.categoryId));

  const batch = writeBatch(db);
  const col = getUserCollection(userId, "budgets");
  const now = Timestamp.now();

  for (const budget of sourceBudgets) {
    if (existingCategoryIds.has(budget.categoryId)) continue;
    const { id, ...rest } = budget;
    const newDocRef = doc(col);
    batch.set(newDocRef, {
      ...rest,
      month: targetMonth,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
}
