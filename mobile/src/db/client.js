import * as SQLite from "expo-sqlite";
import { schemaSql } from "./schema";

let dbPromise;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("flowwallet.db");
  }

  return dbPromise;
}

export async function initializeDb() {
  const db = await getDb();
  await db.execAsync(schemaSql);
  return db;
}
