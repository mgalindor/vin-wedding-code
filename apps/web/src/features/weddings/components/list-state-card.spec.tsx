/**
 * TC-506 (component): list-state-card — US-011.
 *
 * Verifies the empty / no-matches state card renders INSIDE the
 * wedding-card grid as a single placeholder card (same rhythm
 * as a real WeddingCard) and always carries a "+ New Wedding"
 * action so the WP has an exit from the empty state.
 */
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import i18n from '@/i18n/config';

import { ListStateCard } from './list-state-card';

function wrap(node: React.ReactNode) {
  return <I18nextProvider i18n={i18n}>{node}</I18nextProvider>;
}

describe('TC-506: list-state-card — US-011', () => {
  it('renders the empty state inside a grid with a "+ New Wedding" action', () => {
    render(wrap(<ListStateCard kind="empty" />));
    expect(screen.getByTestId('list-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('list-state-grid')).toBeInTheDocument();
    expect(
      screen.getByTestId('list-state-create-link'),
    ).toHaveAttribute('href', '/dashboard/weddings/new');
  });

  it('renders the no-matches state with a "+ New Wedding" action too', () => {
    render(wrap(<ListStateCard kind="noMatches" />));
    expect(screen.getByTestId('list-no-matches-state')).toBeInTheDocument();
    // Per the new UX rule the no-matches state also offers the
    // "create a new wedding" exit so the WP never gets stuck.
    expect(
      screen.getByTestId('list-state-create-link'),
    ).toBeInTheDocument();
  });
});
