import { useEffect, useMemo, useState } from 'react';

/**
 * HOLLYWOOD — birthday invitation template.
 *
 * Theme: Academy Awards celebrity gala for an unforgettable adult milestone
 * (40, 50, 60). A full-bleed black-and-white portrait of the guest of honour
 * rises behind a velvet-black backdrop; every display headline is carved in
 * Hollywood gold and shimmers with a diagonal shine sweep. Red-carpet
 * accents, scattered gold stars, and 2px gilt borders frame the sections like
 * a cinematic premiere programme.
 *
 * Palette (exact):
 *   - Black          #0A0A0A  → page background, velvet panels, hero ground
 *   - Hollywood gold #D4AF37  → display text, borders, stars, eyebrows
 *   - Red carpet     #C8102E  → RSVP button, sparing accents only
 *   - White          #F5F5F5  → body text on velvet, button labels
 *
 * Typography:
 *   - Display: "Playfair Display" weight 900 for honoree name, section
 *     headings, countdown numerals and the age medallion — extreme contrast,
 *     unmistakable red-carpet glamour.
 *   - Body / UI: "Montserrat" for prose, eyebrows, location and programme
 *     metadata.
 *   Both fonts are loaded at runtime via injected Google Fonts <link>
 *   elements so the template stays self-contained and free of build-time
 *   dependencies.
 *
 * Motion: a single 3s diagonal shine sweep on gold display headlines, plus a
 * shine sweep + 1.05 scale on the RSVP button on hover. Everything is
 * disabled under `prefers-reduced-motion`.
 *
 * The component is presentation-only: no business logic, no data fetching,
 * no shared imports. Only React.
 */

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
  story: string;
  storyEyebrow: string;
  countdown: string;
  countdownPast: string;
  countdownSubtitle: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  turning: string;
  locations: string;
  program: string;
  rsvp: string;
  rsvpTitle: string;
  rsvpHint: string;
  viewMap: string;
  address: string;
  city: string;
  time: string;
  savedDate: string;
  premiere: string;
  guestOfHonour: string;
  attribution: string;
  madeWith: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    story: 'The Story',
    storyEyebrow: 'On the Occasion Of',
    countdown: 'The Countdown',
    countdownPast: 'The Night Is Here',
    countdownSubtitle: 'Until the red carpet rolls out',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    turning: 'Turning',
    locations: 'The Venues',
    program: 'The Night',
    rsvp: 'Reserve Your Seat',
    rsvpTitle: 'Will You Walk The Carpet',
    rsvpHint: 'Kindly confirm your attendance',
    viewMap: 'View Map',
    address: 'Address',
    city: 'City',
    time: 'Time',
    savedDate: 'Save The Date',
    premiere: 'A Premiere Invitation',
    guestOfHonour: 'Guest Of Honour',
    attribution: 'Deer Planner',
    madeWith: 'Invitation crafted with',
  },
  es: {
    story: 'La Historia',
    storyEyebrow: 'En Ocasión De',
    countdown: 'La Cuenta Atrás',
    countdownPast: 'Ha Llegado La Noche',
    countdownSubtitle: 'Hasta que se extienda la alfombra roja',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    turning: 'Cumple',
    locations: 'Las Sedes',
    program: 'La Noche',
    rsvp: 'Reserva Tu Asiento',
    rsvpTitle: 'Recorrerás La Alfombra',
    rsvpHint: 'Confirma por favor tu asistencia',
    viewMap: 'Ver Mapa',
    address: 'Dirección',
    city: 'Ciudad',
    time: 'Hora',
    savedDate: 'Reserva La Fecha',
    premiere: 'Una Invitación De Estreno',
    guestOfHonour: 'Invitado De Honor',
    attribution: 'Deer Planner',
    madeWith: 'Invitación creada con',
  },
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Montserrat:wght@300;400;500;600;700&display=swap';

const DISPLAY_FONT = "'Playfair Display', 'Bodoni Moda', 'Times New Roman', serif";
const BODY_FONT = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";

