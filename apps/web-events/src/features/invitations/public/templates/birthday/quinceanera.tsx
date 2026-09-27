/**
 * QuinceaneraTemplate — Birthday invitation template for a coming-of-age celebration.
 *
 * THEME — "QUINCEAÑERA / MIS 18"
 * A ceremonial coming-of-age celebration. The template adapts gracefully to
 * BOTH the traditional "Mis XV" (ageTurning === 15) and the "Mis 18"
 * (ageTurning === 18) milestone — the hero badge, the gold medallion and the
 * short tagline change to honor the year while the overall ceremonial
 * atmosphere stays identical. Ivory and warm cream alternate behind
 * champagne-gold hairlines; the honoree is framed by an inline tiara SVG and
 * an oval floral wreath; gentle rose petals drift across the hero; a slow
 * diagonal shine sweeps the gold milestone badge. Romantic, fairy-tale but
 * never childish — princess-of-the-day, milestone, elegant.
 *
 * PALETTE (exact)
 *   Dusty rose pink  #E8B4BC  — RSVP band, floral wreath, falling petals
 *   Deep rose        #C78283  — section labels, hairlines, footer ground
 *   Soft ivory       #FBF7F4  — primary background, paper
 *   Champagne gold   #D4AF37  — hairlines, medallion border, tiara, badge text
 *   Warm cream       #F5E6D3  — alternating section background, story
 *   Text dark wine   #4A2B2D  — typography, RSVP button text
 *
 * TYPOGRAPHY
 *   Display (honoree name, h1/h2): Cormorant Garamond italic — Google Fonts <link>
 *   Milestone badge (Mis XV / Mis 18): Playfair Display weight 700 — Google Fonts <link>
 *   Body / UI: Playfair Display weight 400 — Google Fonts <link>
 *
 * AESTHETIC VOCABULARY
 *   Inline SVG only: a 5-pointed tiara with small jewels above the name, an
 *   oval floral wreath in dusty rose + champagne gold framing the medallion
 *   or photo, a circular gold-bordered medallion with "XV" or "18" inside,
 *   and 6 rose petals drifting across the hero. 1px champagne-gold hairlines
 *   between sections. Section labels uppercase with 0.4em tracking in deep
 *   rose. Locations and program items are ivory cards with a thin gold
 *   border, deep rose label text. RSVP button: champagne gold fill, dark
 *   wine text, rounded-md; on hover it brightens and a diagonal shine slides
 *   over the label.
 *
 * MOTION
 *   Falling rose petals in the hero (6 petals, 8–12s, staggered) plus a slow
 *   diagonal shine sweep on the gold milestone badge (~3.5s loop) and a
 *   one-shot shine sweep on the RSVP button label on hover. Everything
 *   disables under `prefers-reduced-motion: reduce`.
 *
 * CONSTRAINTS
 *   Self-contained: React only, no @/ aliases, no shared components, no
 *   external assets, no third-party libraries. Strict TypeScript, no `any`.
 *   The template renders gracefully for ageTurning of 15 OR 18 (or none) —
 *   when the value is anything other than 15 or 18, the badge falls back to
 *   a generic "Mi Celebración" / "My Celebration" tagline without any
 *   age-specific label rendered.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

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
type Milestone = 'xv' | 'eighteen' | 'generic';

const labels = {
  en: {
    saveTheDate: 'Save the date',
    invitation: 'You are invited',
    xv: 'My Fifteenth',
    xv_en: 'XV',
    eighteen: 'My Eighteenth',
    eighteen_en: '18',
    generic: 'My Celebration',
    story: 'Her story',
    storyLabel: 'A few words',
    storyPre: 'About the honoree',
    countdownHeading: 'Until the celebration',
    countdownLabel: 'Counting the days',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    locations: 'Where',
    locationsLabel: 'The venues',
    program: 'The day',
    programLabel: 'Schedule',
    dayFallback: 'Day',
    rsvpLabel: 'Your seat',
    rsvpHeading: 'Will you join us?',
    rsvpHint:
      'A table is being set in her honor — let us know if a chair is yours.',
    rsvp: 'Confirm attendance',
    openInMaps: 'Open in Maps',
    today: 'Today is the day',
    passed: 'A day already lived',
    craftedWith: 'Crafted with love by',
    poweredBy: 'Deer Planner',
  },
  es: {
    saveTheDate: 'Reservá la fecha',
    invitation: 'Estás invitada',
    xv: 'Mis XV',
    xv_en: 'XV',
    eighteen: 'Mis 18',
    eighteen_en: '18',
    generic: 'Mi Celebración',
    story: 'Su historia',
    storyLabel: 'Unas palabras',
    storyPre: 'Sobre la homenajeada',
    countdownHeading: 'Para la celebración',
    countdownLabel: 'Contando los días',
    days: 'días',
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    locations: 'Dónde',
    locationsLabel: 'Los lugares',
    program: 'El día',
    programLabel: 'Cronograma',
    dayFallback: 'Día',
    rsvpLabel: 'Tu lugar',
    rsvpHeading: '¿Nos acompañás?',
    rsvpHint:
      'Una mesa se está preparando en su honor — contanos si una silla es tuya.',
    rsvp: 'Confirmar asistencia',
    openInMaps: 'Abrir en Maps',
    today: 'Hoy es el día',
    passed: 'Un día ya vivido',
    craftedWith: 'Hecho con cariño por',
    poweredBy: 'Deer Planner',
  },
} as const;

type Labels = { readonly [K in keyof (typeof labels)['en']]: string };

const useLabels = (locale: Locale): Labels => labels[locale];

const milestoneKey = (age: number | null | undefined): Milestone => {
  if (age === 15) return 'xv';
  if (age === 18) return 'eighteen';
  return 'generic';
};

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const formatLongDate = (iso: string, locale: Locale): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
  return locale === 'es'
    ? `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
    : `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatShortDate = (iso: string, locale: Locale): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
  return locale === 'es'
    ? `${d.getDate()} de ${months[d.getMonth()]}`
    : `${months[d.getMonth()]} ${d.getDate()}`;
};

/* ---------- Hooks ---------- */

