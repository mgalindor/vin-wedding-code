/**
 * PEQUEÑO EXPLORADOR — Deer Planner birthday invitation template.
 *
 * Theme
 * -----
 * Preschool-age birthday (2–5 years). The honoree is the "captain" of their
 * party adventure. Bright primary colors but kid-soft — sun yellow, sky blue,
 * tomato red, apple green — never neon, never pastel. The hero places the
 * child's photo (or a graceful gradient fallback) at the center of an
 * explorer's sky populated by slowly rising hot-air balloons, fluttering
 * kites, twinkling stars and three animal friends (lion cub, giraffe,
 * monkey) cheering from the corners. The kid is the hero of their day —
 * adventurous, joyful, slightly more energetic than a baby template but
 * still innocent and chunky.
 *
 * Palette (exact hex — must not drift)
 * ------------------------------------
 *   Sun yellow     #FFD93D   age circle, explorer badge, count tile, star
 *   Sky blue       #6BCBEF   hero gradient, count tile, borders
 *   Tomato red     #FF6B6B   RSVP button, count tile, badge star
 *   Apple green    #95D44A   count tile, program accents, kite tail
 *   Cream white    #FFFCEF   page background, card surfaces, RSVP label
 *   Text navy      #2C3E50   body text, headings, all dark accents
 *
 * Typography
 * ----------
 *   Display (honoree name, h1/h2):  Fredoka, weights 600/700 — big, rounded
 *   Body / UI (paragraphs, labels): Baloo 2, weights 500-800 — chunkier
 *   Both loaded at runtime via injected Google Fonts <link> elements so the
 *   template stays self-contained.
 *
 * Motion philosophy
 * -----------------
 * Three subtle loops only:
 *   - Hot-air balloons rising slowly (~12s, fade out at top, regenerate)
 *   - Kites fluttering with a tiny rotation (~3s)
 *   - Stars twinkling through an opacity ramp (staggered)
 * Plus a soft pulsing explorer badge. Reduced-motion users see static
 * decorations and disabled transitions — accessibility first.
 */

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface PublicInvitationPageProps {
  honoreeName: string;
  ageTurning?: number | null;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  locations: Array<{
    label: string;
    name: string;
    address?: string;
    city?: string;
    mapsLink?: string;
    time?: string;
  }>;
  program: {
    days: Array<{
      date?: string;
      label?: string;
      items: Array<{ time: string; title: string; detail?: string }>;
    }>;
  };
  rsvpEnabled: boolean;
  onRsvpClick?: () => void;
  locale: 'en' | 'es';
}

type Locale = PublicInvitationPageProps['locale'];

interface LabelSet {
  saveTheDate: string;
  turning: string;
  story: string;
  countdown: string;
  countdownPast: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  locations: string;
  program: string;
  party: string;
  rsvpTitle: string;
  rsvpHint: string;
  rsvp: string;
  viewMap: string;
  poweredBy: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    saveTheDate: 'Adventure Awaits',
    turning: 'turning',
    story: 'The Adventure',
    countdown: 'Countdown',
    countdownPast: "Today's the Day!",
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Where to Find Us',
    program: 'The Journey',
    party: 'Day',
    rsvpTitle: 'Join the Crew!',
    rsvpHint:
      'Pack your explorer spirit — cake and confetti await on the trail!',
    rsvp: 'Count Me In',
    viewMap: 'Open in Maps',
    poweredBy: 'Made with Deer Planner',
  },
  es: {
    saveTheDate: '¡Una Aventura Espera!',
    turning: 'cumple',
    story: 'La Aventura',
    countdown: 'Cuenta Regresiva',
    countdownPast: '¡Hoy es el Día!',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Dónde Encontrarnos',
    program: 'El Viaje',
    party: 'Día',
    rsvpTitle: '¡Únete a la Tripulación!',
    rsvpHint:
      '¡Prepara tu espíritu explorador — la torta y el confeti esperan!',
    rsvp: '¡Yo Voy!',
    viewMap: 'Abrir en Mapa',
    poweredBy: 'Hecho con Deer Planner',
  },
};

const COLOR_YELLOW = '#FFD93D';
const COLOR_BLUE = '#6BCBEF';
const COLOR_RED = '#FF6B6B';
const COLOR_GREEN = '#95D44A';
const COLOR_CREAM = '#FFFCEF';
const COLOR_NAVY = '#2C3E50';

const PALETTE = [COLOR_YELLOW, COLOR_BLUE, COLOR_RED, COLOR_GREEN] as const;

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Baloo+2:wght@500;600;700;800&display=swap';

const DISPLAY_FONT = "'Fredoka', 'Quicksand', system-ui, sans-serif";
const BODY_FONT = "'Baloo 2', 'Helvetica Neue', Arial, sans-serif";

