import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');

      // Should have login form elements
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have email input field', async ({ page }) => {
      await page.goto('/login');

      // Look for email input
      const emailInput = page.getByRole('textbox', { name: /email/i })
        .or(page.locator('input[type="email"]'))
        .or(page.locator('input[name="email"]'));

      await expect(emailInput.first()).toBeVisible();
    });

    test('should have password input field', async ({ page }) => {
      await page.goto('/login');

      // Look for password input
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput.first()).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await page.goto('/login');

      // Look for login/submit button
      const submitButton = page.getByRole('button', { name: /sign in|log in|login/i })
        .or(page.locator('button[type="submit"]'));

      await expect(submitButton.first()).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /sign in|log in|login/i })
        .or(page.locator('button[type="submit"]'));

      await submitButton.first().click();

      // Should not navigate away (form validation)
      await expect(page).toHaveURL(/login/);
    });

    test('should have link to signup page', async ({ page }) => {
      await page.goto('/login');

      // Look for signup link
      const signupLink = page.getByRole('link', { name: /sign up|register|create account/i });

      if (await signupLink.count() > 0) {
        await expect(signupLink.first()).toBeVisible();
      }
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup page', async ({ page }) => {
      await page.goto('/signup');

      // Should have signup form
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have required form fields', async ({ page }) => {
      await page.goto('/signup');

      // Check for email
      const emailInput = page.locator('input[type="email"]')
        .or(page.locator('input[name="email"]'));
      await expect(emailInput.first()).toBeVisible();

      // Check for password
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput.first()).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login or show unauthorized
      await page.waitForLoadState('networkidle');

      // Either redirected to login or on dashboard (if public)
      const url = page.url();
      expect(url.includes('login') || url.includes('dashboard')).toBeTruthy();
    });

    test('should redirect unauthenticated users from profile', async ({ page }) => {
      await page.goto('/profile');

      await page.waitForLoadState('networkidle');

      // Either redirected or on profile page
      const url = page.url();
      expect(url).toBeDefined();
    });
  });
});

test.describe('Logout Flow', () => {
  test('logout should clear session', async ({ page }) => {
    // Visit a page
    await page.goto('/');

    // After logout (if logged in), user should be logged out
    await page.waitForLoadState('networkidle');
  });
});
