"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import {
  getUserCollection,
  onSnapshot,
  orderBy,
  query,
} from "@/lib/firebase/firestore";
import type { QuerySnapshot } from "@/lib/firebase/firestore";

export function usePayees() {
  const { user } = useAuth();
  const [payees, setPayees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPayees([]);
      setLoading(false);
      return;
    }

    const q = query(
      getUserCollection(user.uid, "payees"),
      orderBy("lastUsed", "desc")
    );

    const unsub = onSnapshot(q, (snap: QuerySnapshot) => {
      setPayees(snap.docs.map((d) => d.data().name as string));
      setLoading(false);
    });

    return unsub;
  }, [user]);

  return { payees, loading };
}
