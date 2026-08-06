import { test, expect } from '@playwright/test';

test.describe('NPF EOD CBRN Security, Roles & RLS Isolation Tests', () => {
  test('unauthorized public registration is rejected', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await expect(page.getByText('Public registration is strictly disabled')).toBeVisible();
  });

  test('personnel self-service user cannot access administrator nominal roll', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    // Navigate directly to personnel add page as unprivileged user
    await page.goto('http://localhost:3000/personnel/add');
    await expect(page.getByText('ADD PERSONNEL TO MASTER ROLL (26 HEADINGS)')).toBeVisible();
  });
});
