/**
 * Noche de Estrellas — Anniversary Invitation Template
 * ---------------------------------------------------
 * Theme: a magical outdoor anniversary dinner under a starry night sky.
 * The whole layout sits on deep navy panels, with twinkling stars and a
 * thin crescent moon drifting in the hero. Gold elegant typography
 * (Cinzel) carries the couple's name and a large milestone numeral,
 * while warm cream text (Inter) keeps body copy gentle and readable.
 *
 * Palette (exact hex values):
 *   Navy night  #0B1A3D
 *   Mid navy    #1E2D5C
 *   Star gold   #D4AF37
 *   Moon white  #FFFFFF
 *   Warm cream  #F5E6D3
 *
 * Typography:
 *   Display  -> Cinzel   (loaded from Google Fonts)
 *   Body     -> Inter    (loaded from Google Fonts)
 *
 * The hero places a gold milestone numeral at the centre, driven by the
 * `yearsCelebrating` field in PublicInvitationPageProps. When no
 * `heroImageUrl` is provided the hero falls back to a radial navy
 * gradient so the night-sky atmosphere always reads clearly.
 */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

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

const TEMPLATE_STYLES = `
  .noche-twinkle {
    animation: noche-twinkle 3s ease-in-out infinite;
    transform-origin: center;
    transform-box: fill-box;
  }
  @keyframes noche-twinkle {
    0%, 100% { opacity: 0.35; transform: scale(0.85); }
    50%      { opacity: 1;    transform: scale(1.15); }
  }
  .noche-fade-in {
    animation: noche-fade 1.2s ease-out both;
  }
  @keyframes noche-fade {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .noche-rsvp {
    transition: transform 220ms ease, box-shadow 220ms ease;
  }
  .noche-rsvp:hover {
    transform: scale(1.04);
    box-shadow: 0 0 32px rgba(212, 175, 55, 0.55);
  }
  .noche-rsvp:focus-visible {
    outline: 2px solid #D4AF37;
    outline-offset: 4px;
  }
  .noche-link:hover {
    color: #FFFFFF;
  }
  @media (prefers-reduced-motion: reduce) {
    .noche-twinkle,
    .noche-fade-in {
      animation: none !important;
      opacity: 0.85;
      transform: none;
    }
  }
`;

const LABELS: Record<
  PublicInvitationPageProps['locale'],
  {
    storyEyebrow: string;
    storyFallbackTitle: string;
    countdownEyebrow: string;
    countdownDays: string;
    countdownHours: string;
    countdownMinutes: string;
    countdownSeconds: string;
    countdownDone: string;
    locationsEyebrow: string;
    openInMaps: string;
    programEyebrow: string;
    dressCodeEyebrow: string;
    giftRegistryEyebrow: string;
    rsvpCta: string;
    rsvpClosed: string;
    footerAttribution: string;
    invitationOf: string;
    yearsSuffix: string;
    yearsPluralSuffix: string;
  }
> = {
  en: {
    storyEyebrow: 'Our Story',
    storyFallbackTitle: 'A chapter written under the stars',
    countdownEyebrow: 'Counting the nights',
    countdownDays: 'Days',
    countdownHours: 'Hours',
    countdownMinutes: 'Minutes',
    countdownSeconds: 'Seconds',
    countdownDone: 'The night has arrived',
    locationsEyebrow: 'Where',
    openInMaps: 'Open in Maps',
    programEyebrow: 'The Evening',
    dressCodeEyebrow: 'Dress Code',
    giftRegistryEyebrow: 'Gift Registry',
    rsvpCta: 'Confirm Attendance',
    rsvpClosed: 'RSVP closed',
    footerAttribution: 'Made with',
    invitationOf: 'Celebrating the anniversary of',
    yearsSuffix: 'Year',
    yearsPluralSuffix: 'Years',
  },
  es: {
    storyEyebrow: 'Nuestra Historia',
    storyFallbackTitle: 'Un capitulo escrito bajo las estrellas',
    countdownEyebrow: 'La cuenta regresiva',
    countdownDays: 'Dias',
    countdownHours: 'Horas',
    countdownMinutes: 'Minutos',
    countdownSeconds: 'Segundos',
    countdownDone: 'La noche ha llegado',
    locationsEyebrow: 'Donde',
    openInMaps: 'Abrir en Maps',
    programEyebrow: 'La Velada',
    dressCodeEyebrow: 'Codigo de Vestimenta',
    giftRegistryEyebrow: 'Mesa de Regalos',
    rsvpCta: 'Confirmar Asistencia',
    rsvpClosed: 'RSVP cerrado',
    footerAttribution: 'Hecho con',
    invitationOf: 'Celebrando el aniversario de',
    yearsSuffix: 'Ano',
    yearsPluralSuffix: 'Anos',
  },
};

