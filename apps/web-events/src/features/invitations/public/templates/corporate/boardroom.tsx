import { useEffect } from 'react';

/**
 * BOARDROOM — corporate invitation template.
 *
 * Theme: a traditional, conservative corporate event (annual general meeting,
 * shareholder gathering, financial or legal convocation). The page reads like
 * a printed annual report — structured panels on light-gray paper, a
 * deliberate 2px navy rule beneath every section heading, sober gold used
 * sparingly as a single punctuation accent, and Cormorant Garamond serif
 * paired with Inter for UI. Almost static motion: only subtle hover
 * transitions, fully suppressed under `prefers-reduced-motion`.
 *
 * Palette (exact):
 *   - Navy        #0B2545  → primary ink, panel rules, RSVP background
 *   - White       #FFFFFF  → card ground, hero text, RSVP text
 *   - Light gray  #F2F4F7  → page background, panel ground
 *   - Sober gold  #C9A961  → host company underline, emblem accents
 *   - Text dark   #1B1B1F  → body copy, headings on light ground
 *
 * Typography:
 *   - Display: "Cormorant Garamond" — event title, section headings,
 *     speaker names.
 *   - Body / UI: "Inter" — descriptions, row labels, metadata.
 * Both are loaded at runtime via injected Google Fonts <link> elements so
 * the template stays self-contained and free of build-time dependencies.
 *
 * Aesthetic accents:
 *   - 2px navy underline below every section heading — the deliberate
 *     "boardroom rule".
 *   - Host company emblem rendered in grayscale by default with a sober-gold
 *     ring, color on hover.
 *   - Speaker cards: square photo with a thin navy border, name in serif,
 *     role in uppercase tracked sans-serif below.
 *   - Row labels uppercase, 0.3em letter-spacing, in 60%-alpha text dark.
 *   - Hero: navy-to-charcoal gradient fallback, or hero photo with a navy
 *     scrim; event title in Cormorant Garamond; host company name in small
 *     caps with a sober-gold underline; logo placeholder centered above.
 *   - RSVP button: navy background, white text, uppercase letter-spacing;
 *     hover darkens to #08182E.
 *   - Locations / Programme rendered as a 2-column grid (label | value) on
 *     light-gray panels with navy text.
 *
 * Motion: deliberately near-static — only CSS transitions on hover, fully
 * suppressed under `prefers-reduced-motion`.
 *
 * The component is presentation-only: no business logic, no data fetching,
 * no shared imports. Only React.
 */

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
  formalInvitation: string;
  description: string;
  speakers: string;
  program: string;
  locations: string;
  dressCode: string;
  rsvp: string;
  rsvpTitle: string;
  rsvpHint: string;
  viewMap: string;
  address: string;
  city: string;
  time: string;
  hostedBy: string;
  attribution: string;
  madeWith: string;
}

