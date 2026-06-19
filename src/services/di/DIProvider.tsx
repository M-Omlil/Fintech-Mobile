import React, { createContext, useContext, useMemo } from "react";

import type { Repositories } from "@data/repositories/index";
import { useSession } from "@services/auth/SessionProvider";

import { createContainer } from "./Container";

const DIContext = createContext<Repositories | null>(null);

/**
 * Provides the repository container for the active session. Repositories are rebuilt
 * whenever the signed-in business changes. UI never imports data sources directly.
 */
export function DIProvider({ children }: { children: React.ReactNode }) {
  const { business } = useSession();
  const value = useMemo<Repositories | null>(
    () => (business ? createContainer(business.id) : null),
    [business],
  );
  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
}

/** Access injected repositories. Only valid within an authenticated session. */
export function useRepos(): Repositories {
  const ctx = useContext(DIContext);
  if (!ctx) throw new Error("useRepos must be used within an authenticated session");
  return ctx;
}