interface Countdown {
  passed: boolean;
  d: number;
  h: number;
  m: number;
  s: number;
}

function useCountdown(iso: string): Countdown {
  const targetMs = useMemo(() => new Date(iso).getTime(), [iso]);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
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
    s: Math.floor((diff % 60_000) / 1_000),
  };
}

function useReveal<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      node.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ---------- Fonts + keyframes ---------- */

const QUINCE_CSS = `
  @keyframes quince-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes quince-fall {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg);       opacity: 0; }
    12%  { opacity: 0.85; }
    50%  { transform: translate3d(2vw, 45vh, 0) rotate(160deg);   opacity: 0.75; }
    88%  { opacity: 0.35; }
    100% { transform: translate3d(-1.5vw, 104vh, 0) rotate(340deg); opacity: 0; }
  }
  @keyframes quince-shine {
    0%   { background-position: -150% 50%; }
    100% { background-position: 250% 50%; }
  }
  @keyframes quince-tiara-in {
    0%   { opacity: 0; transform: translateY(-8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes quince-spin-slow {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .quince-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 1600ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 1600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .quince-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .quince-hero-in {
    opacity: 0;
    animation: quince-fade-up 2200ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .quince-tiara-in {
    opacity: 0;
    animation: quince-tiara-in 1600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms forwards;
  }

  .quince-petal {
    position: absolute;
    top: 0;
    will-change: transform, opacity;
    animation-name: quince-fall;
    animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
    animation-iteration-count: infinite;
  }

  .quince-shine {
    background-image: linear-gradient(
      110deg,
      #D4AF37 0%,
      #D4AF37 28%,
      #F5E6D3 44%,
      #FBF7F4 50%,
      #F5E6D3 56%,
      #D4AF37 72%,
      #D4AF37 100%
    );
    background-size: 220% 100%;
    background-repeat: no-repeat;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: quince-shine 3.5s linear infinite;
  }

  .quince-cta {
    position: relative;
    overflow: hidden;
    transition:
      background-color 600ms ease,
      box-shadow 600ms ease,
      transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .quince-cta:hover {
    background-color: #E2BE4D;
    transform: translateY(-2px);
    box-shadow: 0 24px 48px -28px rgba(74, 43, 45, 0.55);
  }
  .quince-cta-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 30%,
      rgba(255, 255, 255, 0.45) 48%,
      rgba(255, 255, 255, 0.85) 50%,
      rgba(255, 255, 255, 0.45) 52%,
      transparent 70%
    );
    transform: translateX(-110%);
    transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .quince-cta:hover .quince-cta-shine {
    transform: translateX(110%);
  }

  .quince-card {
    transition:
      border-color 700ms ease,
      box-shadow 700ms ease,
      transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .quince-card:hover {
    border-color: #D4AF37;
    transform: translateY(-3px);
    box-shadow: 0 22px 44px -32px rgba(74, 43, 45, 0.4);
  }

  .quince-spin-slow {
    transform-origin: 50% 50%;
    animation: quince-spin-slow 80s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .quince-reveal,
    .quince-reveal.is-visible,
    .quince-hero-in,
    .quince-tiara-in,
    .quince-petal,
    .quince-shine,
    .quince-cta,
    .quince-cta-shine,
    .quince-card,
    .quince-spin-slow {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
      transition: none !important;
    }
    .quince-petal { display: none !important; }
  }
`;

