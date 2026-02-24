import { test, expect } from '@playwright/test';

test.describe('Package Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'Abuhureira12');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('should create a new Static package successfully', async ({ page }) => {
    // 1. Navigate
    await page.goto('/mikrotik/packages');
    await expect(page.getByRole('heading', { name: 'Packages' })).toBeVisible({ timeout: 15000 });
    
    // 2. Click Add New Package
    await page.getByRole('link', { name: /add new package/i }).click();
    await expect(page).toHaveURL('/mikrotik/packages/new');

    // 3. Fill form
    const uniqueId = Date.now().toString().slice(-4);
    const packageName = `E2E_Static_Package_${uniqueId}`;

    // --- Step 1: Initial Setup ---
    // Select Router
    await page.click('button:has-text("Select a router")');
    await page.locator('[role="option"]').first().click();

    // Select Service Type
    await page.click('button:has-text("Select service type")');
    await page.locator('[role="option"]:has-text("Static IP")').click();
    
    // Go to Step 2
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // --- Step 2: Package Details ---
    await page.fill('#name', packageName);
    await page.fill('#price', '2500');
    await page.fill('#rateLimit', '10M/10M');

    // 4. Submit
    await page.getByRole('button', { name: 'Save Package' }).click();

    // 5. Verify
    await expect(page).toHaveURL('/mikrotik/packages', { timeout: 15000 });
    
    // Use search to find the new package
    await page.getByPlaceholder('Search by name or router...').fill(packageName);
    await expect(page.locator('table')).toContainText(packageName, { timeout: 10000 });
    
    console.log(`✅ Success: Package ${packageName} added and verified.`);
  });
});
