import { decidePullApply, type PulledItem } from './pullApply';
import type { WeightEntryRow } from '../db/schema';

const baseItem: PulledItem = {
  entity: 'weight_entry',
  recordId: 'entry-1',
  serverSeq: 42,
  version: 2,
  payload: { localDate: '2026-11-06', weightKg: 75.4, clientUpdatedAt: '2026-11-06T06:00:00.000Z' },
  deletedAt: null,
};

const existingRow: WeightEntryRow = {
  id: 'entry-1',
  localDate: '2026-11-05',
  weightKg: 74.0,
  createdAt: '2026-11-05T06:00:00.000Z',
  updatedAt: '2026-11-05T06:00:00.000Z',
  clientUpdatedAt: '2026-11-05T06:00:00.000Z',
  version: 1,
  serverSeq: 10,
  deletedAt: null,
};

describe('decidePullApply', () => {
  it('does nothing when the record has a pending outbox row, even if the pulled version is newer', () => {
    const decision = decidePullApply({
      item: baseItem,
      existing: existingRow,
      hasPendingOutbox: true,
      now: '2026-11-06T07:00:00.000Z',
    });
    expect(decision).toEqual({ action: 'noop', reason: 'pending-local-edit' });
  });

  it('upserts a brand-new record with no pending outbox row', () => {
    const decision = decidePullApply({
      item: baseItem,
      existing: null,
      hasPendingOutbox: false,
      now: '2026-11-06T07:00:00.000Z',
    });
    expect(decision.action).toBe('upsert');
    if (decision.action === 'upsert') {
      expect(decision.entry).toMatchObject({
        id: 'entry-1',
        localDate: '2026-11-06',
        weightKg: 75.4,
        version: 2,
        serverSeq: 42,
        deletedAt: null,
      });
    }
  });

  it('is a no-op when the local version is already current', () => {
    const decision = decidePullApply({
      item: { ...baseItem, version: 1 },
      existing: existingRow,
      hasPendingOutbox: false,
      now: '2026-11-06T07:00:00.000Z',
    });
    expect(decision).toEqual({ action: 'noop', reason: 'already-up-to-date' });
  });

  it('tombstones a deleted record', () => {
    const decision = decidePullApply({
      item: { ...baseItem, deletedAt: '2026-11-06T08:00:00.000Z', payload: null },
      existing: existingRow,
      hasPendingOutbox: false,
      now: '2026-11-06T08:00:00.000Z',
    });
    expect(decision.action).toBe('tombstone');
    if (decision.action === 'tombstone') {
      expect(decision.entry.deletedAt).toBe('2026-11-06T08:00:00.000Z');
      expect(decision.entry.localDate).toBe(existingRow.localDate);
    }
  });
});
