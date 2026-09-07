/**
 * BebeTemplate — "Mi Primer Cumple" / "My First Birthday" invitation template.
 *
 * THEME — "BEBÉ"
 * A baby's first birthday — the most tender event in the catalog. The page
 * is built as a soft pastel photo album: baby-blue skies, cream paper, butter
 * yellow sun, washed-mint accents and the occasional flash of baby pink.
 * Hand-drawn baby animals (bear with rounded ears, long-eared bunny, fluffy
 * lamb) peek around the hero photo while round balloons sway at the foot of
 * the page and clouds float gently across every section. Slow, cuddly,
 * photo-led — the baby's picture is the heart of the design; when it is
 * absent the layout falls back to a graceful blue→cream gradient with the
 * honoree's initial and the surrounding animal illustrations.
 *
 * PALETTE (use these EXACT hex values)
 *   Baby blue:    #BFE3F5  — hero sky, soft washes, accent badges
 *   Baby pink:    #F8D7DA  — RSVP button, blush, cheeks, balloons
 *   Soft cream:   #FFF8E7  — paper, story + footer backgrounds
 *   Butter yellow:#FFE9B0  — sun, "1" medallion, accent washes
 *   Washed mint:  #C8E6D5  — countdown accent, growth, freshness
 *   Soft brown:   #6B5B4D  — typography, animal outlines
 *
 * TYPOGRAPHY
 *   Display (h1/h2):  Quicksand (weight 600)  — loaded via Google Fonts <link>
 *   Accent script:    Dancing Script          — loaded via Google Fonts <link>
 *   Body / UI:        Nunito (400/600)        — loaded via Google Fonts <link>
 *
 * AESTHETIC VOCABULARY
 *   Inline SVG baby animals only — bear, bunny, lamb — with a 1px soft-brown
 *   outline and a pale fill from the palette. Inline SVG clouds drift via
 *   a slow CSS keyframe (~10s loop, ±8px vertical). Inline SVG balloons sway
 *   at the foot of the hero on a staggered ~4s loop. A dotted pattern is
 *   layered at very low opacity (~6%) over most sections via inline <pattern>.
 *   A scalloped "1" medallion in Dancing Script anchors the hero next to a
 *   "12 meses de magia" / "12 months of magic" badge. Section labels are
 *   uppercase with 0.3em letter-spacing in soft brown. The RSVP button is
 *   baby-pink with rounded-full shape and a warm halo on hover.
 *
 * MOTION
 *   Cloud float (~10–12s ease-in-out), balloon sway (~4s ease-in-out), gentle
 *   fade-in on hero copy. All looping motion is disabled under
 *   `prefers-reduced-motion: reduce`.
 *
 * CONSTRAINTS
 *   Self-contained: React only, no aliases, no shared components, no external
 *   assets beyond Google Fonts CSS, no third-party libraries. Strict
 *   TypeScript, no `any`.
 */

import { useEffect, useMemo, useState } from 'react';

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

type Locale = 'en' | 'es';

