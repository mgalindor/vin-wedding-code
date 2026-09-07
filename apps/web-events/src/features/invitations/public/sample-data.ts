/**
 * Sample-data factory used by the MVP wire-up (so `/i/:token` works
 * before the BE endpoint lands) and by the QA gallery preview.
 *
 * The factory infers `eventType` from the `templateCode` prefix and
 * returns the right `PublicInvitationData` shape. Copy is realistic
 * and switches language based on `locale`.
 */

import type {
  AnniversaryPublicData,
  BirthdayPublicData,
  CorporatePublicData,
  PublicInvitationData,
  PublicInvitationEventType,
  PublicInvitationLocale,
  WeddingPublicData,
} from './types';

export interface SampleOptions {
  templateCode: string;
  locale?: PublicInvitationLocale;
}

export function buildSampleInvitation(
  opts: SampleOptions,
): PublicInvitationData {
  const locale: PublicInvitationLocale = opts.locale ?? 'es';
  const eventType = inferEventType(opts.templateCode);

  switch (eventType) {
    case 'wedding':
      return buildWeddingSample(opts.templateCode, locale);
    case 'birthday':
      return buildBirthdaySample(opts.templateCode, locale);
    case 'corporate':
      return buildCorporateSample(opts.templateCode, locale);
    case 'anniversary':
      return buildAnniversarySample(opts.templateCode, locale);
    default: {
      const _exhaustive: never = eventType;
      throw new Error(
        `No sample builder for eventType: ${String(_exhaustive)}`,
      );
    }
  }
}

function inferEventType(code: string): PublicInvitationEventType {
  if (code.startsWith('wedding-')) return 'wedding';
  if (code.startsWith('birthday-')) return 'birthday';
  if (code.startsWith('corporate-')) return 'corporate';
  if (code.startsWith('anniversary-')) return 'anniversary';
  throw new Error(`Unknown template code: ${code}`);
}

// ---------------------------------------------------------------------------
// Wedding
// ---------------------------------------------------------------------------

function buildWeddingSample(
  templateCode: string,
  locale: PublicInvitationLocale,
): WeddingPublicData {
  return {
    eventType: 'wedding',
    templateCode,
    partner1Name: 'Emma',
    partner2Name: 'James',
    eventDate: '2026-11-08',
    heroImageUrl: null,
    landingTitle: 'Emma & James',
    landingSubtitle: null,
    story: {
      body:
        locale === 'es'
          ? 'Nos conocimos una tarde de otoño en una librería del centro. Cinco años después, decidimos empezar este nuevo capítulo juntos.'
          : 'We met on an autumn afternoon at a downtown bookshop. Five years later, we are starting this new chapter together.',
    },
    dressCode: {
      entries: [
        {
          title: locale === 'es' ? 'Vestimenta' : 'Dress Code',
          body: locale === 'es' ? 'Formal / Black Tie' : 'Formal / Black Tie',
        },
      ],
    },
    giftRegistry: null,
    parents: null,
    accommodation: null,
    locations: [
      {
        label: locale === 'es' ? 'Ceremonia' : 'Ceremony',
        name: locale === 'es' ? 'Catedral del Bosque' : 'Cathedral of the Woods',
        address: '1452 Old Mill Road',
        city: locale === 'es' ? 'Valle de los Cedros' : 'Cedar Valley',
        mapsLink: 'https://maps.example.com/ceremony',
        time: '17:00',
      },
      {
        label: locale === 'es' ? 'Recepción' : 'Reception',
        name: locale === 'es' ? 'Estancia La Aurora' : 'La Aurora Estate',
        address: '88 Camino del Río',
        city: locale === 'es' ? 'Valle de los Cedros' : 'Cedar Valley',
        mapsLink: 'https://maps.example.com/reception',
        time: '20:00',
      },
    ],
    program: {
      days: [
        {
          date: '2026-11-08',
          label: locale === 'es' ? 'Gran día' : 'The Big Day',
          items: [
            {
              time: '17:00',
              title: locale === 'es' ? 'Ceremonia' : 'Ceremony',
              detail:
                locale === 'es'
                  ? 'Catedral del Bosque · llegada 15 min antes'
                  : 'Cathedral of the Woods · please arrive 15 min early',
            },
            {
              time: '19:00',
              title: locale === 'es' ? 'Cóctel de bienvenida' : 'Welcome cocktail',
              detail:
                locale === 'es'
                  ? 'Jardines de la Estancia'
                  : 'Estate gardens',
            },
            {
              time: '21:00',
              title: locale === 'es' ? 'Cena y baile' : 'Dinner & dancing',
              detail:
                locale === 'es'
                  ? 'Salón principal · hasta que el cuerpo aguante'
                  : 'Main hall · until the lights come on',
            },
          ],
        },
      ],
    },
    rsvpEnabled: true,
    locale,
  };
}