const EXPLORER_STYLES = `
  /* The three signature loops. */
  @keyframes explorer-balloon-rise {
    0%   { transform: translate3d(0, 8vh, 0);  opacity: 0; }
    6%   { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translate3d(0, -115vh, 0); opacity: 0; }
  }
  @keyframes explorer-kite-flutter {
    0%, 100% { transform: rotate(-5deg); }
    50%      { transform: rotate(7deg); }
  }
  @keyframes explorer-star-twinkle {
    0%, 100% { opacity: 0.55; transform: scale(0.92); }
    50%      { opacity: 1;    transform: scale(1.08); }
  }
  @keyframes explorer-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes explorer-badge-pulse {
    0%, 100% { transform: scale(1) rotate(-4deg); }
    50%      { transform: scale(1.08) rotate(6deg); }
  }

  .explorer-balloon {
    position: absolute;
    bottom: -50px;
    will-change: transform, opacity;
    animation-name: explorer-balloon-rise;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    pointer-events: none;
  }
  .explorer-kite {
    position: absolute;
    will-change: transform;
    animation: explorer-kite-flutter 3s ease-in-out infinite;
    pointer-events: none;
    transform-origin: 50% 0%;
  }
  .explorer-kite--slow { animation-duration: 3.6s; }
  .explorer-kite--fast { animation-duration: 2.6s; }

  .explorer-star {
    position: absolute;
    animation: explorer-star-twinkle 2.8s ease-in-out infinite;
    pointer-events: none;
    transform-origin: 50% 50%;
  }

  .explorer-fade-up   { animation: explorer-fade-up 700ms ease-out both; }
  .explorer-fade-up-1 { animation-delay: 120ms; }
  .explorer-fade-up-2 { animation-delay: 240ms; }
  .explorer-fade-up-3 { animation-delay: 360ms; }
  .explorer-fade-up-4 { animation-delay: 480ms; }
  .explorer-fade-up-5 { animation-delay: 600ms; }

  .explorer-card-lift {
    transition: transform 240ms ease-out, box-shadow 240ms ease-out,
                border-color 240ms ease-out;
  }
  .explorer-card-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(44, 62, 80, 0.10);
  }

  .explorer-rsvp-btn {
    position: relative;
    transition: transform 220ms ease-out, box-shadow 220ms ease-out;
  }
  .explorer-rsvp-btn::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 9999px;
    background: ${COLOR_YELLOW};
    opacity: 0;
    transition: opacity 220ms ease-out;
    z-index: -1;
    filter: blur(8px);
  }
  .explorer-rsvp-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 16px 30px rgba(44, 62, 80, 0.22);
  }
  .explorer-rsvp-btn:hover::before {
    opacity: 0.7;
  }
  .explorer-rsvp-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 217, 61, 0.65);
  }

  .explorer-badge-pulse {
    animation: explorer-badge-pulse 2.6s ease-in-out infinite;
    transform-origin: 50% 50%;
  }

  @media (prefers-reduced-motion: reduce) {
    .explorer-balloon,
    .explorer-kite,
    .explorer-star,
    .explorer-badge-pulse {
      animation: none !important;
    }
    .explorer-balloon { opacity: 0.9 !important; transform: translate3d(0, 30vh, 0) !important; }
    .explorer-kite { transform: rotate(0deg) !important; }
    .explorer-star { opacity: 1 !important; transform: scale(1) !important; }
    .explorer-fade-up,
    .explorer-fade-up-1,
    .explorer-fade-up-2,
    .explorer-fade-up-3,
    .explorer-fade-up-4,
    .explorer-fade-up-5 {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .explorer-card-lift,
    .explorer-rsvp-btn {
      transition: none !important;
    }
    .explorer-card-lift:hover,
    .explorer-rsvp-btn:hover {
      transform: none !important;
    }
    .explorer-rsvp-btn::before { display: none !important; }
  }
`;

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useExplorerFonts(): void {
  useEffect(() => {
    const head = document.head;
    const created: HTMLLinkElement[] = [];

    const ensure = (rel: string, href: string, crossOrigin?: string): void => {
      const selector = `link[rel="${rel}"][href="${href}"]`;
      if (head.querySelector(selector)) return;
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossOrigin !== undefined) link.crossOrigin = crossOrigin;
      head.appendChild(link);
      created.push(link);
    };

    ensure('preconnect', 'https://fonts.googleapis.com');
    ensure('preconnect', 'https://fonts.gstatic.com', '');
    ensure('stylesheet', FONT_HREF);

    return () => {
      created.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, []);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Date / countdown helpers
 * ────────────────────────────────────────────────────────────────────────── */

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

function parseIsoDate(iso: string): Date | null {
  const parts = iso.split('-').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return null;
  return new Date(y, m - 1, d);
}

function formatLongDate(iso: string, locale: Locale): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function computeRemaining(targetIso: string, now: Date): Remaining {
  const target = parseIsoDate(targetIso);
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
  const delta = targetMidnight - now.getTime();
  if (delta <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  }
  const totalSeconds = Math.floor(delta / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    past: false,
  };
}

function useCountdown(eventDate: string): Remaining {
  const [remaining, setRemaining] = useState<Remaining>(() =>
    computeRemaining(eventDate, new Date()),
  );
  useEffect(() => {
    setRemaining(computeRemaining(eventDate, new Date()));
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(eventDate, new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [eventDate]);
  return remaining;
}

/** Splits a free-text body into paragraphs on blank lines. */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Decorative atoms — sky, animals, badge
 * ────────────────────────────────────────────────────────────────────────── */

interface HotAirBalloonProps {
  balloonColor: string;
  basketColor: string;
  patternColor: string;
  size?: number;
}

/** A single hot-air balloon with patterned bands and a striped basket. */
function HotAirBalloon({
  balloonColor,
  basketColor,
  patternColor,
  size = 80,
}: HotAirBalloonProps): ReactElement {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} aria-hidden="true">
      <ellipse cx="50" cy="40" rx="32" ry="38" fill={balloonColor} />
      <path
        d="M 50 2 Q 28 40 50 78"
        fill="none"
        stroke={patternColor}
        strokeWidth="2.5"
        opacity="0.75"
      />
      <path
        d="M 50 2 Q 72 40 50 78"
        fill="none"
        stroke={patternColor}
        strokeWidth="2.5"
        opacity="0.75"
      />
      <path
        d="M 30 12 Q 22 40 30 68"
        fill="none"
        stroke={patternColor}
        strokeWidth="2"
        opacity="0.6"
      />
      <path
        d="M 70 12 Q 78 40 70 68"
        fill="none"
        stroke={patternColor}
        strokeWidth="2"
        opacity="0.6"
      />
      <ellipse cx="50" cy="78" rx="14" ry="3" fill={patternColor} opacity="0.4" />
      <line x1="32" y1="76" x2="40" y2="105" stroke={COLOR_NAVY} strokeWidth="1" />
      <line x1="68" y1="76" x2="60" y2="105" stroke={COLOR_NAVY} strokeWidth="1" />
      <line
        x1="50"
        y1="80"
        x2="50"
        y2="105"
        stroke={COLOR_NAVY}
        strokeWidth="1"
        opacity="0.6"
      />
      <rect x="36" y="105" width="28" height="20" fill={basketColor} rx="3" />
      <line
        x1="36"
        y1="115"
        x2="64"
        y2="115"
        stroke={COLOR_NAVY}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="42"
        y1="105"
        x2="42"
        y2="125"
        stroke={COLOR_NAVY}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="50"
        y1="105"
        x2="50"
        y2="125"
        stroke={COLOR_NAVY}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <line
        x1="58"
        y1="105"
        x2="58"
        y2="125"
        stroke={COLOR_NAVY}
        strokeWidth="0.8"
        opacity="0.5"
      />
    </svg>
  );
}

interface BalloonSpec {
  left: number;
  delay: number;
  duration: number;
  balloonColor: string;
  basketColor: string;
  patternColor: string;
  size: number;
}

/** Deterministic four-balloon shower covering the hero width. */
const BALLOONS: BalloonSpec[] = [
  {
    left: 6,
    delay: 0,
    duration: 12,
    balloonColor: COLOR_YELLOW,
    basketColor: COLOR_NAVY,
    patternColor: COLOR_RED,
    size: 72,
  },
  {
    left: 28,
    delay: 3.6,
    duration: 14,
    balloonColor: COLOR_RED,
    basketColor: COLOR_YELLOW,
    patternColor: COLOR_YELLOW,
    size: 80,
  },
  {
    left: 62,
    delay: 1.9,
    duration: 13,
    balloonColor: COLOR_GREEN,
    basketColor: COLOR_RED,
    patternColor: COLOR_YELLOW,
    size: 74,
  },
  {
    left: 84,
    delay: 6.4,
    duration: 15,
    balloonColor: COLOR_BLUE,
    basketColor: COLOR_YELLOW,
    patternColor: '#FFFFFF',
    size: 68,
  },
];

interface KiteProps {
  color: string;
  tailColor: string;
  size?: number;
}

/** A diamond kite with a cross and a wavy tail. */
function Kite({ color, tailColor, size = 56 }: KiteProps): ReactElement {
  return (
    <svg viewBox="0 0 60 100" width={size} height={size * 1.66} aria-hidden="true">
      <polygon points="30,5 55,35 30,65 5,35" fill={color} />
      <line
        x1="30"
        y1="5"
        x2="30"
        y2="65"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        opacity="0.65"
      />
      <line
        x1="5"
        y1="35"
        x2="55"
        y2="35"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        opacity="0.65"
      />
      <path
        d="M 30 65 Q 35 75 30 82 Q 25 88 30 95"
        stroke={tailColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="95" r="2" fill={tailColor} />
    </svg>
  );
}

interface KiteSpec {
  left: string;
  top: string;
  color: string;
  tailColor: string;
  size: number;
  speedClass: 'fast' | 'slow' | '';
  delay: number;
}

const KITES: KiteSpec[] = [
  {
    left: '10%',
    top: '14%',
    color: COLOR_RED,
    tailColor: COLOR_YELLOW,
    size: 52,
    speedClass: 'slow',
    delay: 0,
  },
  {
    left: '70%',
    top: '10%',
    color: COLOR_GREEN,
    tailColor: COLOR_RED,
    size: 60,
    speedClass: '',
    delay: 0.4,
  },
  {
    left: '88%',
    top: '24%',
    color: COLOR_YELLOW,
    tailColor: COLOR_BLUE,
    size: 48,
    speedClass: 'fast',
    delay: 0.8,
  },
];

interface TwinkleStarProps {
  size?: number;
  color?: string;
}

/** Five-point star used both in the sky and as section glyphs. */
function TwinkleStar({
  size = 16,
  color = COLOR_YELLOW,
}: TwinkleStarProps): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <polygon
        points="12,2 14.6,9 22,9.4 16,14 18,21 12,17 6,21 8,14 2,9.4 9.4,9"
        fill={color}
      />
    </svg>
  );
}

interface StarSpec {
  left: string;
  top: string;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

const STARS: StarSpec[] = [
  { left: '5%', top: '18%', size: 18, color: COLOR_YELLOW, delay: 0, duration: 2.6 },
  { left: '22%', top: '8%', size: 14, color: COLOR_YELLOW, delay: 0.5, duration: 3.2 },
  { left: '38%', top: '24%', size: 12, color: COLOR_YELLOW, delay: 1.1, duration: 2.4 },
  { left: '52%', top: '12%', size: 20, color: COLOR_YELLOW, delay: 0.3, duration: 3.0 },
  { left: '78%', top: '32%', size: 16, color: COLOR_YELLOW, delay: 1.4, duration: 2.8 },
  { left: '92%', top: '8%', size: 14, color: COLOR_YELLOW, delay: 0.7, duration: 3.4 },
  { left: '60%', top: '28%', size: 10, color: COLOR_YELLOW, delay: 1.8, duration: 2.5 },
];

interface AnimalProps {
  size?: number;
}

/** A friendly lion cub — golden mane, pink-lined ears, big curious eyes. */
function LionCub({ size = 80 }: AnimalProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="55" r="42" fill={COLOR_YELLOW} />
      <circle cx="50" cy="55" r="32" fill={COLOR_YELLOW} opacity="0.7" />
      <circle cx="50" cy="55" r="28" fill="#FFE3A3" />
      <circle cx="28" cy="38" r="9" fill={COLOR_YELLOW} />
      <circle cx="72" cy="38" r="9" fill={COLOR_YELLOW} />
      <circle cx="28" cy="38" r="5" fill="#F4A6B6" />
      <circle cx="72" cy="38" r="5" fill="#F4A6B6" />
      <circle cx="40" cy="50" r="3.5" fill={COLOR_NAVY} />
      <circle cx="60" cy="50" r="3.5" fill={COLOR_NAVY} />
      <circle cx="41" cy="49" r="1.2" fill="#FFFFFF" />
      <circle cx="61" cy="49" r="1.2" fill="#FFFFFF" />
      <ellipse cx="50" cy="62" rx="4" ry="2.6" fill={COLOR_NAVY} />
      <path
        d="M 50 66 Q 45 72 42 70 M 50 66 Q 55 72 58 70"
        stroke={COLOR_NAVY}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="62"
        x2="22"
        y2="60"
        stroke={COLOR_NAVY}
        strokeWidth="1.2"
      />
      <line
        x1="32"
        y1="65"
        x2="22"
        y2="66"
        stroke={COLOR_NAVY}
        strokeWidth="1.2"
      />
      <line
        x1="68"
        y1="62"
        x2="78"
        y2="60"
        stroke={COLOR_NAVY}
        strokeWidth="1.2"
      />
      <line
        x1="68"
        y1="65"
        x2="78"
        y2="66"
        stroke={COLOR_NAVY}
        strokeWidth="1.2"
      />
    </svg>
  );
}

/** A long-necked giraffe with red spots and tiny ossicones. */
function Giraffe({ size = 80 }: AnimalProps): ReactElement {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} aria-hidden="true">
      <ellipse cx="50" cy="100" rx="28" ry="20" fill={COLOR_YELLOW} />
      <rect x="42" y="40" width="16" height="65" rx="6" fill={COLOR_YELLOW} />
      <ellipse cx="50" cy="32" rx="14" ry="16" fill={COLOR_YELLOW} />
      <line
        x1="44"
        y1="20"
        x2="42"
        y2="8"
        stroke={COLOR_NAVY}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="56"
        y1="20"
        x2="58"
        y2="8"
        stroke={COLOR_NAVY}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="42" cy="8" r="3" fill={COLOR_NAVY} />
      <circle cx="58" cy="8" r="3" fill={COLOR_NAVY} />
      <circle cx="42" cy="55" r="3.5" fill={COLOR_RED} opacity="0.7" />
      <circle cx="55" cy="70" r="3" fill={COLOR_RED} opacity="0.7" />
      <circle cx="38" cy="85" r="4" fill={COLOR_RED} opacity="0.7" />
      <circle cx="60" cy="90" r="3.5" fill={COLOR_RED} opacity="0.7" />
      <circle cx="32" cy="100" r="3" fill={COLOR_RED} opacity="0.7" />
      <circle cx="65" cy="105" r="3.5" fill={COLOR_RED} opacity="0.7" />
      <rect x="32" y="110" width="6" height="18" fill={COLOR_YELLOW} rx="2" />
      <rect x="62" y="110" width="6" height="18" fill={COLOR_YELLOW} rx="2" />
      <circle cx="44" cy="32" r="2.4" fill={COLOR_NAVY} />
      <circle cx="56" cy="32" r="2.4" fill={COLOR_NAVY} />
      <circle cx="45" cy="31" r="0.8" fill="#FFFFFF" />
      <circle cx="57" cy="31" r="0.8" fill="#FFFFFF" />
      <ellipse cx="50" cy="40" rx="3" ry="2" fill={COLOR_NAVY} />
      <path
        d="M 50 42 Q 50 45 47 46"
        stroke={COLOR_NAVY}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 76 95 Q 85 100 82 108"
        stroke={COLOR_YELLOW}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="82" cy="108" r="2.5" fill={COLOR_NAVY} />
    </svg>
  );
}

