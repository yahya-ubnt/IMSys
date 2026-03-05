import { test, expect } from '@playwright/test';

test.describe('SMS Compose Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add request logging for debugging
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`>> API Request: ${request.method()} ${request.url()}`);
      }
    });
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        console.log(`<< API Response: ${response.status()} ${response.request().method()} ${response.url()}`);
        if (!response.ok()) {
          console.log('Response body:', await response.text());
        }
      }
    });

    // Assume a login page exists at /login
    await page.goto('http://localhost:3000/login');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 20000 });

    // Replace with actual login credentials and selectors
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Abuhureira12');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard or a protected route
    await page.waitForURL('http://localhost:3000/');
    await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 10000 });

    // Navigate to the SMS Compose page
    await page.goto('http://localhost:3000/sms/compose');
    await page.waitForSelector('h1:has-text("Compose New SMS")');

    // Wait for initial data fetching API calls
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/mikrotik/users/clients-for-sms') && response.request().method() === 'GET'),
      page.waitForResponse(response => response.url().includes('/api/mikrotik/routers') && response.request().method() === 'GET'),
      page.waitForResponse(response => response.url().includes('/api/buildings') && response.request().method() === 'GET'),
    ]);
    await page.waitForLoadState('networkidle'); // Wait for all network requests to finish
  });

  test('should send SMS to Users group (all users)', async ({ page }) => {
    // Select Users tab (default)
    await page.click('button:has-text("Users")');

    // Select "Send to all users" checkbox
    await page.click('label:has-text("Send to all users")');

    // Enter message
    await page.fill('textarea[id="message"]', 'Test message to all users.');

    // Click Send Message
    await page.click('button:has-text("Send Message")');

    // Verify success toast
    await expect(page.locator('text="Your message has been queued for sending."')).toBeVisible({ timeout: 10000 });
  });

  test('should send SMS to MikroTik Group (all users in selected routers)', async ({ page }) => {
    // Select MikroTik Group tab
    await page.click('button:has-text("Mikrotik Group")');

    // Select a MikroTik router
    await page.click('button:has-text("Select routers...")'); // Click the MultiSelect trigger button
    await page.waitForSelector('div[role="option"]'); // Wait for options to appear
    await page.locator('div[role="option"]').first().click(); // Select the first available router
    await page.press('body', 'Escape'); // Close the multiselect dropdown
    await page.waitForLoadState('networkidle'); // Wait for the useEffect to trigger and fetch users

    // Wait for users to be fetched for selected routers
    const mikrotikUsersResponse = await page.waitForResponse(response => response.url().includes('/api/mikrotik/users/by-routers') && response.request().method() === 'POST');
    console.log('MikroTik Users by Routers API Response Status:', mikrotikUsersResponse.status());
    console.log('MikroTik Users by Routers API Response Body:', await mikrotikUsersResponse.json());

    // Select "Send to all users in selected MikroTik routers" checkbox
    await page.click('label:has-text("Send to all users in selected MikroTik routers")');

    // Enter message
    await page.fill('textarea[id="message"]', 'Test message to MikroTik group users.');

    // Wait for the API response after clicking Send Message
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/sms/compose') && response.request().method() === 'POST'),
      page.click('button:has-text("Send Message")')
    ]);

    // Verify success toast
    await expect(page.locator('text="Your message has been queued for sending."')).toBeVisible({ timeout: 10000 });
  });

  test('should send SMS to Building group (all users in selected buildings)', async ({ page }) => {
    // Select Building tab
    await page.click('button:has-text("Building")');

    // Select a Building
    await page.click('button:has-text("Select buildings...")'); // Click the MultiSelect trigger button
    await page.waitForSelector('div[role="option"]'); // Wait for options to appear
    await page.locator('div[role="option"]').first().click(); // Select the first available building
    await page.press('body', 'Escape'); // Close the multiselect dropdown
    await page.waitForLoadState('networkidle'); // Wait for the useEffect to trigger and fetch users

    // Wait for users to be fetched for selected buildings
    const buildingUsersResponse = await page.waitForResponse(response => response.url().includes('/api/mikrotik/users/by-buildings') && response.request().method() === 'POST');
    console.log('Building Users by Buildings API Response Status:', buildingUsersResponse.status());
    console.log('Building Users by Buildings API Response Body:', await buildingUsersResponse.json());

    // Select "Send to all users in selected Building(s)" checkbox
    await page.click('label:has-text("Send to all users in selected Building(s)")');

    // Enter message
    await page.fill('textarea[id="message"]', 'Test message to Building group users.');

    // Wait for the API response after clicking Send Message
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/sms/compose') && response.request().method() === 'POST'),
      page.click('button:has-text("Send Message")')
    ]);

    // Verify success toast
    await expect(page.locator('text="Your message has been queued for sending."')).toBeVisible({ timeout: 10000 });
  });

  test('should send SMS to Unregistered recipient', async ({ page }) => {
    // Select Unregistered tab
    await page.click('button:has-text("Unregistered")');

    // Ensure the input field is visible
    await page.waitForSelector('input[id="unregistered-phone"]');
    // Enter phone number
    await page.fill('input[id="unregistered-phone"]', '254712345678'); // Replace with a valid test phone number

    // Enter message
    await page.fill('textarea[id="message"]', 'Test message to unregistered recipient.');

    // Wait for the API response after clicking Send Message
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/sms/compose') && response.request().method() === 'POST'),
      page.click('button:has-text("Send Message")')
    ]);

    // Verify success toast
    await expect(page.locator('text="Your message has been queued for sending."')).toBeVisible({ timeout: 10000 });
  });

  // TODO: Add more detailed tests for active/expired filtering and specific user selections
  // TODO: Add tests for error handling (e.g., empty message, no recipients)
});
