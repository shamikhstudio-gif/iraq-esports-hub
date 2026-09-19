import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should render login and register modes', async ({ page }) => {
    // Go to auth page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-auth.png', fullPage: true });
    
    // Verify we are in Login Mode
    await expect(page.locator('text=تسجيل الدخول').first()).toBeVisible();
    
    // Switch to Register Mode
    await page.click('text=إنشاء حساب جديد');
    await expect(page.locator('text=إنشاء حساب لاعب جديد').first()).toBeVisible();
    
    // Check fields in Register Step 1
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Switch back to Login Mode
    await page.click('text=لديك حساب بالفعل؟ تسجيل الدخول');
    await expect(page.locator('text=تسجيل الدخول إلى IEH').first()).toBeVisible();
  });
});