/** A brown monkey with pale face and a tiny tuft of hair. */
function Monkey({ size = 80 }: AnimalProps): ReactElement {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="20" cy="50" r="12" fill="#8B5A3C" />
      <circle cx="80" cy="50" r="12" fill="#8B5A3C" />
      <circle cx="20" cy="50" r="7" fill="#F4D2B0" />
      <circle cx="80" cy="50" r="7" fill="#F4D2B0" />
      <circle cx="50" cy="50" r="32" fill="#8B5A3C" />
      <ellipse cx="50" cy="56" rx="20" ry="22" fill="#F4D2B0" />
      <ellipse cx="40" cy="48" rx="5" ry="6" fill="#FFFFFF" />
      <ellipse cx="60" cy="48" rx="5" ry="6" fill="#FFFFFF" />
      <circle cx="40" cy="49" r="2.6" fill={COLOR_NAVY} />
      <circle cx="60" cy="49" r="2.6" fill={COLOR_NAVY} />
      <circle cx="41" cy="48" r="0.9" fill="#FFFFFF" />
      <circle cx="61" cy="48" r="0.9" fill="#FFFFFF" />
      <ellipse cx="50" cy="59" rx="3" ry="2" fill={COLOR_NAVY} />
      <path
        d="M 50 63 Q 47 68 44 66 M 50 63 Q 53 68 56 66"
        stroke={COLOR_NAVY}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 45 22 Q 50 12 55 22"
        stroke="#8B5A3C"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="50" cy="14" r="2" fill="#8B5A3C" />
    </svg>
  );
}

