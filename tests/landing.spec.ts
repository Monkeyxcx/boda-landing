import { expect, test } from '@playwright/test';

test('la invitación carga el fondo SVG, la galería y el contenido principal', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /nos casamos/i })).toBeVisible();
  await expect(page.locator('.ambient-backdrop .ambient-lava')).toHaveCount(1);
  await expect(page.locator('.ambient-lava .lava-motion')).toHaveCount(4);
  await expect(page.locator('.ambient-lava .lava-drop')).toHaveCount(0);
  await expect(page.locator('.photo-ring-item')).toHaveCount(10);
});

test('el módulo Three.js se descarga al acercarse a la historia, no al abrir la página', async ({ page }) => {
  let worldModuleRequested = false;
  page.on('request', (request) => {
    if (request.url().includes('world-scene')) worldModuleRequested = true;
  });

  await page.goto('/');
  await page.waitForTimeout(250);
  expect(worldModuleRequested).toBe(false);

  await page.locator('.world').scrollIntoViewIfNeeded();
  await expect.poll(() => worldModuleRequested).toBe(true);
});

test('la vista /fondo muestra solo el fondo', async ({ page }) => {
  await page.goto('/fondo');

  await expect(page.locator('body > .ambient-backdrop')).toHaveCount(1);
  await expect(page.locator('body > *')).toHaveCount(1);
  await expect(page.locator('body')).toHaveText('');
  await expect(page.locator('.ambient-lava #pastel-cloud')).toHaveCount(1);
});

test('el contenido alcanza opacidad y escala completas en el centro y vuelve a atenuarse', async ({ page }) => {
  await page.goto('/');

  const card = page.locator('.chapter-card').first();
  await card.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
    window.scrollTo({ top, behavior: 'instant' });
  });

  await expect.poll(() => card.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBeGreaterThan(.95);
  await expect.poll(() => card.evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue('--scroll-focus-scale')))).toBeGreaterThan(.98);

  await page.evaluate(() => window.scrollTo({ top: window.scrollY + window.innerHeight * 1.5, behavior: 'instant' }));

  await expect.poll(() => card.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBeLessThan(.56);
  await expect.poll(() => card.evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue('--scroll-focus-scale')))).toBeLessThan(.56);
});

test('la página no desborda en móviles, tabletas ni orientación horizontal', async ({ page }) => {
  const viewports = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(Math.max(dimensions.document, dimensions.body), `desbordamiento en ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(dimensions.viewport);
  }
});

test('el menú móvil y la validación de RSVP funcionan sin enviar datos externos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menuButton = page.locator('.menu-toggle');
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.mobile-menu a[href="#historia"]').click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  await page.locator('#guest-name').fill('Invitado de prueba');
  await page.locator('#guest-attendance').selectOption('Sí, allí estaré');
  await page.locator('#rsvp-form button[type="submit"]').click();
  await expect(page.locator('.form-feedback')).toContainText('Añade rsvpEndpoint o rsvpEmail');
});

test('el movimiento reducido deja el contenido totalmente visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const hero = page.locator('.hero-content');
  await expect.poll(() => hero.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBe(1);
  await expect(page.locator('html')).not.toHaveClass(/scroll-focus-enabled/);
});
