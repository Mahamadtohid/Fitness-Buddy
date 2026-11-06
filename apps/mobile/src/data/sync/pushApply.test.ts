import { decidePushResult } from './pushApply';

describe('decidePushResult', () => {
  it('removes the outbox row and updates the entry from serverCopy when applied', () => {
    const action = decidePushResult({
      opId: 'op-1',
      status: 'applied',
      serverCopy: {
        version: 1,
        serverSeq: 42,
        payload: { localDate: '2026-11-06', weightKg: 75.4, clientUpdatedAt: '2026-11-06T06:00:00.000Z' },
      },
    });
    expect(action).toEqual({
      action: 'remove-outbox-and-update-entry',
      patch: { version: 1, serverSeq: 42, localDate: '2026-11-06', weightKg: 75.4, clientUpdatedAt: '2026-11-06T06:00:00.000Z' },
    });
  });

  it('just removes the outbox row when applied with no serverCopy', () => {
    expect(decidePushResult({ opId: 'op-1', status: 'applied' })).toEqual({ action: 'remove-outbox' });
  });

  it('accepts the server copy on a conflict, same as applied', () => {
    const action = decidePushResult({
      opId: 'op-1',
      status: 'conflict',
      serverCopy: { version: 5, serverSeq: 99 },
    });
    expect(action).toEqual({
      action: 'remove-outbox-and-update-entry',
      patch: { version: 5, serverSeq: 99 },
    });
  });

  it('surfaces the reason and stops retrying when rejected', () => {
    const action = decidePushResult({ opId: 'op-1', status: 'rejected', reason: 'entity not supported yet' });
    expect(action).toEqual({ action: 'remove-outbox-and-record-error', reason: 'entity not supported yet' });
  });

  it('falls back to a generic reason when rejected with none given', () => {
    const action = decidePushResult({ opId: 'op-1', status: 'rejected' });
    expect(action).toEqual({ action: 'remove-outbox-and-record-error', reason: 'Rejected by server' });
  });
});
