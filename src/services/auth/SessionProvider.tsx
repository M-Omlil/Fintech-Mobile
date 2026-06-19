import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { createAuthRepository } from "@data/repositories/persistent/auth";
import { persistentStore } from "@data/store/persistentStore";
import type { Business, Credentials, RegisterInput } from "@domain/index";

const SESSION_KEY = "amano.session.businessId";

type SessionStatus = "loading" | "authed" | "guest";

type SessionContextValue = {
  status: SessionStatus;
  business: Business | null;
  login: (credentials: Credentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const authRepo = createAuthRepository();

/**
 * Owns auth state and the active business (session). Initializes the persistent
 * store, restores a saved session on launch, and exposes login/register/logout.
 * Wrap the DI + navigation in this provider.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      await persistentStore.init();
      const savedId = await AsyncStorage.getItem(SESSION_KEY);
      if (!active) return;
      if (savedId) {
        try {
          const data = persistentStore.getData(savedId);
          setBusiness(data.business);
          setStatus("authed");
          return;
        } catch {
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      }
      setStatus("guest");
    })().catch(() => active && setStatus("guest"));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const result = await authRepo.login(credentials);
    await AsyncStorage.setItem(SESSION_KEY, result.id);
    setBusiness(result);
    setStatus("authed");
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authRepo.register(input);
    await AsyncStorage.setItem(SESSION_KEY, result.id);
    setBusiness(result);
    setStatus("authed");
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setBusiness(null);
    setStatus("guest");
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, business, login, register, logout }),
    [status, business, login, register, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
