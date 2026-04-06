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
import { Subscription } from "@/lib/types";

function mapDoc(doc: any): Subscription {
  return { id: doc.id, ...doc.data() } as Subscription;
}

export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  const q = query(getUserCollection(userId, "subscriptions"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export async function getActiveSubscriptions(userId: string): Promise<Subscription[]> {
  const q = query(
    getUserCollection(userId, "subscriptions"),
    where("status", "==", "Active"),
    orderBy("nextDueDate")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToSubscriptions(
  userId: string,
  callback: (subs: Subscription[]) => void
) {
  const q = query(getUserCollection(userId, "subscriptions"), orderBy("name"));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function createSubscription(
  userId: string,
  data: Omit<Subscription, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(getUserCollection(userId, "subscriptions"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateSubscription(
  userId: string,
  subId: string,
  data: Partial<Subscription>
): Promise<void> {
  await updateDoc(getUserDoc(userId, "subscriptions", subId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteSubscription(userId: string, subId: string): Promise<void> {
  await deleteDoc(getUserDoc(userId, "subscriptions", subId));
}

export function computeSubscriptionSummary(subscriptions: Subscription[]) {
  const active = subscriptions.filter((s) => s.status === "Active");
  const monthlyTotal = active.reduce((sum, s) => {
    switch (s.frequency) {
      case "Weekly": return sum + s.amount * 4.33;
      case "Monthly": return sum + s.amount;
      case "Quarterly": return sum + s.amount / 3;
      case "Yearly": return sum + s.amount / 12;
      default: return sum;
    }
  }, 0);

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dueIn7Days = active.filter((s) => {
    const due = s.nextDueDate.toDate();
    return due >= now && due <= in7Days;
  });

  const dueIn30Days = active.filter((s) => {
    const due = s.nextDueDate.toDate();
    return due >= now && due <= in30Days;
  });

  return {
    activeCount: active.length,
    monthlyCost: monthlyTotal,
    yearlyCost: monthlyTotal * 12,
    dueIn7Days,
    dueIn30Days,
  };
}