interface ExplorerBadgeProps {
  size?: number;
}

/** Circular explorer's badge: yellow ring, cream face, red star inside. */
function ExplorerBadge({ size = 56 }: ExplorerBadgeProps): ReactElement {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill={COLOR_YELLOW} />
      <circle
        cx="40"
        cy="40"
        r="36"
        fill="none"
        stroke={COLOR_NAVY}
        strokeWidth="2"
        strokeDasharray="3 3"
      />
      <circle cx="40" cy="40" r="28" fill="#FFFFFF" />
      <circle
        cx="40"
        cy="40"
        r="28"
        fill="none"
        stroke={COLOR_RED}
        strokeWidth="2"
      />
      <polygon
        points="40,18 44.5,32 59,32 47.4,40.5 51.5,54.5 40,46 28.5,54.5 32.6,40.5 21,32 35.5,32"
        fill={COLOR_RED}
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Section primitives
 * ────────────────────────────────────────────────────────────────────────── */

interface SectionLabelProps {
  children: ReactNode;
  color: string;
}

/** Uppercase, wide-tracked eyebrow with a star glyph on each side. */
function SectionLabel({ children, color }: SectionLabelProps): ReactElement {
  return (
    <div
      className="inline-flex items-center gap-3 text-xs font-bold uppercase sm:text-sm"
      style={{
        fontFamily: BODY_FONT,
        letterSpacing: '0.3em',
        color: COLOR_NAVY,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-px w-8 sm:w-12"
        style={{ backgroundColor: color, opacity: 0.85 }}
      />
      <TwinkleStar size={12} color={COLOR_NAVY} />
      <span>{children}</span>
      <TwinkleStar size={12} color={COLOR_NAVY} />
      <span
        aria-hidden="true"
        className="inline-block h-px w-8 sm:w-12"
        style={{ backgroundColor: color, opacity: 0.85 }}
      />
    </div>
  );
}

interface AgeBadgeProps {
  age: number;
  label: string;
}

/** Sun-yellow circular badge displaying the age in Fredoka. */
function AgeBadge({ age, label }: AgeBadgeProps): ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-full bg-[#FFD93D]"
      style={{
        width: '7rem',
        height: '7rem',
        border: `6px solid #FFFFFF`,
        boxShadow: '0 6px 16px rgba(44, 62, 80, 0.16)',
        fontFamily: DISPLAY_FONT,
        color: COLOR_NAVY,
      }}
    >
      <span style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1 }}>
        {age}
      </span>
      <span
        className="mt-1 text-[0.65rem] uppercase tracking-[0.18em]"
        style={{ fontFamily: BODY_FONT, fontWeight: 700 }}
      >
        {label}
      </span>
    </div>
  );
}

