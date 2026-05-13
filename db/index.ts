import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";
import { countProfiles } from "./repository";

const DB_NAME = "fintech.db";

/**
 * Bump this when the fixture data changes. On next app launch the DB will
 * detect the version mismatch, wipe `fintech.db`, and re-seed from the new
 * `mockProfiles`. User-created rows (cards, transactions etc.) are lost in
 * the wipe — intentional, since this is the demo's "reset" path.
 */
const SEED_VERSION = 3;

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function readSeedVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM schema_meta WHERE key = 'seed_version'"
    );
    return row ? Number(row.value) : 0;
  } catch {
    return 0;
  }
}

async function writeSeedVersion(db: SQLite.SQLiteDatabase, version: number) {
  await db.runAsync(
    "INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('seed_version', ?)",
    [String(version)]
  );
}

async function openAndApplySchema(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await db.execAsync(SCHEMA_SQL);
    return db;
  } catch (e) {
    // Close the half-initialized connection so deleteDatabaseAsync can
    // succeed in the caller's recovery path. SQLite refuses to delete a
    // file while any handle is open against it.
    try {
      await db.closeAsync();
    } catch {}
    throw e;
  }
}

async function wipeAndReseed(): Promise<SQLite.SQLiteDatabase> {
  await SQLite.deleteDatabaseAsync(DB_NAME);
  const db = await openAndApplySchema();
  await seedDatabase(db);
  await writeSeedVersion(db, SEED_VERSION);
  return db;
}

async function initInternal(): Promise<SQLite.SQLiteDatabase> {
  // Schema may reference columns that don't exist on an older table
  // (e.g. new index on `card_id`). CREATE TABLE IF NOT EXISTS is a no-op
  // when the table is already there, so the migration would error before
  // we can read the seed_version. On any schema-apply failure, wipe and
  // re-seed from scratch — openAndApplySchema closes its own handle on
  // error, so the file is free to be deleted.
  let db: SQLite.SQLiteDatabase;
  try {
    db = await openAndApplySchema();
  } catch {
    return wipeAndReseed();
  }

  const installed = await readSeedVersion(db);

  if (installed < SEED_VERSION) {
    // Version bump → wipe the file and re-seed against the latest fixtures.
    await db.closeAsync();
    return wipeAndReseed();
  }

  // Same version: seed only when the file is genuinely empty (first install).
  const existing = await countProfiles(db);
  if (existing === 0) {
    await seedDatabase(db);
    await writeSeedVersion(db, SEED_VERSION);
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
 * Manual reset path: wipe the DB file and force a re-seed on next getDb()
 * call. Used by the "Réinitialiser la base (Démo)" button in the profile
 * screen.
 */
export async function resetDatabase() {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
}

export { DB_NAME, SEED_VERSION };
