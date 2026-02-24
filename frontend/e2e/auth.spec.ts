import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Authentication Flow - Detailed Debug', () => {
  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // 1. Setup logging
    page.on('console', msg => console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`));
    page.on('request', request => {
        if (request.url().includes('/api/')) {
            console.log(`📡 API REQ: ${request.method()} ${request.url()}`);
        }
    });
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log(`🟢 API RES: ${response.status()} ${response.url()}`);
        }
    });

    // 2. Go to login page
    await page.goto('/login');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 20000 });
    
    // 3. Fill in credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'Abuhureira12');
    
    // 4. Submit and wait for response
    console.log('Clicking sign in...');
    await page.click('button[type="submit"]');
    
    // 5. Check for any immediate error alerts
    const errorAlert = page.locator('[role="alert"]');
    const isErrorVisible = await errorAlert.isVisible();
    if (isErrorVisible) {
        console.log('❌ ERROR ALERT DETECTED:', await errorAlert.textContent());
        await page.screenshot({ path: 'login-error-alert.png' });
    }

    // 6. Verify redirection
    try {
        await expect(page).toHaveURL('/', { timeout: 10000 });
        console.log('🎉 Redirection successful!');
    } catch (e) {
        console.log('❌ Redirection failed. Current URL:', page.url());
        await page.screenshot({ path: 'login-failure-url.png' });
        const html = await page.content();
        fs.writeFileSync('login-failure.html', html);
        throw e;
    }
    
    await expect(page.getByText(/Total Users/i)).toBeVisible({ timeout: 10000 });
  });
});
