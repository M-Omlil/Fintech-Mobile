import { useMemo } from "react";

import type { TransactionFilter } from "@data/repositories/index";
import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** Filterable transactions list (Section 6.3). */
export function useTransactions(filter?: TransactionFilter) {
  const { transactions } = useRepos();
  const key = useMemo(() => JSON.stringify(filter ?? {}), [filter]);
  return useAsync(() => transactions.getTransactions(filter), [transactions, key]);
}

/** Most recent transactions (Section 6.2 — Dernières transactions). */
export function useRecentTransactions(limit: number) {
  const { transactions } = useRepos();
  return useAsync(() => transactions.getRecent(limit), [transactions, limit]);
}
