/**
 * SunsetTemplate — Deer Planner wedding invitation template.
 *
 * Visual concept
 * --------------
 * Warmth of golden hour. A backlit hero (or a peach → golden orange → gold →
 * deep teal gradient fallback) frames the couple's names in white Playfair
 * Display with a soft warm text-shadow. Following sections bloom on soft
 * peach → gold gradients with translucent gold circles breathing in the
 * background — evoking the romantic last-light of a beach or vineyard
 * wedding.
 *
 * Palette (exact hex)
 * -------------------
 *   Golden orange   #F4A261    — accents / CTA / sunset horizon
 *   Gold            #E9C46A    — borders / sun glyph / accents
 *   Light peach     #F7E1B5    — section backgrounds / peach overlay
 *   Deep teal-green #264653    — body text / labels / footer
 *
 * Typography
 * ----------
 *   Display (h1/h2) — Playfair Display, weights 400–700
 *   Body / UI       — Quicksand,        weights 300–700
 *   Both loaded via Google Fonts; <link> tags are hoisted to <head> by
 *   React 19 (deduplicated automatically).
 *
 * Motion philosophy: subtle. Floating gold circles breathe (scale only);
 * section content fades in on mount. All motion is gated by
 * `prefers-reduced-motion`.
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

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

const labels = {
  en: {
    coupleSeparator: '&',
    saveTheDate: 'Save the date',
    scroll: 'scroll',
    story: 'Our story',
    countdown: 'Counting the days',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Where to find us',
    program: 'The day',
    dressCode: 'Dress code',
    giftRegistry: 'Gift registry',
    parents: 'With the blessing of our families',
    accommodation: 'Where to stay',
    rsvp: 'Confirm attendance',
    footer: 'Made with love on',
    brand: 'Deer Planner',
    viewOnMap: 'Open in Maps',
    noAddress: 'Address coming soon',
  },
  es: {
    coupleSeparator: 'y',
    saveTheDate: 'Reserva la fecha',
    scroll: 'desliza',
    story: 'Nuestra historia',
    countdown: 'Cuenta regresiva',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Dónde encontrarnos',
    program: 'El gran día',
    dressCode: 'Código de vestimenta',
    giftRegistry: 'Mesa de regalos',
    parents: 'Con la bendición de nuestras familias',
    accommodation: 'Dónde hospedarse',
    rsvp: 'Confirmar asistencia',
    footer: 'Hecho con amor en',
    brand: 'Deer Planner',
    viewOnMap: 'Abrir en Maps',
    noAddress: 'Dirección próximamente',
  },
} as const;

type Locale = keyof typeof labels;
type Labels = (typeof labels)[Locale];

const MOTION_CSS = `
  @keyframes sunset-breathe {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.14); }
  }
  @keyframes sunset-rise {
    0%   { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .sunset-breathe { animation: sunset-breathe 8s ease-in-out infinite; }
  .sunset-rise    { animation: sunset-rise 1.4s ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .sunset-breathe,
    .sunset-rise {
      animation: none !important;
    }
  }
`;

function formatLongDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatWeekdayDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function diff(target: Date, now: Date): Countdown {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

interface GoldCirclesProps {
  variant: 'hero' | 'soft' | 'program';
}

function GoldCircles({ variant }: GoldCirclesProps): ReactElement {
  const circles: Array<{
    color: string;
    opacity: number;
    size: number;
    style: CSSProperties;
  }> =
    variant === 'hero'
      ? [
          {
            color: '#F4A261',
            opacity: 0.2,
            size: 360,
            style: { top: '-90px', left: '-100px' },
          },
          {
            color: '#E9C46A',
            opacity: 0.16,
            size: 240,
            style: { bottom: '8%', right: '-80px' },
          },
          {
            color: '#F7E1B5',
            opacity: 0.2,
            size: 160,
            style: { top: '32%', right: '16%' },
          },
          {
            color: '#F4A261',
            opacity: 0.12,
            size: 110,
            style: { bottom: '20%', left: '12%' },
          },
        ]
      : variant === 'soft'
        ? [
            {
              color: '#E9C46A',
              opacity: 0.16,
              size: 280,
              style: { top: '-60px', right: '-60px' },
            },
            {
              color: '#F4A261',
              opacity: 0.12,
              size: 200,
              style: { bottom: '-80px', left: '-40px' },
            },
            {
              color: '#E9C46A',
              opacity: 0.1,
              size: 120,
              style: { top: '40%', left: '6%' },
            },
          ]
        : [
            {
              color: '#F4A261',
              opacity: 0.14,
              size: 220,
              style: { top: '-50px', left: '-50px' },
            },
            {
              color: '#E9C46A',
              opacity: 0.12,
              size: 180,
              style: { bottom: '-40px', right: '-30px' },
            },
          ];
  return (
    <>
      {circles.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="sunset-breathe pointer-events-none absolute rounded-full"
          style={{
            width: `${c.size}px`,
            height: `${c.size}px`,
            background: `radial-gradient(circle, ${c.color} 0%, transparent 70%)`,
            opacity: c.opacity,
            animationDelay: `${i * 1.4}s`,
            ...c.style,
          }}
        />
      ))}
    </>
  );
}

interface SunGlyphProps {
  size?: number;
  className?: string;
}

function SunGlyph({ size = 28, className }: SunGlyphProps): ReactElement {
  const gradId = `sun-core-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F7E1B5" />
          <stop offset="100%" stopColor="#E9C46A" />
        </radialGradient>
      </defs>
      <g stroke="#E9C46A" strokeWidth={2.5} strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="13" />
        <line x1="32" y1="51" x2="32" y2="60" />
        <line x1="4" y1="32" x2="13" y2="32" />
        <line x1="51" y1="32" x2="60" y2="32" />
        <line x1="12" y1="12" x2="18.5" y2="18.5" />
        <line x1="45.5" y1="45.5" x2="52" y2="52" />
        <line x1="12" y1="52" x2="18.5" y2="45.5" />
        <line x1="45.5" y1="18.5" x2="52" y2="12" />
      </g>
      <circle cx="32" cy="32" r="11.5" fill={`url(#${gradId})`} />
    </svg>
  );
}

interface SectionLabelProps {
  children: ReactNode;
}

function SectionLabel({ children }: SectionLabelProps): ReactElement {
  return (
    <h2 className="mb-10 text-center font-medium uppercase tracking-[0.3em] text-xs sm:text-sm text-[#264653] sm:mb-14">
      <span className="inline-flex items-center gap-3">
        <span aria-hidden="true" className="block h-px w-8 bg-[#E9C46A]" />
        {children}
        <span aria-hidden="true" className="block h-px w-8 bg-[#E9C46A]" />
      </span>
    </h2>
  );
}

interface CountdownBlockProps {
  value: number;
  label: string;
}

function CountdownBlock({ value, label }: CountdownBlockProps): ReactElement {
  return (
    <div className="flex min-w-[64px] flex-col items-center sm:min-w-[88px]">
      <span className="font-['Playfair_Display',serif] text-5xl sm:text-6xl md:text-7xl leading-none tabular-nums text-[#264653]">
        {pad2(value)}
      </span>
      <span className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[#264653]/70 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

interface LocationCardProps {
  entry: PublicInvitationPageProps['locations'][number];
  labels: Labels;
}

function LocationCard({ entry, labels }: LocationCardProps): ReactElement {
  const hasAddress = Boolean(entry.address) || Boolean(entry.city);
  return (
    <article className="relative rounded-2xl border border-[#E9C46A]/60 bg-[#F7E1B5]/45 p-6 pt-12 text-center shadow-[0_10px_40px_-12px_rgba(244,162,97,0.45)] backdrop-blur-sm">
      <SunGlyph size={32} className="absolute -top-5 left-1/2 -translate-x-1/2" />
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#F4A261]">
        {entry.label}
      </p>
      <h3 className="mt-2 font-['Playfair_Display',serif] text-2xl text-[#264653]">
        {entry.name}
      </h3>
      <div className="mt-3 space-y-1 font-['Quicksand',sans-serif] text-sm text-[#264653]/80">
        {entry.time ? (
          <p className="font-medium text-[#264653]">{entry.time}</p>
        ) : null}
        {hasAddress ? (
          <p>
            {entry.address ? <span>{entry.address}</span> : null}
            {entry.address && entry.city ? <span>, </span> : null}
            {entry.city ? <span>{entry.city}</span> : null}
          </p>
        ) : (
          <p className="italic text-[#264653]/55">{labels.noAddress}</p>
        )}
        {entry.mapsLink ? (
          <a
            href={entry.mapsLink}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block text-[#F4A261] underline underline-offset-4 transition-colors hover:text-[#E9C46A]"
          >
            {labels.viewOnMap}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function SunsetTemplate(props: PublicInvitationPageProps): ReactElement {
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

  const t = labels[locale];
  const formattedDate = useMemo(
    () => formatLongDate(eventDate, locale),
    [eventDate, locale],
  );

  const targetDate = useMemo(() => {
    const d = new Date(eventDate);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(18, 0, 0, 0);
    }
    return d;
  }, [eventDate]);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = useMemo(
    () => diff(targetDate, now),
    [targetDate, now],
  );

  const heroBackground: CSSProperties = heroImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(38,70,83,0.10) 0%, rgba(244,162,97,0.30) 50%, rgba(38,70,83,0.60) 100%), url("${heroImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage:
          'linear-gradient(180deg, #F7E1B5 0%, #F4A261 42%, #E9C46A 66%, #264653 100%)',
      };

  const showStory = Boolean(story?.body);
  const showDress = Boolean(dressCode && dressCode.entries.length > 0);
  const showGift = Boolean(giftRegistry?.body);
  const showParents = Boolean(parents?.body);
  const showAccommodation = Boolean(accommodation?.body);
  const showLocations = locations.length > 0;
  const showProgram = program.days.length > 0;

  return (
    <article
      lang={locale}
      className="min-h-screen overflow-x-hidden bg-[#F7E1B5] font-['Quicksand',sans-serif] text-[#264653]"
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Quicksand:wght@300;400;500;600;700&display=swap"
      />
      <style>{MOTION_CSS}</style>

      {/* HERO */}
      <header
        className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-20"
        style={heroBackground}
      >
        {heroImageUrl ? (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'rgba(247, 225, 181, 0.15)' }}
          />
        ) : null}

        {/* Subtle vignette for legibility */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              'inset 0 -120px 200px -40px rgba(38, 70, 83, 0.45), inset 0 80px 160px -40px rgba(247, 225, 181, 0.20)',
          }}
        />

        {/* Sun glow (no-image fallback only) */}
        {!heroImageUrl ? (
          <>
            <div
              aria-hidden="true"
              className="sunset-breathe pointer-events-none absolute top-[10%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,238,200,0.95) 0%, rgba(244,162,97,0.55) 40%, transparent 72%)',
                filter: 'blur(6px)',
                animationDelay: '0.5s',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[26%] left-0 right-0 h-px bg-white/15"
            />
          </>
        ) : null}

        <GoldCircles variant="hero" />

        <div className="sunset-rise relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-white/90 sm:text-xs">
            {t.saveTheDate}
          </p>
          <h1
            className="font-['Playfair_Display',serif] font-light text-white"
            style={{
              textShadow:
                '0 2px 16px rgba(244, 162, 97, 0.45), 0 1px 2px rgba(38,70,83,0.45)',
            }}
          >
            <span className="block text-5xl leading-[1.05] sm:text-7xl md:text-8xl">
              {partner1Name}
            </span>
            <span className="block italic font-normal text-3xl my-3 text-[#F7E1B5]/95 sm:text-4xl md:text-5xl">
              {t.coupleSeparator}
            </span>
            <span className="block text-5xl leading-[1.05] sm:text-7xl md:text-8xl">
              {partner2Name}
            </span>
          </h1>
          <div className="mt-10 flex items-center justify-center gap-4">
            <span aria-hidden="true" className="h-px w-12 bg-white/70" />
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-white sm:text-base">
              {formattedDate}
            </p>
            <span aria-hidden="true" className="h-px w-12 bg-white/70" />
          </div>
          {landingTitle ? (
            <p className="sunset-rise mt-10 font-['Playfair_Display',serif] italic text-2xl text-white/95 sm:text-3xl">
              {landingTitle}
            </p>
          ) : null}
          {landingSubtitle ? (
            <p className="sunset-rise mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base">
              {landingSubtitle}
            </p>
          ) : null}
        </div>

        <div className="sunset-rise pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.4em] text-white/65">
          <span
            aria-hidden="true"
            className="mx-auto mb-2 block h-6 w-px bg-white/40"
          />
          {t.scroll}
        </div>
      </header>

      {/* STORY */}
      {showStory ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-28"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #FBE7C6 0%, #F7E1B5 55%, #FBE7C6 100%)',
          }}
        >
          <GoldCircles variant="soft" />
          <div className="sunset-rise relative z-10 mx-auto max-w-2xl text-center">
            <SectionLabel>{t.story}</SectionLabel>
            <p className="whitespace-pre-line font-['Playfair_Display',serif] text-lg leading-relaxed text-[#264653] sm:text-xl">
              {story?.body}
            </p>
          </div>
        </section>
      ) : null}

      {/* COUNTDOWN */}
      <section
        className="relative isolate overflow-hidden px-6 py-20 sm:py-24"
        style={{
          backgroundImage:
            'linear-gradient(180deg, #FBE7C6 0%, #F7E1B5 50%, rgba(244,162,97,0.14) 100%)',
        }}
      >
        <GoldCircles variant="program" />
        <div className="sunset-rise relative z-10 mx-auto max-w-3xl text-center">
          <SectionLabel>{t.countdown}</SectionLabel>
          <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-6 sm:gap-x-6">
            {(
              [
                { v: countdown.days, l: t.days },
                { v: countdown.hours, l: t.hours },
                { v: countdown.minutes, l: t.minutes },
                { v: countdown.seconds, l: t.seconds },
              ] as const
            ).map((u, i, arr) => (
              <Fragment key={u.l}>
                <CountdownBlock value={u.v} label={u.l} />
                {i < arr.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="self-start pt-3 font-['Playfair_Display',serif] text-4xl leading-none text-[#F4A261] sm:pt-4 sm:text-5xl md:text-6xl"
                  >
                    ·
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      {showLocations ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-28"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #F7E1B5 0%, #FBE7C6 100%)',
          }}
        >
          <div className="sunset-rise relative z-10 mx-auto max-w-5xl">
            <SectionLabel>{t.locations}</SectionLabel>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {locations.map((loc, i) => (
                <LocationCard
                  key={`${loc.label}-${i}`}
                  entry={loc}
                  labels={t}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* PROGRAM */}
      {showProgram ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-28"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #FBE7C6 0%, #F7E1B5 55%, #FBE7C6 100%)',
          }}
        >
          <GoldCircles variant="program" />
          <div className="sunset-rise relative z-10 mx-auto max-w-3xl">
            <SectionLabel>{t.program}</SectionLabel>
            <div className="space-y-14">
              {program.days.map((day, i) => (
                <div key={i}>
                  {day.label || day.date ? (
                    <div className="mb-8 flex items-center gap-4">
                      <SunGlyph size={24} />
                      <div>
                        {day.label ? (
                          <h3 className="font-['Playfair_Display',serif] text-2xl text-[#264653]">
                            {day.label}
                          </h3>
                        ) : null}
                        {day.date ? (
                          <p className="text-[11px] uppercase tracking-[0.3em] text-[#F4A261]">
                            {formatWeekdayDate(day.date, locale)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <ol className="relative ml-3 space-y-7 border-l border-[#E9C46A]/60 pl-7">
                    {day.items.map((item, j) => (
                      <li key={j} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-[34px] top-1.5 h-3 w-3 rounded-full bg-[#F4A261] ring-4 ring-[#F7E1B5]"
                        />
                        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#F4A261]">
                          {item.time}
                        </p>
                        <p className="mt-1 font-['Playfair_Display',serif] text-lg text-[#264653] sm:text-xl">
                          {item.title}
                        </p>
                        {item.detail ? (
                          <p className="mt-1 text-sm leading-relaxed text-[#264653]/75">
                            {item.detail}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* DRESS CODE */}
      {showDress ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-24"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #F7E1B5 0%, #FBE7C6 100%)',
          }}
        >
          <div className="sunset-rise relative z-10 mx-auto max-w-4xl">
            <SectionLabel>{t.dressCode}</SectionLabel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {dressCode?.entries.map((entry, i) => (
                <article
                  key={i}
                  className="relative rounded-2xl border border-[#E9C46A]/60 bg-[#F7E1B5]/45 p-6 pt-12 text-center shadow-[0_10px_40px_-12px_rgba(244,162,97,0.45)]"
                >
                  <SunGlyph
                    size={30}
                    className="absolute -top-5 left-1/2 -translate-x-1/2"
                  />
                  <h3 className="font-['Playfair_Display',serif] text-xl text-[#264653]">
                    {entry.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-[#264653]/80">
                    {entry.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* GIFT REGISTRY */}
      {showGift ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-24"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #FBE7C6 0%, #F7E1B5 100%)',
          }}
        >
          <div className="sunset-rise relative z-10 mx-auto max-w-2xl text-center">
            <SectionLabel>{t.giftRegistry}</SectionLabel>
            <p className="whitespace-pre-line font-['Playfair_Display',serif] text-lg leading-relaxed text-[#264653] sm:text-xl">
              {giftRegistry?.body}
            </p>
          </div>
        </section>
      ) : null}

      {/* PARENTS */}
      {showParents ? (
        <section
          className="relative isolate overflow-hidden px-6 py-16"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #F7E1B5 0%, #FBE7C6 100%)',
          }}
        >
          <div className="sunset-rise relative z-10 mx-auto max-w-2xl text-center">
            <SectionLabel>{t.parents}</SectionLabel>
            <p className="whitespace-pre-line text-base leading-relaxed text-[#264653]/80">
              {parents?.body}
            </p>
          </div>
        </section>
      ) : null}

      {/* ACCOMMODATION */}
      {showAccommodation ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-24"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #FBE7C6 0%, #F7E1B5 100%)',
          }}
        >
          <div className="sunset-rise relative z-10 mx-auto max-w-2xl text-center">
            <SectionLabel>{t.accommodation}</SectionLabel>
            <p className="whitespace-pre-line text-base leading-relaxed text-[#264653]/85">
              {accommodation?.body}
            </p>
          </div>
        </section>
      ) : null}

      {/* RSVP CTA */}
      {rsvpEnabled ? (
        <section
          className="relative isolate overflow-hidden px-6 py-20 sm:py-24"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #F7E1B5 0%, rgba(244,162,97,0.14) 100%)',
          }}
        >
          <GoldCircles variant="soft" />
          <div className="sunset-rise relative z-10 mx-auto max-w-xl text-center">
            <SectionLabel>{t.rsvp}</SectionLabel>
          </div>
        </section>
      ) : null}

      {/* FOOTER */}
      <footer className="bg-[#264653] px-6 py-10 text-[#F7E1B5]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
          <SunGlyph size={20} className="opacity-80" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#F7E1B5]/70">
            {t.footer}
          </p>
          <p className="font-['Playfair_Display',serif] text-lg">{t.brand}</p>
        </div>
      </footer>
    </article>
  );
}

export default SunsetTemplate;