// ---------------------------------------------------------------------------
// Birthday
// ---------------------------------------------------------------------------

function buildBirthdaySample(
  templateCode: string,
  locale: PublicInvitationLocale,
): BirthdayPublicData {
  return {
    eventType: 'birthday',
    templateCode,
    honoreeName: 'Sofía',
    ageTurning: ageForBirthdayCode(templateCode),
    eventDate: '2026-11-22',
    heroImageUrl: null,
    landingTitle: locale === 'es' ? '¡Sofía cumple!' : "Sofía's big day!",
    landingSubtitle:
      locale === 'es'
        ? 'Te esperamos para celebrar juntos'
        : "Join us to celebrate together",
    story: {
      body:
        locale === 'es'
          ? 'Un año más de aventuras, risas y aprendizaje. Acompañanos a soplar las velas.'
          : 'One more year of adventures, laughter and growing up. Come blow the candles with us.',
    },
    locations: [
      {
        label: locale === 'es' ? 'Salón de fiestas' : 'Party venue',
        name: locale === 'es' ? 'Casa del Lago' : 'Lakehouse Hall',
        address: '224 Riverside Drive',
        city: locale === 'es' ? 'Pueblo Nuevo' : 'New Town',
        mapsLink: 'https://maps.example.com/birthday',
        time: '16:00',
      },
    ],
    program: {
      days: [
        {
          date: '2026-11-22',
          items: [
            {
              time: '16:00',
              title: locale === 'es' ? 'Recepción' : 'Reception',
              detail:
                locale === 'es'
                  ? 'Bienvenida y merienda'
                  : 'Welcome and snacks',
            },
            {
              time: '18:30',
              title: locale === 'es' ? 'Torta y velas' : 'Cake & candles',
              detail:
                locale === 'es'
                  ? 'El momento más esperado'
                  : 'The moment everyone is waiting for',
            },
          ],
        },
      ],
    },
    rsvpEnabled: true,
    locale,
  };
}

function ageForBirthdayCode(code: string): number {
  if (code === 'birthday-bebe') return 1;
  if (code === 'birthday-quinceanera') return 15;
  return 5;
}

// ---------------------------------------------------------------------------
// Corporate
// ---------------------------------------------------------------------------

