/**
 * RETREAT — Deer Planner corporate invitation template.
 *
 * Theme
 * -----
 * A corporate offsite, team retreat or wellness event. The identity is
 * intentional and restorative: earth tones grounded by deep green, sage
 * and warm sand, breathing room between sections, a photo-led hero of
 * nature or team outdoors. Display type is Lora (a humanist serif with
 * warmth and calligraphic restraint) and body type is Inter — both
 * loaded at runtime via Google Fonts <link> tags so the file is fully
 * self-contained. Subtle leaf and branch SVG decorations anchor each
 * section corner; the RSVP button reads as a quiet, decisive action.
 * Motion is barely there: a slow parallax on the hero photo and gentle
 * reveals on scroll. Reduced-motion users see static content.
 *
 * Palette (locked — must not drift)
 * ---------------------------------
 *   Deep green    #2D5016   section labels, RSVP button, headings
 *   Sage green    #6B8E4E   accents, underlines, hover state, borders
 *   Sand          #D4A574   time badges, warm accents
 *   Cream         #F5F1E8   page background, card surfaces
 *   Text dark     #1F2937   body copy
 *
 * Typography
 * ----------
 *   Display (event title, h1/h2): Lora   — humanist serif
 *   Body / UI (paragraphs, labels): Inter — clean sans
 *
 * Motion philosophy
 * -----------------
 * Two loops total: a very gentle scroll-linked parallax on the hero
 * photo (clamped, slow ease-out), and a single IntersectionObserver
 * reveal for sections entering the viewport. No bouncing, no flashing.
 * All motion is suppressed under `prefers-reduced-motion: reduce`.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
  aboutFallback: string;
  speakers: string;
  speakersCount: (n: number) => string;
  program: string;
  daysCount: (n: number) => string;
  locations: string;
  locationsCount: (n: number) => string;
  dressCode: string;
  dressCodeHint: string;
  rsvp: string;
  rsvpHint: string;
  rsvpTitle: string;
  rsvpKicker: string;
  viewMap: string;
  poweredBy: string;
  offsite: string;
  tagline: string;
  day: string;
  welcome: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    hostedBy: 'Hosted by',
    saveTheDate: 'Save the date',
    about: 'About the retreat',
    aboutFallback:
      'A few days away from the usual, to think clearly, walk slowly, and come back aligned.',
    speakers: 'Facilitators',
    speakersCount: (n) => `${n} facilitator${n === 1 ? '' : 's'}`,
    program: 'Program',
    daysCount: (n) => `${n} day${n === 1 ? '' : 's'}`,
    locations: 'Where we gather',
    locationsCount: (n) => `${n} venue${n === 1 ? '' : 's'}`,
    dressCode: 'What to wear',
    dressCodeHint:
      'Comfortable, layered, ready for both long walks and focused sessions.',
    rsvp: 'Reserve my place',
    rsvpHint:
      'Spaces are limited. Confirm your attendance to receive the welcome pack.',
    rsvpTitle: 'Join us offsite',
    rsvpKicker: 'A quiet invitation',
    viewMap: 'Open in Maps',
    poweredBy: 'Deer Planner',
    offsite: 'Offsite',
    tagline: 'A retreat for the team',
    day: 'Day',
    welcome: 'Welcome',
  },
  es: {
    hostedBy: 'Organiza',
    saveTheDate: 'Reserva la fecha',
    about: 'Sobre el retreat',
    aboutFallback:
      'Unas jornadas fuera de lo cotidiano, para pensar con calma, caminar sin prisa y volver en sintonía.',
    speakers: 'Facilitadores',
    speakersCount: (n) => `${n} facilitador${n === 1 ? 'es' : 'es'}`,
    program: 'Programa',
    daysCount: (n) => `${n} día${n === 1 ? '' : 's'}`,
    locations: 'Donde nos reunimos',
    locationsCount: (n) => `${n} sede${n === 1 ? '' : 's'}`,
    dressCode: 'Qué llevar',
    dressCodeHint:
      'Cómodo, en capas, listo para caminatas largas y sesiones de enfoque.',
    rsvp: 'Reservar mi lugar',
    rsvpHint:
      'Los cupos son limitados. Confirma tu asistencia para recibir el kit de bienvenida.',
    rsvpTitle: 'Súmate al offsite',
    rsvpKicker: 'Una invitación tranquila',
    viewMap: 'Abrir en Mapa',
    poweredBy: 'Deer Planner',
    offsite: 'Offsite',
    tagline: 'Un retiro para el equipo',
    day: 'Día',
    welcome: 'Bienvenida',
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Palette & font constants
 * ────────────────────────────────────────────────────────────────────────── */

