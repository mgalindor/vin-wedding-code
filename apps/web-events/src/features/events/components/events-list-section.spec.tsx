import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventsListSection } from '@/features/events/components/events-list-section';
import type { EventSummary } from '@/shared/api';

const navigateMock = vi.fn();
const locationRef: { current: Record<string, unknown> } = { current: {} };

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
  useLocation: () => ({ search: locationRef.current }),
  useNavigate: () => navigateMock,
}));

const listEventsMock = vi.fn();

vi.mock('@/features/events/events.service', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return {
    ...mod,
    useEventsService: () => ({
      listEvents: listEventsMock,
    }),
  };
});

const enResources = {
  events: {
    title: 'My Events',
    subtitle: '',
    create: 'New event',
    search: { placeholder: 'Search by name…', clearAria: 'Clear search' },
    list: {
      count_one: '{{count}} event',
      count_other: '{{count}} events',
      sort: {
        label: 'Sort by',
        options: {
          closest: 'Closest event',
          farthest: 'Farthest event',
          recentCreated: 'Recently captured',
          oldestCreated: 'Oldest captured',
        },
      },
      typeFilter: { label: 'Type', add: 'Add type', allAdded: 'All types selected' },
      removeTypeAria: 'Remove {{type}} filter',
      reset: 'Reset filters',
      clearAll: 'Clear all',
      resultsMatch_one: '1 result for "{{query}}"',
      resultsMatch_other: '{{count}} of {{total}} events match "{{query}}"',
    },
    filters: {
      all: 'All',
      draft: 'Drafts',
      active: 'Active',
      archived: 'Archived',
    },
    empty: {
      title: 'No events yet',
      body: 'Start your first event.',
      action: 'Create event',
    },
    noMatches: {
      title: 'No matching events',
      body: 'Try a different filter.',
      action: 'Clear filters',
    },
    eventType: {
      wedding: 'Wedding',
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      corporate: 'Corporate',
      other: 'Other',
    },
    status: { draft: 'Draft', published: 'Published', archived: 'Archived' },
    card: {
      tba: 'TBD',
      draftMessage: '',
      progressLabel: 'RSVP',
      actions: {
        openEvent: 'Open event',
        continueSetup: 'Continue setup',
        guestList: 'Guest list',
        guestsWithCount: 'Guests ({{count}})',
        invitation: 'View invitation',
        downloadPhotos: 'Download photos',
      },
      stats: { guests: 'Guests', confirmed: 'Confirmed', pending: 'Pending', declined: 'Declined' },
    },
  },
};

const sampleEvent: EventSummary = {
  id: 'evt_1',
  organizerId: 'usr_1',
  eventType: 'wedding',
  title: 'Maya & Luis',
  eventDate: '2026-08-14',
  status: 'published',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

function makePage(items: EventSummary[], total = items.length) {
  return { items, total, page: 0, size: 30, totalPages: 1, hasMore: false };
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nextProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  listEventsMock.mockReset();
  listEventsMock.mockResolvedValue(makePage([sampleEvent]));
  navigateMock.mockReset();
  locationRef.current = {};
});

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: enResources },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['events'],
    defaultNS: 'events',
    interpolation: { escapeValue: false },
  });
});

describe('EventsListSection', () => {
  it('renders the header, sort trigger, status pills, and the type popover trigger', async () => {
    render(<EventsListSection />, { wrapper: makeWrapper() });

    expect(screen.getByTestId('events-list')).toBeInTheDocument();
    expect(screen.getByTestId('events-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('events-sort-trigger')).toHaveTextContent('Sort by');
    expect(screen.getByTestId('events-sort-trigger')).toHaveTextContent('Closest event');
    expect(screen.getByTestId('events-filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('events-type-trigger')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('events-list-count')).toHaveTextContent('1 event');
    });
    expect(screen.getByTestId('events-grid')).toBeInTheDocument();
  });

  it('does not render the reset button while no filters are active', async () => {
    render(<EventsListSection />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('events-list-count')).toHaveTextContent('1 event');
    });
    expect(screen.queryByTestId('events-reset')).not.toBeInTheDocument();
  });

  it('debounces the search input — does not refetch immediately, then refetches after 300ms', async () => {
    render(<EventsListSection />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('events-list-count')).toHaveTextContent('1 event');
    });
    const initialCalls = listEventsMock.mock.calls.length;

    const input = screen.getByTestId('events-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'maria' } });

    expect(listEventsMock.mock.calls.length).toBe(initialCalls);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(listEventsMock.mock.calls.length).toBe(initialCalls);

    await waitFor(
      () => {
        expect(listEventsMock.mock.calls.length).toBeGreaterThan(initialCalls);
      },
      { timeout: 1500 },
    );
    const lastCall = listEventsMock.mock.calls.at(-1)?.[0] as { search?: string };
    expect(lastCall.search).toBe('maria');
  });

  it('writes the search term to the URL after the debounce', async () => {
    render(<EventsListSection />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('events-list-count')).toHaveTextContent('1 event');
    });

    const input = screen.getByTestId('events-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'maria' } });

    await waitFor(
      () => {
        const calls = navigateMock.mock.calls.map(
          (c) => (c[0] as { search?: Record<string, string | undefined> }).search,
        );
        const last = calls.findLast((s) => s?.q === 'maria');
        expect(last).toBeDefined();
      },
      { timeout: 1500 },
    );
    const lastCall = navigateMock.mock.calls.at(-1)?.[0] as { replace?: boolean };
    expect(lastCall?.replace).toBe(true);
  });

  it('shows the reset button only after a filter becomes non-default and clears on click', async () => {
    render(<EventsListSection />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('events-list-count')).toHaveTextContent('1 event');
    });
    expect(screen.queryByTestId('events-reset')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('events-filter-draft'));
    await waitFor(() => {
      expect(screen.getByTestId('events-reset')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('events-reset'));
    await waitFor(() => {
      expect(screen.queryByTestId('events-reset')).not.toBeInTheDocument();
    });
  });

  it('opens and closes the sort menu, and writes the new sort to the URL', async () => {
    render(<EventsListSection />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('events-list-count')).toHaveTextContent('1 event');
    });

    expect(screen.queryByTestId('events-sort-menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('events-sort-trigger'));
    expect(screen.getByTestId('events-sort-menu')).toBeInTheDocument();
    expect(screen.getByTestId('events-sort-option-farthest')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('events-sort-option-farthest'));
    await waitFor(() => {
      expect(screen.queryByTestId('events-sort-menu')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('events-sort-trigger')).toHaveTextContent('Farthest event');

    const calls = navigateMock.mock.calls.map(
      (c) => (c[0] as { search?: Record<string, string | undefined> }).search,
    );
    expect(calls.some((s) => s?.sort === 'eventDate,desc')).toBe(true);
  });

  it('hydrates from the URL on first render — search and sort', async () => {
    locationRef.current = { q: 'anniversary', sort: 'createdAt,desc' };
    render(<EventsListSection />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('events-search-input')).toHaveValue('anniversary');
    });
    expect(screen.getByTestId('events-sort-trigger')).toHaveTextContent('Recently captured');
  });

  it('hydrates selected types from the URL and the X button removes them', async () => {
    locationRef.current = { type: 'wedding,birthday' };
    render(<EventsListSection />, { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('events-type-chip-wedding')).toBeInTheDocument();
    });
    expect(screen.getByTestId('events-type-chip-birthday')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('events-type-remove-wedding'));
    await waitFor(() => {
      expect(screen.queryByTestId('events-type-chip-wedding')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('events-type-chip-birthday')).toBeInTheDocument();
  });
});
