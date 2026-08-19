// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import type { UserId, WeddingPlannerSummaryDto } from '@wendy/contracts';
import { UserRole } from '@wendy/contracts';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import i18n from '@/i18n/config';

import { WeddingPlannersList } from './wedding-planners-list';

function makeRow(overrides: Partial<WeddingPlannerSummaryDto>): WeddingPlannerSummaryDto {
  return {
    id: 'wp-1' as UserId,
    fullName: 'Ada Lovelace',
    email: 'ada@wendy',
    role: UserRole.WeddingPlanner,
    isDisabled: false,
    createdAt: '2026-08-17T10:00:00.000Z',
    ...overrides,
  };
}

function renderList(rows: WeddingPlannerSummaryDto[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <WeddingPlannersList rows={rows} onOnboardClick={() => undefined} />
    </I18nextProvider>,
  );
}

describe('TC-305: WeddingPlannersList — table structure + full-width layout (US-008)', () => {
  const twoRows = [
    makeRow({}),
    makeRow({
      id: 'wp-2' as UserId,
      fullName: 'Grace Hopper',
      email: 'grace@wendy',
      isDisabled: true,
      createdAt: '2026-08-10T09:00:00.000Z',
    }),
  ];

  it('renders a real <table> with <thead> + <tbody> (not the legacy <ul>)', () => {
    renderList(twoRows);
    const list = screen.getByTestId('wedding-planners-list');
    expect(list.querySelector('ul')).toBeNull();
    const table = within(list).getByRole('table');
    expect(table.querySelector('thead')).not.toBeNull();
    expect(table.querySelector('tbody')).not.toBeNull();
    // The header row carries the column labels.
    const headerCells = table.querySelectorAll('thead th');
    expect(headerCells.length).toBeGreaterThanOrEqual(3);
  });

  it('renders one row per Wedding Planner inside <tbody>', () => {
    renderList(twoRows);
    const rows = screen.getAllByTestId('wedding-planner-row');
    expect(rows).toHaveLength(2);
    rows.forEach((row) => {
      expect(row.tagName.toLowerCase()).toBe('tr');
    });
  });

  it('spans the dashboard content area (w-full, no max-w)', () => {
    renderList(twoRows);
    const list = screen.getByTestId('wedding-planners-list');
    expect(list.className).toMatch(/\bw-full\b/);
    expect(list.className).not.toMatch(/\bmax-w-/);
  });

  it('renders the page-header with title + subtitle above the table', () => {
    renderList(twoRows);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Wedding Planners/i,
    );
    expect(screen.getByText(/Manage planner accounts/i)).toBeInTheDocument();
  });

  it('keeps the four supervision fields accessible to the existing test-ids', () => {
    renderList(twoRows);
    expect(screen.getAllByTestId('wedding-planner-row-name').length).toBe(2);
    expect(screen.getAllByTestId('wedding-planner-row-email').length).toBe(2);
    expect(screen.getAllByTestId('wedding-planner-row-status').length).toBe(2);
    expect(
      screen.getAllByTestId('wedding-planner-row-onboarded-at').length,
    ).toBe(2);
  });

  it('marks disabled rows with data-wp-disabled="true"', () => {
    renderList(twoRows);
    const rows = screen.getAllByTestId('wedding-planner-row');
    const disabledRow = rows.find((row) =>
      row.getAttribute('data-wp-id') === 'wp-2',
    );
    expect(disabledRow!.getAttribute('data-wp-disabled')).toBe('true');
  });
});