interface CountdownTileProps {
  value: number;
  label: string;
  color: string;
}

/** Single countdown cell — number in Fredoka, label in Baloo 2. */
function CountdownTile({ value, label, color }: CountdownTileProps): ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl px-4 py-6 text-center"
      style={{
        backgroundColor: color,
        color: COLOR_NAVY,
        boxShadow: '0 8px 20px rgba(44, 62, 80, 0.10)',
        fontFamily: DISPLAY_FONT,
        border: '3px solid #FFFFFF',
      }}
    >
      <span style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1 }}>
        {pad(value)}
      </span>
      <span
        className="mt-2 text-[0.7rem] uppercase tracking-[0.22em]"
        style={{ fontFamily: BODY_FONT, fontWeight: 700 }}
      >
        {label}
      </span>
    </div>
  );
}

interface LocationCardProps {
  loc: PublicInvitationPageProps['locations'][number];
  index: number;
  viewMapLabel: string;
}

type AnimalIconComponent = (props: AnimalProps) => ReactElement;
const LOCATION_ANIMALS: ReadonlyArray<AnimalIconComponent> = [
  LionCub,
  Giraffe,
  Monkey,
];

/** A rounded card with a thin border, an animal icon and location details. */
function LocationCard({
  loc,
  index,
  viewMapLabel,
}: LocationCardProps): ReactElement {
  const borderColor = PALETTE[index % PALETTE.length] ?? COLOR_YELLOW;
  const AnimalIcon =
    LOCATION_ANIMALS[index % LOCATION_ANIMALS.length] ?? LionCub;
  const wrapperStyle: CSSProperties = {
    borderColor,
    boxShadow: '0 6px 18px rgba(44, 62, 80, 0.08)',
  };
  return (
    <div
      className="explorer-card-lift flex items-start gap-4 rounded-3xl border-2 bg-[#FFFCEF] p-5 sm:p-6"
      style={wrapperStyle}
    >
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: borderColor }}
      >
        <AnimalIcon size={48} />
      </div>
      <div className="flex-1">
        <p
          className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[#2C3E50]"
          style={{ fontFamily: BODY_FONT }}
        >
          {loc.label}
        </p>
        <h3
          className="mt-1 text-xl font-bold text-[#2C3E50] sm:text-2xl"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          {loc.name}
        </h3>
        {loc.address && (
          <p
            className="mt-1 text-sm text-[#2C3E50]"
            style={{ fontFamily: BODY_FONT }}
          >
            {loc.address}
          </p>
        )}
        {loc.city && (
          <p
            className="text-sm text-[#2C3E50]"
            style={{ fontFamily: BODY_FONT }}
          >
            {loc.city}
          </p>
        )}
        {loc.time && (
          <span
            className="mt-2 inline-block rounded-full bg-[#2C3E50] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#FFFCEF]"
            style={{ fontFamily: BODY_FONT }}
          >
            {loc.time}
          </span>
        )}
        {loc.mapsLink && (
          <a
            href={loc.mapsLink}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.2em] underline decoration-2 underline-offset-4"
            style={{ fontFamily: BODY_FONT, color: COLOR_NAVY }}
          >
            {viewMapLabel}
          </a>
        )}
      </div>
    </div>
  );
}

