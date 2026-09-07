/**
 * GalaTemplate — Formal Corporate Gala Invitation
 *
 * Theme:  Black-tie corporate gala (charity dinner, awards ceremony,
 *         premium corporate evening). Black + gold, velvet panels, thin
 *         gold borders, serif typography, shine-sweep gold accents.
 *
 * Palette (locked):
 *   black         #0A0A0A   page background, velvet panels
 *   gold          #D4AF37   primary accent, dividers, eyebrow labels
 *   darker gold   #B8860B   shadow gold, shine gradient edges
 *   white         #F5F5F5   body text
 *   wine red      #8B0000   RSVP CTA background (only allowed color burst)
 *
 * Typography:
 *   Playfair Display (400/500/600/700, italic 400) — display headings (h1/h2)
 *   Cormorant Garamond (300/400/500/600/700, italic 400) — body & UI
 *
 * Motion: diagonal gold shine-sweep on display headings (4s loop).
 *         Disabled under `prefers-reduced-motion: reduce`.
 */

import * as React from 'react';

export interface PublicInvitationPageProps {
  eventTitle: string;
  hostCompanyName?: string;
  eventDate: string;
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

type Locale = 'en' | 'es';

interface Labels {
  heroEyebrow: string;
  hostedBy: string;
  theEvening: string;
  speakers: string;
  program: string;
  venue: string;
  dressCode: string;
  rsvpEyebrow: string;
  rsvpCta: string;
  rsvpNote: string;
  footer: string;
  openInMaps: string;
  dayLabel: (idx: number) => string;
}

const LABELS: Record<Locale, Labels> = {
  en: {
    heroEyebrow: 'An Evening of Distinction',
    hostedBy: 'Hosted by',
    theEvening: 'The Evening',
    speakers: 'Distinguished Speakers',
    program: 'The Program',
    venue: 'The Venue',
    dressCode: 'Dress Code',
    rsvpEyebrow: 'Reserve Your Place',
    rsvpCta: 'Confirm Attendance',
    rsvpNote: 'Kindly respond before the appointed evening',
    footer: 'Crafted with care by Deer Planner',
    openInMaps: 'Open in Maps',
    dayLabel: (idx) => `Day ${String(idx + 1).padStart(2, '0')}`,
  },
  es: {
    heroEyebrow: 'Una Velada de Distinción',
    hostedBy: 'Organizado por',
    theEvening: 'La Velada',
    speakers: 'Oradores Distinguidos',
    program: 'El Programa',
    venue: 'La Sede',
    dressCode: 'Código de Vestimenta',
    rsvpEyebrow: 'Reserva Tu Lugar',
    rsvpCta: 'Confirmar Asistencia',
    rsvpNote: 'Le rogamos confirmar antes de la velada',
    footer: 'Creado con esmero por Deer Planner',
    openInMaps: 'Abrir en Mapas',
    dayLabel: (idx) => `Día ${String(idx + 1).padStart(2, '0')}`,
  },
};

const formatDateLong = (iso: string, locale: Locale): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatDateShort = (iso: string, locale: Locale): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const StarOrnament: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 0 L13.4 8.6 L22 12 L13.4 15.4 L12 24 L10.6 15.4 L2 12 L10.6 8.6 Z" />
  </svg>
);

