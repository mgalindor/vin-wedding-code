import { render, screen, within, cleanup } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { describe, expect, it, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    'aria-label': ariaLabel,
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    'aria-label'?: string;
  }) => {
    let href = to;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        href = href.replace(`$${k}`, encodeURIComponent(v));
      }
    }
    return (
      <a href={href} aria-label={ariaLabel}>
        {children}
      </a>
    );
  },
}));

import { EventCard } from '@/features/events/components/event-card';

const enResources = {
  events: {
    title: 'My Events',
    subtitle: '',
    create: 'New event',
    search: { placeholder: 'Search by name…' },
    list: {
      count_one: '{{count}} event',
      count_other: '{{count}} events',
      sort: { closest: 'Closest event', recent: 'Recently captured' },
    },
    filters: {
      all: 'All',
      draft: 'Drafts',
      active: 'Active',
      archived: 'Archived',
      sortDate: 'Closest event',
      sortAdded: 'Recently added',
    },
    status: {
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived',
      active: 'Active',
      closed: 'Closed',
    },
    eventType: {
      wedding: 'Wedding',
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      corporate: 'Corporate',
      other: 'Other',
    },
    card: {
      open: 'Open',
      guests_one: '{{count}} guest',
      guests_other: '{{count}} guests',
      draft: 'Draft',
      copyLink: 'Copy invitation link',
      unpublished: 'Invitation not yet active',
      stats: {
        guests: 'Guests',
        confirmed: 'Confirmed',
        pending: 'Pending',
        declined: 'Declined',
      },
      progressLabel: 'RSVP progress',
      countdown: {
        today: 'Today',
        upcoming_one: 'In {{count}} day',
        upcoming_other: 'In {{count}} days',
        past_one: '{{count}} day ago',
        past_other: '{{count}} days ago',
      },
      template: 'Template: {{name}}',
      updated: 'Updated {{relative}}',
      draftMessageNoTemplate: 'No invitation template chosen yet.',
      actions: {
        openEvent: 'Open event',
        continueSetup: 'Continue setup',
        guestList: 'Guest list',
        guestsWithCount_one: 'Guests ({{count}})',
        guestsWithCount_other: 'Guests ({{count}})',
        invitation: 'View invitation',
        downloadPhotos: 'Download photos',
      },
    },
  },
};

const esResources = {
  events: {
    title: 'Mis eventos',
    subtitle: '',
    create: 'Nuevo evento',
    search: { placeholder: 'Buscar por nombre…' },
    list: {
      count_one: '{{count}} evento',
      count_other: '{{count}} eventos',
      sort: { closest: 'Evento más cercano', recent: 'Capturados recientemente' },
    },
    filters: {
      all: 'Todos',
      draft: 'Borradores',
      active: 'Activos',
      archived: 'Archivados',
      sortDate: 'Evento más cercano',
      sortAdded: 'Agregados recientemente',
    },
    status: {
      draft: 'Borrador',
      published: 'Publicado',
      archived: 'Archivado',
      active: 'Activo',
      closed: 'Cerrado',
    },
    eventType: {
      wedding: 'Boda',
      birthday: 'Cumpleaños',
      anniversary: 'Aniversario',
      corporate: 'Corporativo',
      other: 'Otro',
    },
    card: {
      open: 'Abrir',
      guests_one: '{{count}} invitado',
      guests_other: '{{count}} invitados',
      draft: 'Borrador',
      copyLink: 'Copiar enlace de invitación',
      unpublished: 'Invitación aún no activa',
      stats: {
        guests: 'Invitados',
        confirmed: 'Confirmados',
        pending: 'Pendientes',
        declined: 'Rechazados',
      },
      progressLabel: 'Progreso RSVP',
      countdown: {
        today: 'Hoy',
        upcoming_one: 'En {{count}} día',
        upcoming_other: 'En {{count}} días',
        past_one: 'Hace {{count}} día',
        past_other: 'Hace {{count}} días',
      },
      template: 'Plantilla: {{name}}',
      updated: 'Actualizado {{relative}}',
      draftMessageNoTemplate: 'Aún no eliges una plantilla de invitación.',
      actions: {
        openEvent: 'Abrir evento',
        continueSetup: 'Continuar configuración',
        guestList: 'Lista de invitados',
        guestsWithCount_one: 'Invitados ({{count}})',
        guestsWithCount_other: 'Invitados ({{count}})',
        invitation: 'Ver invitación',
        downloadPhotos: 'Descargar fotos',
      },
    },
  },
};

function renderWithI18n(node: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);
}