function ThemeAssets() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600;1,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
      />
      <style>{QUINCE_CSS}</style>
    </>
  );
}

/* ---------- SVG primitives ---------- */

function Tiara({
  width = 200,
  className,
  flip = false,
}: {
  width?: number;
  className?: string;
  flip?: boolean;
}) {
  const h = Math.round((width * 90) / 220);
  const style: CSSProperties | undefined = flip
    ? { transform: 'scaleX(-1)' }
    : undefined;
  return (
    <svg
      viewBox="0 0 220 90"
      width={width}
      height={h}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M 18 64 Q 110 82 202 64"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="M 104 64 L 110 14 L 116 64 Z"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.4"
        opacity="0.95"
      />
      <path
        d="M 64 66 L 78 22 L 92 66 Z"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.3"
        opacity="0.9"
      />
      <path
        d="M 128 66 L 142 22 L 156 66 Z"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.3"
        opacity="0.9"
      />
      <path
        d="M 30 64 L 40 32 L 50 64 Z"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <path
        d="M 170 64 L 180 32 L 190 64 Z"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <circle cx="40" cy="32" r="1.8" fill="#E8B4BC" />
      <circle cx="78" cy="22" r="2.2" fill="#D4AF37" />
      <circle cx="110" cy="14" r="2.6" fill="#E8B4BC" />
      <circle cx="142" cy="22" r="2.2" fill="#D4AF37" />
      <circle cx="180" cy="32" r="1.8" fill="#E8B4BC" />
      <circle cx="60" cy="70" r="1.2" fill="#D4AF37" opacity="0.85" />
      <circle cx="100" cy="74" r="1.2" fill="#D4AF37" opacity="0.85" />
      <circle cx="120" cy="74" r="1.2" fill="#D4AF37" opacity="0.85" />
      <circle cx="160" cy="70" r="1.2" fill="#D4AF37" opacity="0.85" />
    </svg>
  );
}

function FloralWreath({
  size = 360,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const ring = useMemo(() => {
    const arr: Array<{
      i: number;
      angle: number;
      len: number;
      type: 'leaf' | 'rose' | 'gold';
    }> = [];
    const count = 36;
    for (let i = 0; i < count; i += 1) {
      const type: 'leaf' | 'rose' | 'gold' =
        i % 8 === 0 ? 'rose' : i % 5 === 0 ? 'gold' : 'leaf';
      arr.push({
        i,
        angle: (i / count) * 360,
        len: 12 + (i % 4) * 2.4,
        type,
      });
    }
    return arr;
  }, []);

  const half = size / 2;
  const radius = half - 14;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx={half}
        cy={half}
        r={radius - 6}
        fill="none"
        stroke="#D4AF37"
        strokeWidth="0.8"
        opacity="0.45"
      />
      {ring.map((item) => {
        const rad = (item.angle * Math.PI) / 180;
        const cx = half + Math.cos(rad) * radius;
        const cy = half + Math.sin(rad) * radius;
        const fill =
          item.type === 'rose'
            ? '#E8B4BC'
            : item.type === 'gold'
              ? '#D4AF37'
              : '#C78283';
        const op =
          item.type === 'rose' ? 0.9 : item.type === 'gold' ? 0.85 : 0.55;
        return (
          <ellipse
            key={item.i}
            cx={cx}
            cy={cy}
            rx={item.len}
            ry={3.6}
            fill={fill}
            opacity={op}
            transform={`rotate(${item.angle + 90} ${cx} ${cy})`}
          />
        );
      })}
      {[45, 135, 225, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        const cx = half + Math.cos(rad) * (radius - 4);
        const cy = half + Math.sin(rad) * (radius - 4);
        return (
          <g key={a} transform={`translate(${cx} ${cy})`}>
            <circle r="4" fill="#E8B4BC" opacity="0.95" />
            <circle r="1.6" fill="#D4AF37" opacity="0.95" />
          </g>
        );
      })}
    </svg>
  );
}

