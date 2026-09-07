/**
 * SUMMIT — Deer Planner corporate invitation template.
 *
 * Theme
 * -----
 * A modern professional tech / business conference (200–500 attendees). The
 * identity is calm and confident: slate-gray grounding with a single bright
 * blue accent that anchors every interaction. Display type is Manrope (a
 * geometric sans) and body type is Inter — both loaded at runtime via Google
 * Fonts <link> tags so the file is self-contained. Sections breathe with
 * generous whitespace, subtle borders, and a slow reveal on scroll; cards
 * lift gently on hover and the RSVP button gains a hair of scale. Reduced-
 * motion users see static content (no transforms, no transitions).
 *
 * Palette (locked — must not drift)
 * ---------------------------------
 *   Slate          #1F2937   hero gradient anchor, dark surfaces
 *   Mid gray       #374151   secondary surfaces, dividers
 *   Accent blue    #3B82F6   underline, badges, icons, primary CTA
 *   Background     #F9FAFB   page background, card surfaces
 *   Text dark      #111827   body copy, headings
 *
 * Typography
 * ----------
 *   Display (event title, h1/h2):  Manrope   — modern geometric sans
 *   Body / UI (paragraphs, labels): Inter     — clean, readable
 *
 * Motion philosophy
 * -----------------
 * Two loops total: a soft IntersectionObserver reveal for sections entering
 * the viewport, and a one-time hover lift on interactive cards / buttons.
 * No parallax, no bouncing, no flashing. Disabled under
 * `prefers-reduced-motion: reduce`.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface PublicInvitationPageProps {
  eventTitle: string;
  hostCompanyName?: string;
  eventDate: string; // ISO date e.g. '2026-11-08'
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  description?: { body: string } | null;
  speakers?: Array<{
    name: string;
    role: string;
    bio?: string;
    photoUrl?: string | null;
  }> | null;
  dressCode?: { body: string } | null;
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
  hostedBy: string;
  saveTheDate: string;
  about: string;
  speakers: string;
  speakersCount: (n: number) => string;
  program: string;
  daysCount: (n: number) => string;
  locations: string;
  locationsCount: (n: number) => string;
  dressCode: string;
  rsvp: string;
  rsvpHint: string;
  rsvpTitle: string;
  viewMap: string;
  poweredBy: string;
  conference: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    hostedBy: 'Hosted by',
    saveTheDate: 'Save the date',
    about: 'About the event',
    speakers: 'Speakers',
    speakersCount: (n) => `${n} speaker${n === 1 ? '' : 's'}`,
    program: 'Program',
    daysCount: (n) => `${n} day${n === 1 ? '' : 's'}`,
    locations: 'Where',
    locationsCount: (n) => `${n} venue${n === 1 ? '' : 's'}`,
    dressCode: 'Dress code',
    rsvp: 'Reserve my seat',
    rsvpHint: 'Limited capacity. Confirm your attendance to receive your badge.',
    rsvpTitle: 'Join the summit',
    viewMap: 'Open in Maps',
    poweredBy: 'Deer Planner',
    conference: 'Conference',
  },
  es: {
    hostedBy: 'Organiza',
    saveTheDate: 'Reserva la fecha',
    about: 'Sobre el evento',
    speakers: 'Speakers',
    speakersCount: (n) => `${n} speaker${n === 1 ? '' : 's'}`,
    program: 'Programa',
    daysCount: (n) => `${n} día${n === 1 ? '' : 's'}`,
    locations: 'Lugar',
    locationsCount: (n) => `${n} sede${n === 1 ? '' : 's'}`,
    dressCode: 'Código de vestimenta',
    rsvp: 'Reservar mi lugar',
    rsvpHint: 'Cupos limitados. Confirma tu asistencia para recibir tu credencial.',
    rsvpTitle: 'Súmate al summit',
    viewMap: 'Abrir en Mapa',
    poweredBy: 'Deer Planner',
    conference: 'Conferencia',
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Palette & font constants
 * ────────────────────────────────────────────────────────────────────────── */

const COLOR_SLATE = '#1F2937';
const COLOR_MID_GRAY = '#374151';
const COLOR_BLUE = '#3B82F6';
const COLOR_BG = '#F9FAFB';
const COLOR_TEXT = '#111827';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';

