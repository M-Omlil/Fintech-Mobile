import { useCallback } from "react";

import type { NewAccountInput } from "@data/repositories/index";
import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** Accounts list with creation (Section 6.2 / 6.7). */
export function useAccounts() {
  const { accounts } = useRepos();
  const state = useAsync(() => accounts.getAccounts(), [accounts]);
  const { reload } = state;

  const addAccount = useCallback(
    async (input: NewAccountInput) => {
      await accounts.addAccount(input);
      reload();
    },
    [accounts, reload],
  );

  const activate = useCallback(
    async (accountId: string) => {
      await accounts.activate(accountId);
      reload();
    },
    [accounts, reload],
  );

  return { ...state, addAccount, activate };
}

/** Total assets across accounts (Section 6.7 header). */
export function useTotalAssets() {
  const { accounts } = useRepos();
  return useAsync(() => accounts.getTotalAssets(), [accounts]);
}
