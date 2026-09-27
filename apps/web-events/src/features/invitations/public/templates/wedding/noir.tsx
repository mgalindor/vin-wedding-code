import { useEffect, useMemo, useState } from 'react';

/**
 * NOIR — wedding invitation template.
 *
 * Theme: editorial monochrome, Parisian chic, timeless. The page reads like a
 * Vogue spread: full-bleed high-contrast black & white hero photography, bold
 * display typography with extreme letter-spacing, and alternating black / white
 * panels separated by sharp, deliberate cuts (no gradients between sections, no
 * rounded corners anywhere, radius 0 throughout).
 *
 * Palette (exact):
 *   - Black      #0A0A0A  → primary ink / dark panels
 *   - White      #FFFFFF  → paper / light panels
 *   - Mid gray   #8B8B8B  → section eyebrows, labels, rules, metadata
 *   - Gold       #D4AF37  → RSVP call to action ONLY (the single colour accent
 *                           of the whole page), darkening to #B8941F on hover.
 *
 * Typography:
 *   - Display: "Bodoni Moda" (couple names, headings, countdown numerals) for
 *     its extreme thin/thick stroke contrast.
 *   - Body / UI: "Inter" at weight 600 for a crisp, modern editorial voice.
 *   Both are loaded at runtime via injected Google Fonts <link> elements so the
 *   template stays self-contained and free of build-time dependencies.
 *
 * Motion: minimal by design — a single fade/rise reveal on scroll and CSS
 * transitions only. Everything is disabled under `prefers-reduced-motion`.
 *
 * The component is presentation-only: no business logic, no data fetching, no
 * shared imports. Only React.
 */

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

type Locale = PublicInvitationPageProps['locale'];

interface LabelSet {
  story: string;
  countdown: string;
  countdownPast: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  locations: string;
  program: string;
  dressCode: string;
  giftRegistry: string;
  parents: string;
  accommodation: string;
  rsvp: string;
  rsvpTitle: string;
  rsvpHint: string;
  viewMap: string;
  address: string;
  city: string;
  time: string;
  savedDate: string;
  attribution: string;
  madeWith: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    story: 'Our Story',
    countdown: 'The Countdown',
    countdownPast: 'The Day Has Come',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Locations',
    program: 'Programme',
    dressCode: 'Dress Code',
    giftRegistry: 'Gift Registry',
    parents: 'With Our Parents',
    accommodation: 'Accommodation',
    rsvp: 'Confirm Attendance',
    rsvpTitle: 'Will You Join Us',
    rsvpHint: 'Kindly let us know before the day arrives.',
    viewMap: 'View Map',
    address: 'Address',
    city: 'City',
    time: 'Time',
    savedDate: 'Save the Date',
    attribution: 'Deer Planner',
    madeWith: 'Invitation crafted with',
  },
  es: {
    story: 'Nuestra Historia',
    countdown: 'La Cuenta Atrás',
    countdownPast: 'Ha Llegado el Día',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Ubicaciones',
    program: 'Programa',
    dressCode: 'Código de Vestimenta',
    giftRegistry: 'Mesa de Regalos',
    parents: 'Con Nuestros Padres',
    accommodation: 'Alojamiento',
    rsvp: 'Confirmar Asistencia',
    rsvpTitle: 'Nos Acompañas',
    rsvpHint: 'Agradecemos tu confirmación antes del gran día.',
    viewMap: 'Ver Mapa',
    address: 'Dirección',
    city: 'Ciudad',
    time: 'Hora',
    savedDate: 'Reserva la Fecha',
    attribution: 'Deer Planner',
    madeWith: 'Invitación creada con',
  },
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Inter:wght@400;600;700&display=swap';

