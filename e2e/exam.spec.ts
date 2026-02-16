import { test, expect } from '@playwright/test';

test.describe('Exam Flow', () => {
  test('should display exam list', async ({ page }) => {
    await page.goto('/exam');
    await expect(page).toHaveURL(/.*exam/);
    await expect(page.getByRole('heading', { name: /exam|đề thi/i })).toBeVisible();
  });

  test('should start an exam', async ({ page }) => {
    await page.goto('/exam');
    
    // Click first exam
    const firstExam = page.getByRole('link', { name: /start|bắt đầu/i }).first();
    if (await firstExam.isVisible()) {
      await firstExam.click();
      await expect(page).toHaveURL(/.*exam.*\/start/);
    }
  });

  test('should show exam questions', async ({ page }) => {
    // Navigate to an exam if exists
    await page.goto('/exam/mock-exam-1');
    
    // Should show question content
    const questionText = page.locator('[data-testid="question"], .question, [class*="question"]').first();
    await expect(questionText).toBeVisible();
  });
});
