import { eq } from 'drizzle-orm';

import type { SyncOpDto } from '../api/client';
import { getDb } from '../db/client';
import { outbox, weightEntry, type OutboxRow } from '../db/schema';
import { authorizedClient } from './authorizedClient';
import { decidePushResult } from './pushApply';
import { useSyncStatusStore } from './syncStatusStore';

/** Pushes up to 200 pending outbox rows and applies the server's ack (PRD §7.5 steps 2-4). */
export async function pushPending(): Promise<void> {
  const db = getDb();
  const pending = db.select().from(outbox).limit(200).all() as OutboxRow[];
  if (pending.length === 0) return;

  const ops: SyncOpDto[] = pending.map((row) => ({
    opId: row.opId,
    entity: row.entity,
    recordId: row.recordId,
    op: row.op as 'upsert' | 'delete',
    payload: JSON.parse(row.payload),
    baseVersion: row.baseVersion,
  }));

  const response = await authorizedClient.syncPush(ops);
  const byOpId = new Map(pending.map((row) => [row.opId, row]));

  for (const result of response.results) {
    const action = decidePushResult(result);
    const row = byOpId.get(result.opId);

    if (action.action === 'remove-outbox-and-update-entry' && row) {
      db.update(weightEntry).set(action.patch).where(eq(weightEntry.id, row.recordId)).run();
    }
    if (action.action === 'remove-outbox-and-record-error') {
      useSyncStatusStore.getState().setStatus('error', action.reason);
    }

    db.delete(outbox).where(eq(outbox.opId, result.opId)).run();
  }
}
