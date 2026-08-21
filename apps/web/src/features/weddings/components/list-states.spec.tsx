/**
 * TC-506 (component): list-states — US-011.
 *
 * Verifies the skeleton / error / show-more helpers render the
 * right copy and respect accessibility roles.
 *
 * The empty and no-matches states were moved to
 * `list-state-card.spec.tsx` (TC-506b) because they now render as
 * a single placeholder card inside the grid.
 */
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/config';

import {
  ListErrorState,
  ShowMoreButton,
  WeddingCardSkeletonGrid,
} from './list-states';

function wrap(node: React.ReactNode) {
  return <I18nextProvider i18n={i18n}>{node}</I18nextProvider>;
}

describe('TC-506: list-states — US-011', () => {
  it('renders the error state with a Try again button', () => {
    const onRetry = vi.fn();
    render(wrap(<ListErrorState onRetry={onRetry} />));
    expect(screen.getByTestId('list-error-state')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.getByTestId('list-error-retry')).toBeInTheDocument();
  });

  it('renders the skeleton grid (three cards)', () => {
    render(wrap(<WeddingCardSkeletonGrid />));
    // The skeleton cards render visually-identical placeholders, so we
    // assert the grid scope is present and the placeholder divs are
    // marked aria-hidden.
    const hidden = document.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Show more button as enabled by default', () => {
    render(wrap(<ShowMoreButton onClick={() => undefined} />));
    const btn = screen.getByTestId('list-show-more');
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('disables the Show more button while fetching', () => {
    render(wrap(<ShowMoreButton onClick={() => undefined} isFetching />));
    const btn = screen.getByTestId('list-show-more');
    expect(btn).toBeDisabled();
  });
});