beforeEach(() => {
  cleanup();
});

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 1)); // pin "today" so eventDate-derived badges are deterministic
  await i18n.use(initReactI18next).init({
    resources: { en: enResources, es: esResources },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['events'],
    defaultNS: 'events',
    interpolation: { escapeValue: false },
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe('EventCard', () => {
  const baseProps = {
    id: 'evt_1',
    title: 'Maya & Luis',
    eventType: 'wedding' as const,
    eventDate: '2026-08-14',
    status: 'published' as const,
  };

  it('renders the title, event type label, status badge and data-testid', () => {
    renderWithI18n(<EventCard {...baseProps} />);

    const card = screen.getByTestId('event-card-evt_1');
    expect(card).toBeInTheDocument();
    expect(within(card).getByRole('heading', { name: 'Maya & Luis' })).toBeInTheDocument();
    expect(within(card).getByText('Wedding')).toBeInTheDocument();
    expect(within(card).getByText('Active')).toBeInTheDocument();
  });

  it('shows the Closed badge when the event date has already passed', () => {
    renderWithI18n(<EventCard {...baseProps} eventDate="2026-07-01" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('shows the Archived badge regardless of the event date', () => {
    renderWithI18n(<EventCard {...baseProps} status="archived" eventDate="2026-07-01" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('uses the eventType default gradient when no templateCode is selected', () => {
    renderWithI18n(<EventCard {...baseProps} />);
    const header = screen.getByTestId('event-card-header');
    expect(header.style.background).toContain('#f7e3d8'); // wedding default
  });

  it('uses the template-specific gradient when templateCode matches the registry', () => {
    renderWithI18n(<EventCard {...baseProps} templateCode="wedding-noir" />);
    const header = screen.getByTestId('event-card-header');
    expect(header.style.background).toContain('#0A0A0A');
  });

  it('falls back to the eventType default gradient for an unknown templateCode', () => {
    renderWithI18n(<EventCard {...baseProps} templateCode="not-a-real-template" />);
    const header = screen.getByTestId('event-card-header');
    expect(header.style.background).toContain('#f7e3d8');
  });

  it('hides the stats block when stats prop is not provided', () => {
    renderWithI18n(<EventCard {...baseProps} />);
    expect(screen.queryByText('Guests')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirmed')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });

  it('renders the stats block with formatted values when stats is provided', () => {
    renderWithI18n(
      <EventCard
        {...baseProps}
        stats={{ total: 142, confirmed: 98, pending: 32, declined: 12 }}
      />,
    );

    const card = screen.getByTestId('event-card-evt_1');
    expect(within(card).getByText('Guests')).toBeInTheDocument();
    expect(within(card).getByText('142')).toBeInTheDocument();
    expect(within(card).getByText('Confirmed')).toBeInTheDocument();
    expect(within(card).getByText('98')).toBeInTheDocument();
  });

  it('uses Pending for published events and Declined for archived events in the stats block', () => {
    const { rerender } = renderWithI18n(
      <EventCard
        {...baseProps}
        stats={{ total: 50, confirmed: 30, pending: 20, declined: 5 }}
      />,
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByText('Declined')).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <EventCard
          {...baseProps}
          status="archived"
          stats={{ total: 50, confirmed: 30, pending: 20, declined: 5 }}
        />
      </I18nextProvider>,
    );
    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });

  it('hides the RSVP progress bar when rsvpProgress is not provided', () => {
    renderWithI18n(<EventCard {...baseProps} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows the RSVP progress bar with clamped percentage when rsvpProgress is provided', () => {
    renderWithI18n(<EventCard {...baseProps} rsvpProgress={72} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '72');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('clamps rsvpProgress above 100 to 100', () => {
    renderWithI18n(<EventCard {...baseProps} rsvpProgress={250} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows the draft message block only when status is draft', () => {
    const noTemplateMessage = 'No invitation template chosen yet.';

    const { rerender } = renderWithI18n(<EventCard {...baseProps} status="published" />);
    expect(screen.queryByText(noTemplateMessage)).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <EventCard {...baseProps} status="draft" />
      </I18nextProvider>,
    );
    expect(screen.getByText(noTemplateMessage)).toBeInTheDocument();
  });

  it('shows a template-aware draft message once a template is selected', () => {
    renderWithI18n(<EventCard {...baseProps} status="draft" templateCode="wedding-noir" />);
    expect(
      screen.queryByText('No invitation template chosen yet.'),
    ).not.toBeInTheDocument();
  });

  it('shows the template chip when templateCode is provided', () => {
    renderWithI18n(<EventCard {...baseProps} templateCode="wedding-noir" />);
    expect(screen.getByText('Template: Noir')).toBeInTheDocument();
  });

  it('shows the relative "updated" hint when updatedAt is provided', () => {
    renderWithI18n(<EventCard {...baseProps} updatedAt="2026-07-30T00:00:00Z" />);
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('renders the Open event + Guests (count) actions for published events', () => {
    renderWithI18n(
      <EventCard {...baseProps} stats={{ total: 80, confirmed: 50, pending: 30 }} />,
    );
    expect(screen.getByRole('link', { name: 'Open event' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Guests \(80\)/ })).toBeInTheDocument();
  });

  it('renders the Open event + View invitation actions for published events without stats', () => {
    renderWithI18n(<EventCard {...baseProps} />);
    expect(screen.getByRole('link', { name: 'Open event' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View invitation' })).toBeInTheDocument();
  });

  it('renders the Continue setup + Guest list actions for draft events', () => {
    renderWithI18n(<EventCard {...baseProps} status="draft" />);
    expect(screen.getByRole('link', { name: 'Continue setup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Guest list' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open event' })).not.toBeInTheDocument();
  });

  it('renders the Guest list + Download photos actions for archived events when photos are provided', () => {
    renderWithI18n(
      <EventCard
        {...baseProps}
        status="archived"
        photos={{ current: 12, cap: 50 }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Guest list' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download photos' })).toBeInTheDocument();
  });

  it('hides the Download photos action for archived events when photos prop is missing', () => {
    renderWithI18n(<EventCard {...baseProps} status="archived" />);
    expect(screen.getByRole('link', { name: 'Guest list' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Download photos' })).not.toBeInTheDocument();
  });
});
