import type { AuthRepository } from "@data/repositories/index";
import { persistentStore } from "@data/store/persistentStore";

/** Auth backed by the persistent store (local accounts). */
export function createAuthRepository(): AuthRepository {
  return {
    async login(credentials) {
      return persistentStore.login(credentials.email, credentials.password);
    },
    async register(input) {
      return persistentStore.register(input);
    },
  };
}