const DISPLAY_FONT = "'Bodoni Moda', 'Didot', 'Times New Roman', serif";
const BODY_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useNoirFonts(): void {
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

function formatNumericDate(iso: string, locale: Locale): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '';
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

interface EyebrowProps {
  children: string;
}

/** Uppercase, wide-tracked, mid-gray section eyebrow. */
function Eyebrow({ children }: EyebrowProps): React.ReactElement {
  return (
    <p
      className="text-[0.6875rem] uppercase text-[#8B8B8B] mb-6"
      style={{ fontFamily: BODY_FONT, fontWeight: 600, letterSpacing: '0.3em' }}
    >
      {children}
    </p>
  );
}

interface SectionProps {
  id: string;
  eyebrow: string;
  heading?: string;
  tone: 'dark' | 'light';
  children: React.ReactNode;
}

/**
 * A full-width panel. Panels alternate dark / light and butt against each other
 * with a sharp 1px hairline — the "deliberate cut" of the editorial layout.
 */
function Section({
  id,
  eyebrow,
  heading,
  tone,
  children,
}: SectionProps): React.ReactElement {
  const dark = tone === 'dark';
  return (
    <section
      id={id}
      className={[
        'w-full px-6 py-24 sm:px-10 md:py-32',
        dark
          ? 'bg-[#0A0A0A] text-[#FFFFFF] border-t border-[#FFFFFF]/15'
          : 'bg-[#FFFFFF] text-[#0A0A0A] border-t border-[#0A0A0A]/15',
      ].join(' ')}
    >
      <div className="mx-auto w-full max-w-4xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        {heading !== undefined ? (
          <h2
            className="text-3xl leading-none sm:text-4xl md:text-5xl mb-12"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 500,
              letterSpacing: '0.08em',
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

interface RowProps {
  label: string;
  tone: 'dark' | 'light';
  children: React.ReactNode;
}

/** The 2-column editorial row: gray uppercase label | high-contrast value. */
function Row({ label, tone, children }: RowProps): React.ReactElement {
  const dark = tone === 'dark';
  return (
    <div
      className={[
        'grid grid-cols-1 gap-2 border-t py-5 sm:grid-cols-[10rem_1fr] sm:gap-8',
        dark ? 'border-[#FFFFFF]/15' : 'border-[#0A0A0A]/15',
      ].join(' ')}
    >
      <span
        className="text-[0.6875rem] uppercase text-[#8B8B8B]"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.2em',
          paddingTop: '0.2rem',
        }}
      >
        {label}
      </span>
      <div
        className={dark ? 'text-[#FFFFFF]' : 'text-[#0A0A0A]'}
        style={{ fontFamily: BODY_FONT, fontWeight: 600 }}
      >
        {children}
      </div>
    </div>
  );
}

interface ProseProps {
  body: string;
  tone: 'dark' | 'light';
}

function Prose({ body, tone }: ProseProps): React.ReactElement {
  const dark = tone === 'dark';
  return (
    <div className="max-w-2xl">
      {toParagraphs(body).map((paragraph, index) => (
        <p
          key={index}
          className={[
            'text-base leading-8 sm:text-lg sm:leading-9',
            index > 0 ? 'mt-6' : '',
            dark ? 'text-[#FFFFFF]' : 'text-[#0A0A0A]',
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
    <div className="flex flex-1 flex-col items-center px-3 sm:px-6">
      <span
        className="text-5xl leading-none text-[#FFFFFF] sm:text-6xl md:text-7xl"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 500,
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span
        className="mt-4 text-[0.625rem] uppercase text-[#8B8B8B] sm:text-[0.6875rem]"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.3em',
        }}
      >
        {caption}
      </span>
    </div>
  );
}

/**
 * NOIR wedding invitation template.
 */
export default function NoirTemplate({
  partner1Name,
  partner2Name,
  eventDate,
  heroImageUrl,
  landingTitle,
  landingSubtitle,
  story,
  dressCode,
  giftRegistry,
  parents,
  accommodation,
  locations,
  program,
  rsvpEnabled,
  onRsvpClick,
  locale,
}: PublicInvitationPageProps): React.ReactElement {
  useNoirFonts();

  const t = labels[locale];
  const remaining = useCountdown(eventDate);
  const longDate = formatLongDate(eventDate, locale);
  const numericDate = formatNumericDate(eventDate, locale);
  const monogram = `${initialOf(partner1Name)} ${initialOf(partner2Name)}`.trim();

  const programDays = program.days.filter((day) => day.items.length > 0);
  const dressCodeEntries = dressCode?.entries.filter(
    (entry) => entry.title.trim().length > 0 || entry.body.trim().length > 0,
  );

  return (
    <main
      className="min-h-screen w-full bg-[#0A0A0A] text-[#FFFFFF] antialiased"
      style={{ fontFamily: BODY_FONT }}
    >
      {/* Radius 0 everywhere, motion neutralised for reduced-motion users. */}
      <style>{`
        .noir-root *, .noir-root *::before, .noir-root *::after { border-radius: 0 !important; }
        .noir-reveal { opacity: 0; transform: translateY(18px); animation: noir-rise 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .noir-reveal-delay-1 { animation-delay: 140ms; }
        .noir-reveal-delay-2 { animation-delay: 280ms; }
        .noir-reveal-delay-3 { animation-delay: 420ms; }
        @keyframes noir-rise { to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .noir-root *, .noir-root *::before, .noir-root *::after {
            animation: none !important;
            transition: none !important;
          }
          .noir-reveal { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="noir-root">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <header className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0A0A0A]">
          {heroImageUrl ? (
            <>
              <img
                src={heroImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: 'grayscale(100%) contrast(1.1)' }}
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
                  'linear-gradient(160deg, #0A0A0A 0%, #1C1C1C 48%, #0A0A0A 100%)',
              }}
            />
          )}

          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center sm:px-10">
            {/* Monogram anchored by a single 2px vertical rule. */}
            <div className="noir-reveal mb-14 flex items-stretch gap-5">
              <span
                aria-hidden="true"
                className="w-[2px] self-stretch bg-[#FFFFFF]"
              />
              <span
                className="text-2xl leading-none text-[#FFFFFF] sm:text-3xl"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 400,
                  letterSpacing: '0.35em',
                }}
              >
                {monogram}
              </span>
            </div>

            {landingTitle ? (
              <p
                className="noir-reveal noir-reveal-delay-1 mb-8 text-[0.6875rem] uppercase text-[#8B8B8B]"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.3em',
                }}
              >
                {landingTitle}
              </p>
            ) : null}

            <h1
              className="noir-reveal noir-reveal-delay-1 text-[2.75rem] leading-[1.05] text-[#FFFFFF] sm:text-6xl md:text-7xl lg:text-8xl"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              <span className="block">{partner1Name}</span>
              <span
                className="my-4 block text-2xl text-[#8B8B8B] sm:my-6 sm:text-3xl"
                style={{ letterSpacing: '0.3em', fontWeight: 400 }}
                aria-hidden="true"
              >
                &amp;
              </span>
              <span className="block">{partner2Name}</span>
            </h1>

            <span
              aria-hidden="true"
              className="noir-reveal noir-reveal-delay-2 my-12 block h-[1px] w-24 bg-[#8B8B8B]"
            />

            <p
              className="noir-reveal noir-reveal-delay-2 text-xs uppercase text-[#FFFFFF] sm:text-sm"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.3em',
              }}
            >
              <time dateTime={eventDate}>{longDate}</time>
            </p>

            {landingSubtitle ? (
              <p
                className="noir-reveal noir-reveal-delay-3 mt-8 max-w-xl text-sm leading-7 text-[#8B8B8B] sm:text-base"
                style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
              >
                {landingSubtitle}
              </p>
            ) : (
              <p
                className="noir-reveal noir-reveal-delay-3 mt-8 text-[0.625rem] uppercase text-[#8B8B8B]"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.3em',
                }}
              >
                {t.savedDate}
              </p>
            )}
          </div>
        </header>

        {/* ── STORY ────────────────────────────────────────────────────── */}
        {story && story.body.trim().length > 0 ? (
          <Section id="noir-story" eyebrow={t.story} tone="light">
            <Prose body={story.body} tone="light" />
          </Section>
        ) : null}

        {/* ── COUNTDOWN ────────────────────────────────────────────────── */}
        <section
          id="noir-countdown"
          className="w-full border-t border-[#FFFFFF]/15 bg-[#0A0A0A] px-6 py-24 text-center sm:px-10 md:py-32"
        >
          <div className="mx-auto w-full max-w-4xl">
            <p
              className="mb-14 text-[0.6875rem] uppercase text-[#8B8B8B]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.3em',
              }}
            >
              {remaining.past ? t.countdownPast : t.countdown}
            </p>
            <div className="flex w-full items-start justify-center divide-x divide-[#FFFFFF]/20">
              <CountdownUnit value={pad(remaining.days)} caption={t.days} />
              <CountdownUnit value={pad(remaining.hours)} caption={t.hours} />
              <CountdownUnit
                value={pad(remaining.minutes)}
                caption={t.minutes}
              />
              <CountdownUnit
                value={pad(remaining.seconds)}
                caption={t.seconds}
              />
            </div>
            <p
              className="mt-14 text-[0.625rem] uppercase text-[#8B8B8B]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.3em',
              }}
            >
              {numericDate}
            </p>
          </div>
        </section>

        {/* ── LOCATIONS ────────────────────────────────────────────────── */}
        {locations.length > 0 ? (
          <Section id="noir-locations" eyebrow={t.locations} tone="light">
            <div>
              {locations.map((location, index) => (
                <div key={`${location.label}-${index}`} className="mb-12">
                  <Row label={location.label} tone="light">
                    <p
                      className="text-xl leading-tight sm:text-2xl"
                      style={{
                        fontFamily: DISPLAY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {location.name}
                    </p>
                    {location.address ? (
                      <p className="mt-3 text-sm leading-6 text-[#0A0A0A]">
                        {location.address}
                      </p>
                    ) : null}
                    {location.city ? (
                      <p className="mt-1 text-sm uppercase text-[#8B8B8B]" style={{ letterSpacing: '0.2em' }}>
                        {location.city}
                      </p>
                    ) : null}
                    {location.time ? (
                      <p
                        className="mt-3 text-xs uppercase text-[#0A0A0A]"
                        style={{ letterSpacing: '0.2em' }}
                      >
                        {t.time} · {location.time}
                      </p>
                    ) : null}
                    {location.mapsLink ? (
                      <a
                        href={location.mapsLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-5 inline-flex items-center gap-2 border-b border-[#0A0A0A] pb-1 text-[0.6875rem] uppercase text-[#0A0A0A] transition-opacity duration-300 hover:opacity-50"
                        style={{ letterSpacing: '0.2em' }}
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
                  </Row>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── PROGRAM ──────────────────────────────────────────────────── */}
        {programDays.length > 0 ? (
          <Section id="noir-program" eyebrow={t.program} tone="dark">
            <div>
              {programDays.map((day, dayIndex) => (
                <div key={`day-${dayIndex}`} className="mb-16 last:mb-0">
                  {day.label || day.date ? (
                    <h3
                      className="mb-8 text-2xl leading-tight text-[#FFFFFF] sm:text-3xl"
                      style={{
                        fontFamily: DISPLAY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {day.label ??
                        (day.date ? formatLongDate(day.date, locale) : '')}
                    </h3>
                  ) : null}
                  {day.label && day.date ? (
                    <p
                      className="-mt-6 mb-8 text-[0.625rem] uppercase text-[#8B8B8B]"
                      style={{ letterSpacing: '0.3em', fontWeight: 600 }}
                    >
                      {formatLongDate(day.date, locale)}
                    </p>
                  ) : null}
                  {day.items.map((item, itemIndex) => (
                    <Row
                      key={`item-${dayIndex}-${itemIndex}`}
                      label={item.time}
                      tone="dark"
                    >
                      <p
                        className="text-lg leading-tight sm:text-xl"
                        style={{
                          fontFamily: DISPLAY_FONT,
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {item.title}
                      </p>
                      {item.detail ? (
                        <p className="mt-2 text-sm leading-6 text-[#8B8B8B]">
                          {item.detail}
                        </p>
                      ) : null}
                    </Row>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── DRESS CODE ───────────────────────────────────────────────── */}
        {dressCodeEntries && dressCodeEntries.length > 0 ? (
          <Section id="noir-dress-code" eyebrow={t.dressCode} tone="light">
            <div>
              {dressCodeEntries.map((entry, index) => (
                <Row
                  key={`dress-${index}`}
                  label={entry.title}
                  tone="light"
                >
                  <p className="text-base leading-7 text-[#0A0A0A]">
                    {entry.body}
                  </p>
                </Row>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── GIFT REGISTRY ────────────────────────────────────────────── */}
        {giftRegistry && giftRegistry.body.trim().length > 0 ? (
          <Section id="noir-gift-registry" eyebrow={t.giftRegistry} tone="dark">
            <Prose body={giftRegistry.body} tone="dark" />
          </Section>
        ) : null}

        {/* ── PARENTS ──────────────────────────────────────────────────── */}
        {parents && parents.body.trim().length > 0 ? (
          <Section id="noir-parents" eyebrow={t.parents} tone="light">
            <Prose body={parents.body} tone="light" />
          </Section>
        ) : null}

        {/* ── ACCOMMODATION ────────────────────────────────────────────── */}
        {accommodation && accommodation.body.trim().length > 0 ? (
          <Section
            id="noir-accommodation"
            eyebrow={t.accommodation}
            tone="dark"
          >
            <Prose body={accommodation.body} tone="dark" />
          </Section>
        ) : null}

        {/* ── RSVP ─────────────────────────────────────────────────────── */}
        {rsvpEnabled ? (
          <section
            id="noir-rsvp"
            className="w-full border-t border-[#0A0A0A]/15 bg-[#FFFFFF] px-6 py-24 text-center sm:px-10 md:py-32"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
              <p
                className="mb-8 text-[0.6875rem] uppercase text-[#8B8B8B]"
                style={{ fontWeight: 600, letterSpacing: '0.3em' }}
              >
                {t.rsvpHint}
              </p>
              <h2
                className="mb-12 text-4xl uppercase leading-none text-[#0A0A0A] sm:text-5xl md:text-6xl"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                }}
              >
                {t.rsvpTitle}
              </h2>
            </div>
          </section>
        ) : null}

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer className="w-full border-t border-[#FFFFFF]/15 bg-[#0A0A0A] px-6 py-16 text-center sm:px-10">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
            <span
              className="text-lg text-[#FFFFFF]"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 400,
                letterSpacing: '0.35em',
              }}
            >
              {monogram}
            </span>
            <span
              aria-hidden="true"
              className="my-8 block h-[1px] w-16 bg-[#8B8B8B]"
            />
            <p
              className="text-[0.625rem] uppercase text-[#8B8B8B]"
              style={{ fontWeight: 600, letterSpacing: '0.3em' }}
            >
              {t.madeWith} {t.attribution}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