const FloretOrnament: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    className={className}
  >
    <path d="M16 4 L16 28" />
    <path d="M4 16 L28 16" />
    <path d="M16 4 C18 8 18 8 22 9" />
    <path d="M16 4 C14 8 14 8 10 9" />
    <path d="M16 28 C18 24 18 24 22 23" />
    <path d="M16 28 C14 24 14 24 10 23" />
    <circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const LogoPlaceholder: React.FC = () => (
  <div
    aria-hidden="true"
    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[radial-gradient(circle_at_30%_30%,#1F1A12,#0A0A0A)] shadow-[0_0_28px_rgba(212,175,55,0.22)]"
  >
    <StarOrnament className="h-8 w-8 text-[#D4AF37]" />
  </div>
);

const SectionLabel: React.FC<{
  children: React.ReactNode;
  locale: Locale;
  id?: string;
}> = ({ children, locale, id }) => (
  <div className="mb-8 flex items-center justify-center gap-4">
    <span className="h-px w-12 bg-[#D4AF37]/50" aria-hidden="true" />
    <span className="h-px w-6 bg-[#D4AF37]/25" aria-hidden="true" />
    <h2
      id={id}
      lang={locale}
      className="font-['Cormorant_Garamond',Georgia,serif] text-[11px] font-semibold uppercase tracking-[0.45em] text-[#D4AF37]"
    >
      {children}
    </h2>
    <span className="h-px w-6 bg-[#D4AF37]/25" aria-hidden="true" />
    <span className="h-px w-12 bg-[#D4AF37]/50" aria-hidden="true" />
  </div>
);

const VelvetPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={
      'relative rounded-[2px] border border-[#D4AF37]/35 bg-[radial-gradient(ellipse_at_top,#15110E_0%,#0A0A0A_72%)] p-6 shadow-[inset_0_1px_0_rgba(212,175,55,0.10),0_18px_40px_-24px_rgba(0,0,0,0.8)] sm:p-8 ' +
      className
    }
  >
    <span
      aria-hidden="true"
      className="absolute left-2 top-2 text-[#D4AF37]/70"
    >
      <StarOrnament className="h-2.5 w-2.5" />
    </span>
    <span
      aria-hidden="true"
      className="absolute right-2 top-2 text-[#D4AF37]/70"
    >
      <StarOrnament className="h-2.5 w-2.5" />
    </span>
    <span
      aria-hidden="true"
      className="absolute bottom-2 left-2 text-[#D4AF37]/70"
    >
      <StarOrnament className="h-2.5 w-2.5" />
    </span>
    <span
      aria-hidden="true"
      className="absolute bottom-2 right-2 text-[#D4AF37]/70"
    >
      <StarOrnament className="h-2.5 w-2.5" />
    </span>
    <div className="relative">{children}</div>
  </div>
);

const GalaTemplate: React.FC<PublicInvitationPageProps> = (props) => {
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

  const t = LABELS[locale];
  const dateLong = formatDateLong(eventDate, locale);
  const speakersList = speakers ?? [];
  const hasSpeakers = speakersList.length > 0;
  const hasLocations = locations.length > 0;
  const hasProgram = program.days.length > 0;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
      />

      <style>{`
        @keyframes gala-shine {
          0%   { background-position:  220% 50%; }
          100% { background-position: -220% 50%; }
        }
        .gala-shine {
          background-image: linear-gradient(
            105deg,
            #B8860B 0%,
            #D4AF37 32%,
            #FFF6D0 50%,
            #D4AF37 68%,
            #B8860B 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
                  color: transparent;
          animation: gala-shine 4s ease-in-out infinite;
        }
        .gala-shine-slow {
          background-image: linear-gradient(
            105deg,
            #B8860B 0%,
            #D4AF37 32%,
            #FFF6D0 50%,
            #D4AF37 68%,
            #B8860B 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
                  background-clip: text;
          -webkit-text-fill-color: transparent;
                  color: transparent;
          animation: gala-shine 6s ease-in-out infinite;
        }
        @keyframes gala-rsvp-shine {
          0%   { transform: translateX(-110%); }
          100% { transform: translateX(110%); }
        }
        .gala-rsvp {
          position: relative;
          overflow: hidden;
          transition:
            transform 320ms cubic-bezier(.2,.7,.2,1),
            box-shadow 320ms ease,
            filter 320ms ease;
        }
        .gala-rsvp::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          height: 100%; width: 40%;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(245, 230, 168, 0.55) 50%,
            transparent 100%
          );
          transform: translateX(-110%);
          animation: gala-rsvp-shine 3.5s ease-in-out 0.4s infinite;
          pointer-events: none;
        }
        .gala-rsvp:hover {
          transform: scale(1.03);
          box-shadow:
            0 0 0 1px rgba(212,175,55,0.6) inset,
            0 0 28px rgba(212,175,55,0.55),
            0 0 64px rgba(139,0,0,0.45);
          filter: brightness(1.06);
        }
        .gala-rsvp:hover::before {
          animation-duration: 1.6s;
        }
        @media (prefers-reduced-motion: reduce) {
          .gala-shine,
          .gala-shine-slow {
            animation: none;
            background-image: none;
            -webkit-text-fill-color: #D4AF37;
                    color: #D4AF37;
          }
          .gala-rsvp::before { display: none; }
          .gala-rsvp { transition: none; }
          .gala-rsvp:hover { transform: none; }
        }
      `}</style>

      <div
        lang={locale}
        className="min-h-screen bg-[#0A0A0A] font-['Cormorant_Garamond',Georgia,serif] text-[#F5F5F5] antialiased"
      >
        {/* HERO */}
        <header className="relative isolate overflow-hidden">
          {heroImageUrl ? (
            <>
              <div
                className="absolute inset-0 -z-20 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImageUrl})` }}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.78) 55%, #0A0A0A 100%)',
                }}
                aria-hidden="true"
              />
            </>
          ) : (
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(ellipse 90% 60% at 50% 28%, #1F180D 0%, #0F0B07 45%, #050505 100%)',
              }}
              aria-hidden="true"
            />
          )}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-10 mx-auto flex max-w-4xl justify-between px-8 text-[#D4AF37]/40"
          >
            <FloretOrnament className="h-10 w-10" />
            <FloretOrnament className="h-10 w-10" />
          </div>

          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32 lg:py-36">
            <LogoPlaceholder />

            <div className="mt-8 flex items-center gap-3 text-[#D4AF37]">
              <span className="h-px w-10 bg-[#D4AF37]/55" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.45em]">
                {t.heroEyebrow}
              </span>
              <span className="h-px w-10 bg-[#D4AF37]/55" aria-hidden="true" />
            </div>

            <h1
              className="gala-shine mt-7 font-['Playfair_Display',Georgia,serif] text-5xl font-semibold leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
            >
              {eventTitle}
            </h1>

            {landingTitle ? (
              <p
                lang={locale}
                className="mt-6 font-['Cormorant_Garamond',Georgia,serif] text-2xl italic text-[#F5F5F5]/90 sm:text-3xl"
              >
                {landingTitle}
              </p>
            ) : null}
            {landingSubtitle ? (
              <p
                lang={locale}
                className="mt-3 max-w-2xl font-['Cormorant_Garamond',Georgia,serif] text-lg text-[#F5F5F5]/75 sm:text-xl"
              >
                {landingSubtitle}
              </p>
            ) : null}

            <div
              aria-hidden="true"
              className="my-9 flex items-center gap-3 text-[#D4AF37]/70"
            >
              <span className="h-px w-16 bg-[#D4AF37]/60" />
              <StarOrnament className="h-3 w-3" />
              <span className="h-px w-4 bg-[#D4AF37]/30" />
              <StarOrnament className="h-2 w-2" />
              <span className="h-px w-4 bg-[#D4AF37]/30" />
              <StarOrnament className="h-3 w-3" />
              <span className="h-px w-16 bg-[#D4AF37]/60" />
            </div>

            {hostCompanyName ? (
              <div className="text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#D4AF37]/70">
                  {t.hostedBy}
                </div>
                <div
                  lang={locale}
                  className="mt-2 font-['Cormorant_Garamond',Georgia,serif] text-xl uppercase tracking-[0.32em] text-[#D4AF37] sm:text-2xl"
                >
                  {hostCompanyName}
                </div>
              </div>
            ) : null}

            <time
              dateTime={eventDate}
              lang={locale}
              className="mt-7 font-['Cormorant_Garamond',Georgia,serif] text-lg text-[#F5F5F5] sm:text-xl"
            >
              {dateLong}
            </time>
          </div>
        </header>

        <main>
          {/* DESCRIPTION */}
          {description ? (
            <section
              aria-labelledby="sec-description"
              className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24"
            >
              <SectionLabel locale={locale} id="sec-description">
                {t.theEvening}
              </SectionLabel>
              <div className="space-y-5 font-['Cormorant_Garamond',Georgia,serif] text-xl leading-relaxed text-[#F5F5F5]/90 sm:text-2xl">
                {description.body
                  .split(/\n\s*\n/)
                  .filter((p) => p.trim().length > 0)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
            </section>
          ) : null}

          {/* SPEAKERS */}
          {hasSpeakers ? (
            <section
              aria-labelledby="sec-speakers"
              className="mx-auto max-w-6xl px-6 py-20 sm:py-24"
            >
              <SectionLabel locale={locale} id="sec-speakers">
                {t.speakers}
              </SectionLabel>
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {speakersList.map((sp, i) => {
                  const initials = sp.name
                    .split(/\s+/)
                    .map((part) => part.charAt(0))
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  return (
                    <VelvetPanel key={`${sp.name}-${i}`} className="text-center">
                      <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-[#D4AF37]/60 shadow-[0_0_24px_rgba(212,175,55,0.18)]">
                        {sp.photoUrl ? (
                          <img
                            src={sp.photoUrl}
                            alt={sp.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#1F1A12,#0A0A0A)] font-['Playfair_Display',Georgia,serif] text-3xl text-[#D4AF37]">
                            {initials}
                          </div>
                        )}
                      </div>
                      <h3
                        lang={locale}
                        className="mt-6 font-['Playfair_Display',Georgia,serif] text-2xl text-[#F5F5F5]"
                      >
                        {sp.name}
                      </h3>
                      <div
                        lang={locale}
                        className="mt-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#D4AF37]"
                      >
                        {sp.role}
                      </div>
                      {sp.bio ? (
                        <p
                          lang={locale}
                          className="mt-4 font-['Cormorant_Garamond',Georgia,serif] text-base leading-relaxed text-[#F5F5F5]/75"
                        >
                          {sp.bio}
                        </p>
                      ) : null}
                    </VelvetPanel>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* PROGRAM */}
          {hasProgram ? (
            <section
              aria-labelledby="sec-program"
              className="mx-auto max-w-4xl px-6 py-20 sm:py-24"
            >
              <SectionLabel locale={locale} id="sec-program">
                {t.program}
              </SectionLabel>
              <div className="space-y-10">
                {program.days.map((day, di) => (
                  <VelvetPanel key={`day-${di}`}>
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#D4AF37]/30 pb-4">
                      <h3
                        lang={locale}
                        className="font-['Playfair_Display',Georgia,serif] text-2xl text-[#F5F5F5] sm:text-[1.7rem]"
                      >
                        {day.label ?? t.dayLabel(di)}
                      </h3>
                      {day.date ? (
                        <span
                          lang={locale}
                          className="font-['Cormorant_Garamond',Georgia,serif] text-sm uppercase tracking-[0.32em] text-[#D4AF37]/80"
                        >
                          {formatDateShort(day.date, locale)}
                        </span>
                      ) : null}
                    </div>
                    <ul className="divide-y divide-[#D4AF37]/15">
                      {day.items.map((item, ii) => (
                        <li
                          key={`item-${di}-${ii}`}
                          className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[7.5rem_1fr] sm:gap-6"
                        >
                          <span
                            lang={locale}
                            className="font-['Cormorant_Garamond',Georgia,serif] text-lg uppercase tracking-[0.28em] text-[#D4AF37]"
                          >
                            {item.time}
                          </span>
                          <div>
                            <div
                              lang={locale}
                              className="font-['Playfair_Display',Georgia,serif] text-xl text-[#F5F5F5] sm:text-[1.35rem]"
                            >
                              {item.title}
                            </div>
                            {item.detail ? (
                              <p
                                lang={locale}
                                className="mt-1 font-['Cormorant_Garamond',Georgia,serif] text-base text-[#F5F5F5]/75"
                              >
                                {item.detail}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </VelvetPanel>
                ))}
              </div>
            </section>
          ) : null}

          {/* LOCATIONS */}
          {hasLocations ? (
            <section
              aria-labelledby="sec-locations"
              className="mx-auto max-w-5xl px-6 py-20 sm:py-24"
            >
              <SectionLabel locale={locale} id="sec-locations">
                {t.venue}
              </SectionLabel>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {locations.map((loc, i) => (
                  <VelvetPanel key={`loc-${i}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        lang={locale}
                        className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#D4AF37]"
                      >
                        {loc.label}
                      </span>
                      {loc.time ? (
                        <span
                          lang={locale}
                          className="font-['Cormorant_Garamond',Georgia,serif] text-sm uppercase tracking-[0.3em] text-[#D4AF37]/80"
                        >
                          {loc.time}
                        </span>
                      ) : null}
                    </div>
                    <h3
                      lang={locale}
                      className="mt-3 font-['Playfair_Display',Georgia,serif] text-2xl text-[#F5F5F5] sm:text-[1.7rem]"
                    >
                      {loc.name}
                    </h3>
                    <div className="mt-2 space-y-1 font-['Cormorant_Garamond',Georgia,serif] text-base text-[#F5F5F5]/80">
                      {loc.address ? <div>{loc.address}</div> : null}
                      {loc.city ? <div>{loc.city}</div> : null}
                    </div>
                    {loc.mapsLink ? (
                      <a
                        href={loc.mapsLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#D4AF37] transition-colors duration-200 hover:text-[#FFF6D0]"
                      >
                        <span>{t.openInMaps}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </VelvetPanel>
                ))}
              </div>
            </section>
          ) : null}

          {/* DRESS CODE */}
          {dressCode ? (
            <section
              aria-labelledby="sec-dresscode"
              className="mx-auto max-w-2xl px-6 py-20 text-center sm:py-24"
            >
              <SectionLabel locale={locale} id="sec-dresscode">
                {t.dressCode}
              </SectionLabel>
              <div className="space-y-4 font-['Cormorant_Garamond',Georgia,serif] text-2xl leading-relaxed text-[#F5F5F5] sm:text-3xl">
                {dressCode.body
                  .split(/\n\s*\n/)
                  .filter((p) => p.trim().length > 0)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
            </section>
          ) : null}

          {/* RSVP CTA */}
          {rsvpEnabled ? (
            <section
              aria-labelledby="sec-rsvp"
              className="mx-auto max-w-3xl px-6 pb-24 pt-16 text-center sm:pb-28 sm:pt-20"
            >
              <SectionLabel locale={locale} id="sec-rsvp">
                {t.rsvpEyebrow}
              </SectionLabel>
              <h2
                lang={locale}
                className="gala-shine-slow mx-auto max-w-xl font-['Playfair_Display',Georgia,serif] text-4xl font-medium leading-tight sm:text-5xl"
              >
                {t.rsvpCta}
              </h2>
              <p
                lang={locale}
                className="mx-auto mt-5 max-w-md font-['Cormorant_Garamond',Georgia,serif] text-lg italic text-[#F5F5F5]/75"
              >
                {t.rsvpNote}
              </p>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={onRsvpClick}
                  className="gala-rsvp inline-flex items-center justify-center rounded-[2px] border border-[#D4AF37]/75 bg-[#8B0000] px-12 py-4 font-['Cormorant_Garamond',Georgia,serif] text-base uppercase tracking-[0.4em] text-[#D4AF37] shadow-[0_10px_30px_rgba(139,0,0,0.45),inset_0_1px_0_rgba(212,175,55,0.35)]"
                >
                  <span className="relative z-10">{t.rsvpCta}</span>
                </button>
              </div>
            </section>
          ) : null}
        </main>

        <footer className="border-t border-[#D4AF37]/20 px-6 py-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
            <div
              aria-hidden="true"
              className="flex items-center gap-3 text-[#D4AF37]/60"
            >
              <span className="h-px w-14 bg-[#D4AF37]/45" />
              <StarOrnament className="h-3 w-3" />
              <span className="h-px w-4 bg-[#D4AF37]/30" />
              <StarOrnament className="h-2 w-2" />
              <span className="h-px w-4 bg-[#D4AF37]/30" />
              <StarOrnament className="h-3 w-3" />
              <span className="h-px w-14 bg-[#D4AF37]/45" />
            </div>
            <p
              lang={locale}
              className="font-['Cormorant_Garamond',Georgia,serif] text-[11px] uppercase tracking-[0.45em] text-[#F5F5F5]/55"
            >
              {t.footer}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default GalaTemplate;