const COLOR_DEEP = '#2D5016';
const COLOR_SAGE = '#6B8E4E';
const COLOR_SAND = '#D4A574';
const COLOR_CREAM = '#F5F1E8';
const COLOR_TEXT = '#1F2937';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap';

const DISPLAY_FONT =
  "'Lora', 'Iowan Old Style', Georgia, ui-serif, serif";
const BODY_FONT =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/* ──────────────────────────────────────────────────────────────────────────
 * Inline styles — animations, hover lifts, leaf glyph, parallax, reduce-motion
 * ────────────────────────────────────────────────────────────────────────── */

const RETREAT_STYLES = `
  /* Section reveal — single, slow, ease-out. */
  @keyframes retreat-reveal {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .retreat-reveal {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 800ms ease-out, transform 800ms ease-out;
    will-change: opacity, transform;
  }
  .retreat-reveal--in {
    opacity: 1;
    transform: translateY(0);
  }

  /* Soft card lift on hover. */
  .retreat-card-lift {
    transition:
      transform 280ms ease-out,
      box-shadow 280ms ease-out,
      border-color 280ms ease-out,
      background-color 280ms ease-out;
  }
  .retreat-card-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(45, 80, 22, 0.10);
    border-color: ${COLOR_SAGE};
  }

  /* Hero photo parallax container. */
  .retreat-hero-photo {
    will-change: transform;
    transition: transform 200ms ease-out;
  }

  /* RSVP button — deep green base, sage hover, gentle lift. */
  .retreat-rsvp-btn {
    background-color: ${COLOR_DEEP};
    color: ${COLOR_CREAM};
    transition:
      transform 240ms ease-out,
      background-color 240ms ease-out,
      box-shadow 240ms ease-out;
  }
  .retreat-rsvp-btn:hover {
    background-color: ${COLOR_SAGE};
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(45, 80, 22, 0.28);
  }
  .retreat-rsvp-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(107, 142, 78, 0.45);
  }
  .retreat-rsvp-btn:active {
    transform: translateY(0);
  }

  /* Hero title underline (sage, 3px). */
  .retreat-title-underline {
    position: relative;
    display: inline-block;
  }
  .retreat-title-underline::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -14px;
    width: 100%;
    height: 3px;
    background-color: ${COLOR_SAGE};
    border-radius: 2px;
  }

  /* Hero entrance — staggered fade-up. */
  @keyframes retreat-hero-rise {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .retreat-hero-rise {
    animation: retreat-hero-rise 900ms ease-out both;
  }
  .retreat-hero-rise-1 { animation-delay: 80ms; }
  .retreat-hero-rise-2 { animation-delay: 240ms; }
  .retreat-hero-rise-3 { animation-delay: 400ms; }
  .retreat-hero-rise-4 { animation-delay: 560ms; }
  .retreat-hero-rise-5 { animation-delay: 720ms; }

  /* Reduced motion: kill all transforms, transitions, animations. */
  @media (prefers-reduced-motion: reduce) {
    .retreat-reveal,
    .retreat-reveal--in {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
    .retreat-hero-rise {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .retreat-card-lift,
    .retreat-rsvp-btn,
    .retreat-hero-photo {
      transition: none !important;
      transform: none !important;
    }
  }
`;

/* ──────────────────────────────────────────────────────────────────────────
 * Font loader — injects Google Fonts <link> tags once at mount.
 * ────────────────────────────────────────────────────────────────────────── */

