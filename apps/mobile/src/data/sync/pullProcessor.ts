import { eq } from 'drizzle-orm';

import { SYNC_STATE_SINGLETON_ID, getDb } from '../db/client';
import { outbox, syncState, weightEntry, type WeightEntryRow } from '../db/schema';
import { authorizedClient } from './authorizedClient';
import { decidePullApply, type PulledItem } from './pullApply';

/** Pages `/sync/pull` from the stored cursor, applying each item (PRD §7.5 step 5). */
export async function pullLatest(): Promise<void> {
  const db = getDb();
  let hasMore = true;

  while (hasMore) {
    const state = db.select().from(syncState).where(eq(syncState.id, SYNC_STATE_SINGLETON_ID)).all()[0] as
      | { lastCursor: number }
      | undefined;
    const cursor = state?.lastCursor ?? 0;

    const response = await authorizedClient.syncPull(cursor, 200);

    for (const raw of response.items) {
      if (raw.entity !== 'weight_entry') continue;

      const item: PulledItem = {
        entity: raw.entity,
        recordId: raw.recordId,
        serverSeq: raw.serverSeq,
        version: raw.version,
        payload: raw.payload ?? null,
        deletedAt: raw.deletedAt,
      };

      const existing = (db.select().from(weightEntry).where(eq(weightEntry.id, item.recordId)).all()[0] ??
        null) as WeightEntryRow | null;
      const hasPendingOutbox = db.select().from(outbox).where(eq(outbox.recordId, item.recordId)).all().length > 0;

      const decision = decidePullApply({ item, existing, hasPendingOutbox, now: new Date().toISOString() });

      if (decision.action === 'upsert' || decision.action === 'tombstone') {
        if (existing) {
          db.update(weightEntry).set(decision.entry).where(eq(weightEntry.id, item.recordId)).run();
        } else {
          db.insert(weightEntry).values(decision.entry).run();
        }
      }
    }

    db.update(syncState)
      .set({ lastCursor: response.nextCursor, lastSyncedAt: new Date().toISOString() })
      .where(eq(syncState.id, SYNC_STATE_SINGLETON_ID))
      .run();

    hasMore = response.hasMore;
  }
}
