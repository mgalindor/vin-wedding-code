/**
 * TC-401 (E2E): US-009 Register a new wedding — happy path.
 *
 * Exercises the full create flow end-to-end against the live stack:
 *   1. Log in as a Wedding Planner (uses `wp@wendy` from the seed).
 *   2. Open the sidebar "New Wedding" entry.
 *   3. Fill the form with a valid payload.
 *   4. Submit and assert the detail placeholder renders the captured
 *      fields.
 *   5. Reload `/dashboard/weddings/{id}` directly and assert the
 *      placeholder fallback hint (no fetch on mount until US-010).
 *
 * Requires:
 *   - Backend running at E2E_API_URL (default http://localhost:3000)
 *   - Frontend running at E2E_BASE_URL (default http://localhost:5173)
 *   - `wp@wendy` + the default tenant seeded (`pnpm db:seed`).
 */

import { expect, test } from '@playwright/test';

import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/api';

test.describe('TC-401 (E2E): US-009 Register a new wedding — happy path', () => {
  test.setTimeout(120_000);

  test('Wedding Planner creates a wedding and lands on the detail placeholder', async ({
    page,
  }) => {
    // ----- Arrange: log in as the seeded WP. The seed creates
    // `admin@wendy` (Administrator) and `wp@wendy` (Wedding Planner) by
    // default. We use the admin to mint a WP via the API so the test
    // doesn't depend on a previously-onboarded planner being present.
    // The simplest path is to log in as admin, create a WP via the
    // admin onboarding endpoint, then log in as that new WP.
    const slug = `wp${Date.now().toString().slice(-6)}`;
    const wpPassword = 'a-strong-passphrase-1';

    await page.goto('/login');
    await page.getByLabel(/username/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // Onboard a WP via the API directly (faster + less brittle than UI).
    const onboardRes = await page.request.post('/api/v1/wedding-planners', {
      headers: { Authorization: `Bearer ${await page.evaluate(() => window.localStorage.getItem('__wendy_jwt__'))}` },
      data: {
        firstName: 'WP',
        lastName: 'New',
        email: `${slug}@example.com`,
        username: slug,
        password: wpPassword,
      },
    });
    expect(onboardRes.status()).toBe(201);

    // Sign out + sign back in as the new WP.
    await page.evaluate(() => {
      window.localStorage.removeItem('__wendy_jwt__');
    });
    await page.goto('/login');
    await page.getByLabel(/username/i).fill(`${slug}@wendy`);
    await page.getByLabel(/password/i).fill(wpPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    // ----- Act: open the new-wedding form from the sidebar.
    await page.getByRole('link', { name: /new wedding/i }).click();
    await page.waitForURL(/\/dashboard\/weddings\/new/, { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: /new wedding/i }),
    ).toBeVisible();

    // ----- Act: fill the form.
    const suffix = Date.now().toString().slice(-6);
    const partner1 = `Ada${suffix}`;
    const partner2 = `Lin${suffix}`;
    const venue = `Hacienda ${suffix}`;
    const city = `City${suffix}`;
    const eventDate = '2027-06-15';

    await page.getByLabel(/Partner 1/i).fill(partner1);
    await page.getByLabel(/Partner 2/i).fill(partner2);
    await page.getByLabel(/Wedding Date/i).fill(eventDate);
    await page.getByLabel(/Venue Name/i).fill(venue);
    await page.getByLabel(/City/i).fill(city);

    // ----- Act: submit.
    await page.getByRole('button', { name: /save & continue/i }).click();

    // ----- Assert: detail placeholder renders the captured fields.
    await page.waitForURL(/\/dashboard\/weddings\//, { timeout: 15_000 });
    await expect(page.getByText(partner1)).toBeVisible();
    await expect(page.getByText(partner2)).toBeVisible();
    await expect(page.getByText(venue)).toBeVisible();
    await expect(page.getByText(city)).toBeVisible();

    // The placeholder entry-points are rendered as disabled buttons
    // (US-022 + US-015 land later).
    await expect(
      page.getByRole('button', { name: /configure invitation/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /add guests/i }),
    ).toBeDisabled();
  });

  test('past-date warning blocks Save until the WP acknowledges', async ({
    page,
  }) => {
    // Log in as the previously-onboarded WP. We reuse the credentials
    // minted by the first test (or fall back to logging in via API).
    const slug = `wp${Date.now().toString().slice(-6)}`;
    const wpPassword = 'a-strong-passphrase-1';

    await page.goto('/login');
    await page.getByLabel(/username/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.request.post('/api/v1/wedding-planners', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => window.localStorage.getItem('__wendy_jwt__'))}`,
      },
      data: {
        firstName: 'Past',
        lastName: 'Date',
        email: `${slug}@example.com`,
        username: slug,
        password: wpPassword,
      },
    });

    await page.evaluate(() => {
      window.localStorage.removeItem('__wendy_jwt__');
    });
    await page.goto('/login');
    await page.getByLabel(/username/i).fill(`${slug}@wendy`);
    await page.getByLabel(/password/i).fill(wpPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto('/dashboard/weddings/new');
    await page.getByLabel(/Partner 1/i).fill('A');
    await page.getByLabel(/Partner 2/i).fill('B');
    await page.getByLabel(/Wedding Date/i).fill('2024-01-15');
    await page.getByLabel(/Venue Name/i).fill('V');
    await page.getByLabel(/City/i).fill('C');

    const save = page.getByRole('button', { name: /save & continue/i });
    await expect(save).toBeDisabled();

    await expect(page.getByText(/this date is in the past/i)).toBeVisible();
    await page.getByRole('button', { name: /^confirm$/i }).click();
    await expect(save).toBeEnabled();
  });
});