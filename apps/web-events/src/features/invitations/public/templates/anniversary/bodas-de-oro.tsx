/**
 * Bodas de Oro — Golden Anniversary Invitation Template
 * --------------------------------------------------------------
 * A milestone anniversary celebration template for Deer Planner.
 * Visual concept: classic golden elegance. The hero anchors on a
 * massive gold serif milestone number (sourced from the
 * `yearsCelebrating` prop) wrapped in a thin medallion ring,
 * flanked by golden laurel branches, and softly crossed by a
 * diagonal shine sweep. Sections alternate between warm cream
 * panels and carbon black velvet, separated by 1px gold rules and
 * uppercase letter-spaced gold labels.
 *
 * Palette (exact hex values):
 *   Carbon black   #0E0E10   background / dark panels
 *   Gold           #D4AF37   primary accent / typography
 *   Warm cream     #F5E6D3   light panels / card surfaces
 *   Sienna brown   #8B4513   depth / laurel stems
 *   Pure white     #FFFFFF   highlights / shine sweep
 *
 * Typography:
 *   Display: Cormorant Garamond (700/900) — loaded via Google Fonts
 *   Body:    Inter (400/500)             — loaded via Google Fonts
 *
 * Accessibility:
 *   The shine sweep respects prefers-reduced-motion.
 *
 * Self-contained: only React imports; no shared components,
 * no @/ aliases, no third-party libs. Inline SVG only.
 */

import React, { useEffect, useMemo, useState } from 'react';

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

type Locale = 'en' | 'es';

interface Labels {
  heroEyebrow: string;
  yearsWord: string;
  story: string;
  countdown: string;
  countdownReady: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  locations: string;
  program: string;
  dressCode: string;
  giftRegistry: string;
  rsvp: string;
  rsvpHint: string;
  footerAttribution: string;
  addressLabel: string;
  openInMaps: string;
}

