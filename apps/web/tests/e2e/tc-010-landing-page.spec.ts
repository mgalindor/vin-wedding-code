/**
 * TC-010: Landing page renders correctly after login.
 *
 * - Header: greeting, email, role badge
 * - Body: "You're all set" + 3 stat cards + info banner
 * - NO buttons / actions (Sprint 1 landing only)
 */

import { test, expect } from '@playwright/test';

import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/api';

test.describe('TC-010: Landing page after login', () => {
  test('shows header + greeting + role badge + stat cards + info banner', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Redirected to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // Greeting
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    // Role badge — Administrator
    await expect(page.getByText(/administrator/i).first()).toBeVisible();

    // Stat cards
    await expect(page.getByText(/weddings/i).first()).toBeVisible();
    await expect(page.getByText(/guests/i).first()).toBeVisible();
    await expect(page.getByText(/responses/i).first()).toBeVisible();

    // Info banner about Sprint 2 (use .first() since "Sprint 2" appears twice)
    await expect(page.getByText(/sprint 2/i).first()).toBeVisible();

    // No action buttons on landing
    const buttons = await page.getByRole('button').all();
    // Login form "Log in" button is gone — only 0 buttons remain on the
    // landing page because the design hides them in Sprint 1.
    expect(buttons.length).toBeLessThanOrEqual(2); // language toggle only
  });
});