function useRetreatFonts(): void {
  useEffect(() => {
    const head = document.head;
    const ensureLink = (href: string): void => {
      const selector = `link[href="${href}"]`;
      if (head.querySelector(selector)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      head.appendChild(link);
    };
    const ensurePreconnect = (href: string): void => {
      const selector = `link[rel="preconnect"][href="${href}"]`;
      if (head.querySelector(selector)) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    };
    ensurePreconnect('https://fonts.googleapis.com');
    ensurePreconnect('https://fonts.gstatic.com');
    ensureLink(FONT_HREF);
  }, []);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Style injection — single <style> tag with the RETREAT_STYLES string.
 * ────────────────────────────────────────────────────────────────────────── */

function useRetreatStyles(): void {
  useEffect(() => {
    const id = 'retreat-template-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.appendChild(document.createTextNode(RETREAT_STYLES));
    document.head.appendChild(style);
  }, []);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Reveal hook — adds `retreat-reveal--in` when the element scrolls into view.
 * ────────────────────────────────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>(): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('retreat-reveal--in');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('retreat-reveal--in');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  return ref;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hero parallax — gentle scroll-linked translateY, clamped.
 * Respects prefers-reduced-motion.
 * ────────────────────────────────────────────────────────────────────────── */

function useHeroParallax(): {
  ref: React.RefObject<HTMLDivElement>;
  style: CSSProperties;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<number>(0);

  useEffect(() => {
    const reduceMotion = (): boolean =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion()) return;
    let raf = 0;
    const handleScroll = (): void => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      // Map the hero's center to a normalized -1..1 progress.
      const center = rect.top + rect.height / 2;
      const progress = (viewport / 2 - center) / viewport;
      const clamped = Math.max(-1, Math.min(1, progress));
      const next = clamped * 14; // up to 14px of movement
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOffset(next));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const style: CSSProperties = { transform: `translate3d(0, ${offset}px, 0)` };
  return { ref, style };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Date formatting helpers (locale-aware, no external library).
 * ────────────────────────────────────────────────────────────────────────── */

function formatEventDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const lang = locale === 'es' ? 'es-ES' : 'en-US';
  return new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatDayLabel(
  value: string | undefined,
  fallbackDayIndex: number,
  labels: LabelSet,
): string {
  if (value && value.trim().length > 0) return value;
  return `${labels.day} ${fallbackDayIndex + 1}`;
}

function formatDayDate(
  iso: string | undefined,
  locale: Locale,
): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const lang = locale === 'es' ? 'es-ES' : 'en-US';
  return new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Decorative SVG glyphs — small leaf for section labels, corner branches.
 * ────────────────────────────────────────────────────────────────────────── */

function LeafGlyph({ size = 12 }: { size?: number }): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ flex: '0 0 auto' }}
    >
      <path
        d="M20.5 3.5C13 3.5 6 9.5 4 17c-.4 1.5 1 2.5 2.2 1.7 5.7-3.8 9.6-8 11.5-13.3.4-1-.5-2-1.5-1.7-1 .3-1.7 1.3-1.4 2.3.8 2.7-.3 5.3-2.6 6.7-1 .6-.4 2 .7 2 5.5 0 9.7-4.4 9.7-9.5 0-1-.8-1.7-1.7-1.7z"
        fill={COLOR_SAGE}
        opacity="0.9"
      />
    </svg>
  );
}

function CornerBranch({
  position,
  rotate = 0,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  rotate?: number;
}): ReactElement {
  const positionClasses: Record<typeof position, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  };
  const flipX = position === 'tr' || position === 'br';
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      className={`absolute ${positionClasses[position]} pointer-events-none`}
      style={{
        opacity: 0.18,
        transform: `scaleX(${flipX ? -1 : 1}) rotate(${rotate}deg)`,
        transformOrigin: 'center',
      }}
    >
      <g stroke={COLOR_SAGE} strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M5 60 C 30 50, 55 65, 90 45" />
        <path d="M22 56 C 28 50, 36 50, 42 46" />
        <path d="M44 60 C 50 54, 60 54, 66 48" />
        <path d="M68 53 C 74 48, 84 48, 90 44" />
      </g>
      <g fill={COLOR_SAGE} opacity="0.7">
        <ellipse cx="22" cy="56" rx="4" ry="2" transform="rotate(-25 22 56)" />
        <ellipse cx="44" cy="60" rx="4" ry="2" transform="rotate(-15 44 60)" />
        <ellipse cx="68" cy="53" rx="4" ry="2" transform="rotate(-10 68 53)" />
        <ellipse cx="86" cy="47" rx="4" ry="2" transform="rotate(-5 86 47)" />
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Section label — small leaf glyph + uppercase eyebrow text.
 * ────────────────────────────────────────────────────────────────────────── */

