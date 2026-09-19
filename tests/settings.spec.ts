import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('should render and switch tabs', async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('babylon_user_id', 'test-user-id');
    });
    
    // Go to settings page
    await page.goto('/settings');
    
    // Check if the Profile tab is active and visible
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button', { hasText: 'الملف الشخصي' }).first()).toBeVisible();
    
    // Switch to Gaming Tab
    await page.click('text=الهوية التنافسية والألعاب');
    await expect(page.locator('text=اللعبة الأساسية').first()).toBeVisible();

    // Switch to Security Tab
    await page.click('text=الأمان وكلمة المرور');
    await expect(page.locator('text=تغيير كلمة المرور').first()).toBeVisible();

    // Switch to Notifications Tab
    await page.click('text=مركز التنبيهات');
    await expect(page.locator('text=تنبيهات السكريمات والتحديات الفورية').first()).toBeVisible();

    // Switch to Privacy Tab
    await page.click('text=الخصوصية والتواصل');
    await expect(page.locator('text=مستوى ظهور الملف الشخصي').first()).toBeVisible();
  });
});
