/**
 * Vintage — Restored Family-Album Anniversary Invitation Template
 *
 * Theme: A milestone anniversary presented as a restored page from an old
 * family album. Sepia tones throughout, aged paper textures, Art Deco
 * ornamental frames, and nostalgic display typography evoke memory,
 * history, and enduring love — as if the invitation itself had been kept
 * inside a leather-bound photo album for decades.
 *
 * Palette (exact hex values):
 *   Dark sepia:      #3E2C1C
 *   Mid sepia:       #8B6F47
 *   Cream aged:      #E8DFCE
 *   Antique gold:    #C19A6B
 *   Very dark text:  #1A0F08
 *
 * Typography (loaded via Google Fonts <link>):
 *   Display: Italiana               (couple name, milestone number, h1/h2)
 *   Body:    Crimson Text           (prose, labels, UI)
 *
 * Aesthetic notes:
 *   - The milestone number rendered in the hero comes from the
 *     `yearsCelebrating` prop and is the emotional anchor of the design.
 *   - A `sepia(60%) contrast(1.05)` filter is applied to any uploaded hero
 *     photo so even a modern color photograph becomes period-appropriate.
 *   - A subtle inline SVG turbulence noise overlay rests on top of every
 *     section to suggest aged paper grain (~5% opacity).
 *   - Inline SVG Art Deco frames and corner flourishes only — no libs.
 *   - Section labels are uppercase, letter-spacing 0.4em, dark sepia.
 *
 * Motion: mostly static — vintage feel. Subtle hover transitions on the
 * RSVP button and cards only. Honors `prefers-reduced-motion: reduce`.
 */
import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react';