const labels: Record<Locale, Labels> = {
  en: {
    heroEyebrow: 'A milestone celebration',
    yearsWord: 'years',
    story: 'Our story',
    countdown: 'Counting the days',
    countdownReady: 'Today we celebrate',
    countdownDays: 'Days',
    countdownHours: 'Hours',
    countdownMinutes: 'Minutes',
    countdownSeconds: 'Seconds',
    locations: 'Where to find us',
    program: 'The celebration',
    dressCode: 'Dress code',
    giftRegistry: 'Gifts',
    rsvp: 'Confirm attendance',
    rsvpHint: 'We kindly await your reply',
    footerAttribution: 'Crafted with Deer Planner',
    addressLabel: 'Address',
    openInMaps: 'Open in maps'
  },
  es: {
    heroEyebrow: 'Una celebracion milestone',
    yearsWord: 'anos',
    story: 'Nuestra historia',
    countdown: 'Cuenta regresiva',
    countdownReady: 'Hoy celebramos',
    countdownDays: 'Dias',
    countdownHours: 'Horas',
    countdownMinutes: 'Minutos',
    countdownSeconds: 'Segundos',
    locations: 'Donde encontrarnos',
    program: 'La celebracion',
    dressCode: 'Codigo de vestimenta',
    giftRegistry: 'Regalos',
    rsvp: 'Confirmar asistencia',
    rsvpHint: 'Esperamos tu confirmacion',
    footerAttribution: 'Creado con Deer Planner',
    addressLabel: 'Direccion',
    openInMaps: 'Abrir en mapas'
  }
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap';
const FONT_LINK_ID = 'bodas-de-oro-fonts';
const STYLE_BLOCK_ID = 'bodas-de-oro-styles';

function useGoogleFonts(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

function useTemplateStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_BLOCK_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_BLOCK_ID;
    style.textContent = `
      .bdo-root { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      .bdo-display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; }

      .bdo-shine { position: relative; display: inline-block; }
      .bdo-shine::after {
        content: attr(data-text);
        position: absolute;
        inset: 0;
        color: transparent;
        -webkit-text-fill-color: transparent;
        background-image: linear-gradient(
          110deg,
          transparent 30%,
          rgba(255, 233, 168, 0) 40%,
          rgba(255, 233, 168, 0.95) 49%,
          rgba(255, 255, 255, 1) 51%,
          rgba(255, 233, 168, 0.95) 53%,
          rgba(255, 233, 168, 0) 60%,
          transparent 70%
        );
        background-size: 250% 100%;
        background-position: 150% 0;
        -webkit-background-clip: text;
        background-clip: text;
        animation: bdo-shine-sweep 4s linear infinite;
        pointer-events: none;
      }
      @keyframes bdo-shine-sweep {
        0%   { background-position: 150% 0; }
        100% { background-position: -50% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .bdo-shine::after { animation: none; }
      }

      .bdo-rsvp {
        transition: transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
      }
      .bdo-rsvp:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow:
          0 0 0 1px rgba(212, 175, 55, 0.55),
          0 0 24px 4px rgba(212, 175, 55, 0.35),
          0 0 56px 8px rgba(212, 175, 55, 0.18);
      }
      .bdo-rsvp:focus-visible {
        outline: 2px solid #D4AF37;
        outline-offset: 4px;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isReady: boolean;
}

function useCountdown(targetIso: string): CountdownValue {
  const target = useMemo<number | null>(() => {
    const t = new Date(targetIso);
    return Number.isNaN(t.getTime()) ? null : t.getTime();
  }, [targetIso]);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (target === null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isReady: false };
  }
  const diff = target - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isReady: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isReady: false };
}

function formatEventDate(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return iso;
  }
}

function LaurelBranch({ flip = false }: { flip?: boolean }) {
  const leaves = [22, 56, 92, 130, 168, 204];
  return (
    <svg
      viewBox="0 0 80 220"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M40 6 C 39 70, 41 150, 40 214"
        stroke="#8B4513"
        strokeWidth="0.9"
        fill="none"
        opacity="0.85"
      />
      <g fill="#D4AF37" opacity="0.95">
        {leaves.map((y, i) => (
          <g key={`leaf-${i}`}>
            <ellipse
              cx={40 - 20}
              cy={y}
              rx={15}
              ry={5.2}
              transform={`rotate(${-32 - i * 2} ${40 - 20} ${y})`}
            />
            <ellipse
              cx={40 + 20}
              cy={y}
              rx={15}
              ry={5.2}
              transform={`rotate(${32 + i * 2} ${40 + 20} ${y})`}
            />
          </g>
        ))}
      </g>
      <g fill="#F5E6D3" opacity="0.22">
        {leaves.map((y, i) => (
          <ellipse
            key={`hl-${i}`}
            cx={40 - 20}
            cy={y - 1}
            rx={9}
            ry={1.2}
            transform={`rotate(${-32 - i * 2} ${40 - 20} ${y - 1})`}
          />
        ))}
      </g>
    </svg>
  );
}

function GoldStar({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="inline-block"
    >
      <path
        d="M12 1 L13.6 9.2 L22 12 L13.6 14.8 L12 23 L10.4 14.8 L2 12 L10.4 9.2 Z"
        fill="#D4AF37"
      />
    </svg>
  );
}

function GoldRule({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const color = tone === 'dark' ? 'bg-[#D4AF37]/60' : 'bg-[#D4AF37]/55';
  return <div aria-hidden className={`mx-auto h-px w-24 ${color}`} />;
}

function SectionLabel({ children, tone = 'dark' }: { children: React.ReactNode; tone?: 'dark' | 'light' }) {
  const color = tone === 'dark' ? 'text-[#D4AF37]' : 'text-[#8B4513]';
  return (
    <h2
      className={`text-center text-[11px] font-medium uppercase tracking-[0.4em] ${color}`}
    >
      {children}
    </h2>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center px-3 sm:px-5">
      <span className="bdo-display text-5xl font-light italic text-[#D4AF37] sm:text-6xl md:text-7xl">
        {padded}
      </span>
      <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.4em] text-[#F5E6D3]/70">
        {label}
      </span>
    </div>
  );
}

export default function BodasDeOroTemplate(props: PublicInvitationPageProps) {
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
    locale
  } = props;

  useGoogleFonts();
  useTemplateStyles();

  const t = labels[locale];
  const eventDateFormatted = useMemo(
    () => formatEventDate(eventDate, locale),
    [eventDate, locale]
  );
  const countdown = useCountdown(eventDate);
  const milestone = String(yearsCelebrating);
  const heroHasImage = Boolean(heroImageUrl);

  return (
    <div className="bdo-root min-h-screen w-full bg-[#0E0E10] text-[#F5E6D3]">
      <header
        className="relative isolate overflow-hidden"
        style={
          heroHasImage
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(14,14,16,0.55) 0%, rgba(14,14,16,0.88) 100%), url(${heroImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : {
                background:
                  'radial-gradient(ellipse at 50% 35%, #2A1A0A 0%, #160C04 38%, #0E0E10 75%)'
              }
        }
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center opacity-[0.06]"
          aria-hidden
        >
          <div className="h-72 w-20">
            <LaurelBranch />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
          <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.5em] text-[#D4AF37]">
            {t.heroEyebrow}
          </p>

          <div className="bdo-medallion relative mb-10 flex items-center justify-center gap-6 sm:gap-10">
            <div className="hidden h-48 w-12 sm:block md:h-60 md:w-16">
              <LaurelBranch />
            </div>

            <div
              className="bdo-display bdo-shine relative flex h-52 w-52 items-center justify-center rounded-full text-[#D4AF37] sm:h-64 sm:w-64 md:h-72 md:w-72"
              style={{
                fontWeight: 900,
                fontSize: 'clamp(7rem, 18vw, 11rem)',
                lineHeight: 1,
                letterSpacing: '0.06em',
                boxShadow:
                  'inset 0 0 0 1px rgba(212,175,55,0.85), inset 0 0 0 6px rgba(14,14,16,0.95), inset 0 0 0 7px rgba(212,175,55,0.45), 0 0 60px rgba(212,175,55,0.18)'
              }}
              data-text={milestone}
              aria-label={`${yearsCelebrating} ${t.yearsWord}`}
              role="img"
            >
              <span aria-hidden>{milestone}</span>
            </div>

            <div className="hidden h-48 w-12 sm:block md:h-60 md:w-16">
              <LaurelBranch flip />
            </div>
          </div>

          <span className="bdo-display -mt-4 mb-2 text-[10px] uppercase tracking-[0.5em] text-[#D4AF37]/85">
            {t.yearsWord}
          </span>

          <h1
            className="bdo-display mt-2 text-4xl font-light italic text-[#F5E6D3] sm:text-5xl md:text-6xl"
            style={{ letterSpacing: '0.02em' }}
          >
            {honoreeName}
          </h1>

          {landingTitle ? (
            <p className="bdo-display mt-4 text-2xl font-normal italic text-[#F5E6D3]/90 sm:text-3xl">
              {landingTitle}
            </p>
          ) : null}

          {landingSubtitle ? (
            <p className="mt-3 max-w-xl text-[11px] font-medium uppercase tracking-[0.4em] text-[#D4AF37]/85 sm:text-xs">
              {landingSubtitle}
            </p>
          ) : null}

          <div className="mt-10 flex items-center gap-4 text-[#D4AF37]">
            <span className="h-px w-10 bg-[#D4AF37]/60" aria-hidden />
            <time
              dateTime={eventDate}
              className="bdo-display text-sm font-medium uppercase tracking-[0.5em] text-[#F5E6D3] sm:text-base"
            >
              {eventDateFormatted}
            </time>
            <span className="h-px w-10 bg-[#D4AF37]/60" aria-hidden />
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"
          aria-hidden
        />
      </header>

      {story ? (
        <section className="relative bg-[#F5E6D3] px-6 py-24 text-[#0E0E10]">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel tone="light">{t.story}</SectionLabel>
            <div className="my-8 flex justify-center">
              <GoldRule tone="light" />
            </div>
            <p className="bdo-display mx-auto max-w-2xl text-2xl font-normal leading-relaxed text-[#0E0E10]/85 sm:text-3xl">
              {story.body}
            </p>
          </div>
        </section>
      ) : null}

      <section className="relative bg-[#0E0E10] px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <SectionLabel>{t.countdown}</SectionLabel>
          <div className="my-8 flex justify-center">
            <GoldRule />
          </div>

          {countdown.isReady ? (
            <p className="bdo-display text-3xl italic text-[#D4AF37] sm:text-4xl">
              {t.countdownReady}
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 text-[#D4AF37] sm:gap-4">
              <CountdownCell value={countdown.days} label={t.countdownDays} />
              <GoldStar />
              <CountdownCell value={countdown.hours} label={t.countdownHours} />
              <GoldStar />
              <CountdownCell value={countdown.minutes} label={t.countdownMinutes} />
              <GoldStar />
              <CountdownCell value={countdown.seconds} label={t.countdownSeconds} />
            </div>
          )}
        </div>
      </section>

      {locations.length > 0 ? (
        <section className="relative bg-[#F5E6D3] px-6 py-24 text-[#0E0E10]">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <SectionLabel tone="light">{t.locations}</SectionLabel>
              <div className="my-8 flex justify-center">
                <GoldRule tone="light" />
              </div>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2">
              {locations.map((loc, idx) => (
                <li
                  key={`loc-${idx}`}
                  className="rounded-sm border border-[#D4AF37]/70 bg-[#FFF8EC] p-8 text-left"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#8B4513]">
                    {loc.label}
                  </p>
                  <h3 className="bdo-display mt-3 text-2xl font-semibold text-[#0E0E10]">
                    {loc.name}
                  </h3>
                  {loc.time ? (
                    <p className="bdo-display mt-1 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
                      {loc.time}
                    </p>
                  ) : null}
                  {loc.address || loc.city ? (
                    <div className="mt-4 text-sm leading-relaxed text-[#0E0E10]/75">
                      <span className="block text-[10px] uppercase tracking-[0.35em] text-[#8B4513]">
                        {t.addressLabel}
                      </span>
                      <span>
                        {loc.address}
                        {loc.address && loc.city ? ', ' : ''}
                        {loc.city}
                      </span>
                    </div>
                  ) : null}
                  {loc.mapsLink ? (
                    <a
                      href={loc.mapsLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#8B4513] transition-colors hover:text-[#D4AF37]"
                    >
                      <span className="h-px w-6 bg-[#D4AF37]" aria-hidden />
                      {t.openInMaps}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {program.days.length > 0 ? (
        <section className="relative bg-[#0E0E10] px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <SectionLabel>{t.program}</SectionLabel>
              <div className="my-8 flex justify-center">
                <GoldRule />
              </div>
            </div>
            <div className="space-y-14">
              {program.days.map((day, dIdx) => (
                <div key={`day-${dIdx}`}>
                  <div className="mb-6 flex items-center justify-center gap-4">
                    <span className="h-px w-10 bg-[#D4AF37]/55" aria-hidden />
                    <h3 className="bdo-display text-center text-lg uppercase tracking-[0.45em] text-[#D4AF37]">
                      {day.label ?? ''}
                      {day.date ? ` · ${formatEventDate(day.date, locale)}` : ''}
                    </h3>
                    <span className="h-px w-10 bg-[#D4AF37]/55" aria-hidden />
                  </div>
                  <ul className="mx-auto grid max-w-3xl gap-4">
                    {day.items.map((item, iIdx) => (
                      <li
                        key={`item-${dIdx}-${iIdx}`}
                        className="flex flex-col gap-3 rounded-sm border border-[#D4AF37]/40 bg-[#161108] p-6 sm:flex-row sm:items-baseline sm:gap-8"
                      >
                        <span className="bdo-display shrink-0 text-2xl font-semibold italic text-[#D4AF37] sm:w-28 sm:text-3xl">
                          {item.time}
                        </span>
                        <div className="flex-1">
                          <h4 className="bdo-display text-xl font-semibold text-[#F5E6D3] sm:text-2xl">
                            {item.title}
                          </h4>
                          {item.detail ? (
                            <p className="mt-1 text-sm leading-relaxed text-[#F5E6D3]/70">
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {dressCode ? (
        <section className="relative bg-[#F5E6D3] px-6 py-20 text-[#0E0E10]">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel tone="light">{t.dressCode}</SectionLabel>
            <div className="my-8 flex justify-center">
              <GoldRule tone="light" />
            </div>
            <p className="bdo-display text-2xl font-normal leading-relaxed text-[#0E0E10]/85 sm:text-3xl">
              {dressCode.body}
            </p>
          </div>
        </section>
      ) : null}

      {giftRegistry ? (
        <section className="relative bg-[#0E0E10] px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>{t.giftRegistry}</SectionLabel>
            <div className="my-8 flex justify-center">
              <GoldRule />
            </div>
            <p className="bdo-display text-2xl font-normal leading-relaxed text-[#F5E6D3]/85 sm:text-3xl">
              {giftRegistry.body}
            </p>
          </div>
        </section>
      ) : null}

      {rsvpEnabled ? (
        <section className="relative bg-[#F5E6D3] px-6 py-24 text-[#0E0E10]">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-4 h-10 w-10 text-[#D4AF37]" aria-hidden>
              <LaurelBranch />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#8B4513]">
              {t.rsvpHint}
            </p>
            <h2 className="bdo-display mt-4 text-4xl font-normal italic text-[#0E0E10] sm:text-5xl">
              {t.rsvp}
            </h2>
            <button
              type="button"
              onClick={onRsvpClick}
              className="bdo-rsvp bdo-display mt-10 inline-flex items-center justify-center bg-[#D4AF37] px-12 py-4 text-sm font-semibold uppercase tracking-[0.4em] text-[#0E0E10] hover:bg-[#E0BF52]"
            >
              {t.rsvp}
            </button>
          </div>
        </section>
      ) : null}

      <footer className="bg-[#0E0E10] px-6 py-10 text-center">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
          <span className="h-px w-16 bg-[#D4AF37]/55" aria-hidden />
          <p className="bdo-display text-sm uppercase tracking-[0.5em] text-[#D4AF37]/85">
            Deer&nbsp;Planner
          </p>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#F5E6D3]/40">
            {t.footerAttribution}
          </p>
        </div>
      </footer>
    </div>
  );
}
