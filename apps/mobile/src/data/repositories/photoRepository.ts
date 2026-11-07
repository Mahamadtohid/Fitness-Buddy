import { desc, eq } from 'drizzle-orm';
import { Directory, File, Paths } from 'expo-file-system';

import { getDb } from '../db/client';
import { photo, type PhotoRow } from '../db/schema';
import { generateId } from '../../platform/uuid';

export type Pose = 'front' | 'side' | 'back';

const photosDirectory = new Directory(Paths.document, 'progress-photos');

function ensureDirectory(): void {
  if (!photosDirectory.exists) {
    photosDirectory.create({ intermediates: true, idempotent: true });
  }
}

/**
 * Copies a picked/captured image into the app's own document directory and records a LOCAL-ONLY
 * row — progress photos never sync (PRD §8.3 `photo`: "Not synced in v1"), so unlike every other
 * repository in this project there is no outbox enqueue, no `notifyLocalWrite()`, here at all.
 */
export async function savePhoto(localDate: string, pose: Pose, sourceUri: string): Promise<void> {
  ensureDirectory();

  const sourceFile = new File(sourceUri);
  const extension = sourceFile.extension || '.jpg';
  const destination = new File(photosDirectory, `${generateId()}${extension}`);
  await sourceFile.copy(destination);

  const db = getDb();
  db.insert(photo)
    .values({ id: generateId(), localDate, pose, filePath: destination.uri })
    .run();
}

export function listPhotos(pose?: Pose): PhotoRow[] {
  const db = getDb();
  if (pose) {
    return db.select().from(photo).where(eq(photo.pose, pose)).orderBy(desc(photo.localDate)).all() as PhotoRow[];
  }
  return db.select().from(photo).orderBy(desc(photo.localDate)).all() as PhotoRow[];
}