export interface PublicInvitationPageProps {
  honoreeName: string;
  yearsCelebrating: number;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  dressCode?: { body: string } | null;
  giftRegistry?: { body: string } | null;
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

// ---------------------------------------------------------------------------
// Palette & typography tokens
// ---------------------------------------------------------------------------
const DARK_SEPIA = '#3E2C1C';
const MID_SEPIA = '#8B6F47';
const CREAM_AGED = '#E8DFCE';
const ANTIQUE_GOLD = '#C19A6B';
const VERY_DARK = '#1A0F08';

const FONT_DISPLAY =
  "'Italiana', 'Playfair Display SC', 'Playfair Display', Georgia, serif";
const FONT_BODY =
  "'Crimson Text', 'Garamond', Georgia, serif";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------
type Locale = 'en' | 'es';

interface Labels {
  heroEyebrow: string;
  heroMilestoneLabel: string;
  heroDateFallback: string;
  storyTitle: string;
  countdownTitle: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  countdownPassed: string;
  countdownAria: string;
  locationsTitle: string;
  locationsOpen: string;
  programTitle: string;
  dressCodeTitle: string;
  giftRegistryTitle: string;
  rsvpTitle: string;
  rsvpBody: string;
  rsvpCta: string;
  footerAttribution: string;
  footerTagline: string;
  closingPhrase: string;
}

const labels: Record<Locale, Labels> = {
  en: {
    heroEyebrow: 'A Milestone Anniversary',
    heroMilestoneLabel: 'Years Together',
    heroDateFallback: 'Save the date',
    storyTitle: 'Our Story',
    countdownTitle: 'Counting the Days',
    countdownDays: 'Days',
    countdownHours: 'Hours',
    countdownMinutes: 'Minutes',
    countdownSeconds: 'Seconds',
    countdownPassed: 'A day to remember',
    countdownAria: 'Time remaining until the anniversary celebration',
    locationsTitle: 'Where We Gather',
    locationsOpen: 'Open in Maps',
    programTitle: 'The Celebration',
    dressCodeTitle: 'Dress Code',
    giftRegistryTitle: 'Gift Registry',
    rsvpTitle: 'Kindly Respond',
    rsvpBody:
      'Your presence at our table is the only gift we ask for. Please let us know if you can join the celebration.',
    rsvpCta: 'Confirm Attendance',
    footerAttribution: 'Crafted with Deer Planner',
    footerTagline: 'A love written in the pages of time.',
    closingPhrase: 'Together, then & always',
  },
  es: {
    heroEyebrow: 'Un Aniversario Memorable',
    heroMilestoneLabel: 'Años Juntos',
    heroDateFallback: 'Reservá la fecha',
    storyTitle: 'Nuestra Historia',
    countdownTitle: 'Cuenta Regresiva',
    countdownDays: 'Días',
    countdownHours: 'Horas',
    countdownMinutes: 'Minutos',
    countdownSeconds: 'Segundos',
    countdownPassed: 'Un día para recordar',
    countdownAria: 'Tiempo restante hasta la celebración del aniversario',
    locationsTitle: 'Dónde Nos Reunimos',
    locationsOpen: 'Abrir en Mapas',
    programTitle: 'La Celebración',
    dressCodeTitle: 'Código de Vestimenta',
    giftRegistryTitle: 'Mesa de Regalos',
    rsvpTitle: 'Confirmanos tu Asistencia',
    rsvpBody:
      'Tu presencia en nuestra mesa es el único regalo que pedimos. Por favor, decinos si podés sumarte a la celebración.',
    rsvpCta: 'Confirmar Asistencia',
    footerAttribution: 'Hecho con Deer Planner',
    footerTagline: 'Un amor escrito en las páginas del tiempo.',
    closingPhrase: 'Juntos, entonces y siempre',
  },
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function parseEventDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatLongDate(iso: string, locale: Locale): string {
  const d = parseEventDate(iso);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string, locale: Locale): string {
  const d = parseEventDate(iso);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

function computeCountdown(target: Date | null, now: number): CountdownParts {
  const fallback: CountdownParts = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    passed: true,
  };
  if (!target) return fallback;
  const diff = target.getTime() - now;
  if (diff <= 0) return fallback;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    passed: false,
  };
}

// ---------------------------------------------------------------------------
// Aged-paper noise texture (data URL, ~5% opacity by design)
// ---------------------------------------------------------------------------
const PAPER_NOISE_DATA_URL =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>" +
  "<filter id='vintage-grain'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 0.24  0 0 0 0 0.17  0 0 0 0 0.11  0 0 0 0.6 0'/>" +
  "</filter>" +
  "<rect width='100%' height='100%' filter='url(%23vintage-grain)'/>" +
  "</svg>";

// ---------------------------------------------------------------------------
// Inline decorative SVGs — Art Deco family-album iconography
// ---------------------------------------------------------------------------
function ArtDecoMilestoneFrame(props: {
  number: number | string;
  suffix: string;
}) {
  return (
    <div className="relative inline-block">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 320 180"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          x="3"
          y="3"
          width="314"
          height="174"
          fill="none"
          stroke={DARK_SEPIA}
          strokeWidth="1.5"
        />
        <rect
          x="10"
          y="10"
          width="300"
          height="160"
          fill="none"
          stroke={DARK_SEPIA}
          strokeWidth="0.5"
          opacity="0.55"
        />
        <rect x="3" y="3" width="14" height="14" fill={DARK_SEPIA} />
        <rect x="303" y="3" width="14" height="14" fill={DARK_SEPIA} />
        <rect x="3" y="163" width="14" height="14" fill={DARK_SEPIA} />
        <rect x="303" y="163" width="14" height="14" fill={DARK_SEPIA} />
        <polygon points="26,11 30,5 34,11 30,17" fill={ANTIQUE_GOLD} />
        <polygon points="286,11 290,5 294,11 290,17" fill={ANTIQUE_GOLD} />
        <polygon points="26,163 30,169 34,163 30,157" fill={ANTIQUE_GOLD} />
        <polygon points="286,169 290,163 294,169 290,175" fill={ANTIQUE_GOLD} />
        <line x1="3" y1="28" x2="317" y2="28" stroke={DARK_SEPIA} strokeWidth="0.5" />
        <line x1="3" y1="152" x2="317" y2="152" stroke={DARK_SEPIA} strokeWidth="0.5" />
        <line
          x1="40"
          y1="40"
          x2="56"
          y2="40"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="40"
          y1="40"
          x2="40"
          y2="56"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="264"
          y1="40"
          x2="280"
          y2="40"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="280"
          y1="40"
          x2="280"
          y2="56"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="40"
          y1="140"
          x2="56"
          y2="140"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="40"
          y1="124"
          x2="40"
          y2="140"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="264"
          y1="140"
          x2="280"
          y2="140"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
        <line
          x1="280"
          y1="124"
          x2="280"
          y2="140"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
        />
      </svg>
      <div className="relative flex items-baseline justify-center gap-4 px-12 py-10 sm:px-16 sm:py-12">
        <span
          className="text-7xl leading-none sm:text-8xl md:text-9xl"
          style={{
            fontFamily: FONT_DISPLAY,
            color: DARK_SEPIA,
            letterSpacing: '0.04em',
          }}
        >
          {props.number}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.4em] sm:text-xs"
          style={{ fontFamily: FONT_BODY, color: MID_SEPIA }}
        >
          {props.suffix}
        </span>
      </div>
    </div>
  );
}

