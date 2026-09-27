/**
 * BotanicTemplate — Wedding invitation template.
 *
 * THEME — "BOTANIC"
 * A secret garden wedding rendered on fine-art paper. An off-white canvas,
 * watercolor botanical borders, deep-green serif typography. Delicate,
 * atemporal, unhurried. Subtle motion only — gentle fade and a slow
 * intersection-observer reveal. Honors `prefers-reduced-motion`.
 *
 * PALETTE (exact)
 *   Off-white   #FAFAF7   — paper background
 *   Water green #E8EDE5   — wash / airy backgrounds
 *   Sage        #7A9B76   — leaves, accents, section labels
 *   Deep green  #2C3E2D   — typography, hairline rules
 *
 * TYPOGRAPHY
 *   Display: Cormorant Garamond (italic for couple names)
 *   Body:    Lora
 *
 * AESTHETIC VOCABULARY
 *   Inline SVG botanicals in the hero and footer corners: fern fronds,
 *   eucalyptus branches with round leaves, watercolor blobs, leaf glyphs.
 *   1 px deep-green hairlines between sections.
 *   Section labels: uppercase, letter-spacing 0.4em, sage.
 *   Hero: gradient + monogram-in-circle fallback when no `heroImageUrl`.
 *   RSVP: deep-green pill button, sage border appears on hover.
 *
 * CONSTRAINTS
 *   Self-contained. No imports beyond React. No external assets. No `any`.
 *   Strict TypeScript. Bundle-size mindful.
 */

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

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
    saveTheDate: 'Save the date',
    story: 'Our story',
    countdownHeading: 'Until the wedding',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    dShort: 'd',
    hShort: 'h',
    mShort: 'm',
    sShort: 's',
    and: 'and',
    areGettingMarried: 'are getting married',
    ceremonyHint: 'the celebration of',
    ceremonyTag: 'celebration',
    ceremonyLabel: 'Ceremony',
    receptionLabel: 'Reception',
    partyLabel: 'Celebration',
    locations: 'Where',
    program: 'The day',
    dressCode: 'Dress code',
    gifts: 'Gifts',
    parents: 'With the blessing of',
    accommodation: 'Stay',
    accommodationHint: 'places to rest',
    rsvpHeading: 'Will you be there?',
    rsvpHint: 'Kindly let us know before the big day.',
    rsvp: 'Confirm attendance',
    rsvpClosed: 'RSVPs are closed',
    openInMaps: 'Open in Maps',
    craftedWith: 'Crafted with care by',
    poweredBy: 'Deer Planner',
    today: 'Today is the day',
    passed: 'A beautiful day has passed',
    untitled: 'Untitled',
    leaf: 'leaf',
    saveDate: 'Save the date',
    detailsAt: 'details',
  },
  es: {
    saveTheDate: 'Reservá la fecha',
    story: 'Nuestra historia',
    countdownHeading: 'Para la boda',
    days: 'días',
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    dShort: 'd',
    hShort: 'h',
    mShort: 'm',
    sShort: 's',
    and: 'y',
    areGettingMarried: 'se casan',
    ceremonyHint: 'la celebración de',
    ceremonyTag: 'celebración',
    ceremonyLabel: 'Ceremonia',
    receptionLabel: 'Recepción',
    partyLabel: 'Fiesta',
    locations: 'Dónde',
    program: 'El día',
    dressCode: 'Vestimenta',
    gifts: 'Regalos',
    parents: 'Con la bendición de',
    accommodation: 'Hospedaje',
    accommodationHint: 'dónde descansar',
    rsvpHeading: '¿Nos acompañás?',
    rsvpHint: 'Por favor confirmá tu asistencia antes del gran día.',
    rsvp: 'Confirmar asistencia',
    rsvpClosed: 'Las confirmaciones están cerradas',
    openInMaps: 'Abrir en Maps',
    craftedWith: 'Hecho con cariño por',
    poweredBy: 'Deer Planner',
    today: 'Hoy es el día',
    passed: 'Un día hermoso ya pasó',
    untitled: 'Sin título',
    leaf: 'hoja',
    saveDate: 'Reservá la fecha',
    detailsAt: 'detalles',
  },
} as const;

