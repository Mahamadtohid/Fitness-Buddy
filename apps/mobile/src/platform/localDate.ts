/**
 * The device's current calendar date in its OWN local timezone, as "YYYY-MM-DD".
 *
 * Deliberately NOT `date.toISOString().slice(0, 10)` — `toISOString` converts to UTC first, which
 * misattributes early local-morning activity to the previous calendar day for any timezone ahead
 * of UTC (e.g. 2am IST is still 8:30pm the previous day in UTC). PRD §8.2 requires a late-night
 * entry to "stay on the day it was eaten" in the user's own local time zone — this is that.
 *
 * Only for "what is today/now" — parsing an already-known correct "YYYY-MM-DD" string back into
 * its weekday or shifting it by N days is a different, UTC-midnight-anchored problem (safe to do
 * with `new Date(\`${localDate}T00:00:00Z\`)` + UTC getters, since that round-trips any calendar
 * date correctly regardless of the runtime's own timezone) — don't use this function for that.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