function SectionLabel({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'center';
}): ReactElement {
  const alignment =
    align === 'center' ? 'items-center justify-center' : 'items-center justify-start';
  return (
    <div className={`flex ${alignment} gap-2 mb-6`}>
      <LeafGlyph />
      <span
        className="text-[11px] font-medium uppercase"
        style={{
          color: COLOR_DEEP,
          letterSpacing: '0.3em',
          fontFamily: BODY_FONT,
        }}
      >
        {children}
      </span>
      <LeafGlyph />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Logo placeholder — small SVG monogram, doubles as company mark fallback.
 * ────────────────────────────────────────────────────────────────────────── */

function LogoPlaceholder(): ReactElement {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="22" fill="none" stroke={COLOR_DEEP} strokeWidth="1.5" />
      <path
        d="M24 12 C 18 18, 18 26, 24 36 C 30 26, 30 18, 24 12 Z"
        fill={COLOR_SAGE}
        opacity="0.85"
      />
      <line
        x1="24"
        y1="14"
        x2="24"
        y2="34"
        stroke={COLOR_CREAM}
        strokeWidth="1"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hero — title + host + date, photo or gradient fallback.
 * ────────────────────────────────────────────────────────────────────────── */

function Hero({
  props: p,
  labels: l,
}: {
  props: PublicInvitationPageProps;
  labels: LabelSet;
}): ReactElement {
  const { ref: photoRef, style: photoStyle } = useHeroParallax();
  const formattedDate = useMemo(
    () => formatEventDate(p.eventDate, p.locale),
    [p.eventDate, p.locale],
  );

  const heroTitle: string =
    p.landingTitle && p.landingTitle.trim().length > 0
      ? p.landingTitle
      : p.eventTitle;

  const heroSubtitle: string | null =
    p.landingSubtitle && p.landingSubtitle.trim().length > 0
      ? p.landingSubtitle
      : null;

  const hasImage = typeof p.heroImageUrl === 'string' && p.heroImageUrl.length > 0;

  return (
    <header
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: COLOR_CREAM }}
    >
      {/* Photo / gradient backdrop */}
      <div className="relative w-full h-[68vh] min-h-[480px] max-h-[760px]">
        {hasImage ? (
          <>
            <div
              ref={photoRef}
              className="retreat-hero-photo absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${p.heroImageUrl as string})`,
                ...photoStyle,
              }}
            />
            {/* Subtle sage-green tint overlay via multiply blend */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: COLOR_SAGE,
                mixBlendMode: 'multiply',
                opacity: 0.22,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(45,80,22,0.10) 0%, rgba(45,80,22,0.30) 100%)',
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #F5F1E8 0%, #EADBC0 55%, #D4A574 100%)',
            }}
          />
        )}

        {/* Top bar: logo placeholder + small caps tagline */}
        <div className="absolute top-0 left-0 right-0 z-10 px-6 sm:px-12 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3 retreat-hero-rise retreat-hero-rise-1">
            <LogoPlaceholder />
            <span
              className="text-[10px] font-semibold uppercase"
              style={{
                color: hasImage ? COLOR_CREAM : COLOR_DEEP,
                letterSpacing: '0.3em',
                fontFamily: BODY_FONT,
              }}
            >
              {l.offsite}
            </span>
          </div>
          {p.hostCompanyName ? (
            <span
              className="text-[10px] font-medium uppercase retreat-hero-rise retreat-hero-rise-1 hidden sm:block"
              style={{
                color: hasImage ? COLOR_CREAM : COLOR_DEEP,
                letterSpacing: '0.3em',
                fontFamily: BODY_FONT,
                opacity: 0.85,
              }}
            >
              {p.hostCompanyName}
            </span>
          ) : null}
        </div>

        {/* Centered hero content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          {p.hostCompanyName ? (
            <span
              className="retreat-hero-rise retreat-hero-rise-2 text-[11px] font-medium uppercase mb-6"
              style={{
                color: hasImage ? COLOR_CREAM : COLOR_TEXT,
                letterSpacing: '0.3em',
                fontFamily: BODY_FONT,
                opacity: 0.9,
              }}
            >
              {l.hostedBy} · {p.hostCompanyName}
            </span>
          ) : null}

          <h1
            className="retreat-hero-rise retreat-hero-rise-3 retreat-title-underline"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 500,
              color: hasImage ? COLOR_CREAM : COLOR_DEEP,
              fontSize: 'clamp(2.5rem, 6vw, 5.25rem)',
              lineHeight: 1.05,
              maxWidth: '900px',
              letterSpacing: '-0.01em',
            }}
          >
            {heroTitle}
          </h1>

          {heroSubtitle ? (
            <p
              className="retreat-hero-rise retreat-hero-rise-4 mt-12 max-w-xl"
              style={{
                fontFamily: BODY_FONT,
                color: hasImage ? COLOR_CREAM : COLOR_TEXT,
                opacity: 0.92,
                fontSize: 'clamp(0.95rem, 1.4vw, 1.125rem)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              {heroSubtitle}
            </p>
          ) : null}

          <div
            className="retreat-hero-rise retreat-hero-rise-5 mt-10 flex items-center gap-3"
            aria-label={formattedDate}
          >
            <span
              className="h-px w-10"
              style={{
                backgroundColor: hasImage ? COLOR_CREAM : COLOR_SAGE,
                opacity: 0.7,
              }}
            />
            <span
              className="text-[12px] font-medium uppercase"
              style={{
                color: hasImage ? COLOR_CREAM : COLOR_DEEP,
                letterSpacing: '0.3em',
                fontFamily: BODY_FONT,
              }}
            >
              {formattedDate}
            </span>
            <span
              className="h-px w-10"
              style={{
                backgroundColor: hasImage ? COLOR_CREAM : COLOR_SAGE,
                opacity: 0.7,
              }}
            />
          </div>
        </div>

        {/* Bottom-left small tagline */}
        <div className="absolute bottom-6 left-6 sm:left-12 z-10 retreat-hero-rise retreat-hero-rise-5">
          <span
            className="text-[10px] font-medium uppercase"
            style={{
              color: hasImage ? COLOR_CREAM : COLOR_DEEP,
              letterSpacing: '0.3em',
              fontFamily: BODY_FONT,
              opacity: 0.75,
            }}
          >
            {l.tagline}
          </span>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Description — long-form body copy in a generous, centered column.
 * ────────────────────────────────────────────────────────────────────────── */

