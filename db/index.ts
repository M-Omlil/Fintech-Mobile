import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";
import { countProfiles } from "./repository";

const DB_NAME = "fintech.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initInternal(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Apply schema (idempotent — every CREATE uses IF NOT EXISTS)
  await db.execAsync(SCHEMA_SQL);

  // Seed only if profiles table is empty (fresh install)
  const existing = await countProfiles(db);
  if (existing === 0) {
    await seedDatabase(db);
  }

  return db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = initInternal().then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return initPromise;
}

/**
 * For dev: wipe the DB file and force a re-seed on next getDb() call.
 */
export async function resetDatabase() {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
}

export { DB_NAME };
