import Constants from 'expo-constants';

const BASE_URL =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  'http://localhost:5000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

export type WeightEntryPayload = {
  localDate: string;
  weightKg: number;
  clientUpdatedAt: string;
};

export type SyncOpDto = {
  opId: string;
  entity: string;
  recordId: string;
  op: 'upsert' | 'delete';
  payload: unknown;
  baseVersion: number | null;
};

export type SyncOpStatus = 'applied' | 'rejected' | 'conflict';

/** `payload` shape depends on `entity` — each entity's push/pull-apply module knows its own
 * shape and casts accordingly (see data/sync/pushApply.ts, pullApply.ts and their siblings). */
export type SyncOpResultDto = {
  opId: string;
  status: SyncOpStatus;
  reason?: string | null;
  serverCopy?: { version: number; serverSeq: number; payload?: unknown } | null;
};

export type SyncPushResponse = { results: SyncOpResultDto[] };

export type SyncPullItemDto = {
  entity: string;
  recordId: string;
  serverSeq: number;
  version: number;
  payload?: unknown;
  deletedAt: string | null;
};

export type SyncPullResponse = {
  items: SyncPullItemDto[];
  nextCursor: number;
  hasMore: boolean;
};

async function safeJson(res: Response): Promise<{ title?: string; detail?: string } | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    const problem = await safeJson(res);
    throw new ApiError(res.status, problem?.title ?? problem?.detail ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Raw, store-agnostic endpoint calls. Deliberately has no dependency on useAuthStore (which
 * itself calls register/login/refresh here) to avoid a circular import — token-aware retry
 * logic lives one layer up, in `data/sync/authorizedClient.ts`.
 */
export const client = {
  register: (email: string, password: string, inviteCode: string) =>
    request<{ id: string; email: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, inviteCode }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request<void>('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  forgotPassword: (email: string) =>
    request<void>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** PRD §3.1/§7.9: required by Apple/Google — deletes the account and, since the
   * AppDbContext cascade-delete fix, every row it owns on the server. */
  deleteAccount: (token: string | null) =>
    request<void>('/api/v1/account', {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  syncPush: (ops: SyncOpDto[], token: string | null) =>
    request<SyncPushResponse>('/api/v1/sync/push', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ops }),
    }),

  syncPull: (cursor: number, limit: number, token: string | null) =>
    request<SyncPullResponse>(`/api/v1/sync/pull?cursor=${cursor}&limit=${limit}`, {
      headers: authHeaders(token),
    }),
};
