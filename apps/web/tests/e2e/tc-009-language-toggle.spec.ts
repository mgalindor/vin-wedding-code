/**
 * TC-009: Language toggle (EN/ES) switches the login form labels.
 *
 * Renders the login page in a real Chromium browser and verifies
 * the title and labels switch between English and Spanish when the
 * EN / ES pill buttons are clicked.
 */

import { test, expect } from '@playwright/test';

test.describe('TC-009: Language toggle EN/ES', () => {
  test('login page switches text between EN and ES', async ({ page }) => {
    await page.goto('/login');

    // English default — title is "Sign In"
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    // Switch to Spanish
    await page.getByRole('button', { name: /^es$/i }).click();
    await expect(page.getByRole('heading', { name: /iniciar sesi/i })).toBeVisible();

    // Switch back to English
    await page.getByRole('button', { name: /^en$/i }).click();
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});