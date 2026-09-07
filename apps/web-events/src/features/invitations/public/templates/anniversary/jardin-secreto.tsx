/**
 * JardinSecretoTemplate — Anniversary invitation template.
 *
 * THEME — "JARDÍN SECRETO" (Secret Garden)
 * An intimate anniversary celebration in a private garden. The page reads like
 * a love letter left beneath an ivy arch: deep greens and antique rose alternate
 * behind delicate serif typography, botanical illustrations (ferns, rose sprigs,
 * ivy curls) lean from the corners, and slow-falling leaves drift across the
 * hero. The vibe is secretive, romantic, a love nurtured in private.
 *
 * The milestone number shown in the hero comes from `yearsCelebrating` in the
 * props, rendered in Cormorant Infant italic with an antique-rose accent and a
 * small ivy/rose sprig flanking it.
 *
 * PALETTE (exact)
 *   Deep green     #2C3E2D  — primary sections, primary text, RSVP fill
 *   Sage           #7A9B76  — section labels, hairlines, accents, hover borders
 *   Antique rose   #D4A5A5  — milestone number, card borders, petals
 *   Soft cream     #F4EFE6  — paper background, card surfaces, primary text on dark
 *   Dark text      #1F1F1F  — body copy on cream
 *
 * TYPOGRAPHY
 *   Display: Cormorant Infant (italic for honoree name, h1, h2, milestone number)
 *   Body/UI: Lora
 *   Both loaded through Google Fonts <link> tags rendered by the component.
 *
 * AESTHETIC VOCABULARY
 *   Inline SVG botanicals only: fern fronds with elliptical leaflets, thorned
 *   rose sprigs, ivy curls, five-petal rose blossoms and a full wreath for the
 *   photo-less hero fallback. 1px sage hairlines between sections. Section
 *   labels uppercase with 0.4em tracking. Countdown numerals separated by tiny
 *   rose SVG glyphs. Locations and program entries are soft cream cards with an
 *   antique-rose border and a small fern glyph.
 *
 * MOTION
 *   Falling leaves in the hero (7 leaves, mix of maple + oak shapes, deep green
 *   and sage, 7–12s, staggered) plus a very slow fade-up on scroll reveal.
 *   Everything is disabled under `prefers-reduced-motion: reduce`.
 *
 * CONSTRAINTS
 *   Self-contained: React only, no aliases, no shared components, no external
 *   assets, no third-party libraries. Strict TypeScript, no `any`.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

export interface PublicInvitationPageProps {
  honoreeName: string; // e.g. "Marta & Luis"
  yearsCelebrating: number;
  eventDate: string; // ISO date e.g. '2026-11-08'
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

type Locale = 'en' | 'es';

const labels = {
  en: {
    invitation: 'You are invited',
    saveTheDate: 'Save the date',
    yearsTogether: 'years together',
    story: 'Their story',
    storyLabel: 'A private word',
    countdownLabel: 'Until we meet again',
    countdownHeading: 'The garden is waiting',
    countdownPast: 'Today we celebrate',
    countdownUntil: 'until the evening',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    locations: 'Where',
    locationsLabel: 'The garden',
    locationsHint: 'A secret corner awaits',
    openInMaps: 'Open in Maps',
    program: 'The evening',
    programLabel: 'Programme',
    dayFallback: 'Day',
    dressCodeLabel: 'Attire',
    dressCode: 'Dress code',
    giftLabel: 'Gifts',
    giftRegistry: 'Gift registry',
    rsvpLabel: 'Your presence',
    rsvpHeading: 'Will you join us?',
    rsvpHint: 'A garden gate is left open — let us know you are coming.',
    rsvp: 'Confirm attendance',
    craftedWith: 'Cultivated with care by',
    poweredBy: 'Deer Planner',
  },
  es: {
    invitation: 'Están invitados',
    saveTheDate: 'Reservá la fecha',
    yearsTogether: 'años juntos',
    story: 'Su historia',
    storyLabel: 'Una palabra privada',
    countdownLabel: 'Hasta el reencuentro',
    countdownHeading: 'El jardín espera',
    countdownPast: 'Hoy celebramos',
    countdownUntil: 'hasta la velada',
    days: 'días',
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    locations: 'Dónde',
    locationsLabel: 'El jardín',
    locationsHint: 'Un rincón secreto espera',
    openInMaps: 'Abrir en Maps',
    program: 'La velada',
    programLabel: 'Programa',
    dayFallback: 'Día',
    dressCodeLabel: 'Vestimenta',
    dressCode: 'Código de vestimenta',
    giftLabel: 'Regalos',
    giftRegistry: 'Mesa de regalos',
    rsvpLabel: 'Tu presencia',
    rsvpHeading: '¿Nos acompañás?',
    rsvpHint: 'La puerta del jardín queda abierta — contanos si vendrás.',
    rsvp: 'Confirmar asistencia',
    craftedWith: 'Cultivado con cariño por',
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

const JARDIN_SECRETO_CSS = `
  @keyframes js-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes js-fall {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg);       opacity: 0; }
    12%  { opacity: 0.78; }
    50%  { transform: translate3d(2.6vw, 45vh, 0) rotate(150deg); opacity: 0.72; }
    88%  { opacity: 0.32; }
    100% { transform: translate3d(-2vw, 104vh, 0) rotate(330deg);  opacity: 0; }
  }
  @keyframes js-sway {
    0%, 100% { transform: rotate(-2deg); }
    50%      { transform: rotate(2deg); }
  }
  .js-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 1600ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 1600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .js-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .js-hero-in {
    opacity: 0;
    animation: js-fade-up 2400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  .js-leaf {
    position: absolute;
    top: 0;
    will-change: transform, opacity;
    animation-name: js-fall;
    animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
    animation-iteration-count: infinite;
  }
  .js-sway {
    transform-origin: 50% 0%;
    animation: js-sway 9s ease-in-out infinite;
  }
  .js-cta {
    transition:
      background-color 600ms ease,
      color 600ms ease,
      border-color 600ms ease,
      box-shadow 600ms ease,
      transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .js-cta:hover {
    border-color: #7A9B76;
    box-shadow: 0 0 0 2px #7A9B76, 0 20px 44px -28px rgba(31,31,31,0.55);
    transform: translateY(-2px);
  }
  .js-card {
    transition:
      border-color 700ms ease,
      box-shadow 700ms ease,
      transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .js-card:hover {
    border-color: #7A9B76;
    transform: translateY(-3px);
  }
  @media (prefers-reduced-motion: reduce) {
    .js-reveal,
    .js-reveal.is-visible,
    .js-hero-in,
    .js-leaf,
    .js-sway,
    .js-cta,
    .js-card {
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
      transition: none !important;
    }
    .js-leaf { display: none !important; }
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
      <style>{JARDIN_SECRETO_CSS}</style>
    </>
  );
}

/* ---------- Botanical SVG primitives ---------- */

