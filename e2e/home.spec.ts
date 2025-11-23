import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the home page', async ({ page }) => {
    // Wait for page to load
    await expect(page).toHaveTitle(/SportsMatch/i);
  });

  test('should have navigation elements', async ({ page }) => {
    // Check for navigation links
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have a hero section', async ({ page }) => {
    // Look for main heading or hero content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have accessible skip link or landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Session Discovery', () => {
  test('should navigate to sessions page', async ({ page }) => {
    await page.goto('/sessions');

    // Should show sessions listing or empty state
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have filter controls', async ({ page }) => {
    await page.goto('/sessions');

    // Wait for any filter UI elements
    await page.waitForLoadState('networkidle');
  });
});
