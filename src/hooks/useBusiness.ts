import { useRepos } from "@services/di/DIProvider";

import { useAsync } from "./useAsync";

/** The signed-in business identity (Section 6.2 header). */
export function useBusiness() {
  const { profile } = useRepos();
  return useAsync(() => profile.getBusiness(), [profile]);
}
