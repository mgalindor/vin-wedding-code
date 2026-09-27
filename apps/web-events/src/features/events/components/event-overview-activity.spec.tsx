import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { AuditEntry } from '@/features/audit/audit.service';

import {
  ActivityList,
  createRelativeTimeFormatter,
} from './event-overview-activity-list';

/**
 * Smoke + behavioural tests for the "recent activity" panel on the
 * event overview screen. The panel is a pure presentational list
 * driven by i18n strings passed in as props — we exercise each of the
 * four documented states (loading, error, empty, populated) without
 * mounting the full overview screen (which would require the whole
 * router / i18n / query-client wiring — see
 * `event-overview-screen.spec.tsx` for the rationale).
 */

const NOW = Date.parse('2026-09-26T12:00:00.000Z');
const sampleEntries: AuditEntry[] = [
  {
    id: 'a-1',
    occurredAt: new Date(NOW - 5 * 60 * 1000).toISOString(),
    actorUserId: 'usr_42',
    actorUserName: 'María R.',
    actorKind: 'organizer',
    action: 'event.locations_updated',
    resourceType: 'event',
    resourceId: 'evt_1',
    eventId: 'evt_1',
    payload: null,
  },
  {
    id: 'a-2',
    occurredAt: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actorUserId: null,
    actorUserName: null,
    actorKind: 'system',
    action: 'guest.rsvp_updated',
    resourceType: 'guest',
    resourceId: 'gst_9',
    eventId: 'evt_1',
    payload: null,
  },
];

const formatFor = (iso: string) => createRelativeTimeFormatter('en-US')(iso);

const NOOP = () => undefined;

const baseProps = {
  isPending: false,
  isError: false,
  language: 'en',
  emptyLabel: 'Nothing here',
  errorLabel: 'Could not load',
  actionLabel: (a: string) => `[${a}]`,
  resourceLabel: (r: string) => `<<${r}>>`,
  actorBylineTemplate: 'by {{actor}}',
  relativeTimeFormatter: formatFor,
  size: 10 as const,
  onSizeChange: NOOP,
  sizeLabel: (s: number) => `Size ${s}`,
  sizeOptionLabels: {
    5: '5 ev',
    10: '10 ev',
    15: '15 ev',
    30: '30 ev',
    50: '50 ev',
  },
  resourceFilter: null,
  onResourceFilterChange: NOOP,
  resourceFilterLabels: {
    _all: 'All',
    event: 'Event',
    wedding_event: 'Wedding',
    guest: 'Guest',
    guest_group: 'Group',
  },
  categoryFilter: null,
  onCategoryFilterChange: NOOP,
  categoryFilterLabels: {
    _all: 'All',
    lifecycle: 'Lifecycle',
    content: 'Content',
    rsvp: 'RSVPs',
    guest: 'Guests',
  },
  searchTerm: '',
  onSearchTermChange: NOOP,
  searchPlaceholder: 'search…',
  clearFiltersLabel: 'Clear filters',
};

describe('EventOverviewScreen — ActivityList (states)', () => {
  it('renders a spinner while the query is pending', () => {
    render(<ActivityList {...baseProps} entries={[]} isPending isError={false} />);
    expect(screen.getByTestId('event-overview-activity-loading')).toBeTruthy();
  });

  it('renders an alert when the query errored', () => {
    render(<ActivityList {...baseProps} entries={[]} isPending={false} isError />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Could not load');
    expect(alert.getAttribute('data-testid')).toBe('event-overview-activity-error');
  });

  it('renders an empty-state hint when there are no entries', () => {
    render(<ActivityList {...baseProps} entries={[]} isPending={false} isError={false} />);
    const empty = screen.getByTestId('event-overview-activity-empty');
    expect(empty.textContent).toContain('Nothing here');
  });

  it('renders a list of rows with action + resource + actor name (not ID)', () => {
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        isPending={false}
        isError={false}
      />,
    );
    const list = screen.getByTestId('event-overview-activity-list');
    const rows = within(list).getAllByTestId('event-overview-activity-row');
    expect(rows).toHaveLength(2);

    const [first, second] = rows;

    // First row: action + resource + hydrated actor name (not the ID)
    expect(first?.textContent).toContain('[event.locations_updated]');
    expect(first?.textContent).toContain('<<event>>');
    expect(first?.textContent).toContain('by María R.');
    expect(first?.textContent).not.toContain('usr_42');

    // Second row: no actor → no byline (system events show neither)
    expect(second?.textContent).toContain('[guest.rsvp_updated]');
    expect(second?.textContent).not.toContain('by ');
  });
});

