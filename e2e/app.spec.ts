import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('redirects / to /new', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/new/);
  });

  test('renders header with artist name', async ({ page }) => {
    await page.goto('/new');
    await expect(page.locator('h1')).toContainText('laura kärki');
  });

  test('renders 6 navigation tabs', async ({ page }) => {
    await page.goto('/new');
    await expect(page.locator('.nav-item')).toHaveCount(6);
  });

  test('navigates to /intro', async ({ page }) => {
    await page.goto('/new');
    await page.locator('.nav-link[href="/intro"]').click();
    await expect(page).toHaveURL(/\/intro/);
  });

  test('navigates to /cv', async ({ page }) => {
    await page.goto('/new');
    await page.locator('.nav-link[href="/cv"]').click();
    await expect(page).toHaveURL(/\/cv/);
  });

  test('navigates to /works', async ({ page }) => {
    await page.goto('/new');
    await page.locator('.nav-link[href="/works"]').click();
    await expect(page).toHaveURL(/\/works/);
  });

  test('navigates to /archive', async ({ page }) => {
    await page.goto('/new');
    await page.locator('.nav-link[href="/archive"]').click();
    await expect(page).toHaveURL(/\/archive/);
  });

  test('navigates to /other', async ({ page }) => {
    await page.goto('/new');
    await page.locator('.nav-link[href="/other"]').click();
    await expect(page).toHaveURL(/\/other/);
  });
});

test.describe('Language toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new');
    // Clear localStorage to ensure default English
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('footer shows "suomeksi" in English mode', async ({ page }) => {
    await expect(page.locator('footer button')).toHaveText('suomeksi');
  });

  test('nav shows English labels by default', async ({ page }) => {
    const links = page.locator('.nav-link');
    await expect(links).toContainText(['new', 'intro', 'cv', 'works', 'archive', 'other']);
  });

  test('clicking toggle switches to Finnish', async ({ page }) => {
    await page.locator('footer button').click();
    await expect(page.locator('footer button')).toHaveText('in english');
  });

  test('nav shows Finnish labels after toggle', async ({ page }) => {
    await page.locator('footer button').click();
    const links = page.locator('.nav-link');
    await expect(links).toContainText(['uutta', 'esittely', 'cv', 'työt', 'arkisto', 'muu']);
  });

  test('language persists across page navigation', async ({ page }) => {
    await page.locator('footer button').click();
    await page.locator('.nav-link[href="/cv"]').click();
    await expect(page.locator('footer button')).toHaveText('in english');
  });
});

test.describe('Landing page (/new)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders dog photo', async ({ page }) => {
    await expect(page.locator('img')).toBeVisible();
  });

  test('renders news items with headings', async ({ page }) => {
    await expect(page.locator('h4')).toHaveCount(5);
  });

  test('news headings contain anchor links', async ({ page }) => {
    const anchors = page.locator('h4 a');
    await expect(anchors).toHaveCount(5);
  });

  test('news links open in new tab', async ({ page }) => {
    const anchors = page.locator('h4 a');
    const count = await anchors.count();
    for (let i = 0; i < count; i++) {
      await expect(anchors.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('renders English news by default', async ({ page }) => {
    await expect(page.locator('h4').first()).toContainText('Furry Darlings');
  });

  test('renders Finnish news after language toggle', async ({ page }) => {
    await page.locator('footer button').click();
    const paragraphs = page.locator('p');
    const text = await paragraphs.allTextContents();
    expect(text.join(' ')).toContain('Yksityisnäyttely');
  });
});

test.describe('CV page (/cv)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cv');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders 3 main section headings', async ({ page }) => {
    await expect(page.locator('h3')).toHaveCount(3);
  });

  test('renders English section labels by default', async ({ page }) => {
    const headings = page.locator('h3');
    await expect(headings).toContainText(['Education', 'Artistic activity', 'Job experience']);
  });

  test('renders Finnish section labels after toggle', async ({ page }) => {
    await page.locator('footer button').click();
    const headings = page.locator('h3');
    await expect(headings).toContainText(['Koulutus', 'Taiteellinen toiminta', 'Työkokemus']);
  });

  test('renders subsection headings', async ({ page }) => {
    await expect(page.locator('h4').first()).toBeVisible();
  });

  test('renders subsection headings for artistic activity', async ({ page }) => {
    const headings = page.locator('h4');
    await expect(headings).toContainText(['Group exhibitions', 'Grants', 'Residences']);
  });

  test('renders time range entries', async ({ page }) => {
    const times = page.locator('.cv-time');
    const nonEmpty = times.filter({ hasNotText: /^\s*$/ });
    await expect(nonEmpty.first()).toBeVisible();
  });

  test('renders a continuing entry with trailing dash', async ({ page }) => {
    const times = page.locator('.cv-time');
    await times.first().waitFor({ state: 'visible' });
    const allTexts = await times.allTextContents();
    expect(allTexts.some(t => t.trim().endsWith('-'))).toBe(true);
  });
});

test.describe('Works page (/works)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/works');
  });

  test('renders carousel', async ({ page }) => {
    await expect(page.locator('ngb-carousel')).toBeVisible();
  });

  test('renders at least one slide', async ({ page }) => {
    await expect(page.locator('.carousel-item').first()).toBeVisible();
  });

  test('carousel has navigation buttons', async ({ page }) => {
    await expect(page.locator('.carousel-control-next')).toBeVisible();
    await expect(page.locator('.carousel-control-prev')).toBeVisible();
  });
});

test.describe('Archive page (/archive)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archive');
  });

  test('renders carousel', async ({ page }) => {
    await expect(page.locator('ngb-carousel')).toBeVisible();
  });

  test('renders at least one slide', async ({ page }) => {
    await expect(page.locator('.carousel-item').first()).toBeVisible();
  });
});

test.describe('Intro page (/intro)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/intro');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders bio photo', async ({ page }) => {
    await expect(page.locator('img')).toBeVisible();
  });

  test('renders English biography by default', async ({ page }) => {
    await expect(page.locator('app-intro')).toContainText('laura kärki', { ignoreCase: true });
  });
});

test.describe('Other page (/other)', () => {
  test('renders page content', async ({ page }) => {
    await page.goto('/other');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Footer', () => {
  test('renders Instagram link', async ({ page }) => {
    await page.goto('/new');
    await expect(page.locator('footer a[href*="instagram.com"]')).toBeVisible();
  });

  test('renders Facebook link', async ({ page }) => {
    await page.goto('/new');
    await expect(page.locator('footer a[href*="facebook.com"]')).toBeVisible();
  });

  test('shows English obfuscated email by default', async ({ page }) => {
    await page.goto('/new');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('footer')).toContainText('laura dot karki at gmail dot com');
  });

  test('shows Finnish obfuscated email after toggle', async ({ page }) => {
    await page.goto('/new');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('footer button').click();
    await expect(page.locator('footer')).toContainText('laura piste karki miukumauku gmail piste com');
  });
});