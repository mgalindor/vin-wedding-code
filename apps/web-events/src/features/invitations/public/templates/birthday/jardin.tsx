/**
 * JardinTemplate — Birthday invitation template.
 *
 * THEME — "JARDÍN"
 * An outdoor brunch birthday for a woman between 30 and 50. Long tables under
 * the trees, linen napkins, pastel flowers in glass jars. The page breathes:
 * cream and water-green sections alternate behind delicate serif typography,
 * botanical illustrations grow from the corners, and a few leaves fall slowly
 * across the hero. Intimate, feminine, unhurried, elegant.
 *
 * PALETTE (exact)
 *   Cream       #F0EBE3  — paper background, odd sections
 *   Water green #D4E4D4  — garden wash, even sections
 *   Dusty rose  #E8C5C5  — card borders, RSVP button, petals
 *   Dark sage   #7A9B76  — leaves, hairlines, section labels
 *   Text dark   #3D4F3D  — typography
 *
 * TYPOGRAPHY
 *   Display: Cormorant Infant (italic for the honoree name and numerals)
 *   Body/UI: Lora
 *   Both loaded through Google Fonts <link> tags rendered by the component.
 *
 * AESTHETIC VOCABULARY
 *   Inline SVG botanicals only: fern fronds, eucalyptus sprigs, single leaves,
 *   five-petal blossoms and a full wreath for the photo-less hero fallback.
 *   1px sage hairlines between sections. Section labels uppercase with
 *   0.4em tracking. Countdown numerals separated by tiny leaf glyphs.
 *   Locations and program entries are soft cards with a dusty-rose border.
 *   RSVP button: dusty rose fill, white text, sage border; on hover it fills
 *   sage and the label turns rose.
 *
 * MOTION
 *   Falling leaves in the hero (6 leaves, 7–11s, staggered) plus a very slow
 *   fade-in on scroll. Everything is disabled under
 *   `prefers-reduced-motion: reduce`.
 *
 * CONSTRAINTS
 *   Self-contained: React only, no aliases, no shared components, no external
 *   assets, no third-party libraries. Strict TypeScript, no `any`.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

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
    invitation: 'You are invited',
    turns: 'turns',
    years: 'years',
    birthdayOf: 'the birthday brunch of',
    story: 'About her',
    storyLabel: 'A few words',
    countdownHeading: 'Until the celebration',
    countdownLabel: 'Counting the days',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    locations: 'Where',
    locationsLabel: 'The garden',
    program: 'The day',
    programLabel: 'Schedule',
    dayFallback: 'Day',
    rsvpLabel: 'Your seat',
    rsvpHeading: 'Will you join us?',
    rsvpHint: 'A table is being set — let us know if a chair is yours.',
    rsvp: 'Confirm attendance',
    openInMaps: 'Open in Maps',
    today: 'Today is the day',
    passed: 'A lovely morning already lived',
    craftedWith: 'Crafted with care by',
    poweredBy: 'Deer Planner',
  },
  es: {
    saveTheDate: 'Reservá la fecha',
    invitation: 'Estás invitada',
    turns: 'cumple',
    years: 'años',
    birthdayOf: 'el brunch de cumpleaños de',
    story: 'Sobre ella',
    storyLabel: 'Unas palabras',
    countdownHeading: 'Para la celebración',
    countdownLabel: 'Contando los días',
    days: 'días',
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    locations: 'Dónde',
    locationsLabel: 'El jardín',
    program: 'El día',
    programLabel: 'Cronograma',
    dayFallback: 'Día',
    rsvpLabel: 'Tu lugar',
    rsvpHeading: '¿Nos acompañás?',
    rsvpHint: 'La mesa se está preparando — contanos si una silla es tuya.',
    rsvp: 'Confirmar asistencia',
    openInMaps: 'Abrir en Maps',
    today: 'Hoy es el día',
    passed: 'Una mañana preciosa ya vivida',
    craftedWith: 'Hecho con cariño por',
    poweredBy: 'Deer Planner',
  },
} as const;

type Labels = { readonly [K in keyof (typeof labels)['en']]: string };

const useLabels = (locale: Locale): Labels => labels[locale];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
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

const JARDIN_CSS = `
  @keyframes jardin-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes jardin-fall {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg);      opacity: 0; }
    12%  { opacity: 0.75; }
    50%  { transform: translate3d(2.5vw, 45vh, 0) rotate(140deg); opacity: 0.7; }
    88%  { opacity: 0.35; }
    100% { transform: translate3d(-2vw, 104vh, 0) rotate(320deg); opacity: 0; }
  }
  @keyframes jardin-sway {
    0%, 100% { transform: rotate(-2deg); }
    50%      { transform: rotate(2deg); }
  }
  .jardin-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 1600ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 1600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .jardin-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .jardin-hero-in {
    opacity: 0;
    animation: jardin-fade-up 2200ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .jardin-leaf {
    position: absolute;
    top: 0;
    will-change: transform, opacity;
    animation-name: jardin-fall;
    animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
    animation-iteration-count: infinite;
  }
  .jardin-sway {
    transform-origin: 50% 0%;
    animation: jardin-sway 9s ease-in-out infinite;
  }
  .jardin-cta {
    transition:
      background-color 600ms ease,
      color 600ms ease,
      border-color 600ms ease,
      box-shadow 600ms ease,
      transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .jardin-cta:hover {
    background-color: #7A9B76;
    color: #E8C5C5;
    border-color: #E8C5C5;
    transform: translateY(-2px);
  }
  .jardin-card {
    transition:
      border-color 700ms ease,
      box-shadow 700ms ease,
      transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .jardin-card:hover {
    border-color: #7A9B76;
    transform: translateY(-3px);
  }
  @media (prefers-reduced-motion: reduce) {
    .jardin-reveal,
    .jardin-reveal.is-visible,
    .jardin-hero-in,
    .jardin-leaf,
    .jardin-sway,
    .jardin-cta,
    .jardin-card {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
      transition: none !important;
    }
    .jardin-leaf { display: none !important; }
  }
`;

function ThemeAssets() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Infant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap"
      />
      <style>{JARDIN_CSS}</style>
    </>
  );
}

/* ---------- Botanical SVG primitives ---------- */

