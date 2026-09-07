/**
 * NEON — birthday invitation template for Deer Planner.
 *
 * Visual concept
 * --------------
 * A modern adult birthday party for the after-hours crowd — late 20s / early
 * 30s, rooftop, neon-lit. The page reads like a single black-card invitation
 * under city lights: deep navy-black ground, glassmorphism cards floating on
 * top, and three neon accents (cyan, magenta, lime) cycling across sections.
 * Display headings glow like real neon signage with a soft 2.5s pulse; the
 * honoree name sits in Audiowide with a strong cyan halo, the turning age
 * blazes in magenta, and small lime markers anchor the corners.
 *
 * Palette (exact hex)
 * -------------------
 *   Dark navy-black  #0F0F1A   — primary background / page ground
 *   Cyan neon        #00F0FF   — primary neon, hero name glow, countdown
 *   Magenta neon     #FF2EC4   — RSVP, age callout, secondary accent
 *   Lime neon        #C7FF00   — section eyebrow cycling, micro accents
 *   Text white       #FFFFFF   — body copy, headings
 *
 * Typography
 * ----------
 *   Display (h1/h2, countdown numerals) — Audiowide, weight 400. Loaded via
 *   Google Fonts <link> tags (hoisted by React 19, deduplicated automatically).
 *   Body / UI                            — Inter,    weights 400 / 600.
 *
 * Motion: subtle by design — a single neon pulse on display headings, hover
 * glow on glass cards, and a smooth magenta RSVP box-shadow on hover. All
 * animations are disabled under `prefers-reduced-motion: reduce`.
 *
 * The component is presentation-only — no business logic, no data fetching,
 * no shared imports. Only React.
 */
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

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
type NeonTone = 'cyan' | 'magenta' | 'lime';

interface LabelSet {
  eyebrow: string;
  story: string;
  countdown: string;
  countdownPast: string;
  days: string;
  hoursShort: string;
  minutesShort: string;
  secondsShort: string;
  turning: string;
  yearsOld: string;
  saveTheDate: string;
  locations: string;
  program: string;
  rsvp: string;
  rsvpTitle: string;
  rsvpHint: string;
  viewMap: string;
  city: string;
  time: string;
  day: string;
  attribution: string;
  madeWith: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    eyebrow: 'Birthday Celebration',
    story: 'The Vibe',
    countdown: 'Countdown',
    countdownPast: 'Tonight',
    days: 'Days',
    hoursShort: 'Hrs',
    minutesShort: 'Min',
    secondsShort: 'Sec',
    turning: 'Turning',
    yearsOld: 'years young',
    saveTheDate: 'Save the Night',
    locations: 'The Venue',
    program: 'The Night',
    rsvp: 'RSVP Now',
    rsvpTitle: 'Will You Join Us',
    rsvpHint: 'Limited capacity — confirm your spot.',
    viewMap: 'Open in Maps',
    city: 'City',
    time: 'Doors',
    day: 'Day',
    attribution: 'Deer Planner',
    madeWith: 'Invitation crafted with',
  },
  es: {
    eyebrow: 'Celebración de Cumpleaños',
    story: 'El Ambiente',
    countdown: 'Cuenta Atrás',
    countdownPast: 'Esta Noche',
    days: 'Días',
    hoursShort: 'Hrs',
    minutesShort: 'Min',
    secondsShort: 'Seg',
    turning: 'Cumple',
    yearsOld: 'años',
    saveTheDate: 'Reserva la Noche',
    locations: 'El Lugar',
    program: 'La Noche',
    rsvp: 'Confirmar Ahora',
    rsvpTitle: 'Nos Acompañas',
    rsvpHint: 'Cupo limitado — confirma tu lugar.',
    viewMap: 'Abrir en Mapa',
    city: 'Ciudad',
    time: 'Puertas',
    day: 'Día',
    attribution: 'Deer Planner',
    madeWith: 'Invitación creada con',
  },
};