function RosePetal({
  size = 18,
  color = '#E8B4BC',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M 12 3 C 5 8, 5 16, 12 21 C 19 16, 19 8, 12 3 Z"
        fill={color}
        opacity="0.9"
      />
      <path
        d="M 12 5 C 12 12, 12 18, 12 21"
        stroke="#C78283"
        strokeWidth="0.5"
        opacity="0.55"
        fill="none"
      />
    </svg>
  );
}

function MedallionStar() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M 12 2 L 14.4 9 L 22 9.5 L 16 14 L 18 21 L 12 17 L 6 21 L 8 14 L 2 9.5 L 9.6 9 Z"
        fill="#D4AF37"
        opacity="0.95"
      />
    </svg>
  );
}

interface FallingPetalSpec {
  id: number;
  left: string;
  duration: string;
  delay: string;
  size: number;
  color: string;
  opacity: number;
}

const FALLING_PETALS: readonly FallingPetalSpec[] = [
  { id: 0, left: '8%', duration: '11s', delay: '0s', size: 18, color: '#E8B4BC', opacity: 0.85 },
  { id: 1, left: '24%', duration: '9.5s', delay: '2s', size: 14, color: '#C78283', opacity: 0.7 },
  { id: 2, left: '44%', duration: '12s', delay: '1.2s', size: 20, color: '#E8B4BC', opacity: 0.9 },
  { id: 3, left: '62%', duration: '8.5s', delay: '3.4s', size: 13, color: '#D4AF37', opacity: 0.55 },
  { id: 4, left: '80%', duration: '10s', delay: '0.8s', size: 16, color: '#E8B4BC', opacity: 0.75 },
  { id: 5, left: '92%', duration: '9s', delay: '4s', size: 12, color: '#C78283', opacity: 0.6 },
];

function FallingPetals() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {FALLING_PETALS.map((p) => (
        <span
          key={p.id}
          className="quince-petal"
          style={{
            left: p.left,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        >
          <RosePetal size={p.size} color={p.color} />
        </span>
      ))}
    </div>
  );
}

/* ---------- Layout primitives ---------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-8 bg-[#D4AF37]/55" />
      <span className="font-['Playfair_Display',serif] text-[10px] uppercase tracking-[0.4em] text-[#C78283] md:text-[11px]">
        {children}
      </span>
      <span className="h-px w-8 bg-[#D4AF37]/55" />
    </div>
  );
}

function Hairline() {
  return <div className="h-px w-full bg-[#D4AF37]/35" aria-hidden="true" />;
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`quince-reveal ${className ?? ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ---------- Hero ---------- */

