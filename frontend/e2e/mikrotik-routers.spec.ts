import { test, expect } from '@playwright/test';

test.describe('Mikrotik Router Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'Abuhureira12');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('should add a new Mikrotik Router successfully', async ({ page }) => {
    // 1. Navigate
    await page.goto('/mikrotik/routers');
    // Using role heading to be specific
    await expect(page.getByRole('heading', { name: 'Mikrotik Routers' })).toBeVisible({ timeout: 15000 });
    
    // 2. Click Add New Router
    await page.getByRole('link', { name: /add new router/i }).click();
    await expect(page).toHaveURL('/mikrotik/routers/new');

    // --- STEP 1: Identity ---
    console.log('Filling Step 1: Identity...');
    const uniqueId = Date.now().toString().slice(-4);
    const routerName = `E2E_Router_${uniqueId}`;
    
    await page.fill('#name', routerName);
    await page.fill('#ipAddress', `10.0.${uniqueId.slice(0,2)}.${uniqueId.slice(2,4)}`);
    
    // Next
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // --- STEP 2: Credentials ---
    console.log('Filling Step 2: Credentials...');
    await page.fill('#apiUsername', 'e2e_admin');
    await page.fill('#apiPassword', 'e2e_pass');
    await page.fill('#apiPort', '8728');
    
    // Submit
    console.log('Submitting router...');
    await page.getByRole('button', { name: 'Add Router', exact: true }).click();

    // 3. Verify
    await expect(page).toHaveURL('/mikrotik/routers', { timeout: 15000 });
    await expect(page.locator('table')).toContainText(routerName, { timeout: 10000 });
    
    console.log(`✅ Success: Mikrotik Router ${routerName} added and verified.`);
  });
});