function DiamondGlyph(props: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={props.className}
      style={props.style}
    >
      <polygon points="8,1 15,8 8,15 1,8" fill={ANTIQUE_GOLD} />
      <polygon points="8,4 12,8 8,12 4,8" fill={CREAM_AGED} />
      <polygon points="8,6 10,8 8,10 6,8" fill={DARK_SEPIA} />
    </svg>
  );
}

function CornerFlourish(props: {
  className?: string;
  style?: CSSProperties;
  flipX?: boolean;
  flipY?: boolean;
}) {
  const tx = props.flipX ? 'scale(-1,1)' : undefined;
  const ty = props.flipY ? 'scale(1,-1)' : undefined;
  const transform =
    tx && ty ? `${tx} ${ty}` : tx ? tx : ty ? ty : undefined;
  return (
    <svg
      viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={props.className}
      style={props.style}
    >
      <g transform={transform}>
        <path
          d="M2 2 L30 2"
          stroke={DARK_SEPIA}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M2 2 L2 30"
          stroke={DARK_SEPIA}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M6 2 Q14 6 14 14 Q14 20 8 20 Q4 20 4 16"
          stroke={DARK_SEPIA}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M2 6 Q6 14 14 14"
          stroke={DARK_SEPIA}
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="2" cy="2" r="1.6" fill={ANTIQUE_GOLD} />
        <polygon points="20,2 23,5 20,8 17,5" fill={DARK_SEPIA} />
      </g>
    </svg>
  );
}

