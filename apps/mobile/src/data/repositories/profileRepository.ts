import { eq } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, profile, type ProfileRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildSaveProfileChange, type ProfileInput } from './profileLogic';

export function getProfile(): ProfileRow | null {
  const db = getDb();
  return (db.select().from(profile).limit(1).all()[0] ?? null) as ProfileRow | null;
}

/** Upsert-by-singleton (mirrors `weightEntryRepository.logWeight`'s shape, keyed by "is there any
 * row at all" rather than a date). */
export function saveProfile(input: ProfileInput): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const existing = (tx.select().from(profile).limit(1).all()[0] ?? null) as ProfileRow | null;

    const { entry, outboxRow } = buildSaveProfileChange({
      existing,
      input,
      now,
      newId: generateId(),
      newOpId: generateId(),
    });

    if (existing) {
      tx.update(profile).set(entry).where(eq(profile.id, entry.id)).run();
    } else {
      tx.insert(profile).values(entry).run();
    }
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}