const NEON: Record<NeonTone, string> = {
  cyan: '#00F0FF',
  magenta: '#FF2EC4',
  lime: '#C7FF00',
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Audiowide&family=Inter:wght@300;400;500;600;700&display=swap';

const DISPLAY_FONT = "'Audiowide', 'Bungee', Impact, sans-serif";
const BODY_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useNeonFonts(): void {
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
    const parsed = new Date(`${eventDate}T20:00:00`).getTime();
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

function formatWeekday(iso: string, locale: Locale): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    weekday: 'long',
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

interface SectionProps {
  id: string;
  eyebrow: string;
  tone: NeonTone;
  heading?: string;
  children: ReactNode;
}

/**
 * A dark-mode section with a neon-eyebrow, optional heading, and glassmorphism
 * content area. The neon accent cycles by passing `tone` per section.
 */
function Section({
  id,
  eyebrow,
  tone,
  heading,
  children,
}: SectionProps): ReactElement {
  const accent = NEON[tone];
  return (
    <section
      id={id}
      className="relative w-full overflow-hidden border-t border-white/10 px-6 py-24 sm:px-10 md:py-32"
      style={{ backgroundColor: '#0F0F1A' }}
    >
      <div className="neon-section-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-5xl">
        <p
          className="mb-6 text-[0.6875rem] uppercase"
          style={{
            color: accent,
            fontFamily: BODY_FONT,
            fontWeight: 600,
            letterSpacing: '0.4em',
            textShadow: `0 0 12px ${accent}80, 0 0 24px ${accent}40`,
          }}
        >
          {eyebrow}
        </p>
        {heading !== undefined ? (
          <div className="mb-12">
            <h2
              className="neon-pulse text-3xl uppercase leading-none sm:text-4xl md:text-5xl"
              style={{
                color: '#FFFFFF',
                fontFamily: DISPLAY_FONT,
                fontWeight: 400,
                letterSpacing: '0.08em',
                textShadow:
                  '0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(255,255,255,0.35)',
              }}
            >
              {heading}
            </h2>
            <span
              aria-hidden="true"
              className="mt-5 block h-[1px] w-20"
              style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
            />
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

interface GlassCardProps {
  tone?: NeonTone;
  hoverable?: boolean;
  className?: string;
  children: ReactNode;
}

/** Glassmorphism card — translucent white with thin border and blur. */
function GlassCard({
  tone = 'cyan',
  hoverable = true,
  className = '',
  children,
}: GlassCardProps): ReactElement {
  const accent = NEON[tone];
  return (
    <div
      className={[
        'neon-glass rounded-2xl p-7 sm:p-8',
        hoverable ? 'neon-glass-hover' : '',
        className,
      ].join(' ')}
      style={
        {
          borderColor: `${accent}55`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 1px ${accent}22`,
          '--neon-accent': accent,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

interface CountdownUnitProps {
  value: string;
  caption: string;
  tone: NeonTone;
}

function CountdownUnit({
  value,
  caption,
  tone,
}: CountdownUnitProps): ReactElement {
  const accent = NEON[tone];
  return (
    <div className="neon-glass flex flex-1 flex-col items-center rounded-2xl px-3 py-6 sm:px-6 sm:py-8">
      <span
        className="neon-pulse text-5xl leading-none sm:text-6xl md:text-7xl"
        style={{
          color: accent,
          fontFamily: DISPLAY_FONT,
          fontWeight: 400,
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
          textShadow: `0 0 12px ${accent}, 0 0 24px ${accent}80`,
        }}
      >
        {value}
      </span>
      <span
        className="mt-4 text-[0.625rem] uppercase sm:text-[0.6875rem]"
        style={{
          color: '#FFFFFF',
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.35em',
          opacity: 0.7,
        }}
      >
        {caption}
      </span>
    </div>
  );
}

/**
 * Inline decorative SVG: a horizon line with a glowing neon squiggle above it,
 * evoking a city skyline at night. Purely decorative, aria-hidden.
 */
function NeonHorizonDecoration(): ReactElement {
  return (
    <svg
      width="100%"
      height="160"
      viewBox="0 0 1200 160"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 w-full"
    >
      <defs>
        <linearGradient id="neon-horizon-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <path
        d="M0 130 L80 130 L80 95 L150 95 L150 115 L240 115 L240 80 L320 80 L320 130 L420 130 L420 60 L500 60 L500 110 L600 110 L600 90 L700 90 L700 130 L820 130 L820 70 L900 70 L900 120 L1000 120 L1000 100 L1100 100 L1100 130 L1200 130 L1200 160 L0 160 Z"
        fill="url(#neon-horizon-grad)"
      />
      <path
        d="M0 132 L1200 132"
        stroke="#00F0FF"
        strokeWidth="1"
        strokeOpacity="0.6"
      />
      <path
        d="M40 50 Q 80 20, 120 50 T 200 50 T 280 50 T 360 50 T 440 50 T 520 50 T 600 50 T 680 50 T 760 50 T 840 50 T 920 50 T 1000 50 T 1080 50 T 1160 50"
        stroke="#FF2EC4"
        strokeWidth="1.5"
        strokeOpacity="0.55"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 6px #FF2EC4)' }}
      />
    </svg>
  );
}

/**
 * NEON birthday invitation template.
 *
 * The page reads top-to-bottom as: hero (name + age + date), optional story,
 * countdown, locations, program, RSVP, footer. Three neon tones (cyan,
 * magenta, lime) cycle across the section eyebrows and countdown numerals
 * to give the page its rhythmic after-hours feel.
 */
export default function NeonTemplate({
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
}: PublicInvitationPageProps): ReactElement {
  useNeonFonts();

  const t = labels[locale];
  const remaining = useCountdown(eventDate);
  const longDate = formatLongDate(eventDate, locale);
  const weekday = formatWeekday(eventDate, locale);
  const programDays = program.days.filter((day) => day.items.length > 0);
  const hasAge =
    typeof ageTurning === 'number' && Number.isFinite(ageTurning) && ageTurning > 0;

  return (
    <main
      className="neon-root min-h-screen w-full overflow-x-hidden antialiased"
      style={{ backgroundColor: '#0F0F1A', color: '#FFFFFF', fontFamily: BODY_FONT }}
    >
      <style>{`
        .neon-root { -webkit-font-smoothing: antialiased; }
        .neon-pulse {
          animation: neon-flicker 2.5s ease-in-out infinite;
        }
        @keyframes neon-flicker {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        .neon-section-bg {
          background:
            radial-gradient(60% 40% at 20% 0%, rgba(0, 240, 255, 0.06) 0%, transparent 60%),
            radial-gradient(40% 30% at 100% 100%, rgba(255, 46, 196, 0.05) 0%, transparent 60%);
        }
        .neon-glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.10);
          transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 320ms ease;
        }
        .neon-glass-hover:hover {
          transform: translateY(-3px);
          border-color: var(--neon-accent, #00F0FF);
          box-shadow: 0 0 0 1px var(--neon-accent, #00F0FF),
                      0 0 24px color-mix(in srgb, var(--neon-accent, #00F0FF) 35%, transparent),
                      0 18px 40px rgba(0, 0, 0, 0.45);
        }
        .neon-button {
          background: #FF2EC4;
          color: #FFFFFF;
          transition: box-shadow 240ms ease, transform 240ms ease, background-color 240ms ease;
        }
        .neon-button:hover {
          background: #FF2EC4;
          box-shadow: 0 0 20px #FF2EC4, 0 0 40px rgba(255, 46, 196, 0.55);
          transform: translateY(-1px);
        }
        .neon-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.55), 0 0 20px #FF2EC4;
        }
        @media (prefers-reduced-motion: reduce) {
          .neon-root *, .neon-root *::before, .neon-root *::after {
            animation: none !important;
            transition: none !important;
          }
          .neon-pulse { opacity: 1 !important; }
          .neon-glass-hover:hover { transform: none; }
          .neon-button:hover { transform: none; }
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <header
        className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#0F0F1A' }}
      >
        {heroImageUrl ? (
          <>
            <img
              src={heroImageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'brightness(0.55) saturate(1.15) contrast(1.05)' }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(15,15,26,0.35) 0%, rgba(15,15,26,0.85) 100%)',
              }}
            />
          </>
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(80% 60% at 50% 40%, #1A1A2E 0%, #0F0F1A 70%)',
            }}
          />
        )}
        <NeonHorizonDecoration />

        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-6 pb-32 pt-24 text-center sm:px-10">
          {landingTitle ? (
            <p
              className="mb-8 text-[0.6875rem] uppercase"
              style={{
                color: NEON.lime,
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
                textShadow: `0 0 12px ${NEON.lime}80`,
              }}
            >
              {landingTitle}
            </p>
          ) : (
            <p
              className="mb-8 text-[0.6875rem] uppercase"
              style={{
                color: NEON.lime,
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
                textShadow: `0 0 12px ${NEON.lime}80`,
              }}
            >
              {t.eyebrow}
            </p>
          )}

          <h1
            className="neon-pulse text-5xl leading-[1.02] uppercase sm:text-7xl md:text-8xl lg:text-[7.5rem]"
            style={{
              color: NEON.cyan,
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
              letterSpacing: '0.06em',
              textShadow: `0 0 12px ${NEON.cyan}, 0 0 32px ${NEON.cyan}, 0 0 64px ${NEON.cyan}80`,
            }}
          >
            {honoreeName}
          </h1>

          {hasAge ? (
            <div className="mt-6 flex items-center gap-4 sm:gap-6">
              <span
                aria-hidden="true"
                className="h-[1px] w-10 sm:w-16"
                style={{ backgroundColor: NEON.magenta, boxShadow: `0 0 8px ${NEON.magenta}` }}
              />
              <p
                className="text-base uppercase sm:text-lg"
                style={{
                  color: NEON.magenta,
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.35em',
                  textShadow: `0 0 10px ${NEON.magenta}80`,
                }}
              >
                {t.turning}{' '}
                <span
                  className="neon-pulse text-3xl sm:text-4xl"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                    textShadow: `0 0 14px ${NEON.magenta}, 0 0 28px ${NEON.magenta}80`,
                  }}
                >
                  {ageTurning}
                </span>{' '}
                {t.yearsOld}
              </p>
              <span
                aria-hidden="true"
                className="h-[1px] w-10 sm:w-16"
                style={{ backgroundColor: NEON.magenta, boxShadow: `0 0 8px ${NEON.magenta}` }}
              />
            </div>
          ) : null}

          <span
            aria-hidden="true"
            className="mt-10 mb-10 block h-[1px] w-24"
            style={{ backgroundColor: NEON.lime, boxShadow: `0 0 10px ${NEON.lime}` }}
          />

          <p
            className="text-xs uppercase sm:text-sm"
            style={{
              color: '#FFFFFF',
              fontFamily: BODY_FONT,
              fontWeight: 600,
              letterSpacing: '0.4em',
              opacity: 0.85,
            }}
          >
            <time dateTime={eventDate}>
              {weekday} · {longDate}
            </time>
          </p>

          {landingSubtitle ? (
            <p
              className="mt-6 max-w-xl text-sm leading-7 sm:text-base"
              style={{
                color: '#FFFFFF',
                fontFamily: BODY_FONT,
                fontWeight: 400,
                opacity: 0.7,
              }}
            >
              {landingSubtitle}
            </p>
          ) : (
            <p
              className="mt-6 text-[0.625rem] uppercase"
              style={{
                color: NEON.cyan,
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
                textShadow: `0 0 8px ${NEON.cyan}80`,
              }}
            >
              {t.saveTheDate}
            </p>
          )}
        </div>
      </header>

      {/* ── STORY ──────────────────────────────────────────────────────── */}
      {story && story.body.trim().length > 0 ? (
        <Section id="neon-story" eyebrow={t.story} tone="lime" heading={t.story}>
          <div className="mx-auto max-w-3xl">
            {toParagraphs(story.body).map((paragraph, index) => (
              <p
                key={index}
                className={[
                  'text-base leading-8 sm:text-lg sm:leading-9',
                  index > 0 ? 'mt-6' : '',
                ].join(' ')}
                style={{
                  color: '#FFFFFF',
                  fontFamily: BODY_FONT,
                  fontWeight: 400,
                  opacity: 0.85,
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── COUNTDOWN ──────────────────────────────────────────────────── */}
      <Section
        id="neon-countdown"
        eyebrow={remaining.past ? t.countdownPast : t.countdown}
        tone="cyan"
        heading={remaining.past ? t.countdownPast : t.countdown}
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex w-full items-stretch justify-center gap-3 sm:gap-5">
            <CountdownUnit
              value={pad(remaining.days)}
              caption={t.days}
              tone="cyan"
            />
            <CountdownUnit
              value={pad(remaining.hours)}
              caption={t.hoursShort}
              tone="magenta"
            />
            <CountdownUnit
              value={pad(remaining.minutes)}
              caption={t.minutesShort}
              tone="lime"
            />
            <CountdownUnit
              value={pad(remaining.seconds)}
              caption={t.secondsShort}
              tone="cyan"
            />
          </div>
          <p
            className="mt-10 text-center text-[0.6875rem] uppercase"
            style={{
              color: '#FFFFFF',
              fontFamily: BODY_FONT,
              fontWeight: 600,
              letterSpacing: '0.4em',
              opacity: 0.7,
            }}
          >
            <time dateTime={eventDate}>{longDate}</time>
          </p>
        </div>
      </Section>

      {/* ── LOCATIONS ──────────────────────────────────────────────────── */}
      {locations.length > 0 ? (
        <Section id="neon-locations" eyebrow={t.locations} tone="magenta" heading={t.locations}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {locations.map((location, index) => (
              <GlassCard
                key={`${location.label}-${index}`}
                tone={index % 2 === 0 ? 'cyan' : 'magenta'}
              >
                <p
                  className="mb-3 text-[0.625rem] uppercase"
                  style={{
                    color: index % 2 === 0 ? NEON.cyan : NEON.magenta,
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    letterSpacing: '0.4em',
                    textShadow: `0 0 8px ${index % 2 === 0 ? NEON.cyan : NEON.magenta}80`,
                  }}
                >
                  {location.label}
                </p>
                <h3
                  className="text-2xl leading-tight sm:text-3xl"
                  style={{
                    color: '#FFFFFF',
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                  }}
                >
                  {location.name}
                </h3>
                {location.address ? (
                  <p
                    className="mt-4 text-sm leading-6"
                    style={{ color: '#FFFFFF', opacity: 0.75 }}
                  >
                    {location.address}
                  </p>
                ) : null}
                {location.city ? (
                  <p
                    className="mt-1 text-xs uppercase"
                    style={{
                      color: '#FFFFFF',
                      opacity: 0.55,
                      letterSpacing: '0.3em',
                    }}
                  >
                    {location.city}
                  </p>
                ) : null}
                {location.time ? (
                  <p
                    className="mt-5 inline-flex items-center gap-2 text-xs uppercase"
                    style={{
                      color: NEON.lime,
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      letterSpacing: '0.35em',
                      textShadow: `0 0 8px ${NEON.lime}80`,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="6"
                        cy="6"
                        r="5"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <path
                        d="M6 3 L6 6 L8.5 7.5"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                    </svg>
                    {t.time} · {location.time}
                  </p>
                ) : null}
                {location.mapsLink ? (
                  <a
                    href={location.mapsLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-6 inline-flex items-center gap-2 text-[0.6875rem] uppercase transition-opacity duration-300 hover:opacity-80"
                    style={{
                      color: index % 2 === 0 ? NEON.cyan : NEON.magenta,
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      letterSpacing: '0.3em',
                      textShadow: `0 0 8px ${index % 2 === 0 ? NEON.cyan : NEON.magenta}80`,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 0.75c-2 0-3.6 1.6-3.6 3.6C2.4 7.2 6 11.25 6 11.25S9.6 7.2 9.6 4.35C9.6 2.35 8 0.75 6 0.75Zm0 5.1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
                        fill="currentColor"
                      />
                    </svg>
                    {t.viewMap}
                  </a>
                ) : null}
              </GlassCard>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── PROGRAM ────────────────────────────────────────────────────── */}
      {programDays.length > 0 ? (
        <Section id="neon-program" eyebrow={t.program} tone="lime" heading={t.program}>
          <div className="space-y-16">
            {programDays.map((day, dayIndex) => {
              const tone: NeonTone =
                dayIndex % 3 === 0 ? 'cyan' : dayIndex % 3 === 1 ? 'magenta' : 'lime';
              const accent = NEON[tone];
              return (
                <div key={`day-${dayIndex}`}>
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <p
                        className="text-[0.625rem] uppercase"
                        style={{
                          color: accent,
                          fontFamily: BODY_FONT,
                          fontWeight: 600,
                          letterSpacing: '0.4em',
                          textShadow: `0 0 8px ${accent}80`,
                        }}
                      >
                        {t.day} {dayIndex + 1}
                      </p>
                      <h3
                        className="mt-3 text-3xl leading-none uppercase sm:text-4xl"
                        style={{
                          color: '#FFFFFF',
                          fontFamily: DISPLAY_FONT,
                          fontWeight: 400,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {day.label ??
                          (day.date ? formatLongDate(day.date, locale) : '')}
                      </h3>
                    </div>
                    {day.label && day.date ? (
                      <p
                        className="text-[0.6875rem] uppercase"
                        style={{
                          color: '#FFFFFF',
                          fontFamily: BODY_FONT,
                          fontWeight: 600,
                          letterSpacing: '0.35em',
                          opacity: 0.65,
                        }}
                      >
                        <time dateTime={day.date}>
                          {formatLongDate(day.date, locale)}
                        </time>
                      </p>
                    ) : null}
                  </div>
                  <ul className="space-y-4">
                    {day.items.map((item, itemIndex) => (
                      <li
                        key={`item-${dayIndex}-${itemIndex}`}
                        className="grid grid-cols-[5rem_1fr] gap-4 sm:grid-cols-[7rem_1fr] sm:gap-6"
                      >
                        <span
                          className="neon-pulse text-2xl leading-none sm:text-3xl"
                          style={{
                            color: accent,
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 400,
                            letterSpacing: '0.02em',
                            fontVariantNumeric: 'tabular-nums',
                            textShadow: `0 0 10px ${accent}80`,
                          }}
                        >
                          {item.time}
                        </span>
                        <div>
                          <p
                            className="text-lg leading-tight sm:text-xl"
                            style={{
                              color: '#FFFFFF',
                              fontFamily: BODY_FONT,
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {item.title}
                          </p>
                          {item.detail ? (
                            <p
                              className="mt-2 text-sm leading-6"
                              style={{
                                color: '#FFFFFF',
                                opacity: 0.7,
                                fontFamily: BODY_FONT,
                                fontWeight: 400,
                              }}
                            >
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* ── RSVP ───────────────────────────────────────────────────────── */}
      {rsvpEnabled ? (
        <section
          id="neon-rsvp"
          className="relative w-full overflow-hidden border-t border-white/10 px-6 py-28 text-center sm:px-10 md:py-36"
          style={{ backgroundColor: '#0F0F1A' }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(50% 50% at 50% 50%, rgba(255,46,196,0.10) 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center">
            <p
              className="mb-6 text-[0.6875rem] uppercase"
              style={{
                color: NEON.cyan,
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
                textShadow: `0 0 10px ${NEON.cyan}80`,
              }}
            >
              {t.rsvpHint}
            </p>
            <h2
              className="neon-pulse mb-12 text-4xl uppercase leading-none sm:text-5xl md:text-6xl"
              style={{
                color: NEON.magenta,
                fontFamily: DISPLAY_FONT,
                fontWeight: 400,
                letterSpacing: '0.06em',
                textShadow: `0 0 12px ${NEON.magenta}, 0 0 28px ${NEON.magenta}80`,
              }}
            >
              {t.rsvpTitle}
            </h2>
            <button
              type="button"
              onClick={onRsvpClick}
              className="neon-button rounded-full px-14 py-5 text-xs uppercase sm:text-sm"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.35em',
              }}
            >
              {t.rsvp}
            </button>
          </div>
        </section>
      ) : null}

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer
        className="w-full border-t border-white/10 px-6 py-16 text-center sm:px-10"
        style={{ backgroundColor: '#0F0F1A' }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          <span
            className="text-2xl"
            style={{
              color: NEON.cyan,
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
              letterSpacing: '0.3em',
              textShadow: `0 0 10px ${NEON.cyan}80`,
            }}
          >
            {honoreeName.charAt(0).toUpperCase()}
          </span>
          <span
            aria-hidden="true"
            className="my-8 block h-[1px] w-16"
            style={{ backgroundColor: NEON.magenta, boxShadow: `0 0 8px ${NEON.magenta}` }}
          />
          <p
            className="text-[0.625rem] uppercase"
            style={{
              color: '#FFFFFF',
              fontFamily: BODY_FONT,
              fontWeight: 600,
              letterSpacing: '0.4em',
              opacity: 0.65,
            }}
          >
            {t.madeWith}{' '}
            <span
              style={{
                color: NEON.cyan,
                textShadow: `0 0 8px ${NEON.cyan}80`,
              }}
            >
              {t.attribution}
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}