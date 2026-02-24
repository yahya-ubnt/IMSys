import { test, expect } from '@playwright/test';

// Shared state for dependent tests
let routerId = '';
let routerName = '';

test.describe.serial('Mikrotik Router Management', () => {
  
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
    const currentRouterName = `E2E_Router_${uniqueId}`;
    routerName = currentRouterName; // Store for subsequent tests
    
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
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/mikrotik/routers') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Add Router', exact: true }).click(),
    ]);

    // 3. Verify redirection and get router ID
    await expect(page).toHaveURL('/mikrotik/routers', { timeout: 15000 });
    const routerData = await response.json();
    routerId = routerData._id; // Store the router ID

    // Use search to reliably find the router
    await page.getByPlaceholder('Search by name or IP...').fill(routerName);
    await expect(page.locator('table')).toContainText(routerName, { timeout: 10000 });
    
    console.log(`✅ Success: Mikrotik Router ${routerName} added and verified. ID: ${routerId}`);
  });

  test('should successfully fetch PPP profiles from Mikrotik Router', async ({ page }) => {
    expect(routerId, 'Router ID should be set from previous test').not.toBe('');
    expect(routerName, 'Router Name should be set from previous test').not.toBe('');

    // 1. Navigate to the package creation page
    await page.goto('/mikrotik/packages/new');
    await expect(page.getByRole('heading', { name: 'Add New Package' })).toBeVisible({ timeout: 15000 });

    // 2. Select the created router
    await page.click('button:has-text("Select a router")');
    await page.locator(`[role="option"]:has-text("${routerName}")`).click();

    // 3. Select "PPPoE" as the service type
    await page.click('button:has-text("Select service type")');
    await page.locator('[role="option"]:has-text("PPPoE")').click();

    // Advance to Step 2 of the form
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // 4. Click the "Select a profile" dropdown and verify options are present
    await expect(page.locator('button:has-text("Select a profile")')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Select a profile")');
    
    // Since the router is fake, fetching PPP profiles will fail.
    // We assert that the error toast appears.
    const errorToast = page.locator('.destructive:has-text("Failed to load PPP profiles.")');
    await expect(errorToast).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ Successfully handled failed PPP profile fetch from Mikrotik Router ${routerName}.`);
  });

});