describe('EventOverviewScreen — ActivityList (filters)', () => {
  it('changing the size dropdown calls onSizeChange', () => {
    const onSizeChange = vi.fn();
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        onSizeChange={onSizeChange}
      />,
    );
    fireEvent.change(screen.getByTestId('event-overview-activity-size'), {
      target: { value: '30' },
    });
    expect(onSizeChange).toHaveBeenCalledWith(30);
  });

  it('clicking a resource chip calls onResourceFilterChange', () => {
    const onResourceFilterChange = vi.fn();
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        onResourceFilterChange={onResourceFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('event-overview-resource-filter-event'));
    expect(onResourceFilterChange).toHaveBeenCalledWith('event');
  });

  it('clicking a category chip calls onCategoryFilterChange', () => {
    const onCategoryFilterChange = vi.fn();
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        onCategoryFilterChange={onCategoryFilterChange}
      />,
    );
    fireEvent.click(screen.getByTestId('event-overview-category-filter-rsvp'));
    expect(onCategoryFilterChange).toHaveBeenCalledWith('rsvp');
  });

  it('filters rows client-side by search term', () => {
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        searchTerm="rsvp"
      />,
    );
    const list = screen.getByTestId('event-overview-activity-list');
    const rows = within(list).getAllByTestId('event-overview-activity-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain('[guest.rsvp_updated]');
  });

  it('shows the "no matches" hint when filters hide everything', () => {
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        searchTerm="does-not-match-anything"
      />,
    );
    expect(screen.getByTestId('event-overview-activity-empty-filtered')).toBeTruthy();
  });

  it('shows the "clear filters" button when any filter is active', () => {
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        searchTerm="x"
      />,
    );
    expect(screen.getByTestId('event-overview-activity-clear-filters')).toBeTruthy();
  });

  it('clicking "clear filters" resets every filter', () => {
    const onResourceFilterChange = vi.fn();
    const onCategoryFilterChange = vi.fn();
    const onSearchTermChange = vi.fn();
    render(
      <ActivityList
        {...baseProps}
        entries={sampleEntries}
        resourceFilter="event"
        categoryFilter="lifecycle"
        searchTerm="x"
        onResourceFilterChange={onResourceFilterChange}
        onCategoryFilterChange={onCategoryFilterChange}
        onSearchTermChange={onSearchTermChange}
      />,
    );
    fireEvent.click(screen.getByTestId('event-overview-activity-clear-filters'));
    expect(onResourceFilterChange).toHaveBeenCalledWith(null);
    expect(onCategoryFilterChange).toHaveBeenCalledWith(null);
    expect(onSearchTermChange).toHaveBeenCalledWith('');
  });
});

describe('createRelativeTimeFormatter', () => {
  // Pin Date.now so we get deterministic output across CI / dev.
  const realNow = Date.now;
  beforeAll(() => {
    Date.now = () => NOW;
  });
  afterAll(() => {
    Date.now = realNow;
  });

  const fmt = createRelativeTimeFormatter('en-US');

  it('returns "now" for timestamps within a second', () => {
    expect(fmt(new Date(NOW - 200).toISOString())).toBe('now');
  });

  it('formats minutes', () => {
    expect(fmt(new Date(NOW - 5 * 60 * 1000).toISOString())).toBe('5 minutes ago');
  });

  it('formats hours', () => {
    expect(fmt(new Date(NOW - 3 * 60 * 60 * 1000).toISOString())).toBe('3 hours ago');
  });

  it('formats days up to 14', () => {
    expect(fmt(new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString())).toBe(
      '2 days ago',
    );
  });

  it('collapses anything older than 14 days to a short calendar date', () => {
    const out = fmt(new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString());
    // Locale-dependent, so just assert it is NOT a relative phrase and
    // contains a 4-digit year.
    expect(out).not.toMatch(/ago|hace/);
    expect(out).toMatch(/\d{4}/);
  });

  it('falls back to the raw ISO string for unparseable input', () => {
    expect(fmt('not-an-iso')).toBe('not-an-iso');
  });
});
