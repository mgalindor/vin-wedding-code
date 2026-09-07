/**
 * Bosco — Forest Wedding Invitation Template
 *
 * Theme: An intimate outdoor forest wedding. Full-bleed hero with the
 * couple's names in Cormorant Garamond italic over a deep forest backdrop,
 * sections alternating between deep forest green and cream, connected by
 * hand-drawn leaf SVG dividers. Subtle fade-up scroll reveal evokes a
 * quiet walk through the woods.
 *
 * Palette (exact):
 *   Forest green: #2F4A3A
 *   Sage:         #A8C3A0
 *   Cream:        #F4EFE6
 *   Moss gold:    #C9A961
 *
 * Typography:
 *   Display: Cormorant Garamond (italic for names, h1, h2)
 *   Body:    Inter
 */
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from 'react';

export interface PublicInvitationPageProps {
  partner1Name: string;
  partner2Name: string;
  eventDate: string; // ISO date e.g. '2026-11-08'
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  dressCode?: { entries: { title: string; body: string }[] } | null;
  giftRegistry?: { body: string } | null;
  parents?: { body: string } | null;
  accommodation?: { body: string } | null;
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
// Palette tokens
// ---------------------------------------------------------------------------
const FOREST = '#2F4A3A';
const SAGE = '#A8C3A0';
const CREAM = '#F4EFE6';
const MOSS = '#C9A961';

const FONT_DISPLAY = "'Cormorant Garamond', 'Garamond', Georgia, serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

// ---------------------------------------------------------------------------
// Bilingual labels
// ---------------------------------------------------------------------------
type Locale = 'en' | 'es';

interface Labels {
  heroEyebrow: string;
  storyTitle: string;
  countdownTitle: string;
  countdownUntil: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  countdownPast: string;
  locationsTitle: string;
  locationsHint: string;
  openInMaps: string;
  programTitle: string;
  dressCodeTitle: string;
  giftRegistryTitle: string;
  parentsTitle: string;
  accommodationTitle: string;
  rsvpTitle: string;
  rsvpNote: string;
  rsvpButton: string;
  footerNote: string;
  poweredBy: string;
  scrollHint: string;
  at: string;
}

const labels: Record<Locale, Labels> = {
  en: {
    heroEyebrow: 'Together with their families',
    storyTitle: 'Our story',
    countdownTitle: 'Counting the days',
    countdownUntil: 'until we say I do',
    countdownDays: 'days',
    countdownHours: 'hrs',
    countdownMinutes: 'min',
    countdownSeconds: 'sec',
    countdownPast: 'Today is the day',
    locationsTitle: 'Where to find us',
    locationsHint: 'Tap a venue for directions',
    openInMaps: 'Open in maps',
    programTitle: 'The celebration',
    dressCodeTitle: 'Dress code',
    giftRegistryTitle: 'Gifts',
    parentsTitle: 'With the blessing of',
    accommodationTitle: 'Where to stay',
    rsvpTitle: 'Will you join us?',
    rsvpNote: 'Kindly let us know before the day',
    rsvpButton: 'Confirm attendance',
    footerNote: 'Made with love in the woods',
    poweredBy: 'Deer Planner',
    scrollHint: 'Scroll',
    at: 'at',
  },
  es: {
    heroEyebrow: 'Junto a sus familias',
    storyTitle: 'Nuestra historia',
    countdownTitle: 'La cuenta atrás',
    countdownUntil: 'para el gran día',
    countdownDays: 'días',
    countdownHours: 'hs',
    countdownMinutes: 'min',
    countdownSeconds: 'seg',
    countdownPast: '¡Llegó el día!',
    locationsTitle: 'Dónde encontrarnos',
    locationsHint: 'Tocá un lugar para abrir el mapa',
    openInMaps: 'Abrir en mapas',
    programTitle: 'La celebración',
    dressCodeTitle: 'Vestimenta',
    giftRegistryTitle: 'Regalos',
    parentsTitle: 'Con la bendición de',
    accommodationTitle: 'Dónde hospedarse',
    rsvpTitle: '¿Nos acompañás?',
    rsvpNote: 'Agradecemos confirmarnos antes del gran día',
    rsvpButton: 'Confirmar asistencia',
    footerNote: 'Hecho con amor en el bosque',
    poweredBy: 'Deer Planner',
    scrollHint: 'Desplazate',
    at: 'a las',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatLongDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function monogram(name1: string, name2: string): string {
  const a = (name1.trim().charAt(0) || 'A').toUpperCase();
  const b = (name2.trim().charAt(0) || 'B').toUpperCase();
  return `${a} & ${b}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function useCountdown(targetIso: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
} {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return useMemo(() => {
    const target = new Date(targetIso).getTime();
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff / 3_600_000) % 24);
    const minutes = Math.floor((diff / 60_000) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, past: now >= target };
  }, [targetIso, now]);
}

function useReveal<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function useGoogleFonts(): void {
  useEffect(() => {
    const href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap';
    const existing = document.head.querySelector<HTMLLinkElement>(
      'link[data-bosco-fonts]',
    );
    if (existing) {
      if (existing.href !== href) existing.href = href;
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-bosco-fonts', 'true');
    document.head.appendChild(link);
  }, []);
}

// ---------------------------------------------------------------------------
// SVG decorations (inline; no third-party assets)
// ---------------------------------------------------------------------------
function LeafGlyph({
  size = 18,
  className = '',
  rotated = false,
}: {
  size?: number;
  className?: string;
  rotated?: boolean;
}): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`${rotated ? 'rotate-180 ' : ''}${className}`.trim()}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6 7 3 11 3 15a9 9 0 0 0 18 0c0-4-3-8-9-13z" />
      <path
        d="M12 3.4v18.2"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function BranchDivider({ className = '' }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 240 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 24 Q60 22 120 24 T235 24" />
      <path d="M50 24 q-8 -8 -16 -9" />
      <path d="M50 24 q-8 8 -16 9" />
      <path d="M92 24 q8 -8 16 -9" />
      <path d="M92 24 q8 8 16 9" />
      <path d="M148 24 q-8 -8 -16 -9" />
      <path d="M148 24 q-8 8 -16 9" />
      <path d="M190 24 q8 -8 16 -9" />
      <path d="M190 24 q8 8 16 9" />
      <ellipse
        cx="36"
        cy="13"
        rx="7"
        ry="3.5"
        transform="rotate(-35 36 13)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="36"
        cy="35"
        rx="7"
        ry="3.5"
        transform="rotate(35 36 35)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="112"
        cy="14"
        rx="7"
        ry="3.5"
        transform="rotate(-35 112 14)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="112"
        cy="34"
        rx="7"
        ry="3.5"
        transform="rotate(35 112 34)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="136"
        cy="14"
        rx="7"
        ry="3.5"
        transform="rotate(-35 136 14)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="136"
        cy="34"
        rx="7"
        ry="3.5"
        transform="rotate(35 136 34)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="204"
        cy="14"
        rx="7"
        ry="3.5"
        transform="rotate(-35 204 14)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
      <ellipse
        cx="204"
        cy="34"
        rx="7"
        ry="3.5"
        transform="rotate(35 204 34)"
        fill="currentColor"
        stroke="none"
        opacity="0.75"
      />
    </svg>
  );
}

function CornerLeaf({
  className = '',
  position = 'tl',
}: {
  className?: string;
  position?: 'tl' | 'tr' | 'bl' | 'br';
}): ReactElement {
  const positionClass: Record<typeof position, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0 -scale-x-100',
    bl: 'bottom-0 left-0 -scale-y-100',
    br: 'bottom-0 right-0 -scale-100',
  };
  return (
    <svg
      viewBox="0 0 120 120"
      className={`absolute ${positionClass[position]} ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.45"
      aria-hidden="true"
    >
      <path d="M5 5 Q40 5 60 30 T110 60" />
      <ellipse cx="25" cy="12" rx="10" ry="4" transform="rotate(-25 25 12)" fill="currentColor" stroke="none" opacity="0.65" />
      <ellipse cx="48" cy="22" rx="11" ry="4.5" transform="rotate(-25 48 22)" fill="currentColor" stroke="none" opacity="0.65" />
      <ellipse cx="72" cy="38" rx="12" ry="5" transform="rotate(-25 72 38)" fill="currentColor" stroke="none" opacity="0.65" />
      <ellipse cx="18" cy="28" rx="9" ry="4" transform="rotate(-25 18 28)" fill="currentColor" stroke="none" opacity="0.55" />
      <ellipse cx="40" cy="36" rx="10" ry="4" transform="rotate(-25 40 36)" fill="currentColor" stroke="none" opacity="0.55" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section primitives
// ---------------------------------------------------------------------------
function SectionFrame({
  tone,
  children,
  className = '',
  id,
}: {
  tone: 'forest' | 'cream';
  children: ReactElement | ReactElement[];
  className?: string;
  id?: string;
}): ReactElement {
  const bg = tone === 'forest' ? `bg-[${FOREST}]` : `bg-[${CREAM}]`;
  const text = tone === 'forest' ? `text-[${CREAM}]` : `text-[${FOREST}]`;
  return (
    <section
      id={id}
      className={`relative overflow-hidden px-6 py-24 md:py-32 ${bg} ${text} ${className}`.trim()}
      style={{
        backgroundColor: tone === 'forest' ? FOREST : CREAM,
        color: tone === 'forest' ? CREAM : FOREST,
      }}
    >
      <CornerLeaf
        position="tl"
        className={tone === 'forest' ? 'text-[#A8C3A0]' : 'text-[#C9A961]'}
      />
      <CornerLeaf
        position="br"
        className={tone === 'forest' ? 'text-[#A8C3A0]' : 'text-[#C9A961]'}
      />
      <div className="relative mx-auto max-w-3xl">{children}</div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  tone,
}: {
  eyebrow?: string;
  title: string;
  tone: 'forest' | 'cream';
}): ReactElement {
  const accent = tone === 'forest' ? `text-[${MOSS}]` : `text-[${MOSS}]`;
  return (
    <div className="mb-12 flex flex-col items-center text-center">
      {eyebrow && (
        <span
          className={`mb-3 text-[10px] uppercase tracking-[0.4em] ${accent}`}
          style={{ fontFamily: FONT_BODY }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className="text-4xl italic md:text-5xl"
        style={{ fontFamily: FONT_DISPLAY, fontWeight: 500 }}
      >
        {title}
      </h2>
      <BranchDivider className={`mt-6 h-8 w-40 opacity-80 ${accent}`} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main template
// ---------------------------------------------------------------------------
export default function BoscoTemplate(
  props: PublicInvitationPageProps,
): ReactElement {
  useGoogleFonts();
  const t = labels[props.locale];
  const countdown = useCountdown(props.eventDate);
  const dateLabel = formatLongDate(props.eventDate, props.locale);
  const mono = monogram(props.partner1Name, props.partner2Name);

  const storyRef = useReveal<HTMLDivElement>();
  const countdownRef = useReveal<HTMLDivElement>();
  const locationsRef = useReveal<HTMLDivElement>();
  const programRef = useReveal<HTMLDivElement>();
  const dressRef = useReveal<HTMLDivElement>();
  const giftRef = useReveal<HTMLDivElement>();
  const parentsRef = useReveal<HTMLDivElement>();
  const accomRef = useReveal<HTMLDivElement>();
  const rsvpRef = useReveal<HTMLDivElement>();

  const hasStory = Boolean(props.story);
  const hasDress = Boolean(props.dressCode && props.dressCode.entries.length > 0);
  const hasGift = Boolean(props.giftRegistry);
  const hasParents = Boolean(props.parents);
  const hasAccom = Boolean(props.accommodation);
  const hasLocations = props.locations.length > 0;
  const hasProgram = props.program.days.length > 0;

  const countdownUnits: Array<{ value: number; label: string }> = [
    { value: countdown.days, label: t.countdownDays },
    { value: countdown.hours, label: t.countdownHours },
    { value: countdown.minutes, label: t.countdownMinutes },
    { value: countdown.seconds, label: t.countdownSeconds },
  ];

  return (
    <div
      className="min-h-screen w-full bg-[#F4EFE6] text-[#2F4A3A]"
      style={{ fontFamily: FONT_BODY, color: FOREST, backgroundColor: CREAM }}
    >
      {/* Inline motion styles (respect prefers-reduced-motion) */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .reveal {
            opacity: 0;
            transform: translateY(28px);
            transition:
              opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          .reveal.is-visible {
            opacity: 1;
            transform: translateY(0);
          }
          .reveal-d-1 { transition-delay: 120ms; }
          .reveal-d-2 { transition-delay: 240ms; }
          .reveal-d-3 { transition-delay: 360ms; }
          html { scroll-behavior: smooth; }
        }
      `}</style>

      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        style={{ backgroundColor: FOREST }}
      >
        {/* Background */}
        {props.heroImageUrl ? (
          <>
            <img
              src={props.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(47,74,58,0.65) 0%, rgba(47,74,58,0.40) 45%, rgba(47,74,58,0.78) 100%)',
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${FOREST} 0%, ${FOREST} 38%, ${SAGE} 70%, ${CREAM} 100%)`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span
                className="select-none italic"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: CREAM,
                  opacity: 0.07,
                  fontSize: 'clamp(14rem, 32vw, 32rem)',
                  lineHeight: 0.85,
                  letterSpacing: '-0.02em',
                }}
              >
                {mono}
              </span>
            </div>
          </>
        )}

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Foreground content */}
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
          <p
            className="mb-6 text-[10px] uppercase tracking-[0.45em] md:text-xs"
            style={{ color: CREAM, opacity: 0.85, fontFamily: FONT_BODY }}
          >
            {props.landingTitle ?? t.heroEyebrow}
          </p>

          <h1
            className="leading-[0.95]"
            style={{
              fontFamily: FONT_DISPLAY,
              color: CREAM,
              fontStyle: 'italic',
              fontWeight: 400,
            }}
          >
            <span className="block text-5xl md:text-7xl lg:text-8xl">
              {props.partner1Name}
            </span>
            <span
              className="my-3 block text-3xl md:text-4xl lg:text-5xl"
              style={{
                color: MOSS,
                fontStyle: 'normal',
                fontWeight: 300,
                letterSpacing: '0.05em',
              }}
              aria-hidden="true"
            >
              &amp;
            </span>
            <span className="block text-5xl md:text-7xl lg:text-8xl">
              {props.partner2Name}
            </span>
          </h1>

          <div
            className="mt-10 flex items-center justify-center gap-4"
            style={{ color: CREAM }}
          >
            <LeafGlyph size={14} className="text-[#C9A961]" />
            <span
              className="text-sm tracking-[0.28em] uppercase md:text-base"
              style={{ fontFamily: FONT_BODY, opacity: 0.92 }}
            >
              {dateLabel}
            </span>
            <LeafGlyph size={14} className="text-[#C9A961] rotated" />
          </div>

          {props.landingSubtitle && (
            <p
              className="mt-8 max-w-md text-base italic md:text-lg"
              style={{ color: CREAM, opacity: 0.85, fontFamily: FONT_DISPLAY }}
            >
              {props.landingSubtitle}
            </p>
          )}
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
          style={{ color: CREAM, opacity: 0.7 }}
          aria-hidden="true"
        >
          <span
            className="text-[10px] uppercase tracking-[0.4em]"
            style={{ fontFamily: FONT_BODY }}
          >
            {t.scrollHint}
          </span>
          <span
            className="block h-12 w-px"
            style={{ backgroundColor: 'currentColor' }}
          />
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* STORY                                                            */}
      {/* ---------------------------------------------------------------- */}
      {hasStory && (
        <SectionFrame tone="cream" id="story">
          <div ref={storyRef} className="reveal text-center">
            <SectionHeading eyebrow="—" title={t.storyTitle} tone="cream" />
            <p
              className="mx-auto max-w-2xl text-base leading-loose md:text-lg"
              style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic' }}
            >
              {props.story?.body}
            </p>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* COUNTDOWN                                                         */}
      {/* ---------------------------------------------------------------- */}
      <SectionFrame tone="forest" id="countdown">
        <div ref={countdownRef} className="reveal text-center">
          <SectionHeading eyebrow="—" title={t.countdownTitle} tone="forest" />
          {countdown.past ? (
            <p
              className="text-3xl italic md:text-4xl"
              style={{ fontFamily: FONT_DISPLAY, color: CREAM }}
            >
              {t.countdownPast}
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
              {countdownUnits.map((unit, i) => (
                <Fragment key={unit.label}>
                  <div className="flex min-w-[64px] flex-col items-center">
                    <span
                      className="text-5xl italic leading-none md:text-7xl"
                      style={{
                        fontFamily: FONT_DISPLAY,
                        color: CREAM,
                        fontWeight: 500,
                      }}
                    >
                      {pad2(unit.value)}
                    </span>
                    <span
                      className="mt-3 text-[10px] uppercase tracking-[0.32em] md:text-xs"
                      style={{
                        fontFamily: FONT_BODY,
                        color: CREAM,
                        opacity: 0.75,
                      }}
                    >
                      {unit.label}
                    </span>
                  </div>
                  {i < countdownUnits.length - 1 && (
                    <LeafGlyph
                      size={18}
                      className="self-center text-[#C9A961]"
                    />
                  )}
                </Fragment>
              ))}
            </div>
          )}
          <p
            className="mt-8 text-sm italic md:text-base"
            style={{
              fontFamily: FONT_DISPLAY,
              color: CREAM,
              opacity: 0.75,
            }}
          >
            {t.countdownUntil}
          </p>
        </div>
      </SectionFrame>

      {/* ---------------------------------------------------------------- */}
      {/* LOCATIONS                                                         */}
      {/* ---------------------------------------------------------------- */}
      {hasLocations && (
        <SectionFrame tone="cream" id="locations">
          <div ref={locationsRef} className="reveal">
            <SectionHeading eyebrow="—" title={t.locationsTitle} tone="cream" />
            <p
              className="-mt-6 mb-10 text-center text-xs tracking-[0.2em] uppercase md:text-sm"
              style={{ color: FOREST, opacity: 0.6, fontFamily: FONT_BODY }}
            >
              {t.locationsHint}
            </p>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {props.locations.map((loc, i) => (
                <li
                  key={`${loc.label}-${i}`}
                  className={`reveal reveal-d-${(i % 3) + 1} relative rounded-sm border px-6 py-7 transition-shadow duration-300 hover:shadow-md`}
                  style={{
                    borderColor: `${FOREST}33`,
                    backgroundColor: '#FBF8F1',
                  }}
                >
                  <span
                    className="mb-3 inline-block text-[10px] uppercase tracking-[0.35em]"
                    style={{ color: MOSS, fontFamily: FONT_BODY }}
                  >
                    {loc.label}
                  </span>
                  <h3
                    className="text-2xl italic md:text-3xl"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      color: FOREST,
                      fontWeight: 500,
                    }}
                  >
                    {loc.name}
                  </h3>
                  {loc.time && (
                    <p
                      className="mt-2 text-sm"
                      style={{ color: FOREST, fontFamily: FONT_BODY }}
                    >
                      <span className="opacity-60">{t.at} </span>
                      <span className="font-medium">{loc.time}</span>
                    </p>
                  )}
                  {(loc.address || loc.city) && (
                    <p
                      className="mt-3 text-sm leading-relaxed"
                      style={{
                        color: FOREST,
                        opacity: 0.75,
                        fontFamily: FONT_BODY,
                      }}
                    >
                      {[loc.address, loc.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {loc.mapsLink && (
                    <a
                      href={loc.mapsLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] transition-opacity duration-200 hover:opacity-70"
                      style={{ color: FOREST, fontFamily: FONT_BODY }}
                    >
                      <LeafGlyph size={12} className="text-[#C9A961]" />
                      {t.openInMaps}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* PROGRAM                                                           */}
      {/* ---------------------------------------------------------------- */}
      {hasProgram && (
        <SectionFrame tone="forest" id="program">
          <div ref={programRef} className="reveal">
            <SectionHeading eyebrow="—" title={t.programTitle} tone="forest" />
            <div className="space-y-14">
              {props.program.days.map((day, dayIdx) => (
                <div key={`${day.label ?? 'day'}-${dayIdx}`} className="relative">
                  <div className="mb-6 flex items-baseline justify-center gap-3">
                    {day.date && (
                      <span
                        className="text-[10px] uppercase tracking-[0.35em]"
                        style={{
                          color: MOSS,
                          fontFamily: FONT_BODY,
                        }}
                      >
                        {formatShortDate(day.date, props.locale)}
                      </span>
                    )}
                    {day.label && (
                      <h3
                        className="text-2xl italic md:text-3xl"
                        style={{
                          fontFamily: FONT_DISPLAY,
                          color: CREAM,
                          fontWeight: 500,
                        }}
                      >
                        {day.label}
                      </h3>
                    )}
                  </div>
                  <BranchDivider className="mx-auto mb-8 h-6 w-32 text-[#C9A961]" />
                  <ol className="space-y-6">
                    {day.items.map((item, i) => (
                      <li
                        key={`${item.time}-${i}`}
                        className="flex flex-col items-center text-center md:flex-row md:items-baseline md:gap-8 md:text-left"
                      >
                        <span
                          className="mb-1 inline-block min-w-[5.5rem] text-base italic md:text-lg md:mb-0"
                          style={{
                            fontFamily: FONT_DISPLAY,
                            color: MOSS,
                            fontWeight: 500,
                          }}
                        >
                          {item.time}
                        </span>
                        <div className="md:flex-1">
                          <p
                            className="text-lg md:text-xl"
                            style={{
                              fontFamily: FONT_DISPLAY,
                              color: CREAM,
                              fontWeight: 500,
                            }}
                          >
                            {item.title}
                          </p>
                          {item.detail && (
                            <p
                              className="mt-1 text-sm"
                              style={{
                                color: CREAM,
                                opacity: 0.7,
                                fontFamily: FONT_BODY,
                              }}
                            >
                              {item.detail}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* DRESS CODE                                                        */}
      {/* ---------------------------------------------------------------- */}
      {hasDress && (
        <SectionFrame tone="cream" id="dress-code">
          <div ref={dressRef} className="reveal">
            <SectionHeading eyebrow="—" title={t.dressCodeTitle} tone="cream" />
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {props.dressCode?.entries.map((entry, i) => (
                <li
                  key={`${entry.title}-${i}`}
                  className="text-center md:text-left"
                >
                  <h3
                    className="text-xl italic md:text-2xl"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      color: FOREST,
                      fontWeight: 500,
                    }}
                  >
                    {entry.title}
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed md:text-base"
                    style={{
                      color: FOREST,
                      opacity: 0.75,
                      fontFamily: FONT_BODY,
                    }}
                  >
                    {entry.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* GIFT REGISTRY                                                     */}
      {/* ---------------------------------------------------------------- */}
      {hasGift && (
        <SectionFrame tone="forest" id="gift-registry">
          <div ref={giftRef} className="reveal text-center">
            <SectionHeading
              eyebrow="—"
              title={t.giftRegistryTitle}
              tone="forest"
            />
            <p
              className="mx-auto max-w-2xl text-base leading-loose md:text-lg"
              style={{
                fontFamily: FONT_DISPLAY,
                color: CREAM,
                fontStyle: 'italic',
              }}
            >
              {props.giftRegistry?.body}
            </p>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* PARENTS                                                           */}
      {/* ---------------------------------------------------------------- */}
      {hasParents && (
        <SectionFrame tone="cream" id="parents">
          <div ref={parentsRef} className="reveal text-center">
            <SectionHeading eyebrow="—" title={t.parentsTitle} tone="cream" />
            <p
              className="mx-auto max-w-2xl text-base leading-loose md:text-lg"
              style={{
                fontFamily: FONT_DISPLAY,
                color: FOREST,
                fontStyle: 'italic',
              }}
            >
              {props.parents?.body}
            </p>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ACCOMMODATION                                                     */}
      {/* ---------------------------------------------------------------- */}
      {hasAccom && (
        <SectionFrame tone="forest" id="accommodation">
          <div ref={accomRef} className="reveal text-center">
            <SectionHeading
              eyebrow="—"
              title={t.accommodationTitle}
              tone="forest"
            />
            <p
              className="mx-auto max-w-2xl whitespace-pre-line text-base leading-loose md:text-lg"
              style={{
                fontFamily: FONT_DISPLAY,
                color: CREAM,
                fontStyle: 'italic',
              }}
            >
              {props.accommodation?.body}
            </p>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* RSVP CTA                                                          */}
      {/* ---------------------------------------------------------------- */}
      {props.rsvpEnabled && (
        <SectionFrame tone="cream" id="rsvp">
          <div ref={rsvpRef} className="reveal text-center">
            <SectionHeading eyebrow="—" title={t.rsvpTitle} tone="cream" />
            <p
              className="mx-auto mb-10 max-w-md text-base md:text-lg"
              style={{
                fontFamily: FONT_DISPLAY,
                color: FOREST,
                opacity: 0.75,
                fontStyle: 'italic',
              }}
            >
              {t.rsvpNote}
            </p>
            <button
              type="button"
              onClick={props.onRsvpClick}
              className="group inline-flex items-center justify-center gap-3 rounded-full border px-12 py-4 text-sm uppercase tracking-[0.3em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A961] focus-visible:ring-offset-2"
              style={{
                backgroundColor: CREAM,
                color: FOREST,
                borderColor: MOSS,
                fontFamily: FONT_BODY,
                boxShadow: '0 1px 2px rgba(47,74,58,0.10)',
              }}
            >
              <LeafGlyph
                size={14}
                className="text-[#C9A961] transition-transform duration-300 group-hover:-rotate-45"
              />
              {t.rsvpButton}
              <LeafGlyph
                size={14}
                className="text-[#C9A961] rotated transition-transform duration-300 group-hover:rotate-[135deg]"
              />
            </button>
          </div>
        </SectionFrame>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer
        className="relative w-full px-6 py-12 text-center"
        style={{ backgroundColor: FOREST, color: CREAM }}
      >
        <BranchDivider className="mx-auto mb-6 h-6 w-32 text-[#C9A961]" />
        <p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ fontFamily: FONT_BODY, color: CREAM, opacity: 0.7 }}
        >
          {t.footerNote}
        </p>
        <p
          className="mt-3 text-[10px] tracking-[0.25em] uppercase"
          style={{ fontFamily: FONT_BODY, color: CREAM, opacity: 0.5 }}
        >
          Powered by{' '}
          <span style={{ color: MOSS, letterSpacing: '0.3em' }}>
            {t.poweredBy}
          </span>
        </p>
      </footer>
    </div>
  );
}
