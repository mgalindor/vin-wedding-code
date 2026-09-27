/**
 * VELAS — Deer Planner birthday invitation template.
 *
 * Theme
 * -----
 * Sophisticated adult birthday milestone (30 / 40 / 50). The page reads like
 * the cover of a dinner-party menu: a very dark, almost black-brown backdrop
 * (`#1A1410`) warmed by gold typography (`#C9A961`), cream paper sections
 * (`#F5E6D3`) and sienna accents (`#8B4513`). Inline SVG candles of varying
 * heights flank the hero, their flames flickering through a 3-frame keyframe
 * loop that is the only motion on the page. Hovering interactive elements
 * (locations, programme rows, RSVP button) lights a soft golden halo
 * (`0 0 24px rgba(201,169,97,0.3)`) — the candle's ambient glow, abstracted.
 *
 * Palette (exact hex — must not drift)
 * ------------------------------------
 *   Very dark brown  #1A1410   primary background, ink
 *   Gold             #C9A961   accent text, hairlines, RSVP button fill,
 *                             candle flame outer layer, hover halos
 *   Warm cream       #F5E6D3   light section panels (Story, Locations,
 *                             Programme, RSVP)
 *   Sienna           #8B4513   candle wax body, deep accents, footer rule
 *
 * Typography
 * ----------
 *   Display — Cormorant Garamond (italic for the honoree name, regular for
 *             section headings, small-caps numeric styling for the age)
 *   Body    — Inter (UI / labels / countdown captions)
 *   Both are loaded at runtime via injected Google Fonts <link> elements so
 *   the template stays self-contained.
 *
 * Motion philosophy
 * -----------------
 * One loop only: the flame flicker. Reduced-motion users get static flames.
 * Everything else is static composition with CSS transitions on hover.
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
  celebrating: string;
  yearsOf: string;
  saveTheDate: string;
  story: string;
  countdownTitle: string;
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
  address: string;
  city: string;
  time: string;
  dayLabel: string;
  attribution: string;
  madeWith: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    celebrating: 'Celebrating',
    yearsOf: 'Years of',
    saveTheDate: 'Save the Date',
    story: 'A Note',
    countdownTitle: 'The Candles Await',
    countdownPast: 'The Night Has Arrived',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'The Table',
    program: 'The Evening',
    rsvpTitle: 'Will You Join Us',
    rsvpHint: 'Kindly let us know before the candles are lit.',
    rsvp: 'Confirm Attendance',
    viewMap: 'View Map',
    address: 'Address',
    city: 'City',
    time: 'Time',
    dayLabel: 'Programme',
    attribution: 'Deer Planner',
    madeWith: 'Invitation lit on',
  },
  es: {
    celebrating: 'Celebramos',
    yearsOf: 'Años de',
    saveTheDate: 'Reserva la Fecha',
    story: 'Una Nota',
    countdownTitle: 'Las Velas Esperan',
    countdownPast: 'Ha Llegado la Noche',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'La Mesa',
    program: 'La Velada',
    rsvpTitle: 'Nos Acompañas',
    rsvpHint: 'Agradecemos tu confirmación antes de encender las velas.',
    rsvp: 'Confirmar Asistencia',
    viewMap: 'Ver Mapa',
    address: 'Dirección',
    city: 'Ciudad',
    time: 'Hora',
    dayLabel: 'Programa',
    attribution: 'Deer Planner',
    madeWith: 'Invitación encendida en',
  },
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap';

const DISPLAY_FONT =
  "'Cormorant Garamond', 'EB Garamond', 'Times New Roman', serif";
const BODY_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const COLOR_BROWN = '#1A1410';
const COLOR_GOLD = '#C9A961';
const COLOR_CREAM = '#F5E6D3';
const COLOR_SIENNA = '#8B4513';

const VELAS_MOTION_CSS = `
  .velas-root {
    --velas-gold: ${COLOR_GOLD};
    --velas-cream: ${COLOR_CREAM};
    --velas-brown: ${COLOR_BROWN};
    --velas-sienna: ${COLOR_SIENNA};
    --velas-glow: 0 0 24px rgba(201, 169, 97, 0.3);
    --velas-glow-strong: 0 0 36px rgba(201, 169, 97, 0.55);
    font-family: ${BODY_FONT};
    color: ${COLOR_GOLD};
    background-color: ${COLOR_BROWN};
  }

  /* The one allowed loop: the candle flame. Three keyframes cycled in 1.4s. */
  @keyframes velas-flicker {
    0%, 100% { transform: scale(1, 1) translateY(0);    opacity: 0.95; }
    33%      { transform: scale(1.08, 1.12) translateY(-1px); opacity: 1; }
    66%      { transform: scale(0.94, 0.96) translateY(1px);  opacity: 0.85; }
  }
  .velas-flame {
    transform-origin: 50% 100%;
    transform-box: fill-box;
    animation: velas-flicker 1.4s ease-in-out infinite;
  }
  .velas-flame-b {
    animation-duration: 1.7s;
    animation-delay: -0.4s;
  }
  .velas-flame-c {
    animation-duration: 1.2s;
    animation-delay: -0.8s;
  }
  .velas-flame-d {
    animation-duration: 1.9s;
    animation-delay: -0.2s;
  }
  .velas-flame-e {
    animation-duration: 1.5s;
    animation-delay: -1s;
  }

  /* Soft halo that pulses behind the hero monogram, very low intensity. */
  @keyframes velas-glow-breath {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%      { opacity: 0.8;  transform: scale(1.04); }
  }
  .velas-glow-breath { animation: velas-glow-breath 6s ease-in-out infinite; }

  /* Hover halo for interactive rows (locations / programme). */
  .velas-interactive {
    transition: box-shadow 350ms ease, transform 350ms ease, border-color 350ms ease;
  }
  .velas-interactive:hover {
    box-shadow: var(--velas-glow);
    border-color: ${COLOR_GOLD};
  }

  /* RSVP button halo. */
  .velas-rsvp-btn {
    transition: box-shadow 350ms ease, background-color 350ms ease,
                color 350ms ease, transform 350ms ease;
  }
  .velas-rsvp-btn:hover {
    background-color: #D9BB7A;
    box-shadow: var(--velas-glow-strong);
    transform: translateY(-1px);
  }
  .velas-rsvp-btn:focus-visible {
    outline: none;
    box-shadow: var(--velas-glow-strong);
  }

  @media (prefers-reduced-motion: reduce) {
    .velas-flame,
    .velas-flame-b,
    .velas-flame-c,
    .velas-flame-d,
    .velas-flame-e,
    .velas-glow-breath {
      animation: none !important;
    }
    .velas-interactive,
    .velas-rsvp-btn {
      transition: none !important;
    }
  }