function HeroSection({
  props,
  t,
}: {
  props: PublicInvitationPageProps;
  t: Labels;
}) {
  const {
    honoreeName,
    ageTurning,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    locale,
  } = props;

  const milestone: Milestone =
    typeof ageTurning === 'number' ? milestoneKey(ageTurning) : 'generic';

  const milestoneLabel = t[milestone];
  const milestoneShort =
    milestone === 'xv'
      ? t.xv_en
      : milestone === 'eighteen'
        ? t.eighteen_en
        : '';

  return (
    <header className="relative isolate overflow-hidden bg-[#FBF7F4] px-6 pb-28 pt-16 md:pb-36 md:pt-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 10%, #F5E6D3 0%, rgba(245,230,211,0.4) 38%, rgba(251,247,244,0) 78%)',
        }}
      />
      <FallingPetals />

      <div className="quince-tiara-in pointer-events-none absolute left-6 top-6 md:left-12 md:top-10">
        <Tiara width={130} className="opacity-55" />
      </div>
      <div className="quince-tiara-in pointer-events-none absolute right-6 top-6 md:right-12 md:top-10">
        <Tiara width={130} className="opacity-55" flip />
      </div>

      <div className="quince-hero-in relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <SectionLabel>{landingTitle ?? t.invitation}</SectionLabel>

        <div className="relative mt-14 mb-10 flex items-center justify-center">
          <Tiara
            width={220}
            className="quince-tiara-in pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 md:-top-24"
          />

          <FloralWreath
            size={360}
            className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[360px] max-w-none -translate-x-1/2 -translate-y-1/2 md:w-[420px]"
          />

          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={honoreeName}
              className="relative h-56 w-56 rounded-full border-2 border-[#D4AF37]/70 object-cover shadow-[0_30px_60px_-32px_rgba(74,43,45,0.45)] md:h-72 md:w-72"
            />
          ) : (
            <div
              className="relative flex h-60 w-60 items-center justify-center rounded-full md:h-80 md:w-80"
              style={{
                background:
                  'linear-gradient(160deg, #E8B4BC 0%, #F5E6D3 100%)',
              }}
            >
              <span className="px-6 font-['Cormorant_Garamond',serif] text-3xl italic leading-tight text-[#4A2B2D] md:text-4xl">
                {honoreeName}
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#FBF7F4] shadow-[0_18px_38px_-22px_rgba(74,43,45,0.55)] md:h-24 md:w-24">
              {milestoneShort ? (
                <span className="font-['Playfair_Display',serif] text-2xl font-bold tracking-wide text-[#4A2B2D] md:text-3xl">
                  {milestoneShort}
                </span>
              ) : (
                <MedallionStar />
              )}
            </div>
          </div>
        </div>

        <h1 className="mt-10 font-['Cormorant_Garamond',serif] text-5xl italic leading-[1.05] text-[#4A2B2D] md:text-7xl">
          {honoreeName}
        </h1>

        <div className="mt-8 flex flex-col items-center gap-2">
          <span
            className="quince-shine font-['Playfair_Display',serif] text-3xl font-bold tracking-[0.18em] md:text-4xl"
            data-milestone={milestone}
          >
            {milestoneLabel}
          </span>
          <span className="mt-3 inline-block h-px w-16 bg-[#D4AF37]/70" />
        </div>

        <p className="mt-8 font-['Playfair_Display',serif] text-sm italic leading-relaxed text-[#4A2B2D]/75 md:text-base">
          {landingSubtitle ?? t.storyPre}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-3 font-['Playfair_Display',serif] text-[10px] uppercase tracking-[0.4em] text-[#C78283]">
            <span className="h-px w-6 bg-[#D4AF37]/70" />
            {t.saveTheDate}
            <span className="h-px w-6 bg-[#D4AF37]/70" />
          </span>
          <time
            dateTime={eventDate}
            className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#4A2B2D] md:text-3xl"
          >
            {formatLongDate(eventDate, locale)}
          </time>
        </div>
      </div>

      <div className="quince-tiara-in pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit">
        <Tiara width={220} className="opacity-45" />
      </div>
    </header>
  );
}

/* ---------- Story ---------- */

