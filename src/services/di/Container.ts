import type { Repositories } from "@data/repositories/index";
import { createPersistentRepositories } from "@data/repositories/persistent/index";

/**
 * Composition root (Section 4 — Dependency Inversion). Builds the repository set for
 * a given business/session. The concrete data source (persistent store) is chosen
 * here only; swapping it for SQLite/API leaves the entire UI unchanged.
 */
export function createContainer(businessId: string): Repositories {
  return createPersistentRepositories(businessId);
}
