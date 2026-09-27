/**
 * Pampas — Boho Editorial Wedding Template
 *
 * A magazine-spread inspired wedding invitation built around a sand/cream
 * palette, thin serif typography (Italiana) and pampas grass silhouettes.
 *
 * Palette (use these EXACT hex values):
 *   Sand:             #E8DFCE
 *   Cream:            #F7F2E8
 *   Light Terracotta: #C19A6B
 *   Coffee Brown:     #3E2C1C
 *
 * Typography:
 *   Display (h1/h2):  Italiana  (loaded via Google Fonts <link>)
 *   Body / UI:        Work Sans (loaded via Google Fonts <link>)
 *
 * Aesthetic accents:
 *   - 1px hairline terracotta rules as section dividers.
 *   - 8px white photo frames with a soft coffee-brown drop shadow
 *     (0 4px 16px rgba(62, 44, 28, 0.08)).
 *   - Inline SVG pampas grass silhouettes (3–5 long curved blades).
 *   - Cream-to-sand gradient fallback hero when no photo is provided.
 *   - Smooth scroll only — no parallax; subtle fade-up motion that
 *     respects prefers-reduced-motion.
 */

import React, { useEffect, useMemo, useState } from 'react';

export interface PublicInvitationPageProps {
  partner1Name: string;
  partner2Name: string;
  eventDate: string;
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

type PampasVariant = 'left' | 'right' | 'corner-tl' | 'corner-br';

interface PampasSilhouetteProps {
  className?: string;
  variant?: PampasVariant;
}

const PampasSilhouette: React.FC<PampasSilhouetteProps> = ({ className, variant = 'left' }) => {
  const transforms: Record<PampasVariant, string> = {
    left: '',
    right: 'scaleX(-1)',
    'corner-tl': 'rotate(-20deg)',
    'corner-br': 'rotate(160deg)',
  };
  return (
    <svg
      viewBox="0 0 240 480"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ transform: transforms[variant] }}
    >
      {/* Stem 1 */}
      <path
        d="M70 480 C 60 380 64 280 80 180 C 88 110 90 50 95 20"
        stroke="#C19A6B"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M95 20 C 76 28 70 78 80 100 C 92 84 102 60 102 38 C 102 28 99 22 95 20 Z"
        fill="#C19A6B"
        fillOpacity="0.55"
      />
      {/* Stem 2 */}
      <path
        d="M115 480 C 110 390 116 290 126 190 C 132 120 130 70 134 30"
        stroke="#C19A6B"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M134 30 C 112 40 108 92 118 114 C 130 98 140 72 140 46 C 140 36 138 32 134 30 Z"
        fill="#C19A6B"
        fillOpacity="0.7"
      />
      {/* Stem 3 */}
      <path
        d="M155 480 C 150 390 158 290 165 190 C 170 120 168 70 172 38"
        stroke="#C19A6B"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M172 38 C 152 48 148 100 158 122 C 170 106 180 80 180 54 C 180 44 178 40 172 38 Z"
        fill="#C19A6B"
        fillOpacity="0.6"
      />
      {/* Stem 4 */}
      <path
        d="M190 480 C 188 400 195 300 200 200 C 204 130 200 80 206 50"
        stroke="#C19A6B"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M206 50 C 188 60 186 110 196 132 C 208 116 214 90 214 66 C 214 56 212 52 206 50 Z"
        fill="#C19A6B"
        fillOpacity="0.5"
      />
      {/* Wispy filaments */}
      <path d="M102 38 Q 106 64 112 96" stroke="#C19A6B" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M140 46 Q 144 72 150 104" stroke="#C19A6B" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M180 54 Q 184 80 190 112" stroke="#C19A6B" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M214 66 Q 218 92 222 124" stroke="#C19A6B" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
};

const HairlineRule: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`h-px w-full bg-[#C19A6B]/50 ${className ?? ''}`}
    aria-hidden="true"
  />
);

const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <span
    className={`text-[11px] uppercase tracking-[0.4em] text-[#3E2C1C] font-light ${className ?? ''}`}
  >
    {children}
  </span>
);

interface LabelsShape {
  saveTheDate: string;
  ourStory: string;
  countdown: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  locations: string;
  program: string;
  dressCode: string;
  gifts: string;
  parents: string;
  accommodation: string;
  rsvp: string;
  rsvpCta: string;
  rsvpNote: string;
  poweredBy: string;
  and: string;
  viewMap: string;
  pastEvent: string;
}