function OrnamentalDivider(props: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-4 ${
        props.className ?? ''
      }`}
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-[#3E2C1C] opacity-50" />
      <DiamondGlyph className="h-3 w-3" />
      <span className="h-px w-16 bg-[#3E2C1C] opacity-50" />
    </div>
  );
}

function VignetteLabel(props: { children: string }) {
  return (
    <div className="flex justify-center">
      <span
        className="inline-block border-y border-[#3E2C1C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.4em]"
        style={{ fontFamily: FONT_BODY, color: DARK_SEPIA }}
      >
        {props.children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper — applies paper texture + corner ornaments
// ---------------------------------------------------------------------------
function SectionShell(props: {
  background: string;
  textColor: string;
  children: React.ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const tone = props.tone ?? 'light';
  return (
    <section
      className={`relative overflow-hidden ${props.className ?? ''}`}
      style={{ backgroundColor: props.background, color: props.textColor }}
    >
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${PAPER_NOISE_DATA_URL}")`,
          backgroundSize: '240px 240px',
        }}
      />
      <CornerFlourish
        className="absolute left-3 top-3 h-10 w-10 md:h-14 md:w-14"
        style={{ color: tone === 'dark' ? ANTIQUE_GOLD : DARK_SEPIA }}
      />
      <CornerFlourish
        flipX
        className="absolute right-3 top-3 h-10 w-10 md:h-14 md:w-14"
        style={{ color: tone === 'dark' ? ANTIQUE_GOLD : DARK_SEPIA }}
      />
      <CornerFlourish
        flipY
        className="absolute bottom-3 left-3 h-10 w-10 md:h-14 md:w-14"
        style={{ color: tone === 'dark' ? ANTIQUE_GOLD : DARK_SEPIA }}
      />
      <CornerFlourish
        flipX
        flipY
        className="absolute bottom-3 right-3 h-10 w-10 md:h-14 md:w-14"
        style={{ color: tone === 'dark' ? ANTIQUE_GOLD : DARK_SEPIA }}
      />
      <div className="relative">{props.children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function HeroSection(
  props: PublicInvitationPageProps & { t: Labels; hasHeroPhoto: boolean },
) {
  const {
    honoreeName,
    yearsCelebrating,
    eventDate,
    heroImageUrl,
    landingSubtitle,
    t,
    hasHeroPhoto,
    locale,
  } = props;
  const dateLabel = formatLongDate(eventDate, locale);

  return (
    <header
      className="relative overflow-hidden"
      style={{ backgroundColor: DARK_SEPIA }}
    >
      {hasHeroPhoto ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImageUrl ?? ''})`,
            filter: 'sepia(60%) contrast(1.05) brightness(0.92)',
          }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 30%, ${CREAM_AGED} 0%, ${MID_SEPIA}55 45%, ${DARK_SEPIA} 100%)`,
          }}
        />
      )}

      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(26,15,8,0.35) 0%, rgba(26,15,8,0.55) 55%, rgba(26,15,8,0.85) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-25"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${PAPER_NOISE_DATA_URL}")`,
          backgroundSize: '240px 240px',
        }}
      />

      <CornerFlourish
        className="absolute left-3 top-3 z-10 h-12 w-12 md:h-16 md:w-16"
        style={{ color: ANTIQUE_GOLD }}
      />
      <CornerFlourish
        flipX
        className="absolute right-3 top-3 z-10 h-12 w-12 md:h-16 md:w-16"
        style={{ color: ANTIQUE_GOLD }}
      />
      <CornerFlourish
        flipY
        className="absolute bottom-3 left-3 z-10 h-12 w-12 md:h-16 md:w-16"
        style={{ color: ANTIQUE_GOLD }}
      />
      <CornerFlourish
        flipX
        flipY
        className="absolute bottom-3 right-3 z-10 h-12 w-12 md:h-16 md:w-16"
        style={{ color: ANTIQUE_GOLD }}
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <VignetteLabel>{t.heroEyebrow}</VignetteLabel>

        <h1
          className="mt-10 text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl"
          style={{
            fontFamily: FONT_DISPLAY,
            color: CREAM_AGED,
            letterSpacing: '0.02em',
            textShadow: '0 2px 18px rgba(26,15,8,0.55)',
          }}
        >
          {honoreeName}
        </h1>

        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.4em] sm:text-xs"
          style={{ fontFamily: FONT_BODY, color: ANTIQUE_GOLD }}
        >
          {t.closingPhrase}
        </p>

        <div className="my-12">
          <ArtDecoMilestoneFrame
            number={yearsCelebrating}
            suffix={t.heroMilestoneLabel}
          />
        </div>

        <p
          className="mt-2 text-base sm:text-lg md:text-xl"
          style={{
            fontFamily: FONT_BODY,
            color: CREAM_AGED,
            fontStyle: 'italic',
          }}
        >
          {dateLabel || t.heroDateFallback}
        </p>

        {landingSubtitle ? (
          <p
            className="mt-6 max-w-xl text-sm sm:text-base"
            style={{ fontFamily: FONT_BODY, color: CREAM_AGED, opacity: 0.85 }}
          >
            {landingSubtitle}
          </p>
        ) : null}

        <div className="mt-14 flex justify-center">
          <OrnamentalDivider />
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------
function StorySection(props: { body: string; t: Labels }) {
  return (
    <SectionShell
      background={CREAM_AGED}
      textColor={VERY_DARK}
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl text-center">
        <VignetteLabel>{props.t.storyTitle}</VignetteLabel>
        <h2
          className="mt-6 text-4xl sm:text-5xl md:text-6xl"
          style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
        >
          {props.t.storyTitle}
        </h2>
        <div className="my-8 flex justify-center">
          <OrnamentalDivider />
        </div>
        <p
          className="whitespace-pre-line text-lg leading-relaxed sm:text-xl"
          style={{ fontFamily: FONT_BODY, color: VERY_DARK }}
        >
          {props.body}
        </p>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------
function CountdownSection(props: {
  eventDate: string;
  t: Labels;
  locale: Locale;
}) {
  const target = useMemo(
    () => parseEventDate(props.eventDate),
    [props.eventDate],
  );
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = computeCountdown(target, now);

  const units: Array<{ value: number; label: string; key: string }> = [
    { value: parts.days, label: props.t.countdownDays, key: 'd' },
    { value: parts.hours, label: props.t.countdownHours, key: 'h' },
    { value: parts.minutes, label: props.t.countdownMinutes, key: 'm' },
    { value: parts.seconds, label: props.t.countdownSeconds, key: 's' },
  ];

  return (
    <SectionShell
      background={CREAM_AGED}
      textColor={VERY_DARK}
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <VignetteLabel>{props.t.countdownTitle}</VignetteLabel>
        <h2
          className="mt-6 text-4xl sm:text-5xl md:text-6xl"
          style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
        >
          {props.t.countdownTitle}
        </h2>

        {parts.passed ? (
          <p
            className="mt-12 text-2xl italic sm:text-3xl"
            style={{ fontFamily: FONT_DISPLAY, color: MID_SEPIA }}
          >
            {props.t.countdownPassed}
          </p>
        ) : (
          <div
            className="mt-14 flex flex-wrap items-start justify-center gap-1 sm:gap-2"
            role="timer"
            aria-label={props.t.countdownAria}
          >
            {units.map((u, i) => (
              <Fragment key={u.key}>
                <div className="flex flex-col items-center px-3 sm:px-5">
                  <span
                    className="text-5xl leading-none sm:text-6xl md:text-7xl"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      color: DARK_SEPIA,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(u.value).padStart(2, '0')}
                  </span>
                  <span
                    className="mt-3 text-[10px] font-semibold uppercase tracking-[0.4em] sm:text-[11px]"
                    style={{ fontFamily: FONT_BODY, color: MID_SEPIA }}
                  >
                    {u.label}
                  </span>
                </div>
                {i < units.length - 1 ? (
                  <DiamondGlyph
                    className="mt-6 h-3 w-3 sm:mt-8 sm:h-4 sm:w-4"
                    style={{ opacity: 0.85 }}
                  />
                ) : null}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------
function LocationsSection(props: {
  locations: PublicInvitationPageProps['locations'];
  t: Labels;
}) {
  if (!props.locations || props.locations.length === 0) return null;
  return (
    <SectionShell
      background={CREAM_AGED}
      textColor={VERY_DARK}
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <VignetteLabel>{props.t.locationsTitle}</VignetteLabel>
          <h2
            className="mt-6 text-4xl sm:text-5xl md:text-6xl"
            style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
          >
            {props.t.locationsTitle}
          </h2>
          <div className="my-8 flex justify-center">
            <OrnamentalDivider />
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {props.locations.map((loc, idx) => (
            <article
              key={`${loc.label}-${idx}`}
              className="relative vintage-card border border-[#3E2C1C] p-6 sm:p-8"
              style={{
                backgroundColor: CREAM_AGED,
                boxShadow: 'inset 0 0 0 4px #E8DFCE, inset 0 0 0 5px #3E2C1C',
              }}
            >
              <CornerFlourish
                className="absolute left-1 top-1 h-5 w-5"
                style={{ color: ANTIQUE_GOLD }}
              />
              <CornerFlourish
                flipX
                className="absolute right-1 top-1 h-5 w-5"
                style={{ color: ANTIQUE_GOLD }}
              />
              <CornerFlourish
                flipY
                className="absolute bottom-1 left-1 h-5 w-5"
                style={{ color: ANTIQUE_GOLD }}
              />
              <CornerFlourish
                flipX
                flipY
                className="absolute bottom-1 right-1 h-5 w-5"
                style={{ color: ANTIQUE_GOLD }}
              />

              <p
                className="text-[10px] font-semibold uppercase tracking-[0.4em]"
                style={{ fontFamily: FONT_BODY, color: DARK_SEPIA }}
              >
                {loc.label}
              </p>
              <h3
                className="mt-3 text-2xl sm:text-3xl"
                style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
              >
                {loc.name}
              </h3>
              {loc.address ? (
                <p
                  className="mt-2 text-base"
                  style={{ fontFamily: FONT_BODY, color: VERY_DARK }}
                >
                  {loc.address}
                </p>
              ) : null}
              {loc.city ? (
                <p
                  className="text-base"
                  style={{ fontFamily: FONT_BODY, color: VERY_DARK }}
                >
                  {loc.city}
                </p>
              ) : null}
              {loc.time ? (
                <p
                  className="mt-3 text-sm italic"
                  style={{ fontFamily: FONT_BODY, color: MID_SEPIA }}
                >
                  {loc.time}
                </p>
              ) : null}
              {loc.mapsLink ? (
                <a
                  href={loc.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block text-[11px] font-semibold uppercase tracking-[0.4em] text-[#3E2C1C] underline decoration-[#C19A6B] underline-offset-4 transition-colors duration-300 hover:text-[#8B6F47]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {props.t.locationsOpen}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------
function ProgramSection(props: {
  program: PublicInvitationPageProps['program'];
  t: Labels;
  locale: Locale;
}) {
  const days = props.program?.days ?? [];
  if (days.length === 0) return null;
  return (
    <SectionShell
      background={CREAM_AGED}
      textColor={VERY_DARK}
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <VignetteLabel>{props.t.programTitle}</VignetteLabel>
          <h2
            className="mt-6 text-4xl sm:text-5xl md:text-6xl"
            style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
          >
            {props.t.programTitle}
          </h2>
          <div className="my-8 flex justify-center">
            <OrnamentalDivider />
          </div>
        </div>

        <div className="mt-10 space-y-12">
          {days.map((day, dayIdx) => (
            <div key={`day-${dayIdx}`}>
              {(day.label || day.date) && (
                <div className="mb-8 flex items-center gap-4">
                  <span
                    className="h-px flex-1 bg-[#3E2C1C] opacity-30"
                    aria-hidden="true"
                  />
                  <div className="text-center">
                    {day.label ? (
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.4em]"
                        style={{ fontFamily: FONT_BODY, color: DARK_SEPIA }}
                      >
                        {day.label}
                      </p>
                    ) : null}
                    {day.date ? (
                      <p
                        className="mt-1 text-xl italic sm:text-2xl"
                        style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
                      >
                        {formatShortDate(day.date, props.locale)}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="h-px flex-1 bg-[#3E2C1C] opacity-30"
                    aria-hidden="true"
                  />
                </div>
              )}

              <ol className="space-y-4">
                {day.items.map((item, itemIdx) => (
                  <li
                    key={`item-${dayIdx}-${itemIdx}`}
                    className="relative flex flex-col gap-3 border border-[#3E2C1C] p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6"
                    style={{
                      backgroundColor: CREAM_AGED,
                      boxShadow:
                        'inset 0 0 0 3px #E8DFCE, inset 0 0 0 4px #3E2C1C',
                    }}
                  >
                    <div className="sm:w-32 sm:flex-shrink-0">
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.4em]"
                        style={{ fontFamily: FONT_BODY, color: DARK_SEPIA }}
                      >
                        {item.time}
                      </p>
                    </div>
                    <div>
                      <h4
                        className="text-xl sm:text-2xl"
                        style={{
                          fontFamily: FONT_DISPLAY,
                          color: DARK_SEPIA,
                        }}
                      >
                        {item.title}
                      </h4>
                      {item.detail ? (
                        <p
                          className="mt-1 text-base"
                          style={{ fontFamily: FONT_BODY, color: VERY_DARK }}
                        >
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Dress code
// ---------------------------------------------------------------------------
function DressCodeSection(props: { body: string; t: Labels }) {
  return (
    <SectionShell
      background={CREAM_AGED}
      textColor={VERY_DARK}
      className="px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-3xl text-center">
        <VignetteLabel>{props.t.dressCodeTitle}</VignetteLabel>
        <h2
          className="mt-6 text-4xl sm:text-5xl"
          style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
        >
          {props.t.dressCodeTitle}
        </h2>
        <div className="my-8 flex justify-center">
          <OrnamentalDivider />
        </div>
        <p
          className="whitespace-pre-line text-lg leading-relaxed sm:text-xl"
          style={{ fontFamily: FONT_BODY, color: VERY_DARK }}
        >
          {props.body}
        </p>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Gift registry
// ---------------------------------------------------------------------------
function GiftRegistrySection(props: { body: string; t: Labels }) {
  return (
    <SectionShell
      background={DARK_SEPIA}
      textColor={CREAM_AGED}
      tone="dark"
      className="px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span
          className="inline-block border-y border-[#C19A6B] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.4em]"
          style={{ fontFamily: FONT_BODY, color: ANTIQUE_GOLD }}
        >
          {props.t.giftRegistryTitle}
        </span>
        <h2
          className="mt-6 text-4xl sm:text-5xl"
          style={{ fontFamily: FONT_DISPLAY, color: CREAM_AGED }}
        >
          {props.t.giftRegistryTitle}
        </h2>
        <div className="my-8 flex justify-center">
          <DiamondGlyph className="h-4 w-4" />
        </div>
        <p
          className="whitespace-pre-line text-lg leading-relaxed sm:text-xl"
          style={{ fontFamily: FONT_BODY, color: CREAM_AGED }}
        >
          {props.body}
        </p>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// RSVP CTA
// ---------------------------------------------------------------------------
function RsvpSection(props: { t: Labels; onRsvpClick?: () => void }) {
  return (
    <SectionShell
      background={CREAM_AGED}
      textColor={VERY_DARK}
      className="px-6 py-24 text-center"
    >
      <div className="mx-auto max-w-2xl">
        <VignetteLabel>{props.t.rsvpTitle}</VignetteLabel>
        <h2
          className="mt-6 text-4xl sm:text-5xl md:text-6xl"
          style={{ fontFamily: FONT_DISPLAY, color: DARK_SEPIA }}
        >
          {props.t.rsvpTitle}
        </h2>
        <div className="my-8 flex justify-center">
          <OrnamentalDivider />
        </div>
        <p
          className="text-lg leading-relaxed sm:text-xl"
          style={{ fontFamily: FONT_BODY, color: VERY_DARK }}
        >
          {props.t.rsvpBody}
        </p>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function FooterSection(props: { t: Labels }) {
  return (
    <footer
      className="relative overflow-hidden px-6 py-12 text-center"
      style={{ backgroundColor: VERY_DARK, color: CREAM_AGED }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${PAPER_NOISE_DATA_URL}")`,
          backgroundSize: '240px 240px',
        }}
      />
      <CornerFlourish
        className="absolute left-3 top-3 h-8 w-8"
        style={{ color: ANTIQUE_GOLD }}
      />
      <CornerFlourish
        flipX
        className="absolute right-3 top-3 h-8 w-8"
        style={{ color: ANTIQUE_GOLD }}
      />
      <CornerFlourish
        flipY
        className="absolute bottom-3 left-3 h-8 w-8"
        style={{ color: ANTIQUE_GOLD }}
      />
      <CornerFlourish
        flipX
        flipY
        className="absolute bottom-3 right-3 h-8 w-8"
        style={{ color: ANTIQUE_GOLD }}
      />
      <div className="relative">
        <div className="mb-5 flex justify-center">
          <OrnamentalDivider />
        </div>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.4em]"
          style={{ fontFamily: FONT_BODY, color: ANTIQUE_GOLD }}
        >
          {props.t.footerAttribution}
        </p>
        <p
          className="mt-3 text-base italic"
          style={{ fontFamily: FONT_DISPLAY, color: CREAM_AGED }}
        >
          {props.t.footerTagline}
        </p>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Fonts loader