function RoseGlyph({
  size = 14,
  className,
  petal = '#D4A5A5',
  heart = '#2C3E2D',
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
        <circle cx="24" cy="24" r="3.6" fill={heart} opacity="0.85" />
      </g>
    </svg>
  );
}

function FernFrond({
  side,
  className,
  opacity = 0.55,
  color = '#2C3E2D',
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
        opacity={opacity * 0.85}
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

function RoseSprig({
  className,
  flip = false,
  opacity = 0.7,
  leafFill = '#7A9B76',
  flower = '#D4A5A5',
  stem = '#2C3E2D',
}: {
  className?: string;
  flip?: boolean;
  opacity?: number;
  leafFill?: string;
  flower?: string;
  stem?: string;
}) {
  const leaves = useMemo(
    () =>
      [22, 52, 82, 116, 154, 196, 240, 286, 332].map((x, i) => ({
        x,
        dir: i % 2 === 0 ? -1 : 1,
        r: 7 + (i % 3),
        cy: 30 + (i % 2 === 0 ? -6 : 6),
      })),
    [],
  );

  const blooms = useMemo(
    () => [
      { x: 36, y: 30, r: 11 },
      { x: 168, y: 36, r: 8 },
      { x: 308, y: 28, r: 12 },
    ],
    [],
  );

  return (
    <svg
      viewBox="0 0 340 70"
      className={className}
      fill="none"
      style={{ transform: flip ? 'scale(-1, 1)' : undefined, transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <path
        d="M 4 38 Q 88 28, 170 40 Q 252 50, 336 32"
        stroke={stem}
        strokeWidth="1"
        opacity={opacity * 0.85}
      />
      <path d="M 90 33 l -2 -3" stroke={stem} strokeWidth="0.7" opacity={opacity * 0.7} />
      <path d="M 90 43 l -2 3" stroke={stem} strokeWidth="0.7" opacity={opacity * 0.7} />
      <path d="M 220 38 l -2 -3" stroke={stem} strokeWidth="0.7" opacity={opacity * 0.7} />
      <path d="M 220 48 l -2 3" stroke={stem} strokeWidth="0.7" opacity={opacity * 0.7} />

      {leaves.map((leaf) => (
        <ellipse
          key={leaf.x}
          cx={leaf.x}
          cy={leaf.cy}
          rx={leaf.r}
          ry={leaf.r * 0.72}
          fill={leafFill}
          stroke={stem}
          strokeWidth="0.7"
          opacity={opacity}
          transform={`rotate(${leaf.dir * 24} ${leaf.x} ${leaf.cy})`}
        />
      ))}

      {blooms.map((b) => {
        const petals = [0, 60, 120, 180, 240, 300];
        return (
          <g key={`${b.x}-${b.y}`} transform={`translate(${b.x} ${b.y})`} opacity={opacity}>
            {petals.map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy={-b.r * 0.55}
                rx={b.r * 0.55}
                ry={b.r * 0.95}
                fill={flower}
                transform={`rotate(${a})`}
              />
            ))}
            <circle cx="0" cy="0" r={b.r * 0.32} fill={stem} opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

function IvyCurl({
  side,
  className,
  color = '#7A9B76',
  opacity = 0.55,
}: {
  side: 'tl' | 'tr' | 'bl' | 'br';
  className?: string;
  color?: string;
  opacity?: number;
}) {
  const flip = {
    tl: 'scale(1, 1)',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  }[side];

  const leaves = useMemo(
    () => [
      { x: 22, y: 60, r: 9, a: -30 },
      { x: 46, y: 36, r: 11, a: -10 },
      { x: 80, y: 22, r: 13, a: 10 },
      { x: 116, y: 36, r: 11, a: 30 },
      { x: 30, y: 88, r: 7, a: 30 },
      { x: 64, y: 64, r: 9, a: -10 },
      { x: 96, y: 60, r: 10, a: 30 },
    ],
    [],
  );

  return (
    <svg
      viewBox="0 0 140 110"
      className={className}
      fill="none"
      style={{ transform: flip, transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <path
        d="M 6 100 Q 32 88, 48 64 Q 64 38, 100 22 Q 124 12, 138 8"
        stroke={color}
        strokeWidth="1.1"
        opacity={opacity}
        strokeLinecap="round"
      />
      {leaves.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={leaf.r}
          ry={leaf.r * 0.6}
          fill={color}
          opacity={opacity * 0.85}
          transform={`rotate(${leaf.a} ${leaf.x} ${leaf.y})`}
        />
      ))}
    </svg>
  );
}

function BotanicalWreath({
  size = 320,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const ring = useMemo(() => {
    const arr: Array<{ i: number; angle: number; len: number; rose: boolean }> = [];
    const count = 36;
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
  const radius = half - 14;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle
        cx={half}
        cy={half}
        r={radius - 8}
        fill="none"
        stroke="#7A9B76"
        strokeWidth="1"
        opacity="0.42"
      />
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
            fill={leaf.rose ? '#D4A5A5' : '#7A9B76'}
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
            cx={half + Math.cos(rad) * (radius - 16)}
            cy={half + Math.sin(rad) * (radius - 16)}
            r="3.6"
            fill="#D4A5A5"
            opacity="0.92"
          />
        );
      })}
    </svg>
  );
}

/* Falling leaves — mix of maple + oak shapes */

function MapleLeaf({
  size = 16,
  color = '#2C3E2D',
  opacity = 0.6,
  className,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 1 L13.6 5.5 L17.6 3.6 L15.8 7.4 L20.5 7.6 L17 10.4 L21 12.6 L16.4 13.8 L17.6 18.2 L13.2 16.2 L12 22 L10.8 16.2 L6.4 18.2 L7.6 13.8 L3 12.6 L7 10.4 L3.5 7.6 L8.2 7.4 L6.4 3.6 L10.4 5.5 Z"
        fill={color}
        opacity={opacity}
      />
      <path d="M12 3 L12 21" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.7" />
    </svg>
  );
}

function OakLeaf({
  size = 16,
  color = '#7A9B76',
  opacity = 0.6,
  className,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 2 C 6 4, 4 9, 6 12 C 3 13, 3 16, 6 17 C 5 19, 7 21, 10 20 C 9 22, 12 22.5, 12 22.5 C 12 22.5, 15 22, 14 20 C 17 21, 19 19, 18 17 C 21 16, 21 13, 18 12 C 20 9, 18 4, 12 2 Z"
        fill={color}
        opacity={opacity}
      />
      <path d="M12 4 L12 21" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.7" />
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
  shape: 'maple' | 'oak';
}

const FALLING_LEAVES: readonly FallingLeafSpec[] = [
  { id: 0, left: '6%',  duration: '9.5s',  delay: '0s',    size: 18, color: '#2C3E2D', opacity: 0.55, shape: 'maple' },
  { id: 1, left: '19%', duration: '11.5s', delay: '1.4s',  size: 13, color: '#7A9B76', opacity: 0.55, shape: 'oak'   },
  { id: 2, left: '33%', duration: '8s',    delay: '3.2s',  size: 16, color: '#2C3E2D', opacity: 0.45, shape: 'maple' },
  { id: 3, left: '47%', duration: '10s',   delay: '0.8s',  size: 14, color: '#7A9B76', opacity: 0.7,  shape: 'oak'   },
  { id: 4, left: '61%', duration: '7.5s',  delay: '4.6s',  size: 17, color: '#2C3E2D', opacity: 0.5,  shape: 'maple' },
  { id: 5, left: '76%', duration: '10.5s', delay: '2.2s',  size: 12, color: '#7A9B76', opacity: 0.5,  shape: 'oak'   },
  { id: 6, left: '88%', duration: '9s',    delay: '5s',    size: 15, color: '#2C3E2D', opacity: 0.6,  shape: 'maple' },
];

function FallingLeaves() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {FALLING_LEAVES.map((leaf) => (
        <span
          key={leaf.id}
          className="js-leaf"
          style={{
            left: leaf.left,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
          }}
        >
          {leaf.shape === 'maple' ? (
            <MapleLeaf size={leaf.size} color={leaf.color} opacity={leaf.opacity} />
          ) : (
            <OakLeaf size={leaf.size} color={leaf.color} opacity={leaf.opacity} />
          )}
        </span>
      ))}
    </div>
  );
}

/* ---------- Layout primitives ---------- */

function SectionLabel({ children, tone = 'deep' }: { children: ReactNode; tone?: 'deep' | 'rose' }) {
  const color = tone === 'rose' ? '#D4A5A5' : '#7A9B76';
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-8" style={{ backgroundColor: color, opacity: 0.45 }} />
      <span
        className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] md:text-[11px]"
        style={{ color }}
      >
        {children}
      </span>
      <span className="h-px w-8" style={{ backgroundColor: color, opacity: 0.45 }} />
    </div>
  );
}

function SectionLeafGlyph({ tone = 'deep' }: { tone?: 'deep' | 'rose' }) {
  const color = tone === 'rose' ? '#D4A5A5' : '#2C3E2D';
  return (
    <svg viewBox="0 0 24 24" width={11} height={11} aria-hidden="true">
      <path
        d="M12 2 C 5 7, 5 17, 12 22 C 19 17, 19 7, 12 2 Z"
        fill={color}
        opacity="0.85"
      />
    </svg>
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
      className={`js-reveal ${className ?? ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

function CornerBotanicals({ tone = 'sage' }: { tone?: 'sage' | 'rose' }) {
  const color = tone === 'rose' ? '#D4A5A5' : '#7A9B76';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <FernFrond side="tl" color={color} opacity={0.32} className="absolute -top-6 -left-8 h-40 w-auto md:h-52" />
      <FernFrond side="br" color={color} opacity={0.32} className="absolute -bottom-6 -right-8 h-40 w-auto md:h-52" />
      <RoseGlyph size={20} petal="#D4A5A5" heart="#2C3E2D" className="absolute left-6 bottom-10 opacity-40 md:left-14" />
      <RoseGlyph size={16} petal="#D4A5A5" heart="#2C3E2D" className="absolute right-8 top-12 opacity-35 md:right-16" />
    </div>
  );
}

/* ---------- Sections ---------- */

function HeroSection({
  props,
  t,
}: {
  props: PublicInvitationPageProps;
  t: Labels;
}) {
  const {
    honoreeName,
    yearsCelebrating,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    locale,
  } = props;

  return (
    <header className="relative isolate overflow-hidden bg-[#2C3E2D] px-6 pb-28 pt-16 md:pb-36 md:pt-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #2C3E2D 0%, rgba(44,62,45,0.92) 38%, rgba(122,155,118,0.32) 72%, rgba(44,62,45,0.95) 100%)',
        }}
      />
      <FallingLeaves />

      <FernFrond side="tl" className="pointer-events-none absolute -top-4 -left-6 h-48 w-auto opacity-55 md:h-72" />
      <FernFrond side="tr" className="pointer-events-none absolute -top-4 -right-6 h-48 w-auto opacity-55 md:h-72" />
      <IvyCurl side="bl" className="pointer-events-none absolute bottom-6 left-2 h-28 w-auto opacity-50 md:h-36" />
      <IvyCurl side="br" className="pointer-events-none absolute bottom-6 right-2 h-28 w-auto opacity-50 md:h-36" />

      <div className="js-hero-in relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <SectionLabel tone="rose">{landingTitle ?? t.invitation}</SectionLabel>

        <div className="relative mt-14 mb-10 flex items-center justify-center">
          <RoseSprig className="js-sway pointer-events-none absolute -top-8 left-1/2 w-64 -translate-x-1/2 opacity-85 md:w-80" />
          <RoseSprig flip className="pointer-events-none absolute -bottom-8 left-1/2 w-64 -translate-x-1/2 opacity-85 md:w-80" />
          <FernFrond side="tl" className="pointer-events-none absolute -left-4 top-2 h-24 w-auto opacity-55 md:-left-12 md:h-32" />
          <FernFrond side="tr" className="pointer-events-none absolute -right-4 top-2 h-24 w-auto opacity-55 md:-right-12 md:h-32" />

          {heroImageUrl ? (
            <div className="relative">
              <BotanicalWreath
                size={340}
                className="pointer-events-none absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2 opacity-75"
              />
              <img
                src={heroImageUrl}
                alt=""
                className="relative h-60 w-60 rounded-full border border-[#D4A5A5] object-cover shadow-[0_28px_60px_-32px_rgba(0,0,0,0.55)] md:h-72 md:w-72"
              />
            </div>
          ) : (
            <div
              className="relative flex h-64 w-64 items-center justify-center rounded-full md:h-80 md:w-80"
              style={{
                background: 'linear-gradient(160deg, #F4EFE6 0%, #7A9B76 100%)',
              }}
            >
              <BotanicalWreath
                size={320}
                className="pointer-events-none absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
              />
              <span className="px-8 text-center font-['Cormorant_Infant',serif] text-3xl italic leading-tight text-[#1F1F1F] md:text-4xl">
                {honoreeName}
              </span>
            </div>
          )}
        </div>

        <h1 className="font-['Cormorant_Infant',serif] text-5xl italic leading-[1.05] text-[#F4EFE6] md:text-7xl">
          {honoreeName}
        </h1>

        {yearsCelebrating > 0 ? (
          <div className="mt-8 flex items-center justify-center gap-4">
            <IvyCurl side="tl" className="h-8 w-auto opacity-80 md:h-10" color="#7A9B76" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-['Cormorant_Infant',serif] text-6xl italic leading-none text-[#D4A5A5] md:text-7xl">
                {yearsCelebrating}
              </span>
              <span className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#F4EFE6]/75 md:text-xs">
                {t.yearsTogether}
              </span>
            </div>
            <IvyCurl side="tr" className="h-8 w-auto opacity-80 md:h-10" color="#7A9B76" />
          </div>
        ) : null}

        {landingSubtitle ? (
          <p className="mt-8 max-w-md font-['Lora',serif] text-sm italic leading-relaxed text-[#F4EFE6]/80 md:text-base">
            {landingSubtitle}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-3 font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#D4A5A5]">
            <SectionLeafGlyph tone="rose" />
            {t.saveTheDate}
            <SectionLeafGlyph tone="rose" />
          </span>
          <time
            dateTime={eventDate}
            className="font-['Cormorant_Infant',serif] text-2xl italic text-[#F4EFE6] md:text-3xl"
          >
            {formatLongDate(eventDate, locale)}
          </time>
        </div>
      </div>

      <RoseSprig className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-[440px] max-w-[78vw] opacity-65" />
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
    <section className="relative overflow-hidden bg-[#F4EFE6] px-6 py-20 md:py-28">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <SectionLabel>{t.storyLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.story}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-['Lora',serif] text-[15px] leading-[1.95] text-[#1F1F1F]/85">
          {story.body}
        </p>
        <RoseGlyph size={26} className="mx-auto mt-10 opacity-90" />
      </Reveal>
    </section>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-['Cormorant_Infant',serif] text-4xl italic leading-none text-[#F4EFE6] md:text-6xl">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="mt-3 font-['Lora',serif] text-[9px] uppercase tracking-[0.3em] text-[#D4A5A5] md:text-[11px]">
        {label}
      </span>
    </div>
  );
}

function CountdownSection({ eventDate, t }: { eventDate: string; t: Labels }) {
  const c = useCountdown(eventDate);
  return (
    <section className="relative overflow-hidden bg-[#2C3E2D] px-6 py-20 md:py-24">
      <CornerBotanicals />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <SectionLabel tone="rose">{t.countdownLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#F4EFE6] md:text-4xl">
          {c.passed ? t.countdownPast : t.countdownHeading}
        </h2>

        {c.passed ? (
          <p className="mt-8 font-['Lora',serif] text-sm italic text-[#F4EFE6]/70">
            {t.countdownUntil}
          </p>
        ) : (
          <div className="mt-12 flex items-center justify-center gap-3 md:gap-6">
            <CountdownCell value={c.d} label={t.days} />
            <RoseGlyph size={13} className="opacity-75" />
            <CountdownCell value={c.h} label={t.hours} />
            <RoseGlyph size={13} className="opacity-75" />
            <CountdownCell value={c.m} label={t.minutes} />
            <RoseGlyph size={13} className="opacity-75" />
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
    <section className="relative overflow-hidden bg-[#F4EFE6] px-6 py-20 md:py-24">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-4xl">
        <SectionLabel>{t.locationsLabel}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Infant',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.locations}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center font-['Lora',serif] text-xs italic text-[#1F1F1F]/65">
          {t.locationsHint}
        </p>

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
                className="js-card relative flex flex-col gap-3 rounded-[2px] border border-[#D4A5A5] bg-[#F4EFE6] px-7 py-8"
              >
                <FernFrond side="tl" className="pointer-events-none absolute right-3 top-3 h-10 w-auto opacity-40" color="#7A9B76" />
                <span className="inline-flex items-center gap-2 font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#2C3E2D]">
                  <SectionLeafGlyph tone="deep" />
                  {loc.label}
                </span>
                <h3 className="font-['Cormorant_Infant',serif] text-2xl italic text-[#2C3E2D] md:text-3xl">
                  {loc.name}
                </h3>
                {loc.address ? (
                  <p className="font-['Lora',serif] text-sm leading-relaxed text-[#1F1F1F]/80">
                    {loc.address}
                  </p>
                ) : null}
                {loc.city ? (
                  <p className="font-['Lora',serif] text-sm italic text-[#7A9B76]">{loc.city}</p>
                ) : null}
                {timeText ? (
                  <p className="font-['Cormorant_Infant',serif] text-lg italic text-[#1F1F1F]/80">
                    {timeText}
                  </p>
                ) : null}
                {loc.mapsLink ? (
                  <a
                    href={loc.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center gap-2 border-b border-[#7A9B76]/50 pb-0.5 font-['Lora',serif] text-[11px] uppercase tracking-[0.25em] text-[#7A9B76] transition-colors duration-500 hover:border-[#D4A5A5] hover:text-[#2C3E2D]"
                  >
                    {t.openInMaps}
                    <SectionLeafGlyph tone="rose" />
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
    <section className="relative overflow-hidden bg-[#2C3E2D] px-6 py-20 md:py-24">
      <CornerBotanicals />
      <Reveal className="relative mx-auto max-w-3xl">
        <SectionLabel tone="rose">{t.programLabel}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Infant',serif] text-3xl italic text-[#F4EFE6] md:text-4xl">
          {t.program}
        </h2>

        <div className="mt-12 flex flex-col gap-14">
          {program.days.map((day, d) => (
            <div key={`${day.date ?? 'day'}-${d}`} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <span className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#D4A5A5]">
                  {day.label ?? `${t.dayFallback} ${d + 1}`}
                </span>
                {day.date ? (
                  <span className="font-['Cormorant_Infant',serif] text-2xl italic text-[#F4EFE6]">
                    {formatShortDate(day.date, locale)}
                  </span>
                ) : null}
                <RoseSprig className="w-44 opacity-70" />
              </div>

              <ol className="flex flex-col gap-4">
                {day.items.map((item, i) => (
                  <li
                    key={`${item.time}-${i}`}
                    className="js-card relative flex flex-col gap-2 rounded-[2px] border border-[#D4A5A5] bg-[#F4EFE6] px-6 py-6 md:flex-row md:items-baseline md:gap-8"
                  >
                    <FernFrond side="tl" className="pointer-events-none absolute right-3 top-3 hidden h-8 w-auto opacity-40 md:block" color="#7A9B76" />
                    <span className="w-24 shrink-0 font-['Cormorant_Infant',serif] text-xl italic text-[#7A9B76] md:text-2xl">
                      {item.time}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-['Cormorant_Infant',serif] text-xl italic text-[#2C3E2D] md:text-2xl">
                        {item.title}
                      </h3>
                      {item.detail ? (
                        <p className="font-['Lora',serif] text-sm leading-relaxed text-[#1F1F1F]/75">
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

function DressCodeSection({
  dressCode,
  t,
}: {
  dressCode: NonNullable<PublicInvitationPageProps['dressCode']>;
  t: Labels;
}) {
  return (
    <section className="relative overflow-hidden bg-[#F4EFE6] px-6 py-20 md:py-24">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <SectionLabel>{t.dressCodeLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.dressCode}
        </h2>
        <FernFrond
          side="tl"
          className="pointer-events-none absolute left-1/2 top-32 h-10 w-auto -translate-x-1/2 opacity-30"
        />
        <p className="mx-auto mt-10 max-w-xl whitespace-pre-line font-['Lora',serif] text-[15px] leading-[1.95] text-[#1F1F1F]/85">
          {dressCode.body}
        </p>
        <RoseGlyph size={22} className="mx-auto mt-8 opacity-90" />
      </Reveal>
    </section>
  );
}

function GiftRegistrySection({
  giftRegistry,
  t,
}: {
  giftRegistry: NonNullable<PublicInvitationPageProps['giftRegistry']>;
  t: Labels;
}) {
  return (
    <section className="relative overflow-hidden bg-[#2C3E2D] px-6 py-20 md:py-24">
      <CornerBotanicals />
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <SectionLabel tone="rose">{t.giftLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#F4EFE6] md:text-4xl">
          {t.giftRegistry}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-['Lora',serif] text-[15px] leading-[1.95] text-[#F4EFE6]/85">
          {giftRegistry.body}
        </p>
        <RoseGlyph size={22} className="mx-auto mt-8 opacity-90" />
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
    <section className="relative overflow-hidden bg-[#F4EFE6] px-6 py-20 text-center md:py-28">
      <CornerBotanicals tone="rose" />
      <Reveal className="relative mx-auto max-w-xl">
        <SectionLabel>{t.rsvpLabel}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Infant',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.rsvpHeading}
        </h2>
        <p className="mx-auto mt-6 max-w-md font-['Lora',serif] text-sm italic leading-relaxed text-[#1F1F1F]/75">
          {t.rsvpHint}
        </p>
        <button
          type="button"
          onClick={onRsvpClick}
          className="js-cta mt-10 inline-flex items-center justify-center gap-3 rounded-full border-2 border-transparent bg-[#2C3E2D] px-12 py-4 font-['Lora',serif] text-[11px] uppercase tracking-[0.3em] text-[#F4EFE6] shadow-[0_20px_44px_-28px_rgba(31,31,31,0.65)]"
        >
          {t.rsvp}
        </button>
        <div className="mt-10 flex items-center justify-center gap-4 opacity-80">
          <FernFrond side="tl" className="h-8 w-auto opacity-70" />
          <RoseGlyph size={20} />
          <FernFrond side="tr" className="h-8 w-auto opacity-70" />
        </div>
      </Reveal>
    </section>
  );
}

function FooterSection({ t }: { t: Labels }) {
  return (
    <footer className="relative isolate overflow-hidden bg-[#2C3E2D] px-6 pb-12 pt-16 text-center">
      <FernFrond side="bl" className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-auto opacity-45 md:h-52" />
      <FernFrond side="br" className="pointer-events-none absolute -bottom-6 -right-6 h-36 w-auto opacity-45 md:h-52" />
      <IvyCurl side="tl" className="pointer-events-none absolute right-8 top-6 h-12 w-auto opacity-45" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <RoseSprig className="w-[340px] max-w-[70vw] opacity-75" />
        <p className="font-['Cormorant_Infant',serif] text-2xl italic text-[#F4EFE6] md:text-3xl">
          {t.poweredBy}
        </p>
        <p className="font-['Lora',serif] text-[10px] uppercase tracking-[0.4em] text-[#D4A5A5]">
          {t.craftedWith}
        </p>
      </div>
    </footer>
  );
}

/* ---------- Template ---------- */

export default function JardinSecretoTemplate(props: PublicInvitationPageProps) {
  const {
    eventDate,
    story,
    dressCode,
    giftRegistry,
    locations,
    program,
    rsvpEnabled,
    onRsvpClick,
    locale,
  } = props;
  const t = useLabels(locale);

  return (
    <main
      lang={locale}
      className="relative min-h-screen overflow-x-hidden bg-[#2C3E2D] font-['Lora',serif] text-[#1F1F1F] antialiased"
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

      {dressCode ? (
        <>
          <DressCodeSection dressCode={dressCode} t={t} />
          <Hairline />
        </>
      ) : null}

      {giftRegistry ? (
        <>
          <GiftRegistrySection giftRegistry={giftRegistry} t={t} />
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
