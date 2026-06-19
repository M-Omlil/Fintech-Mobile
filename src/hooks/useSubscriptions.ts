import { useCallback } from "react";

import type { NewSubscriptionInput } from "@data/repositories/index";
import type { SubscriptionStatus } from "@domain/index";
import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** Abonnements manager — list + add + pause/resume/cancel + remove. */
export function useSubscriptions() {
  const { subscriptions } = useRepos();
  const state = useAsync(() => subscriptions.getSubscriptions(), [subscriptions]);
  const { reload } = state;

  const add = useCallback(
    async (input: NewSubscriptionInput) => {
      await subscriptions.addSubscription(input);
      reload();
    },
    [subscriptions, reload],
  );

  const setStatus = useCallback(
    async (id: string, status: SubscriptionStatus) => {
      await subscriptions.setStatus(id, status);
      reload();
    },
    [subscriptions, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await subscriptions.remove(id);
      reload();
    },
    [subscriptions, reload],
  );

  return { ...state, add, setStatus, remove };
}
