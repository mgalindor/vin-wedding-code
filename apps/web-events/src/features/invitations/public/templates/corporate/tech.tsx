/**
 * TechTemplate — Corporate / Developer Event Invitation
 *
 * Theme:  Dark-mode developer meetup (hackathon, demo day, product launch).
 *         Cyan + violet accents over deep navy, monospace data, glassmorphism.
 *
 * Palette (locked):
 *   deep navy  #0A0E27   page background, mesh anchor
 *   cyan       #06B6D4   primary accent, data, underlines
 *   violet     #8B5CF6   secondary accent, hover glow
 *   light text #E5E7EB   body copy
 *   card       #1F2937   glassmorphism surface (rgba(31,41,55,0.6) + blur)
 *
 * Typography:
 *   Inter (400/700)        — body + display headings
 *   JetBrains Mono (400/700) — time stamps, dates, console badges, RSVP
 *
 * Motion: animated radial-gradient mesh in hero (12–20s loop), hover glow
 *         on glass cards. Both are disabled under `prefers-reduced-motion`.
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

type Labels = {
  rsvp: string;
  rsvpHint: string;
  description: string;
  speakers: string;
  program: string;
  locations: string;
  dressCode: string;
  poweredBy: string;
  openInMaps: string;
  schedule: string;
  addToCalendar: string;
  hostedBy: string;
  liveBadge: string;
  speakersCount: (n: number) => string;
  daysCount: (n: number) => string;
  locationsCount: (n: number) => string;
};

const LABELS: Record<'en' | 'es', Labels> = {
  en: {
    rsvp: 'RSVP',
    rsvpHint: 'Confirm attendance',
    description: 'About the event',
    speakers: 'Speakers',
    program: 'Program',
    locations: 'Where',
    dressCode: 'Dress code',
    poweredBy: 'Powered by Deer Planner',
    openInMaps: 'Open in maps',
    schedule: 'Schedule',
    addToCalendar: 'Add to calendar',
    hostedBy: 'Hosted by',
    liveBadge: 'ON_AIR',
    speakersCount: (n) => `${n} speakers`,
    daysCount: (n) => `${n} day${n === 1 ? '' : 's'}`,
    locationsCount: (n) => `${n} location${n === 1 ? '' : 's'}`,
  },
  es: {
    rsvp: 'Confirmar',
    rsvpHint: 'Confirma tu asistencia',
    description: 'Sobre el evento',
    speakers: 'Speakers',
    program: 'Programa',
    locations: 'Lugar',
    dressCode: 'Código de vestimenta',
    poweredBy: 'Hecho con Deer Planner',
    openInMaps: 'Abrir en mapas',
    schedule: 'Agenda',
    addToCalendar: 'Agregar al calendario',
    hostedBy: 'Organiza',
    liveBadge: 'EN_VIVO',
    speakersCount: (n) => `${n} speakers`,
    daysCount: (n) => `${n} día${n === 1 ? '' : 's'}`,
    locationsCount: (n) => `${n} sede${n === 1 ? '' : 's'}`,
  },
};

const formatDate = (iso: string, locale: 'en' | 'es'): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatDateShort = (iso: string, locale: 'en' | 'es'): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const GridPattern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    className={className}
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="tech-grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path
          d="M 48 0 L 0 0 0 48"
          fill="none"
          stroke="rgba(6, 182, 212, 0.08)"
          strokeWidth="1"
        />
      </pattern>
      <pattern id="tech-grid-fine" width="12" height="12" patternUnits="userSpaceOnUse">
        <path
          d="M 12 0 L 0 0 0 12"
          fill="none"
          stroke="rgba(139, 92, 246, 0.04)"
          strokeWidth="1"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#tech-grid-fine)" />
    <rect width="100%" height="100%" fill="url(#tech-grid)" />
  </svg>
);

const SectionLabel: React.FC<{
  glyph: string;
  children: React.ReactNode;
  locale: 'en' | 'es';
}> = ({ glyph, children, locale }) => (
  <div className="mb-6 flex items-center gap-3">
    <span
      aria-hidden="true"
      className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-[#06B6D4] tracking-wider"
    >
      {glyph}
    </span>
    <h2
      className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs uppercase tracking-[0.3em] text-[#06B6D4]"
      lang={locale}
    >
      {children}
    </h2>
    <span className="h-px flex-1 bg-gradient-to-r from-[#06B6D4]/40 via-[#8B5CF6]/20 to-transparent" />
  </div>
);

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={
      'group relative rounded-2xl border border-white/[0.08] bg-[rgba(31,41,55,0.6)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-md transition-all duration-300 hover:border-[#06B6D4]/40 hover:shadow-[0_0_32px_-8px_rgba(6,182,212,0.45),0_0_24px_-12px_rgba(139,92,246,0.5)] ' +
      className
    }
  >
    {children}
  </div>
);

const TechTemplate: React.FC<PublicInvitationPageProps> = (props) => {
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
  const dateLong = formatDate(eventDate, locale);
  const dateShort = formatDateShort(eventDate, locale);
  const [year, month, day] = eventDate.split('-');

  const heroTitle = landingTitle ?? eventTitle;
  const heroSubtitle = landingSubtitle;

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
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
      />

      <style>{`
        @keyframes tech-mesh-shift {
          0%   { background-position: 0% 0%,   100% 100%, 50% 50%; }
          33%  { background-position: 30% 20%,  70% 60%,  20% 80%; }
          66%  { background-position: 70% 80%,  30% 30%,  80% 20%; }
          100% { background-position: 0% 0%,   100% 100%, 50% 50%; }
        }
        .tech-mesh {
          background-color: #0A0E27;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.45) 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.45) 0%, transparent 45%),
            radial-gradient(circle at 50% 100%, rgba(6, 182, 212, 0.25) 0%, transparent 60%);
          background-size: 200% 200%, 200% 200%, 200% 200%;
          animation: tech-mesh-shift 18s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tech-mesh { animation: none; }
        }
        .heading-underline {
          position: relative;
          display: inline-block;
        }
        .heading-underline::after {
          content: '';
          position: absolute;
          left: 0; bottom: -6px;
          width: 100%; height: 1px;
          background: #06B6D4;
          transition: background 240ms ease;
        }
        .heading-underline:hover::after { background: #8B5CF6; }
        .rsvp-btn {
          background: linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%);
          transition: box-shadow 240ms ease, transform 240ms ease, filter 240ms ease;
        }
        .rsvp-btn:hover {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.12) inset,
            0 0 24px rgba(6, 182, 212, 0.55),
            0 0 48px rgba(139, 92, 246, 0.45);
          filter: brightness(1.08);
        }
        .rsvp-btn:active { transform: translateY(1px); }
        .speaker-photo-ring {
          background: conic-gradient(from 180deg, #06B6D4, #8B5CF6, #06B6D4);
        }
      `}</style>

      <div
        className="min-h-screen bg-[#0A0E27] text-[#E5E7EB] font-['Inter',ui-sans-serif,system-ui,sans-serif] antialiased"
        lang={locale}
      >
        {/* HERO */}
        <header className="relative overflow-hidden">
          <div className="tech-mesh absolute inset-0" aria-hidden="true" />
          <div className="absolute inset-0 opacity-40" aria-hidden="true">
            <GridPattern />
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0A0E27]"
            aria-hidden="true"
          />

          {heroImageUrl ? (
            <div className="absolute inset-0">
              <img
                src={heroImageUrl}
                alt=""
                className="h-full w-full object-cover opacity-40"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#0A0E27]/60 via-[#0A0E27]/70 to-[#0A0E27]"
                aria-hidden="true"
              />
            </div>
          ) : null}

          <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 sm:py-28 lg:py-32">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[rgba(31,41,55,0.6)] font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-[#06B6D4] backdrop-blur-md"
                  aria-hidden="true"
                >
                  &lt;/&gt;
                </div>
                <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs uppercase tracking-[0.3em] text-[#E5E7EB]/70">
                  Deer Planner
                </span>
              </div>

              {hostCompanyName ? (
                <span className="hidden items-center gap-2 rounded-full border border-[#06B6D4]/40 bg-[rgba(6,182,212,0.08)] px-3 py-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] uppercase tracking-[0.25em] text-[#06B6D4] shadow-[0_0_18px_-4px_rgba(6,182,212,0.6)] sm:inline-flex">
                  <span
                    className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#06B6D4]"
                    aria-hidden="true"
                  />
                  {t.liveBadge}
                  <span aria-hidden="true">·</span>
                  <span className="text-[#E5E7EB]">{hostCompanyName}</span>
                </span>
              ) : null}
            </div>

            <div className="max-w-4xl">
              <div className="mb-5 flex items-center gap-3 font-['JetBrains_Mono',ui-monospace,monospace] text-xs text-[#06B6D4]">
                <span className="opacity-70">event.date</span>
                <span className="text-[#E5E7EB]/40">=</span>
                <span className="text-[#E5E7EB]">
                  &quot;{year}-{month}-{day}&quot;
                </span>
              </div>

              <h1
                className="heading-underline font-['Inter',ui-sans-serif,system-ui,sans-serif] text-5xl font-extrabold leading-[1.05] tracking-tight text-[#E5E7EB] sm:text-6xl lg:text-7xl"
              >
                {heroTitle}
              </h1>

              {heroSubtitle ? (
                <p className="mt-6 max-w-2xl text-lg text-[#E5E7EB]/75 sm:text-xl">
                  {heroSubtitle}
                </p>
              ) : null}

              <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
                <div>
                  <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.3em] text-[#06B6D4]/80">
                    {dateShort}
                  </div>
                  <div className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-2xl font-bold text-[#E5E7EB]">
                    {dateLong}
                  </div>
                </div>

                {hostCompanyName ? (
                  <div>
                    <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6]/80">
                      {t.hostedBy}
                    </div>
                    <div className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-2xl font-bold text-[#E5E7EB]">
                      {hostCompanyName}
                    </div>
                  </div>
                ) : null}

                {rsvpEnabled ? (
                  <button
                    type="button"
                    onClick={onRsvpClick}
                    className="rsvp-btn group inline-flex items-center gap-3 rounded-md px-7 py-3.5 font-['JetBrains_Mono',ui-monospace,monospace] text-sm font-bold uppercase tracking-[0.2em] text-white"
                  >
                    <span aria-hidden="true">&gt;</span>
                    {t.rsvp}
                    <span
                      aria-hidden="true"
                      className="opacity-70 transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-6 pb-24">
          {description ? (
            <section className="py-16 sm:py-20" aria-labelledby="sec-description">
              <SectionLabel glyph="//" locale={locale}>
                {t.description}
              </SectionLabel>
              <GlassCard className="max-w-3xl">
                <p className="whitespace-pre-line text-base leading-relaxed text-[#E5E7EB]/85 sm:text-lg">
                  {description.body}
                </p>
              </GlassCard>
            </section>
          ) : null}

          {hasSpeakers ? (
            <section className="py-16 sm:py-20" aria-labelledby="sec-speakers">
              <div className="mb-8 flex items-end justify-between">
                <SectionLabel glyph="[ ]" locale={locale}>
                  {t.speakers}
                </SectionLabel>
                <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs text-[#E5E7EB]/40">
                  {t.speakersCount(speakersList.length)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {speakersList.map((speaker, idx) => (
                  <GlassCard key={`${speaker.name}-${idx}`} className="flex flex-col">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="speaker-photo-ring relative h-14 w-14 rounded-full p-[2px]">
                        <div className="h-full w-full overflow-hidden rounded-full bg-[#1F2937]">
                          {speaker.photoUrl ? (
                            <img
                              src={speaker.photoUrl}
                              alt={speaker.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-['JetBrains_Mono',ui-monospace,monospace] text-lg text-[#06B6D4]">
                              {speaker.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-['Inter',ui-sans-serif,system-ui,sans-serif] text-base font-bold text-[#E5E7EB]">
                          {speaker.name}
                        </h3>
                        <p className="truncate font-['JetBrains_Mono',ui-monospace,monospace] text-xs uppercase tracking-wider text-[#8B5CF6]">
                          {speaker.role}
                        </p>
                      </div>
                    </div>
                    {speaker.bio ? (
                      <p className="text-sm leading-relaxed text-[#E5E7EB]/70">
                        {speaker.bio}
                      </p>
                    ) : null}
                  </GlassCard>
                ))}
              </div>
            </section>
          ) : null}

          {hasProgram ? (
            <section className="py-16 sm:py-20" aria-labelledby="sec-program">
              <div className="mb-8 flex items-end justify-between">
                <SectionLabel glyph="{}" locale={locale}>
                  {t.program}
                </SectionLabel>
                <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs text-[#E5E7EB]/40">
                  {t.daysCount(program.days.length)}
                </span>
              </div>
              <div className="space-y-10">
                {program.days.map((day, dIdx) => (
                  <div key={`day-${dIdx}`}>
                    <div className="mb-4 flex items-baseline gap-3">
                      <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs uppercase tracking-[0.3em] text-[#06B6D4]">
                        Day {String(dIdx + 1).padStart(2, '0')}
                      </span>
                      {day.label ? (
                        <h3 className="font-['Inter',ui-sans-serif,system-ui,sans-serif] text-xl font-bold text-[#E5E7EB]">
                          {day.label}
                        </h3>
                      ) : null}
                      {day.date ? (
                        <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-[#E5E7EB]/50">
                          {formatDateShort(day.date, locale)}
                        </span>
                      ) : null}
                    </div>

                    <GlassCard className="p-0">
                      <ul className="divide-y divide-white/[0.06]">
                        {day.items.map((item, iIdx) => (
                          <li
                            key={`item-${dIdx}-${iIdx}`}
                            className="grid grid-cols-[88px_1fr] gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.02] sm:grid-cols-[120px_1fr] sm:px-7"
                          >
                            <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm font-bold text-[#06B6D4] sm:text-base">
                              {item.time}
                            </div>
                            <div>
                              <div className="font-['Inter',ui-sans-serif,system-ui,sans-serif] text-base font-semibold text-[#E5E7EB]">
                                {item.title}
                              </div>
                              {item.detail ? (
                                <div className="mt-1 text-sm text-[#E5E7EB]/65">
                                  {item.detail}
                                </div>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {hasLocations ? (
            <section className="py-16 sm:py-20" aria-labelledby="sec-locations">
              <div className="mb-8 flex items-end justify-between">
                <SectionLabel glyph="::" locale={locale}>
                  {t.locations}
                </SectionLabel>
                <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs text-[#E5E7EB]/40">
                  {t.locationsCount(locations.length)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {locations.map((loc, lIdx) => (
                  <GlassCard key={`loc-${lIdx}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.3em] text-[#8B5CF6]">
                        {loc.label}
                      </span>
                      {loc.time ? (
                        <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-xs text-[#06B6D4]">
                          {loc.time}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-['Inter',ui-sans-serif,system-ui,sans-serif] text-lg font-bold text-[#E5E7EB]">
                      {loc.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-[#E5E7EB]/70">
                      {loc.address ? <div>{loc.address}</div> : null}
                      {loc.city ? <div>{loc.city}</div> : null}
                    </div>
                    {loc.mapsLink ? (
                      <a
                        href={loc.mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 font-['JetBrains_Mono',ui-monospace,monospace] text-xs uppercase tracking-[0.2em] text-[#06B6D4] transition-colors hover:text-[#8B5CF6]"
                      >
                        {t.openInMaps}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </GlassCard>
                ))}
              </div>
            </section>
          ) : null}

          {dressCode ? (
            <section className="py-16 sm:py-20" aria-labelledby="sec-dresscode">
              <SectionLabel glyph="/* */" locale={locale}>
                {t.dressCode}
              </SectionLabel>
              <GlassCard className="max-w-2xl">
                <p className="whitespace-pre-line text-base leading-relaxed text-[#E5E7EB]/85">
                  {dressCode.body}
                </p>
              </GlassCard>
            </section>
          ) : null}

          {rsvpEnabled ? (
            <section className="py-16 sm:py-20" aria-labelledby="sec-rsvp">
              <GlassCard className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.3em] text-[#06B6D4]">
                    {t.rsvp}
                  </div>
                  <h2 className="mt-1 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-2xl font-bold text-[#E5E7EB] sm:text-3xl">
                    {t.rsvpHint}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onRsvpClick}
                  className="rsvp-btn inline-flex items-center gap-3 rounded-md px-8 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-sm font-bold uppercase tracking-[0.2em] text-white"
                >
                  <span aria-hidden="true">&gt;</span>
                  {t.rsvp}
                  <span aria-hidden="true">→</span>
                </button>
              </GlassCard>
            </section>
          ) : null}
        </main>

        <footer className="border-t border-white/[0.06] py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
            <div className="flex items-center gap-2 font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.3em] text-[#E5E7EB]/40">
              <span aria-hidden="true" className="text-[#06B6D4]">&lt;/&gt;</span>
              {t.poweredBy}
            </div>
            <div className="font-['JetBrains_Mono',ui-monospace,monospace] text-[10px] uppercase tracking-[0.3em] text-[#E5E7EB]/30">
              {eventDate}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TechTemplate;
