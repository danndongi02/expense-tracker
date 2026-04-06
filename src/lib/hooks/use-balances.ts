"use client";

import { useState, useEffect } from "react";
import { Account, AccountBalance, LedgerEntry } from "@/lib/types";
import { subscribeToAccounts } from "@/lib/services/accounts.service";
import { subscribeToLedgerEntries } from "@/lib/services/ledger.service";
import { computeBalances, computeNetWorth } from "@/lib/services/balances.service";
import { useAuth } from "@/lib/context/auth-context";

export function useBalances() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubAccounts = subscribeToAccounts(user.uid, (data) => {
      setAccounts(data);
      setAccountsLoaded(true);
    });

    const unsubLedger = subscribeToLedgerEntries(user.uid, (data) => {
      setLedgerEntries(data);
      setLedgerLoaded(true);
    });

    return () => {
      unsubAccounts();
      unsubLedger();
    };
  }, [user]);

  useEffect(() => {
    if (accountsLoaded && ledgerLoaded) {
      setLoading(false);
    }
  }, [accountsLoaded, ledgerLoaded]);

  const balances = computeBalances(accounts, ledgerEntries);
  const netWorthData = computeNetWorth(balances);

  return { balances, ...netWorthData, loading };
}
