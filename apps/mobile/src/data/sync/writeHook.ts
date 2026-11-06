/**
 * Lets the repository layer notify the scheduler about a local write without importing it
 * directly (the scheduler imports the repository's siblings, so a direct import would cycle).
 */
type Listener = () => void;

let listener: Listener | null = null;

export function setLocalWriteListener(fn: Listener | null): void {
  listener = fn;
}

export function notifyLocalWrite(): void {
  listener?.();
}
