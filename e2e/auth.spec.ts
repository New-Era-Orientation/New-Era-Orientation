import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page).toHaveURL(/.*signin/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error messages
    await expect(page.getByText(/email|password/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
  });
});