function buildCorporateSample(
  templateCode: string,
  locale: PublicInvitationLocale,
): CorporatePublicData {
  return {
    eventType: 'corporate',
    templateCode,
    eventTitle: 'Q4 Leadership Summit 2026',
    hostCompanyName: 'Acme Corp',
    eventDate: '2026-12-04',
    heroImageUrl: null,
    landingTitle: 'Q4 Leadership Summit',
    landingSubtitle: locale === 'es' ? 'Acme Corp · 2026' : 'Acme Corp · 2026',
    description: {
      body:
        locale === 'es'
          ? 'Una jornada para alinear liderazgo, revisar los resultados del año y delinear las prioridades del próximo trimestre. Cupos limitados.'
          : 'A full day to align leadership, review the year and outline priorities for the next quarter. Limited seating.',
    },
    speakers: [
      {
        name: locale === 'es' ? 'María González' : 'Maria Gonzalez',
        role: locale === 'es' ? 'CEO, Acme Corp' : 'CEO, Acme Corp',
        bio:
          locale === 'es'
            ? 'Lidera Acme desde 2019. Anteriormente COO en Globex.'
            : 'Leading Acme since 2019. Previously COO at Globex.',
        photoUrl: null,
      },
      {
        name: locale === 'es' ? 'David Park' : 'David Park',
        role: locale === 'es' ? 'CTO, Acme Corp' : 'CTO, Acme Corp',
        bio:
          locale === 'es'
            ? 'Responsable de la plataforma y del roadmap de IA.'
            : 'Owns the platform and the AI roadmap.',
        photoUrl: null,
      },
    ],
    dressCode: null,
    locations: [
      {
        label: locale === 'es' ? 'Sede principal' : 'HQ',
        name: locale === 'es' ? 'Acme Tower · Piso 32' : 'Acme Tower · Floor 32',
        address: '500 Market Street',
        city: locale === 'es' ? 'San Francisco' : 'San Francisco',
        mapsLink: 'https://maps.example.com/acme',
        time: '09:00',
      },
    ],
    program: {
      days: [
        {
          date: '2026-12-04',
          label: locale === 'es' ? 'Día 1' : 'Day 1',
          items: [
            {
              time: '09:00',
              title: locale === 'es' ? 'Keynote de apertura' : 'Opening keynote',
              detail:
                locale === 'es'
                  ? 'María González'
                  : 'Maria Gonzalez',
            },
            {
              time: '10:30',
              title:
                locale === 'es'
                  ? 'Breakout: Roadmap de producto'
                  : 'Breakout: Product roadmap',
              detail:
                locale === 'es'
                  ? 'Track A · sala Cedar'
                  : 'Track A · Cedar room',
            },
            {
              time: '13:00',
              title:
                locale === 'es'
                  ? 'Breakout: Plataforma y AI'
                  : 'Breakout: Platform & AI',
              detail:
                locale === 'es'
                  ? 'Track B · sala Aspen'
                  : 'Track B · Aspen room',
            },
            {
              time: '15:30',
              title:
                locale === 'es'
                  ? 'Breakout: GTM y pricing'
                  : 'Breakout: GTM & pricing',
              detail:
                locale === 'es'
                  ? 'Track C · sala Birch'
                  : 'Track C · Birch room',
            },
          ],
        },
      ],
    },
    rsvpEnabled: true,
    locale,
  };
}

// ---------------------------------------------------------------------------
// Anniversary
// ---------------------------------------------------------------------------

function buildAnniversarySample(
  templateCode: string,
  locale: PublicInvitationLocale,
): AnniversaryPublicData {
  return {
    eventType: 'anniversary',
    templateCode,
    honoreeName: 'Marta & Luis',
    yearsCelebrating: 25,
    eventDate: '2026-10-25',
    heroImageUrl: null,
    landingTitle: locale === 'es' ? '25 años juntos' : '25 years together',
    landingSubtitle:
      locale === 'es'
        ? 'Acompañanos a celebrar este aniversario'
        : 'Join us to celebrate this anniversary',
    story: {
      body:
        locale === 'es'
          ? 'Veinticinco años, dos hijos, miles de cenas y un millón de risas. Gracias por ser parte de nuestra historia.'
          : 'Twenty-five years, two kids, thousands of dinners and a million laughs. Thank you for being part of our story.',
    },
    dressCode: null,
    giftRegistry: {
      body:
        locale === 'es'
          ? 'Tu presencia es el único regalo.'
          : 'Your presence is the only gift.',
    },
    locations: [
      {
        label: locale === 'es' ? 'Celebración' : 'Celebration',
        name: locale === 'es' ? 'Viñedo del Sol' : 'Sun Vineyard',
        address: '12 Camino del Sol',
        city: locale === 'es' ? 'Valle del Sol' : 'Sun Valley',
        mapsLink: 'https://maps.example.com/anniversary',
        time: '19:00',
      },
    ],
    program: {
      days: [
        {
          date: '2026-10-25',
          items: [
            {
              time: '19:00',
              title: locale === 'es' ? 'Recepción' : 'Reception',
              detail:
                locale === 'es'
                  ? 'Cóctel en el viñedo'
                  : 'Vineyard cocktail',
            },
            {
              time: '20:30',
              title: locale === 'es' ? 'Cena' : 'Dinner',
              detail:
                locale === 'es'
                  ? 'Menú de 4 pasos'
                  : 'Four-course menu',
            },
            {
              time: '22:30',
              title: locale === 'es' ? 'Brindis' : 'Toast',
              detail:
                locale === 'es'
                  ? 'Palabras de la familia'
                  : 'Family speeches',
            },
          ],
        },
      ],
    },
    rsvpEnabled: true,
    locale,
  };
}