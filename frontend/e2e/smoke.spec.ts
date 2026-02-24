import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Smoke Flow - Authentication', () => {
  test('should load the login page and show the form', async ({ page }) => {
    // Navigate
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 1. Wait for the Loading Spinner to DISAPPEAR
    // This handles the ProtectedLayout loading state
    console.log('Waiting for loading spinner to disappear...');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 30000 });
    
    // 2. Now the form should be visible
    console.log('Checking for login form...');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    // 3. Verify specific content
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    console.log('✅ Smoke Test Passed: Login page is functional.');
  });
});
