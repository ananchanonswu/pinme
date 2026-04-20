const { test, expect } = require('@playwright/test');

test.describe('PinMe UI Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to apply empty state
    await page.reload();
  });

  // UI-TC01: ค้นหาสถานที่ด้วยพิกัดและรัศมี
  test('UI-TC01: should search places by coordinates and radius', async ({ page }) => {
    // Fill coordinates
    await page.fill('#latitude', '13.7367');
    await page.fill('#longitude', '100.5232');
    
    // Set radius via input
    await page.fill('#radiusInput', '5');
    
    // Click submit
    await page.click('#submitBtn');
    
    // Expect success toast
    const toast = page.locator('.toast.success').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('พบ');

    // Expect results
    const resultsCount = page.locator('#resultsCount');
    await expect(resultsCount).not.toHaveText('0');
    
    const firstResultCardBadge = page.locator('#resultsGrid .result-card .badge').first();
    await expect(firstResultCardBadge).toBeVisible();
    
    // Expect map marker (Leaflet adds img with leaflet-marker-icon class)
    const mapMarkers = page.locator('.leaflet-marker-icon');
    await expect(mapMarkers.first()).toBeVisible();
  });

  // UI-TC02: ระบบ Favorites — บันทึกและแสดงสถานที่โปรด
  test('UI-TC02: should save and display favorite places, persisting after refresh', async ({ page }) => {
    // Search first so we have a card to pin
    await page.fill('#latitude', '13.7367');
    await page.fill('#longitude', '100.5232');
    await page.fill('#radiusInput', '5');
    await page.click('#submitBtn');
    
    // Wait for results
    await page.waitForSelector('#resultsGrid .result-card');

    // Click the pin icon of the first card
    // Note: ensure we select the right button. Looking at typically naming...
    const pinBtn = page.locator('#resultsGrid .result-card .card-btn-pin').first();
    const placeName = await page.locator('#resultsGrid .result-card .card-title').first().textContent();
    await pinBtn.click();
    
    // Expect toast
    const toast = page.locator('.toast.success').first();
    await expect(toast).toBeVisible();
    
    // Expect it to appear in Favorites section
    const favCount = page.locator('#favoritesCount');
    await expect(favCount).not.toHaveText('0');
    
    const favFirstCardName = page.locator('#favoritesGrid .result-card .card-title').first();
    await expect(favFirstCardName).toHaveText(placeName);
    
    // Refresh page
    await page.reload();
    
    // Expect it to still be in Favorites section
    const favCountAfter = page.locator('#favoritesCount');
    await expect(favCountAfter).not.toHaveText('0');
    const favFirstCardNameAfter = page.locator('#favoritesGrid .result-card .card-title').first();
    await expect(favFirstCardNameAfter).toHaveText(placeName);
  });

  // UI-TC03: Trip Planner — เพิ่มกิจกรรมและตรวจสอบเวลาทับซ้อน
  test('UI-TC03: should add activities and detect time overlap', async ({ page }) => {
    // Add first activity
    await page.fill('#tripActivityName', 'วัดพระแก้ว');
    await page.fill('#tripStartTime', '09:00');
    await page.fill('#tripEndTime', '11:00');
    await page.click('#tripForm .submit-secondary');
    
    // Expect success toast
    const successToast = page.locator('.toast.success').first();
    await expect(successToast).toBeVisible();
    // Wait for toast to disappear
    await successToast.waitFor({ state: 'hidden' });
    
    // Verify timeline has 1 item
    const timelineItems = page.locator('#tripTimeline .trip-item');
    await expect(timelineItems).toHaveCount(1);
    
    // Add second overlapping activity
    await page.fill('#tripActivityName', 'ร้านอาหาร');
    await page.fill('#tripStartTime', '10:00');
    await page.fill('#tripEndTime', '12:00');
    await page.click('#tripForm .submit-secondary');
    
    // Expect error toast
    const errorToast = page.locator('.toast.error').first();
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('วัดพระแก้ว');
    
    // Verify timeline still has 1 item
    await expect(timelineItems).toHaveCount(1);
  });

  // UI-TC04: Validation — ตรวจสอบค่า Input ไม่ถูกต้อง
  test('UI-TC04: should validate inputs and show error messages', async ({ page }) => {
    // Remove HTML5 validation to test JS validation toasts
    await page.evaluate(() => {
      document.getElementById('latitude').removeAttribute('required');
      document.getElementById('longitude').removeAttribute('required');
      document.getElementById('latitude').removeAttribute('max');
      document.getElementById('longitude').removeAttribute('max');
      document.getElementById('latitude').removeAttribute('min');
      document.getElementById('longitude').removeAttribute('min');
    });

    // Case 1: Empty coords
    await page.fill('#latitude', '');
    await page.fill('#longitude', '');
    await page.click('#submitBtn');
    await expect(page.locator('.toast.warning').first()).toBeVisible();
    await page.locator('.toast.warning').first().waitFor({ state: 'hidden' });

    // Case 2: Latitude > 90
    await page.fill('#latitude', '999');
    await page.fill('#longitude', '100');
    await page.click('#submitBtn');
    await expect(page.locator('.toast.warning').first()).toBeVisible();
    await page.locator('.toast.warning').first().waitFor({ state: 'hidden' });

    // Case 3: Longitude > 180
    await page.fill('#latitude', '13');
    await page.fill('#longitude', '999');
    await page.click('#submitBtn');
    await expect(page.locator('.toast.warning').first()).toBeVisible();
  });

  // UI-TC05: เปลี่ยนภาษาและ Theme — ตรวจสอบ i18n และ UI
  test('UI-TC05: should toggle language and theme and persist after refresh', async ({ page }) => {
    // Initial state: Language is likely TH and Theme is likely Dark
    // Click Language Toggle
    const langBtn = page.locator('#langToggleBtn');
    await langBtn.click();
    
    // Wait for language to change
    await expect(langBtn).toHaveText('🇬🇧 EN');
    const subtitle = page.locator('[data-i18n="subtitle"]');
    await expect(subtitle).toHaveText('Find places around you');
    
    // Click Theme Toggle
    const themeBtn = page.locator('#themeToggleBtn');
    await themeBtn.click();
    
    // document.documentElement should have light-theme class
    await expect(page.locator('html')).toHaveClass(/light-theme/);
    
    // Refresh
    await page.reload();
    
    // Verify persistence
    await expect(page.locator('#langToggleBtn')).toHaveText('🇬🇧 EN');
    await expect(page.locator('[data-i18n="subtitle"]')).toHaveText('Find places around you');
    await expect(page.locator('html')).toHaveClass(/light-theme/);
  });

});