const GOLD = '#D4AF37';
const RED_CARPET = '#C8102E';
const BLACK = '#0A0A0A';
const WHITE = '#F5F5F5';
const VELVET = '#101010';

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useHollywoodFonts(): void {
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

interface StarProps {
  size?: number;
  className?: string;
  fill?: string;
}

/** Inline 5-point gold star — used for decorations, bullets, separators. */
function Star({ size = 16, className, fill = GOLD }: StarProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ display: 'block' }}
    >
      <path
        d="M12 1.6 14.85 8.55 22.4 9.27 16.55 14.14 18.18 21.6 12 17.6 5.82 21.6 7.45 14.14 1.6 9.27 9.15 8.55 12 1.6Z"
        fill={fill}
      />
    </svg>
  );
}

interface EyebrowProps {
  children: string;
}

/** Uppercase, wide-tracked, gold section eyebrow. */
function Eyebrow({ children }: EyebrowProps): React.ReactElement {
  return (
    <div className="mb-10 flex items-center justify-center gap-4 sm:gap-6">
      <span
        aria-hidden="true"
        className="block h-px w-10 bg-[#D4AF37]/60 sm:w-16"
      />
      <p
        className="text-[0.625rem] uppercase text-[#D4AF37] sm:text-[0.6875rem]"
        style={{ fontFamily: BODY_FONT, fontWeight: 600, letterSpacing: '0.4em' }}
      >
        {children}
      </p>
      <span
        aria-hidden="true"
        className="block h-px w-10 bg-[#D4AF37]/60 sm:w-16"
      />
    </div>
  );
}

interface SectionProps {
  id: string;
  eyebrow: string;
  heading?: string;
  children: React.ReactNode;
  variant?: 'velvet' | 'gold';
}

/**
 * A full-width panel. Velvet-black by default with gilt accents; a `gold`
 * variant flips to a gold-on-black celebration band used for marquee moments.
 */
function Section({
  id,
  eyebrow,
  heading,
  children,
  variant = 'velvet',
}: SectionProps): React.ReactElement {
  const isGold = variant === 'gold';
  return (
    <section
      id={id}
      className={[
        'relative w-full px-6 py-24 sm:px-10 md:py-32',
        isGold
          ? 'bg-[#0A0A0A] text-[#D4AF37] border-y-2 border-[#D4AF37]'
          : 'bg-[#101010] text-[#F5F5F5]',
      ].join(' ')}
    >
      <div className="mx-auto w-full max-w-4xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        {heading !== undefined ? (
          <h2
            className="hollywood-shine-text mb-14 text-center text-4xl leading-tight sm:text-5xl md:text-6xl"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {heading}
          </h2>
        ) : null}
        {children}
      </div>
    </section>
  );
}

interface ProseProps {
  body: string;
}

function Prose({ body }: ProseProps): React.ReactElement {
  return (
    <div className="mx-auto max-w-2xl">
      {toParagraphs(body).map((paragraph, index) => (
        <p
          key={index}
          className={[
            'text-center text-base leading-8 sm:text-lg sm:leading-9',
            index > 0 ? 'mt-6' : '',
            'text-[#F5F5F5]',
          ].join(' ')}
          style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
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
}

function CountdownUnit({
  value,
  caption,
}: CountdownUnitProps): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col items-center px-2 sm:px-6">
      <span
        className="hollywood-shine-text text-5xl leading-none sm:text-7xl md:text-8xl"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span
        className="mt-4 text-[0.5625rem] uppercase text-[#D4AF37] sm:text-[0.625rem]"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.4em',
        }}
      >
        {caption}
      </span>
    </div>
  );
}

interface CountdownSeparatorProps {
  variant?: 'star' | 'dot';
}