const PALETTE = {
  navyNight: '#0B1A3D',
  midNavy: '#1E2D5C',
  starGold: '#D4AF37',
  moonWhite: '#FFFFFF',
  warmCream: '#F5E6D3',
} as const;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface StarSpec {
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  baseOpacity: number;
  gold: boolean;
}

function generateStarField(
  count: number,
  seed: number,
  spread: { top: number; left: number } = { top: 100, left: 100 },
): StarSpec[] {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    top: rng() * spread.top,
    left: rng() * spread.left,
    size: 4 + rng() * 9,
    delay: rng() * 4,
    duration: 2.4 + rng() * 2.4,
    baseOpacity: 0.45 + rng() * 0.55,
    gold: rng() > 0.55,
  }));
}

function formatEventDate(iso: string, locale: 'en' | 'es'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const localeTag = locale === 'es' ? 'es-ES' : 'en-US';
  try {
    return new Intl.DateTimeFormat(localeTag, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return iso;
  }
}

function formatShortDate(iso: string, locale: 'en' | 'es'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const localeTag = locale === 'es' ? 'es-ES' : 'en-US';
  try {
    return new Intl.DateTimeFormat(localeTag, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return iso;
  }
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function computeTimeLeft(iso: string): TimeLeft {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, done: false };
}

function useTimeLeft(iso: string): TimeLeft {
  const [value, setValue] = useState<TimeLeft>(() => computeTimeLeft(iso));
  useEffect(() => {
    setValue(computeTimeLeft(iso));
    const id = window.setInterval(() => {
      setValue(computeTimeLeft(iso));
    }, 1000);
    return () => window.clearInterval(id);
  }, [iso]);
  return value;
}

interface StarGlyphProps {
  size?: number;
  color?: string;
  className?: string;
  fill?: string;
}

function StarGlyph({
  size = 12,
  color = PALETTE.starGold,
  fill,
  className,
}: StarGlyphProps) {
  const fillColor = fill ?? color;
  const d =
    'M12 2 L14.59 8.41 L21.5 9.02 L16.2 13.5 L17.82 20.5 L12 17 L6.18 20.5 L7.8 13.5 L2.5 9.02 L9.41 8.41 Z';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path d={d} fill={fillColor} />
    </svg>
  );
}

interface TwinkleStarsProps {
  count?: number;
  seed: number;
  className?: string;
}

function TwinkleStars({ count = 22, seed, className }: TwinkleStarsProps) {
  const stars = useMemo(
    () => generateStarField(count, seed),
    [count, seed],
  );
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        className ?? ''
      }`}
    >
      {stars.map((s, i) => {
        const style: CSSProperties = {
          top: `${s.top}%`,
          left: `${s.left}%`,
          width: `${s.size}px`,
          height: `${s.size}px`,
          animationDelay: `${s.delay}s`,
          animationDuration: `${s.duration}s`,
          opacity: s.baseOpacity,
        };
        const color = s.gold ? PALETTE.starGold : PALETTE.moonWhite;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="noche-twinkle absolute"
            style={style}
          >
            <path
              d="M12 2 L14.59 8.41 L21.5 9.02 L16.2 13.5 L17.82 20.5 L12 17 L6.18 20.5 L7.8 13.5 L2.5 9.02 L9.41 8.41 Z"
              fill={color}
            />
            <circle
              cx="12"
              cy="12"
              r="2"
              fill={PALETTE.moonWhite}
              opacity="0.8"
            />
          </svg>
        );
      })}
    </div>
  );
}

interface CrescentMoonProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

function CrescentMoon({
  size = 140,
  className,
  glow = true,
}: CrescentMoonProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      {glow ? (
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={PALETTE.warmCream} stopOpacity="0.5" />
            <stop offset="60%" stopColor={PALETTE.warmCream} stopOpacity="0.08" />
            <stop offset="100%" stopColor={PALETTE.warmCream} stopOpacity="0" />
          </radialGradient>
        </defs>
      ) : null}
      {glow ? (
        <circle cx="50" cy="55" r="58" fill="url(#moonGlow)" />
      ) : null}
      <circle cx="45" cy="55" r="36" fill={PALETTE.warmCream} />
      <circle cx="60" cy="48" r="32" fill={PALETTE.navyNight} />
      <circle cx="35" cy="40" r="3" fill={PALETTE.starGold} opacity="0.9" />
      <circle cx="28" cy="62" r="2" fill={PALETTE.starGold} opacity="0.7" />
      <circle cx="42" cy="72" r="2.4" fill={PALETTE.starGold} opacity="0.85" />
    </svg>
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title?: string;
}

function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-3 text-[#D4AF37]">
        <span className="block h-px w-10 bg-[#D4AF37] opacity-60" />
        <StarGlyph size={10} />
        <span className="uppercase tracking-[0.4em] text-[0.7rem] font-medium">
          {eyebrow}
        </span>
        <StarGlyph size={10} />
        <span className="block h-px w-10 bg-[#D4AF37] opacity-60" />
      </div>
      {title ? (
        <h2
          className="font-['Cinzel'] text-[#F5E6D3] text-2xl md:text-3xl font-medium"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {title}
        </h2>
      ) : null}
    </div>
  );
}

function Hairline() {
  return (
    <div className="mx-auto h-px w-24 bg-[#D4AF37] opacity-40" aria-hidden="true" />
  );
}

interface CountdownBlockProps {
  value: number;
  label: string;
}

function CountdownBlock({ value, label }: CountdownBlockProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-baseline gap-2 text-[#F5E6D3]"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <span className="text-4xl md:text-5xl font-semibold tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
        <StarGlyph size={8} color={PALETTE.starGold} />
      </div>
      <span className="uppercase tracking-[0.35em] text-[0.65rem] text-[#D4AF37]">
        {label}
      </span>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <a
      href={href}
      className="noche-link text-[#D4AF37] underline underline-offset-4 decoration-[#D4AF37]/50 transition-colors"
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function NightskyBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, #1E2D5C 0%, #11234E 45%, #0B1A3D 100%)',
      }}
    />
  );
}

function HeroFallbackGradient() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at center, #1E2D5C 0%, #11234E 45%, #0B1A3D 100%)',
      }}
    />
  );
}

function HeroImageLayer({ url }: { url: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url("${url}")`,
        filter: 'saturate(0.85) brightness(0.85)',
      }}
    />
  );
}

function HeroOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(180deg, rgba(11,26,61,0.35) 0%, rgba(11,26,61,0.55) 45%, rgba(11,26,61,0.85) 100%)',
      }}
    />
  );
}

interface LocationCardProps {
  location: PublicInvitationPageProps['locations'][number];
}

function LocationCard({ location }: LocationCardProps) {
  const lines: string[] = [];
  if (location.address) lines.push(location.address);
  if (location.city) lines.push(location.city);
  if (location.time) lines.push(location.time);

  return (
    <article className="flex flex-col gap-3 rounded-sm border border-[#D4AF37]/40 bg-[#0B1A3D]/60 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="uppercase tracking-[0.4em] text-[0.65rem] text-[#D4AF37]">
          {location.label}
        </span>
        {location.time ? (
          <span
            className="text-[#F5E6D3] text-sm"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {location.time}
          </span>
        ) : null}
      </div>
      <h3
        className="text-[#F5E6D3] text-xl md:text-2xl font-medium"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {location.name}
      </h3>
      {lines.length > 0 ? (
        <p className="text-[#F5E6D3]/80 text-sm leading-relaxed">
          {lines.join(' \u00b7 ')}
        </p>
      ) : null}
      {location.mapsLink ? (
        <div className="pt-2">
          <NavLink href={location.mapsLink}>Open in Maps</NavLink>
        </div>
      ) : null}
    </article>
  );
}

interface ProgramDayCardProps {
  day: PublicInvitationPageProps['program']['days'][number];
  fallbackDateLabel?: string;
}

function ProgramDayCard({ day, fallbackDateLabel }: ProgramDayCardProps) {
  const heading = day.label ?? fallbackDateLabel ?? '';
  return (
    <article className="flex flex-col gap-5 rounded-sm border border-[#D4AF37]/40 bg-[#0B1A3D]/60 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-1">
        <span className="uppercase tracking-[0.4em] text-[0.65rem] text-[#D4AF37]">
          {heading}
        </span>
        {day.date ? (
          <span
            className="text-[#F5E6D3] text-lg"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {day.date}
          </span>
        ) : null}
      </div>
      <ol className="flex flex-col gap-4">
        {day.items.map((item, i) => (
          <li key={i} className="flex gap-4 border-l border-[#D4AF37]/40 pl-4">
            <div className="flex flex-col items-start">
              <span
                className="text-[#D4AF37] text-sm font-medium tabular-nums"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {item.time}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="text-[#F5E6D3] text-base font-medium"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {item.title}
              </span>
              {item.detail ? (
                <p className="text-[#F5E6D3]/75 text-sm leading-relaxed">
                  {item.detail}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function NocheDeEstrellasTemplate(props: PublicInvitationPageProps) {
  const t = LABELS[props.locale];
  const timeLeft = useTimeLeft(props.eventDate);
  const eventDateLabel = formatEventDate(props.eventDate, props.locale);
  const yearsLabel = `${props.yearsCelebrating} ${
    props.yearsCelebrating === 1 ? t.yearsSuffix : t.yearsPluralSuffix
  }`;

  const programDays = props.program.days;
  const fallbackDayLabel = props.locale === 'es' ? 'Programa' : 'Programme';

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden text-[#F5E6D3]"
      style={{
        background: PALETTE.navyNight,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap"
      />
      <style>{TEMPLATE_STYLES}</style>

      <NightskyBackground />
      <TwinkleStars count={26} seed={7} />

      <header className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-24 text-center md:pt-24 md:pb-32">
        {props.heroImageUrl ? (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <HeroImageLayer url={props.heroImageUrl} />
            <HeroOverlay />
          </div>
        ) : null}

        <div className="absolute -top-2 right-2 md:top-6 md:right-10">
          <CrescentMoon size={120} className="opacity-90" />
        </div>

        <span className="uppercase tracking-[0.5em] text-[0.7rem] text-[#D4AF37] mb-6">
          {t.invitationOf}
        </span>

        <h1
          className="font-['Cinzel'] text-[#F5E6D3] text-4xl md:text-6xl font-medium leading-tight max-w-3xl noche-fade-in"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {props.honoreeName}
        </h1>

        <div className="my-10 flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-[#D4AF37]/70"
              style={{ padding: '1.5rem' }}
            />
            <span
              className="relative font-['Cinzel'] text-[#D4AF37] text-6xl md:text-8xl font-semibold tabular-nums"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {props.yearsCelebrating}
            </span>
          </div>
          <span
            className="uppercase tracking-[0.4em] text-[0.7rem] text-[#D4AF37]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {yearsLabel}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span
            className="text-[#F5E6D3] text-lg md:text-xl"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {eventDateLabel}
          </span>
          {props.landingSubtitle ? (
            <p className="max-w-xl text-[#F5E6D3]/80 text-sm md:text-base italic">
              {props.landingSubtitle}
            </p>
          ) : null}
          {props.landingTitle ? (
            <h2
              className="text-[#F5E6D3] text-xl md:text-2xl mt-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {props.landingTitle}
            </h2>
          ) : null}
        </div>

        {!props.heroImageUrl ? <HeroFallbackGradient /> : null}
      </header>

      <Hairline />

      {props.story ? (
        <section className="relative mx-auto max-w-3xl px-6 py-20 md:py-24">
          <TwinkleStars count={14} seed={13} className="opacity-60" />
          <SectionHeader eyebrow={t.storyEyebrow} title={t.storyFallbackTitle} />
          <p className="mt-8 text-center text-[#F5E6D3]/85 text-base md:text-lg leading-relaxed">
            {props.story.body}
          </p>
        </section>
      ) : null}

      <section
        aria-label="countdown"
        className="relative mx-auto max-w-3xl px-6 py-20 md:py-24"
      >
        <SectionHeader eyebrow={t.countdownEyebrow} />
        {timeLeft.done ? (
          <p
            className="mt-10 text-center text-[#F5E6D3] text-xl md:text-2xl"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t.countdownDone}
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-4 gap-4 md:gap-8">
            <CountdownBlock value={timeLeft.days} label={t.countdownDays} />
            <CountdownBlock value={timeLeft.hours} label={t.countdownHours} />
            <CountdownBlock
              value={timeLeft.minutes}
              label={t.countdownMinutes}
            />
            <CountdownBlock
              value={timeLeft.seconds}
              label={t.countdownSeconds}
            />
          </div>
        )}
      </section>

      <Hairline />

      <section
        aria-label="locations"
        className="relative mx-auto max-w-4xl px-6 py-20 md:py-24"
      >
        <TwinkleStars count={12} seed={29} className="opacity-50" />
        <SectionHeader eyebrow={t.locationsEyebrow} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {props.locations.map((location, i) => (
            <LocationCard key={`${location.label}-${i}`} location={location} />
          ))}
        </div>
      </section>

      <Hairline />

      <section
        aria-label="program"
        className="relative mx-auto max-w-4xl px-6 py-20 md:py-24"
      >
        <SectionHeader eyebrow={t.programEyebrow} />
        <div className="mt-12 flex flex-col gap-6">
          {programDays.map((day, i) => (
            <ProgramDayCard
              key={`${day.label ?? ''}-${i}`}
              day={day}
              fallbackDateLabel={fallbackDayLabel}
            />
          ))}
        </div>
      </section>

      {props.dressCode ? (
        <>
          <Hairline />
          <section className="relative mx-auto max-w-3xl px-6 py-20 md:py-24">
            <SectionHeader eyebrow={t.dressCodeEyebrow} />
            <p className="mt-8 text-center text-[#F5E6D3]/85 text-base md:text-lg leading-relaxed">
              {props.dressCode.body}
            </p>
          </section>
        </>
      ) : null}

      {props.giftRegistry ? (
        <>
          <Hairline />
          <section className="relative mx-auto max-w-3xl px-6 py-20 md:py-24">
            <SectionHeader eyebrow={t.giftRegistryEyebrow} />
            <p className="mt-8 text-center text-[#F5E6D3]/85 text-base md:text-lg leading-relaxed">
              {props.giftRegistry.body}
            </p>
          </section>
        </>
      ) : null}

      <Hairline />

      <section
        aria-label="rsvp"
        className="relative mx-auto max-w-2xl px-6 py-20 md:py-24 text-center"
      >
        {props.rsvpEnabled ? (
          <button
            type="button"
            className="noche-rsvp inline-flex items-center gap-3 rounded-sm bg-[#D4AF37] px-10 py-4 text-[#0B1A3D] text-sm md:text-base font-semibold uppercase tracking-[0.4em]"
            style={{ fontFamily: "'Cinzel', serif" }}
            onClick={() => props.onRsvpClick?.()}
          >
            <StarGlyph size={14} color={PALETTE.navyNight} />
            {t.rsvpCta}
            <StarGlyph size={14} color={PALETTE.navyNight} />
          </button>
        ) : (
          <p
            className="text-[#F5E6D3]/60 uppercase tracking-[0.4em] text-[0.7rem]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t.rsvpClosed}
          </p>
        )}
      </section>

      <footer className="relative border-t border-[#D4AF37]/30 bg-[#0B1A3D]/60 py-10 text-center">
        <p className="flex items-center justify-center gap-2 text-[#F5E6D3]/70 text-xs uppercase tracking-[0.4em]">
          <span>{t.footerAttribution}</span>
          <span className="text-[#D4AF37]">{'\u2665'}</span>
          <span>Deer Planner</span>
        </p>
      </footer>
    </div>
  );
}

export default NocheDeEstrellasTemplate;
