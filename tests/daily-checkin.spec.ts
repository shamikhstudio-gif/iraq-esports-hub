import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iwiufvpvvkkwmvaqohwz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aXVmdnB2dmtrd212YXFvaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODU3MjgsImV4cCI6MjEwMzE2MTcyOH0.3_7iTmEKWd9MRINZ7GihfWSY4iz3QTOeY7n4KRw4fV8';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aXVmdnB2dmtrd212YXFvaHd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU4NTcyOCwiZXhwIjoyMTAzMTYxNzI4fQ.nNTEDoAiYrumluZg_UamtcA1_VdZiJSNNfhnP9HL_T0';

test.describe('Daily Check-in & eBits Flow', () => {
  const testUserId = 'f7b22072-87b2-4d25-a05b-533ba2af8abd';
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  test.beforeEach(async () => {
    // Reset test user to 0 ebits and null checkin date for deterministic test run
    await supabase
      .from('profiles')
      .update({ ebits_balance: 0, last_checkin_date: null })
      .eq('id', testUserId);
  });

  test('should claim daily checkin and increase ebits balance in both UI and Database', async ({ page }) => {
    // Setup authenticated state via localStorage before loading page
    await page.addInitScript((uid) => {
      window.localStorage.setItem('babylon_user_id', uid);
    }, testUserId);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify DailyCheckinWidget is visible
    const widget = page.locator('text=رصيد eBits').first();
    await expect(widget).toBeVisible({ timeout: 10000 });

    // Capture initial screenshot
    await page.screenshot({ path: 'tests/checkin-before.png' });

    // Find claim button
    const claimButton = page.locator('button:has-text("مكافأة الدخول (+50 eBits)")');
    await expect(claimButton).toBeVisible();
    await expect(claimButton).toBeEnabled();

    // Click claim
    await claimButton.click();

    // Verify feedback message appears
    await expect(page.locator('text=+50 eBits تمت إضافتها بنجاح!')).toBeVisible({ timeout: 10000 });

    // Verify button state changes to claimed
    await expect(page.locator('text=تمت المطالبة اليوم')).toBeVisible({ timeout: 5000 });

    // Verify UI shows updated balance (50 eBits)
    await expect(page.locator('text=50 eBits').first()).toBeVisible({ timeout: 5000 });

    // Capture screenshot after claiming
    await page.screenshot({ path: 'tests/checkin-after.png' });

    // Verify Database reflects exactly 50 eBits and non-null checkin date
    const { data: profile } = await supabase
      .from('profiles')
      .select('ebits_balance, last_checkin_date')
      .eq('id', testUserId)
      .single();

    expect(profile?.ebits_balance).toBe(50);
    expect(profile?.last_checkin_date).not.toBeNull();
  });
});