const labels = {
  en: {
    saveTheDate: 'Save the date',
    tagline: 'My First Birthday',
    monthsBadge: '12 months of magic',
    monthsBadgeShort: 'months',
    monthsBadgeSingular: 'month',
    storyLabel: 'A little story',
    storyHeading: 'About our little one',
    countdownLabel: 'Counting the moments',
    countdownHeading: 'Until the big day',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    today: 'Today is the day',
    passed: 'Already celebrated with love',
    locationsLabel: 'The gathering',
    locations: 'Where',
    programLabel: 'The day',
    program: 'Schedule',
    dayFallback: 'Day',
    time: 'Time',
    openInMaps: 'Open in Maps',
    rsvpLabel: 'Join the party',
    rsvpHeading: 'Will you celebrate with us?',
    rsvpHint:
      'A small cake, a small guest, a huge heart — let us know you will be there.',
    rsvp: 'I will be there',
    craftedWith: 'Crafted with love by',
    poweredBy: 'Deer Planner',
  },
  es: {
    saveTheDate: 'Guardá la fecha',
    tagline: 'Mi Primer Cumple',
    monthsBadge: '12 meses de magia',
    monthsBadgeShort: 'meses',
    monthsBadgeSingular: 'mes',
    storyLabel: 'Una historia',
    storyHeading: 'Sobre nuestro bebé',
    countdownLabel: 'Contando los momentos',
    countdownHeading: 'Para el gran día',
    days: 'días',
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    today: 'Hoy es el día',
    passed: 'Ya celebramos con amor',
    locationsLabel: 'El encuentro',
    locations: 'Dónde',
    programLabel: 'El día',
    program: 'Cronograma',
    dayFallback: 'Día',
    time: 'Hora',
    openInMaps: 'Abrir en Maps',
    rsvpLabel: 'Sumate a la fiesta',
    rsvpHeading: '¿Celebramos juntos?',
    rsvpHint:
      'Una torta chiquita, un invitado chiquito, un corazón enorme — contanos que vas a estar.',
    rsvp: 'Allí estaré',
    craftedWith: 'Hecho con amor por',
    poweredBy: 'Deer Planner',
  },
} as const;

type Labels = { readonly [K in keyof (typeof labels)['en']]: string };

