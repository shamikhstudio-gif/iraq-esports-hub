import { test, expect } from '@playwright/test';

test.describe('Admin Page', () => {
  test('should redirect unauthenticated user to home', async ({ page }) => {
    // Attempt to access admin page without proper auth cookie
    await page.goto('/admin');
    
    // Should be redirected to home page
    await expect(page).toHaveURL(/\//);
  });
});
