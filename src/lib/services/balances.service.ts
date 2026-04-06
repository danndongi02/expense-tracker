import { Account, AccountBalance, LedgerEntry } from "@/lib/types";
import { getAccounts } from "./accounts.service";
import { getLedgerEntries } from "./ledger.service";

export async function getAccountBalances(userId: string): Promise<AccountBalance[]> {
  const [accounts, ledgerEntries] = await Promise.all([
    getAccounts(userId),
    getLedgerEntries(userId),
  ]);

  return computeBalances(accounts, ledgerEntries);
}

export function computeBalances(
  accounts: Account[],
  ledgerEntries: LedgerEntry[]
): AccountBalance[] {
  const deltaMap = new Map<string, number>();
  for (const entry of ledgerEntries) {
    const current = deltaMap.get(entry.accountId) || 0;
    deltaMap.set(entry.accountId, current + entry.delta);
  }

  return accounts.map((account) => {
    const ledgerDelta = deltaMap.get(account.id) || 0;
    const currentBalance = account.openingBalance + ledgerDelta;

    return {
      account,
      ledgerDelta,
      currentBalance,
      balanceCheck: "OK" as const,
    };
  });
}

export function computeNetWorth(balances: AccountBalance[]): {
  assetsTotal: number;
  investmentsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
} {
  let assetsTotal = 0;
  let investmentsTotal = 0;
  let liabilitiesTotal = 0;

  for (const b of balances) {
    if (b.account.status !== "Active") continue;
    switch (b.account.type) {
      case "Asset":
        assetsTotal += b.currentBalance;
        break;
      case "Investment":
        investmentsTotal += b.currentBalance;
        break;
      case "Liability":
        liabilitiesTotal += b.currentBalance;
        break;
    }
  }

  return {
    assetsTotal,
    investmentsTotal,
    liabilitiesTotal,
    netWorth: assetsTotal + investmentsTotal - liabilitiesTotal,
  };
}
