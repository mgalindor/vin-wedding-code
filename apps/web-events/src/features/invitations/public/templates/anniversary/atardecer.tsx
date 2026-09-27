/**
 * AtardecerTemplate — Deer Planner anniversary invitation template.
 *
 * Visual concept
 * --------------
 * A beach anniversary at sunset — the kind of golden-hour light you remember
 * forever. The hero carries the honoree name in white Playfair Display with a
 * backlit photo (or a peach → warm orange → coral → deep teal sky fallback)
 * and a small gold milestone number derived from `yearsCelebrating` in the
 * props. Sections bloom on soft peach → gold gradients with translucent gold
 * circles breathing in the background, while warm cards (peach-to-gold
 * gradient, thin coral border, white text) hold the locations and program.
 * Vibe: romantic warmth, beach magic, the "sunset of life together" mood.
 *
 * Palette (exact hex)
 * -------------------
 *   Warm orange     #F4A261    — accents / CTA / horizon sun
 *   Coral           #E76F51    — card borders / deeper sunset band
 *   Light peach     #F7E1B5    — section backgrounds / peach overlay
 *   Deep teal       #264653    — body text / labels / footer
 *   Pure white      #FFFFFF    — card text / hero text
 *
 * Typography
 * ----------
 *   Display (h1/h2) — Playfair Display, weights 400–700 (italic used for
 *                    the honoree name and the milestone number)
 *   Body / UI       — Quicksand,        weights 300–700
 *   Both loaded via Google Fonts; <link> tags are hoisted to <head> by
 *   React 19 (deduplicated automatically).
 *
 * Milestone number
 * ----------------
 *   The `yearsCelebrating` prop is rendered in the hero as a small gold
 *   italic Playfair Display numeral ("30" / "40" / "50"), paired with a
 *   localised caption ("years together" / "años juntos").
 *
 * Motion philosophy: subtle. Floating gold circles breathe (scale only);
 * section content fades in on mount. All motion is gated by
 * `prefers-reduced-motion`.
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

export interface PublicInvitationPageProps {
  honoreeName: string;
  yearsCelebrating: number;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  dressCode?: { body: string } | null;
  giftRegistry?: { body: string } | null;
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
    eyebrow: 'Anniversary celebration',
    saveTheDate: 'Save the date',
    scroll: 'scroll',
    yearsTogether: 'years together',
    story: 'Our story',
    countdown: 'Counting down',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    locations: 'Where to find us',
    program: 'The celebration',
    dressCode: 'Dress code',
    giftRegistry: 'Gift registry',
    rsvp: 'Confirm attendance',
    rsvpHint: 'We cannot wait to share this sunset with you',
    footer: 'Made with love on',
    brand: 'Deer Planner',
    viewOnMap: 'Open in Maps',
    noAddress: 'Address coming soon',
    milestoneCaption: 'Celebrating',
  },
  es: {
    eyebrow: 'Celebración de aniversario',
    saveTheDate: 'Reserva la fecha',
    scroll: 'desliza',
    yearsTogether: 'años juntos',
    story: 'Nuestra historia',
    countdown: 'Cuenta regresiva',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    locations: 'Dónde encontrarnos',
    program: 'La celebración',
    dressCode: 'Código de vestimenta',
    giftRegistry: 'Mesa de regalos',
    rsvp: 'Confirmar asistencia',
    rsvpHint: 'Queremos compartir este atardecer contigo',
    footer: 'Hecho con amor en',
    brand: 'Deer Planner',
    viewOnMap: 'Abrir en Maps',
    noAddress: 'Dirección próximamente',
    milestoneCaption: 'Celebrando',
  },
} as const;

type Locale = keyof typeof labels;
type Labels = (typeof labels)[Locale];

const MOTION_CSS = `
  @keyframes atardecer-breathe {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  @keyframes atardecer-rise {
    0%   { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes atardecer-glow {
    0%, 100% { opacity: 0.85; }
    50%      { opacity: 1; }
  }
  .atardecer-breathe { animation: atardecer-breathe 6s ease-in-out infinite; }
  .atardecer-rise    { animation: atardecer-rise 1.4s ease-out both; }
  .atardecer-glow    { animation: atardecer-glow 4.5s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .atardecer-breathe,
    .atardecer-rise,
    .atardecer-glow {
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
            size: 380,
            style: { top: '-110px', left: '-120px' },
          },
          {
            color: '#E76F51',
            opacity: 0.16,
            size: 260,
            style: { bottom: '10%', right: '-90px' },
          },
          {
            color: '#F7E1B5',
            opacity: 0.18,
            size: 170,
            style: { top: '30%', right: '18%' },
          },
          {
            color: '#F4A261',
            opacity: 0.12,
            size: 120,
            style: { bottom: '22%', left: '14%' },
          },
          {
            color: '#E76F51',
            opacity: 0.1,
            size: 90,
            style: { top: '18%', left: '32%' },
          },
        ]
      : variant === 'soft'
        ? [
            {
              color: '#F4A261',
              opacity: 0.14,
              size: 300,
              style: { top: '-70px', right: '-70px' },
            },
            {
              color: '#E76F51',
              opacity: 0.1,
              size: 220,
              style: { bottom: '-90px', left: '-50px' },
            },
            {
              color: '#F7E1B5',
              opacity: 0.12,
              size: 130,
              style: { top: '42%', left: '6%' },
            },
          ]
        : [
            {
              color: '#F4A261',
              opacity: 0.14,
              size: 240,
              style: { top: '-60px', left: '-60px' },
            },
            {
              color: '#E76F51',
              opacity: 0.12,
              size: 190,
              style: { bottom: '-50px', right: '-40px' },
            },
            {
              color: '#F7E1B5',
              opacity: 0.12,
              size: 120,
              style: { top: '50%', right: '14%' },
            },
          ];
  return (
    <>
      {circles.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="atardecer-breathe pointer-events-none absolute rounded-full"
          style={{
            width: `${c.size}px`,
            height: `${c.size}px`,
            background: `radial-gradient(circle, ${c.color} 0%, transparent 70%)`,
            opacity: c.opacity,
            animationDelay: `${i * 1.2}s`,
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

function SunGlyph({ size = 24, className }: SunGlyphProps): ReactElement {
  const gradId = `atardecer-sun-${size}`;
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
          <stop offset="0%" stopColor="#FFF5DC" />
          <stop offset="60%" stopColor="#F7E1B5" />
          <stop offset="100%" stopColor="#F4A261" />
        </radialGradient>
      </defs>
      <g stroke="#F4A261" strokeWidth={2.4} strokeLinecap="round">
        <line x1="32" y1="4" x2="32" y2="12" />
        <line x1="32" y1="52" x2="32" y2="60" />
        <line x1="4" y1="32" x2="12" y2="32" />
        <line x1="52" y1="32" x2="60" y2="32" />
        <line x1="12" y1="12" x2="18" y2="18" />
        <line x1="46" y1="46" x2="52" y2="52" />
        <line x1="12" y1="52" x2="18" y2="46" />
        <line x1="46" y1="18" x2="52" y2="12" />
      </g>
      <circle cx="32" cy="32" r="11" fill={`url(#${gradId})`} />
    </svg>
  );
}

interface SunHorizonProps {
  className?: string;
}

function SunHorizon({ className }: SunHorizonProps): ReactElement {
  const sunId = 'atardecer-horizon-sun';
  return (
    <svg
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={sunId} cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#FFF1D6" />
          <stop offset="55%" stopColor="#F4A261" />
          <stop offset="100%" stopColor="#E76F51" />
        </radialGradient>
        <linearGradient id="atardecer-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F7E1B5" stopOpacity="0" />
          <stop offset="100%" stopColor="#F7E1B5" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="220" fill="url(#atardecer-sky)" />
      <path
        d="M 470 140 A 130 130 0 0 1 730 140 Z"
        fill={`url(#${sunId})`}
      />
      <ellipse
        cx="600"
        cy="142"
        rx="135"
        ry="6"
        fill="#FFF5DC"
        opacity="0.55"
      />
      <line
        x1="0"
        y1="140"
        x2="1200"
        y2="140"
        stroke="#FFF5DC"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <g stroke="#F7E1B5" strokeLinecap="round" opacity="0.55">
        <line x1="500" y1="158" x2="700" y2="158" strokeWidth="1.5" />
        <line x1="520" y1="174" x2="680" y2="174" strokeWidth="1.2" />
        <line x1="545" y1="190" x2="655" y2="190" strokeWidth="1" />
      </g>
    </svg>
  );
}

interface BeachWaveProps {
  className?: string;
}

function BeachWave({ className }: BeachWaveProps): ReactElement {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0,70 C150,40 280,90 460,68 C620,48 780,92 960,70 C1060,58 1140,78 1200,68 L1200,120 L0,120 Z"
        fill="#264653"
        opacity="0.85"
      />
      <path
        d="M0,86 C160,64 300,104 480,86 C640,72 800,104 980,86 C1080,76 1150,90 1200,86 L1200,120 L0,120 Z"
        fill="#264653"
        opacity="0.95"
      />
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
        <SunGlyph size={18} className="opacity-90" />
        {children}
        <SunGlyph size={18} className="opacity-90" />
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

const CARD_BG: CSSProperties = {
  backgroundImage:
    'linear-gradient(140deg, #F7E1B5 0%, #F4A261 55%, #E76F51 100%)',
};

interface LocationCardProps {
  entry: PublicInvitationPageProps['locations'][number];
  t: Labels;
}

function LocationCard({ entry, t }: LocationCardProps): ReactElement {
  const hasAddress = Boolean(entry.address) || Boolean(entry.city);
  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-[#E76F51]/55 p-6 pt-12 text-center text-white shadow-[0_18px_50px_-18px_rgba(231,111,81,0.55)]"
      style={CARD_BG}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)',
        }}
      />
      <SunGlyph size={32} className="absolute -top-5 left-1/2 -translate-x-1/2" />
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/85">
        {entry.label}
      </p>
      <h3 className="mt-2 font-['Playfair_Display',serif] text-2xl text-white">
        {entry.name}
      </h3>
      <div className="mt-3 space-y-1 font-['Quicksand',sans-serif] text-sm text-white/90">
        {entry.time ? (
          <p className="font-medium text-white">{entry.time}</p>
        ) : null}
        {hasAddress ? (
          <p>
            {entry.address ? <span>{entry.address}</span> : null}
            {entry.address && entry.city ? <span>, </span> : null}
            {entry.city ? <span>{entry.city}</span> : null}
          </p>
        ) : (
          <p className="italic text-white/70">{t.noAddress}</p>
        )}
        {entry.mapsLink ? (
          <a
            href={entry.mapsLink}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block text-white underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            {t.viewOnMap}
          </a>
        ) : null}
      </div>
    </article>
  );
}

interface ProgramDayCardProps {
  day: PublicInvitationPageProps['program']['days'][number];
  locale: Locale;
  index: number;
}

function ProgramDayCard({ day, locale, index }: ProgramDayCardProps): ReactElement {
  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-[#E76F51]/55 p-6 sm:p-8 text-white shadow-[0_18px_50px_-18px_rgba(231,111,81,0.55)]"
      style={CARD_BG}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 55%)',
        }}
      />
      <div className="relative flex flex-wrap items-center gap-4 border-b border-white/25 pb-5">
        <span className="font-['Playfair_Display',serif] italic text-3xl text-white/85 sm:text-4xl">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          {day.label ? (
            <h3 className="font-['Playfair_Display',serif] text-xl text-white sm:text-2xl">
              {day.label}
            </h3>
          ) : null}
          {day.date ? (
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80 sm:text-xs">
              {formatWeekdayDate(day.date, locale)}
            </p>
          ) : null}
        </div>
      </div>
      <ol className="relative mt-6 space-y-5 pl-6">
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-2 top-2 w-px bg-white/35"
        />
        {day.items.map((item, j) => (
          <li key={j} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[19px] top-2 h-2.5 w-2.5 rounded-full bg-white ring-4 ring-[#E76F51]/45"
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/80 sm:text-xs">
              {item.time}
            </p>
            <p className="mt-1 font-['Playfair_Display',serif] text-lg text-white sm:text-xl">
              {item.title}
            </p>
            {item.detail ? (
              <p className="mt-1 text-sm leading-relaxed text-white/85">
                {item.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}

function AtardecerTemplate(props: PublicInvitationPageProps): ReactElement {
  const {
    honoreeName,
    yearsCelebrating,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    story,
    dressCode,
    giftRegistry,
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
        backgroundImage: `linear-gradient(180deg, rgba(38,70,83,0.05) 0%, rgba(244,162,97,0.20) 55%, rgba(38,70,83,0.55) 100%), url("${heroImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage:
          'linear-gradient(180deg, #F7E1B5 0%, #F4A261 42%, #E76F51 72%, #264653 100%)',
      };

  const showStory = Boolean(story?.body);
  const showDress = Boolean(dressCode?.body);
  const showGift = Boolean(giftRegistry?.body);
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
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Quicksand:wght@300;400;500;600;700&display=swap"
      />
      <style>{MOTION_CSS}</style>

      {/* HERO */}
      <header
        className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-6 pb-44 pt-20 sm:pb-56"
        style={heroBackground}
      >
        {heroImageUrl ? (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'rgba(247, 225, 181, 0.15)' }}
          />
        ) : null}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              'inset 0 -160px 220px -40px rgba(38, 70, 83, 0.55), inset 0 80px 160px -40px rgba(247, 225, 181, 0.20)',
          }}
        />

        {!heroImageUrl ? (
          <div
            aria-hidden="true"
            className="atardecer-glow pointer-events-none absolute top-[16%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:h-80 sm:w-80"
            style={{
              background:
                'radial-gradient(circle, rgba(255,238,200,0.92) 0%, rgba(244,162,97,0.50) 42%, transparent 72%)',
              filter: 'blur(4px)',
            }}
          />
        ) : null}

        <GoldCircles variant="hero" />

        <div className="atardecer-rise relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.4em] text-white/90 sm:text-xs">
            {t.eyebrow}
          </p>

          <h1
            className="font-['Playfair_Display',serif] italic font-light text-white"
            style={{
              textShadow:
                '0 2px 18px rgba(244, 162, 97, 0.45), 0 1px 2px rgba(38,70,83,0.50)',
            }}
          >
            <span className="block text-5xl leading-[1.05] sm:text-7xl md:text-8xl">
              {honoreeName}
            </span>
          </h1>

          <div className="mt-8 flex items-center justify-center gap-5">
            <span aria-hidden="true" className="h-px w-10 bg-white/60" />
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/85 sm:text-xs">
              {t.milestoneCaption}
            </p>
            <span aria-hidden="true" className="h-px w-10 bg-white/60" />
          </div>

          <div className="mt-3 flex items-baseline justify-center gap-3">
            <span
              className="font-['Playfair_Display',serif] italic text-7xl sm:text-8xl md:text-9xl leading-none text-[#FFF1D6]"
              style={{
                textShadow:
                  '0 0 22px rgba(244, 162, 97, 0.55), 0 2px 4px rgba(38,70,83,0.45)',
              }}
            >
              {yearsCelebrating}
            </span>
            <span className="font-['Playfair_Display',serif] italic text-xl text-white/90 sm:text-2xl">
              {t.yearsTogether}
            </span>
          </div>

          <div className="mt-12 flex items-center justify-center gap-4">
            <SunGlyph size={18} className="opacity-90" />
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-white sm:text-base">
              {formattedDate}
            </p>
            <SunGlyph size={18} className="opacity-90" />
          </div>

          {landingTitle ? (
            <p className="atardecer-rise mt-10 font-['Playfair_Display',serif] italic text-2xl text-white/95 sm:text-3xl">
              {landingTitle}
            </p>
          ) : null}
          {landingSubtitle ? (
            <p className="atardecer-rise mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base">
              {landingSubtitle}
            </p>
          ) : null}
        </div>

        {/* Sun on horizon */}
        <SunHorizon className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-44 w-full sm:h-56" />

        {/* Beach wave silhouette */}
        <BeachWave className="pointer-events-none absolute bottom-0 left-0 right-0 z-[6] h-16 w-full sm:h-20" />

        <div className="atardecer-rise pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.4em] text-white/80 sm:bottom-5">
          <span
            aria-hidden="true"
            className="mx-auto mb-2 block h-6 w-px bg-white/50"
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
          <div className="atardecer-rise relative z-10 mx-auto max-w-2xl text-center">
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
        <div className="atardecer-rise relative z-10 mx-auto max-w-3xl text-center">
          <SectionLabel>{t.countdown}</SectionLabel>
          <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-6 sm:gap-x-7">
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
                    className="self-start pt-3 sm:pt-5"
                  >
                    <SunGlyph size={22} className="opacity-80" />
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
          <div className="atardecer-rise relative z-10 mx-auto max-w-5xl">
            <SectionLabel>{t.locations}</SectionLabel>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {locations.map((loc, i) => (
                <LocationCard key={`${loc.label}-${i}`} entry={loc} t={t} />
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
          <div className="atardecer-rise relative z-10 mx-auto max-w-4xl">
            <SectionLabel>{t.program}</SectionLabel>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {program.days.map((day, i) => (
                <ProgramDayCard
                  key={`${day.label ?? ''}-${i}`}
                  day={day}
                  locale={locale}
                  index={i}
                />
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
          <div className="atardecer-rise relative z-10 mx-auto max-w-2xl text-center">
            <SectionLabel>{t.dressCode}</SectionLabel>
            <p className="whitespace-pre-line font-['Playfair_Display',serif] text-lg leading-relaxed text-[#264653] sm:text-xl">
              {dressCode?.body}
            </p>
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
          <div className="atardecer-rise relative z-10 mx-auto max-w-2xl text-center">
            <SectionLabel>{t.giftRegistry}</SectionLabel>
            <p className="whitespace-pre-line font-['Playfair_Display',serif] text-lg leading-relaxed text-[#264653] sm:text-xl">
              {giftRegistry?.body}
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
          <div className="atardecer-rise relative z-10 mx-auto max-w-xl text-center">
            <SectionLabel>{t.rsvp}</SectionLabel>
            <p className="mx-auto max-w-md text-sm text-[#264653]/80 sm:text-base">
              {t.rsvpHint}
            </p>
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

export default AtardecerTemplate;
