/**
 * Small, generic display formatters. No business logic — keep them
 * pure so they're trivially testable.
 */

/**
 * Format an ISO date string (YYYY-MM-DD) as a localised short date
 * (`Aug 14, 2026`). Parses the string explicitly to avoid TZ drift.
 */
export function formatDateShort(iso: string, locale = 'en'): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(year, month - 1, day));
  } catch {
    return iso;
  }
}

/** Long format: "Saturday, August 14, 2026". */
export function formatDateLong(iso: string, locale = 'en'): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(year, month - 1, day));
  } catch {
    return iso;
  }
}

/** Days from today to `iso`. Positive = future, negative = past. */
export function daysFromToday(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return 0;
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Pull the integer count from an "X events" badge. */
export function formatCount(n: number, locale = 'en'): string {
  try {
    return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US').format(n);
  } catch {
    return String(n);
  }
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Escape regex meta-characters so a user-typed query is treated literally. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split `text` into segments around the (case-insensitive) first occurrence of
 * `query`. The matched slice is flagged `match: true` so callers can wrap it in
 * a `<mark>`. Returns the original text unchanged when `query` is empty or
 * whitespace, or when there is no match.
 */
export function highlightMatch(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const trimmed = query.trim();
  if (!trimmed) return [{ text, match: false }];
  const re = new RegExp(escapeRegExp(trimmed), 'i');
  const m = re.exec(text);
  if (!m || m.index === undefined) return [{ text, match: false }];
  const start = m.index;
  const end = start + m[0].length;
  const out: HighlightSegment[] = [];
  if (start > 0) out.push({ text: text.slice(0, start), match: false });
  out.push({ text: text.slice(start, end), match: true });
  if (end < text.length) out.push({ text: text.slice(end), match: false });
  return out;
}

/**
 * Result of {@link getCountdown}. `months`, `weeks` and `days` are
 * only meaningful when `totalDays >= 30`; for shorter spans the
 * countdown UI shows `days`/`hours`/`minutes`/`seconds` directly.
 */
export interface Countdown {
  /** Whole days to the target date. Positive = future, 0 = today, negative = past. */
  totalDays: number;
  /** Complete ~30-day months remaining — populated only when `totalDays >= 30`. */
  months: number;
  /** Complete weeks remaining after subtracting months — populated only when `totalDays >= 30`. */
  weeks: number;
  /** Days remaining after subtracting months and weeks. */
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isToday: boolean;
}

/**
 * Compute a countdown to an ISO date string (`YYYY-MM-DD`). Parses the
 * string explicitly via `split` to avoid the TZ drift that `new Date(iso)`
 * would introduce across midnight in negative offsets.
 *
 * The `totalDays` math uses `now` zeroed to 00:00 local so the boundary
 * between "yesterday" and "today" matches the user's calendar. The
 * hours/minutes/seconds use the actual wall-clock time of `now` so a
 * countdown to today's event reads as a live timer.
 */
export function getCountdown(iso: string, now: Date = new Date()): Countdown {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) {
    return {
      totalDays: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: false,
      isToday: true,
    };
  }

  const target = new Date(year, month - 1, day);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const totalDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  const isPast = totalDays < 0;
  const isToday = totalDays === 0;

  if (isPast) {
    return {
      totalDays,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      isToday: false,
    };
  }

  const months = Math.floor(totalDays / 30);
  const weeks = Math.floor((totalDays % 30) / 7);
  const days = totalDays % 30 % 7;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  return {
    totalDays,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    isToday,
  };
}
