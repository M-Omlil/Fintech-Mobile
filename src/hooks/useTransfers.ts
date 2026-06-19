import { useCallback } from "react";

import type { NewBeneficiaryInput, NewTransferInput, TransferTab } from "@data/repositories/index";
import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** Transfers for a tab (En cours / Historique), with creation (§6.6). */
export function useTransfers(tab: TransferTab) {
  const { transfers } = useRepos();
  const state = useAsync(() => transfers.getTransfers(tab), [transfers, tab]);
  const { reload } = state;

  const create = useCallback(
    async (input: NewTransferInput) => {
      await transfers.create(input);
      reload();
    },
    [transfers, reload],
  );

  return { ...state, create };
}

/** Saved transfer beneficiaries, with creation. */
export function useBeneficiaries() {
  const { transfers } = useRepos();
  const state = useAsync(() => transfers.getBeneficiaries(), [transfers]);
  const { reload } = state;

  const addBeneficiary = useCallback(
    async (input: NewBeneficiaryInput) => {
      const created = await transfers.addBeneficiary(input);
      reload();
      return created;
    },
    [transfers, reload],
  );

  return { ...state, addBeneficiary };
}
