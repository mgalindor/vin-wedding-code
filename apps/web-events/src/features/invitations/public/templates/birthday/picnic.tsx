/**
 * Picnic — Summer Picnic Birthday Template
 *
 * A casual outdoor birthday invitation (ages 25–40) built around a
 * gingham-checked peach + mint palette, rounded Quicksand typography
 * and waving pennant bunting flags. Designed to feel like a sunny
 * summer afternoon with friends, blankets on the grass, fresh fruit
 * and a string of pennants snapping in the breeze.
 *
 * Palette (use these EXACT hex values):
 *   Peach:           #FFB997
 *   Mint:            #A8DADC
 *   Bone white:      #F1FAEE
 *   Bunting red:     #E63946
 *   Navy text:       #1D3557
 *
 * Typography:
 *   Display (h1/h2):  Quicksand  (loaded via Google Fonts <link>)
 *   Body / UI:        Nunito     (loaded via Google Fonts <link>)
 *
 * Aesthetic accents:
 *   - 5–7 inline SVG pennant flags strung on a softly drooping line,
 *     each waving on a staggered 3s loop (±5° rotation around its top).
 *   - Subtle gingham pattern (peach over bone white) layered at low
 *     opacity behind select sections via repeating-linear-gradient.
 *   - "Ticket-stub" cards for Locations / Program items with a
 *     perforated left edge (bone-white circles bleeding off the side).
 *   - Round mint-bordered age badge front-and-centre in the hero.
 *   - Soft organic shadows: 0 6px 16px rgba(29, 53, 87, 0.08).
 *   - Section labels in uppercase, 0.3em letter-spacing, navy, with a
 *     small watermelon-slice or cherry SVG accent.
 *   - All looping motion respects prefers-reduced-motion.
 */

import React, { useEffect, useMemo, useState } from 'react';

export interface PublicInvitationPageProps {
  honoreeName: string;
  ageTurning?: number | null;
  eventDate: string;
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

function parseIsoDate(iso: string): Date | null {
  const parts = iso.split('-').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) return null;
  return new Date(y, m - 1, d);
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
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    0,
    0,
    0,
  ).getTime();
  const diff = targetMidnight - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isPast: false };
}

const pad = (n: number): string => n.toString().padStart(2, '0');

interface LabelsShape {
  saveTheDate: string;
  turning: string;
  ourStory: string;
  countdown: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  locations: string;
  program: string;
  rsvp: string;
  rsvpCta: string;
  rsvpNote: string;
  poweredBy: string;
  viewMap: string;
  pastEvent: string;
}

const labels: Record<'en' | 'es', LabelsShape> = {
  en: {
    saveTheDate: "You're Invited",
    turning: 'Turning',
    ourStory: 'The Story',
    countdown: 'Countdown',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Where',
    program: 'The Day',
    rsvp: 'RSVP',
    rsvpCta: "I'll be there",
    rsvpNote: 'Pack a blanket and your appetite — see you on the grass.',
    poweredBy: 'Made with Deer Planner',
    viewMap: 'Open in Maps',
    pastEvent: 'The party has begun!',
  },
  es: {
    saveTheDate: 'Estás Invitado',
    turning: 'Cumple',
    ourStory: 'La Historia',
    countdown: 'Cuenta Regresiva',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Dónde',
    program: 'El Día',
    rsvp: 'RSVP',
    rsvpCta: 'Allí estaré',
    rsvpNote: 'Llevá una manta y buen apetito — nos vemos en el césped.',
    poweredBy: 'Hecho con Deer Planner',
    viewMap: 'Abrir en Mapa',
    pastEvent: '¡La fiesta ya empezó!',
  },
};

const FONT_LINKS = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link
      href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Nunito:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </>
);

const TEMPLATE_STYLES = `
  @keyframes picnic-pennant-wave {
    0%, 100% { transform: rotate(-5deg); }
    50%      { transform: rotate(5deg); }
  }
  @keyframes picnic-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .picnic-pennant {
    animation: picnic-pennant-wave 3s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: 50% 0%;
  }
  .picnic-fade-up { animation: picnic-fade-up 800ms ease-out both; }
  .picnic-fade-up-1 { animation-delay: 140ms; }
  .picnic-fade-up-2 { animation-delay: 280ms; }
  .picnic-fade-up-3 { animation-delay: 420ms; }
  .picnic-gingham {
    background-color: transparent;
    background-image:
      repeating-linear-gradient(
        0deg,
        rgba(255, 185, 151, 0.22) 0px,
        rgba(255, 185, 151, 0.22) 1.5px,
        transparent 1.5px,
        transparent 14px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255, 185, 151, 0.22) 0px,
        rgba(255, 185, 151, 0.22) 1.5px,
        transparent 1.5px,
        transparent 14px
      );
  }
  .picnic-rsvp-btn {
    transition: transform 220ms ease-out, box-shadow 220ms ease-out, background-color 220ms ease-out;
  }
  .picnic-rsvp-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 26px rgba(255, 185, 151, 0.55);
  }
  @media (prefers-reduced-motion: reduce) {
    .picnic-pennant { animation: none; }
    .picnic-fade-up,
    .picnic-fade-up-1,
    .picnic-fade-up-2,
    .picnic-fade-up-3 { animation: none; }
    .picnic-rsvp-btn { transition: none; }
    .picnic-rsvp-btn:hover { transform: none; box-shadow: none; }
  }
`;