function DescriptionSection({
  description,
  labels: l,
}: {
  description: PublicInvitationPageProps['description'];
  labels: LabelSet;
}): ReactElement | null {
  const ref = useReveal<HTMLDivElement>();
  if (!description) return null;
  const body = description.body && description.body.trim().length > 0
    ? description.body
    : l.aboutFallback;
  return (
    <section
      ref={ref}
      className="retreat-reveal relative w-full py-24 sm:py-32 px-6"
      style={{ backgroundColor: COLOR_CREAM }}
    >
      <CornerBranch position="tl" />
      <CornerBranch position="br" rotate={180} />
      <div className="relative max-w-3xl mx-auto text-center">
        <SectionLabel align="center">{l.about}</SectionLabel>
        <p
          className="mt-4"
          style={{
            fontFamily: BODY_FONT,
            color: COLOR_TEXT,
            fontSize: 'clamp(1rem, 1.3vw, 1.125rem)',
            lineHeight: 1.85,
            fontWeight: 400,
          }}
        >
          {body}
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Speakers — grid of facilitator cards with organic photo border.
 * ────────────────────────────────────────────────────────────────────────── */

function SpeakersSection({
  speakers,
  labels: l,
}: {
  speakers: PublicInvitationPageProps['speakers'];
  labels: LabelSet;
}): ReactElement | null {
  const ref = useReveal<HTMLDivElement>();
  if (!speakers || speakers.length === 0) return null;

  return (
    <section
      ref={ref}
      className="retreat-reveal relative w-full py-24 sm:py-32 px-6"
      style={{ backgroundColor: '#FAF6EC' }}
    >
      <CornerBranch position="tr" rotate={-30} />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-14">
          <SectionLabel align="center">{l.speakers}</SectionLabel>
          <span
            className="text-[11px] font-normal mt-1"
            style={{
              color: COLOR_SAGE,
              letterSpacing: '0.15em',
              fontFamily: BODY_FONT,
            }}
          >
            {l.speakersCount(speakers.length)}
          </span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {speakers.map((speaker, idx) => (
            <li
              key={`${speaker.name}-${idx}`}
              className="retreat-card-lift relative flex flex-col items-center text-center p-8 rounded-[20px] border"
              style={{
                backgroundColor: COLOR_CREAM,
                borderColor: 'rgba(107,142,78,0.25)',
                boxShadow: '0 6px 18px rgba(45,80,22,0.06)',
              }}
            >
              <div
                className="relative w-28 h-28 rounded-full overflow-hidden mb-5"
                style={{
                  border: `2px solid ${COLOR_SAGE}`,
                  boxShadow: `0 6px 18px rgba(107,142,78,0.30)`,
                }}
              >
                {speaker.photoUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${speaker.photoUrl})` }}
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, #6B8E4E 0%, #D4A574 100%)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: DISPLAY_FONT,
                        color: COLOR_CREAM,
                        fontSize: '2.25rem',
                        fontWeight: 500,
                      }}
                    >
                      {speaker.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <h3
                style={{
                  fontFamily: DISPLAY_FONT,
                  color: COLOR_DEEP,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {speaker.name}
              </h3>
              <span
                className="mt-1 text-[11px] font-medium uppercase"
                style={{
                  color: COLOR_SAGE,
                  letterSpacing: '0.2em',
                  fontFamily: BODY_FONT,
                }}
              >
                {speaker.role}
              </span>
              {speaker.bio ? (
                <p
                  className="mt-4"
                  style={{
                    fontFamily: BODY_FONT,
                    color: COLOR_TEXT,
                    fontSize: '0.9rem',
                    lineHeight: 1.65,
                    opacity: 0.85,
                  }}
                >
                  {speaker.bio}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Program — per-day cards with sand-colored time badges.
 * ────────────────────────────────────────────────────────────────────────── */

function ProgramSection({
  program,
  labels: l,
  locale,
}: {
  program: PublicInvitationPageProps['program'];
  labels: LabelSet;
  locale: Locale;
}): ReactElement {
  const ref = useReveal<HTMLDivElement>();
  const days = program.days;

  return (
    <section
      ref={ref}
      className="retreat-reveal relative w-full py-24 sm:py-32 px-6"
      style={{ backgroundColor: COLOR_CREAM }}
    >
      <CornerBranch position="bl" rotate={45} />
      <div className="relative max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center mb-14">
          <SectionLabel align="center">{l.program}</SectionLabel>
          <span
            className="text-[11px] font-normal mt-1"
            style={{
              color: COLOR_SAGE,
              letterSpacing: '0.15em',
              fontFamily: BODY_FONT,
            }}
          >
            {l.daysCount(days.length)}
          </span>
        </div>

        <div className="space-y-10">
          {days.map((day, dayIdx) => {
            const dayTitle = formatDayLabel(day.label, dayIdx, l);
            const dayDate = formatDayDate(day.date, locale);
            return (
              <article
                key={`${dayTitle}-${dayIdx}`}
                className="retreat-card-lift rounded-[20px] border p-8 sm:p-10"
                style={{
                  backgroundColor: COLOR_CREAM,
                  borderColor: 'rgba(107,142,78,0.30)',
                  boxShadow: '0 6px 22px rgba(45,80,22,0.06)',
                }}
              >
                <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-8 pb-6 border-b" style={{ borderColor: 'rgba(107,142,78,0.25)' }}>
                  <h2
                    style={{
                      fontFamily: DISPLAY_FONT,
                      color: COLOR_DEEP,
                      fontSize: '1.65rem',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {dayTitle}
                  </h2>
                  {dayDate ? (
                    <span
                      className="text-[12px] font-medium uppercase"
                      style={{
                        color: COLOR_SAGE,
                        letterSpacing: '0.2em',
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {dayDate}
                    </span>
                  ) : null}
                </header>

                <ol className="space-y-6">
                  {day.items.map((item, itemIdx) => (
                    <li
                      key={`${item.time}-${itemIdx}`}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6"
                    >
                      <span
                        className="inline-flex items-center justify-center self-start rounded-md font-semibold text-[12px] px-3 py-1.5 min-w-[88px]"
                        style={{
                          backgroundColor: COLOR_SAND,
                          color: COLOR_DEEP,
                          letterSpacing: '0.08em',
                          fontFamily: BODY_FONT,
                        }}
                      >
                        {item.time}
                      </span>
                      <div className="flex-1">
                        <h3
                          style={{
                            fontFamily: DISPLAY_FONT,
                            color: COLOR_DEEP,
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.title}
                        </h3>
                        {item.detail ? (
                          <p
                            className="mt-1"
                            style={{
                              fontFamily: BODY_FONT,
                              color: COLOR_TEXT,
                              fontSize: '0.92rem',
                              lineHeight: 1.65,
                              opacity: 0.82,
                            }}
                          >
                            {item.detail}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Locations — list of soft cream venues with map links.
 * ────────────────────────────────────────────────────────────────────────── */

function LocationsSection({
  locations,
  labels: l,
}: {
  locations: PublicInvitationPageProps['locations'];
  labels: LabelSet;
}): ReactElement {
  const ref = useReveal<HTMLDivElement>();
  if (!locations || locations.length === 0) return null;

  return (
    <section
      ref={ref}
      className="retreat-reveal relative w-full py-24 sm:py-32 px-6"
      style={{ backgroundColor: '#FAF6EC' }}
    >
      <CornerBranch position="tr" rotate={-10} />
      <div className="relative max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center mb-14">
          <SectionLabel align="center">{l.locations}</SectionLabel>
          <span
            className="text-[11px] font-normal mt-1"
            style={{
              color: COLOR_SAGE,
              letterSpacing: '0.15em',
              fontFamily: BODY_FONT,
            }}
          >
            {l.locationsCount(locations.length)}
          </span>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {locations.map((loc, idx) => (
            <li
              key={`${loc.name}-${idx}`}
              className="retreat-card-lift rounded-[20px] border p-8"
              style={{
                backgroundColor: COLOR_CREAM,
                borderColor: 'rgba(107,142,78,0.30)',
                boxShadow: '0 6px 18px rgba(45,80,22,0.06)',
              }}
            >
              <span
                className="inline-block text-[10px] font-medium uppercase mb-3 px-2 py-1 rounded"
                style={{
                  color: COLOR_DEEP,
                  backgroundColor: 'rgba(212,165,116,0.30)',
                  letterSpacing: '0.3em',
                  fontFamily: BODY_FONT,
                }}
              >
                {loc.label}
              </span>
              <h3
                style={{
                  fontFamily: DISPLAY_FONT,
                  color: COLOR_DEEP,
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {loc.name}
              </h3>
              {loc.time ? (
                <p
                  className="mt-3 flex items-center gap-2"
                  style={{
                    fontFamily: BODY_FONT,
                    color: COLOR_SAGE,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="none" stroke={COLOR_SAGE} strokeWidth="1.5" />
                    <path d="M12 7 V 12 L 15 14" stroke={COLOR_SAGE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                  {loc.time}
                </p>
              ) : null}
              {loc.address ? (
                <p
                  className="mt-3"
                  style={{
                    fontFamily: BODY_FONT,
                    color: COLOR_TEXT,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                  }}
                >
                  {loc.address}
                </p>
              ) : null}
              {loc.city ? (
                <p
                  style={{
                    fontFamily: BODY_FONT,
                    color: COLOR_TEXT,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    opacity: 0.75,
                  }}
                >
                  {loc.city}
                </p>
              ) : null}
              {loc.mapsLink ? (
                <a
                  href={loc.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 text-[11px] font-medium uppercase"
                  style={{
                    color: COLOR_DEEP,
                    letterSpacing: '0.2em',
                    fontFamily: BODY_FONT,
                    borderBottom: `1px solid ${COLOR_SAGE}`,
                    paddingBottom: '2px',
                  }}
                >
                  {l.viewMap}
                  <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 9 L 9 3 M 5 3 H 9 V 7" stroke={COLOR_DEEP} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Dress code — gentle, single card with sage border.
 * ────────────────────────────────────────────────────────────────────────── */

function DressCodeSection({
  dressCode,
  labels: l,
}: {
  dressCode: PublicInvitationPageProps['dressCode'];
  labels: LabelSet;
}): ReactElement | null {
  const ref = useReveal<HTMLDivElement>();
  if (!dressCode) return null;
  const body = dressCode.body && dressCode.body.trim().length > 0
    ? dressCode.body
    : l.dressCodeHint;

  return (
    <section
      ref={ref}
      className="retreat-reveal relative w-full py-24 sm:py-32 px-6"
      style={{ backgroundColor: COLOR_CREAM }}
    >
      <CornerBranch position="bl" rotate={120} />
      <div className="relative max-w-2xl mx-auto text-center">
        <SectionLabel align="center">{l.dressCode}</SectionLabel>
        <div
          className="retreat-card-lift mt-4 rounded-[20px] border p-10"
          style={{
            backgroundColor: COLOR_CREAM,
            borderColor: 'rgba(107,142,78,0.30)',
            boxShadow: '0 6px 18px rgba(45,80,22,0.06)',
          }}
        >
          <p
            style={{
              fontFamily: BODY_FONT,
              color: COLOR_TEXT,
              fontSize: '1rem',
              lineHeight: 1.75,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * RSVP — calm, centered CTA. Hidden if !rsvpEnabled.
 * ────────────────────────────────────────────────────────────────────────── */

function RsvpSection({
  enabled,
  onRsvpClick,
  labels: l,
}: {
  enabled: boolean;
  onRsvpClick?: () => void;
  labels: LabelSet;
}): ReactElement | null {
  const ref = useReveal<HTMLDivElement>();
  if (!enabled) return null;

  return (
    <section
      ref={ref}
      className="retreat-reveal relative w-full py-28 sm:py-36 px-6"
      style={{ backgroundColor: COLOR_CREAM }}
    >
      <div className="relative max-w-2xl mx-auto text-center">
        <span
          className="block text-[10px] font-medium uppercase mb-5"
          style={{
            color: COLOR_SAGE,
            letterSpacing: '0.3em',
            fontFamily: BODY_FONT,
          }}
        >
          {l.rsvpKicker}
        </span>
        <h2
          className="retreat-title-underline inline-block"
          style={{
            fontFamily: DISPLAY_FONT,
            color: COLOR_DEEP,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          {l.rsvpTitle}
        </h2>
        <p
          className="mt-10 max-w-md mx-auto"
          style={{
            fontFamily: BODY_FONT,
            color: COLOR_TEXT,
            fontSize: '0.95rem',
            lineHeight: 1.7,
            opacity: 0.85,
          }}
        >
          {l.rsvpHint}
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Footer — Deer Planner attribution + small leaf.
 * ────────────────────────────────────────────────────────────────────────── */

function Footer({ labels: l }: { labels: LabelSet }): ReactElement {
  return (
    <footer
      className="w-full py-10 px-6"
      style={{
        backgroundColor: COLOR_DEEP,
        color: COLOR_CREAM,
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LeafGlyph size={14} />
          <span
            className="text-[11px] font-medium uppercase"
            style={{ letterSpacing: '0.3em', fontFamily: BODY_FONT }}
          >
            {l.poweredBy}
          </span>
        </div>
        <span
          className="text-[10px] uppercase"
          style={{
            letterSpacing: '0.25em',
            fontFamily: BODY_FONT,
            opacity: 0.65,
          }}
        >
          {l.tagline}
        </span>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Default export — the assembled template.
 */
export default function RetreatTemplate(
  props: PublicInvitationPageProps,
): ReactElement {
  useRetreatFonts();
  useRetreatStyles();

  const l = labels[props.locale];

  return (
    <article
      className="w-full min-h-screen"
      style={{
        backgroundColor: COLOR_CREAM,
        color: COLOR_TEXT,
        fontFamily: BODY_FONT,
      }}
    >
      <Hero props={props} labels={l} />
      <DescriptionSection description={props.description} labels={l} />
      <SpeakersSection speakers={props.speakers} labels={l} />
      <ProgramSection
        program={props.program}
        labels={l}
        locale={props.locale}
      />
      <LocationsSection locations={props.locations} labels={l} />
      <DressCodeSection dressCode={props.dressCode} labels={l} />
      <RsvpSection
        enabled={props.rsvpEnabled}
        onRsvpClick={props.onRsvpClick}
        labels={l}
      />
      <Footer labels={l} />
    </article>
  );
}