import { buildLogWeightChange } from './weightEntryLogic';

describe('buildLogWeightChange', () => {
  it('creates a new entry and one upsert outbox row when none exists yet', () => {
    const { entry, outboxRow } = buildLogWeightChange({
      existing: null,
      localDate: '2026-11-06',
      weightKg: 75.4,
      now: '2026-11-06T06:00:00.000Z',
      newId: 'entry-1',
      newOpId: 'op-1',
    });

    expect(entry).toMatchObject({
      id: 'entry-1',
      localDate: '2026-11-06',
      weightKg: 75.4,
      version: 0,
      serverSeq: 0,
      deletedAt: null,
    });
    expect(outboxRow).toMatchObject({
      opId: 'op-1',
      entity: 'weight_entry',
      recordId: 'entry-1',
      op: 'upsert',
      baseVersion: null,
    });
    expect(JSON.parse(outboxRow.payload)).toEqual({
      localDate: '2026-11-06',
      weightKg: 75.4,
      clientUpdatedAt: '2026-11-06T06:00:00.000Z',
    });
  });

  it('updates an existing entry in place and carries its version as baseVersion', () => {
    const existing = {
      id: 'entry-1',
      localDate: '2026-11-06',
      weightKg: 75.4,
      createdAt: '2026-11-06T06:00:00.000Z',
      updatedAt: '2026-11-06T06:00:00.000Z',
      clientUpdatedAt: '2026-11-06T06:00:00.000Z',
      version: 3,
      serverSeq: 9,
      deletedAt: null,
    };

    const { entry, outboxRow } = buildLogWeightChange({
      existing,
      localDate: '2026-11-06',
      weightKg: 76.0,
      now: '2026-11-06T18:00:00.000Z',
      newId: 'unused-because-existing-wins',
      newOpId: 'op-2',
    });

    expect(entry.id).toBe('entry-1');
    expect(entry.weightKg).toBe(76.0);
    expect(entry.updatedAt).toBe('2026-11-06T18:00:00.000Z');
    expect(entry.clientUpdatedAt).toBe('2026-11-06T18:00:00.000Z');
    expect(entry.version).toBe(3);
    expect(outboxRow.baseVersion).toBe(3);
    expect(outboxRow.recordId).toBe('entry-1');
  });
});
