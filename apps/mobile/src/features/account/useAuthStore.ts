import { create } from 'zustand';

import { client } from '../../data/api/client';
import { resetLocalDatabase } from '../../data/db/client';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../../platform/secureStorage';

const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const USER_EMAIL_KEY = 'auth.userEmail';

type Status = 'idle' | 'authenticated' | 'unauthenticated';

type AuthState = {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  userEmail: string | null;
  status: Status;
  /** Loads a persisted session on app start; call once from the root layout. */
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerAndLogin: (email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Used by the sync engine on a 401; returns false (and logs out) if the refresh token is dead. */
  refreshSilently: () => Promise<boolean>;
  /** PRD §3.1/§7.9: deletes the account server-side (cascades to every owned row) and wipes all
   * local data on this device — irreversible, the caller is responsible for confirming with the
   * user first. Rethrows on failure so the Settings screen can show the user it didn't work,
   * rather than silently leaving them in a half-deleted state. */
  deleteAccount: () => Promise<void>;
};

function applySession(
  set: (partial: Partial<AuthState>) => void,
  auth: { accessToken: string; accessTokenExpiresAt: string },
  userEmail: string | null,
): void {
  set({
    accessToken: auth.accessToken,
    accessTokenExpiresAt: auth.accessTokenExpiresAt,
    userEmail,
    status: 'authenticated',
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  accessTokenExpiresAt: null,
  userEmail: null,
  status: 'idle',

  bootstrap: async () => {
    const refreshToken = await getSecureItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      set({ status: 'unauthenticated' });
      return;
    }

    try {
      const auth = await client.refresh(refreshToken);
      const userEmail = await getSecureItem(USER_EMAIL_KEY);
      await setSecureItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      applySession(set, auth, userEmail);
    } catch {
      await deleteSecureItem(REFRESH_TOKEN_KEY);
      set({ status: 'unauthenticated', accessToken: null });
    }
  },

  login: async (email, password) => {
    const auth = await client.login(email, password);
    await setSecureItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    await setSecureItem(USER_EMAIL_KEY, email);
    applySession(set, auth, email);
  },

  registerAndLogin: async (email, password, inviteCode) => {
    await client.register(email, password, inviteCode);
    const auth = await client.login(email, password);
    await setSecureItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    await setSecureItem(USER_EMAIL_KEY, email);
    applySession(set, auth, email);
  },

  logout: async () => {
    const refreshToken = await getSecureItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await client.logout(refreshToken);
      } catch {
        // Best-effort: the device is logged out locally regardless of network state.
      }
    }
    await deleteSecureItem(REFRESH_TOKEN_KEY);
    await deleteSecureItem(USER_EMAIL_KEY);
    set({ accessToken: null, accessTokenExpiresAt: null, userEmail: null, status: 'unauthenticated' });
  },

  refreshSilently: async () => {
    const refreshToken = await getSecureItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const auth = await client.refresh(refreshToken);
      await setSecureItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      set({ accessToken: auth.accessToken, accessTokenExpiresAt: auth.accessTokenExpiresAt, status: 'authenticated' });
      return true;
    } catch {
      await deleteSecureItem(REFRESH_TOKEN_KEY);
      set({ status: 'unauthenticated', accessToken: null });
      return false;
    }
  },

  deleteAccount: async () => {
    const { accessToken } = get();
    // Not best-effort like logout() — a failed server-side delete must not silently wipe the
    // local copy of data that still exists on the server under the user's account.
    await client.deleteAccount(accessToken);

    resetLocalDatabase();
    await deleteSecureItem(REFRESH_TOKEN_KEY);
    await deleteSecureItem(USER_EMAIL_KEY);
    set({ accessToken: null, accessTokenExpiresAt: null, userEmail: null, status: 'unauthenticated' });
  },
}));
