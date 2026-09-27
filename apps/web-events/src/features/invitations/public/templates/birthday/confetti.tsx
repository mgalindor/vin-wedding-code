/**
 * CONFETTI — Deer Planner birthday invitation template.
 *
 * Theme
 * -----
 * A cheerful, multicolor-pastel kids' birthday invitation. The hero is
 * showered with inline SVG confetti — circles, triangles and ribbon rectangles —
 * that fall and rotate on an infinite CSS loop, each piece staggered by a
 * unique delay and duration for a natural, joyous shower. Sections are rendered
 * as soft, generously rounded cards with gentle drop shadows; section labels
 * are wide-tracked uppercase text accompanied by a small party-popper accent.
 *
 * Palette (exact hex — must not drift)
 * ------------------------------------
 *   Pastel pink    #FFD6E0   primary hero tone, RSVP hover halo
 *   Sky blue       #C7E9FF   countdown tiles, RSVP base
 *   Sun yellow     #FFF3B0   countdown tiles, story card
 *   Mint green     #A8E6CF   countdown tiles, age badge border
 *   Text dark      #3D3D3D   body text, headings, dark accents
 *
 * Typography
 * ----------
 *   Display (honoree name, h1/h2):  Fredoka   — rounded, friendly
 *   Body / UI (paragraphs, labels): Nunito    — soft, readable
 *   Both are loaded at runtime via injected Google Fonts <link> elements so
 *   the template stays self-contained.
 *
 * Motion philosophy
 * -----------------
 * Two loops total: the confetti shower (subtle, slow) and a micro bounce on
 * interactive elements (RSVP button, location/program cards). Reduced-motion
 * users see static confetti and disabled transitions — accessibility first.
 */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface PublicInvitationPageProps {
  honoreeName: string;
  ageTurning?: number | null;
  eventDate: string; // ISO date e.g. '2026-11-08'
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
  rsvpTitle: string;
  rsvpHint: string;
  rsvp: string;
  viewMap: string;
  poweredBy: string;
  party: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    saveTheDate: "You're Invited",
    turning: 'Turning',
    story: 'Our Story',
    countdown: 'Countdown',
    countdownPast: 'Today is the Day!',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Where',
    program: 'The Party',
    rsvpTitle: 'Will You Join Us?',
    rsvpHint: "Let us know you're coming — cake won't wait forever!",
    rsvp: "I'll be there!",
    viewMap: 'Open in Maps',
    poweredBy: 'Made with Deer Planner',
    party: 'Party',
  },
  es: {
    saveTheDate: 'Estás Invitado',
    turning: 'Cumple',
    story: 'Nuestra Historia',
    countdown: 'Cuenta Regresiva',
    countdownPast: '¡Hoy es el Día!',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Dónde',
    program: 'La Fiesta',
    rsvpTitle: '¿Nos Acompañas?',
    rsvpHint: '¡Confirmanos tu asistencia — la torta no espera!',
    rsvp: '¡Allí estaré!',
    viewMap: 'Abrir en Mapa',
    poweredBy: 'Hecho con Deer Planner',
    party: 'Fiesta',
  },
};

const COLOR_PINK = '#FFD6E0';
const COLOR_BLUE = '#C7E9FF';
const COLOR_YELLOW = '#FFF3B0';
const COLOR_MINT = '#A8E6CF';
const COLOR_DARK = '#3D3D3D';

const PALETTE = [COLOR_PINK, COLOR_BLUE, COLOR_YELLOW, COLOR_MINT] as const;
type Tone = 'pink' | 'blue' | 'yellow' | 'mint';

