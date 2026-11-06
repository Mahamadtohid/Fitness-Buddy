import type { SyncOpResultDto } from '../api/client';
import type { WeightEntryRow } from '../db/schema';

/**
 * Pure decision logic behind applying a push ack (see outboxProcessor.ts). `applied` and
 * `conflict` both resolve the same way here: the server has already decided the winning copy
 * (last-write-wins), so the client just accepts it — there's no local merge step for this
 * entity. `rejected` is a permanent failure: stop retrying and surface the reason.
 */
export type PushResultAction =
  | { action: 'remove-outbox' }
  | { action: 'remove-outbox-and-update-entry'; patch: Partial<WeightEntryRow> }
  | { action: 'remove-outbox-and-record-error'; reason: string };

export function decidePushResult(result: SyncOpResultDto): PushResultAction {
  if (result.status === 'rejected') {
    return { action: 'remove-outbox-and-record-error', reason: result.reason ?? 'Rejected by server' };
  }

  if (result.serverCopy) {
    const patch: Partial<WeightEntryRow> = {
      version: result.serverCopy.version,
      serverSeq: result.serverCopy.serverSeq,
    };
    if (result.serverCopy.payload) {
      patch.localDate = result.serverCopy.payload.localDate;
      patch.weightKg = result.serverCopy.payload.weightKg;
      patch.clientUpdatedAt = result.serverCopy.payload.clientUpdatedAt;
    }
    return { action: 'remove-outbox-and-update-entry', patch };
  }

  return { action: 'remove-outbox' };
}
