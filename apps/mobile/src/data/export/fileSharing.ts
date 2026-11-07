import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes `contents` to a file in the app's document directory and presents the OS share sheet so
 * the user can actually save or send it (PRD §3.8 "Export all my data... works without the
 * backend"). Returns `false` (instead of throwing) when sharing isn't available on this
 * platform/device — the file is still written either way.
 */
export async function writeAndShareFile(filename: string, contents: string): Promise<boolean> {
  const file = new File(Paths.document, filename);
  await file.write(contents);

  const available = await Sharing.isAvailableAsync();
  if (!available) return false;

  await Sharing.shareAsync(file.uri);
  return true;
}
