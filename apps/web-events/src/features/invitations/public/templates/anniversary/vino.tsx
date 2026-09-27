/**
 * Vino — Intimate Wine Dinner Anniversary Invitation Template
 *
 * Theme: An intimate anniversary dinner (25, 30, 40 years) soaked in the
 * warmth of a candlelit wine cellar. Wine-red and granate panels alternate
 * with cream, gold serif typography, and quiet decorative motifs (wine
 * glass silhouettes, grape clusters, vine curls) that evoke a private
 * tasting menu. The milestone number rendered in the hero comes from the
 * `yearsCelebrating` prop and is the emotional anchor of the design.
 *
 * Palette (exact hex values):
 *   Wine red:     #722F37
 *   Granate:      #A53F2B
 *   Cream:        #F5E6D3
 *   Gold:         #D4AF37
 *   Dark text:    #1A0E0E
 *
 * Typography (loaded via Google Fonts <link>):
 *   Display: Playfair Display (italic for honoree name, h1, h2)
 *   Body:    Cormorant Garamond
 *
 * Motion: subtle gold shimmer and soft fade. Honors
 * `prefers-reduced-motion: reduce`.
 */
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

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
const WINE = '#722F37';
const GRANATE = '#A53F2B';
const CREAM = '#F5E6D3';
const GOLD = '#D4AF37';
const DARK = '#1A0E0E';

const FONT_DISPLAY =
  "'Playfair Display', 'Cormorant Garamond', Georgia, serif";
const FONT_BODY =
  "'Cormorant Garamond', 'Garamond', Georgia, serif";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------
type Locale = 'en' | 'es';

interface Labels {
  heroEyebrow: string;
  heroMilestoneSuffix: string;
  heroDateFallback: string;
  heroFlanking: string;
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
}

const labels: Record<Locale, Labels> = {
  en: {
    heroEyebrow: 'An Anniversary Dinner',
    heroMilestoneSuffix: 'Years',
    heroDateFallback: 'Save the date',
    heroFlanking: 'Together',
    storyTitle: 'Our Story',
    countdownTitle: 'The Evening Draws Near',
    countdownDays: 'Days',
    countdownHours: 'Hours',
    countdownMinutes: 'Minutes',
    countdownSeconds: 'Seconds',
    countdownPassed: 'A night to remember',
    countdownAria: 'Time remaining until the anniversary celebration',
    locationsTitle: 'Where to Find Us',
    locationsOpen: 'Open in Maps',
    programTitle: 'The Evening',
    dressCodeTitle: 'Dress Code',
    giftRegistryTitle: 'Gifts & Wishes',
    rsvpTitle: 'Will You Join Us?',
    rsvpBody:
      'Your presence at our table is the only gift we ask for. Kindly let us know if you can join the celebration.',
    rsvpCta: 'Confirm Attendance',
    footerAttribution: 'Crafted with Deer Planner',
    footerTagline: 'A table set, a glass raised, a love celebrated.',
  },
  es: {
    heroEyebrow: 'Una Cena de Aniversario',
    heroMilestoneSuffix: 'Años',
    heroDateFallback: 'Reservá la fecha',
    heroFlanking: 'Juntos',
    storyTitle: 'Nuestra Historia',
    countdownTitle: 'La Velada Se Acerca',
    countdownDays: 'Días',
    countdownHours: 'Horas',
    countdownMinutes: 'Minutos',
    countdownSeconds: 'Segundos',
    countdownPassed: 'Una noche para recordar',
    countdownAria: 'Tiempo restante hasta la celebración del aniversario',
    locationsTitle: 'Dónde Encontrarnos',
    locationsOpen: 'Abrir en Mapas',
    programTitle: 'La Velada',
    dressCodeTitle: 'Código de Vestimenta',
    giftRegistryTitle: 'Regalos y Deseos',
    rsvpTitle: '¿Nos Acompañás?',
    rsvpBody:
      'Tu presencia en nuestra mesa es el único regalo que pedimos. Por favor, confirmá si podés sumarte a la celebración.',
    rsvpCta: 'Confirmar Asistencia',
    footerAttribution: 'Hecho con Deer Planner',
    footerTagline: 'Una mesa puesta, una copa alzada, un amor celebrado.',
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

function computeCountdown(target: Date | null): CountdownParts {
  const fallback: CountdownParts = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    passed: true,
  };
  if (!target) return fallback;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return fallback;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, passed: false };
}