`;

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useVelasFonts(): void {
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

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

function computeRemaining(target: number, now: number): Remaining {
  const delta = target - now;
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

/** Live countdown ticking once per second. */
function useCountdown(eventDate: string): Remaining {
  const target = useMemo(() => {
    const parsed = new Date(`${eventDate}T00:00:00`).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }, [eventDate]);

  const [remaining, setRemaining] = useState<Remaining>(() =>
    computeRemaining(target, Date.now()),
  );

  useEffect(() => {
    setRemaining(computeRemaining(target, Date.now()));
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(target, Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return remaining;
}

function formatLongDate(iso: string, locale: Locale): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
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

interface CandleProps {
  height: number;
  /** Variant class suffix so each candle flickers on its own offset. */
  variant: 'a' | 'b' | 'c' | 'd' | 'e';
  waxColor?: string;
}

const FLAME_CLASS_BY_VARIANT: Record<CandleProps['variant'], string> = {
  a: 'velas-flame',
  b: 'velas-flame velas-flame-b',
  c: 'velas-flame velas-flame-c',
  d: 'velas-flame velas-flame-d',
  e: 'velas-flame velas-flame-e',
};

/**
 * A single candle: warm sienna wax body, gold rim at the top, an outer
 * teardrop flame (gold, animated) with an inner brighter core.
 */
function Candle({
  height,
  variant,
  waxColor = COLOR_SIENNA,
}: CandleProps): ReactElement {
  const wickX = 12;
  const flameClass = FLAME_CLASS_BY_VARIANT[variant];
  // Flame group sits above the wick; scaled candle total height is the prop.
  const candleTopY = 8; // body starts here, wick above
  const wickHeight = 6;
  return (
    <svg
      width="24"
      height={height}
      viewBox={`0 0 24 ${height}`}
      role="img"
      aria-hidden="true"
    >
      {/* Flame outer layer */}
      <g className={flameClass}>
        <path
          d={`M${wickX} 0 C ${wickX - 5} 5, ${wickX - 4} 9, ${wickX} 10
              C ${wickX + 4} 9, ${wickX + 5} 5, ${wickX} 0 Z`}
          fill={COLOR_GOLD}
          opacity="0.85"
        />
        {/* Flame inner core */}
        <path
          d={`M${wickX} 2.5 C ${wickX - 2.2} 5.5, ${wickX - 1.6} 8, ${wickX} 8.6
              C ${wickX + 1.6} 8, ${wickX + 2.2} 5.5, ${wickX} 2.5 Z`}
          fill="#F8E9C7"
          opacity="0.95"
        />
      </g>
      {/* Wick */}
      <rect
        x={wickX - 0.6}
        y={wickX * 0.6}
        width="1.2"
        height={wickHeight}
        fill="#1A1410"
      />
      {/* Wax body */}
      <rect
        x="6"
        y={candleTopY}
        width="12"
        height={height - candleTopY - 2}
        fill={waxColor}
      />
      {/* Gold rim at top */}
      <rect x="6" y={candleTopY} width="12" height="2" fill={COLOR_GOLD} />
      {/* Soft base shadow */}
      <ellipse
        cx="12"
        cy={height - 1}
        rx="10"
        ry="1.2"
        fill={COLOR_BROWN}
        opacity="0.6"
      />
    </svg>
  );
}

/** Tiny teardrop glyph used as a bullet and as a countdown separator. */
function FlameGlyph({
  size = 10,
  className,
}: {
  size?: number;
  className?: string;
}): ReactElement {
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 10 16"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5 0 C 1.5 4.5, 1.5 9, 5 11 C 8.5 9, 8.5 4.5, 5 0 Z"
        fill={COLOR_GOLD}
        opacity="0.9"
      />
      <path
        d="M5 4 C 3.5 6.5, 3.5 9, 5 10 C 6.5 9, 6.5 6.5, 5 4 Z"
        fill="#F8E9C7"
        opacity="0.9"
      />
    </svg>
  );
}

/** Hairline 1px gold rule used between sections. */
function Hairline({
  className = '',
  widthClass = 'w-24',
}: {
  className?: string;
  widthClass?: string;
}): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`mx-auto block h-px ${widthClass} ${className}`}
      style={{ backgroundColor: COLOR_GOLD, opacity: 0.5 }}
    />
  );
}

interface SectionLabelProps {
  children: ReactNode;
  tone?: 'dark' | 'cream';
}

/** Uppercase, wide-tracked, gold section eyebrow with flanking hairlines. */
function SectionLabel({ children, tone = 'dark' }: SectionLabelProps): ReactElement {
  return (
    <h2
      className={`mb-12 text-center text-[0.6875rem] uppercase sm:text-xs ${
        tone === 'cream' ? '' : ''
      }`}
      style={{
        fontFamily: BODY_FONT,
        fontWeight: 500,
        letterSpacing: '0.4em',
        color: COLOR_GOLD,
      }}
    >
      <span className="inline-flex items-center gap-4">
        <span
          aria-hidden="true"
          className="block h-px w-8 sm:w-12"
          style={{ backgroundColor: COLOR_GOLD, opacity: 0.55 }}
        />
        {children}
        <span
          aria-hidden="true"
          className="block h-px w-8 sm:w-12"
          style={{ backgroundColor: COLOR_GOLD, opacity: 0.55 }}
        />
      </span>
    </h2>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Layout primitives
 * ────────────────────────────────────────────────────────────────────────── */

interface SectionProps {
  id: string;
  eyebrow: string;
  tone: 'dark' | 'cream';
  children: ReactNode;
}

function Section({ id, eyebrow, tone, children }: SectionProps): ReactElement {
  const cream = tone === 'cream';
  return (
    <section
      id={id}
      className="w-full px-6 py-24 sm:px-10 md:py-32"
      style={{
        backgroundColor: cream ? COLOR_CREAM : COLOR_BROWN,
        color: cream ? COLOR_SIENNA : COLOR_GOLD,
        borderTop: cream
          ? '1px solid rgba(139, 69, 19, 0.15)'
          : '1px solid rgba(201, 169, 97, 0.25)',
      }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <SectionLabel tone={tone}>{eyebrow}</SectionLabel>
        {children}
      </div>
    </section>
  );
}

interface ProseProps {
  body: string;
  tone: 'dark' | 'cream';
}

function Prose({ body, tone }: ProseProps): ReactElement {
  const cream = tone === 'cream';
  return (
    <div className="mx-auto max-w-2xl text-center">
      {toParagraphs(body).map((paragraph, index) => (
        <p
          key={index}
          className={`text-base leading-8 sm:text-lg sm:leading-9 ${
            index > 0 ? 'mt-6' : ''
          }`}
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 400,
            color: cream ? COLOR_SIENNA : '#E8D9BF',
          }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

interface CountdownUnitProps {
  value: string;
  caption: string;
  tone: 'dark' | 'cream';
}

function CountdownUnit({
  value,
  caption,
  tone,
}: CountdownUnitProps): ReactElement {
  const cream = tone === 'cream';
  return (
    <div className="flex flex-col items-center px-3 sm:px-7">
      <span
        className="text-5xl leading-none sm:text-6xl md:text-7xl"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 500,
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
          color: cream ? COLOR_SIENNA : COLOR_GOLD,
        }}
      >
        {value}
      </span>
      <span
        className="mt-4 text-[0.625rem] uppercase sm:text-[0.6875rem]"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 500,
          letterSpacing: '0.4em',
          color: cream ? 'rgba(139, 69, 19, 0.75)' : 'rgba(201, 169, 97, 0.85)',
        }}
      >
        {caption}
      </span>
    </div>
  );
}

function FlameSeparator(): ReactElement {
  return (
    <span
      aria-hidden="true"
      className="flex items-center self-center"
      style={{ paddingBottom: '1.5rem' }}
    >
      <FlameGlyph size={8} />
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────────────────── */

export default function VelasTemplate(props: PublicInvitationPageProps): ReactElement {
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

  useVelasFonts();

  const t = labels[locale];
  const remaining = useCountdown(eventDate);
  const longDate = formatLongDate(eventDate, locale);
  const hasStory = Boolean(story && story.body.trim().length > 0);
  const programDays = program.days.filter((day) => day.items.length > 0);
  const hasLocations = locations.length > 0;
  const showAge = typeof ageTurning === 'number' && ageTurning > 0;

  const heroFallbackStyle: CSSProperties = {
    background:
      'radial-gradient(ellipse at center, #3A2418 0%, #1A1410 55%, #0E0A07 100%)',
  };

  return (
    <main
      className="velas-root min-h-screen w-full antialiased"
      style={{ backgroundColor: COLOR_BROWN }}
    >
      <style>{VELAS_MOTION_CSS}</style>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <header
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        style={heroImageUrl ? undefined : heroFallbackStyle}
      >
        {heroImageUrl ? (
          <>
            <img
              src={heroImageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'brightness(0.55) saturate(0.85)' }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(26,20,16,0.55) 0%, rgba(26,20,16,0.85) 100%)',
              }}
            />
          </>
        ) : null}

        {/* Candles flanking — 5 candles of varying heights. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center"
          style={{ paddingBottom: '4vh' }}
        >
          <div className="flex items-end gap-3 sm:gap-5">
            <Candle height={120} variant="b" />
            <Candle height={150} variant="d" />
            <Candle height={180} variant="a" />
            <Candle height={140} variant="e" />
            <Candle height={110} variant="c" />
          </div>
        </div>

        {/* Soft golden glow behind the monogram. */}
        <div
          aria-hidden="true"
          className="velas-glow-breath pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '520px',
            height: '520px',
            background:
              'radial-gradient(circle, rgba(201,169,97,0.18) 0%, rgba(201,169,97,0.06) 45%, transparent 70%)',
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center sm:px-10">
          {landingTitle ? (
            <p
              className="mb-10 text-[0.6875rem] uppercase sm:text-xs"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 500,
                letterSpacing: '0.4em',
                color: COLOR_GOLD,
              }}
            >
              {landingTitle}
            </p>
          ) : (
            <p
              className="mb-10 text-[0.6875rem] uppercase sm:text-xs"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 500,
                letterSpacing: '0.4em',
                color: COLOR_GOLD,
              }}
            >
              {t.celebrating}
            </p>
          )}

          <h1
            className="text-[3rem] leading-[1.05] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem]"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '0.005em',
              color: COLOR_CREAM,
              textShadow: '0 2px 24px rgba(201, 169, 97, 0.25)',
            }}
          >
            {honoreeName}
          </h1>

          {showAge ? (
            <div className="mt-10 flex flex-col items-center">
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: '104px',
                  height: '104px',
                  border: `1px solid ${COLOR_GOLD}`,
                  color: COLOR_GOLD,
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 500,
                  fontSize: '2.75rem',
                  letterSpacing: '0.05em',
                  fontVariantNumeric: 'lining-nums',
                  boxShadow: 'inset 0 0 18px rgba(201, 169, 97, 0.15)',
                }}
              >
                {String(ageTurning)}
              </span>
              <span
                className="mt-5 text-[0.625rem] uppercase sm:text-[0.6875rem]"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 500,
                  letterSpacing: '0.4em',
                  color: COLOR_GOLD,
                }}
              >
                {t.yearsOf}
              </span>
            </div>
          ) : null}

          <Hairline className="mt-14" />

          <p
            className="mt-10 text-xs uppercase sm:text-sm"
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 500,
              letterSpacing: '0.4em',
              color: COLOR_GOLD,
            }}
          >
            <time dateTime={eventDate}>{longDate}</time>
          </p>

          {landingSubtitle ? (
            <p
              className="mt-8 max-w-xl text-sm leading-7 sm:text-base"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 400,
                color: '#D8C9AC',
              }}
            >
              {landingSubtitle}
            </p>
          ) : (
            <p
              className="mt-8 text-[0.625rem] uppercase sm:text-[0.6875rem]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 500,
                letterSpacing: '0.4em',
                color: 'rgba(201, 169, 97, 0.7)',
              }}
            >
              {t.saveTheDate}
            </p>
          )}
        </div>
      </header>

      {/* ── STORY ───────────────────────────────────────────────────────── */}
      {hasStory && story ? (
        <Section id="velas-story" eyebrow={t.story} tone="cream">
          <Prose body={story.body} tone="cream" />
        </Section>
      ) : null}

      {/* ── COUNTDOWN ───────────────────────────────────────────────────── */}
      <section
        id="velas-countdown"
        className="w-full px-6 py-24 sm:px-10 md:py-32"
        style={{
          backgroundColor: COLOR_BROWN,
          borderTop: '1px solid rgba(201, 169, 97, 0.25)',
          color: COLOR_GOLD,
        }}
      >
        <div className="mx-auto w-full max-w-4xl text-center">
          <SectionLabel tone="dark">
            {remaining.past ? t.countdownPast : t.countdownTitle}
          </SectionLabel>

          <div className="flex w-full items-start justify-center">
            <CountdownUnit
              value={pad(remaining.days)}
              caption={t.days}
              tone="dark"
            />
            <FlameSeparator />
            <CountdownUnit
              value={pad(remaining.hours)}
              caption={t.hours}
              tone="dark"
            />
            <FlameSeparator />
            <CountdownUnit
              value={pad(remaining.minutes)}
              caption={t.minutes}
              tone="dark"
            />
            <FlameSeparator />
            <CountdownUnit
              value={pad(remaining.seconds)}
              caption={t.seconds}
              tone="dark"
            />
          </div>

          <p
            className="mt-14 text-[0.625rem] uppercase sm:text-[0.6875rem]"
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 500,
              letterSpacing: '0.4em',
              color: 'rgba(201, 169, 97, 0.7)',
            }}
          >
            <time dateTime={eventDate}>{longDate}</time>
          </p>
        </div>
      </section>

      {/* ── LOCATIONS ───────────────────────────────────────────────────── */}
      {hasLocations ? (
        <Section id="velas-locations" eyebrow={t.locations} tone="cream">
          <ul className="mx-auto flex max-w-2xl flex-col gap-6">
            {locations.map((location, index) => (
              <li key={`${location.label}-${index}`}>
                <article
                  className="velas-interactive flex flex-col gap-3 rounded-sm border px-6 py-6 sm:px-8 sm:py-7"
                  style={{
                    borderColor: 'rgba(139, 69, 19, 0.2)',
                    backgroundColor: 'rgba(255, 252, 245, 0.55)',
                  }}
                >
                  <div className="flex items-baseline gap-3">
                    <FlameGlyph size={8} />
                    <p
                      className="text-[0.625rem] uppercase sm:text-[0.6875rem]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.4em',
                        color: COLOR_SIENNA,
                        opacity: 0.75,
                      }}
                    >
                      {location.label}
                    </p>
                  </div>
                  <h3
                    className="text-2xl leading-tight sm:text-3xl"
                    style={{
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 500,
                      color: COLOR_SIENNA,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {location.name}
                  </h3>
                  {location.address ? (
                    <p
                      className="text-sm leading-6"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 400,
                        color: COLOR_SIENNA,
                      }}
                    >
                      {location.address}
                    </p>
                  ) : null}
                  {location.city ? (
                    <p
                      className="text-xs uppercase"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.25em',
                        color: 'rgba(139, 69, 19, 0.7)',
                      }}
                    >
                      {location.city}
                    </p>
                  ) : null}
                  {location.time ? (
                    <p
                      className="text-xs uppercase"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.25em',
                        color: COLOR_SIENNA,
                      }}
                    >
                      {t.time} · {location.time}
                    </p>
                  ) : null}
                  {location.mapsLink ? (
                    <a
                      href={location.mapsLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-2 self-start border-b pb-1 text-[0.625rem] uppercase sm:text-[0.6875rem]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.3em',
                        color: COLOR_SIENNA,
                        borderColor: 'rgba(139, 69, 19, 0.4)',
                        transition: 'color 350ms ease, border-color 350ms ease',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.color = COLOR_GOLD;
                        event.currentTarget.style.borderColor = COLOR_GOLD;
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.color = COLOR_SIENNA;
                        event.currentTarget.style.borderColor =
                          'rgba(139, 69, 19, 0.4)';
                      }}
                    >
                      {t.viewMap}
                    </a>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* ── PROGRAM ─────────────────────────────────────────────────────── */}
      {programDays.length > 0 ? (
        <Section id="velas-program" eyebrow={t.program} tone="dark">
          <div className="flex flex-col gap-16">
            {programDays.map((day, dayIndex) => (
              <div key={`day-${dayIndex}`}>
                <h3
                  className="mb-10 text-center text-2xl leading-tight sm:text-3xl"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    letterSpacing: '0.02em',
                    color: COLOR_CREAM,
                  }}
                >
                  {day.label ??
                    (day.date ? formatLongDate(day.date, locale) : t.dayLabel)}
                </h3>
                {day.label && day.date ? (
                  <p
                    className="-mt-6 mb-10 text-center text-[0.625rem] uppercase sm:text-[0.6875rem]"
                    style={{
                      fontFamily: BODY_FONT,
                      fontWeight: 500,
                      letterSpacing: '0.4em',
                      color: 'rgba(201, 169, 97, 0.7)',
                    }}
                  >
                    {formatLongDate(day.date, locale)}
                  </p>
                ) : null}

                <ul className="mx-auto flex max-w-2xl flex-col gap-3">
                  {day.items.map((item, itemIndex) => (
                    <li key={`item-${dayIndex}-${itemIndex}`}>
                      <article
                        className="velas-interactive grid grid-cols-[5rem_1fr] items-start gap-4 border-b px-2 py-5 sm:grid-cols-[6rem_1fr] sm:gap-6"
                        style={{
                          borderColor: 'rgba(201, 169, 97, 0.18)',
                        }}
                      >
                        <div className="flex items-center gap-2 pt-1">
                          <FlameGlyph size={8} />
                          <span
                            className="text-[0.6875rem] uppercase sm:text-xs"
                            style={{
                              fontFamily: BODY_FONT,
                              fontWeight: 500,
                              letterSpacing: '0.25em',
                              color: COLOR_GOLD,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {item.time}
                          </span>
                        </div>
                        <div>
                          <p
                            className="text-lg leading-tight sm:text-xl"
                            style={{
                              fontFamily: DISPLAY_FONT,
                              fontWeight: 500,
                              letterSpacing: '0.02em',
                              color: COLOR_CREAM,
                            }}
                          >
                            {item.title}
                          </p>
                          {item.detail ? (
                            <p
                              className="mt-2 text-sm leading-6"
                              style={{
                                fontFamily: BODY_FONT,
                                fontWeight: 400,
                                color: 'rgba(232, 217, 191, 0.75)',
                              }}
                            >
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── RSVP ────────────────────────────────────────────────────────── */}
      {rsvpEnabled ? (
        <section
          id="velas-rsvp"
          className="w-full px-6 py-24 sm:px-10 md:py-32"
          style={{
            backgroundColor: COLOR_CREAM,
            borderTop: '1px solid rgba(139, 69, 19, 0.15)',
            color: COLOR_SIENNA,
          }}
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <SectionLabel tone="cream">{t.rsvpHint}</SectionLabel>
            <h2
              className="mb-12 text-4xl leading-none sm:text-5xl md:text-6xl"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 400,
                fontStyle: 'italic',
                letterSpacing: '0.01em',
                color: COLOR_SIENNA,
              }}
            >
              {t.rsvpTitle}
            </h2>
          </div>
        </section>
      ) : null}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer
        className="w-full px-6 py-16 text-center sm:px-10"
        style={{
          backgroundColor: COLOR_BROWN,
          borderTop: '1px solid rgba(201, 169, 97, 0.25)',
          color: COLOR_GOLD,
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          <FlameGlyph size={14} />
          <span
            aria-hidden="true"
            className="my-6 block h-px w-16"
            style={{ backgroundColor: COLOR_GOLD, opacity: 0.4 }}
          />
          <p
            className="text-[0.625rem] uppercase sm:text-[0.6875rem]"
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 500,
              letterSpacing: '0.4em',
              color: 'rgba(201, 169, 97, 0.85)',
            }}
          >
            {t.madeWith} {t.attribution}
          </p>
        </div>
      </footer>
    </main>
  );
}