const PENNANT_COLORS = ['#FFB997', '#A8DADC', '#E63946', '#FFB997', '#A8DADC', '#E63946', '#FFB997'];
const PENNANT_X = [80, 220, 360, 500, 640, 780, 920];

const Bunting: React.FC = () => (
  <svg
    viewBox="0 0 1000 80"
    preserveAspectRatio="none"
    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 w-full picnic-fade-up"
    aria-hidden="true"
  >
    <path
      d="M 0 24 Q 500 60 1000 24"
      stroke="#1D3557"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.55"
    />
    {PENNANT_X.map((x, i) => {
      const t = x / 1000;
      const y = (1 - t) * (1 - t) * 24 + 2 * (1 - t) * t * 60 + t * t * 24;
      const baseY = Math.round(y * 10) / 10;
      return (
        <polygon
          key={x}
          points={`${x},${baseY} ${x + 40},${baseY} ${x + 20},${baseY + 36}`}
          fill={PENNANT_COLORS[i % PENNANT_COLORS.length]}
          className="picnic-pennant"
          style={{ animationDelay: `${i * 0.32}s` }}
        />
      );
    })}
  </svg>
);

const WatermelonAccent: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M 2 16 A 10 10 0 0 1 22 16 Z" fill="#FFB997" />
    <path d="M 4 15 A 8 8 0 0 1 20 15 Z" fill="#E63946" />
    <path d="M 6 14 A 6 6 0 0 1 18 14 Z" fill="#F1FAEE" opacity="0.22" />
    <ellipse cx="9" cy="11.5" rx="0.7" ry="1.1" fill="#1D3557" transform="rotate(-25 9 11.5)" />
    <ellipse cx="12" cy="12.5" rx="0.7" ry="1.1" fill="#1D3557" />
    <ellipse cx="15" cy="11.5" rx="0.7" ry="1.1" fill="#1D3557" transform="rotate(25 15 11.5)" />
  </svg>
);

const CherryAccent: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="9" cy="17" r="4.5" fill="#E63946" />
    <circle cx="16" cy="18" r="4.5" fill="#E63946" />
    <circle cx="7.4" cy="15.6" r="1" fill="#F1FAEE" opacity="0.65" />
    <circle cx="14.4" cy="16.6" r="1" fill="#F1FAEE" opacity="0.65" />
    <path
      d="M 9.2 12.6 Q 11 7 14 5"
      stroke="#A8DADC"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M 16.2 13.6 Q 17 9 18 6"
      stroke="#A8DADC"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="14.4" cy="4.6" rx="2.6" ry="1.3" fill="#A8DADC" transform="rotate(-22 14.4 4.6)" />
  </svg>
);

interface SectionLabelProps {
  children: React.ReactNode;
  accent?: 'watermelon' | 'cherry';
  className?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ children, accent = 'watermelon', className }) => {
  const Accent = accent === 'cherry' ? CherryAccent : WatermelonAccent;
  return (
    <span
      className={`inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1D3557] ${className ?? ''}`}
    >
      <Accent className="h-4 w-4" />
      {children}
    </span>
  );
};

interface AgeBadgeProps {
  age: number;
  label: string;
}

const AgeBadge: React.FC<AgeBadgeProps> = ({ age, label }) => (
  <div className="mt-8 flex flex-col items-center gap-2">
    <div className="flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-[#A8DADC] bg-[#F1FAEE] shadow-[0_6px_16px_rgba(29,53,87,0.08)]">
      <span
        className="text-5xl font-bold leading-none text-[#1D3557]"
        style={{ fontFamily: '"Quicksand", sans-serif' }}
      >
        {age}
      </span>
    </div>
    <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#1D3557]/70">
      {label}
    </span>
  </div>
);

interface TicketStubProps {
  children: React.ReactNode;
  tone: 'peach' | 'mint';
  className?: string;
}