const labels: Record<Locale, LabelSet> = {
  en: {
    formalInvitation: 'Formal Invitation',
    description: 'Notice of Meeting',
    speakers: 'Featured Speakers',
    program: 'Agenda',
    locations: 'Venues',
    dressCode: 'Dress Code',
    rsvp: 'Confirm Attendance',
    rsvpTitle: 'Kindly Confirm',
    rsvpHint:
      'Please confirm your attendance before the appointed day.',
    viewMap: 'View on Map',
    address: 'Address',
    city: 'City',
    time: 'Time',
    hostedBy: 'Hosted by',
    attribution: 'Deer Planner',
    madeWith: 'Invitation issued through',
  },
  es: {
    formalInvitation: 'Invitación Formal',
    description: 'Convocatoria',
    speakers: 'Oradores Destacados',
    program: 'Agenda',
    locations: 'Sedes',
    dressCode: 'Código de Vestimenta',
    rsvp: 'Confirmar Asistencia',
    rsvpTitle: 'Agradecemos su Confirmación',
    rsvpHint:
      'Le solicitamos confirmar su asistencia antes de la fecha señalada.',
    viewMap: 'Ver en Mapa',
    address: 'Dirección',
    city: 'Ciudad',
    time: 'Hora',
    hostedBy: 'Convocado por',
    attribution: 'Deer Planner',
    madeWith: 'Invitación emitida por',
  },
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap';

const DISPLAY_FONT =
  "'Cormorant Garamond', 'Garamond', 'Times New Roman', Georgia, serif";
const BODY_FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif";

/** Injects the Google Fonts <link> tags once, without touching any global CSS. */
function useBoardroomFonts(): void {
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

function initialsOf(name: string): string {
  const cleaned = name.replace(/[,&\.]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function toParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

/** Light-gray panel: serif h2 + 2px navy rule beneath, then content. */
function Section({
  id,
  title,
  children,
}: SectionProps): React.ReactElement {
  return (
    <section
      id={id}
      className="w-full bg-[#F2F4F7] px-6 py-20 text-[#1B1B1F] sm:px-10 md:py-28"
    >
      <div className="mx-auto w-full max-w-5xl">
        <h2
          className="mb-4 text-3xl leading-tight text-[#1B1B1F] sm:text-4xl md:text-5xl"
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </h2>
        <span
          aria-hidden="true"
          className="mb-12 block h-[2px] w-16 bg-[#0B2545]"
        />
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
}

/** 2-column grid row: uppercase tracked label | value in navy text. */
function Row({ label, children }: RowProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-[#0B2545]/15 py-5 sm:grid-cols-[10rem_1fr] sm:gap-8">
      <span
        className="text-[0.6875rem] uppercase text-[#1B1B1F]/60"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.3em',
          paddingTop: '0.2rem',
        }}
      >
        {label}
      </span>
      <div
        className="text-[#1B1B1F]"
        style={{ fontFamily: BODY_FONT, fontWeight: 500 }}
      >
        {children}
      </div>
    </div>
  );
}

interface SpeakerCardProps {
  speaker: {
    name: string;
    role: string;
    bio?: string;
    photoUrl?: string | null;
  };
}

/** Speaker portrait card: square photo, thin navy border, name in serif. */
function SpeakerCard({
  speaker,
}: SpeakerCardProps): React.ReactElement {
  const initials = initialsOf(speaker.name);
  return (
    <article className="flex flex-col items-center text-center">
      <div className="boardroom-portrait aspect-square w-full max-w-[220px] overflow-hidden border border-[#0B2545] bg-[#FFFFFF]">
        {speaker.photoUrl ? (
          <img
            src={speaker.photoUrl}
            alt={speaker.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0B2545]">
            <span
              className="text-5xl text-[#FFFFFF]"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 500,
                letterSpacing: '0.08em',
              }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>
      <h3
        className="mt-6 text-2xl leading-tight text-[#1B1B1F]"
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 500,
        }}
      >
        {speaker.name}
      </h3>
      <p
        className="mt-2 text-[0.6875rem] uppercase text-[#1B1B1F]/60"
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 600,
          letterSpacing: '0.3em',
        }}
      >
        {speaker.role}
      </p>
      {speaker.bio ? (
        <p
          className="mt-4 max-w-xs text-sm leading-6 text-[#1B1B1F]/80"
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 400,
          }}
        >
          {speaker.bio}
        </p>
      ) : null}
    </article>
  );
}

interface HostEmblemProps {
  companyName?: string;
}

/**
 * The "company logo placeholder": a sober circular mark with a sober-gold
 * ring and the host company's initials, rendered in grayscale by default
 * with color on hover. When the company name is missing, a faint empty
 * crest is shown in its place.
 */