interface ProgramItemRowProps {
  item: { time: string; title: string; detail?: string };
  index: number;
}

/** Single program row: colored time pill + title + detail. */
function ProgramItemRow({ item, index }: ProgramItemRowProps): ReactElement {
  const color = PALETTE[index % PALETTE.length] ?? COLOR_YELLOW;
  return (
    <div
      className="explorer-card-lift flex items-start gap-4 rounded-2xl border-l-4 bg-[#FFFCEF] p-4 sm:p-5"
      style={{
        borderLeftColor: color,
        boxShadow: '0 4px 12px rgba(44, 62, 80, 0.06)',
      }}
    >
      <div
        className="flex h-12 w-20 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
        style={{
          backgroundColor: color,
          color: COLOR_NAVY,
          fontFamily: DISPLAY_FONT,
        }}
      >
        {item.time}
      </div>
      <div className="flex-1">
        <h4
          className="text-base font-bold text-[#2C3E50] sm:text-lg"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          {item.title}
        </h4>
        {item.detail && (
          <p
            className="mt-1 text-sm text-[#2C3E50]"
            style={{ fontFamily: BODY_FONT }}
          >
            {item.detail}
          </p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main template
 * ────────────────────────────────────────────────────────────────────────── */

export default function PequenoExploradorTemplate(
  props: PublicInvitationPageProps,
): ReactElement {
  const {
    honoreeName,
    ageTurning,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    story,
    locations,
    program,
    rsvpEnabled,
    onRsvpClick,
    locale,
  } = props;

  useExplorerFonts();
  const remaining = useCountdown(eventDate);
  const t = labels[locale];

  const storyParagraphs = story ? toParagraphs(story.body) : [];
  const initial = honoreeName.trim().charAt(0).toUpperCase() || '?';

  const handleRsvpClick = (): void => {
    if (onRsvpClick) onRsvpClick();
  };

  return (
    <article
      className="min-h-screen w-full overflow-x-hidden bg-[#FFFCEF] text-[#2C3E50]"
      style={{ fontFamily: BODY_FONT }}
    >
      <style dangerouslySetInnerHTML={{ __html: EXPLORER_STYLES }} />

      {/* ─────── HERO ─────── */}
      <header
        className="relative w-full overflow-hidden"
        style={{ minHeight: '78vh' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${COLOR_CREAM} 0%, #F0F8FF 55%, ${COLOR_BLUE} 100%)`,
          }}
          aria-hidden="true"
        />

        {BALLOONS.map((b, i) => (
          <div
            key={`balloon-${i}`}
            className="explorer-balloon"
            style={{
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
            aria-hidden="true"
          >
            <HotAirBalloon
              balloonColor={b.balloonColor}
              basketColor={b.basketColor}
              patternColor={b.patternColor}
              size={b.size}
            />
          </div>
        ))}

        {KITES.map((k, i) => (
          <div
            key={`kite-${i}`}
            className={`explorer-kite${
              k.speedClass ? ` explorer-kite--${k.speedClass}` : ''
            }`}
            style={{ left: k.left, top: k.top, animationDelay: `${k.delay}s` }}
            aria-hidden="true"
          >
            <Kite color={k.color} tailColor={k.tailColor} size={k.size} />
          </div>
        ))}

        {STARS.map((s, i) => (
          <div
            key={`star-${i}`}
            className="explorer-star"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
            aria-hidden="true"
          >
            <TwinkleStar size={s.size} color={s.color} />
          </div>
        ))}

        <div className="absolute bottom-4 left-4 hidden md:block" aria-hidden="true">
          <LionCub size={88} />
        </div>
        <div className="absolute bottom-4 right-4 hidden md:block" aria-hidden="true">
          <Monkey size={84} />
        </div>
        <div className="absolute right-6 top-1/3 hidden lg:block" aria-hidden="true">
          <Giraffe size={72} />
        </div>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-16 text-center sm:pt-20">
          <div className="explorer-fade-up explorer-fade-up-1">
            <SectionLabel color={COLOR_RED}>{t.saveTheDate}</SectionLabel>
          </div>

          <div className="explorer-fade-up explorer-fade-up-2 mt-8">
            {heroImageUrl ? (
              <div
                className="overflow-hidden rounded-full"
                style={{
                  width: 'min(70vw, 260px)',
                  height: 'min(70vw, 260px)',
                  border: `8px solid ${COLOR_YELLOW}`,
                  boxShadow: '0 12px 30px rgba(44, 62, 80, 0.20)',
                  background: `linear-gradient(135deg, ${COLOR_CREAM}, ${COLOR_BLUE})`,
                }}
              >
                <img
                  src={heroImageUrl}
                  alt={honoreeName}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 'min(70vw, 260px)',
                  height: 'min(70vw, 260px)',
                  background: `linear-gradient(135deg, ${COLOR_CREAM}, ${COLOR_BLUE})`,
                  border: `8px solid ${COLOR_YELLOW}`,
                  boxShadow: '0 12px 30px rgba(44, 62, 80, 0.20)',
                }}
                aria-label={honoreeName}
              >
                <span
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 700,
                    fontSize: 'min(18vw, 84px)',
                    color: COLOR_NAVY,
                    lineHeight: 1,
                  }}
                >
                  {initial}
                </span>
              </div>
            )}
          </div>

          <h1
            className="explorer-fade-up explorer-fade-up-3 mt-8 text-5xl font-bold leading-[1.05] sm:text-7xl"
            style={{ fontFamily: DISPLAY_FONT, color: COLOR_NAVY }}
          >
            {honoreeName}
          </h1>

          {landingSubtitle ? (
            <p
              className="explorer-fade-up explorer-fade-up-3 mt-3 max-w-xl text-base sm:text-lg"
              style={{ fontFamily: BODY_FONT, color: COLOR_NAVY, opacity: 0.85 }}
            >
              {landingSubtitle}
            </p>
          ) : null}

          {typeof ageTurning === 'number' ? (
            <div className="explorer-fade-up explorer-fade-up-4 mt-6 flex items-center justify-center gap-5">
              <div className="explorer-badge-pulse">
                <ExplorerBadge size={64} />
              </div>
              <AgeBadge age={ageTurning} label={t.turning} />
            </div>
          ) : null}

          <div className="explorer-fade-up explorer-fade-up-5 mt-8">
            <p
              className="text-lg font-bold uppercase tracking-[0.28em] sm:text-xl"
              style={{ fontFamily: BODY_FONT, color: COLOR_NAVY }}
            >
              {landingTitle ?? formatLongDate(eventDate, locale)}
            </p>
            {landingTitle ? (
              <p
                className="mt-2 text-base sm:text-lg"
                style={{ fontFamily: BODY_FONT, color: COLOR_NAVY }}
              >
                {formatLongDate(eventDate, locale)}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {/* ─────── STORY ─────── */}
      {story && storyParagraphs.length > 0 ? (
        <section className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <SectionLabel color={COLOR_BLUE}>{t.story}</SectionLabel>
          </div>
          <div
            className="mt-6 rounded-3xl border-2 bg-[#FFFCEF] p-8 sm:p-10"
            style={{
              borderColor: COLOR_BLUE,
              boxShadow: '0 8px 22px rgba(44, 62, 80, 0.08)',
            }}
          >
            {storyParagraphs.map((p, i) => (
              <p
                key={`story-p-${i}`}
                className="text-base leading-relaxed sm:text-lg"
                style={{ fontFamily: BODY_FONT, color: COLOR_NAVY }}
              >
                {p}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {/* ─────── COUNTDOWN ─────── */}
      <section className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="text-center">
          <SectionLabel color={COLOR_YELLOW}>{t.countdown}</SectionLabel>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <CountdownTile value={remaining.days} label={t.days} color={COLOR_YELLOW} />
          <CountdownTile value={remaining.hours} label={t.hours} color={COLOR_BLUE} />
          <CountdownTile
            value={remaining.minutes}
            label={t.minutes}
            color={COLOR_RED}
          />
          <CountdownTile
            value={remaining.seconds}
            label={t.seconds}
            color={COLOR_GREEN}
          />
        </div>
        {remaining.past ? (
          <p
            className="mt-6 text-center text-base font-bold"
            style={{ fontFamily: DISPLAY_FONT, color: COLOR_NAVY }}
          >
            {t.countdownPast}
          </p>
        ) : null}
      </section>

      {/* ─────── LOCATIONS ─────── */}
      {locations.length > 0 ? (
        <section className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <div className="text-center">
            <SectionLabel color={COLOR_RED}>{t.locations}</SectionLabel>
          </div>
          <div className="mt-8 grid gap-4">
            {locations.map((loc, i) => (
              <LocationCard
                key={`loc-${i}`}
                loc={loc}
                index={i}
                viewMapLabel={t.viewMap}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ─────── PROGRAM ─────── */}
      {program.days.length > 0 ? (
        <section className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <div className="text-center">
            <SectionLabel color={COLOR_GREEN}>{t.program}</SectionLabel>
          </div>
          <div className="mt-8 space-y-10">
            {program.days.map((day, di) => (
              <div key={`day-${di}`}>
                <h2
                  className="mb-4 flex flex-wrap items-baseline gap-2 text-2xl font-bold sm:text-3xl"
                  style={{ fontFamily: DISPLAY_FONT, color: COLOR_NAVY }}
                >
                  <span>{day.label ?? t.party}</span>
                  {day.date ? (
                    <span
                      className="text-sm font-bold uppercase tracking-[0.25em]"
                      style={{
                        fontFamily: BODY_FONT,
                        color: COLOR_NAVY,
                        opacity: 0.7,
                      }}
                    >
                      {formatLongDate(day.date, locale)}
                    </span>
                  ) : null}
                </h2>
                <div className="space-y-3">
                  {day.items.map((item, ii) => (
                    <ProgramItemRow
                      key={`item-${di}-${ii}`}
                      item={item}
                      index={ii}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ─────── RSVP CTA ─────── */}
      {rsvpEnabled ? (
        <section className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <div className="flex justify-center">
            <SectionLabel color={COLOR_RED}>RSVP</SectionLabel>
          </div>
          <h2
            className="mt-4 text-3xl font-bold sm:text-5xl"
            style={{ fontFamily: DISPLAY_FONT, color: COLOR_NAVY }}
          >
            {t.rsvpTitle}
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-base sm:text-lg"
            style={{ fontFamily: BODY_FONT, color: COLOR_NAVY }}
          >
            {t.rsvpHint}
          </p>
          <button
            type="button"
            onClick={handleRsvpClick}
            className="explorer-rsvp-btn mt-8 inline-flex items-center justify-center rounded-full px-10 py-4 text-lg font-bold uppercase tracking-[0.22em]"
            style={{
              backgroundColor: COLOR_RED,
              color: COLOR_CREAM,
              fontFamily: BODY_FONT,
              boxShadow: '0 10px 22px rgba(255, 107, 107, 0.45)',
            }}
          >
            <TwinkleStar size={16} color={COLOR_CREAM} />
            <span className="mx-3">{t.rsvp}</span>
            <TwinkleStar size={16} color={COLOR_CREAM} />
          </button>
        </section>
      ) : null}

      {/* ─────── FOOTER ─────── */}
      <footer className="border-t-2 border-[#2C3E50]/10 bg-[#FFFCEF] px-6 py-8 text-center">
        <p
          className="text-sm font-bold uppercase tracking-[0.3em]"
          style={{ fontFamily: BODY_FONT, color: COLOR_NAVY }}
        >
          {t.poweredBy}
        </p>
      </footer>
    </article>
  );
}