// ---------------------------------------------------------------------------
function GoogleFontsLink() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Italiana&display=swap"
    />
  );
}

// ---------------------------------------------------------------------------
// Motion styles (CSS variables consumed by classes below)
// ---------------------------------------------------------------------------
const motionStyles = `
  .vintage-cta {
    transition: transform 300ms ease, background-color 300ms ease, box-shadow 300ms ease;
  }
  .vintage-cta:hover {
    background-color: #A8855C !important;
    transform: scale(1.02);
    box-shadow: 0 8px 22px -8px rgba(26, 15, 8, 0.55);
  }
  .vintage-card {
    transition: transform 300ms ease, box-shadow 300ms ease;
  }
  .vintage-card:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 0 0 4px #E8DFCE,
      inset 0 0 0 5px #3E2C1C,
      0 10px 24px -12px rgba(26, 15, 8, 0.5) !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .vintage-cta,
    .vintage-card {
      transition: none !important;
    }
    .vintage-cta:hover {
      transform: none !important;
    }
    .vintage-card:hover {
      transform: none !important;
    }
  }
`;

function MotionStyles() {
  return <style>{motionStyles}</style>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function VintageTemplate(props: PublicInvitationPageProps) {
  const t = labels[props.locale] ?? labels.en;
  const hasHeroPhoto = Boolean(props.heroImageUrl);

  const showStory = Boolean(props.story && props.story.body);
  const showDressCode = Boolean(props.dressCode && props.dressCode.body);
  const showGiftRegistry = Boolean(
    props.giftRegistry && props.giftRegistry.body,
  );

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: CREAM_AGED, color: VERY_DARK }}
    >
      <GoogleFontsLink />
      <MotionStyles />

      <HeroSection {...props} t={t} hasHeroPhoto={hasHeroPhoto} />

      {showStory ? <StorySection body={props.story?.body ?? ''} t={t} /> : null}

      <CountdownSection
        eventDate={props.eventDate}
        t={t}
        locale={props.locale}
      />

      <LocationsSection locations={props.locations} t={t} />

      <ProgramSection program={props.program} t={t} locale={props.locale} />

      {showDressCode ? (
        <DressCodeSection body={props.dressCode?.body ?? ''} t={t} />
      ) : null}

      {showGiftRegistry ? (
        <GiftRegistrySection body={props.giftRegistry?.body ?? ''} t={t} />
      ) : null}

      {props.rsvpEnabled ? (
        <RsvpSection t={t} onRsvpClick={props.onRsvpClick} />
      ) : null}

      <FooterSection t={t} />
    </div>
  );
}