const TONE_BG: Record<Tone, string> = {
  pink: COLOR_PINK,
  blue: COLOR_BLUE,
  yellow: COLOR_YELLOW,
  mint: COLOR_MINT,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap';

const DISPLAY_FONT = "'Fredoka', 'Quicksand', system-ui, sans-serif";
const BODY_FONT = "'Nunito', 'Helvetica Neue', Arial, sans-serif";

const CONFETTI_STYLES = `
  /* The one big loop: confetti falling + rotating across the hero. */
  @keyframes confetti-fall {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg);   opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
  }
  @keyframes confetti-fall-drift-left {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg);   opacity: 0; }
    8%   { opacity: 1; }
    50%  { transform: translate3d(-40px, 50vh, 0) rotate(360deg); opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translate3d(-80px, 110vh, 0) rotate(720deg); opacity: 0; }
  }
  @keyframes confetti-fall-drift-right {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg);   opacity: 0; }
    8%   { opacity: 1; }
    50%  { transform: translate3d(40px, 50vh, 0) rotate(360deg); opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translate3d(80px, 110vh, 0) rotate(720deg); opacity: 0; }
  }
  .confetti-piece {
    position: absolute;
    top: 0;
    will-change: transform, opacity;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  .confetti-piece--drift-left  { animation-name: confetti-fall-drift-left; }
  .confetti-piece--drift-right { animation-name: confetti-fall-drift-right; }
  .confetti-piece--straight    { animation-name: confetti-fall; }

  /* Subtle fade-up for hero content blocks. */
  @keyframes confetti-rise {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .confetti-rise      { animation: confetti-rise 700ms ease-out both; }
  .confetti-rise-1    { animation-delay: 120ms; }
  .confetti-rise-2    { animation-delay: 240ms; }
  .confetti-rise-3    { animation-delay: 360ms; }
  .confetti-rise-4    { animation-delay: 480ms; }

  /* Interactive cards lift gently on hover. */
  .confetti-card-lift {
    transition: transform 260ms ease-out, box-shadow 260ms ease-out;
  }
  .confetti-card-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(61, 61, 61, 0.12);
  }

  /* RSVP bounce button. */
  .confetti-rsvp-btn {
    transition: transform 220ms ease-out, box-shadow 220ms ease-out,
                background-color 220ms ease-out;
  }
  .confetti-rsvp-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 16px 30px rgba(199, 233, 255, 0.55);
    background-color: ${COLOR_PINK};
    color: ${COLOR_DARK};
  }
  .confetti-rsvp-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 214, 224, 0.75);
  }

  @media (prefers-reduced-motion: reduce) {
    .confetti-piece {
      animation: none !important;
      opacity: 0.85 !important;
      top: 20% !important;
      transform: none !important;
    }
    .confetti-rise,
    .confetti-rise-1,
    .confetti-rise-2,
    .confetti-rise-3,
    .confetti-rise-4 {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .confetti-card-lift,
    .confetti-rsvp-btn {
      transition: none !important;
    }
    .confetti-card-lift:hover,
    .confetti-rsvp-btn:hover {
      transform: none !important;
    }
  }
`;

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useConfettiFonts(): void {
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
 * Decorative atoms
 * ────────────────────────────────────────────────────────────────────────── */

interface ConfettiPieceSpec {
  left: number; // 0..100  (percent)
  shape: 'circle' | 'triangle' | 'ribbon';
  color: string;
  size: number; // px
  delay: number; // seconds
  duration: number; // seconds
  drift: 'left' | 'right' | 'straight';
  initialRotate: number; // degrees
}

/** Deterministic 24-piece shower covering the full hero width. */
const CONFETTI_PIECES: ConfettiPieceSpec[] = [
  { left: 3,   shape: 'circle',   color: COLOR_PINK,   size: 14, delay: 0.0,  duration: 11, drift: 'straight', initialRotate: 12 },
  { left: 8,   shape: 'triangle', color: COLOR_BLUE,   size: 18, delay: 1.4,  duration: 13, drift: 'right',    initialRotate: -18 },
  { left: 14,  shape: 'ribbon',   color: COLOR_YELLOW, size: 16, delay: 0.6,  duration: 12, drift: 'left',     initialRotate: 24 },
  { left: 19,  shape: 'circle',   color: COLOR_MINT,   size: 12, delay: 2.1,  duration: 14, drift: 'straight', initialRotate: 0 },
  { left: 24,  shape: 'triangle', color: COLOR_PINK,   size: 16, delay: 3.2,  duration: 12, drift: 'right',    initialRotate: 30 },
  { left: 30,  shape: 'circle',   color: COLOR_YELLOW, size: 14, delay: 1.9,  duration: 15, drift: 'left',     initialRotate: -10 },
  { left: 36,  shape: 'ribbon',   color: COLOR_PINK,   size: 18, delay: 0.3,  duration: 13, drift: 'straight', initialRotate: 45 },
  { left: 41,  shape: 'triangle', color: COLOR_MINT,   size: 14, delay: 2.7,  duration: 11, drift: 'right',    initialRotate: -25 },
  { left: 47,  shape: 'circle',   color: COLOR_BLUE,   size: 16, delay: 1.1,  duration: 12, drift: 'left',     initialRotate: 15 },
  { left: 52,  shape: 'ribbon',   color: COLOR_BLUE,   size: 14, delay: 3.5,  duration: 14, drift: 'straight', initialRotate: -32 },
  { left: 57,  shape: 'circle',   color: COLOR_PINK,   size: 12, delay: 0.9,  duration: 13, drift: 'left',     initialRotate: 0 },
  { left: 62,  shape: 'triangle', color: COLOR_YELLOW, size: 18, delay: 2.4,  duration: 12, drift: 'right',    initialRotate: 20 },
  { left: 68,  shape: 'ribbon',   color: COLOR_MINT,   size: 16, delay: 1.6,  duration: 15, drift: 'straight', initialRotate: -15 },
  { left: 73,  shape: 'circle',   color: COLOR_YELLOW, size: 14, delay: 3.8,  duration: 11, drift: 'right',    initialRotate: 40 },
  { left: 78,  shape: 'triangle', color: COLOR_PINK,   size: 14, delay: 0.5,  duration: 13, drift: 'left',     initialRotate: -8 },
  { left: 83,  shape: 'circle',   color: COLOR_MINT,   size: 12, delay: 2.9,  duration: 14, drift: 'straight', initialRotate: 22 },
  { left: 88,  shape: 'ribbon',   color: COLOR_PINK,   size: 16, delay: 1.2,  duration: 12, drift: 'right',    initialRotate: -28 },
  { left: 93,  shape: 'triangle', color: COLOR_BLUE,   size: 14, delay: 3.3,  duration: 13, drift: 'left',     initialRotate: 14 },
  { left: 6,   shape: 'circle',   color: COLOR_BLUE,   size: 10, delay: 4.2,  duration: 12, drift: 'right',    initialRotate: 0 },
  { left: 32,  shape: 'triangle', color: COLOR_MINT,   size: 12, delay: 4.6,  duration: 14, drift: 'left',     initialRotate: -20 },
  { left: 45,  shape: 'ribbon',   color: COLOR_YELLOW, size: 12, delay: 5.0,  duration: 13, drift: 'right',    initialRotate: 32 },
  { left: 60,  shape: 'circle',   color: COLOR_PINK,   size: 10, delay: 5.4,  duration: 15, drift: 'straight', initialRotate: 6 },
  { left: 76,  shape: 'triangle', color: COLOR_MINT,   size: 12, delay: 5.8,  duration: 12, drift: 'left',     initialRotate: -14 },
  { left: 97,  shape: 'circle',   color: COLOR_YELLOW, size: 10, delay: 6.2,  duration: 14, drift: 'right',    initialRotate: 18 },
];

interface ConfettiShapeProps {
  shape: ConfettiPieceSpec['shape'];
  color: string;
  size: number;
}

/** A single colored SVG shape rendered at the piece's local origin. */
function ConfettiShape({ shape, color, size }: ConfettiShapeProps): ReactElement {
  if (shape === 'circle') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <polygon
          points={`${size / 2},0 ${size},${size} 0,${size}`}
          fill={color}
        />
      </svg>
    );
  }
  // ribbon
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect
        x={size * 0.1}
        y={size * 0.3}
        width={size * 0.8}
        height={size * 0.4}
        rx={size * 0.08}
        fill={color}
      />
    </svg>
  );
}

