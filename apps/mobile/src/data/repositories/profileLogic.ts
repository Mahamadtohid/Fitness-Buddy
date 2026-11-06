import type { OutboxRow, ProfileRow } from '../db/schema';

export type ProfileInput = {
  sex: string;
  birthDate: string;
  heightCm: number;
  lifestyleFactor: number;
  goal: string;
  rateKgPerWeek: number;
  units: string;
  timeZone: string;
};

/** Pure logic behind `saveProfile` (see profileRepository.ts). Singleton upsert — unlike
 * `weight_entry`'s date-keyed uniqueness, there's no secondary key at all: "is there any row" is
 * the only lookup, mirroring the backend's per-user (not per-field) singleton lookup. */
export function buildSaveProfileChange(params: {
  existing: ProfileRow | null;
  input: ProfileInput;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: ProfileRow; outboxRow: OutboxRow } {
  const { existing, input, now, newId, newOpId } = params;

  const entry: ProfileRow = existing
    ? { ...existing, ...input, updatedAt: now, clientUpdatedAt: now }
    : {
        id: newId,
        ...input,
        createdAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: 0,
        serverSeq: 0,
        deletedAt: null,
      };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'profile',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ ...input, clientUpdatedAt: entry.clientUpdatedAt }),
    baseVersion: existing ? existing.version : null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