function useLabels(locale: Locale): Labels {
  return labels[locale];
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatLongDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return locale === 'es'
    ? `${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`
    : `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatShortDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return locale === 'es'
    ? `${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`
    : `${MONTHS_EN[d.getMonth()]} ${d.getDate()}`;
}

/* ----------------------------- Hooks ----------------------------- */

interface Countdown {
  passed: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
}

function useCountdown(iso: string): Countdown {
  const targetMs = useMemo(() => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? Number.NaN : d.getTime();
  }, [iso]);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (Number.isNaN(targetMs)) return { passed: true, d: 0, h: 0, m: 0, s: 0 };
  const diff = targetMs - now;
  if (diff <= 0) return { passed: true, d: 0, h: 0, m: 0, s: 0 };
  return {
    passed: false,
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

/* --------------------- CSS keyframes + fonts --------------------- */

const BEBE_CSS = `
  @keyframes bebe-float-cloud {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }
  @keyframes bebe-sway-balloon {
    0%, 100% { transform: rotate(-4deg); }
    50%      { transform: rotate(4deg); }
  }
  @keyframes bebe-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .bebe-cloud-a { animation: bebe-float-cloud 10s ease-in-out infinite; }
  .bebe-cloud-b { animation: bebe-float-cloud 12s ease-in-out -3s infinite; }
  .bebe-cloud-c { animation: bebe-float-cloud 11s ease-in-out -6s infinite; }
  .bebe-cloud-d { animation: bebe-float-cloud 13s ease-in-out -1s infinite; }

  .bebe-balloon {
    transform-origin: 50% 100%;
    animation: bebe-sway-balloon 4s ease-in-out infinite;
  }
  .bebe-balloon-2 { animation-delay: -1s; }
  .bebe-balloon-3 { animation-delay: -2s; }
  .bebe-balloon-4 { animation-delay: -3s; }

  .bebe-fade   { opacity: 0; animation: bebe-fade-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards; }
  .bebe-fade-2 { animation-delay: 0.35s; }
  .bebe-fade-3 { animation-delay: 0.55s; }
  .bebe-fade-4 { animation-delay: 0.75s; }
  .bebe-fade-5 { animation-delay: 0.95s; }

  .bebe-rsvp-btn {
    transition:
      transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 500ms ease,
      background-color 500ms ease;
  }
  .bebe-rsvp-btn:hover {
    transform: scale(1.05);
    box-shadow:
      0 14px 30px rgba(248, 215, 218, 0.55),
      0 0 0 10px rgba(255, 233, 176, 0.40);
  }
  .bebe-rsvp-btn:active {
    transform: scale(0.99);
  }

  .bebe-card {
    transition:
      transform 600ms cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 600ms ease,
      border-color 600ms ease;
  }
  .bebe-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(107, 91, 77, 0.12);
    border-color: rgba(248, 215, 218, 0.95);
  }

  @media (prefers-reduced-motion: reduce) {
    .bebe-cloud-a, .bebe-cloud-b, .bebe-cloud-c, .bebe-cloud-d,
    .bebe-balloon, .bebe-balloon-2, .bebe-balloon-3, .bebe-balloon-4,
    .bebe-fade, .bebe-fade-2, .bebe-fade-3, .bebe-fade-4, .bebe-fade-5 {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .bebe-rsvp-btn, .bebe-card { transition: none !important; }
  }
`;

function ThemeAssets() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Dancing+Script:wght@500;600;700&family=Nunito:wght@400;500;600;700&display=swap"
      />
      <style>{BEBE_CSS}</style>
    </>
  );
}

/* -------------------------- Dotted texture -------------------------- */

function DotPattern({ opacity = 0.06, color = '#6B5B4D' }: { opacity?: number; color?: string }) {
  const id = `bebe-dots-${Math.round(opacity * 1000)}-${color.replace('#', '')}`;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.4" fill={color} opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* --------------------------- SVG primitives --------------------------- */

function Cloud({
  size = 120,
  className,
  color = '#FFFFFF',
  opacity = 0.85,
}: {
  size?: number;
  className?: string;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 160 80"
      width={size}
      height={(size * 80) / 160}
      className={className}
      aria-hidden="true"
    >
      <g opacity={opacity} fill={color}>
        <ellipse cx="48" cy="50" rx="30" ry="22" />
        <ellipse cx="80" cy="38" rx="34" ry="26" />
        <ellipse cx="114" cy="50" rx="28" ry="20" />
        <ellipse cx="68" cy="58" rx="52" ry="14" />
      </g>
    </svg>
  );
}

function BalloonString({
  className,
  color = '#F8D7DA',
  size = 64,
  delayClass = '',
}: {
  className?: string;
  color?: string;
  size?: number;
  delayClass?: string;
}) {
  return (
    <svg
      viewBox="0 0 60 140"
      width={size}
      height={(size * 140) / 60}
      className={`${className ?? ''} ${delayClass}`.trim()}
      aria-hidden="true"
    >
      <ellipse
        cx="30"
        cy="38"
        rx="20"
        ry="26"
        fill={color}
        stroke="#6B5B4D"
        strokeWidth="1"
        opacity="0.95"
      />
      <ellipse cx="22" cy="30" rx="6" ry="9" fill="#FFFFFF" opacity="0.55" />
      <path d="M30 64 L27 72 L33 72 Z" fill="#6B5B4D" />
      <path
        d="M30 72 Q26 100 30 132"
        stroke="#6B5B4D"
        strokeWidth="1"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}

function Bear({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <circle cx="28" cy="32" r="14" fill="#E0B58A" stroke="#6B5B4D" strokeWidth="1.2" />
      <circle cx="92" cy="32" r="14" fill="#E0B58A" stroke="#6B5B4D" strokeWidth="1.2" />
      <circle cx="28" cy="32" r="6" fill="#F8D7DA" />
      <circle cx="92" cy="32" r="6" fill="#F8D7DA" />
      <ellipse cx="60" cy="64" rx="38" ry="34" fill="#E0B58A" stroke="#6B5B4D" strokeWidth="1.2" />
      <ellipse cx="60" cy="76" rx="18" ry="14" fill="#FFF8E7" stroke="#6B5B4D" strokeWidth="1" />
      <ellipse cx="60" cy="68" rx="5" ry="3.5" fill="#6B5B4D" />
      <path d="M60 72 Q60 80 54 82" stroke="#6B5B4D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M60 72 Q60 80 66 82" stroke="#6B5B4D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="58" r="3" fill="#6B5B4D" />
      <circle cx="74" cy="58" r="3" fill="#6B5B4D" />
      <circle cx="47" cy="57" r="1" fill="#FFFFFF" />
      <circle cx="75" cy="57" r="1" fill="#FFFFFF" />
      <circle cx="38" cy="74" r="5" fill="#F8D7DA" opacity="0.75" />
      <circle cx="82" cy="74" r="5" fill="#F8D7DA" opacity="0.75" />
    </svg>
  );
}

function Bunny({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 140" width={size} height={size} aria-hidden="true">
      <ellipse cx="46" cy="34" rx="10" ry="28" fill="#FFF8E7" stroke="#6B5B4D" strokeWidth="1.2" />
      <ellipse cx="74" cy="34" rx="10" ry="28" fill="#FFF8E7" stroke="#6B5B4D" strokeWidth="1.2" />
      <ellipse cx="46" cy="38" rx="4" ry="20" fill="#F8D7DA" />
      <ellipse cx="74" cy="38" rx="4" ry="20" fill="#F8D7DA" />
      <circle cx="60" cy="86" r="34" fill="#FFF8E7" stroke="#6B5B4D" strokeWidth="1.2" />
      <circle cx="40" cy="94" r="4" fill="#F8D7DA" opacity="0.8" />
      <circle cx="80" cy="94" r="4" fill="#F8D7DA" opacity="0.8" />
      <circle cx="48" cy="82" r="3" fill="#6B5B4D" />
      <circle cx="72" cy="82" r="3" fill="#6B5B4D" />
      <circle cx="49" cy="81" r="1" fill="#FFFFFF" />
      <circle cx="73" cy="81" r="1" fill="#FFFFFF" />
      <path d="M56 92 L64 92 L60 96 Z" fill="#F8D7DA" stroke="#6B5B4D" strokeWidth="0.8" />
      <path d="M60 96 L60 100" stroke="#6B5B4D" strokeWidth="1" strokeLinecap="round" />
      <path d="M60 100 Q56 104 54 102" stroke="#6B5B4D" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M60 100 Q64 104 66 102" stroke="#6B5B4D" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Lamb({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <g fill="#FFF8E7" stroke="#6B5B4D" strokeWidth="1.2">
        <circle cx="38" cy="64" r="14" />
        <circle cx="58" cy="52" r="14" />
        <circle cx="78" cy="54" r="14" />
        <circle cx="50" cy="78" r="13" />
        <circle cx="70" cy="80" r="13" />
        <circle cx="60" cy="86" r="12" />
      </g>
      <ellipse cx="60" cy="76" rx="22" ry="18" fill="#E8D8C0" stroke="#6B5B4D" strokeWidth="1.2" />
      <path d="M52 44 Q60 36 68 44" stroke="#6B5B4D" strokeWidth="1.2" fill="#FFF8E7" />
      <circle cx="52" cy="76" r="2.5" fill="#6B5B4D" />
      <circle cx="68" cy="76" r="2.5" fill="#6B5B4D" />
      <circle cx="46" cy="82" r="4" fill="#F8D7DA" opacity="0.75" />
      <circle cx="74" cy="82" r="4" fill="#F8D7DA" opacity="0.75" />
      <path d="M56 82 L64 82 L60 86 Z" fill="#F8D7DA" stroke="#6B5B4D" strokeWidth="0.8" />
      <path d="M60 86 L60 90" stroke="#6B5B4D" strokeWidth="1" />
    </svg>
  );
}

function OneMedallion({ size = 110 }: { size?: number }) {
  const scallops = Array.from({ length: 18 }, (_, i) => (i * 360) / 18);
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <g fill="#FFE9B0" stroke="#6B5B4D" strokeWidth="1.2">
        {scallops.map((a) => (
          <circle key={a} cx="60" cy="14" r="9" transform={`rotate(${a} 60 60)`} />
        ))}
      </g>
      <circle cx="60" cy="60" r="40" fill="#FFF8E7" stroke="#6B5B4D" strokeWidth="1.2" />
      <text
        x="60"
        y="82"
        textAnchor="middle"
        fontFamily="'Dancing Script', cursive"
        fontSize="60"
        fontWeight="600"
        fill="#6B5B4D"
      >
        1
      </text>
    </svg>
  );
}

/* ----------------------------- UI atoms ----------------------------- */

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#6B5B4D]">
      {children}
    </p>
  );
}

function CountdownBadge({
  value,
  label,
  bg,
}: {
  value: number;
  label: string;
  bg: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-3xl text-[#6B5B4D] shadow-[0_6px_18px_rgba(107,91,77,0.10)] sm:h-24 sm:w-24 sm:text-4xl"
        style={{ background: bg, fontFamily: "'Quicksand', sans-serif", fontWeight: 700 }}
      >
        {value}
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-[#6B5B4D]">
        {label}
      </span>
    </div>
  );
}

function pickAnimal(index: number, size: number) {
  const mod = index % 3;
  if (mod === 0) return <Bear size={size} />;
  if (mod === 1) return <Bunny size={size + 6} />;
  return <Lamb size={size} />;
}

/* ----------------------------- Component ----------------------------- */

function BebeTemplate(props: PublicInvitationPageProps) {
  const t = useLabels(props.locale);
  const countdown = useCountdown(props.eventDate);

  const handleRsvp = (): void => {
    if (props.onRsvpClick) props.onRsvpClick();
  };

  // Months-lived badge. The template is themed around "first birthday",
  // so we resolve to a single number that anchors the "12 meses de magia"
  // copy while staying tolerant of slightly different age inputs.
  const resolvedAge =
    typeof props.ageTurning === 'number' && props.ageTurning > 0
      ? props.ageTurning
      : 1;
  const monthsLived = resolvedAge >= 1 ? 12 : Math.max(1, Math.round(resolvedAge * 12));
  const monthsLabel =
    monthsLived === 1 ? t.monthsBadgeSingular : t.monthsBadgeShort;

  const initial = (props.honoreeName.trim().charAt(0) || 'B').toUpperCase();

  return (
    <div
      className="min-h-screen w-full bg-[#FFF8E7] text-[#6B5B4D]"
      style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
    >
      <ThemeAssets />

      {/* ========================= HERO ========================= */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #BFE3F5 0%, #FFF8E7 100%)',
          }}
        />
        <DotPattern opacity={0.06} />

        {/* floating clouds */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[6%] top-[10%] bebe-cloud-a">
            <Cloud size={140} color="#FFFFFF" opacity={0.85} />
          </div>
          <div className="absolute right-[8%] top-[22%] bebe-cloud-b">
            <Cloud size={110} color="#FFFFFF" opacity={0.8} />
          </div>
          <div className="absolute left-[42%] top-[6%] bebe-cloud-c">
            <Cloud size={86} color="#FFFFFF" opacity={0.7} />
          </div>
          <div className="absolute right-[18%] bottom-[34%] bebe-cloud-d">
            <Cloud size={70} color="#FFFFFF" opacity={0.55} />
          </div>
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-28 pt-16 sm:pt-20">
          <p className="bebe-fade text-[11px] uppercase tracking-[0.4em] text-[#6B5B4D]">
            {t.saveTheDate}
          </p>
          <p
            className="bebe-fade bebe-fade-2 mt-3 text-2xl text-[#6B5B4D]"
            style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
          >
            {t.tagline}
          </p>

          <h1
            className="bebe-fade bebe-fade-3 mt-6 text-center text-5xl text-[#6B5B4D] sm:text-7xl"
            style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, lineHeight: 1.05 }}
          >
            {props.honoreeName}
          </h1>

          {/* "1" medallion + months badge */}
          <div className="bebe-fade bebe-fade-4 mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <OneMedallion size={108} />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span
                className="text-xl text-[#6B5B4D]"
                style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
              >
                {t.monthsBadge}
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full bg-[#C8E6D5] px-4 py-1 text-[11px] uppercase tracking-[0.2em] text-[#6B5B4D]"
                style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
              >
                {monthsLived} {monthsLabel}
              </span>
            </div>
          </div>

          {/* Photo + animals */}
          <div className="relative mt-10 w-full max-w-md">
            <div className="absolute -left-4 -top-8 sm:-left-14 sm:-top-10">
              <Bear size={92} />
            </div>
            <div className="absolute -right-2 -top-12 sm:-right-14 sm:-top-14">
              <Bunny size={104} />
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <Lamb size={94} />
            </div>

            <div
              className="relative mx-auto aspect-square w-64 overflow-hidden rounded-full border-4 border-[#FFF8E7] bg-[#FFF8E7] shadow-[0_18px_40px_rgba(107,91,77,0.18)] sm:w-80"
              aria-label={props.honoreeName}
            >
              {props.heroImageUrl ? (
                <img
                  src={props.heroImageUrl}
                  alt={props.honoreeName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center"
                  style={{
                    background:
                      'radial-gradient(circle at 32% 30%, #FFF8E7 0%, #BFE3F5 100%)',
                  }}
                >
                  <span
                    className="text-7xl text-[#6B5B4D]/80 sm:text-8xl"
                    style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                  >
                    {initial}
                  </span>
                  <span
                    className="mt-2 px-6 text-center text-xs uppercase tracking-[0.3em] text-[#6B5B4D]/70"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {props.honoreeName}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p
            className="bebe-fade bebe-fade-4 mt-14 text-center text-xl text-[#6B5B4D] sm:text-2xl"
            style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 500 }}
          >
            {formatLongDate(props.eventDate, props.locale)}
          </p>

          {(props.landingTitle || props.landingSubtitle) && (
            <div className="bebe-fade bebe-fade-5 mt-4 text-center">
              {props.landingTitle && (
                <p
                  className="text-lg text-[#6B5B4D]"
                  style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                >
                  {props.landingTitle}
                </p>
              )}
              {props.landingSubtitle && (
                <p className="mt-1 text-sm text-[#6B5B4D]/80">
                  {props.landingSubtitle}
                </p>
              )}
            </div>
          )}

          {/* Balloons at the foot of the hero */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-3 pb-2 sm:gap-5">
            <BalloonString className="bebe-balloon" color="#F8D7DA" size={56} />
            <BalloonString
              className="bebe-balloon bebe-balloon-2"
              color="#BFE3F5"
              size={66}
            />
            <BalloonString
              className="bebe-balloon bebe-balloon-3"
              color="#FFE9B0"
              size={58}
            />
            <BalloonString
              className="bebe-balloon bebe-balloon-4"
              color="#C8E6D5"
              size={52}
            />
            <BalloonString className="bebe-balloon" color="#F8D7DA" size={50} />
          </div>
        </div>
      </header>

      {/* ========================= STORY ========================= */}
      {props.story && (
        <section className="relative overflow-hidden bg-[#FFF8E7] py-20">
          <DotPattern opacity={0.05} />
          <div className="pointer-events-none absolute left-[8%] top-12 bebe-cloud-b">
            <Cloud size={70} color="#BFE3F5" opacity={0.55} />
          </div>
          <div className="pointer-events-none absolute right-[6%] bottom-16 bebe-cloud-c">
            <Cloud size={84} color="#FFE9B0" opacity={0.55} />
          </div>

          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <SectionLabel>{t.storyLabel}</SectionLabel>
            <h2
              className="mb-6 text-3xl text-[#6B5B4D] sm:text-4xl"
              style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
            >
              {t.storyHeading}
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-[#6B5B4D]/85">
              {props.story.body}
            </p>
          </div>
        </section>
      )}

      {/* ========================= COUNTDOWN ========================= */}
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #FFF8E7 0%, #C8E6D5 100%)' }}
        />
        <DotPattern opacity={0.05} color="#7A9B76" />
        <div className="pointer-events-none absolute left-[12%] top-8 bebe-cloud-a">
          <Cloud size={84} color="#FFFFFF" opacity={0.7} />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <SectionLabel>{t.countdownLabel}</SectionLabel>
          <h2
            className="mb-10 text-3xl text-[#6B5B4D] sm:text-4xl"
            style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
          >
            {t.countdownHeading}
          </h2>

          {countdown.passed ? (
            <p
              className="text-2xl text-[#6B5B4D]"
              style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
            >
              {t.today}
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <CountdownBadge value={countdown.d} label={t.days} bg="#BFE3F5" />
              <CountdownBadge value={countdown.h} label={t.hours} bg="#F8D7DA" />
              <CountdownBadge value={countdown.m} label={t.minutes} bg="#FFE9B0" />
              <CountdownBadge value={countdown.s} label={t.seconds} bg="#C8E6D5" />
            </div>
          )}
        </div>
      </section>

      {/* ========================= LOCATIONS ========================= */}
      {props.locations.length > 0 && (
        <section className="relative overflow-hidden bg-[#FFF8E7] py-20">
          <DotPattern opacity={0.05} />
          <div className="pointer-events-none absolute right-[8%] top-10 bebe-cloud-c">
            <Cloud size={84} color="#BFE3F5" opacity={0.55} />
          </div>
          <div className="pointer-events-none absolute left-[5%] bottom-12 bebe-cloud-d">
            <Cloud size={70} color="#FFE9B0" opacity={0.55} />
          </div>

          <div className="relative mx-auto max-w-3xl px-6">
            <div className="mb-10 text-center">
              <SectionLabel>{t.locationsLabel}</SectionLabel>
              <h2
                className="text-3xl text-[#6B5B4D] sm:text-4xl"
                style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
              >
                {t.locations}
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {props.locations.map((loc, i) => (
                <article
                  key={`${loc.label}-${i}`}
                  className="bebe-card relative flex gap-4 rounded-3xl border border-[#F8D7DA]/60 bg-[#FFF8E7] p-5 shadow-[0_8px_24px_rgba(107,91,77,0.06)]"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#BFE3F5]">
                    {pickAnimal(i, 46)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#6B5B4D]/70">
                      {loc.label}
                    </p>
                    <h3
                      className="mt-1 text-xl text-[#6B5B4D]"
                      style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                    >
                      {loc.name}
                    </h3>
                    {loc.time && (
                      <p className="mt-1 text-sm text-[#6B5B4D]/80">
                        <span className="mr-1 text-[10px] uppercase tracking-[0.2em]">
                          {t.time}:
                        </span>
                        {loc.time}
                      </p>
                    )}
                    {loc.address && (
                      <p className="mt-1 text-sm text-[#6B5B4D]/80">{loc.address}</p>
                    )}
                    {loc.city && <p className="text-sm text-[#6B5B4D]/80">{loc.city}</p>}
                    {loc.mapsLink && (
                      <a
                        href={loc.mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-[11px] uppercase tracking-[0.2em] text-[#6B5B4D] underline-offset-4 hover:underline"
                      >
                        {t.openInMaps}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================= PROGRAM ========================= */}
      {props.program.days.length > 0 && (
        <section className="relative overflow-hidden py-20">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #FFF8E7 0%, #FFE9B0 100%)' }}
          />
          <DotPattern opacity={0.05} />
          <div className="pointer-events-none absolute left-[6%] top-10 bebe-cloud-b">
            <Cloud size={80} color="#FFFFFF" opacity={0.55} />
          </div>
          <div className="pointer-events-none absolute right-[5%] bottom-12 bebe-cloud-d">
            <Cloud size={70} color="#BFE3F5" opacity={0.55} />
          </div>

          <div className="relative mx-auto max-w-3xl px-6">
            <div className="mb-10 text-center">
              <SectionLabel>{t.programLabel}</SectionLabel>
              <h2
                className="text-3xl text-[#6B5B4D] sm:text-4xl"
                style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
              >
                {t.program}
              </h2>
            </div>

            <div className="space-y-10">
              {props.program.days.map((day, dayIdx) => {
                const dayHeading =
                  day.label ??
                  (day.date ? formatShortDate(day.date, props.locale) : `${t.dayFallback} ${dayIdx + 1}`);
                return (
                  <div key={`${dayHeading}-${dayIdx}`}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8D7DA]">
                        {pickAnimal(dayIdx, 38)}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#6B5B4D]/70">
                          {t.dayFallback} {dayIdx + 1}
                        </p>
                        <h3
                          className="text-xl text-[#6B5B4D]"
                          style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                        >
                          {dayHeading}
                        </h3>
                      </div>
                    </div>
                    <ol className="space-y-3">
                      {day.items.map((it, itemIdx) => (
                        <li
                          key={`${dayIdx}-${itemIdx}`}
                          className="bebe-card flex gap-4 rounded-2xl border border-[#FFF8E7] bg-[#FFF8E7]/95 p-4 shadow-[0_4px_14px_rgba(107,91,77,0.05)]"
                        >
                          <span
                            className="shrink-0 text-sm font-semibold text-[#6B5B4D]"
                            style={{ fontFamily: "'Quicksand', sans-serif" }}
                          >
                            {it.time}
                          </span>
                          <span className="h-4 w-px shrink-0 bg-[#6B5B4D]/15" />
                          <div className="min-w-0">
                            <p
                              className="text-base text-[#6B5B4D]"
                              style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
                            >
                              {it.title}
                            </p>
                            {it.detail && (
                              <p className="mt-0.5 text-sm text-[#6B5B4D]/75">
                                {it.detail}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================= RSVP ========================= */}
      {props.rsvpEnabled && (
        <section className="relative overflow-hidden bg-[#FFF8E7] py-20">
          <DotPattern opacity={0.05} />
          <div className="pointer-events-none absolute left-[8%] top-8 bebe-cloud-a">
            <Cloud size={74} color="#F8D7DA" opacity={0.55} />
          </div>
          <div className="pointer-events-none absolute right-[10%] bottom-12 bebe-cloud-c">
            <Cloud size={84} color="#BFE3F5" opacity={0.55} />
          </div>

          <div className="relative mx-auto max-w-xl px-6 text-center">
            <SectionLabel>{t.rsvpLabel}</SectionLabel>
            <h2
              className="mb-4 text-3xl text-[#6B5B4D] sm:text-4xl"
              style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
            >
              {t.rsvpHeading}
            </h2>
            <p className="mb-8 text-base text-[#6B5B4D]/85">{t.rsvpHint}</p>
            <button
              type="button"
              onClick={handleRsvp}
              className="bebe-rsvp-btn inline-flex items-center justify-center rounded-full bg-[#F8D7DA] px-10 py-4 text-base text-[#6B5B4D] uppercase tracking-[0.2em] shadow-[0_8px_22px_rgba(248,215,218,0.55)]"
              style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
            >
              {t.rsvp}
            </button>
          </div>
        </section>
      )}

      {/* ========================= FOOTER ========================= */}
      <footer className="relative overflow-hidden bg-[#FFF8E7] py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#6B5B4D]/10" />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#6B5B4D]/70">
            {t.craftedWith}
          </p>
          <p
            className="text-3xl text-[#6B5B4D]"
            style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600 }}
          >
            {t.poweredBy}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default BebeTemplate;
