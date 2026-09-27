/**
 * Cinematik — Wedding Invitation Template
 * ========================================
 *
 * Theme: cinematic auteur. The page reads like a film: cinemascope hero with
 * letterbox bars, dramatic serif title cards, a countdown that feels like a
 * movie timer, and locations / schedule rendered as closing credits.
 *
 * Palette (exact hex):
 *   - Carbon black   #0E0E10  primary canvas (even sections)
 *   - Charcoal       #1A1A1F  alternating sections
 *   - Amber          #E8B872  accent / punctuation / RSVP CTA
 *   - Bone white     #F5F1E8  primary text
 *   - Ink            #050507  letterbox bars & footer
 *
 * Typography:
 *   - Playfair Display 700/900   couple names, section headings, story quote
 *   - Inter 300/400/500         body copy, UI labels, RSVP text
 *   - JetBrains Mono 400/700    countdown digits, time stamps, film-credits,
 *                                footer attribution
 *
 * All three families are loaded at runtime via injected Google Fonts <link>
 * elements so the template stays self-contained. All animations honour
 * `prefers-reduced-motion: reduce` and are disabled when the user requests it.
 *
 * The component is presentation-only: no business logic, no data fetching, no
 * shared imports. Only React.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// --- Public interface ----------------------------------------------------

export interface PublicInvitationPageProps {
  partner1Name: string;
  partner2Name: string;
  eventDate: string; // ISO date e.g. '2026-11-08'
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

// --- Labels --------------------------------------------------------------

type Locale = 'en' | 'es';

const labels: Record<Locale, Record<string, string>> = {
  en: {
    heroEyebrow: 'A Feature Presentation',
    saveTheDate: 'Save the Date',
    storyEyebrow: 'Act I',
    storyHeading: 'Once Upon A Time',
    countdownEyebrow: 'Now Playing',
    countdownHeading: 'Begins In',
    countdownToday: 'Today',
    locationsEyebrow: 'The Set',
    locationsHeading: 'Locations',
    programEyebrow: 'The Program',
    programHeading: 'Schedule',
    dressCodeEyebrow: 'The Dress Code',
    dressCodeHeading: 'Costume',
    giftRegistryEyebrow: 'The Registry',
    giftRegistryHeading: 'Gifts',
    parentsEyebrow: 'With Love',
    parentsHeading: 'Our Parents',
    accommodationEyebrow: 'Lodging',
    accommodationHeading: 'Where To Stay',
    rsvpEyebrow: 'The Final Act',
    rsvpHeading: 'Will You Join Us?',
    rsvpCta: 'RSVP Now',
    footerLead: 'Directed by',
    footerBrand: 'Deer Planner',
    viewOnMap: 'View on Map',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    and: 'and',
  },
  es: {
    heroEyebrow: 'Una Presentación',
    saveTheDate: 'Reservá La Fecha',
    storyEyebrow: 'Acto I',
    storyHeading: 'Érase Una Vez',
    countdownEyebrow: 'En Cartelera',
    countdownHeading: 'Comienza En',
    countdownToday: 'Hoy',
    locationsEyebrow: 'El Set',
    locationsHeading: 'Locaciones',
    programEyebrow: 'El Programa',
    programHeading: 'Itinerario',
    dressCodeEyebrow: 'El Vestuario',
    dressCodeHeading: 'Vestimenta',
    giftRegistryEyebrow: 'El Registro',
    giftRegistryHeading: 'Regalos',
    parentsEyebrow: 'Con Amor',
    parentsHeading: 'Nuestros Padres',
    accommodationEyebrow: 'Hospedaje',
    accommodationHeading: 'Dónde Alojarse',
    rsvpEyebrow: 'El Acto Final',
    rsvpHeading: '¿Nos Acompañás?',
    rsvpCta: 'Confirmar Asistencia',
    footerLead: 'Dirigida por',
    footerBrand: 'Deer Planner',
    viewOnMap: 'Ver en Mapa',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Minutos',
    seconds: 'Segundos',
    and: 'y',
  },
};

// --- Helpers -------------------------------------------------------------

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatLongDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDayHeading(
  dateIso: string,
  fallback: string | undefined,
  locale: Locale,
): string {
  if (!dateIso) return fallback ?? '';
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return fallback ?? dateIso;
  return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// --- Hooks ---------------------------------------------------------------

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap';

function useInjectFonts(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.querySelector('link[data-cinematik-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    link.setAttribute('data-cinematik-fonts', 'true');
    document.head.appendChild(link);
  }, []);
}

const ANIMATION_STYLES = `
@keyframes cinematik-ken-burns {
  0%   { transform: scale(1.00) translate3d(0, 0, 0); }
  100% { transform: scale(1.10) translate3d(-1.5%, -1.5%, 0); }
}
@keyframes cinematik-fade-in {
  from { opacity: 0; transform: translate3d(0, 28px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes cinematik-amber-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1;    }
}
@keyframes cinematik-scroll-cue {
  0%, 100% { transform: translateY(0);   opacity: 0.9; }
  50%      { transform: translateY(8px); opacity: 0.35; }
}
.cinematik-ken-burns   { animation: cinematik-ken-burns 32s ease-in-out infinite alternate; }
.cinematik-fade-in     { animation: cinematik-fade-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both; }
.cinematik-amber-pulse { animation: cinematik-amber-pulse 3.4s ease-in-out infinite; }
.cinematik-scroll-cue  { animation: cinematik-scroll-cue 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .cinematik-ken-burns,
  .cinematik-fade-in,
  .cinematik-amber-pulse,
  .cinematik-scroll-cue {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
`;

function useInjectStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cinematik-styles')) return;
    const style = document.createElement('style');
    style.id = 'cinematik-styles';
    style.textContent = ANIMATION_STYLES;
    document.head.appendChild(style);
  }, []);
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function useCountdown(targetIso: string): Countdown {
  const target = useMemo(() => {
    const t = new Date(targetIso).getTime();
    return Number.isNaN(t) ? 0 : t;
  }, [targetIso]);
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff === 0,
  };
}

// --- Sub-components ------------------------------------------------------

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[#E8B872] uppercase tracking-[0.42em] text-[10px] md:text-xs font-medium mb-5 cinematik-amber-pulse inline-flex items-center gap-3">
      <span className="h-px w-6 bg-[#E8B872]/60" aria-hidden="true" />
      <span>{children}</span>
      <span className="h-px w-6 bg-[#E8B872]/60" aria-hidden="true" />
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold text-[#F5F1E8] mb-10 inline-block pb-4 border-b border-[#E8B872]/60">
      {children}
    </h2>
  );
}

interface SectionProps {
  id?: string;
  bg: string;
  borderTop?: boolean;
  children: ReactNode;
}

function Section({ id, bg, borderTop = true, children }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || !entry.isIntersecting) return;
        entry.target.classList.add('cinematik-fade-in');
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      ref={ref}
      id={id}
      className={`${bg} py-20 md:py-28 px-6 md:px-12 ${borderTop ? 'border-t border-[#E8B872]/20' : ''}`}
    >
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[68px] md:min-w-[100px]">
      <span
        className="font-['JetBrains_Mono'] text-4xl md:text-7xl font-bold tabular-nums tracking-tight text-[#F5F1E8]"
        aria-hidden="true"
      >
        {pad2(value)}
      </span>
      <span className="mt-2 md:mt-3 uppercase tracking-[0.32em] text-[10px] md:text-xs text-[#F5F1E8]/55">
        {label}
      </span>
    </div>
  );
}

function CountdownSep() {
  return (
    <span
      className="font-['JetBrains_Mono'] text-[#E8B872]/70 text-3xl md:text-6xl font-light select-none -mt-6 md:-mt-10"
      aria-hidden="true"
    >
      :
    </span>
  );
}

// --- Main component ------------------------------------------------------

function CinematikTemplate(props: PublicInvitationPageProps) {
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

  useInjectFonts();
  useInjectStyles();

  const L = labels[locale];
  const formattedDate = useMemo(
    () => formatLongDate(eventDate, locale),
    [eventDate, locale],
  );
  const countdown = useCountdown(eventDate);

  const heroFallbackStyle = {
    background: `
      radial-gradient(ellipse 90% 60% at 50% 100%, rgba(232, 184, 114, 0.28) 0%, rgba(232, 184, 114, 0) 60%),
      linear-gradient(180deg, #1A1A1F 0%, #0E0E10 65%, #050507 100%)
    `,
  };

  const heroOverlayStyle = {
    background: `
      radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%),
      linear-gradient(180deg, rgba(14,14,16,0.45) 0%, rgba(14,14,16,0.05) 40%, rgba(14,14,16,0.9) 100%)
    `,
  };

  return (
    <article
      lang={locale}
      className="font-['Inter'] bg-[#0E0E10] text-[#F5F1E8] min-h-screen antialiased selection:bg-[#E8B872] selection:text-[#0E0E10]"
    >
      {/* Reusable SVG defs (film grain filter) */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <filter id="cinematik-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0" />
          </filter>
        </defs>
      </svg>

      {/* ============================ HERO ============================ */}
      <header
        className="relative w-full overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: '16 / 9', minHeight: '620px' }}
      >
        {heroImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center cinematik-ken-burns"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
            role="img"
            aria-label={`${partner1Name} ${L.and} ${partner2Name}`}
          />
        ) : (
          <div className="absolute inset-0" style={heroFallbackStyle} aria-hidden="true" />
        )}

        {/* Film grain overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.10] mix-blend-overlay pointer-events-none"
          aria-hidden="true"
        >
          <rect width="100%" height="100%" filter="url(#cinematik-grain)" />
        </svg>

        {/* Vignette + top/bottom shading */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={heroOverlayStyle}
          aria-hidden="true"
        />

        {/* Cinemascope letterbox bars */}
        <div
          className="absolute top-0 left-0 right-0 h-3 md:h-5 bg-[#050507] z-20"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-3 md:h-5 bg-[#050507] z-20"
          aria-hidden="true"
        />

        {/* Hero content */}
        <div className="relative z-10 w-full px-6 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-5 md:mb-10">
            <span className="h-px w-8 md:w-12 bg-[#E8B872]/70" aria-hidden="true" />
            <span className="text-[#E8B872] uppercase tracking-[0.5em] text-[10px] md:text-xs font-medium cinematik-amber-pulse">
              {L.heroEyebrow}
            </span>
            <span className="h-px w-8 md:w-12 bg-[#E8B872]/70" aria-hidden="true" />
          </div>

          {landingTitle ? (
            <p className="font-['Playfair_Display'] italic text-[#F5F1E8]/85 text-base md:text-xl mb-5 md:mb-8 max-w-2xl mx-auto">
              {landingTitle}
            </p>
          ) : null}

          <h1
            className="font-['Playfair_Display'] font-black text-[#F5F1E8] leading-[0.95] tracking-tight"
            style={{
              textShadow: '0 4px 30px rgba(0,0,0,0.55), 0 0 80px rgba(0,0,0,0.4)',
            }}
          >
            <span
              className="block"
              style={{ fontSize: 'clamp(2.75rem, 8.5vw, 7.5rem)' }}
            >
              {partner1Name}
            </span>
            <span
              className="block text-[#E8B872] font-light italic"
              style={{ fontSize: 'clamp(1rem, 3vw, 2.5rem)', margin: '0.15em 0' }}
            >
              {L.and}
            </span>
            <span
              className="block"
              style={{ fontSize: 'clamp(2.75rem, 8.5vw, 7.5rem)' }}
            >
              {partner2Name}
            </span>
          </h1>

          <div className="mt-8 md:mt-12 flex flex-col items-center gap-3">
            <span className="h-px w-14 bg-[#E8B872]/70" aria-hidden="true" />
            <span className="font-['JetBrains_Mono'] uppercase tracking-[0.32em] text-[#E8B872] text-[10px] md:text-sm">
              {L.saveTheDate}
            </span>
            <time
              dateTime={eventDate}
              className="font-['Playfair_Display'] text-[#F5F1E8] text-xl md:text-3xl tracking-wide"
            >
              {formattedDate}
            </time>
            {landingSubtitle ? (
              <p className="font-['Inter'] text-[#F5F1E8]/65 text-xs md:text-sm tracking-widest uppercase mt-2">
                {landingSubtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-[#E8B872] cinematik-scroll-cue"
          aria-hidden="true"
        >
          <svg width="20" height="34" viewBox="0 0 20 34" fill="none">
            <rect
              x="1"
              y="1"
              width="18"
              height="32"
              rx="9"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </header>

      {/* ============================ STORY ============================ */}
      {story?.body ? (
        <Section id="story" bg="bg-[#1A1A1F]">
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>{L.storyEyebrow}</Eyebrow>
            <SectionHeading>{L.storyHeading}</SectionHeading>
            <div
              className="font-['Playfair_Display'] italic text-[#E8B872] text-6xl md:text-7xl leading-none mb-4 select-none"
              aria-hidden="true"
            >
              &ldquo;
            </div>
            <p className="font-['Inter'] text-[#F5F1E8]/85 text-base md:text-lg leading-relaxed whitespace-pre-line">
              {story.body}
            </p>
          </div>
        </Section>
      ) : null}

      {/* ============================ COUNTDOWN ============================ */}
      <Section id="countdown" bg="bg-[#0E0E10]">
        <div className="text-center">
          <Eyebrow>{L.countdownEyebrow}</Eyebrow>
          <SectionHeading>{L.countdownHeading}</SectionHeading>
          <div
            className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-6"
            role="timer"
            aria-live="polite"
            aria-label="Countdown to the wedding"
          >
            <CountdownUnit value={countdown.days} label={L.days} />
            <CountdownSep />
            <CountdownUnit value={countdown.hours} label={L.hours} />
            <CountdownSep />
            <CountdownUnit value={countdown.minutes} label={L.minutes} />
            <CountdownSep />
            <CountdownUnit value={countdown.seconds} label={L.seconds} />
          </div>
          {countdown.done ? (
            <p className="mt-8 font-['Playfair_Display'] italic text-[#E8B872] text-xl">
              {L.countdownToday}
            </p>
          ) : null}
        </div>
      </Section>

      {/* ============================ LOCATIONS ============================ */}
      {locations.length > 0 ? (
        <Section id="locations" bg="bg-[#1A1A1F]">
          <div>
            <div className="text-center mb-12 md:mb-14">
              <Eyebrow>{L.locationsEyebrow}</Eyebrow>
              <SectionHeading>{L.locationsHeading}</SectionHeading>
            </div>
            <ul className="grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-4xl mx-auto">
              {locations.map((loc, i) => (
                <li
                  key={`${loc.label}-${i}`}
                  className="border-l border-[#E8B872]/40 pl-5 md:pl-6"
                >
                  <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                    <span
                      className="text-[#E8B872] text-2xl leading-none"
                      aria-hidden="true"
                    >
                      &bull;
                    </span>
                    {loc.time ? (
                      <span className="font-['JetBrains_Mono'] text-[#E8B872] text-xs md:text-sm tracking-wider">
                        {loc.time}
                      </span>
                    ) : null}
                    <span className="uppercase tracking-[0.3em] text-[#F5F1E8]/70 text-[10px] md:text-xs font-medium">
                      {loc.label}
                    </span>
                  </div>
                  <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl text-[#F5F1E8] mb-1">
                    {loc.name}
                  </h3>
                  {loc.address ? (
                    <p className="text-[#F5F1E8]/70 text-sm">{loc.address}</p>
                  ) : null}
                  {loc.city ? (
                    <p className="text-[#F5F1E8]/70 text-sm">{loc.city}</p>
                  ) : null}
                  {loc.mapsLink ? (
                    <a
                      href={loc.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-[#E8B872] uppercase tracking-[0.28em] text-[10px] md:text-xs font-medium hover:text-[#F5F1E8] transition-colors duration-300"
                    >
                      {L.viewOnMap} &rarr;
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      {/* ============================ PROGRAM ============================ */}
      {program.days.length > 0 ? (
        <Section id="program" bg="bg-[#0E0E10]">
          <div className="text-center mb-12 md:mb-14">
            <Eyebrow>{L.programEyebrow}</Eyebrow>
            <SectionHeading>{L.programHeading}</SectionHeading>
          </div>
          <div className="space-y-14 md:space-y-16 max-w-4xl mx-auto">
            {program.days.map((day, dayIdx) => (
              <div key={`day-${dayIdx}`}>
                {day.date || day.label ? (
                  <div className="text-center mb-8">
                    <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl text-[#E8B872] tracking-wide">
                      {day.date
                        ? formatDayHeading(day.date, day.label, locale)
                        : day.label}
                    </h3>
                    <div
                      className="h-px w-12 bg-[#E8B872]/50 mx-auto mt-3"
                      aria-hidden="true"
                    />
                  </div>
                ) : null}
                <ul className="space-y-5 md:space-y-6">
                  {day.items.map((item, itemIdx) => (
                    <li
                      key={`item-${dayIdx}-${itemIdx}`}
                      className="grid md:grid-cols-[120px_1fr] gap-2 md:gap-8 items-baseline border-l border-[#E8B872]/30 pl-5"
                    >
                      <span className="font-['JetBrains_Mono'] text-[#E8B872] text-sm tracking-wider">
                        {item.time}
                      </span>
                      <div>
                        <h4 className="font-['Playfair_Display'] text-xl md:text-2xl text-[#F5F1E8] mb-1">
                          {item.title}
                        </h4>
                        {item.detail ? (
                          <p className="text-[#F5F1E8]/70 text-sm leading-relaxed">
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
        </Section>
      ) : null}

      {/* ============================ DRESS CODE ============================ */}
      {dressCode?.entries && dressCode.entries.length > 0 ? (
        <Section id="dress-code" bg="bg-[#1A1A1F]">
          <div className="text-center mb-10">
            <Eyebrow>{L.dressCodeEyebrow}</Eyebrow>
            <SectionHeading>{L.dressCodeHeading}</SectionHeading>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
            {dressCode.entries.map((entry, i) => (
              <div
                key={`dress-${i}`}
                className="border border-[#E8B872]/30 p-6 bg-[#0E0E10]/40 text-left"
              >
                <h3 className="font-['Playfair_Display'] text-lg md:text-xl text-[#E8B872] mb-2 uppercase tracking-[0.2em]">
                  {entry.title}
                </h3>
                <p className="text-[#F5F1E8]/80 text-sm leading-relaxed whitespace-pre-line">
                  {entry.body}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ============================ GIFT REGISTRY ============================ */}
      {giftRegistry?.body ? (
        <Section id="gifts" bg="bg-[#0E0E10]">
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>{L.giftRegistryEyebrow}</Eyebrow>
            <SectionHeading>{L.giftRegistryHeading}</SectionHeading>
            <p className="text-[#F5F1E8]/85 text-base md:text-lg leading-relaxed whitespace-pre-line">
              {giftRegistry.body}
            </p>
          </div>
        </Section>
      ) : null}

      {/* ============================ PARENTS ============================ */}
      {parents?.body ? (
        <Section id="parents" bg="bg-[#1A1A1F]">
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>{L.parentsEyebrow}</Eyebrow>
            <SectionHeading>{L.parentsHeading}</SectionHeading>
            <p className="text-[#F5F1E8]/85 text-base md:text-lg leading-relaxed whitespace-pre-line">
              {parents.body}
            </p>
          </div>
        </Section>
      ) : null}

      {/* ============================ ACCOMMODATION ============================ */}
      {accommodation?.body ? (
        <Section id="accommodation" bg="bg-[#0E0E10]">
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>{L.accommodationEyebrow}</Eyebrow>
            <SectionHeading>{L.accommodationHeading}</SectionHeading>
            <p className="text-[#F5F1E8]/85 text-base md:text-lg leading-relaxed whitespace-pre-line">
              {accommodation.body}
            </p>
          </div>
        </Section>
      ) : null}

      {/* ============================ RSVP ============================ */}
      {rsvpEnabled ? (
        <Section id="rsvp" bg="bg-[#1A1A1F]" borderTop={true}>
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>{L.rsvpEyebrow}</Eyebrow>
            <SectionHeading>{L.rsvpHeading}</SectionHeading>
          </div>
        </Section>
      ) : null}

      {/* ============================ FOOTER ============================ */}
      <footer className="bg-[#050507] py-10 md:py-12 px-6 text-center border-t border-[#E8B872]/20">
        <div className="font-['JetBrains_Mono'] text-[#F5F1E8]/55 text-[10px] md:text-xs uppercase tracking-[0.45em]">
          {L.footerLead}{' '}
          <span className="text-[#E8B872]/90">{L.footerBrand}</span>
        </div>
        <div
          className="mt-3 h-px w-10 bg-[#E8B872]/40 mx-auto"
          aria-hidden="true"
        />
      </footer>
    </article>
  );
}

export default CinematikTemplate;
