import * as SecureStore from 'expo-secure-store';

/**
 * Thin wrapper over expo-secure-store (Keychain/Keystore) so the Account/Sync
 * modules (Phase 1-2) never import expo-secure-store directly — PRD §7.1.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