// ---------------------------------------------------------------------------
// Inline decorative SVGs
// ---------------------------------------------------------------------------
function WineGlassIcon(props: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 60 110"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={props.className}
      style={props.style}
    >
      <path
        d="M14 8 Q14 4 18 4 L42 4 Q46 4 46 8 L46 36 Q46 60 30 76 Q14 60 14 36 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M22 18 Q22 14 26 14 L34 14 Q38 14 38 18 L38 30 Q38 42 30 50 Q22 42 22 30 Z"
        fill="currentColor"
        opacity="0.18"
      />
      <line
        x1="30"
        y1="76"
        x2="30"
        y2="98"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <line
        x1="18"
        y1="102"
        x2="42"
        y2="102"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M26 14 Q30 10 34 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function GrapeClusterIcon(props: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 40 56"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={props.className}
      style={props.style}
    >
      <path
        d="M20 4 Q26 8 24 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M20 4 Q14 8 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="12" cy="22" r="4.5" fill="currentColor" opacity="0.85" />
      <circle cx="22" cy="20" r="4.5" fill="currentColor" opacity="0.85" />
      <circle cx="32" cy="22" r="4.5" fill="currentColor" opacity="0.85" />
      <circle cx="17" cy="32" r="4.5" fill="currentColor" opacity="0.85" />
      <circle cx="27" cy="32" r="4.5" fill="currentColor" opacity="0.85" />
      <circle cx="22" cy="44" r="4.5" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function VineMotif(props: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 220 30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={props.className}
      style={props.style}
    >
      <path
        d="M5 15 Q40 4 80 15 T160 15 T215 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M70 15 Q75 8 82 12 Q88 18 80 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M140 15 Q145 8 152 12 Q158 18 150 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="40" cy="10" r="1.5" fill="currentColor" />
      <circle cx="115" cy="12" r="1.5" fill="currentColor" />
      <circle cx="190" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FlourishDivider(props: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-[#D4AF37] ${
        props.className ?? ''
      }`}
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-[#D4AF37] opacity-60" />
      <GrapeClusterIcon className="h-5 w-auto" />
      <span className="h-px w-16 bg-[#D4AF37] opacity-60" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section label (eyebrow) — uppercase, gold, wide tracking
// ---------------------------------------------------------------------------
function SectionEyebrow(props: { children: string }) {
  return (
    <p
      className="text-[11px] sm:text-xs font-medium uppercase text-[#D4AF37] tracking-[0.4em]"
      style={{ fontFamily: FONT_BODY }}
    >
      {props.children}
    </p>
  );
}

function GoldHairline() {
  return (
    <div className="flex items-center justify-center py-6" aria-hidden="true">
      <span className="h-px w-24 bg-[#D4AF37] opacity-50" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function HeroSection(
  props: PublicInvitationPageProps & { t: Labels; hasHeroPhoto: boolean },
) {
  const { honoreeName, yearsCelebrating, eventDate, heroImageUrl, t, hasHeroPhoto } =
    props;
  const dateLabel = formatLongDate(eventDate, props.locale);

  return (
    <header
      className="relative overflow-hidden"
      style={{
        backgroundColor: hasHeroPhoto ? DARK : WINE,
      }}
    >
      {/* Background image or gradient fallback */}
      {hasHeroPhoto ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImageUrl ?? ''})`,
          }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 35%, ${GRANATE} 0%, ${WINE} 55%, ${DARK} 100%)`,
          }}
        />
      )}

      {/* Vignette + warm overlay for readability */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(26,14,14,0.35) 0%, rgba(26,14,14,0.55) 60%, rgba(26,14,14,0.85) 100%)',
        }}
      />

      {/* Decorative wine glasses flanking the milestone number */}
      <WineGlassIcon
        className="absolute left-[6%] top-[18%] hidden h-32 w-auto text-[#D4AF37] opacity-30 md:block vino-float-slow"
      />
      <WineGlassIcon
        className="absolute right-[6%] top-[22%] hidden h-40 w-auto text-[#D4AF37] opacity-30 md:block vino-float-slower"
      />

      <div className="relative mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <p
          className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-[#D4AF37]"
          style={{ fontFamily: FONT_BODY }}
        >
          {t.heroEyebrow}
        </p>

        <h1
          className="text-5xl font-bold italic leading-tight text-[#F5E6D3] sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {honoreeName}
        </h1>

        {/* Gold milestone number with wine-stain splash */}
        <div className="relative my-10 flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-0"
            style={{
              backgroundImage: `radial-gradient(circle at center, ${WINE} 0%, ${GRANATE}35% 35%, transparent 70%)`,
              filter: 'blur(14px)',
              transform: 'scale(1.4)',
              opacity: 0.7,
            }}
          />
          <span
            className="relative z-10 text-7xl font-bold italic text-[#D4AF37] sm:text-8xl md:text-9xl vino-shimmer"
            style={{
              fontFamily: FONT_DISPLAY,
              textShadow: '0 0 24px rgba(212,175,55,0.35)',
            }}
          >
            {yearsCelebrating}
          </span>
          <span
            className="relative z-10 ml-3 text-sm font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-base"
            style={{ fontFamily: FONT_BODY }}
          >
            {t.heroMilestoneSuffix}
          </span>
        </div>

        <p
          className="mt-2 text-base text-[#F5E6D3] sm:text-lg"
          style={{ fontFamily: FONT_BODY, fontStyle: 'italic' }}
        >
          {dateLabel || t.heroDateFallback}
        </p>

        {props.landingSubtitle ? (
          <p
            className="mt-6 max-w-xl text-sm text-[#F5E6D3]/80 sm:text-base"
            style={{ fontFamily: FONT_BODY }}
          >
            {props.landingSubtitle}
          </p>
        ) : null}

        <div className="mt-12 flex items-center justify-center text-[#D4AF37]">
          <VineMotif className="h-6 w-48 opacity-70" />
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
    <section
      className="relative px-6 py-20 md:py-28"
      style={{ backgroundColor: CREAM }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <SectionEyebrow>{props.t.storyTitle}</SectionEyebrow>
        <h2
          className="mt-4 text-3xl font-bold italic text-[#1A0E0E] sm:text-4xl md:text-5xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {props.t.storyTitle}
        </h2>
        <div className="my-8 flex justify-center text-[#D4AF37]">
          <VineMotif className="h-5 w-40 opacity-80" />
        </div>
        <p
          className="whitespace-pre-line text-lg leading-relaxed text-[#1A0E0E] sm:text-xl"
          style={{ fontFamily: FONT_BODY }}
        >
          {props.body}
        </p>
      </div>
    </section>
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
  const target = useMemo(() => parseEventDate(props.eventDate), [props.eventDate]);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const parts = useMemo(() => {
    const base = computeCountdown(target);
    // Recompute using "now" so the timer ticks reactively.
    if (!target) return base;
    const diff = target.getTime() - now;
    if (diff <= 0) return base;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      passed: false,
    };
  }, [target, now]);

  const units: Array<{ value: number; label: string }> = [
    { value: parts.days, label: props.t.countdownDays },
    { value: parts.hours, label: props.t.countdownHours },
    { value: parts.minutes, label: props.t.countdownMinutes },
    { value: parts.seconds, label: props.t.countdownSeconds },
  ];

  return (
    <section
      className="relative px-6 py-20 md:py-28"
      style={{
        backgroundImage: `linear-gradient(180deg, ${WINE} 0%, ${DARK} 100%)`,
        color: CREAM,
      }}
    >
      <div className="absolute left-[8%] top-[18%] hidden text-[#D4AF37] opacity-15 md:block">
        <GrapeClusterIcon className="h-16 w-auto" />
      </div>
      <div className="absolute right-[8%] bottom-[18%] hidden text-[#D4AF37] opacity-15 md:block">
        <GrapeClusterIcon className="h-20 w-auto" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <SectionEyebrow>{props.t.countdownTitle}</SectionEyebrow>
        <h2
          className="mt-4 text-3xl font-bold italic text-[#F5E6D3] sm:text-4xl md:text-5xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {props.t.countdownTitle}
        </h2>

        {parts.passed ? (
          <p
            className="mt-10 text-2xl italic text-[#D4AF37]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {props.t.countdownPassed}
          </p>
        ) : (
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
            role="timer"
            aria-label={props.t.countdownAria}
          >
            {units.map((u, i) => (
              <Fragment key={u.label}>
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span
                    className="text-5xl font-bold text-[#D4AF37] sm:text-6xl md:text-7xl"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(u.value).padStart(2, '0')}
                  </span>
                  <span
                    className="mt-2 text-[11px] font-medium uppercase tracking-[0.4em] text-[#F5E6D3]/80"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {u.label}
                  </span>
                </div>
                {i < units.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="text-[#D4AF37] opacity-70 vino-pulse"
                  >
                    <GrapeClusterIcon className="h-6 w-auto sm:h-7" />
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
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
    <section
      className="relative px-6 py-20 md:py-28"
      style={{ backgroundColor: CREAM }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <SectionEyebrow>{props.t.locationsTitle}</SectionEyebrow>
          <h2
            className="mt-4 text-3xl font-bold italic text-[#1A0E0E] sm:text-4xl md:text-5xl"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {props.t.locationsTitle}
          </h2>
          <FlourishDivider />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {props.locations.map((loc, idx) => (
            <article
              key={`${loc.label}-${idx}`}
              className="rounded-sm border border-[#722F37] bg-[#F5E6D3] p-6 shadow-sm transition-transform duration-500 hover:-translate-y-1"
              style={{ boxShadow: '0 1px 0 rgba(212,175,55,0.25) inset' }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#722F37]"
                style={{ fontFamily: FONT_BODY }}
              >
                {loc.label}
              </p>
              <h3
                className="mt-3 text-2xl font-bold italic text-[#1A0E0E]"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {loc.name}
              </h3>
              {loc.address ? (
                <p
                  className="mt-2 text-base text-[#1A0E0E]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {loc.address}
                </p>
              ) : null}
              {loc.city ? (
                <p
                  className="text-base text-[#1A0E0E]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {loc.city}
                </p>
              ) : null}
              {loc.time ? (
                <p
                  className="mt-3 text-sm italic text-[#722F37]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {loc.time}
                </p>
              ) : null}
              {loc.mapsLink ? (
                <a
                  href={loc.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.4em] text-[#722F37] underline decoration-[#D4AF37] underline-offset-4 transition-colors duration-300 hover:text-[#A53F2B]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {props.t.locationsOpen}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
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
    <section
      className="relative px-6 py-20 md:py-28"
      style={{
        backgroundImage: `linear-gradient(180deg, ${CREAM} 0%, #EDDFCA 100%)`,
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <SectionEyebrow>{props.t.programTitle}</SectionEyebrow>
          <h2
            className="mt-4 text-3xl font-bold italic text-[#1A0E0E] sm:text-4xl md:text-5xl"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {props.t.programTitle}
          </h2>
          <FlourishDivider />
        </div>

        <div className="mt-10 space-y-10">
          {days.map((day, dayIdx) => (
            <div key={`day-${dayIdx}`}>
              {(day.label || day.date) && (
                <div className="mb-6 flex items-center gap-4">
                  <span
                    className="h-px flex-1 bg-[#722F37] opacity-30"
                    aria-hidden="true"
                  />
                  <div className="text-center">
                    {day.label ? (
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#722F37]"
                        style={{ fontFamily: FONT_BODY }}
                      >
                        {day.label}
                      </p>
                    ) : null}
                    {day.date ? (
                      <p
                        className="mt-1 text-xl font-bold italic text-[#1A0E0E]"
                        style={{ fontFamily: FONT_DISPLAY }}
                      >
                        {formatShortDate(day.date, props.locale)}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="h-px flex-1 bg-[#722F37] opacity-30"
                    aria-hidden="true"
                  />
                </div>
              )}

              <ol className="space-y-4">
                {day.items.map((item, itemIdx) => (
                  <li
                    key={`item-${dayIdx}-${itemIdx}`}
                    className="flex flex-col gap-3 rounded-sm border border-[#722F37] bg-[#F5E6D3] p-5 sm:flex-row sm:items-start sm:gap-6"
                  >
                    <div className="sm:w-32 sm:flex-shrink-0">
                      <p
                        className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#722F37]"
                        style={{ fontFamily: FONT_BODY }}
                      >
                        {item.time}
                      </p>
                    </div>
                    <div>
                      <h4
                        className="text-xl font-bold italic text-[#1A0E0E] sm:text-2xl"
                        style={{ fontFamily: FONT_DISPLAY }}
                      >
                        {item.title}
                      </h4>
                      {item.detail ? (
                        <p
                          className="mt-1 text-base text-[#1A0E0E]/85"
                          style={{ fontFamily: FONT_BODY }}
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
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dress code
// ---------------------------------------------------------------------------
function DressCodeSection(props: { body: string; t: Labels }) {
  return (
    <section
      className="relative px-6 py-20 md:py-24"
      style={{ backgroundColor: CREAM }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <SectionEyebrow>{props.t.dressCodeTitle}</SectionEyebrow>
        <h2
          className="mt-4 text-3xl font-bold italic text-[#1A0E0E] sm:text-4xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {props.t.dressCodeTitle}
        </h2>
        <div className="my-8 flex justify-center text-[#D4AF37]">
          <VineMotif className="h-5 w-40 opacity-80" />
        </div>
        <p
          className="whitespace-pre-line text-lg leading-relaxed text-[#1A0E0E] sm:text-xl"
          style={{ fontFamily: FONT_BODY }}
        >
          {props.body}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Gift registry
// ---------------------------------------------------------------------------
function GiftRegistrySection(props: { body: string; t: Labels }) {
  return (
    <section
      className="relative px-6 py-20 md:py-24"
      style={{
        backgroundImage: `linear-gradient(180deg, ${WINE} 0%, ${GRANATE} 100%)`,
        color: CREAM,
      }}
    >
      <div className="absolute right-[6%] top-[14%] hidden text-[#D4AF37] opacity-20 md:block">
        <WineGlassIcon className="h-24 w-auto" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <SectionEyebrow>{props.t.giftRegistryTitle}</SectionEyebrow>
        <h2
          className="mt-4 text-3xl font-bold italic text-[#F5E6D3] sm:text-4xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {props.t.giftRegistryTitle}
        </h2>
        <div className="my-8 flex justify-center text-[#D4AF37]">
          <VineMotif className="h-5 w-40 opacity-80" />
        </div>
        <p
          className="whitespace-pre-line text-lg leading-relaxed text-[#F5E6D3] sm:text-xl"
          style={{ fontFamily: FONT_BODY }}
        >
          {props.body}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// RSVP CTA
// ---------------------------------------------------------------------------
function RsvpSection(props: { t: Labels; onRsvpClick?: () => void }) {
  return (
    <section
      className="relative px-6 py-24 text-center"
      style={{ backgroundColor: CREAM }}
    >
      <div className="mx-auto max-w-2xl">
        <SectionEyebrow>{props.t.rsvpTitle}</SectionEyebrow>
        <h2
          className="mt-4 text-3xl font-bold italic text-[#1A0E0E] sm:text-4xl md:text-5xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {props.t.rsvpTitle}
        </h2>
        <p
          className="mt-6 text-lg leading-relaxed text-[#1A0E0E] sm:text-xl"
          style={{ fontFamily: FONT_BODY }}
        >
          {props.t.rsvpBody}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function FooterSection(props: { t: Labels }) {
  return (
    <footer
      className="relative px-6 py-12 text-center"
      style={{ backgroundColor: DARK, color: CREAM }}
    >
      <div className="mb-4 flex justify-center text-[#D4AF37] opacity-80">
        <VineMotif className="h-4 w-32" />
      </div>
      <p
        className="text-xs uppercase tracking-[0.4em] text-[#D4AF37]"
        style={{ fontFamily: FONT_BODY }}
      >
        {props.t.footerAttribution}
      </p>
      <p
        className="mt-3 text-sm italic text-[#F5E6D3]/70"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {props.t.footerTagline}
      </p>
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
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&display=swap"
    />
  );
}

// ---------------------------------------------------------------------------
// Motion styles (CSS variables consumed by classes below)
// ---------------------------------------------------------------------------
const motionStyles = `
  @keyframes vinoShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes vinoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  @keyframes vinoPulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  .vino-shimmer {
    background-image: linear-gradient(
      100deg,
      #D4AF37 0%,
      #F5E6D3 35%,
      #D4AF37 60%,
      #D4AF37 100%
    );
    background-size: 200% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    animation: vinoShimmer 6s linear infinite;
  }
  .vino-float-slow { animation: vinoFloat 7s ease-in-out infinite; }
  .vino-float-slower { animation: vinoFloat 9s ease-in-out infinite; }
  .vino-pulse { animation: vinoPulse 2.4s ease-in-out infinite; }
  .vino-cta {
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.0);
  }
  .vino-cta:hover {
    box-shadow: 0 0 28px 2px rgba(212, 175, 55, 0.35);
  }
  @media (prefers-reduced-motion: reduce) {
    .vino-shimmer,
    .vino-float-slow,
    .vino-float-slower,
    .vino-pulse {
      animation: none !important;
    }
    .vino-cta { transition: none !important; }
  }
`;

function MotionStyles() {
  return <style>{motionStyles}</style>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function VinoTemplate(props: PublicInvitationPageProps) {
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
      style={{ backgroundColor: CREAM, color: DARK }}
    >
      <GoogleFontsLink />
      <MotionStyles />

      <HeroSection
        {...props}
        t={t}
        hasHeroPhoto={hasHeroPhoto}
      />

      <GoldHairline />

      {showStory ? <StorySection body={props.story?.body ?? ''} t={t} /> : null}

      <CountdownSection
        eventDate={props.eventDate}
        t={t}
        locale={props.locale}
      />

      <GoldHairline />

      <LocationsSection locations={props.locations} t={t} />

      <GoldHairline />

      <ProgramSection program={props.program} t={t} locale={props.locale} />

      <GoldHairline />

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