interface ConfettiPieceProps extends ConfettiPieceSpec {}

/** One absolute-positioned, infinitely falling confetti piece. */
function ConfettiPiece(props: ConfettiPieceProps): ReactElement {
  const { left, shape, color, size, delay, duration, drift, initialRotate } = props;
  const driftClass =
    drift === 'left'
      ? 'confetti-piece--drift-left'
      : drift === 'right'
      ? 'confetti-piece--drift-right'
      : 'confetti-piece--straight';
  const style: CSSProperties = {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    transform: `rotate(${initialRotate}deg)`,
  };
  return (
    <span
      className={`confetti-piece pointer-events-none ${driftClass}`}
      style={style}
      aria-hidden="true"
    >
      <ConfettiShape shape={shape} color={color} size={size} />
    </span>
  );
}

/** Tiny party-popper accent drawn next to section labels. */
function PartyPopperAccent({ className }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      aria-hidden="true"
    >
      {/* Popper cone */}
      <polygon points="4,24 14,8 24,24" fill={COLOR_PINK} />
      <polygon points="4,24 14,8 14,24" fill={COLOR_BLUE} />
      {/* Popper rim */}
      <ellipse cx="14" cy="9" rx="6" ry="1.6" fill={COLOR_DARK} opacity="0.18" />
      {/* Confetti dots flying out */}
      <circle cx="20" cy="6"  r="1.6" fill={COLOR_YELLOW} />
      <circle cx="24" cy="10" r="1.4" fill={COLOR_MINT} />
      <circle cx="17" cy="3"  r="1.2" fill={COLOR_PINK} />
      <rect   x="22" y="3"   width="2.4" height="2.4" rx="0.6" fill={COLOR_BLUE} transform="rotate(20 23.2 4.2)" />
      <polygon points="26,6 28,4 27,8" fill={COLOR_YELLOW} />
    </svg>
  );
}

