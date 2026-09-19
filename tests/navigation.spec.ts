import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page).toHaveTitle(/IEH/i); // Assuming title contains IEH or Iraq Esports Hub

    // Navigate to Store
    await page.click('text=متجر eBits');
    await expect(page).toHaveURL(/\/store/);

    // Navigate to Teams
    await page.click('text=عرض الكل'); // 'عرض الكل' next to teams
    await expect(page).toHaveURL(/\/teams/);
    
    // Navigate to Leaderboards
    await page.goto('/');
    await page.click('text=لوحة الشرف وتصنيف الفرق');
    await expect(page).toHaveURL(/\/leaderboards/);
  });
});
