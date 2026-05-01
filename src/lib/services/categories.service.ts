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
import { Category, CategoryTransactionType } from "@/lib/types";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";

function mapDoc(doc: any): Category {
  return { id: doc.id, ...doc.data() } as Category;
}

export async function getCategories(userId: string): Promise<Category[]> {
  const q = query(getUserCollection(userId, "categories"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getCategoriesByType(
  userId: string,
  type: CategoryTransactionType
): Promise<Category[]> {
  const q = query(
    getUserCollection(userId, "categories"),
    where("transactionType", "==", type),
    where("status", "==", "Active"),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToCategories(
  userId: string,
  callback: (categories: Category[]) => void
) {
  const q = query(getUserCollection(userId, "categories"), orderBy("name"));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function createCategory(
  userId: string,
  data: Omit<Category, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(getUserCollection(userId, "categories"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: Partial<Category>
): Promise<void> {
  await updateDoc(getUserDoc(userId, "categories", categoryId), data);
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  await deleteDoc(getUserDoc(userId, "categories", categoryId));
}

export async function seedDefaultCategories(userId: string): Promise<void> {
  const col = getUserCollection(userId, "categories");
  const now = Timestamp.now();

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await addDoc(col, {
      name: cat.name,
      transactionType: "Expense",
      status: "Active",
      description: cat.description,
      createdAt: now,
    });
  }

  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await addDoc(col, {
      name: cat.name,
      transactionType: "Income",
      status: "Active",
      description: cat.description,
      createdAt: now,
    });
  }
}