const labels: Record<'en' | 'es', LabelsShape> = {
  en: {
    saveTheDate: 'Save the Date',
    ourStory: 'Our Story',
    countdown: 'Countdown',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Locations',
    program: 'Program',
    dressCode: 'Dress Code',
    gifts: 'Gift Registry',
    parents: 'Parents',
    accommodation: 'Accommodation',
    rsvp: 'RSVP',
    rsvpCta: 'Confirm Attendance',
    rsvpNote: 'We look forward to celebrating with you',
    poweredBy: 'Powered by Deer Planner',
    and: '&',
    viewMap: 'View on Map',
    pastEvent: 'The day has arrived',
  },
  es: {
    saveTheDate: 'Reservá la Fecha',
    ourStory: 'Nuestra Historia',
    countdown: 'Cuenta Regresiva',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Ubicaciones',
    program: 'Programa',
    dressCode: 'Vestimenta',
    gifts: 'Mesa de Regalos',
    parents: 'Padres',
    accommodation: 'Alojamiento',
    rsvp: 'RSVP',
    rsvpCta: 'Confirmar Asistencia',
    rsvpNote: 'Esperamos celebrar con vos',
    poweredBy: 'Con la tecnología de Deer Planner',
    and: 'y',
    viewMap: 'Ver en Mapa',
    pastEvent: 'Llegó el gran día',
  },
};

function parseIsoDate(iso: string): Date | null {
  const parts = iso.split('-').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatEventDate(iso: string, locale: 'en' | 'es'): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function diffParts(targetIso: string, now: Date): CountdownParts {
  const target = parseIsoDate(targetIso);
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0).getTime();
  const diff = targetMidnight - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isPast: false };
}

const pad = (n: number): string => n.toString().padStart(2, '0');

const FONT_LINKS = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link
      href="https://fonts.googleapis.com/css2?family=Italiana&family=Work+Sans:wght@300;400;500&display=swap"
      rel="stylesheet"
    />
  </>
);

const TEMPLATE_STYLES = `
  @keyframes pampas-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .pampas-anim { animation: pampas-fade-up 900ms ease-out both; }
  .pampas-anim-delay-1 { animation-delay: 140ms; }
  .pampas-anim-delay-2 { animation-delay: 280ms; }
  .pampas-anim-delay-3 { animation-delay: 420ms; }
  html { scroll-behavior: smooth; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .pampas-anim { animation: none; }
    .pampas-btn { transition: none !important; }
  }
`;

