import { test, expect } from '@playwright/test';

test.describe('Mikrotik User Management', () => {
  
  test('should create a new Mikrotik User successfully', async ({ page }) => {
    // 1. LOGIN
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible({ timeout: 20000 });
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'Abuhureira12');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 2. NAVIGATE TO USERS
    await page.goto('/mikrotik/users');
    await expect(page.getByText(/Mikrotik Users/i)).toBeVisible({ timeout: 15000 });
    
    // 3. START CREATION
    await page.getByRole('link', { name: /add new user/i }).click();
    await expect(page).toHaveURL('/mikrotik/users/new');

    // --- STEP 1: Service Setup ---
    console.log('Filling Step 1...');
    
    // Select Router
    await page.click('button:has-text("Select a router")');
    await page.locator('[role="option"]').first().click();

    // Select Service Type
    await page.click('button:has-text("Select service type")');
    await page.locator('[role="option"]:has-text("PPPoE")').click();

    // Select Package
    const packageSelect = page.locator('button:has-text("Select a package")');
    await expect(packageSelect).not.toBeDisabled({ timeout: 10000 });
    await packageSelect.click();
    await page.locator('[role="option"]').first().click();

    // Go to Step 2 - Using exact match to avoid dev-tools confusion
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // --- STEP 2: User Details ---
    console.log('Filling Step 2...');
    const uniqueId = Date.now().toString().slice(-6);
    const testUsername = `e2e_user_${uniqueId}`;

    await page.locator('label:has-text("Username") + input').fill(testUsername);
    await page.locator('label:has-text("PPPoE Password") + div input').fill('pass123');
    await page.locator('label:has-text("Official Name") + input').fill(`E2E User ${uniqueId}`);
    await page.locator('label:has-text("Mobile Number") + input').fill('254700000000');
    await page.locator('label:has-text("M-Pesa Ref No") + div input').fill(`REF${uniqueId}`);
    
    // SAVE - Using exact match
    await page.getByRole('button', { name: 'Save User', exact: true }).click();

    // 4. VERIFY REDIRECTION & LISTING
    await expect(page).toHaveURL('/mikrotik/users', { timeout: 15000 });
    
    // Use search to reliably find the user
    await page.getByPlaceholder('Search username or name...').fill(testUsername);
    
    // Check for username in the table
    await expect(page.locator('table')).toContainText(testUsername, { timeout: 10000 });
    
    console.log(`✅ Functional Test Passed: Mikrotik User ${testUsername} verified.`);
  });
});