const TicketStub: React.FC<TicketStubProps> = ({ children, tone, className }) => {
  const toneClass = tone === 'peach' ? 'bg-[#FFB997]' : 'bg-[#A8DADC]';
  return (
    <div
      className={`relative rounded-2xl ${toneClass} shadow-[0_6px_16px_rgba(29,53,87,0.08)] ${className ?? ''}`}
    >
      {[22, 50, 78].map((pct) => (
        <span
          key={pct}
          aria-hidden="true"
          className="absolute left-0 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[#F1FAEE]"
          style={{ top: `${pct}%` }}
        />
      ))}
      <div className="px-7 py-6">{children}</div>
    </div>
  );
};

const PicnicTemplate: React.FC<PublicInvitationPageProps> = (props) => {
  const {
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
  } = props;

  const t = labels[locale] ?? labels.en;

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = useMemo(() => diffParts(eventDate, now), [eventDate, now]);
  const formattedDate = useMemo(() => formatEventDate(eventDate, locale), [eventDate, locale]);

  const countdownUnits: Array<{ value: number; label: string; tone: 'peach' | 'mint' }> = [
    { value: countdown.days, label: t.days, tone: 'peach' },
    { value: countdown.hours, label: t.hours, tone: 'mint' },
    { value: countdown.minutes, label: t.minutes, tone: 'peach' },
    { value: countdown.seconds, label: t.seconds, tone: 'mint' },
  ];

  return (
    <div
      className="min-h-screen w-full bg-[#F1FAEE] text-[#1D3557] antialiased"
      style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
    >
      {FONT_LINKS}
      <style>{TEMPLATE_STYLES}</style>

      <main>
        {/* HERO */}
        <header className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#FFB997] via-[#FFB997]/85 to-[#F1FAEE]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 picnic-gingham opacity-40" aria-hidden="true" />
          <Bunting />

          <div className="relative z-20 mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:pt-32">
            <div className="picnic-fade-up">
              <SectionLabel accent="watermelon">{t.saveTheDate}</SectionLabel>
            </div>

            <h1
              className="picnic-fade-up picnic-fade-up-1 mt-8 text-6xl font-bold leading-[1.05] text-[#1D3557] sm:text-7xl md:text-[6rem]"
              style={{ fontFamily: '"Quicksand", sans-serif' }}
            >
              {honoreeName}
            </h1>

            {ageTurning != null && (
              <div className="picnic-fade-up picnic-fade-up-2">
                <AgeBadge age={ageTurning} label={t.turning} />
              </div>
            )}

            <div className="picnic-fade-up picnic-fade-up-2 mt-10 flex items-center gap-4">
              <span className="h-px w-12 bg-[#1D3557]/30" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1D3557]/85">
                {formattedDate}
              </p>
              <span className="h-px w-12 bg-[#1D3557]/30" aria-hidden="true" />
            </div>

            {(landingTitle || landingSubtitle) && (
              <div className="picnic-fade-up picnic-fade-up-3 mt-10 max-w-md">
                {landingTitle && (
                  <p
                    className="text-2xl font-semibold text-[#1D3557] sm:text-3xl"
                    style={{ fontFamily: '"Quicksand", sans-serif' }}
                  >
                    {landingTitle}
                  </p>
                )}
                {landingSubtitle && (
                  <p className="mt-3 text-base leading-relaxed text-[#1D3557]/75">
                    {landingSubtitle}
                  </p>
                )}
              </div>
            )}

            {heroImageUrl && (
              <div className="picnic-fade-up picnic-fade-up-3 mt-12 overflow-hidden rounded-3xl border-[6px] border-white shadow-[0_6px_16px_rgba(29,53,87,0.08)]">
                <img
                  src={heroImageUrl}
                  alt={honoreeName}
                  loading="eager"
                  className="block max-h-[44vh] w-auto max-w-full object-cover"
                />
              </div>
            )}
          </div>
        </header>

        {/* STORY */}
        {story?.body && (
          <section className="relative px-6 py-24 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <SectionLabel accent="cherry">{t.ourStory}</SectionLabel>
              <div className="mx-auto my-8 h-px w-16 bg-[#1D3557]/20" aria-hidden="true" />
              <p className="whitespace-pre-line text-base leading-[1.95] text-[#1D3557]/85 sm:text-lg">
                {story.body}
              </p>
            </div>
          </section>
        )}

        {/* COUNTDOWN */}
        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel accent="watermelon">{t.countdown}</SectionLabel>
            <div className="mx-auto my-8 h-px w-16 bg-[#1D3557]/20" aria-hidden="true" />

            {countdown.isPast ? (
              <p
                className="text-3xl font-semibold text-[#1D3557] sm:text-4xl"
                style={{ fontFamily: '"Quicksand", sans-serif' }}
              >
                {formattedDate} — {t.pastEvent}
              </p>
            ) : (
              <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"
                role="timer"
                aria-live="polite"
                aria-label={t.countdown}
              >
                {countdownUnits.map((unit) => (
                  <div
                    key={unit.label}
                    className={`flex flex-col items-center justify-center rounded-2xl py-6 shadow-[0_6px_16px_rgba(29,53,87,0.08)] ${
                      unit.tone === 'peach' ? 'bg-[#FFB997]' : 'bg-[#A8DADC]'
                    }`}
                  >
                    <span
                      className="text-4xl font-bold leading-none text-[#1D3557] sm:text-5xl"
                      style={{ fontFamily: '"Quicksand", sans-serif' }}
                    >
                      {pad(unit.value)}
                    </span>
                    <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1D3557]/80 sm:text-[11px]">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* LOCATIONS */}
        {locations.length > 0 && (
          <section className="relative px-6 py-20 sm:py-24">
            <div
              className="pointer-events-none absolute inset-0 picnic-gingham opacity-30"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-5xl">
              <div className="mb-14 text-center">
                <SectionLabel accent="cherry">{t.locations}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#1D3557]/20" aria-hidden="true" />
              </div>

              <div className="grid gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12">
                {locations.map((loc, i) => (
                  <TicketStub
                    key={`${loc.label}-${loc.name}`}
                    tone={i % 2 === 0 ? 'peach' : 'mint'}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#1D3557]/80">
                      {loc.label}
                    </p>
                    <h3
                      className="mt-2 text-2xl font-semibold text-[#1D3557] sm:text-3xl"
                      style={{ fontFamily: '"Quicksand", sans-serif' }}
                    >
                      {loc.name}
                    </h3>
                    <div className="mt-4 space-y-1 text-sm text-[#1D3557]/85">
                      {loc.time && (
                        <p className="font-semibold tracking-wide text-[#1D3557]">{loc.time}</p>
                      )}
                      {loc.address && <p>{loc.address}</p>}
                      {loc.city && <p>{loc.city}</p>}
                    </div>
                    {loc.mapsLink && (
                      <a
                        href={loc.mapsLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-[#1D3557] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1D3557] transition-colors duration-200 hover:bg-[#1D3557] hover:text-[#F1FAEE]"
                      >
                        {t.viewMap}
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </TicketStub>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PROGRAM */}
        {program.days.length > 0 && (
          <section className="px-6 py-20 sm:py-24">
            <div className="mx-auto max-w-3xl">
              <div className="mb-14 text-center">
                <SectionLabel accent="watermelon">{t.program}</SectionLabel>
                <div className="mx-auto my-8 h-px w-16 bg-[#1D3557]/20" aria-hidden="true" />
              </div>

              <div className="space-y-14">
                {program.days.map((day, idx) => (
                  <article key={`${day.label ?? ''}-${idx}`}>
                    <header className="mb-6 text-center md:text-left">
                      {day.label && <SectionLabel accent="cherry">{day.label}</SectionLabel>}
                      {day.date && (
                        <h3
                          className="mt-3 text-2xl font-semibold text-[#1D3557] sm:text-3xl"
                          style={{ fontFamily: '"Quicksand", sans-serif' }}
                        >
                          {formatEventDate(day.date, locale)}
                        </h3>
                      )}
                    </header>

                    <ol className="space-y-5">
                      {day.items.map((item, i) => (
                        <li key={`${item.time}-${i}`}>
                          <TicketStub tone={i % 2 === 0 ? 'mint' : 'peach'}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                              <span
                                className="shrink-0 text-sm font-semibold uppercase tracking-[0.25em] text-[#1D3557]"
                                style={{ fontFamily: '"Quicksand", sans-serif' }}
                              >
                                {item.time}
                              </span>
                              <div className="flex-1">
                                <h4
                                  className="text-lg font-semibold text-[#1D3557] sm:text-xl"
                                  style={{ fontFamily: '"Quicksand", sans-serif' }}
                                >
                                  {item.title}
                                </h4>
                                {item.detail && (
                                  <p className="mt-2 text-sm leading-relaxed text-[#1D3557]/80">
                                    {item.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TicketStub>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RSVP */}
        {rsvpEnabled && (
          <section className="relative px-6 py-24 sm:py-28">
            <div className="absolute inset-0 picnic-gingham opacity-30" aria-hidden="true" />
            <div className="relative mx-auto max-w-xl text-center">
              <SectionLabel accent="cherry">{t.rsvp}</SectionLabel>
              <div className="mx-auto my-8 h-px w-16 bg-[#1D3557]/20" aria-hidden="true" />
              <p
                className="text-2xl font-semibold leading-relaxed text-[#1D3557] sm:text-3xl"
                style={{ fontFamily: '"Quicksand", sans-serif' }}
              >
                {t.rsvpNote}
              </p>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="px-6 pb-10 pt-8">
          <div
            className="mx-auto mb-6 h-px max-w-md bg-[#1D3557]/15"
            aria-hidden="true"
          />
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#1D3557]/55">
            {t.poweredBy}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PicnicTemplate;