function LeafGlyph({
  size = 12,
  className,
  color = '#7A9B76',
  opacity = 0.85,
}: {
  size?: number;
  className?: string;
  color?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 2 C 5 7, 5 17, 12 22 C 19 17, 19 7, 12 2 Z"
        fill={color}
        opacity={opacity}
      />
      <path d="M12 4.5 L 12 20.5" stroke="#F0EBE3" strokeWidth="0.7" opacity="0.65" />
    </svg>
  );
}

function Blossom({
  size = 26,
  className,
  petal = '#E8C5C5',
  heart = '#7A9B76',
  opacity = 0.9,
}: {
  size?: number;
  className?: string;
  petal?: string;
  heart?: string;
  opacity?: number;
}) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      <g opacity={opacity}>
        {petals.map((a) => (
          <ellipse
            key={a}
            cx="24"
            cy="13"
            rx="6.5"
            ry="10"
            fill={petal}
            transform={`rotate(${a} 24 24)`}
          />
        ))}
        <circle cx="24" cy="24" r="4.2" fill={heart} opacity="0.85" />
      </g>
    </svg>
  );
}

function FernFrond({
  side,
  className,
  opacity = 0.55,
  color = '#7A9B76',
}: {
  side: 'tl' | 'tr' | 'bl' | 'br';
  className?: string;
  opacity?: number;
  color?: string;
}) {
  const flip = {
    tl: 'scale(1, 1)',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  }[side];

  const leaflets = useMemo(() => {
    const arr: Array<{ i: number; dir: number; y: number; len: number }> = [];
    const count = 18;
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      arr.push({
        i,
        dir: i % 2 === 0 ? -1 : 1,
        y: 26 + t * 216,
        len: 34 - t * 20,
      });
    }
    return arr;
  }, []);

  return (
    <svg
      viewBox="0 0 200 270"
      className={className}
      fill="none"
      style={{ transform: flip, transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <path
        d="M 108 262 Q 94 198, 101 128 Q 107 66, 118 16"
        stroke={color}
        strokeWidth="1.1"
        opacity={opacity * 0.8}
      />
      {leaflets.map((leaf) => {
        const cx = 100 + leaf.dir * leaf.len * 0.5;
        const cy = leaf.y - leaf.len * 0.42;
        return (
          <ellipse
            key={leaf.i}
            cx={cx}
            cy={cy}
            rx={leaf.len * 0.5}
            ry={leaf.len * 0.15 + 1.6}
            fill={color}
            opacity={opacity * 0.75}
            transform={`rotate(${leaf.dir * 26} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx="118" cy="16" r="2.2" fill={color} opacity={opacity} />
    </svg>
  );
}

function EucalyptusSprig({
  className,
  flip = false,
  opacity = 0.7,
  leafFill = '#D4E4D4',
  stroke = '#7A9B76',
}: {
  className?: string;
  flip?: boolean;
  opacity?: number;
  leafFill?: string;
  stroke?: string;
}) {
  const leaves = useMemo(
    () =>
      [20, 48, 76, 106, 136, 166, 196, 226, 256, 286].map((x, i) => ({
        x,
        dir: i % 2 === 0 ? -1 : 1,
        r: 7 + (i % 3),
        cy: 35 + (i % 2 === 0 ? -5 : 5),
      })),
    [],
  );
  return (
    <svg
      viewBox="0 0 320 70"
      className={className}
      fill="none"
      style={{ transform: flip ? 'scale(-1, 1)' : undefined, transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <path
        d="M 4 36 Q 82 27, 160 38 Q 240 47, 316 31"
        stroke={stroke}
        strokeWidth="0.9"
        opacity={opacity * 0.75}
      />
      {leaves.map((leaf) => (
        <ellipse
          key={leaf.x}
          cx={leaf.x}
          cy={leaf.cy}
          rx={leaf.r}
          ry={leaf.r * 0.72}
          fill={leafFill}
          stroke={stroke}
          strokeWidth="0.8"
          opacity={opacity}
          transform={`rotate(${leaf.dir * 24} ${leaf.x} ${leaf.cy})`}
        />
      ))}
    </svg>
  );
}

function BotanicalWreath({ size = 300, className }: { size?: number; className?: string }) {
  const ring = useMemo(() => {
    const arr: Array<{ i: number; angle: number; len: number; rose: boolean }> = [];
    const count = 34;
    for (let i = 0; i < count; i += 1) {
      arr.push({
        i,
        angle: (i / count) * 360,
        len: 12 + (i % 4) * 2.2,
        rose: i % 7 === 0,
      });
    }
    return arr;
  }, []);
  const half = size / 2;
  const radius = half - 12;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle cx={half} cy={half} r={radius - 6} fill="none" stroke="#7A9B76" strokeWidth="1" opacity="0.4" />
      {ring.map((leaf) => {
        const rad = (leaf.angle * Math.PI) / 180;
        const cx = half + Math.cos(rad) * radius;
        const cy = half + Math.sin(rad) * radius;
        return (
          <ellipse
            key={leaf.i}
            cx={cx}
            cy={cy}
            rx={leaf.len}
            ry={3.4}
            fill={leaf.rose ? '#E8C5C5' : '#7A9B76'}
            opacity={leaf.rose ? 0.85 : 0.6}
            transform={`rotate(${leaf.angle + 90} ${cx} ${cy})`}
          />
        );
      })}
      {[30, 150, 270].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <circle
            key={a}
            cx={half + Math.cos(rad) * (radius - 14)}
            cy={half + Math.sin(rad) * (radius - 14)}
            r="3.4"
            fill="#E8C5C5"
            opacity="0.9"
          />
        );
      })}
    </svg>
  );
}

interface FallingLeafSpec {
  id: number;
  left: string;
  duration: string;
  delay: string;
  size: number;
  color: string;
  opacity: number;
}

const FALLING_LEAVES: readonly FallingLeafSpec[] = [
  { id: 0, left: '8%', duration: '9.5s', delay: '0s', size: 16, color: '#7A9B76', opacity: 0.5 },
  { id: 1, left: '23%', duration: '11s', delay: '1.8s', size: 12, color: '#E8C5C5', opacity: 0.6 },
  { id: 2, left: '41%', duration: '8s', delay: '3.4s', size: 18, color: '#7A9B76', opacity: 0.4 },
  { id: 3, left: '58%', duration: '10.5s', delay: '0.9s', size: 13, color: '#D4E4D4', opacity: 0.75 },
  { id: 4, left: '74%', duration: '7.5s', delay: '4.6s', size: 15, color: '#E8C5C5', opacity: 0.5 },
  { id: 5, left: '89%', duration: '10s', delay: '2.6s', size: 11, color: '#7A9B76', opacity: 0.45 },
];

function FallingLeaves() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {FALLING_LEAVES.map((leaf) => (
        <span
          key={leaf.id}
          className="jardin-leaf"
          style={{
            left: leaf.left,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
          }}
        >
          <LeafGlyph size={leaf.size} color={leaf.color} opacity={leaf.opacity} />
        </span>
      ))}
    </div>
  );
}

/* ---------- Layout primitives ---------- */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-8 bg-[#7A9B76]/45" />
      <span className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76] md:text-[11px]">
        {children}
      </span>
      <span className="h-px w-8 bg-[#7A9B76]/45" />
    </div>
  );
}

function Hairline() {
  return <div className="h-px w-full bg-[#7A9B76]/35" aria-hidden="true" />;
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
      className={`jardin-reveal ${className ?? ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function CornerBotanicals({ tone = 'sage' }: { tone?: 'sage' | 'rose' }) {
  const color = tone === 'rose' ? '#E8C5C5' : '#7A9B76';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <FernFrond side="tl" color={color} opacity={0.32} className="absolute -top-6 -left-8 h-40 w-auto md:h-52" />
      <FernFrond side="br" color={color} opacity={0.32} className="absolute -bottom-6 -right-8 h-40 w-auto md:h-52" />
      <Blossom size={22} className="absolute left-6 bottom-10 opacity-40 md:left-14" />
      <Blossom size={18} className="absolute right-8 top-12 opacity-35 md:right-16" />
    </div>
  );
}

/* ---------- Sections ---------- */

function HeroSection({ props, t }: { props: PublicInvitationPageProps; t: Labels }) {
  const {
    honoreeName,
    ageTurning,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    locale,
  } = props;

  return (
    <header className="relative isolate overflow-hidden bg-[#F0EBE3] px-6 pb-24 pt-16 md:pb-32 md:pt-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #D4E4D4 0%, rgba(212,228,212,0.35) 42%, rgba(240,235,227,0) 78%)',
        }}
      />
      <FallingLeaves />

      <FernFrond side="tl" className="pointer-events-none absolute -top-4 -left-6 h-48 w-auto opacity-60 md:h-72" />
      <FernFrond side="tr" className="pointer-events-none absolute -top-4 -right-6 h-48 w-auto opacity-60 md:h-72" />

      <div className="jardin-hero-in relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <SectionLabel>{landingTitle ?? t.invitation}</SectionLabel>

        <div className="relative mt-12 mb-10 flex items-center justify-center">
          <EucalyptusSprig className="jardin-sway pointer-events-none absolute -top-8 left-1/2 w-56 -translate-x-1/2 opacity-80 md:w-72" />
          <EucalyptusSprig
            flip
            className="pointer-events-none absolute -bottom-8 left-1/2 w-56 -translate-x-1/2 opacity-80 md:w-72"
          />
          <Blossom size={30} className="pointer-events-none absolute -left-6 top-6 opacity-90 md:-left-12" />
          <Blossom size={22} className="pointer-events-none absolute -right-5 bottom-8 opacity-80 md:-right-10" />

          {heroImageUrl ? (
            <div className="relative">
              <BotanicalWreath
                size={340}
                className="pointer-events-none absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2 opacity-70"
              />
              <img
                src={heroImageUrl}
                alt=""
                className="relative h-56 w-56 rounded-full border border-[#E8C5C5] object-cover shadow-[0_28px_60px_-32px_rgba(61,79,61,0.45)] md:h-72 md:w-72"
              />
            </div>
          ) : (
            <div
              className="relative flex h-64 w-64 items-center justify-center rounded-full md:h-80 md:w-80"
              style={{ background: 'linear-gradient(160deg, #F0EBE3 0%, #D4E4D4 100%)' }}
            >
              <BotanicalWreath
                size={320}
                className="pointer-events-none absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
              />
              <span className="px-8 font-['Cormorant_Infant',serif] text-4xl italic leading-tight text-[#3D4F3D] md:text-5xl">
                {honoreeName}
              </span>
            </div>
          )}
        </div>

        <h1 className="font-['Cormorant_Infant',serif] text-5xl italic leading-[1.05] text-[#3D4F3D] md:text-7xl">
          {honoreeName}
        </h1>

        {typeof ageTurning === 'number' ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <span className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76]">
              {t.turns}
            </span>
            <span className="flex h-24 w-24 items-center justify-center rounded-full border border-[#7A9B76] font-['Cormorant_Infant',serif] text-4xl italic text-[#3D4F3D] md:h-28 md:w-28 md:text-5xl">
              {ageTurning}
            </span>
            <span className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76]">
              {t.years}
            </span>
          </div>
        ) : null}

        <p className="mt-8 font-['Lora',serif] text-sm italic leading-relaxed text-[#3D4F3D]/70 md:text-base">
          {landingSubtitle ?? t.birthdayOf}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-3 font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76]">
            <LeafGlyph size={10} />
            {t.saveTheDate}
            <LeafGlyph size={10} />
          </span>
          <time
            dateTime={eventDate}
            className="font-['Cormorant_Infant',serif] text-2xl italic text-[#3D4F3D] md:text-3xl"
          >
            {formatLongDate(eventDate, locale)}
          </time>
        </div>
      </div>

      <EucalyptusSprig className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-[420px] max-w-[78vw] opacity-60" />
    </header>
  );
}

function StorySection({
  story,
  t,
}: {
  story: NonNullable<PublicInvitationPageProps['story']>;
  t: Labels;
}) {
  return (
    <section className="relative overflow-hidden bg-[#D4E4D4] px-6 py-20 md:py-28">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <SectionLabel>{t.storyLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#3D4F3D] md:text-4xl">
          {t.story}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-['Lora',serif] text-[15px] leading-[1.95] text-[#3D4F3D]/85">
          {story.body}
        </p>
        <Blossom size={24} className="mx-auto mt-10 opacity-90" />
      </Reveal>
    </section>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-['Cormorant_Infant',serif] text-4xl italic leading-none text-[#3D4F3D] md:text-6xl">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="mt-3 font-['Lora',serif] text-[9px] uppercase tracking-[0.3em] text-[#7A9B76] md:text-[11px]">
        {label}
      </span>
    </div>
  );
}

function CountdownSection({ eventDate, t }: { eventDate: string; t: Labels }) {
  const c = useCountdown(eventDate);

  return (
    <section className="relative overflow-hidden bg-[#F0EBE3] px-6 py-20 md:py-24">
      <CornerBotanicals />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <SectionLabel>{t.countdownLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#3D4F3D] md:text-4xl">
          {c.passed ? t.passed : t.countdownHeading}
        </h2>

        {c.passed ? (
          <p className="mt-8 font-['Lora',serif] text-sm italic text-[#3D4F3D]/65">{t.today}</p>
        ) : (
          <div className="mt-12 flex items-center justify-center gap-3 md:gap-6">
            <CountdownCell value={c.d} label={t.days} />
            <LeafGlyph size={13} className="opacity-70" />
            <CountdownCell value={c.h} label={t.hours} />
            <LeafGlyph size={13} className="opacity-70" />
            <CountdownCell value={c.m} label={t.minutes} />
            <LeafGlyph size={13} className="opacity-70" />
            <CountdownCell value={c.s} label={t.seconds} />
          </div>
        )}
      </Reveal>
    </section>
  );
}

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
    <section className="relative overflow-hidden bg-[#D4E4D4] px-6 py-20 md:py-24">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-4xl">
        <SectionLabel>{t.locationsLabel}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Infant',serif] text-3xl italic text-[#3D4F3D] md:text-4xl">
          {t.locations}
        </h2>

        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {locations.map((loc, i) => {
            const isIsoTime = typeof loc.time === 'string' && /^\d{4}-\d{2}-\d{2}/.test(loc.time);
            const timeText = loc.time
              ? isIsoTime
                ? formatShortDate(loc.time, locale)
                : loc.time
              : null;
            return (
              <li
                key={`${loc.label}-${i}`}
                className="jardin-card relative flex flex-col gap-3 rounded-[2px] border border-[#E8C5C5] bg-[#F0EBE3]/85 px-7 py-8"
              >
                <Blossom
                  size={18}
                  className="pointer-events-none absolute -right-2 -top-2 opacity-80"
                />
                <span className="inline-flex items-center gap-2 font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76]">
                  <LeafGlyph size={9} />
                  {loc.label}
                </span>
                <h3 className="font-['Cormorant_Infant',serif] text-2xl italic text-[#3D4F3D] md:text-3xl">
                  {loc.name}
                </h3>
                {loc.address ? (
                  <p className="font-['Lora',serif] text-sm leading-relaxed text-[#3D4F3D]/80">
                    {loc.address}
                  </p>
                ) : null}
                {loc.city ? (
                  <p className="font-['Lora',serif] text-sm italic text-[#7A9B76]">{loc.city}</p>
                ) : null}
                {timeText ? (
                  <p className="font-['Cormorant_Infant',serif] text-lg italic text-[#3D4F3D]/80">
                    {timeText}
                  </p>
                ) : null}
                {loc.mapsLink ? (
                  <a
                    href={loc.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center gap-2 border-b border-[#7A9B76]/50 pb-0.5 font-['Lora',serif] text-[11px] uppercase tracking-[0.25em] text-[#7A9B76] transition-colors duration-500 hover:border-[#E8C5C5] hover:text-[#3D4F3D]"
                  >
                    {t.openInMaps}
                    <LeafGlyph size={9} />
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
    <section className="relative overflow-hidden bg-[#F0EBE3] px-6 py-20 md:py-24">
      <CornerBotanicals />
      <Reveal className="relative mx-auto max-w-3xl">
        <SectionLabel>{t.programLabel}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Infant',serif] text-3xl italic text-[#3D4F3D] md:text-4xl">
          {t.program}
        </h2>

        <div className="mt-12 flex flex-col gap-14">
          {program.days.map((day, d) => (
            <div key={`${day.date ?? 'day'}-${d}`} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76]">
                  {day.label ?? `${t.dayFallback} ${d + 1}`}
                </span>
                {day.date ? (
                  <span className="font-['Cormorant_Infant',serif] text-2xl italic text-[#3D4F3D]">
                    {formatShortDate(day.date, locale)}
                  </span>
                ) : null}
                <EucalyptusSprig className="w-40 opacity-70" />
              </div>

              <ol className="flex flex-col gap-4">
                {day.items.map((item, i) => (
                  <li
                    key={`${item.time}-${i}`}
                    className="jardin-card flex flex-col gap-2 rounded-[2px] border border-[#E8C5C5] bg-[#D4E4D4]/45 px-6 py-6 md:flex-row md:items-baseline md:gap-8"
                  >
                    <span className="w-24 shrink-0 font-['Cormorant_Infant',serif] text-xl italic text-[#7A9B76] md:text-2xl">
                      {item.time}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-['Cormorant_Infant',serif] text-xl italic text-[#3D4F3D] md:text-2xl">
                        {item.title}
                      </h3>
                      {item.detail ? (
                        <p className="font-['Lora',serif] text-sm leading-relaxed text-[#3D4F3D]/75">
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

function RsvpSection({
  onRsvpClick,
  t,
}: {
  onRsvpClick?: () => void;
  t: Labels;
}) {
  return (
    <section className="relative overflow-hidden bg-[#D4E4D4] px-6 py-20 text-center md:py-28">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-xl">
        <SectionLabel>{t.rsvpLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#3D4F3D] md:text-4xl">
          {t.rsvpHeading}
        </h2>
        <p className="mx-auto mt-6 max-w-md font-['Lora',serif] text-sm italic leading-relaxed text-[#3D4F3D]/75">
          {t.rsvpHint}
        </p>
        <button
          type="button"
          onClick={onRsvpClick}
          className="jardin-cta mt-10 inline-flex items-center justify-center gap-3 rounded-full border border-[#7A9B76] bg-[#E8C5C5] px-12 py-4 font-['Lora',serif] text-[11px] uppercase tracking-[0.3em] text-white shadow-[0_20px_44px_-28px_rgba(61,79,61,0.6)]"
        >
          {t.rsvp}
        </button>
        <div className="mt-10 flex items-center justify-center gap-4 opacity-80">
          <LeafGlyph size={12} />
          <Blossom size={18} />
          <LeafGlyph size={12} />
        </div>
      </Reveal>
    </section>
  );
}

function FooterSection({ t }: { t: Labels }) {
  return (
    <footer className="relative isolate overflow-hidden bg-[#F0EBE3] px-6 pb-12 pt-16 text-center">
      <FernFrond side="bl" className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-auto opacity-50 md:h-52" />
      <FernFrond side="br" className="pointer-events-none absolute -bottom-6 -right-6 h-36 w-auto opacity-50 md:h-52" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <EucalyptusSprig className="w-[320px] max-w-[70vw] opacity-70" />
        <p className="font-['Cormorant_Infant',serif] text-2xl italic text-[#3D4F3D] md:text-3xl">
          {t.poweredBy}
        </p>
        <p className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#7A9B76]">
          {t.craftedWith}
        </p>
      </div>
    </footer>
  );
}

/* ---------- Template ---------- */

export default function JardinTemplate(props: PublicInvitationPageProps) {
  const { eventDate, story, locations, program, rsvpEnabled, onRsvpClick, locale } = props;
  const t = useLabels(locale);

  return (
    <main
      lang={locale}
      className="relative min-h-screen overflow-x-hidden bg-[#F0EBE3] font-['Lora',serif] text-[#3D4F3D] antialiased"
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
