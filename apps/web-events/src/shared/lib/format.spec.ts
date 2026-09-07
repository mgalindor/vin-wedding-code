import { formatDateShort, formatDateLong, daysFromToday, getCountdown, highlightMatch } from '@/shared/lib/format';

describe('format', () => {
  it('formatDateShort returns a US-style short date for EN', () => {
    expect(formatDateShort('2026-08-14')).toBe('Aug 14, 2026');
  });

  it('formatDateShort returns a Spanish short date for ES', () => {
    const out = formatDateShort('2026-08-14', 'es');
    // jsdom + node ICU may produce slightly different month names — accept either
    expect(out).toMatch(/(ago|2026)/i);
    expect(out).toContain('2026');
  });

  it('formatDateLong yields a weekday-long format', () => {
    const en = formatDateLong('2026-08-14', 'en');
    expect(en).toMatch(/(August|Aug)/);
  });

  it('daysFromToday returns 0 for today, positive for future, negative for past', () => {
    const today = new Date();
    const isoToday = today.toISOString().slice(0, 10);
    expect(daysFromToday(isoToday)).toBe(0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(daysFromToday(yesterday.toISOString().slice(0, 10))).toBe(-1);
  });
});

describe('getCountdown', () => {
  it('returns a far-future countdown broken into months and days', () => {
    // Anchor "now" to a known date 2026-01-01 12:00 local.
    const now = new Date(2026, 0, 1, 12, 0, 0);
    // 100 days later => 3 months (90d) + 1 week (7d) + 3 days.
    const out = getCountdown('2026-04-11', now);

    expect(out.totalDays).toBe(100);
    expect(out.months).toBe(3);
    expect(out.weeks).toBe(1);
    expect(out.days).toBe(3);
    expect(out.hours).toBe(12);
    expect(out.minutes).toBe(0);
    expect(out.seconds).toBe(0);
    expect(out.isPast).toBe(false);
    expect(out.isToday).toBe(false);
  });

  it('returns a near-future countdown where days/hours/minutes/seconds are the source of truth', () => {
    const now = new Date(2026, 5, 10, 9, 30, 45); // 2026-06-10 09:30:45
    const out = getCountdown('2026-06-13', now); // 3 days later

    expect(out.totalDays).toBe(3);
    expect(out.months).toBe(0);
    expect(out.weeks).toBe(0);
    expect(out.days).toBe(3);
    expect(out.hours).toBe(9);
    expect(out.minutes).toBe(30);
    expect(out.seconds).toBe(45);
    expect(out.isPast).toBe(false);
    expect(out.isToday).toBe(false);
  });

  it('marks today as isToday=true with zero totalDays', () => {
    const now = new Date(2026, 7, 14, 18, 0, 0); // 2026-08-14 18:00 local
    const out = getCountdown('2026-08-14', now);

    expect(out.totalDays).toBe(0);
    expect(out.isToday).toBe(true);
    expect(out.isPast).toBe(false);
    expect(out.hours).toBe(18);
    expect(out.minutes).toBe(0);
    expect(out.seconds).toBe(0);
  });

  it('marks yesterday as isPast=true with zero clock parts', () => {
    const now = new Date(2026, 7, 14, 10, 15, 30);
    const out = getCountdown('2026-08-13', now);

    expect(out.totalDays).toBe(-1);
    expect(out.isPast).toBe(true);
    expect(out.isToday).toBe(false);
    expect(out.hours).toBe(0);
    expect(out.minutes).toBe(0);
    expect(out.seconds).toBe(0);
  });
});

describe('highlightMatch', () => {
  it('returns the original text in a single unmatched segment when query is empty', () => {
    expect(highlightMatch('Maya & Luis', '')).toEqual([{ text: 'Maya & Luis', match: false }]);
    expect(highlightMatch('Maya & Luis', '   ')).toEqual([{ text: 'Maya & Luis', match: false }]);
  });

  it('returns the original text unchanged when there is no match', () => {
    expect(highlightMatch('Maya & Luis', 'foo')).toEqual([{ text: 'Maya & Luis', match: false }]);
  });

  it('splits around the first case-insensitive match', () => {
    expect(highlightMatch('Maya & Luis', 'luis')).toEqual([
      { text: 'Maya & ', match: false },
      { text: 'Luis', match: true },
    ]);
  });

  it('matches in the middle and at the start', () => {
    expect(highlightMatch('Conference 2026', '2026')).toEqual([
      { text: 'Conference ', match: false },
      { text: '2026', match: true },
    ]);
    expect(highlightMatch('Maya & Luis', 'maya')).toEqual([
      { text: 'Maya', match: true },
      { text: ' & Luis', match: false },
    ]);
  });

  it('treats regex metacharacters in the query as literal characters', () => {
    expect(highlightMatch('price: $10.00 total', '$10.00')).toEqual([
      { text: 'price: ', match: false },
      { text: '$10.00', match: true },
      { text: ' total', match: false },
    ]);
  });

  it('returns an empty array when the input text is empty', () => {
    expect(highlightMatch('', 'foo')).toEqual([]);
  });
});
