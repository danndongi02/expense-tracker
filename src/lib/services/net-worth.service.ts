import {
  getUserCollection,
  getUserDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
} from "@/lib/firebase/firestore";
import { NetWorthSnapshot } from "@/lib/types";
import { getAccountBalances } from "./balances.service";
import { computeNetWorth } from "./balances.service";
import { formatMonthKey } from "@/lib/utils/date";

function mapDoc(doc: any): NetWorthSnapshot {
  return { id: doc.id, ...doc.data() } as NetWorthSnapshot;
}

export async function getNetWorthSnapshots(userId: string): Promise<NetWorthSnapshot[]> {
  const q = query(getUserCollection(userId, "netWorthSnapshots"), orderBy("snapshotMonth"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDoc);
}

export function subscribeToNetWorthSnapshots(
  userId: string,
  callback: (snapshots: NetWorthSnapshot[]) => void
) {
  const q = query(getUserCollection(userId, "netWorthSnapshots"), orderBy("snapshotMonth"));
  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    callback(snapshot.docs.map(mapDoc));
  });
}

export async function takeNetWorthSnapshot(userId: string): Promise<NetWorthSnapshot> {
  const balances = await getAccountBalances(userId);
  const { assetsTotal, investmentsTotal, liabilitiesTotal, netWorth } = computeNetWorth(balances);

  const monthKey = formatMonthKey(new Date());
  const data: Omit<NetWorthSnapshot, "id"> = {
    snapshotMonth: monthKey,
    assetsTotal,
    investmentsTotal,
    liabilitiesTotal,
    netWorth,
    createdAt: Timestamp.now(),
  };

  await setDoc(getUserDoc(userId, "netWorthSnapshots", monthKey), data);

  return { id: monthKey, ...data };
}
