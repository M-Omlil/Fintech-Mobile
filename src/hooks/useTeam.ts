import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** Team members holding fleet cards (Section 6.4 — empty by default). */
export function useTeam() {
  const { team } = useRepos();
  return useAsync(() => team.getMembers(), [team]);
}
