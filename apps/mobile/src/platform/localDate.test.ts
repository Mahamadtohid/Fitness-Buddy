import { getLocalDateString } from './localDate';

describe('getLocalDateString', () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    // UTC+5:30 — matches the PRD's named primary user (a developer in Pune). This is the exact
    // timezone that exposed the bug this function fixes: early-morning local time was being
    // misattributed to the previous UTC calendar day by a naive `toISOString().slice(0, 10)`.
    process.env.TZ = 'Asia/Kolkata';
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('attributes early-morning local time to the correct calendar day, not the earlier UTC one', () => {
    // 2026-03-10 02:00 IST is still 2026-03-09 20:30 UTC.
    const instant = new Date('2026-03-09T20:30:00.000Z');
    expect(getLocalDateString(instant)).toBe('2026-03-10');
  });

  it('agrees with the UTC date once local time is well past midnight', () => {
    // 2026-03-10 17:30 IST is 2026-03-10 12:00 UTC — same calendar day either way.
    const instant = new Date('2026-03-10T12:00:00.000Z');
    expect(getLocalDateString(instant)).toBe('2026-03-10');
  });

  it('defaults to the current moment when no date is passed', () => {
    expect(getLocalDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