const DISPLAY_FONT = "'Manrope', 'Inter', ui-sans-serif, system-ui, sans-serif";
const BODY_FONT = "'Inter', ui-sans-serif, system-ui, sans-serif";

/* ──────────────────────────────────────────────────────────────────────────
 * CSS animation styles — gentle reveal, hover lifts, button hover
 * ────────────────────────────────────────────────────────────────────────── */

const SUMMIT_STYLES = `
  /* Slow, single-pass reveal for any section that opts in. */
  @keyframes summit-reveal {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .summit-reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 700ms ease-out, transform 700ms ease-out;
    will-change: opacity, transform;
  }
  .summit-reveal--in {
    opacity: 1;
    transform: translateY(0);
  }

  /* Hero entrance — staggered fade-up. */
  @keyframes summit-hero-rise {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .summit-hero-rise {
    animation: summit-hero-rise 800ms ease-out both;
  }
  .summit-hero-rise-1 { animation-delay: 80ms; }
  .summit-hero-rise-2 { animation-delay: 220ms; }
  .summit-hero-rise-3 { animation-delay: 360ms; }
  .summit-hero-rise-4 { animation-delay: 500ms; }
  .summit-hero-rise-5 { animation-delay: 640ms; }

  /* Cards lift gently on hover. */
  .summit-card-lift {
    transition: transform 260ms ease-out, box-shadow 260ms ease-out,
                border-color 260ms ease-out;
  }
  .summit-card-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(17, 24, 39, 0.08);
    border-color: rgba(59, 130, 246, 0.35);
  }

  /* RSVP button — slight scale + darken on hover. */
  .summit-rsvp-btn {
    background-color: ${COLOR_BLUE};
    transition: transform 220ms ease-out, background-color 220ms ease-out,
                box-shadow 220ms ease-out;
  }
  .summit-rsvp-btn:hover {
    background-color: ${COLOR_MID_GRAY};
    transform: scale(1.02);
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.25);
  }
  .summit-rsvp-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.35);
  }
  .summit-rsvp-btn:active {
    transform: scale(0.99);
  }

  /* Underline beneath the hero event title. */
  .summit-title-underline {
    position: relative;
    display: inline-block;
  }
  .summit-title-underline::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -10px;
    width: 100%;
    height: 2px;
    background-color: ${COLOR_BLUE};
  }

  @media (prefers-reduced-motion: reduce) {
    .summit-reveal,
    .summit-reveal--in {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
    .summit-hero-rise {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .summit-card-lift,
    .summit-rsvp-btn {
      transition: none !important;
    }
    .summit-card-lift:hover,
    .summit-rsvp-btn:hover,
    .summit-rsvp-btn:active {
      transform: none !important;
    }
  }
`;

/* ──────────────────────────────────────────────────────────────────────────
 * Font loader — injects Google Fonts <link> tags once at mount.
 * ────────────────────────────────────────────────────────────────────────── */

function useSummitFonts(): void {
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
 * Date helpers
 * ────────────────────────────────────────────────────────────────────────── */

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

function formatShortDate(iso: string, locale: Locale): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

/** Split a free-text body into paragraphs on blank lines. */
function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Geometric SVG icons
 * ────────────────────────────────────────────────────────────────────────── */

interface GlyphProps {
  className?: string;
  color?: string;
}

/** A square — used as a section-label glyph and a small logo mark. */
function SquareGlyph({ className, color = COLOR_BLUE }: GlyphProps): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="16" height="16" rx="2" fill={color} />
    </svg>
  );
}

/** A circle — geometric companion to the square. */
function CircleGlyph({ className, color = COLOR_BLUE }: GlyphProps): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="8" fill={color} />
    </svg>
  );
}

/** A triangle — third primitive, completes the geometric trio. */
function TriangleGlyph({ className, color = COLOR_BLUE }: GlyphProps): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="10,2 18,18 2,18" fill={color} />
    </svg>
  );
}

/**
 * Small placeholder logo mark for the host company — a square + circle
 * composition that reads as a brand glyph without shipping an external image.
 */
