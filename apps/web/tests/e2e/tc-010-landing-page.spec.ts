/**
 * TC-010: Dashboard landing page renders correctly after login (Sprint 1 redesign).
 *
 * Visual contract (mockup 02-dashboard.html):
 *  - Sidebar: brand "Wendy", section "Workspace" with "Weddings" item,
 *             section "Administration" (admin only) with "Wedding Planners".
 *  - Topbar: greeting line, today's date, "+ New Wedding" action button.
 *  - Stats row: 4 stat cards (Active Weddings, Total Guests, Confirmed RSVPs,
 *               Days to Next).
 *  - Body: empty state for "No weddings yet" (Sprint 1 has no data).
 *  - Admin extras: "Wedding Planners" landing card with primary CTA.
 *
 * Sprint 1 still surfaces the locale switcher and the New Wedding button;
 * both are inert placeholders that become real flows in Sprint 2.
 */

import { test, expect } from '@playwright/test';

import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/api';

test.describe('TC-010: Dashboard landing page after login', () => {
  test('renders sidebar + topbar + stats + empty state', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // Sidebar brand
    await expect(page.getByRole('heading', { name: /^Wendy$/ })).toBeVisible();
    await expect(page.getByText(/wedding planner/i).first()).toBeVisible();

    // Sidebar nav sections
    await expect(page.getByText(/^workspace$/i)).toBeVisible();
    await expect(page.getByText(/^administration$/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /^weddings$/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /wedding planners/i }),
    ).toBeVisible();

    // Topbar greeting ("Welcome back, <name>")
    await expect(
      page.getByRole('heading', { name: /welcome back/i }),
    ).toBeVisible();

    // Topbar action — + New Wedding
    await expect(
      page.getByRole('button', { name: /\+ new wedding/i }),
    ).toBeVisible();

    // Locale switcher (compact EN | ES toggle)
    await expect(
      page.getByRole('button', { name: /^english$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^spanish$/i }),
    ).toBeVisible();

    // Stats row: 4 cards (regex tolerant of i18n substitution)
    await expect(page.getByText(/active weddings/i)).toBeVisible();
    await expect(page.getByText(/total guests/i)).toBeVisible();
    await expect(page.getByText(/confirmed rsvps/i)).toBeVisible();
    await expect(page.getByText(/days to next/i)).toBeVisible();

    // Empty state
    await expect(
      page.getByRole('heading', { name: /no weddings yet/i }),
    ).toBeVisible();

    // Admin landing card with the primary CTA
    await expect(
      page.getByRole('button', { name: /add wedding planner/i }),
    ).toBeVisible();

    // Sidebar user-chip + icon-only logout button
    await expect(page.getByRole('button', { name: /^log out$/i })).toBeVisible();
  });
});