function StorySection({
  story,
  t,
}: {
  story: NonNullable<PublicInvitationPageProps['story']>;
  t: Labels;
}) {
  return (
    <section className="relative overflow-hidden bg-[#F5E6D3] px-6 py-20 md:py-28">
      <FloralWreath
        size={200}
        className="quince-spin-slow pointer-events-none absolute -left-16 top-6 opacity-25 md:-left-8"
      />
      <FloralWreath
        size={200}
        className="quince-spin-slow pointer-events-none absolute -right-16 bottom-6 opacity-25 md:-right-8"
      />

      <Reveal className="relative mx-auto max-w-2xl text-center">
        <SectionLabel>{t.storyLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#4A2B2D] md:text-4xl">
          {t.story}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-['Playfair_Display',serif] text-[15px] leading-[1.95] text-[#4A2B2D]/85">
          {story.body}
        </p>
        <Tiara width={120} className="mx-auto mt-10 opacity-80" />
      </Reveal>
    </section>
  );
}

/* ---------- Countdown ---------- */

function CountdownCell({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex w-[84px] flex-col items-center rounded-sm border border-[#D4AF37]/55 bg-[#FBF7F4]/90 px-3 py-4 md:w-[112px] md:px-4 md:py-5">
      <span className="font-['Playfair_Display',serif] text-3xl font-medium leading-none text-[#4A2B2D] md:text-5xl">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="mt-3 font-['Playfair_Display',serif] text-[9px] uppercase tracking-[0.3em] text-[#C78283] md:text-[11px]">
        {label}
      </span>
    </div>
  );
}

function CountdownSection({
  eventDate,
  t,
}: {
  eventDate: string;
  t: Labels;
}) {
  const c = useCountdown(eventDate);

  return (
    <section className="relative overflow-hidden bg-[#FBF7F4] px-6 py-20 md:py-24">
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <SectionLabel>{t.countdownLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#4A2B2D] md:text-4xl">
          {c.passed ? t.passed : t.countdownHeading}
        </h2>

        {c.passed ? (
          <p className="mt-8 font-['Playfair_Display',serif] text-sm italic text-[#4A2B2D]/65">
            {t.today}
          </p>
        ) : (
          <div className="mt-12 flex items-center justify-center gap-3 md:gap-5">
            <CountdownCell value={c.d} label={t.days} />
            <span className="font-['Playfair_Display',serif] text-2xl text-[#D4AF37] md:text-3xl">
              ·
            </span>
            <CountdownCell value={c.h} label={t.hours} />
            <span className="font-['Playfair_Display',serif] text-2xl text-[#D4AF37] md:text-3xl">
              ·
            </span>
            <CountdownCell value={c.m} label={t.minutes} />
            <span className="font-['Playfair_Display',serif] text-2xl text-[#D4AF37] md:text-3xl">
              ·
            </span>
            <CountdownCell value={c.s} label={t.seconds} />
          </div>
        )}
      </Reveal>
    </section>
  );
}

/* ---------- Locations ---------- */

function LocationsSection({
  locations,
  t,
  locale,
}: {
  locations: PublicInvitationPageProps['locations'];
  t: Labels;
  locale: Locale;
}) {
  if (locations.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#F5E6D3] px-6 py-20 md:py-24">
      <Reveal className="relative mx-auto max-w-4xl">
        <SectionLabel>{t.locationsLabel}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Garamond',serif] text-3xl italic text-[#4A2B2D] md:text-4xl">
          {t.locations}
        </h2>

        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {locations.map((loc, i) => {
            const isIsoTime =
              typeof loc.time === 'string' &&
              /^\d{4}-\d{2}-\d{2}/.test(loc.time);
            const timeText = loc.time
              ? isIsoTime
                ? formatShortDate(loc.time, locale)
                : loc.time
              : null;
            return (
              <li
                key={`${loc.label}-${i}`}
                className="quince-card relative flex flex-col gap-3 rounded-[2px] border border-[#D4AF37]/45 bg-[#FBF7F4]/90 px-7 py-8"
              >
                <RosePetal
                  size={16}
                  color="#E8B4BC"
                />
                <span className="inline-flex items-center gap-2 font-['Playfair_Display',serif] text-[10px] uppercase tracking-[0.4em] text-[#C78283]">
                  <span className="h-px w-5 bg-[#D4AF37]/70" />
                  {loc.label}
                </span>
                <h3 className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#4A2B2D] md:text-3xl">
                  {loc.name}
                </h3>
                {loc.address ? (
                  <p className="font-['Playfair_Display',serif] text-sm leading-relaxed text-[#4A2B2D]/80">
                    {loc.address}
                  </p>
                ) : null}
                {loc.city ? (
                  <p className="font-['Playfair_Display',serif] text-sm italic text-[#C78283]">
                    {loc.city}
                  </p>
                ) : null}
                {timeText ? (
                  <p className="font-['Cormorant_Garamond',serif] text-lg italic text-[#4A2B2D]/85">
                    {timeText}
                  </p>
                ) : null}
                {loc.mapsLink ? (
                  <a
                    href={loc.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center gap-2 border-b border-[#D4AF37]/60 pb-0.5 font-['Playfair_Display',serif] text-[11px] uppercase tracking-[0.25em] text-[#C78283] transition-colors duration-500 hover:border-[#C78283] hover:text-[#4A2B2D]"
                  >
                    {t.openInMaps}
                    <span className="h-px w-4 bg-current opacity-70" />
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

/* ---------- Program ---------- */

function ProgramSection({
  program,
  t,
  locale,
}: {
  program: PublicInvitationPageProps['program'];
  t: Labels;
  locale: Locale;
}) {
  if (program.days.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#FBF7F4] px-6 py-20 md:py-24">
      <Reveal className="relative mx-auto max-w-3xl">
        <SectionLabel>{t.programLabel}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Garamond',serif] text-3xl italic text-[#4A2B2D] md:text-4xl">
          {t.program}
        </h2>

        <div className="mt-12 flex flex-col gap-14">
          {program.days.map((day, d) => (
            <div
              key={`${day.date ?? 'day'}-${d}`}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="font-['Playfair_Display',serif] text-[10px] uppercase tracking-[0.4em] text-[#C78283]">
                  {day.label ?? `${t.dayFallback} ${d + 1}`}
                </span>
                {day.date ? (
                  <span className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#4A2B2D]">
                    {formatShortDate(day.date, locale)}
                  </span>
                ) : null}
                <span className="inline-block h-px w-16 bg-[#D4AF37]/70" />
              </div>

              <ol className="flex flex-col gap-4">
                {day.items.map((item, i) => (
                  <li
                    key={`${item.time}-${i}`}
                    className="quince-card flex flex-col gap-2 rounded-[2px] border border-[#D4AF37]/45 bg-[#F5E6D3]/55 px-6 py-6 md:flex-row md:items-baseline md:gap-8"
                  >
                    <span className="w-24 shrink-0 font-['Cormorant_Garamond',serif] text-xl italic text-[#C78283] md:text-2xl">
                      {item.time}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-['Cormorant_Garamond',serif] text-xl italic text-[#4A2B2D] md:text-2xl">
                        {item.title}
                      </h3>
                      {item.detail ? (
                        <p className="font-['Playfair_Display',serif] text-sm leading-relaxed text-[#4A2B2D]/75">
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- RSVP ---------- */

function RsvpSection({
  onRsvpClick,
  t,
}: {
  onRsvpClick?: () => void;
  t: Labels;
}) {
  return (
    <section className="relative overflow-hidden bg-[#E8B4BC] px-6 py-20 text-center md:py-28">
      <div className="quince-tiara-in pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
        <Tiara width={150} className="opacity-50" />
      </div>
      <Reveal className="relative mx-auto max-w-xl">
        <SectionLabel>{t.rsvpLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#4A2B2D] md:text-4xl">
          {t.rsvpHeading}
        </h2>
        <p className="mx-auto mt-6 max-w-md font-['Playfair_Display',serif] text-sm italic leading-relaxed text-[#4A2B2D]/85">
          {t.rsvpHint}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 opacity-90">
          <RosePetal size={12} color="#4A2B2D" />
          <RosePetal size={16} color="#4A2B2D" />
          <RosePetal size={12} color="#4A2B2D" />
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Footer ---------- */

function FooterSection({ t }: { t: Labels }) {
  return (
    <footer className="relative isolate overflow-hidden bg-[#C78283] px-6 pb-12 pt-16 text-center">
      <div className="quince-tiara-in pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
        <Tiara width={140} className="opacity-40" />
      </div>
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <span className="inline-block h-px w-24 bg-[#FBF7F4]/55" />
        <p className="font-['Cormorant_Garamond',serif] text-3xl italic text-[#FBF7F4] md:text-4xl">
          {t.poweredBy}
        </p>
        <p className="font-['Playfair_Display',serif] text-[10px] uppercase tracking-[0.4em] text-[#FBF7F4]/80">
          {t.craftedWith}
        </p>
        <span className="inline-block h-px w-24 bg-[#FBF7F4]/55" />
      </div>
    </footer>
  );
}

/* ---------- Template ---------- */

export default function QuinceaneraTemplate(props: PublicInvitationPageProps) {
  const { eventDate, story, locations, program, rsvpEnabled, onRsvpClick, locale } =
    props;
  const t = useLabels(locale);

  return (
    <main
      lang={locale}
      className="relative min-h-screen overflow-x-hidden bg-[#FBF7F4] font-['Playfair_Display',serif] text-[#4A2B2D] antialiased"
    >
      <ThemeAssets />

      <HeroSection props={props} t={t} />
      <Hairline />

      {story ? (
        <>
          <StorySection story={story} t={t} />
          <Hairline />
        </>
      ) : null}

      <CountdownSection eventDate={eventDate} t={t} />
      <Hairline />

      {locations.length > 0 ? (
        <>
          <LocationsSection locations={locations} t={t} locale={locale} />
          <Hairline />
        </>
      ) : null}

      {program.days.length > 0 ? (
        <>
          <ProgramSection program={program} t={t} locale={locale} />
          <Hairline />
        </>
      ) : null}

      {rsvpEnabled ? (
        <>
          <RsvpSection onRsvpClick={onRsvpClick} t={t} />
          <Hairline />
        </>
      ) : null}

      <FooterSection t={t} />
    </main>
  );
}