function CountdownSeparator({
  variant = 'star',
}: CountdownSeparatorProps): React.ReactElement {
  if (variant === 'dot') {
    return (
      <span
        aria-hidden="true"
        className="mx-1 block h-1.5 w-1.5 rounded-full bg-[#D4AF37]/70 sm:mx-2"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="hollywood-shine-text px-1 text-2xl sm:px-2 sm:text-3xl md:text-4xl"
      style={{ lineHeight: 1 }}
    >
      ★
    </span>
  );
}

interface LocationCardProps {
  location: PublicInvitationPageProps['locations'][number];
  labelViewMap: string;
  labelTime: string;
  labelAddress: string;
  labelCity: string;
}

function LocationCard({
  location,
  labelViewMap,
  labelTime,
  labelAddress,
  labelCity,
}: LocationCardProps): React.ReactElement {
  return (
    <article
      className="hollywood-card relative border border-[#D4AF37]/45 bg-[#0A0A0A]/80 p-8 transition-colors duration-300 hover:border-[#D4AF37] sm:p-10"
      style={{ fontFamily: BODY_FONT }}
    >
      <span
        aria-hidden="true"
        className="absolute -left-2 -top-2 bg-[#101010] p-1"
      >
        <Star size={14} />
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-2 -bottom-2 bg-[#101010] p-1"
      >
        <Star size={14} />
      </span>

      <p
        className="mb-5 text-[0.5625rem] uppercase text-[#D4AF37] sm:text-[0.625rem]"
        style={{ fontWeight: 600, letterSpacing: '0.4em' }}
      >
        {location.label}
      </p>

      <div className="mb-5 flex items-center gap-3">
        <Star size={10} />
        <h3
          className="text-2xl leading-tight text-[#F5F5F5] sm:text-3xl"
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 900,
            letterSpacing: '0.06em',
          }}
        >
          {location.name}
        </h3>
      </div>

      {location.address ? (
        <p className="text-sm leading-6 text-[#F5F5F5]/85">
          <span
            className="mr-2 text-[0.5625rem] uppercase text-[#D4AF37]"
            style={{ letterSpacing: '0.3em', fontWeight: 600 }}
          >
            {labelAddress}
          </span>
          {location.address}
        </p>
      ) : null}
      {location.city ? (
        <p
          className="mt-2 text-xs uppercase text-[#D4AF37]/85"
          style={{ letterSpacing: '0.3em', fontWeight: 500 }}
        >
          {labelCity} · {location.city}
        </p>
      ) : null}
      {location.time ? (
        <p
          className="mt-4 inline-flex items-center gap-2 text-xs uppercase text-[#F5F5F5]"
          style={{ letterSpacing: '0.3em', fontWeight: 600 }}
        >
          <Star size={9} />
          {labelTime} · {location.time}
        </p>
      ) : null}
      {location.mapsLink ? (
        <a
          href={location.mapsLink}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-7 inline-flex items-center gap-2 border-b border-[#D4AF37] pb-1 text-[0.625rem] uppercase text-[#D4AF37] transition-colors duration-300 hover:text-[#F5F5F5]"
          style={{ letterSpacing: '0.3em', fontWeight: 600 }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 0.75c-2 0-3.6 1.6-3.6 3.6C2.4 7.2 6 11.25 6 11.25S9.6 7.2 9.6 4.35C9.6 2.35 8 0.75 6 0.75Zm0 5.1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
              fill="currentColor"
            />
          </svg>
          {labelViewMap}
        </a>
      ) : null}
    </article>
  );
}

interface ProgramItemProps {
  time: string;
  title: string;
  detail?: string;
}

function ProgramItem({
  time,
  title,
  detail,
}: ProgramItemProps): React.ReactElement {
  return (
    <li className="hollywood-card relative flex flex-col gap-4 border border-[#D4AF37]/40 bg-[#0A0A0A]/80 p-6 transition-colors duration-300 hover:border-[#D4AF37] sm:flex-row sm:items-start sm:gap-8 sm:p-8">
      <span
        aria-hidden="true"
        className="absolute -left-1.5 -top-1.5 bg-[#101010] p-0.5"
      >
        <Star size={11} />
      </span>
      <span
        className="hollywood-shine-text shrink-0 text-xl leading-none sm:w-28 sm:text-2xl"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          letterSpacing: '0.06em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {time}
      </span>
      <div className="flex-1">
        <h4
          className="text-lg leading-tight text-[#F5F5F5] sm:text-xl"
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 900,
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </h4>
        {detail ? (
          <p
            className="mt-2 text-sm leading-6 text-[#F5F5F5]/75"
            style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
          >
            {detail}
          </p>
        ) : null}
      </div>
    </li>
  );
}

interface AgeMedallionProps {
  age: number;
  caption: string;
}

/** A round 2px-gold-bordered medallion containing the milestone age. */
function AgeMedallion({ age, caption }: AgeMedallionProps): React.ReactElement {
  return (
    <div
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#0A0A0A]/40 backdrop-blur-sm sm:h-40 sm:w-40"
      aria-label={`${caption} ${age}`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0A0A0A] px-2"
      >
        <Star size={10} />
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0A0A0A] px-2"
      >
        <Star size={10} />
      </span>
      <div className="flex flex-col items-center">
        <span
          className="hollywood-shine-text text-5xl leading-none sm:text-6xl"
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 900,
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {age}
        </span>
        <span
          className="mt-2 text-[0.5rem] uppercase text-[#D4AF37] sm:text-[0.5625rem]"
          style={{ letterSpacing: '0.4em', fontWeight: 600 }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
}

/**
 * HOLLYWOOD birthday invitation template.
 */
export default function HollywoodTemplate({
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
}: PublicInvitationPageProps): React.ReactElement {
  useHollywoodFonts();

  const t = labels[locale];
  const remaining = useCountdown(eventDate);
  const longDate = formatLongDate(eventDate, locale);
  const programDays = program.days.filter((day) => day.items.length > 0);
  const hasAge = typeof ageTurning === 'number' && Number.isFinite(ageTurning);

  return (
    <main
      className="min-h-screen w-full bg-[#0A0A0A] text-[#F5F5F5] antialiased"
      style={{ fontFamily: BODY_FONT }}
    >
      <style>{`
        .hollywood-root *, .hollywood-root *::before, .hollywood-root *::after { box-sizing: border-box; }

        @keyframes hollywood-shine {
          0%   { background-position: 100% 50%; }
          100% { background-position: -100% 50%; }
        }

        .hollywood-shine-text {
          background-image: linear-gradient(
            100deg,
            #8B6914 0%,
            #D4AF37 22%,
            #F6E29A 45%,
            #D4AF37 58%,
            #8B6914 100%
          );
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: hollywood-shine 3.4s linear infinite;
        }

        @keyframes hollywood-button-shine {
          0%   { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }

        .hollywood-rsvp-shine {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            transparent 35%,
            rgba(245, 230, 160, 0.55) 50%,
            transparent 65%,
            transparent 100%
          );
          transform: translateX(-140%);
          animation: hollywood-button-shine 2.6s linear infinite;
          animation-play-state: paused;
          pointer-events: none;
        }

        .hollywood-rsvp {
          position: relative;
          overflow: hidden;
          transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 350ms ease;
        }
        .hollywood-rsvp:hover {
          transform: scale(1.05);
          box-shadow: 0 18px 48px -18px rgba(200, 16, 46, 0.55);
        }
        .hollywood-rsvp:hover .hollywood-rsvp-shine {
          animation-play-state: running;
        }
        .hollywood-rsvp:focus-visible {
          outline: 2px solid #D4AF37;
          outline-offset: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .hollywood-shine-text,
          .hollywood-rsvp-shine {
            animation: none !important;
          }
          .hollywood-rsvp {
            transition: none !important;
          }
          .hollywood-rsvp:hover {
            transform: none;
          }
        }
      `}</style>

      <div className="hollywood-root">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <header className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0A0A0A]">
          {heroImageUrl ? (
            <>
              <img
                src={heroImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: 'grayscale(100%) contrast(1.05)' }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#0A0A0A]/55"
              />
            </>
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, #1A1A1A 0%, #0A0A0A 55%, #000000 100%)',
              }}
            />
          )}

          {/* Three scattered gold stars pinned to the hero corners. */}
          <span
            aria-hidden="true"
            className="absolute left-6 top-10 sm:left-14 sm:top-16"
          >
            <Star size={18} />
          </span>
          <span
            aria-hidden="true"
            className="absolute right-8 top-20 sm:right-20 sm:top-28"
          >
            <Star size={12} />
          </span>
          <span
            aria-hidden="true"
            className="absolute left-10 bottom-16 hidden sm:left-24 sm:bottom-24 sm:block"
          >
            <Star size={14} />
          </span>
          <span
            aria-hidden="true"
            className="absolute right-6 bottom-12 sm:right-14 sm:bottom-16"
          >
            <Star size={20} />
          </span>

          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center sm:px-10">
            {/* Top eyebrow */}
            <p
              className="mb-10 text-[0.625rem] uppercase text-[#D4AF37] sm:text-[0.6875rem]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
              }}
            >
              {landingTitle ?? t.premiere}
            </p>

            <h1
              className="hollywood-shine-text text-[2.75rem] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[6.5rem]"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {honoreeName}
            </h1>

            {hasAge ? (
              <div className="mt-12 flex flex-col items-center gap-6 sm:mt-14 sm:flex-row sm:gap-10">
                <AgeMedallion age={ageTurning as number} caption={t.turning} />
                <div className="text-center sm:text-left">
                  <p
                    className="text-[0.5625rem] uppercase text-[#D4AF37] sm:text-[0.625rem]"
                    style={{
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      letterSpacing: '0.4em',
                    }}
                  >
                    {t.guestOfHonour}
                  </p>
                  <p
                    className="mt-3 text-xs uppercase text-[#F5F5F5] sm:text-sm"
                    style={{
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      letterSpacing: '0.3em',
                    }}
                  >
                    <time dateTime={eventDate}>{longDate}</time>
                  </p>
                </div>
              </div>
            ) : (
              <p
                className="mt-12 text-xs uppercase text-[#F5F5F5] sm:mt-14 sm:text-sm"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.3em',
                }}
              >
                <time dateTime={eventDate}>{longDate}</time>
              </p>
            )}

            <span
              aria-hidden="true"
              className="my-12 inline-flex items-center gap-3 sm:my-14"
            >
              <span className="block h-px w-12 bg-[#D4AF37]/60 sm:w-20" />
              <Star size={10} />
              <span className="block h-px w-12 bg-[#D4AF37]/60 sm:w-20" />
            </span>

            {landingSubtitle ? (
              <p
                className="max-w-xl text-sm leading-7 text-[#F5F5F5]/80 sm:text-base"
                style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
              >
                {landingSubtitle}
              </p>
            ) : (
              <p
                className="text-[0.625rem] uppercase text-[#D4AF37]/85 sm:text-[0.6875rem]"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.4em',
                }}
              >
                {t.savedDate}
              </p>
            )}
          </div>
        </header>

        {/* ── STORY ────────────────────────────────────────────────────── */}
        {story && story.body.trim().length > 0 ? (
          <Section
            id="hollywood-story"
            eyebrow={t.storyEyebrow}
            heading={t.story}
            variant="velvet"
          >
            <Prose body={story.body} />
          </Section>
        ) : null}

        {/* ── COUNTDOWN ────────────────────────────────────────────────── */}
        <section
          id="hollywood-countdown"
          className="relative w-full border-y-2 border-[#D4AF37] bg-[#0A0A0A] px-6 py-24 text-center sm:px-10 md:py-32"
        >
          <div className="mx-auto w-full max-w-4xl">
            <p
              className="mb-3 text-[0.5625rem] uppercase text-[#D4AF37] sm:text-[0.625rem]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
              }}
            >
              {remaining.past ? t.countdownPast : t.countdown}
            </p>
            <h2
              className="hollywood-shine-text mb-4 text-3xl leading-tight sm:text-4xl md:text-5xl"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 900,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {honoreeName}
            </h2>
            <p
              className="mb-14 text-[0.625rem] uppercase text-[#F5F5F5]/70 sm:text-[0.6875rem]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 500,
                letterSpacing: '0.3em',
              }}
            >
              {t.countdownSubtitle}
            </p>
            <div className="flex w-full items-start justify-center">
              <CountdownUnit
                value={pad(remaining.days)}
                caption={t.days}
              />
              <CountdownSeparator />
              <CountdownUnit
                value={pad(remaining.hours)}
                caption={t.hours}
              />
              <CountdownSeparator />
              <CountdownUnit
                value={pad(remaining.minutes)}
                caption={t.minutes}
              />
              <CountdownSeparator />
              <CountdownUnit
                value={pad(remaining.seconds)}
                caption={t.seconds}
              />
            </div>
            <p
              className="mt-14 text-[0.5625rem] uppercase text-[#D4AF37] sm:text-[0.625rem]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
              }}
            >
              {longDate}
            </p>
          </div>
        </section>

        {/* ── LOCATIONS ────────────────────────────────────────────────── */}
        {locations.length > 0 ? (
          <Section
            id="hollywood-locations"
            eyebrow={t.guestOfHonour}
            heading={t.locations}
            variant="velvet"
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {locations.map((location, index) => (
                <LocationCard
                  key={`loc-${index}-${location.label}`}
                  location={location}
                  labelViewMap={t.viewMap}
                  labelTime={t.time}
                  labelAddress={t.address}
                  labelCity={t.city}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── PROGRAM ──────────────────────────────────────────────────── */}
        {programDays.length > 0 ? (
          <Section
            id="hollywood-program"
            eyebrow={t.premiere}
            heading={t.program}
            variant="velvet"
          >
            <div className="flex flex-col gap-14">
              {programDays.map((day, dayIndex) => (
                <div key={`day-${dayIndex}`} className="relative">
                  <div className="mb-8 flex items-center justify-center gap-4">
                    <span
                      aria-hidden="true"
                      className="block h-px flex-1 bg-[#D4AF37]/40"
                    />
                    <h3
                      className="text-lg uppercase text-[#D4AF37] sm:text-xl"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        letterSpacing: '0.4em',
                      }}
                    >
                      {day.label ??
                        (day.date
                          ? formatLongDate(day.date, locale)
                          : '')}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="block h-px flex-1 bg-[#D4AF37]/40"
                    />
                  </div>
                  {day.label && day.date ? (
                    <p
                      className="mb-8 text-center text-[0.5625rem] uppercase text-[#F5F5F5]/70 sm:text-[0.625rem]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.3em',
                      }}
                    >
                      {formatLongDate(day.date, locale)}
                    </p>
                  ) : null}
                  <ul className="flex flex-col gap-4">
                    {day.items.map((item, itemIndex) => (
                      <ProgramItem
                        key={`item-${dayIndex}-${itemIndex}`}
                        time={item.time}
                        title={item.title}
                        detail={item.detail}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── RSVP ─────────────────────────────────────────────────────── */}
        {rsvpEnabled ? (
          <section
            id="hollywood-rsvp"
            className="relative w-full px-6 py-24 sm:px-10 md:py-32"
            style={{
              background:
                'linear-gradient(180deg, #0A0A0A 0%, #140505 100%)',
            }}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
              <div
                className="relative w-full border-2 border-[#D4AF37] bg-[#0A0A0A]/80 px-8 py-14 text-center sm:px-14 sm:py-20"
                style={{
                  boxShadow:
                    '0 0 0 1px #0A0A0A inset, 0 0 0 6px #0A0A0A inset, 0 0 0 7px #D4AF37 inset',
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A0A0A] px-3"
                >
                  <Star size={14} />
                </span>

                <p
                  className="mb-6 text-[0.5625rem] uppercase text-[#D4AF37] sm:text-[0.625rem]"
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    letterSpacing: '0.4em',
                  }}
                >
                  {t.rsvpHint}
                </p>
                <h2
                  className="hollywood-shine-text mb-10 text-3xl uppercase leading-tight sm:text-5xl md:text-6xl"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                  }}
                >
                  {t.rsvpTitle}
                </h2>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer className="relative w-full border-t-2 border-[#D4AF37] bg-[#0A0A0A] px-6 py-16 text-center sm:px-10">
          <span
            aria-hidden="true"
            className="absolute left-1/2 -top-3 -translate-x-1/2 bg-[#0A0A0A] px-3"
          >
            <Star size={14} />
          </span>
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
            <span
              aria-hidden="true"
              className="mb-8 inline-flex items-center gap-4"
            >
              <span className="block h-px w-12 bg-[#D4AF37]/60 sm:w-16" />
              <Star size={10} />
              <span className="block h-px w-12 bg-[#D4AF37]/60 sm:w-16" />
            </span>
            <p
              className="hollywood-shine-text text-2xl uppercase sm:text-3xl"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 900,
                letterSpacing: '0.18em',
              }}
            >
              {t.attribution}
            </p>
            <p
              className="mt-6 text-[0.5625rem] uppercase text-[#F5F5F5]/60 sm:text-[0.625rem]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 500,
                letterSpacing: '0.4em',
              }}
            >
              {t.madeWith} {t.attribution}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}