function CompanyLogoPlaceholder({ className }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4" width="34" height="34" rx="6" fill={COLOR_BLUE} />
      <circle cx="40" cy="40" r="12" fill={COLOR_BG} stroke={COLOR_BLUE} strokeWidth="3" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Section label — uppercase eyebrow with a small geometric glyph.
 * ────────────────────────────────────────────────────────────────────────── */

interface SectionLabelProps {
  glyph: 'square' | 'circle' | 'triangle';
  children: ReactNode;
}

function SectionLabel({ glyph, children }: SectionLabelProps): ReactElement {
  const Glyph =
    glyph === 'square'
      ? SquareGlyph
      : glyph === 'circle'
      ? CircleGlyph
      : TriangleGlyph;
  return (
    <div
      className="inline-flex items-center gap-3 text-[0.7rem] font-bold uppercase sm:text-xs"
      style={{
        fontFamily: BODY_FONT,
        letterSpacing: '0.2em',
        color: COLOR_BLUE,
      }}
    >
      <Glyph className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span>{children}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Reveal-on-scroll hook + component
 * ────────────────────────────────────────────────────────────────────────── */

function useInView<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0.12 },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      options,
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

interface RevealProps {
  children: ReactNode;
  className?: string;
}

function Reveal({ children, className }: RevealProps): ReactElement {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`summit-reveal ${inView ? 'summit-reveal--in' : ''} ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Speaker card
 * ────────────────────────────────────────────────────────────────────────── */

interface SpeakerCardProps {
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string | null;
}

function SpeakerCard({ name, role, bio, photoUrl }: SpeakerCardProps): ReactElement {
  const initial = name.charAt(0).toUpperCase();
  return (
    <article
      className="summit-card-lift overflow-hidden rounded-xl border border-[#E5E7EB] bg-white"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E5E7EB]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              color: COLOR_BLUE,
              fontSize: '4rem',
              background:
                'linear-gradient(180deg, rgba(59, 130, 246, 0.10) 0%, rgba(59, 130, 246, 0.22) 100%)',
            }}
            aria-hidden="true"
          >
            {initial}
          </div>
        )}
        {/* Accent blue gradient overlay over the bottom 20% of the photo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%]"
          style={{
            background:
              'linear-gradient(180deg, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.55) 100%)',
          }}
        />
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <h3
          className="text-lg leading-tight sm:text-xl"
          style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: COLOR_TEXT }}
        >
          {name}
        </h3>
        <p
          className="mt-1 text-xs uppercase sm:text-sm"
          style={{
            fontFamily: BODY_FONT,
            letterSpacing: '0.15em',
            color: COLOR_BLUE,
            fontWeight: 600,
          }}
        >
          {role}
        </p>
        {bio ? (
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: COLOR_MID_GRAY }}
          >
            {bio}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────────────────── */

function SummitTemplate(props: PublicInvitationPageProps): ReactElement {
  const {
    eventTitle,
    hostCompanyName,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    description,
    speakers,
    dressCode,
    locations,
    program,
    rsvpEnabled,
    onRsvpClick,
    locale,
  } = props;

  useSummitFonts();

  const t = labels[locale];

  const heroTitle = landingTitle ?? eventTitle;
  const heroSubtitle = landingSubtitle;

  const dateLong = useMemo(() => formatLongDate(eventDate, locale), [eventDate, locale]);
  const dateShort = useMemo(() => formatShortDate(eventDate, locale), [eventDate, locale]);

  const speakersList = speakers ?? [];
  const hasSpeakers = speakersList.length > 0;
  const hasLocations = locations.length > 0;
  const hasProgram = program.days.length > 0;
  const hasDescription = description !== null && description !== undefined;

  return (
    <>
      <style>{SUMMIT_STYLES}</style>

      <div
        className="min-h-screen antialiased"
        style={{
          backgroundColor: COLOR_BG,
          color: COLOR_TEXT,
          fontFamily: BODY_FONT,
        }}
        lang={locale}
      >
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <header className="relative overflow-hidden">
          {/* Background: hero image if provided, else slate-to-charcoal gradient. */}
          {heroImageUrl ? (
            <div className="absolute inset-0">
              <img
                src={heroImageUrl}
                alt=""
                className="h-full w-full object-cover"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(31, 41, 55, 0.55) 0%, rgba(31, 41, 55, 0.85) 100%)',
                }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  'linear-gradient(135deg, #1F2937 0%, #111827 60%, #0B1220 100%)',
              }}
            />
          )}

          <div
            className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-10 sm:pb-28 sm:pt-14 lg:pb-32"
          >
            {/* Top bar: small badge + company logo placeholder. */}
            <div className="summit-hero-rise summit-hero-rise-1 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase backdrop-blur-sm"
                style={{
                  fontFamily: BODY_FONT,
                  letterSpacing: '0.25em',
                  color: '#FFFFFF',
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: COLOR_BLUE }}
                />
                {t.conference}
              </span>

              <CompanyLogoPlaceholder className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>

            {/* Host company in small caps above the title. */}
            {hostCompanyName ? (
              <p
                className="summit-hero-rise summit-hero-rise-2 text-[0.7rem] font-semibold uppercase sm:text-xs"
                style={{
                  fontFamily: BODY_FONT,
                  letterSpacing: '0.3em',
                  color: 'rgba(255, 255, 255, 0.75)',
                }}
              >
                {t.hostedBy} · {hostCompanyName}
              </p>
            ) : null}

            {/* Event title — Manrope bold + blue underline. */}
            <h1
              className="summit-hero-rise summit-hero-rise-3 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              <span className="summit-title-underline">{heroTitle}</span>
            </h1>

            {heroSubtitle ? (
              <p
                className="summit-hero-rise summit-hero-rise-4 max-w-2xl text-base leading-relaxed sm:text-lg"
                style={{ color: 'rgba(255, 255, 255, 0.78)' }}
              >
                {heroSubtitle}
              </p>
            ) : null}

            <div className="summit-hero-rise summit-hero-rise-5 flex flex-wrap items-center gap-x-10 gap-y-6 pt-2">
              <div>
                <p
                  className="text-[0.65rem] font-semibold uppercase sm:text-[0.7rem]"
                  style={{
                    fontFamily: BODY_FONT,
                    letterSpacing: '0.25em',
                    color: COLOR_BLUE,
                  }}
                >
                  {t.saveTheDate}
                </p>
                <p
                  className="mt-2 text-2xl font-bold text-white sm:text-3xl"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <time dateTime={eventDate}>{dateLong}</time>
                </p>
                <p
                  className="mt-1 text-xs uppercase sm:text-sm"
                  style={{
                    fontFamily: BODY_FONT,
                    letterSpacing: '0.2em',
                    color: 'rgba(255, 255, 255, 0.55)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {dateShort}
                </p>
              </div>

              {rsvpEnabled ? (
                <button
                  type="button"
                  onClick={onRsvpClick}
                  className="summit-rsvp-btn inline-flex items-center gap-3 rounded-lg px-7 py-3.5 text-sm font-bold uppercase text-white sm:text-base"
                  style={{
                    fontFamily: BODY_FONT,
                    letterSpacing: '0.15em',
                  }}
                >
                  {t.rsvp}
                  <span aria-hidden="true">→</span>
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main>
          {/* ── DESCRIPTION ─────────────────────────────────────────────── */}
          {hasDescription && description ? (
            <section className="px-6 py-16 sm:py-20" aria-labelledby="sec-description">
              <div className="mx-auto max-w-3xl">
                <Reveal>
                  <SectionLabel glyph="circle">{t.about}</SectionLabel>
                  <div className="mt-8 space-y-5">
                    {toParagraphs(description.body).map((paragraph, pIdx) => (
                      <p
                        key={`p-${pIdx}`}
                        className="text-base leading-relaxed sm:text-lg"
                        style={{ color: COLOR_TEXT }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* ── SPEAKERS ────────────────────────────────────────────────── */}
          {hasSpeakers ? (
            <section
              className="px-6 py-16 sm:py-20"
              aria-labelledby="sec-speakers"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="mx-auto max-w-6xl">
                <Reveal>
                  <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                    <SectionLabel glyph="square">{t.speakers}</SectionLabel>
                    <span
                      className="text-xs uppercase sm:text-sm"
                      style={{
                        fontFamily: BODY_FONT,
                        letterSpacing: '0.2em',
                        color: COLOR_MID_GRAY,
                      }}
                    >
                      {t.speakersCount(speakersList.length)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {speakersList.map((speaker, idx) => (
                      <SpeakerCard
                        key={`speaker-${idx}-${speaker.name}`}
                        name={speaker.name}
                        role={speaker.role}
                        {...(speaker.bio !== undefined ? { bio: speaker.bio } : {})}
                        {...(speaker.photoUrl !== undefined
                          ? { photoUrl: speaker.photoUrl }
                          : {})}
                      />
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* ── PROGRAM ─────────────────────────────────────────────────── */}
          {hasProgram ? (
            <section className="px-6 py-16 sm:py-20" aria-labelledby="sec-program">
              <div className="mx-auto max-w-4xl">
                <Reveal>
                  <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                    <SectionLabel glyph="triangle">{t.program}</SectionLabel>
                    <span
                      className="text-xs uppercase sm:text-sm"
                      style={{
                        fontFamily: BODY_FONT,
                        letterSpacing: '0.2em',
                        color: COLOR_MID_GRAY,
                      }}
                    >
                      {t.daysCount(program.days.length)}
                    </span>
                  </div>

                  <div className="space-y-12">
                    {program.days.map((day, dayIdx) => (
                      <article key={`day-${dayIdx}-${day.label ?? ''}`}>
                        <header className="mb-6">
                          {day.label ? (
                            <h2
                              className="text-2xl font-bold sm:text-3xl"
                              style={{ fontFamily: DISPLAY_FONT, color: COLOR_TEXT }}
                            >
                              {day.label}
                            </h2>
                          ) : null}
                          {day.date ? (
                            <p
                              className="mt-1 text-[0.7rem] font-semibold uppercase sm:text-xs"
                              style={{
                                fontFamily: BODY_FONT,
                                letterSpacing: '0.2em',
                                color: COLOR_MID_GRAY,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              <time dateTime={day.date}>{formatLongDate(day.date, locale)}</time>
                            </p>
                          ) : null}
                        </header>

                        <ol className="space-y-3">
                          {day.items.map((item, itemIdx) => (
                            <li
                              key={`item-${dayIdx}-${itemIdx}`}
                              className="summit-card-lift rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6"
                              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                                <span
                                  className="inline-flex w-fit items-center rounded-md px-3 py-1 text-xs font-bold uppercase sm:text-sm"
                                  style={{
                                    fontFamily: BODY_FONT,
                                    letterSpacing: '0.1em',
                                    color: '#FFFFFF',
                                    backgroundColor: COLOR_BLUE,
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  {item.time}
                                </span>
                                <div className="flex-1">
                                  <h3
                                    className="text-base font-semibold sm:text-lg"
                                    style={{
                                      fontFamily: DISPLAY_FONT,
                                      color: COLOR_TEXT,
                                    }}
                                  >
                                    {item.title}
                                  </h3>
                                  {item.detail ? (
                                    <p
                                      className="mt-2 text-sm leading-relaxed"
                                      style={{ color: COLOR_MID_GRAY }}
                                    >
                                      {item.detail}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </article>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* ── LOCATIONS ───────────────────────────────────────────────── */}
          {hasLocations ? (
            <section
              className="px-6 py-16 sm:py-20"
              aria-labelledby="sec-locations"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="mx-auto max-w-5xl">
                <Reveal>
                  <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                    <SectionLabel glyph="circle">{t.locations}</SectionLabel>
                    <span
                      className="text-xs uppercase sm:text-sm"
                      style={{
                        fontFamily: BODY_FONT,
                        letterSpacing: '0.2em',
                        color: COLOR_MID_GRAY,
                      }}
                    >
                      {t.locationsCount(locations.length)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {locations.map((loc, lIdx) => (
                      <article
                        key={`loc-${lIdx}-${loc.name}`}
                        className="summit-card-lift rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-7"
                        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <span
                            className="inline-flex items-center rounded-md px-3 py-1 text-[0.65rem] font-semibold uppercase"
                            style={{
                              fontFamily: BODY_FONT,
                              letterSpacing: '0.2em',
                              color: '#FFFFFF',
                              backgroundColor: COLOR_BLUE,
                            }}
                          >
                            {loc.label}
                          </span>
                          {loc.time ? (
                            <span
                              className="text-xs uppercase sm:text-sm"
                              style={{
                                fontFamily: BODY_FONT,
                                letterSpacing: '0.15em',
                                color: COLOR_MID_GRAY,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {loc.time}
                            </span>
                          ) : null}
                        </div>

                        <h3
                          className="text-lg font-semibold sm:text-xl"
                          style={{ fontFamily: DISPLAY_FONT, color: COLOR_TEXT }}
                        >
                          {loc.name}
                        </h3>

                        <div
                          className="mt-3 space-y-1 text-sm"
                          style={{ color: COLOR_MID_GRAY }}
                        >
                          {loc.address ? <p>{loc.address}</p> : null}
                          {loc.city ? <p>{loc.city}</p> : null}
                        </div>

                        {loc.mapsLink ? (
                          <a
                            href={loc.mapsLink}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase sm:text-sm"
                            style={{
                              fontFamily: BODY_FONT,
                              letterSpacing: '0.2em',
                              color: COLOR_BLUE,
                            }}
                          >
                            {t.viewMap}
                            <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* ── DRESS CODE ──────────────────────────────────────────────── */}
          {dressCode ? (
            <section className="px-6 py-16 sm:py-20" aria-labelledby="sec-dresscode">
              <div className="mx-auto max-w-2xl">
                <Reveal>
                  <SectionLabel glyph="triangle">{t.dressCode}</SectionLabel>
                  <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
                    {toParagraphs(dressCode.body).map((paragraph, pIdx) => (
                      <p
                        key={`dc-${pIdx}`}
                        className="text-base leading-relaxed"
                        style={{ color: COLOR_TEXT }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* ── RSVP CTA ────────────────────────────────────────────────── */}
          {rsvpEnabled ? (
            <section
              className="px-6 py-20 sm:py-24"
              aria-labelledby="sec-rsvp"
              style={{ backgroundColor: COLOR_BG }}
            >
              <div className="mx-auto max-w-2xl text-center">
                <Reveal>
                  <SectionLabel glyph="square">{t.rsvpTitle}</SectionLabel>
                  <h2
                    id="sec-rsvp"
                    className="mt-8 text-3xl font-bold leading-tight sm:text-4xl"
                    style={{ fontFamily: DISPLAY_FONT, color: COLOR_TEXT }}
                  >
                    {t.rsvpTitle}
                  </h2>
                  <p
                    className="mx-auto mt-4 max-w-md text-base leading-relaxed sm:text-lg"
                    style={{ color: COLOR_MID_GRAY }}
                  >
                    {t.rsvpHint}
                  </p>
                  <button
                    type="button"
                    onClick={onRsvpClick}
                    className="summit-rsvp-btn mt-10 inline-flex items-center gap-3 rounded-lg px-10 py-4 text-sm font-bold uppercase text-white sm:text-base"
                    style={{
                      fontFamily: BODY_FONT,
                      letterSpacing: '0.15em',
                    }}
                  >
                    {t.rsvp}
                    <span aria-hidden="true">→</span>
                  </button>
                </Reveal>
              </div>
            </section>
          ) : null}
        </main>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer
          className="px-6 py-10"
          style={{ backgroundColor: COLOR_SLATE, color: 'rgba(255, 255, 255, 0.7)' }}
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div
              className="flex items-center gap-3 text-[0.65rem] font-semibold uppercase sm:text-xs"
              style={{
                fontFamily: BODY_FONT,
                letterSpacing: '0.3em',
              }}
            >
              <SquareGlyph className="h-3.5 w-3.5" color={COLOR_BLUE} />
              <span>{t.poweredBy}</span>
            </div>
            <p
              className="text-[0.65rem] uppercase sm:text-xs"
              style={{
                fontFamily: BODY_FONT,
                letterSpacing: '0.25em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <time dateTime={eventDate}>{dateShort}</time>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default SummitTemplate;