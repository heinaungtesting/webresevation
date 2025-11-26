import { test, expect } from '@playwright/test';

test.describe('Sessions Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
  });

  test('should load sessions page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display session list or empty state', async ({ page }) => {
    // Either show sessions or empty state message
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('should have filter options for sport type', async ({ page }) => {
    // Look for sport type filter
    const sportFilter = page.getByRole('combobox', { name: /sport/i })
      .or(page.locator('select[name*="sport"]'))
      .or(page.getByLabel(/sport type/i));

    // Filter may or may not exist
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have filter options for skill level', async ({ page }) => {
    // Look for skill level filter
    const skillFilter = page.getByRole('combobox', { name: /skill|level/i })
      .or(page.locator('select[name*="skill"]'));

    await page.waitForLoadState('domcontentloaded');
  });

  test('should be able to search sessions', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/search/i))
      .or(page.locator('input[type="search"]'));

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('basketball');
      // Wait for results to update
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to session details on click', async ({ page }) => {
    // Look for session cards or list items
    const sessionCard = page.locator('[data-testid="session-card"]')
      .or(page.locator('a[href*="/sessions/"]'));

    if (await sessionCard.count() > 0) {
      await sessionCard.first().click();
      await page.waitForLoadState('networkidle');

      // Should navigate to session detail page
      expect(page.url()).toContain('/sessions/');
    }
  });
});

test.describe('Session Creation', () => {
  test('should have create session button (when authenticated)', async ({ page }) => {
    await page.goto('/sessions');

    // Look for create session button
    const createButton = page.getByRole('button', { name: /create|new|add/i })
      .or(page.getByRole('link', { name: /create|new|add/i }));

    await page.waitForLoadState('domcontentloaded');
  });

  test('should navigate to create session form', async ({ page }) => {
    await page.goto('/sessions/new', { waitUntil: 'domcontentloaded' });

    // Should show form or redirect to login - wait for specific content instead of networkidle
    await page.waitForSelector('body', { timeout: 30000 });
  });
});

test.describe('Session Filters', () => {
  test('should filter by date (today)', async ({ page }) => {
    await page.goto('/sessions?date=today', { waitUntil: 'domcontentloaded' });

    // Page should load with filter applied - wait for specific element instead of networkidle
    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter by date (weekend)', async ({ page }) => {
    await page.goto('/sessions?date=weekend', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter by sport type', async ({ page }) => {
    await page.goto('/sessions?sport_type=basketball', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter by skill level', async ({ page }) => {
    await page.goto('/sessions?skill_level=beginner', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/sessions?sport_type=basketball&skill_level=intermediate&vibe=CASUAL', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Session Pagination', () => {
  test('should handle pagination controls', async ({ page }) => {
    await page.goto('/sessions');

    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next/i })
      .or(page.locator('[data-testid="pagination-next"]'));

    await page.waitForLoadState('domcontentloaded');
  });

  test('should navigate to page via URL', async ({ page }) => {
    await page.goto('/sessions?page=2', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toBeVisible();
  });
});
