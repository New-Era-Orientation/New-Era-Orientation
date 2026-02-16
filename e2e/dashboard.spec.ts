import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to signin
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should show dashboard elements', async ({ page }) => {
    // This test assumes user is logged in
    // In real scenario, use storageState or login programmatically
    await page.goto('/');
    
    // Check for common elements
    await expect(page.getByRole('banner')).toBeVisible();
  });
});
