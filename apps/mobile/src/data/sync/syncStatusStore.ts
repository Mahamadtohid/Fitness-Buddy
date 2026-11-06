import { create } from 'zustand';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

type SyncStatusState = {
  status: SyncStatus;
  lastError: string | null;
  lastSyncedAt: string | null;
  setStatus: (status: SyncStatus, lastError?: string | null) => void;
  setSynced: (at: string) => void;
};

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: 'synced',
  lastError: null,
  lastSyncedAt: null,
  setStatus: (status, lastError = null) => set({ status, lastError }),
  setSynced: (at) => set({ status: 'synced', lastError: null, lastSyncedAt: at }),
}));