interface SectionLabelProps {
  children: ReactNode;
  tone?: Tone;
}

/** Uppercase, wide-tracked eyebrow with a small party-popper. */
function SectionLabel({ children, tone = 'pink' }: SectionLabelProps): ReactElement {
  return (
    <div
      className="inline-flex items-center gap-3 text-[0.7rem] font-bold uppercase sm:text-xs"
      style={{
        fontFamily: BODY_FONT,
        letterSpacing: '0.3em',
        color: COLOR_DARK,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-px w-6 sm:w-10"
        style={{ backgroundColor: TONE_BG[tone], opacity: 0.7 }}
      />
      <PartyPopperAccent className="h-5 w-5" />
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="inline-block h-px w-6 sm:w-10"
        style={{ backgroundColor: TONE_BG[tone], opacity: 0.7 }}
      />
    </div>
  );
}

interface AgeBadgeProps {
  age: number;
  label: string;
}

/** Circular mint-bordered badge with the age in Fredoka. */
function AgeBadge({ age, label }: AgeBadgeProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full bg-white"
        style={{
          width: '7.5rem',
          height: '7.5rem',
          border: `6px solid ${COLOR_MINT}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <span
          className="text-5xl leading-none"
          style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_DARK }}
        >
          {age}
        </span>
      </div>
      <span
        className="text-[0.65rem] font-bold uppercase"
        style={{ fontFamily: BODY_FONT, letterSpacing: '0.3em', color: COLOR_DARK, opacity: 0.7 }}
      >
        {label}
      </span>
    </div>
  );
}

interface CountdownTileProps {
  value: string;
  caption: string;
  tone: Tone;
}

/** One rounded pastel tile for the countdown grid. */
function CountdownTile({ value, caption, tone }: CountdownTileProps): ReactElement {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-4 py-6 sm:px-6 sm:py-7"
      style={{
        backgroundColor: TONE_BG[tone],
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <span
        className="text-4xl leading-none sm:text-5xl"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 600,
          color: COLOR_DARK,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span
        className="mt-3 text-[0.65rem] font-bold uppercase sm:text-[0.7rem]"
        style={{ fontFamily: BODY_FONT, letterSpacing: '0.3em', color: COLOR_DARK, opacity: 0.75 }}
      >
        {caption}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────────────────── */

export default function ConfettiTemplate(props: PublicInvitationPageProps): ReactElement {
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

  useConfettiFonts();

  const t = labels[locale];
  const remaining = useCountdown(eventDate);
  const longDate = formatLongDate(eventDate, locale);
  const hasStory = Boolean(story && story.body.trim().length > 0);
  const hasLocations = locations.length > 0;
  const programDays = program.days.filter((day) => day.items.length > 0);
  const showAge = typeof ageTurning === 'number' && ageTurning > 0;

  const heroFallbackStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${COLOR_PINK} 0%, ${COLOR_BLUE} 35%, ${COLOR_YELLOW} 70%, ${COLOR_MINT} 100%)`,
  };

  return (
    <div
      className="confetti-root min-h-screen w-full antialiased"
      style={{
        fontFamily: BODY_FONT,
        color: COLOR_DARK,
        backgroundColor: COLOR_PINK,
      }}
    >
      <style>{CONFETTI_STYLES}</style>

      <main>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <header
          className="relative overflow-hidden"
          style={heroImageUrl ? undefined : heroFallbackStyle}
        >
          {heroImageUrl ? (
            <>
              <img
                src={heroImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.55) 100%)',
                }}
              />
            </>
          ) : null}

          {/* Confetti shower — absolutely positioned pieces covering the hero. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {CONFETTI_PIECES.map((piece, i) => (
              <ConfettiPiece key={i} {...piece} />
            ))}
          </div>

          <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center justify-center px-6 pb-24 pt-28 text-center sm:pt-36">
            <div className="confetti-rise">
              <span
                className="inline-flex items-center gap-3 rounded-full bg-white/85 px-5 py-2 text-[0.7rem] font-bold uppercase backdrop-blur-sm sm:text-xs"
                style={{
                  fontFamily: BODY_FONT,
                  letterSpacing: '0.3em',
                  color: COLOR_DARK,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                <PartyPopperAccent className="h-5 w-5" />
                {t.saveTheDate}
              </span>
            </div>

            <h1
              className="confetti-rise confetti-rise-1 mt-10 text-6xl leading-[1.05] sm:text-7xl md:text-[6rem]"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                color: COLOR_DARK,
                textShadow: '0 2px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              {honoreeName}
            </h1>

            {showAge && ageTurning != null ? (
              <div className="confetti-rise confetti-rise-2 mt-10">
                <AgeBadge age={ageTurning} label={t.turning} />
              </div>
            ) : null}

            <div className="confetti-rise confetti-rise-3 mt-10 flex items-center gap-4">
              <span aria-hidden="true" className="inline-block h-px w-12" style={{ backgroundColor: COLOR_DARK, opacity: 0.25 }} />
              <p
                className="text-sm font-bold uppercase"
                style={{ fontFamily: BODY_FONT, letterSpacing: '0.3em', color: COLOR_DARK }}
              >
                <time dateTime={eventDate}>{longDate}</time>
              </p>
              <span aria-hidden="true" className="inline-block h-px w-12" style={{ backgroundColor: COLOR_DARK, opacity: 0.25 }} />
            </div>

            {(landingTitle || landingSubtitle) && (
              <div className="confetti-rise confetti-rise-4 mt-10 max-w-md">
                {landingTitle && (
                  <p
                    className="text-2xl sm:text-3xl"
                    style={{ fontFamily: DISPLAY_FONT, fontWeight: 500, color: COLOR_DARK }}
                  >
                    {landingTitle}
                  </p>
                )}
                {landingSubtitle && (
                  <p
                    className="mt-3 text-base leading-relaxed"
                    style={{ color: COLOR_DARK, opacity: 0.8 }}
                  >
                    {landingSubtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── STORY ─────────────────────────────────────────────────────── */}
        {hasStory && story ? (
          <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <SectionLabel tone="yellow">{t.story}</SectionLabel>
              </div>

              <div
                className="confetti-card-lift mt-10 rounded-3xl px-8 py-10 sm:px-12 sm:py-14"
                style={{
                  backgroundColor: COLOR_YELLOW,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                {toParagraphs(story.body).map((paragraph, idx) => (
                  <p
                    key={idx}
                    className={`text-base leading-[1.95] sm:text-lg ${idx > 0 ? 'mt-5' : ''}`}
                    style={{
                      fontFamily: BODY_FONT,
                      fontWeight: 400,
                      color: COLOR_DARK,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── COUNTDOWN ─────────────────────────────────────────────────── */}
        <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: COLOR_BLUE }}>
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel tone="blue">{t.countdown}</SectionLabel>

            <div className="mt-12">
              {remaining.past ? (
                <p
                  className="text-3xl sm:text-4xl"
                  style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_DARK }}
                >
                  {t.countdownPast}
                </p>
              ) : (
                <div
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"
                  role="timer"
                  aria-live="polite"
                  aria-label={t.countdown}
                >
                  <CountdownTile value={pad(remaining.days)}    caption={t.days}    tone="pink"   />
                  <CountdownTile value={pad(remaining.hours)}   caption={t.hours}   tone="yellow" />
                  <CountdownTile value={pad(remaining.minutes)} caption={t.minutes} tone="mint"   />
                  <CountdownTile value={pad(remaining.seconds)} caption={t.seconds} tone="blue"   />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── LOCATIONS ─────────────────────────────────────────────────── */}
        {hasLocations ? (
          <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <SectionLabel tone="pink">{t.locations}</SectionLabel>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
                {locations.map((loc, i) => {
                  const tone: Tone =
                    i % 4 === 0 ? 'pink' : i % 4 === 1 ? 'mint' : i % 4 === 2 ? 'yellow' : 'blue';
                  return (
                    <article
                      key={`${loc.label}-${loc.name}-${i}`}
                      className="confetti-card-lift rounded-2xl bg-white p-7 sm:p-8"
                      style={{
                        borderLeft: `6px solid ${TONE_BG[tone]}`,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <p
                        className="text-[0.65rem] font-bold uppercase sm:text-[0.7rem]"
                        style={{
                          fontFamily: BODY_FONT,
                          letterSpacing: '0.3em',
                          color: COLOR_DARK,
                          opacity: 0.7,
                        }}
                      >
                        {loc.label}
                      </p>
                      <h3
                        className="mt-2 text-2xl sm:text-3xl"
                        style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_DARK }}
                      >
                        {loc.name}
                      </h3>
                      <div
                        className="mt-4 space-y-1 text-sm"
                        style={{ color: COLOR_DARK, opacity: 0.85 }}
                      >
                        {loc.time && (
                          <p className="font-bold" style={{ letterSpacing: '0.05em' }}>
                            {loc.time}
                          </p>
                        )}
                        {loc.address && <p>{loc.address}</p>}
                        {loc.city && <p>{loc.city}</p>}
                      </div>
                      {loc.mapsLink && (
                        <a
                          href={loc.mapsLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] font-bold uppercase sm:text-[0.7rem]"
                          style={{
                            fontFamily: BODY_FONT,
                            letterSpacing: '0.3em',
                            color: COLOR_DARK,
                            backgroundColor: TONE_BG[tone],
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 200ms ease-out',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {t.viewMap}
                          <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── PROGRAM ───────────────────────────────────────────────────── */}
        {programDays.length > 0 ? (
          <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: COLOR_PINK }}>
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <SectionLabel tone="mint">{t.program}</SectionLabel>
              </div>

              <div className="mt-12 space-y-14">
                {programDays.map((day, dayIdx) => {
                  const headerTone: Tone = dayIdx % 2 === 0 ? 'mint' : 'blue';
                  return (
                    <article key={`day-${dayIdx}-${day.label ?? ''}`}>
                      <header className="mb-8 text-center">
                        {day.label && (
                          <h2
                            className="text-3xl sm:text-4xl"
                            style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_DARK }}
                          >
                            {day.label}
                          </h2>
                        )}
                        {day.date && (
                          <p
                            className="mt-2 text-[0.7rem] font-bold uppercase sm:text-xs"
                            style={{
                              fontFamily: BODY_FONT,
                              letterSpacing: '0.3em',
                              color: COLOR_DARK,
                              opacity: 0.7,
                            }}
                          >
                            <time dateTime={day.date}>{formatLongDate(day.date, locale)}</time>
                          </p>
                        )}
                      </header>

                      <ol className="space-y-4">
                        {day.items.map((item, itemIdx) => {
                          const itemTone: Tone =
                            itemIdx % 4 === 0
                              ? 'pink'
                              : itemIdx % 4 === 1
                              ? 'blue'
                              : itemIdx % 4 === 2
                              ? 'yellow'
                              : 'mint';
                          return (
                            <li key={`item-${dayIdx}-${itemIdx}`}>
                              <article
                                className="confetti-card-lift flex flex-col gap-3 rounded-2xl bg-white p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-7"
                                style={{
                                  borderTop: `4px solid ${TONE_BG[itemTone]}`,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                }}
                              >
                                <span
                                  className="shrink-0 text-sm font-bold uppercase sm:text-base"
                                  style={{
                                    fontFamily: DISPLAY_FONT,
                                    fontWeight: 600,
                                    letterSpacing: '0.1em',
                                    color: COLOR_DARK,
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  {item.time}
                                </span>
                                <div className="flex-1">
                                  <h3
                                    className="text-lg sm:text-xl"
                                    style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_DARK }}
                                  >
                                    {item.title}
                                  </h3>
                                  {item.detail && (
                                    <p
                                      className="mt-2 text-sm leading-relaxed"
                                      style={{ color: COLOR_DARK, opacity: 0.8 }}
                                    >
                                      {item.detail}
                                    </p>
                                  )}
                                </div>
                              </article>
                            </li>
                          );
                        })}
                      </ol>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── RSVP ──────────────────────────────────────────────────────── */}
        {rsvpEnabled ? (
          <section className="px-6 py-24 sm:py-28" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="mx-auto max-w-xl text-center">
              <SectionLabel tone="blue">{t.rsvpTitle}</SectionLabel>

              <div
                className="mt-10 rounded-3xl px-8 py-12 sm:px-12 sm:py-14"
                style={{
                  backgroundColor: COLOR_BLUE,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                <h2
                  className="text-3xl leading-tight sm:text-4xl"
                  style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_DARK }}
                >
                  {t.rsvpTitle}
                </h2>
                <p
                  className="mx-auto mt-4 max-w-md text-base leading-relaxed"
                  style={{ color: COLOR_DARK, opacity: 0.8 }}
                >
                  {t.rsvpHint}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="px-6 py-12" style={{ backgroundColor: COLOR_PINK }}>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <PartyPopperAccent className="h-7 w-7" />
            <span
              aria-hidden="true"
              className="block h-px w-16"
              style={{ backgroundColor: COLOR_DARK, opacity: 0.2 }}
            />
            <p
              className="text-[0.7rem] font-bold uppercase sm:text-xs"
              style={{
                fontFamily: BODY_FONT,
                letterSpacing: '0.4em',
                color: COLOR_DARK,
                opacity: 0.7,
              }}
            >
              {t.poweredBy}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}