const PampasTemplate: React.FC<PublicInvitationPageProps> = (props) => {
  const {
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
  } = props;

  const t = labels[locale] ?? labels.en;
  const hasHero = Boolean(heroImageUrl);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = useMemo(() => diffParts(eventDate, now), [eventDate, now]);
  const formattedDate = useMemo(() => formatEventDate(eventDate, locale), [eventDate, locale]);

  return (
    <div
      className="min-h-screen w-full bg-[#F7F2E8] text-[#3E2C1C] antialiased"
      style={{ fontFamily: '"Work Sans", system-ui, sans-serif' }}
    >
      {FONT_LINKS}
      <style>{TEMPLATE_STYLES}</style>

      <main>
        {/* HERO */}
        <header className="relative overflow-hidden">
          <div
            className="absolute inset-0 z-0 bg-gradient-to-b from-[#F7F2E8] via-[#F7F2E8] to-[#E8DFCE]"
            aria-hidden="true"
          />

          {/* Pampas silhouettes flanking */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden h-full w-32 opacity-90 md:block lg:w-44">
            <PampasSilhouette variant="left" className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden h-full w-32 opacity-90 md:block lg:w-44">
            <PampasSilhouette variant="right" className="h-full w-full" />
          </div>

          <div className="relative z-20 mx-auto flex min-h-[88vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
            <div className="pampas-anim">
              <SectionLabel>{t.saveTheDate}</SectionLabel>
            </div>

            <div className="mt-12 pampas-anim pampas-anim-delay-1">
              <h1
                className="text-6xl leading-[1.05] tracking-[0.2em] text-[#3E2C1C] sm:text-7xl md:text-[5.5rem]"
                style={{ fontFamily: 'Italiana, serif' }}
              >
                {partner1Name}
              </h1>
              <span
                className="my-4 block text-3xl italic text-[#C19A6B] sm:text-4xl"
                style={{ fontFamily: 'Italiana, serif' }}
                aria-hidden="true"
              >
                {t.and}
              </span>
              <h1
                className="text-6xl leading-[1.05] tracking-[0.2em] text-[#3E2C1C] sm:text-7xl md:text-[5.5rem]"
                style={{ fontFamily: 'Italiana, serif' }}
              >
                {partner2Name}
              </h1>
            </div>

            <div className="mt-14 pampas-anim pampas-anim-delay-2 flex flex-col items-center gap-5">
              <div className="h-px w-20 bg-[#C19A6B]/70" aria-hidden="true" />
              <p className="text-sm uppercase tracking-[0.45em] text-[#3E2C1C]/85">
                {formattedDate}
              </p>
              <div className="h-px w-20 bg-[#C19A6B]/70" aria-hidden="true" />
            </div>

            {(landingTitle || landingSubtitle) && (
              <div className="mt-12 pampas-anim pampas-anim-delay-3 max-w-md">
                {landingTitle && (
                  <p
                    className="text-2xl tracking-[0.1em] text-[#3E2C1C] sm:text-3xl"
                    style={{ fontFamily: 'Italiana, serif' }}
                  >
                    {landingTitle}
                  </p>
                )}
                {landingSubtitle && (
                  <p className="mt-3 text-sm leading-relaxed text-[#3E2C1C]/70">
                    {landingSubtitle}
                  </p>
                )}
              </div>
            )}

            {hasHero && (
              <div className="mt-14 bg-white p-2 shadow-[0_4px_16px_rgba(62,44,28,0.08)]">
                <img
                  src={heroImageUrl ?? ''}
                  alt={`${partner1Name} ${t.and} ${partner2Name}`}
                  loading="eager"
                  className="max-h-[42vh] w-auto max-w-full object-cover"
                />
              </div>
            )}
          </div>
        </header>

        {/* STORY */}
        {story?.body && (
          <section className="relative px-6 py-24 sm:py-32">
            <div className="pointer-events-none absolute -left-2 top-16 hidden h-56 w-20 opacity-50 md:block">
              <PampasSilhouette variant="corner-tl" className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute -right-2 bottom-16 hidden h-56 w-20 opacity-50 md:block">
              <PampasSilhouette variant="corner-br" className="h-full w-full" />
            </div>

            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel>{t.ourStory}</SectionLabel>
              <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
              <p className="whitespace-pre-line text-base leading-[1.95] text-[#3E2C1C]/85 sm:text-lg">
                {story.body}
              </p>
            </div>
          </section>
        )}

        <HairlineRule className="mx-auto max-w-4xl" />

        {/* COUNTDOWN */}
        <section className="px-6 py-24 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>{t.countdown}</SectionLabel>
            <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />

            {countdown.isPast ? (
              <p
                className="text-3xl tracking-[0.12em] text-[#3E2C1C] sm:text-4xl"
                style={{ fontFamily: 'Italiana, serif' }}
              >
                {formattedDate} — {t.pastEvent}
              </p>
            ) : (
              <div
                className="flex items-start justify-center gap-3 sm:gap-6"
                role="timer"
                aria-live="polite"
                aria-label={t.countdown}
              >
                {[
                  { value: countdown.days, label: t.days },
                  { value: countdown.hours, label: t.hours },
                  { value: countdown.minutes, label: t.minutes },
                  { value: countdown.seconds, label: t.seconds },
                ].map((unit, i) => (
                  <div key={unit.label} className="flex items-start gap-3 sm:gap-6">
                    <div className="flex min-w-[3.5rem] flex-col items-center sm:min-w-[5rem]">
                      <span
                        className="text-5xl leading-none tracking-[0.1em] text-[#3E2C1C] sm:text-7xl"
                        style={{ fontFamily: 'Italiana, serif' }}
                      >
                        {pad(unit.value)}
                      </span>
                      <span className="mt-3 text-[10px] uppercase tracking-[0.4em] text-[#3E2C1C]/70 sm:text-[11px]">
                        {unit.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <span
                        className="pt-2 text-2xl text-[#C19A6B] sm:pt-3 sm:text-4xl"
                        style={{ fontFamily: 'Italiana, serif' }}
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {locations.length > 0 && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />

            {/* LOCATIONS */}
            <section className="px-6 py-24 sm:py-28">
              <div className="mx-auto max-w-5xl">
                <div className="mb-16 text-center">
                  <SectionLabel>{t.locations}</SectionLabel>
                  <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                </div>

                <div className="grid gap-14 md:grid-cols-2 md:gap-x-20 md:gap-y-20">
                  {locations.map((loc) => (
                    <article key={`${loc.label}-${loc.name}`} className="text-center md:text-left">
                      <SectionLabel>{loc.label}</SectionLabel>
                      <h3
                        className="mt-4 text-3xl tracking-[0.08em] text-[#3E2C1C] sm:text-4xl"
                        style={{ fontFamily: 'Italiana, serif' }}
                      >
                        {loc.name}
                      </h3>
                      <div className="mt-6 space-y-1 text-sm text-[#3E2C1C]/75">
                        {loc.time && (
                          <p className="font-medium tracking-wide text-[#3E2C1C]">{loc.time}</p>
                        )}
                        {loc.address && <p>{loc.address}</p>}
                        {loc.city && <p>{loc.city}</p>}
                      </div>
                      {loc.mapsLink && (
                        <a
                          href={loc.mapsLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-6 inline-flex items-center gap-2 border-b border-[#C19A6B] pb-0.5 text-[11px] uppercase tracking-[0.35em] text-[#3E2C1C] transition-colors hover:text-[#C19A6B]"
                        >
                          {t.viewMap}
                          <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {program.days.length > 0 && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />

            {/* PROGRAM */}
            <section className="px-6 py-24 sm:py-28">
              <div className="mx-auto max-w-3xl">
                <div className="mb-16 text-center">
                  <SectionLabel>{t.program}</SectionLabel>
                  <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                </div>

                <div className="space-y-16">
                  {program.days.map((day, idx) => (
                    <article key={`${day.label ?? ''}-${idx}`}>
                      <header className="mb-8 text-center md:text-left">
                        {day.label && <SectionLabel>{day.label}</SectionLabel>}
                        {day.date && (
                          <h3
                            className="mt-3 text-3xl tracking-[0.08em] text-[#3E2C1C] sm:text-4xl"
                            style={{ fontFamily: 'Italiana, serif' }}
                          >
                            {formatEventDate(day.date, locale)}
                          </h3>
                        )}
                      </header>

                      <ol className="space-y-8">
                        {day.items.map((item, i) => (
                          <li
                            key={`${item.time}-${i}`}
                            className="grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-1 border-b border-[#C19A6B]/15 pb-6 last:border-b-0 last:pb-0"
                          >
                            <span
                              className="pt-1 text-sm tracking-[0.25em] text-[#C19A6B]"
                              style={{ fontFamily: 'Italiana, serif' }}
                            >
                              {item.time}
                            </span>
                            <div>
                              <h4
                                className="text-xl tracking-[0.05em] text-[#3E2C1C]"
                                style={{ fontFamily: 'Italiana, serif' }}
                              >
                                {item.title}
                              </h4>
                              {item.detail && (
                                <p className="mt-2 text-sm leading-relaxed text-[#3E2C1C]/75">
                                  {item.detail}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* DRESS CODE */}
        {dressCode && dressCode.entries.length > 0 && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />
            <section className="px-6 py-24 sm:py-28">
              <div className="mx-auto max-w-3xl text-center">
                <SectionLabel>{t.dressCode}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                <div className="grid gap-12 sm:grid-cols-2">
                  {dressCode.entries.map((entry) => (
                    <article key={entry.title} className="text-center">
                      <h3
                        className="text-2xl tracking-[0.08em] text-[#3E2C1C]"
                        style={{ fontFamily: 'Italiana, serif' }}
                      >
                        {entry.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#3E2C1C]/75">
                        {entry.body}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* GIFT REGISTRY */}
        {giftRegistry?.body && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />
            <section className="px-6 py-24 sm:py-28">
              <div className="mx-auto max-w-2xl text-center">
                <SectionLabel>{t.gifts}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                <p className="whitespace-pre-line text-base leading-[1.95] text-[#3E2C1C]/85">
                  {giftRegistry.body}
                </p>
              </div>
            </section>
          </>
        )}

        {/* PARENTS */}
        {parents?.body && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />
            <section className="px-6 py-24 sm:py-28">
              <div className="mx-auto max-w-2xl text-center">
                <SectionLabel>{t.parents}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                <p className="whitespace-pre-line text-base leading-[1.95] text-[#3E2C1C]/85">
                  {parents.body}
                </p>
              </div>
            </section>
          </>
        )}

        {/* ACCOMMODATION */}
        {accommodation?.body && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />
            <section className="px-6 py-24 sm:py-28">
              <div className="mx-auto max-w-2xl text-center">
                <SectionLabel>{t.accommodation}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                <p className="whitespace-pre-line text-base leading-[1.95] text-[#3E2C1C]/85">
                  {accommodation.body}
                </p>
              </div>
            </section>
          </>
        )}

        {/* RSVP */}
        {rsvpEnabled && (
          <>
            <HairlineRule className="mx-auto max-w-4xl" />
            <section className="px-6 py-24 sm:py-32">
              <div className="mx-auto max-w-xl text-center">
                <SectionLabel>{t.rsvp}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#C19A6B]/60" aria-hidden="true" />
                <p
                  className="text-3xl tracking-[0.1em] text-[#3E2C1C] sm:text-4xl"
                  style={{ fontFamily: 'Italiana, serif' }}
                >
                  {t.rsvpNote}
                </p>
              </div>
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer className="px-6 pb-12 pt-8">
          <HairlineRule className="mx-auto mb-8 max-w-4xl" />
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-[#3E2C1C]/60">
            {t.poweredBy}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PampasTemplate;