function HostEmblem({ companyName }: HostEmblemProps): React.ReactElement {
  const initials = companyName ? initialsOf(companyName) : '';
  const empty = !companyName;
  return (
    <div
      className="boardroom-emblem mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#C9A961] bg-[#FFFFFF]/5 sm:h-28 sm:w-28"
      aria-hidden="true"
    >
      <div className="flex h-[88%] w-[88%] items-center justify-center rounded-full border border-[#FFFFFF]/30">
        {empty ? (
          <span className="block h-px w-8 bg-[#C9A961]/70" />
        ) : (
          <span
            className="text-2xl text-[#FFFFFF] sm:text-3xl"
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 500,
              letterSpacing: '0.1em',
            }}
          >
            {initials}
          </span>
        )}
      </div>
    </div>
  );
}

interface MapPinProps {
  className?: string;
}

function MapPin({ className }: MapPinProps): React.ReactElement {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6 0.75c-2 0-3.6 1.6-3.6 3.6C2.4 7.2 6 11.25 6 11.25S9.6 7.2 9.6 4.35C9.6 2.35 8 0.75 6 0.75Zm0 5.1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** BOARDROOM corporate invitation template. */
export default function BoardroomTemplate({
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
}: PublicInvitationPageProps): React.ReactElement {
  useBoardroomFonts();

  const t = labels[locale];
  const longDate = formatLongDate(eventDate, locale);
  const numericDate = formatNumericDate(eventDate, locale);

  const descriptionBody = description?.body ?? '';
  const hasDescription = descriptionBody.trim().length > 0;
  const descriptionParagraphs = toParagraphs(descriptionBody);

  const dressCodeBody = dressCode?.body ?? '';
  const hasDressCode = dressCodeBody.trim().length > 0;
  const dressCodeParagraphs = toParagraphs(dressCodeBody);

  const speakerList = (speakers ?? []).filter(
    (s) => s.name.trim().length > 0,
  );
  const hasLocations = locations.length > 0;
  const programDays = program.days.filter((d) => d.items.length > 0);
  const hasProgram = programDays.length > 0;

  return (
    <main
      className="min-h-screen w-full bg-[#F2F4F7] text-[#1B1B1F] antialiased"
      style={{ fontFamily: BODY_FONT }}
    >
      <style>{`
        .boardroom-root *,
        .boardroom-root *::before,
        .boardroom-root *::after { box-sizing: border-box; }
        .boardroom-emblem {
          filter: grayscale(100%) opacity(0.9);
          transition: filter 500ms ease;
        }
        .boardroom-emblem:hover { filter: grayscale(0%) opacity(1); }
        .boardroom-portrait {
          filter: grayscale(100%) opacity(0.92);
          transition: filter 500ms ease;
        }
        .boardroom-portrait:hover { filter: grayscale(0%) opacity(1); }
        .boardroom-cta { transition: background-color 300ms ease; }
        .boardroom-cta:hover { background-color: #08182E; }
        @media (prefers-reduced-motion: reduce) {
          .boardroom-root *, .boardroom-root *::before, .boardroom-root *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="boardroom-root">
        {/* ── HERO ────────────────────────────────────────────────────── */}
        <header className="relative flex min-h-[88vh] w-full items-center justify-center overflow-hidden bg-[#0B2545] text-[#FFFFFF]">
          {heroImageUrl ? (
            <>
              <img
                src={heroImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: 'saturate(0.85) contrast(1.05)' }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#0B2545]/65"
              />
            </>
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, #0B2545 0%, #112E55 45%, #1B1B1F 100%)',
              }}
            />
          )}

          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-0 h-px bg-[#C9A961]/40"
          />
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 bottom-0 h-px bg-[#C9A961]/40"
          />

          <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center sm:px-10">
            <p
              className="mb-10 text-[0.6875rem] uppercase text-[#C9A961]"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.4em',
              }}
            >
              {landingTitle ?? t.formalInvitation}
            </p>

            <HostEmblem companyName={hostCompanyName} />

            <h1
              className="mt-10 text-4xl text-[#FFFFFF] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: '1.1',
              }}
            >
              {eventTitle}
            </h1>

            {hostCompanyName ? (
              <div className="mt-10 flex flex-col items-center">
                <p
                  className="text-[0.6875rem] uppercase text-[#FFFFFF]/70"
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 500,
                    letterSpacing: '0.4em',
                  }}
                >
                  {t.hostedBy}
                </p>
                <p
                  className="mt-3 text-base uppercase text-[#FFFFFF] sm:text-lg"
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    letterSpacing: '0.3em',
                  }}
                >
                  {hostCompanyName}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-4 block h-px w-20 bg-[#C9A961]"
                />
              </div>
            ) : null}

            <div className="mt-12 flex flex-col items-center">
              <span
                aria-hidden="true"
                className="mb-6 block h-px w-12 bg-[#FFFFFF]/60"
              />
              <p
                className="text-[0.6875rem] uppercase text-[#FFFFFF]/85 sm:text-xs"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.35em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <time dateTime={eventDate}>{longDate}</time>
              </p>
            </div>

            {landingSubtitle ? (
              <p
                className="mt-10 max-w-xl text-sm leading-7 text-[#FFFFFF]/80 sm:text-base"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 400,
                }}
              >
                {landingSubtitle}
              </p>
            ) : null}
          </div>
        </header>

        {/* ── DESCRIPTION ─────────────────────────────────────────────── */}
        {hasDescription ? (
          <Section id="boardroom-description" title={t.description}>
            <div className="max-w-3xl">
              {descriptionParagraphs.map((paragraph, index) => (
                <p
                  key={`desc-${index}`}
                  className={[
                    'text-base leading-8 sm:text-lg sm:leading-9',
                    'text-[#1B1B1F]',
                    index > 0 ? 'mt-6' : '',
                  ].join(' ')}
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 400,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── SPEAKERS ────────────────────────────────────────────────── */}
        {speakerList.length > 0 ? (
          <Section id="boardroom-speakers" title={t.speakers}>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {speakerList.map((speaker, index) => (
                <SpeakerCard key={`speaker-${index}`} speaker={speaker} />
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── PROGRAMME ──────────────────────────────────────────────── */}
        {hasProgram ? (
          <Section id="boardroom-program" title={t.program}>
            <div>
              {programDays.map((day, dayIndex) => (
                <div key={`day-${dayIndex}`} className="mb-14 last:mb-0">
                  {(day.label ?? day.date) ? (
                    <div className="mb-6">
                      <h3
                        className="text-lg uppercase text-[#0B2545] sm:text-xl"
                        style={{
                          fontFamily: BODY_FONT,
                          fontWeight: 600,
                          letterSpacing: '0.25em',
                        }}
                      >
                        {day.label ?? ''}
                      </h3>
                      {day.date ? (
                        <p
                          className="mt-1 text-[0.6875rem] uppercase text-[#1B1B1F]/60"
                          style={{
                            fontFamily: BODY_FONT,
                            fontWeight: 500,
                            letterSpacing: '0.3em',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatLongDate(day.date, locale)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div>
                    {day.items.map((item, itemIndex) => (
                      <Row
                        key={`item-${dayIndex}-${itemIndex}`}
                        label={item.time}
                      >
                        <p
                          className="text-lg leading-tight text-[#0B2545] sm:text-xl"
                          style={{
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 500,
                          }}
                        >
                          {item.title}
                        </p>
                        {item.detail ? (
                          <p
                            className="mt-2 text-sm leading-6 text-[#1B1B1F]/75"
                            style={{
                              fontFamily: BODY_FONT,
                              fontWeight: 400,
                            }}
                          >
                            {item.detail}
                          </p>
                        ) : null}
                      </Row>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── LOCATIONS ───────────────────────────────────────────────── */}
        {hasLocations ? (
          <Section id="boardroom-locations" title={t.locations}>
            {locations.map((location, index) => (
              <div key={`loc-${index}`} className="mb-12 last:mb-0">
                <Row label={location.label}>
                  <p
                    className="text-xl leading-tight text-[#0B2545] sm:text-2xl"
                    style={{
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 500,
                    }}
                  >
                    {location.name}
                  </p>
                  {location.address ? (
                    <p
                      className="mt-3 text-sm leading-6 text-[#1B1B1F]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                      }}
                    >
                      {t.address}: {location.address}
                    </p>
                  ) : null}
                  {location.city ? (
                    <p
                      className="mt-1 text-sm uppercase text-[#1B1B1F]/60"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 500,
                        letterSpacing: '0.2em',
                      }}
                    >
                      {t.city} · {location.city}
                    </p>
                  ) : null}
                  {location.time ? (
                    <p
                      className="mt-3 text-[0.6875rem] uppercase text-[#1B1B1F]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        letterSpacing: '0.25em',
                        fontVariantNumeric: 'tabular-nums',
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
                      className="boardroom-cta mt-5 inline-flex items-center gap-2 border-b border-[#0B2545] pb-1 text-[0.6875rem] uppercase text-[#0B2545]"
                      style={{
                        fontFamily: BODY_FONT,
                        fontWeight: 600,
                        letterSpacing: '0.25em',
                      }}
                    >
                      <MapPin className="text-[#0B2545]" />
                      {t.viewMap}
                    </a>
                  ) : null}
                </Row>
              </div>
            ))}
          </Section>
        ) : null}

        {/* ── DRESS CODE ──────────────────────────────────────────────── */}
        {hasDressCode ? (
          <Section id="boardroom-dress-code" title={t.dressCode}>
            <div className="max-w-3xl">
              {dressCodeParagraphs.map((paragraph, index) => (
                <p
                  key={`dress-${index}`}
                  className={[
                    'text-base leading-8 sm:text-lg sm:leading-9',
                    'text-[#1B1B1F]',
                    index > 0 ? 'mt-6' : '',
                  ].join(' ')}
                  style={{
                    fontFamily: BODY_FONT,
                    fontWeight: 400,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Section>
        ) : null}

        {/* ── RSVP ────────────────────────────────────────────────────── */}
        {rsvpEnabled ? (
          <section
            id="boardroom-rsvp"
            className="w-full bg-[#FFFFFF] px-6 py-24 text-center sm:px-10 md:py-32"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
              <span
                aria-hidden="true"
                className="mb-10 block h-[2px] w-16 bg-[#0B2545]"
              />
              <p
                className="mb-6 text-[0.6875rem] uppercase text-[#1B1B1F]/60"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.3em',
                }}
              >
                {t.rsvpHint}
              </p>
              <h2
                className="mb-10 text-3xl leading-tight text-[#0B2545] sm:text-4xl md:text-5xl"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {t.rsvpTitle}
              </h2>
              <button
                type="button"
                onClick={onRsvpClick}
                className="boardroom-cta bg-[#0B2545] px-12 py-4 text-xs uppercase text-[#FFFFFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2545] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF] sm:text-sm"
                style={{
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  letterSpacing: '0.3em',
                }}
              >
                {t.rsvp}
              </button>
              <span
                aria-hidden="true"
                className="mt-10 block h-[2px] w-16 bg-[#0B2545]"
              />
            </div>
          </section>
        ) : null}

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <footer className="w-full bg-[#0B2545] px-6 py-16 text-center text-[#FFFFFF] sm:px-10">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
            <span
              aria-hidden="true"
              className="mb-6 block h-[2px] w-12 bg-[#C9A961]"
            />
            <p
              className="text-[0.6875rem] uppercase text-[#FFFFFF]/85"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                letterSpacing: '0.3em',
              }}
            >
              {t.madeWith} · {t.attribution}
            </p>
            <p
              className="mt-3 text-[0.625rem] uppercase text-[#FFFFFF]/55"
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 500,
                letterSpacing: '0.3em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <time dateTime={eventDate}>{numericDate}</time>
            </p>
            <span
              aria-hidden="true"
              className="mt-6 block h-[2px] w-12 bg-[#C9A961]"
            />
          </div>
        </footer>
      </div>
    </main>
  );
}