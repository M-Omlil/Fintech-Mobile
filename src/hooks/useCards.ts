import { useCallback } from "react";

import type { Card, CardSettings } from "@domain/index";
import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/**
 * Cards list plus the mutations the Cards screen needs (Section 6.4). Each mutation
 * persists through the repository then reloads so the UI reflects the change.
 */
export function useCards() {
  const { cards } = useRepos();
  const state = useAsync(() => cards.getCards(), [cards]);
  const { reload } = state;

  const setStatus = useCallback(
    async (cardId: string, status: Card["status"]) => {
      await cards.setStatus(cardId, status);
      reload();
    },
    [cards, reload],
  );

  const updateSettings = useCallback(
    async (cardId: string, settings: Partial<CardSettings>) => {
      await cards.updateSettings(cardId, settings);
      reload();
    },
    [cards, reload],
  );

  const rename = useCallback(
    async (cardId: string, nickname: string) => {
      await cards.rename(cardId, nickname);
      reload();
    },
    [cards, reload],
  );

  const remove = useCallback(
    async (cardId: string) => {
      await cards.remove(cardId);
      reload();
    },
    [cards, reload],
  );

  return { ...state, setStatus, updateSettings, rename, remove };
}
