import { ApiError, client, type SyncOpDto, type SyncPullResponse, type SyncPushResponse } from '../api/client';
import { useAuthStore } from '../../features/account/useAuthStore';

/** One automatic refresh-and-retry on a 401 (PRD §7.1 "auth interceptor (token refresh)"). */
async function withAuthRetry<T>(call: (token: string | null) => Promise<T>): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  try {
    return await call(token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const refreshed = await useAuthStore.getState().refreshSilently();
      if (refreshed) {
        return await call(useAuthStore.getState().accessToken);
      }
    }
    throw err;
  }
}

export const authorizedClient = {
  syncPush: (ops: SyncOpDto[]): Promise<SyncPushResponse> => withAuthRetry((token) => client.syncPush(ops, token)),
  syncPull: (cursor: number, limit: number): Promise<SyncPullResponse> =>
    withAuthRetry((token) => client.syncPull(cursor, limit, token)),
};