type Labels = (typeof labels)['en'];
type Locale = 'en' | 'es';

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
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatShortDate = (iso: string, locale: Locale): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = locale === 'es' ? MONTHS_ES : MONTHS_EN;
  const suffix = locale === 'es' ? 'de' : '';
  return `${d.getDate()} ${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`.trim();
};

const getInitials = (n1: string, n2: string): string => {
  const a = (n1.trim().charAt(0) || '·').toUpperCase();
  const b = (n2.trim().charAt(0) || '·').toUpperCase();
  return `${a}${b}`;
};

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

function useReveal<T extends HTMLElement>(): RefObject<T> {
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
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function useGoogleFonts(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const ensure = (id: string, href: string): void => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };
    ensure(
      'gfont-cormorant-garamond',
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600;1,700&display=swap',
    );
    ensure(
      'gfont-lora',
      'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap',
    );
  }, []);
}

function useThemeStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('botanic-template-styles')) return;
    const style = document.createElement('style');
    style.id = 'botanic-template-styles';
    style.textContent = `
      @keyframes botanic-fade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes botanic-leaf-sway {
        0%, 100% { transform: rotate(-1.5deg); }
        50%      { transform: rotate(1.5deg); }
      }
      .reveal {
        opacity: 0;
        transform: translateY(14px);
        transition:
          opacity 1400ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 1400ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      .botanic-fade {
        opacity: 0;
        animation: botanic-fade 1.8s ease-out forwards;
      }
      .botanic-leaf-sway {
        transform-origin: center;
        animation: botanic-leaf-sway 6s ease-in-out infinite;
      }
      .botanic-rsvp-btn {
        transition:
          background-color 0.4s ease,
          color 0.4s ease,
          box-shadow 0.4s ease,
          border-color 0.4s ease;
      }
      @media (prefers-reduced-motion: reduce) {
        .reveal,
        .reveal.is-visible,
        .botanic-fade,
        .botanic-leaf-sway {
          opacity: 1 !important;
          transform: none !important;
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);
}

/* ---------- Decorative SVG primitives ---------- */

function LeafGlyph({
  size = 12,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2 C 5 7, 5 17, 12 22 C 19 17, 19 7, 12 2 Z"
        fill="#7A9B76"
        opacity="0.85"
      />
      <path
        d="M12 4 L 12 21"
        stroke="#FAFAF7"
        strokeWidth="0.6"
        opacity="0.6"
      />
    </svg>
  );
}

function WatercolorBlob({
  className,
  color = '#7A9B76',
  rx = 120,
  ry = 90,
  opacity = 0.18,
  blur = 30,
}: {
  className?: string;
  color?: string;
  rx?: number;
  ry?: number;
  opacity?: number;
  blur?: number;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      style={{ filter: blur ? `blur(${blur}px)` : undefined }}
    >
      <ellipse cx="200" cy="200" rx={rx} ry={ry} fill={color} opacity={opacity} />
      <ellipse
        cx={200 - rx * 0.25}
        cy={200 - ry * 0.2}
        rx={rx * 0.7}
        ry={ry * 0.55}
        fill={color}
        opacity={opacity * 0.7}
      />
      <ellipse
        cx={200 + rx * 0.3}
        cy={200 + ry * 0.15}
        rx={rx * 0.5}
        ry={ry * 0.6}
        fill="#E8EDE5"
        opacity={opacity * 0.85}
      />
    </svg>
  );
}

function FernFrond({
  side,
  className,
  opacity = 0.55,
}: {
  side: 'tl' | 'tr' | 'bl' | 'br';
  className?: string;
  opacity?: number;
}) {
  const flip = {
    tl: 'scale(1, 1)',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  }[side];

  const leaflets = useMemo(() => {
    const arr: Array<{ i: number; side: number; y: number; len: number }> = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      arr.push({
        i,
        side: i % 2 === 0 ? -1 : 1,
        y: 30 + t * 210,
        len: 32 - t * 18,
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
        d="M 110 260 Q 95 200, 102 130 Q 108 70, 118 18"
        stroke="#2C3E2D"
        strokeWidth="1"
        opacity={opacity * 0.75}
      />
      {leaflets.map((leaf) => {
        const tipX = 100 + leaf.side * (leaf.len + 6);
        const tipY = leaf.y - leaf.len * 0.5;
        return (
          <g key={leaf.i}>
            <path
              d={`M 100 ${leaf.y} Q ${100 + leaf.side * leaf.len * 0.55} ${leaf.y - leaf.len * 0.35}, ${tipX} ${tipY}`}
              stroke="#7A9B76"
              strokeWidth="0.7"
              opacity={opacity}
            />
            <ellipse
              cx={100 + leaf.side * leaf.len * 0.45}
              cy={leaf.y - leaf.len * 0.4}
              rx={leaf.len * 0.16 + 1}
              ry={leaf.len * 0.06 + 1}
              fill="#E8EDE5"
              opacity={opacity * 0.9}
              transform={`rotate(${leaf.side * 28} ${100 + leaf.side * leaf.len * 0.45} ${leaf.y - leaf.len * 0.4})`}
            />
          </g>
        );
      })}
      <circle cx="118" cy="18" r="2" fill="#7A9B76" opacity={opacity * 0.8} />
    </svg>
  );
}

function EucalyptusBranch({
  className,
  flip = false,
  opacity = 0.7,
}: {
  className?: string;
  flip?: boolean;
  opacity?: number;
}) {
  const leaves = useMemo(() => {
    const points = [22, 50, 78, 108, 138, 168, 198, 228, 258, 288];
    return points.map((x, i) => ({
      x,
      side: i % 2 === 0 ? -1 : 1,
      r: 7 + (i % 3),
      cy: 35 + (i % 2 === 0 ? -1 : 1) * 4,
    }));
  }, []);
  return (
    <svg
      viewBox="0 0 320 70"
      className={className}
      fill="none"
      style={{ transform: flip ? 'scale(-1, 1)' : undefined, transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <path
        d="M 4 36 Q 80 28, 160 38 Q 240 46, 316 32"
        stroke="#2C3E2D"
        strokeWidth="0.8"
        opacity={opacity * 0.7}
      />
      {leaves.map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.cy}
          rx={leaf.r}
          ry={leaf.r * 0.7}
          fill="#E8EDE5"
          stroke="#7A9B76"
          strokeWidth="0.8"
          opacity={opacity * 0.95}
          transform={`rotate(${leaf.side * 24} ${leaf.x} ${leaf.cy})`}
        />
      ))}
    </svg>
  );
}

function LeafSpray({
  className,
  rotate = 0,
  opacity = 0.6,
}: {
  className?: string;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      fill="none"
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: '50% 50%' }}
      aria-hidden="true"
    >
      <path
        d="M 20 120 Q 60 80, 100 50 Q 110 40, 118 22"
        stroke="#2C3E2D"
        strokeWidth="0.9"
        opacity={opacity * 0.7}
      />
      {[
        { x: 32, y: 108, a: -55 },
        { x: 50, y: 92, a: -65 },
        { x: 70, y: 76, a: -50 },
        { x: 90, y: 58, a: -38 },
        { x: 108, y: 38, a: -22 },
      ].map((p, i) => (
        <path
          key={i}
          d={`M ${p.x} ${p.y} q 8 -3, 16 -10 q -3 -2, -10 -2 q -6 0, -6 12 z`}
          fill="#7A9B76"
          opacity={opacity}
          transform={`rotate(${p.a} ${p.x} ${p.y})`}
        />
      ))}
    </svg>
  );
}

function MonogramWreath({
  initials,
  className,
  size = 160,
}: {
  initials: string;
  className?: string;
  size?: number;
}) {
  const leaves = useMemo(() => {
    const arr: Array<{ i: number; angle: number; r: number; len: number }> = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      arr.push({
        i,
        angle: (i / count) * 360,
        r: size / 2 - 4,
        len: 9 + (i % 4),
      });
    }
    return arr;
  }, [size]);
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          fill="none"
          stroke="#2C3E2D"
          strokeWidth="1"
          opacity="0.6"
        />
        {leaves.map((leaf) => {
          const rad = (leaf.angle * Math.PI) / 180;
          const cx = size / 2 + Math.cos(rad) * leaf.r;
          const cy = size / 2 + Math.sin(rad) * leaf.r;
          return (
            <ellipse
              key={leaf.i}
              cx={cx}
              cy={cy}
              rx={leaf.len}
              ry={3}
              fill="#7A9B76"
              opacity="0.65"
              transform={`rotate(${leaf.angle + 90} ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-['Cormorant_Garamond',serif] italic text-[#2C3E2D]"
          style={{ fontSize: size * 0.28, letterSpacing: '0.08em' }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
}

/* ---------- Section primitives ---------- */

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? ''}`}>
      <span className="h-px w-10 bg-[#7A9B76]/50" />
      <span className="font-['Lora',serif] text-[11px] uppercase tracking-[0.4em] text-[#7A9B76]">
        {children}
      </span>
      <span className="h-px w-10 bg-[#7A9B76]/50" />
    </div>
  );
}

function Hairline({ className }: { className?: string }) {
  return (
    <div className={`mx-auto h-px w-full max-w-md bg-[#2C3E2D]/15 ${className ?? ''}`} />
  );
}

function RevealSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${className ?? ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ---------- Sections ---------- */

function HeroSection({
  props,
}: {
  props: PublicInvitationPageProps;
}) {
  const {
    partner1Name,
    partner2Name,
    eventDate,
    heroImageUrl,
    landingTitle,
    landingSubtitle,
    locale,
  } = props;
  const t = useLabels(locale);
  const initials = getInitials(partner1Name, partner2Name);
  const dateLabel = formatLongDate(eventDate, locale);

  return (
    <header className="relative isolate overflow-hidden pt-16 pb-20 md:pt-28 md:pb-32 botanic-fade">
      {/* Background watercolor washes */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <WatercolorBlob
          className="absolute -top-24 -left-32 h-[520px] w-[520px]"
          rx={120}
          ry={90}
          opacity={0.22}
          blur={26}
        />
        <WatercolorBlob
          className="absolute -top-10 -right-40 h-[480px] w-[480px]"
          rx={100}
          ry={120}
          opacity={0.18}
          blur={28}
          color="#E8EDE5"
        />
      </div>

      {/* Corner botanicals */}
      <FernFrond
        side="tl"
        className="pointer-events-none absolute -top-2 -left-4 h-44 w-auto opacity-90 md:h-64"
      />
      <FernFrond
        side="tr"
        className="pointer-events-none absolute -top-2 -right-4 h-44 w-auto opacity-90 md:h-64"
      />
      <LeafSpray
        className="pointer-events-none absolute top-32 left-6 h-20 w-auto opacity-70 botanic-leaf-sway md:left-16"
        rotate={-12}
      />
      <LeafSpray
        className="pointer-events-none absolute top-32 right-6 h-20 w-auto opacity-70 botanic-leaf-sway md:right-16"
        rotate={200}
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <SectionLabel>{t.saveTheDate}</SectionLabel>

        {/* Hero photo (optional) — a delicate framed image */}
        {heroImageUrl ? (
          <div className="relative mt-10 mb-12 inline-block">
            <div className="absolute inset-3 rounded-[2px] border border-[#2C3E2D]/30" />
            <img
              src={heroImageUrl}
              alt=""
              className="relative max-h-[60vh] w-auto max-w-full object-cover shadow-[0_30px_60px_-30px_rgba(44,62,45,0.35)]"
            />
          </div>
        ) : (
          /* Watercolor composition + monogram fallback */
          <div className="relative mt-10 mb-12 flex h-64 w-64 items-center justify-center md:h-72 md:w-72">
            <WatercolorBlob
              className="absolute inset-0"
              rx={110}
              ry={100}
              opacity={0.28}
              blur={18}
              color="#7A9B76"
            />
            <WatercolorBlob
              className="absolute inset-4"
              rx={90}
              ry={80}
              opacity={0.32}
              blur={14}
              color="#E8EDE5"
            />
            <EucalyptusBranch
              className="absolute -top-2 left-1/2 w-56 -translate-x-1/2 opacity-80"
            />
            <EucalyptusBranch
              className="absolute -bottom-2 left-1/2 w-56 -translate-x-1/2 opacity-80"
              flip
            />
            <MonogramWreath initials={initials} size={168} />
          </div>
        )}

        {landingTitle ? (
          <p className="font-['Cormorant_Garamond',serif] text-base italic text-[#7A9B76] md:text-lg">
            {landingTitle}
          </p>
        ) : null}

        <h1 className="mt-3 font-['Cormorant_Garamond',serif] text-5xl italic leading-tight text-[#2C3E2D] md:text-7xl">
          {partner1Name}
          <span className="mx-3 align-middle text-[#7A9B76] not-italic">&</span>
          {partner2Name}
        </h1>

        {landingSubtitle ? (
          <p className="mt-4 font-['Lora',serif] text-base italic text-[#2C3E2D]/70 md:text-lg">
            {landingSubtitle}
          </p>
        ) : (
          <p className="mt-4 font-['Lora',serif] text-base italic text-[#2C3E2D]/70 md:text-lg">
            {t.ceremonyHint}
          </p>
        )}

        <div className="mt-10 flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-[#7A9B76]">
            <LeafGlyph size={10} />
            {t.saveDate}
            <LeafGlyph size={10} />
          </span>
          <time
            dateTime={eventDate}
            className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#2C3E2D] md:text-3xl"
          >
            {dateLabel}
          </time>
        </div>
      </div>

      {/* Lower botanical border */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-24" aria-hidden="true">
        <EucalyptusBranch
          className="absolute bottom-2 left-1/2 w-[420px] max-w-[80vw] -translate-x-1/2 opacity-70"
        />
      </div>
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
    <section className="relative px-6 py-20 md:py-28">
      <RevealSection className="mx-auto max-w-2xl">
        <SectionLabel>{t.story}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.story}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line text-center font-['Lora',serif] text-[15px] leading-[1.9] text-[#2C3E2D]/80 md:text-base">
          {story.body}
        </p>
      </RevealSection>
      <Hairline className="mt-20" />
    </section>
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
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-3xl text-center">
        <SectionLabel>{t.countdownHeading}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {c.passed ? t.passed : t.countdownHeading}
        </h2>

        {c.passed ? null : (
          <div className="mt-12 flex items-center justify-center gap-3 md:gap-5">
            <CountdownCell value={c.d} label={t.days} />
            <LeafGlyph size={14} className="opacity-70" />
            <CountdownCell value={c.h} label={t.hours} />
            <LeafGlyph size={14} className="opacity-70" />
            <CountdownCell value={c.m} label={t.minutes} />
            <LeafGlyph size={14} className="opacity-70" />
            <CountdownCell value={c.s} label={t.seconds} />
          </div>
        )}
      </RevealSection>
      <Hairline className="mt-20" />
    </section>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  const padded = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <span className="font-['Cormorant_Garamond',serif] text-5xl italic leading-none text-[#2C3E2D] md:text-6xl">
        {padded}
      </span>
      <span className="mt-3 font-['Lora',serif] text-[10px] uppercase tracking-[0.3em] text-[#7A9B76] md:text-[11px]">
        {label}
      </span>
    </div>
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
  if (!locations.length) return null;
  return (
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-4xl">
        <SectionLabel>{t.locations}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.locations}
        </h2>

        <ul className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12">
          {locations.map((loc, i) => {
            const dateIso = loc.time && /^\d{4}-\d{2}-\d{2}/.test(loc.time) ? loc.time : undefined;
            const timeOnly = loc.time && !dateIso ? loc.time : undefined;
            return (
              <li
                key={`${loc.label}-${i}`}
                className="relative flex flex-col gap-3 border-t border-[#7A9B76]/30 pt-8"
              >
                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-[#7A9B76]">
                  <LeafGlyph size={9} />
                  {loc.label}
                </span>
                <h3 className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#2C3E2D] md:text-3xl">
                  {loc.name}
                </h3>
                {loc.address ? (
                  <p className="font-['Lora',serif] text-sm leading-relaxed text-[#2C3E2D]/80">
                    {loc.address}
                  </p>
                ) : null}
                {loc.city ? (
                  <p className="font-['Lora',serif] text-sm italic text-[#2C3E2D]/60">
                    {loc.city}
                  </p>
                ) : null}
                {(timeOnly || dateIso) && (
                  <p className="font-['Lora',serif] text-sm tracking-wide text-[#7A9B76]">
                    {timeOnly ?? formatShortDate(dateIso ?? '', locale)}
                  </p>
                )}
                {loc.mapsLink ? (
                  <a
                    href={loc.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex w-fit items-center gap-2 border-b border-[#2C3E2D]/40 pb-0.5 font-['Lora',serif] text-xs uppercase tracking-[0.25em] text-[#2C3E2D]/80 transition-colors duration-300 hover:border-[#7A9B76] hover:text-[#7A9B76]"
                  >
                    {t.openInMaps}
                    <LeafGlyph size={9} />
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      </RevealSection>
      <Hairline className="mt-20" />
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
  if (!program.days.length) return null;
  return (
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-3xl">
        <SectionLabel>{t.program}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.program}
        </h2>

        <div className="mt-14 flex flex-col gap-16">
          {program.days.map((day, d) => (
            <div key={d} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 border-b border-[#2C3E2D]/15 pb-4">
                <span className="text-[11px] uppercase tracking-[0.4em] text-[#7A9B76]">
                  {day.label ?? `${t.program} ${d + 1}`}
                </span>
                {day.date ? (
                  <span className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#2C3E2D]">
                    {formatShortDate(day.date, locale)}
                  </span>
                ) : null}
              </div>
              <ol className="flex flex-col">
                {day.items.map((item, i) => (
                  <li
                    key={`${day.date ?? d}-${i}`}
                    className={`flex flex-col gap-1 border-t border-[#7A9B76]/25 py-5 first:border-t-0 md:flex-row md:items-baseline md:gap-8`}
                  >
                    <span className="w-28 shrink-0 font-['Cormorant_Garamond',serif] text-xl italic text-[#2C3E2D] md:text-2xl">
                      {item.time}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-['Cormorant_Garamond',serif] text-xl italic text-[#2C3E2D] md:text-2xl">
                        {item.title}
                      </h4>
                      {item.detail ? (
                        <p className="font-['Lora',serif] text-sm leading-relaxed text-[#2C3E2D]/75">
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
      </RevealSection>
      <Hairline className="mt-20" />
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
  if (!dressCode.entries.length) return null;
  return (
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-3xl">
        <SectionLabel>{t.dressCode}</SectionLabel>
        <h2 className="mt-6 text-center font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.dressCode}
        </h2>
        <ul className="mt-12 grid gap-10 md:grid-cols-2">
          {dressCode.entries.map((entry, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 border-t border-[#7A9B76]/30 pt-6"
            >
              <h3 className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#2C3E2D]">
                {entry.title}
              </h3>
              <p className="font-['Lora',serif] text-sm leading-relaxed text-[#2C3E2D]/80">
                {entry.body}
              </p>
            </li>
          ))}
        </ul>
      </RevealSection>
      <Hairline className="mt-20" />
    </section>
  );
}

function GiftSection({
  giftRegistry,
  t,
}: {
  giftRegistry: NonNullable<PublicInvitationPageProps['giftRegistry']>;
  t: Labels;
}) {
  return (
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-2xl text-center">
        <SectionLabel>{t.gifts}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.gifts}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-['Lora',serif] text-[15px] leading-[1.9] text-[#2C3E2D]/80">
          {giftRegistry.body}
        </p>
        <LeafGlyph className="mx-auto mt-10" size={16} />
      </RevealSection>
      <Hairline className="mt-20" />
    </section>
  );
}

function ParentsSection({
  parents,
  t,
}: {
  parents: NonNullable<PublicInvitationPageProps['parents']>;
  t: Labels;
}) {
  return (
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-2xl text-center">
        <SectionLabel>{t.parents}</SectionLabel>
        <p className="mt-8 whitespace-pre-line font-['Cormorant_Garamond',serif] text-2xl italic leading-[1.8] text-[#2C3E2D] md:text-3xl">
          {parents.body}
        </p>
      </RevealSection>
      <Hairline className="mt-20" />
    </section>
  );
}

function AccommodationSection({
  accommodation,
  t,
}: {
  accommodation: NonNullable<PublicInvitationPageProps['accommodation']>;
  t: Labels;
}) {
  return (
    <section className="relative px-6 py-20 md:py-24">
      <RevealSection className="mx-auto max-w-2xl text-center">
        <SectionLabel>{t.accommodation}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.accommodation}
        </h2>
        <p className="mx-auto mt-8 max-w-xl whitespace-pre-line font-['Lora',serif] text-[15px] leading-[1.9] text-[#2C3E2D]/80">
          {accommodation.body}
        </p>
      </RevealSection>
      <Hairline className="mt-20" />
    </section>
  );
}

function RsvpSection({
  enabled,
  onRsvpClick,
  t,
}: {
  enabled: boolean;
  onRsvpClick?: () => void;
  t: Labels;
}) {
  if (!enabled) {
    return (
      <section className="relative px-6 py-20 text-center">
        <RevealSection className="mx-auto max-w-xl">
          <SectionLabel>{t.rsvpHeading}</SectionLabel>
          <p className="mt-8 font-['Cormorant_Garamond',serif] text-2xl italic text-[#2C3E2D]/60">
            {t.rsvpClosed}
          </p>
        </RevealSection>
      </section>
    );
  }
  return (
    <section className="relative px-6 py-20 text-center md:py-24">
      <RevealSection className="mx-auto max-w-xl">
        <SectionLabel>{t.rsvpHeading}</SectionLabel>
        <h2 className="mt-6 font-['Cormorant_Garamond',serif] text-3xl italic text-[#2C3E2D] md:text-4xl">
          {t.rsvpHeading}
        </h2>
        <p className="mx-auto mt-6 max-w-md font-['Lora',serif] text-sm italic leading-relaxed text-[#2C3E2D]/75">
          {t.rsvpHint}
        </p>
      </RevealSection>
    </section>
  );
}

function FooterSection({ t }: { t: Labels }) {
  return (
    <footer className="relative isolate overflow-hidden pb-10 pt-20 text-center">
      {/* Top botanical border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden="true">
        <EucalyptusBranch
          className="absolute top-2 left-1/2 w-[420px] max-w-[80vw] -translate-x-1/2 opacity-70"
          flip
        />
      </div>

      {/* Background washes */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <WatercolorBlob
          className="absolute -bottom-32 left-1/2 h-[520px] w-[720px] -translate-x-1/2"
          rx={300}
          ry={120}
          opacity={0.22}
          blur={32}
        />
      </div>

      {/* Corner botanicals */}
      <FernFrond
        side="bl"
        className="pointer-events-none absolute -bottom-2 -left-4 h-40 w-auto opacity-90 md:h-60"
      />
      <FernFrond
        side="br"
        className="pointer-events-none absolute -bottom-2 -right-4 h-40 w-auto opacity-90 md:h-60"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6">
        <div className="flex items-center gap-3 text-[#7A9B76]">
          <LeafGlyph size={12} />
          <LeafGlyph size={12} />
          <LeafGlyph size={12} />
        </div>
        <p className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#2C3E2D] md:text-3xl">
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

export default function BotanicTemplate(props: PublicInvitationPageProps) {
  const {
    eventDate,
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

  useGoogleFonts();
  useThemeStyles();
  const t = useLabels(locale);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#FAFAF7] font-['Lora',serif] text-[#2C3E2D] antialiased">
      {/* Subtle paper grain backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #2C3E2D 1px, transparent 1px), radial-gradient(circle at 70% 80%, #2C3E2D 1px, transparent 1px)',
          backgroundSize: '40px 40px, 60px 60px',
        }}
      />

      <HeroSection props={props} />

      {story ? <StorySection story={story} t={t} /> : null}

      <CountdownSection eventDate={eventDate} t={t} />

      <LocationsSection locations={locations} t={t} locale={locale} />

      <ProgramSection program={program} t={t} locale={locale} />

      {dressCode ? <DressCodeSection dressCode={dressCode} t={t} /> : null}

      {giftRegistry ? <GiftSection giftRegistry={giftRegistry} t={t} /> : null}

      {parents ? <ParentsSection parents={parents} t={t} /> : null}

      {accommodation ? <AccommodationSection accommodation={accommodation} t={t} /> : null}

      <RsvpSection enabled={rsvpEnabled} onRsvpClick={onRsvpClick} t={t} />

      <FooterSection t={t} />
    </main>
  );
}
