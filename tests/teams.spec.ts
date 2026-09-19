import { test, expect } from '@playwright/test';

test.describe('Teams Page', () => {
  test('should render the teams page and tabs', async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('babylon_user_id', 'test-user-id');
    });
    
    // Go to teams page
    await page.goto('/teams');
    
    // Check main title
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1', { hasText: 'الفرق والمنظمات العراقية' }).first()).toBeVisible();
    
    // Check Tabs
    await expect(page.locator('text=تسجيل وتأسيس فريق جديد').first()).toBeVisible();
    await expect(page.locator('[placeholder="ابحث باسم الفريق أو التاغ (مثال: ذئاب بغداد، BWL)..."]').first()).toBeVisible();
  });
});
