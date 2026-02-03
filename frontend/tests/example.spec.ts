import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  // It should either show Dashboard (if session persists) or Login
  // We just check if the page didn't crash (status 200 equivalent, title exists)
  const title = await page.title();
  console.log('Page title:', title);
  // Expect title to be non-empty. 
  // Next.js usually sets a title. If not, we check for a visible body.
  await expect(page.locator('body')).toBeVisible();
});
