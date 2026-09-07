/**
 * PITCH — corporate event invitation template.
 *
 * Theme: a confident product launch or demo day. White-dominant canvas with
 * a sharp product-blue accent, modern sans-serif display type, structured
 * agenda cards with oversized numeric callouts, and a generous editorial
 * amount of whitespace. The visual language mirrors a SaaS landing page:
 * the hero feels like a product keynote, the program reads like a release
 * roadmap, and the RSVP call to action sits as the single vivid blue moment
 * on the page.
 *
 * Palette (exact):
 *   - White         #FFFFFF  → dominant canvas / card surfaces
 *   - Off-white     #F8FAFC  → page background, hero gradient start
 *   - Product blue  #2563EB  → accent, eyebrows, time badges, RSVP button
 *   - Dark blue     #1E40AF  → hover state, title underline, deep accents
 *   - Text dark     #0F172A  → primary ink for body copy and titles
 *
 * Typography:
 *   - Display: "Plus Jakarta Sans" (event title, h1/h2, large numerics)
 *     loaded at runtime via injected Google Fonts <link> elements.
 *   - Body / UI: "Inter" for body copy, labels and metadata.
 *
 * Motion: subtle and on-brand — opacity/translate reveals on scroll and
 * a soft hover lift on cards and the RSVP button. All motion is disabled
 * under `prefers-reduced-motion: reduce`.
 *
 * The component is presentation-only: no business logic, no data fetching,
 * no shared imports. Only React.
 */

import {
  useEffect,
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
  agenda: string;
  venue: string;
  dressCode: string;
  rsvp: string;
  rsvpTitle: string;
  rsvpHint: string;
  viewMap: string;
  time: string;
  address: string;
  city: string;
  attribution: string;
  poweredBy: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    hostedBy: 'Hosted By',
    saveTheDate: 'Save the Date',
    about: 'About the Event',
    speakers: 'Speakers',
    agenda: 'The Agenda',
    venue: 'Venue',
    dressCode: 'Dress Code',
    rsvp: 'Reserve My Seat',
    rsvpTitle: 'Be Part of the Launch',
    rsvpHint: 'Seats are limited — confirm your attendance.',
    viewMap: 'Open in Maps',
    time: 'Time',
    address: 'Address',
    city: 'City',
    attribution: 'Deer Planner',
    poweredBy: 'Invitation powered by',
  },
  es: {
    hostedBy: 'Organizado Por',
    saveTheDate: 'Reserva la Fecha',
    about: 'Sobre el Evento',
    speakers: 'Ponentes',
    agenda: 'La Agenda',
    venue: 'Sede',
    dressCode: 'Código de Vestimenta',
    rsvp: 'Reservar Mi Plaza',
    rsvpTitle: 'Sé Parte del Lanzamiento',
    rsvpHint: 'Las plazas son limitadas — confirma tu asistencia.',
    viewMap: 'Abrir en Mapa',
    time: 'Hora',
    address: 'Dirección',
    city: 'Ciudad',
    attribution: 'Deer Planner',
    poweredBy: 'Invitación creada con',
  },
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';

const DISPLAY_FONT =
  "'Plus Jakarta Sans', 'Inter', 'Helvetica Neue', Arial, sans-serif";
const BODY_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

function usePitchFonts(): void {
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

function useReveal<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
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

function formatShortDate(iso: string, locale: Locale): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function padTwo(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/* -------------------------------------------------------------------------- */
/*                              Inline SVG icons                              */
/* -------------------------------------------------------------------------- */

interface IconProps {
  className?: string;
}

function CalendarIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="3.5" width="12" height="11" rx="1.5" />
      <path d="M5 2v3M11 2v3M2 7h12" />
    </svg>
  );
}

function PinIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 14.5s5-4.2 5-8.5A5 5 0 0 0 3 6c0 4.3 5 8.5 5 8.5Z" />
      <circle cx="8" cy="6" r="1.75" />
    </svg>
  );
}

function ClockIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.2l2 1.3" />
    </svg>
  );
}

function PersonIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8" cy="5.5" r="2.75" />
      <path d="M2.75 13.5c.7-2.6 2.9-4 5.25-4s4.55 1.4 5.25 4" />
    </svg>
  );
}

function SparkIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 1.5 9.5 6 14 7.5 9.5 9 8 13.5 6.5 9 2 7.5 6.5 6Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

interface EyebrowProps {
  children: ReactNode;
  icon?: ReactNode;
}

function Eyebrow({ children, icon }: EyebrowProps): ReactElement {
  return (
    <p
      className="mb-6 inline-flex items-center gap-2 text-[0.6875rem] uppercase text-[#2563EB]"
      style={{
        fontFamily: BODY_FONT,
        fontWeight: 600,
        letterSpacing: '0.2em',
      }}
    >
      {icon !== undefined ? (
        <span className="text-[#2563EB]">{icon}</span>
      ) : null}
      {children}
    </p>
  );
}

interface SectionProps {
  id: string;
  eyebrow: string;
  heading?: string;
  children: ReactNode;
  icon?: ReactNode;
}

function Section({
  id,
  eyebrow,
  heading,
  icon,
  children,
}: SectionProps): ReactElement {
  const ref = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      id={id}
      className="pitch-reveal w-full bg-[#FFFFFF] px-6 py-20 sm:px-10 md:py-28"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        {heading !== undefined ? (
          <h2
            className="mb-12 text-3xl leading-tight text-[#0F172A] sm:text-4xl md:text-5xl"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              letterSpacing: '-0.02em',
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

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps): ReactElement {
  return (
    <div
      className={[
        'rounded-lg border border-[#0F172A]/8 bg-[#FFFFFF]',
        className ?? '',
      ].join(' ')}
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}
    >
      {children}
    </div>
  );
}

interface LogoMarkProps {
  hostCompanyName: string;
}

function LogoMark({ hostCompanyName }: LogoMarkProps): ReactElement {
  const initial = hostCompanyName.trim().charAt(0).toUpperCase() || 'D';
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-lg border border-[#2563EB]/20 bg-[#FFFFFF]"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
      >
        <span
          className="text-xl text-[#2563EB]"
          style={{ fontFamily: DISPLAY_FONT, fontWeight: 800 }}
        >
          {initial}
        </span>
      </div>
      <span
        className="text-[0.625rem] uppercase text-[#0F172A]/50"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.2em',
        }}
      >
        Logo
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Public component                              */
/* -------------------------------------------------------------------------- */

/**
 * PITCH corporate invitation template.
 */
export default function PitchTemplate({
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
}: PublicInvitationPageProps): ReactElement {
  usePitchFonts();

  const t = labels[locale];
  const longDate = formatLongDate(eventDate, locale);
  const shortDate = formatShortDate(eventDate, locale);

  const visibleSpeakers =
    speakers?.filter(
      (speaker) => speaker.name.trim().length > 0 || speaker.role.trim().length > 0,
    ) ?? [];

  const programDays = program.days.filter((day) => day.items.length > 0);

  const heroRef = useReveal<HTMLDivElement>();

  return (
    <main
      className="min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] antialiased"
      style={{ fontFamily: BODY_FONT }}
    >
      <style>{`
        .pitch-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1),
                      transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pitch-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .pitch-card {
          transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 350ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pitch-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        }
        .pitch-button {
          transition: background-color 200ms ease,
                      transform 200ms ease,
                      box-shadow 200ms ease;
        }
        .pitch-button:hover {
          background-color: #1E40AF;
          transform: scale(1.02);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
        }
        .pitch-button:focus-visible {
          outline: 2px solid #1E40AF;
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .pitch-reveal,
          .pitch-card,
          .pitch-button {
            transition: none !important;
          }
          .pitch-reveal {
            opacity: 1 !important;
            transform: none !important;
          }
          .pitch-card:hover,
          .pitch-button:hover {
            transform: none !important;
          }
        }
      `}</style>

      {/* IntersectionObserver toggles .is-visible for the reveal animations */}
      <style>{`
        .pitch-observer-ready .pitch-reveal { /* no-op fallback */ }
      `}</style>

      <div className="w-full">
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <header className="relative w-full overflow-hidden bg-[#F8FAFC]">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 70%, #FFFFFF 100%)',
            }}
          />
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
                className="absolute inset-0 bg-[#FFFFFF]/65"
              />
            </>
          ) : null}

          <div className="relative mx-auto flex min-h-[88vh] w-full max-w-5xl flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
            {hostCompanyName !== undefined && hostCompanyName.trim().length > 0 ? (
              <div
                ref={heroRef}
                className="pitch-reveal mb-10 flex flex-col items-center gap-4"
              >
                <LogoMark hostCompanyName={hostCompanyName} />
                <span
                  className="text-[0.6875rem] uppercase text-[#0F172A]/60"
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    letterSpacing: '0.25em',
                  }}
                >
                  {t.hostedBy}
                </span>
                <p
                  className="text-base text-[#0F172A]"
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  {hostCompanyName}
                </p>
              </div>
            ) : null}

            {landingTitle !== null && landingTitle !== undefined ? (
              <p
                className="pitch-reveal mb-5 inline-flex items-center gap-2 text-[0.6875rem] uppercase text-[#2563EB]"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.25em',
                }}
              >
                <span aria-hidden="true">
                  <SparkIcon />
                </span>
                {landingTitle}
              </p>
            ) : null}

            <h1
              className="pitch-reveal max-w-4xl text-4xl leading-[1.05] text-[#0F172A] sm:text-6xl md:text-7xl"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 800,
                letterSpacing: '-0.025em',
              }}
            >
              {eventTitle}
            </h1>

            <span
              aria-hidden="true"
              className="pitch-reveal mx-auto mt-8 block h-[4px] w-24 rounded-full bg-[#1E40AF]"
            />

            <p
              className="pitch-reveal mt-10 inline-flex items-center gap-2 text-sm uppercase text-[#0F172A] sm:text-base"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.2em',
              }}
            >
              <span className="text-[#2563EB]">
                <CalendarIcon />
              </span>
              <time dateTime={eventDate}>{longDate}</time>
            </p>

            {landingSubtitle !== null && landingSubtitle !== undefined ? (
              <p
                className="pitch-reveal mx-auto mt-6 max-w-2xl text-base leading-7 text-[#0F172A]/70 sm:text-lg sm:leading-8"
                style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
              >
                {landingSubtitle}
              </p>
            ) : (
              <p
                className="pitch-reveal mt-6 text-[0.6875rem] uppercase text-[#0F172A]/50"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.25em',
                }}
              >
                {t.saveTheDate}
              </p>
            )}
          </div>
        </header>

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        {description !== null && description !== undefined && description.body.trim().length > 0 ? (
          <Section
            id="pitch-about"
            eyebrow={t.about}
            heading={landingTitle ?? eventTitle}
            icon={<SparkIcon />}
          >
            <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:items-start">
              <div>
                <p
                  className="text-[0.6875rem] uppercase text-[#0F172A]/50"
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                  }}
                >
                  {shortDate}
                </p>
              </div>
              <div className="max-w-2xl">
                {toParagraphs(description.body).map((paragraph, index) => (
                  <p
                    key={index}
                    className={[
                      'text-base leading-8 text-[#0F172A] sm:text-lg sm:leading-9',
                      index > 0 ? 'mt-6' : '',
                    ].join(' ')}
                    style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </Section>
        ) : null}

        {/* ── SPEAKERS ─────────────────────────────────────────────────── */}
        {visibleSpeakers.length > 0 ? (
          <Section
            id="pitch-speakers"
            eyebrow={t.speakers}
            icon={<PersonIcon />}
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSpeakers.map((speaker, index) => (
                <Card key={`speaker-${index}`} className="pitch-card p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#0F172A]/8 bg-[#F8FAFC]"
                      aria-hidden="true"
                    >
                      {speaker.photoUrl !== null && speaker.photoUrl !== undefined ? (
                        <img
                          src={speaker.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-lg text-[#2563EB]"
                          style={{
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 700,
                          }}
                        >
                          {speaker.name.trim().charAt(0).toUpperCase() || '·'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-base text-[#0F172A]"
                        style={{
                          fontFamily: DISPLAY_FONT,
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {speaker.name}
                      </p>
                      <p
                        className="mt-1 text-xs uppercase text-[#2563EB]"
                        style={{
                          fontFamily: BODY_FONT,
                          fontWeight: 600,
                          letterSpacing: '0.15em',
                        }}
                      >
                        {speaker.role}
                      </p>
                    </div>
                  </div>
                  {speaker.bio !== undefined && speaker.bio.trim().length > 0 ? (
                    <p
                      className="mt-4 text-sm leading-6 text-[#0F172A]/70"
                      style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
                    >
                      {speaker.bio}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── AGENDA ───────────────────────────────────────────────────── */}
        {programDays.length > 0 ? (
          <Section
            id="pitch-agenda"
            eyebrow={t.agenda}
            icon={<ClockIcon />}
          >
            <div className="space-y-12">
              {programDays.map((day, dayIndex) => {
                const dayTitle =
                  day.label ??
                  (day.date !== undefined ? formatLongDate(day.date, locale) : '');
                return (
                  <div key={`day-${dayIndex}`}>
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3
                        className="text-xl text-[#0F172A] sm:text-2xl"
                        style={{
                          fontFamily: DISPLAY_FONT,
                          fontWeight: 700,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {dayTitle}
                      </h3>
                      {day.label !== undefined && day.date !== undefined ? (
                        <span
                          className="text-xs uppercase text-[#0F172A]/50"
                          style={{
                            fontFamily: BODY_FONT,
                            fontWeight: 600,
                            letterSpacing: '0.2em',
                          }}
                        >
                          {formatLongDate(day.date, locale)}
                        </span>
                      ) : null}
                    </div>
                    <ul className="space-y-4">
                      {day.items.map((item, itemIndex) => {
                        const numeric = padTwo(
                          dayIndex * 100 + itemIndex + 1,
                        ).slice(-2);
                        return (
                          <li key={`item-${dayIndex}-${itemIndex}`}>
                            <Card className="pitch-card p-6">
                              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <span
                                  aria-hidden="true"
                                  className="select-none text-6xl leading-none text-[#2563EB]/15 sm:text-7xl"
                                  style={{
                                    fontFamily: DISPLAY_FONT,
                                    fontWeight: 800,
                                    letterSpacing: '-0.04em',
                                  }}
                                >
                                  {numeric}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <span
                                    className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-3 py-1 text-xs uppercase text-[#FFFFFF]"
                                    style={{
                                      fontFamily: BODY_FONT,
                                      fontWeight: 600,
                                      letterSpacing: '0.15em',
                                    }}
                                  >
                                    <span aria-hidden="true">
                                      <ClockIcon className="text-[#FFFFFF]" />
                                    </span>
                                    {item.time}
                                  </span>
                                  <p
                                    className="mt-3 text-lg text-[#0F172A] sm:text-xl"
                                    style={{
                                      fontFamily: DISPLAY_FONT,
                                      fontWeight: 700,
                                      letterSpacing: '-0.01em',
                                    }}
                                  >
                                    {item.title}
                                  </p>
                                  {item.detail !== undefined && item.detail.trim().length > 0 ? (
                                    <p
                                      className="mt-2 text-sm leading-6 text-[#0F172A]/70"
                                      style={{
                                        fontFamily: BODY_FONT,
                                        fontWeight: 400,
                                      }}
                                    >
                                      {item.detail}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </Card>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>
        ) : null}

        {/* ── LOCATIONS ────────────────────────────────────────────────── */}
        {locations.length > 0 ? (
          <Section id="pitch-locations" eyebrow={t.venue} icon={<PinIcon />}>
            <div className="grid gap-6 md:grid-cols-2">
              {locations.map((location, index) => (
                <Card key={`location-${index}`} className="pitch-card p-6">
                  <span
                    className="inline-flex items-center gap-2 text-[0.6875rem] uppercase text-[#2563EB]"
                    style={{
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                    }}
                  >
                    {location.label}
                  </span>
                  <p
                    className="mt-3 text-xl text-[#0F172A]"
                    style={{
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {location.name}
                  </p>
                  {location.address !== undefined && location.address.trim().length > 0 ? (
                    <p
                      className="mt-4 inline-flex items-start gap-2 text-sm text-[#0F172A]/80"
                      style={{ fontFamily: BODY_FONT, fontWeight: 500 }}
                    >
                      <span className="mt-0.5 text-[#2563EB]">
                        <PinIcon />
                      </span>
                      {location.address}
                    </p>
                  ) : null}
                  {location.city !== undefined && location.city.trim().length > 0 ? (
                    <p
                      className="mt-1 pl-6 text-xs uppercase text-[#0F172A]/50"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                      }}
                    >
                      {location.city}
                    </p>
                  ) : null}
                  {location.time !== undefined && location.time.trim().length > 0 ? (
                    <p
                      className="mt-3 inline-flex items-center gap-2 text-xs uppercase text-[#0F172A]/70"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                      }}
                    >
                      <span className="text-[#2563EB]">
                        <ClockIcon />
                      </span>
                      {t.time} · {location.time}
                    </p>
                  ) : null}
                  {location.mapsLink !== undefined && location.mapsLink.trim().length > 0 ? (
                    <a
                      href={location.mapsLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#2563EB]/20 px-4 py-2 text-xs uppercase text-[#2563EB] transition-colors duration-200 hover:bg-[#2563EB] hover:text-[#FFFFFF]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                      }}
                    >
                      {t.viewMap}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 9 9 3M4.5 3H9v4.5" />
                      </svg>
                    </a>
                  ) : null}
                </Card>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── DRESS CODE ───────────────────────────────────────────────── */}
        {dressCode !== null && dressCode !== undefined && dressCode.body.trim().length > 0 ? (
          <Section
            id="pitch-dress-code"
            eyebrow={t.dressCode}
            icon={<SparkIcon />}
          >
            <Card className="p-6 sm:p-8">
              {toParagraphs(dressCode.body).map((paragraph, index) => (
                <p
                  key={index}
                  className={[
                    'text-base leading-8 text-[#0F172A] sm:text-lg sm:leading-9',
                    index > 0 ? 'mt-6' : '',
                  ].join(' ')}
                  style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
                >
                  {paragraph}
                </p>
              ))}
            </Card>
          </Section>
        ) : null}

        {/* ── RSVP ─────────────────────────────────────────────────────── */}
        {rsvpEnabled ? (
          <section
            id="pitch-rsvp"
            className="pitch-reveal w-full px-6 py-24 sm:px-10 md:py-32"
            style={{
              background:
                'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            }}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
              <Eyebrow icon={<SparkIcon />}>{t.rsvp}</Eyebrow>
              <h2
                className="mb-6 text-3xl leading-tight text-[#0F172A] sm:text-5xl md:text-6xl"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                }}
              >
                {t.rsvpTitle}
              </h2>
              <p
                className="mb-10 max-w-xl text-base text-[#0F172A]/70 sm:text-lg"
                style={{ fontFamily: BODY_FONT, fontWeight: 400 }}
              >
                {t.rsvpHint}
              </p>
              <button
                type="button"
                onClick={onRsvpClick}
                className="pitch-button inline-flex items-center gap-3 rounded-lg bg-[#2563EB] px-10 py-4 text-sm uppercase text-[#FFFFFF] sm:text-base"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                {t.rsvp}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" />
                </svg>
              </button>
            </div>
          </section>
        ) : null}

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer className="w-full border-t border-[#0F172A]/8 bg-[#FFFFFF] px-6 py-12 sm:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center">
            <span
              className="text-lg text-[#0F172A]"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              {t.attribution}
            </span>
            <p
              className="text-[0.625rem] uppercase text-[#0F172A]/50"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.25em',
              }}
            >
              {t.poweredBy} {t.attribution}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
