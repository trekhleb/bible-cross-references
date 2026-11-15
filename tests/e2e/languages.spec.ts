import { expect, test, type Page } from '@playwright/test';
import { ACTIVE, PANEL, openPanel, waitForApp } from './helpers.ts';
import { LOCALE_IDS } from '../../src/i18n/locale-id.ts';

/** Opens the app in a language, with the details of a passage in view. */
async function open(page: Page, query: string): Promise<void> {
  await page.goto(`./${query}`);
  await waitForApp(page);
  await openPanel(page);
}

test.describe('reading in Portuguese', () => {
  test('a link that names the language opens the app in it', async ({ page }) => {
    await open(page, '?lang=pt');
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('a browser that asks for Portuguese gets it, and its Bible, without being asked', async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'pt-BR' });
    const page = await context.newPage();
    await page.goto('./');
    await waitForApp(page);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Tradução/ })).toBeVisible();
    // The Portuguese Bible comes with the Portuguese interface.
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Tradução/ })).toContainText(
      'BLIVRE',
    );
    await context.close();
  });

  test('the verses are the Portuguese text, under Portuguese book names', async ({ page }) => {
    await open(page, '?lang=pt&ref=John.3.16');
    await expect(page.locator(PANEL).getByRole('heading', { name: 'João 3:16' })).toBeVisible();
    await expect(page.locator(PANEL)).toContainText('Porque Deus amou ao mundo');
    await expect(page.locator(PANEL).getByText('Gênesis 22:12').first()).toBeVisible();
  });

  test('a reference can be typed in Portuguese, accents or not', async ({ page }) => {
    await open(page, '?lang=pt');
    const search = page.locator(ACTIVE).getByRole('searchbox');
    await search.fill('Gênesis 1:1');
    await search.press('Enter');
    await expect(page.locator(PANEL).getByRole('heading', { name: 'Gênesis 1:1' })).toBeVisible();
    await search.fill('salmos 23');
    await search.press('Enter');
    await expect(page.locator(PANEL).getByRole('heading', { name: 'Salmo 23' })).toBeVisible();
  });

  test('a reference it cannot read says so in Portuguese', async ({ page }) => {
    await open(page, '?lang=pt');
    const search = page.locator(ACTIVE).getByRole('searchbox');
    await search.fill('Hesitações 4:4');
    await search.press('Enter');
    await expect(page.locator(ACTIVE).getByRole('alert')).toContainText('Livro desconhecido');
  });

  test('counts are written the way a Brazilian writes them', async ({ page }) => {
    await open(page, '?lang=pt');
    await expect(page.getByText(/31\.102 versículos/)).toBeVisible();
  });

  test('the Hebrew words of a verse are named in Portuguese', async ({ page }) => {
    await open(page, '?lang=pt&ref=Gen.1.1');
    await expect(
      page.locator(PANEL).getByRole('button', { name: /Mesma palavra hebraica/ }),
    ).toBeVisible();
  });
});

test.describe('choosing a language', () => {
  test('the picker groups the translations under their language', async ({ page }) => {
    await open(page, '');
    await page
      .locator(ACTIVE)
      .getByRole('button', { name: /Translation/ })
      .click();
    const menu = page.locator(ACTIVE).getByRole('radiogroup', { name: 'Translation' });
    await expect(menu.getByText('English', { exact: true })).toBeVisible();
    await expect(menu.getByText('Português', { exact: true })).toBeVisible();
    // Including the languages the interface itself does not speak: a Bible and a set of menus
    // are separate things, and a group heading here is the only place that shows it.
    await expect(menu.getByText('Deutsch', { exact: true })).toBeVisible();
    await expect(menu.getByText('Italiano', { exact: true })).toBeVisible();
    await expect(menu.getByText('Español', { exact: true })).toBeVisible();
    await expect(menu.getByRole('radio', { name: /Bíblia Livre/ })).toBeVisible();
  });

  test('the interface language is chosen in the same menu, and remembered', async ({ page }) => {
    await open(page, '');
    await page
      .locator(ACTIVE)
      .getByRole('button', { name: /Translation/ })
      .click();
    await page.locator(ACTIVE).getByLabel('Language').selectOption('pt');
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
    // The language goes into the path, not the query: that is the address the reader will copy,
    // and the only one that previews in Portuguese when they share it.
    // `?t=blivre` comes with it: the Portuguese Bible is not this reader's standing choice, so
    // the address has to name it or a reload would reopen on the English text.
    await expect(page).toHaveURL(/\/pt\/(\?|$)/);
    await expect(page).not.toHaveURL(/lang=/);
    await page.reload();
    await waitForApp(page);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
  });

  test('changing the text leaves the interface language alone', async ({ page }) => {
    await open(page, '?lang=pt');
    await page
      .locator(ACTIVE)
      .getByRole('button', { name: /Tradução/ })
      .click();
    await page
      .locator(ACTIVE)
      .getByRole('radio', { name: /King James/ })
      .click();
    // The words stay Portuguese; only the Bible changed.
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
    await expect(page).toHaveURL(/t=kjv/);
  });

  test('a shared link carries both the text and the language', async ({ page }) => {
    await open(page, '?lang=pt&t=kjv&ref=Ps.23.1');
    await expect(page.locator(PANEL).getByRole('heading', { name: 'Salmo 23:1' })).toBeVisible();
    // Brackets and all: they mark the words the translators supplied rather than found in the
    // Hebrew, which is the KJV's own convention and not ours to quietly drop.
    await expect(page.locator(PANEL)).toContainText('The LORD [is] my shepherd');
  });
});

/**
 * The language in the path.
 *
 * A static host serves one file per path and nothing per query, so `/pt/` is the only address
 * whose title, description and preview card are Portuguese before any JavaScript has run. These
 * check both halves of that: the file a crawler is served, and the app a reader gets.
 */
test.describe('the Portuguese pages', () => {
  test('open in Portuguese with nothing in the query', async ({ page }) => {
    await page.goto('./pt/');
    await waitForApp(page);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('bring the Portuguese Bible with them', async ({ page }) => {
    await page.goto('./pt/');
    await waitForApp(page);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Tradução/ })).toContainText(
      'BLIVRE',
    );
  });

  test('serve Threads in Portuguese too', async ({ page }) => {
    await page.goto('./pt/threads/');
    await waitForApp(page);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
  });

  test('keep working for a reader whose browser asks for English', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();
    await page.goto('./pt/');
    await waitForApp(page);
    // The file is Portuguese; what the browser prefers does not get to overrule it.
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Filtros/ })).toBeVisible();
    await context.close();
  });

  /**
   * What WhatsApp, Facebook and every crawler that does not run JavaScript are served. Fetched
   * as bytes rather than rendered, because that is exactly how they read it: this is the test
   * that would have caught a Portuguese link previewing in English.
   */
  test('preview in Portuguese without running any JavaScript', async ({ request }) => {
    const response = await request.get('./pt/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('<html lang="pt-BR"');
    expect(html).toContain('<title>Referências Cruzadas da Bíblia</title>');
    expect(html).toContain('property="og:locale" content="pt_BR"');
    expect(html).toContain('referências cruzadas da Bíblia');
    expect(html).toContain('social-preview.pt.jpg');
    // The canonical URL is the published one, not the host this test happens to run against.
    expect(html).toMatch(/rel="canonical" href="[^"]*\/pt\/"/);
    // And it says where the other language lives, both ways round.
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="x-default"');
    const english = await (await request.get('./')).text();
    expect(english).toContain('hreflang="pt"');
    expect(english).toContain('<title>Bible Cross-References</title>');
    expect(english).toContain('property="og:locale" content="en_US"');
  });

  test('are reachable without JavaScript, by a link that is really there', async ({ request }) => {
    const html = await (await request.get('./')).text();
    // The noscript block is what a crawler that follows links reads; without it the four pages
    // are addresses nothing points at.
    expect(html).toMatch(/<noscript>[\s\S]*Português[\s\S]*<\/noscript>/);
    expect(html).toMatch(/<noscript>[\s\S]*threads\/[\s\S]*<\/noscript>/);
  });
});

/**
 * Links shared before the language paths existed.
 *
 * Every one of them has to keep working, untouched — they are in bookmarks, in sermon handouts
 * and in messages nobody can edit. They also quietly become the new shape, so that the address
 * the reader copies next previews correctly.
 */
test.describe('a link shared the old way', () => {
  test('still opens in Portuguese', async ({ page }) => {
    await open(page, '?lang=pt&ref=John.3.16');
    await expect(page.locator(PANEL).getByRole('heading', { name: 'João 3:16' })).toBeVisible();
  });

  test('moves the language into the path, keeping everything else', async ({ page }) => {
    await page.goto('./?lang=pt&ref=John.3.16&utm_source=whatsapp');
    await waitForApp(page);
    await expect(page).toHaveURL(/\/pt\/\?/);
    await expect(page).not.toHaveURL(/lang=pt/);
    const url = new URL(page.url());
    expect(url.searchParams.get('ref')).toBe('John.3.16');
    expect(url.searchParams.get('utm_source')).toBe('whatsapp');
  });

  test('does not add a history entry the reader has to press Back through', async ({ page }) => {
    await page.goto('./');
    await waitForApp(page);
    await page.goto('./?lang=pt');
    await waitForApp(page);
    await expect(page).toHaveURL(/\/pt\/$/);
    // Back goes to where the reader actually came from, not to the address before the rewrite.
    await page.goBack();
    await waitForApp(page);
    await expect(page).not.toHaveURL(/\/pt\//);
  });

  test('leaves an English link alone', async ({ page }) => {
    await page.goto('./?lang=en&ref=John.3.16');
    await waitForApp(page);
    // `?lang=en` is not noise: it is what stops a Portuguese reader's own preference taking over.
    await expect(page).toHaveURL(/lang=en/);
  });
});

/**
 * Ukrainian has an interface and no Bible of its own. That combination is the one the rest of
 * this file never exercises — Portuguese has both — and it is the half that is easy to break,
 * because every path that chooses a Bible is keyed on the interface language.
 */
test.describe('a language with no Bible of its own', () => {
  test('serves its own page, in its own language, before any script runs', async ({ request }) => {
    const response = await request.get('./uk/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('lang="uk"');
    expect(html).toContain('Перехресні посилання Біблії');
  });

  test('opens in Ukrainian and keeps the default Bible', async ({ page }) => {
    await open(page, 'uk/');
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Переклад/ })).toContainText(
      'BSB',
    );
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Фільтри/ })).toBeVisible();
  });

  test('reads a reference typed in Ukrainian', async ({ page }) => {
    await open(page, 'uk/');
    await page.locator(ACTIVE).getByRole('searchbox').fill('Івана 3:16');
    await page.locator(ACTIVE).getByRole('searchbox').press('Enter');
    await expect(page).toHaveURL(/ref=John\.3\.16/);
  });

  test('can read a German Bible under Ukrainian menus', async ({ page }) => {
    // The two settings are independent, and this is the pairing that proves it: neither
    // language has anything to do with the other.
    await open(page, 'uk/?t=luther1912');
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Переклад/ })).toContainText(
      'LUT',
    );
  });
});

/**
 * Nothing in the chrome runs off the right edge, in any language, on either size of screen.
 *
 * Here rather than in `responsive.spec.ts`, which the phone project ignores on purpose, and
 * this has to run on a phone: the gesture hints swap on `(hover: none) and (pointer: coarse)`,
 * a property of the browser context rather than of the viewport, so a desktop page narrowed to
 * 412px still shows the mouse wording. The line that overflowed in German, Spanish and
 * Ukrainian — "gedrückt halten für die Vorschau · zum Auswählen · zum Zoomen" — is the touch
 * one, and no amount of resizing a desktop window would have shown it.
 *
 * Measured, not photographed. The screens this sits on also carry the arcs, which a software
 * renderer draws differently run to run, so their snapshots allow 2% of the pixels — about
 * 7,500 on a phone. Three languages ran a line of text off the edge for less than that, so the
 * images compared equal while the app was visibly wrong. A number has no such tolerance.
 */
test.describe('the chrome fits, in every language', () => {
  for (const language of LOCALE_IDS) {
    test(`${language}: nothing reaches past the right edge`, async ({ page }) => {
      await page.goto(`./?lang=${language}`);
      await waitForApp(page);

      const measured = await page
        .locator(`${ACTIVE} [class*="stats"]`)
        .first()
        .evaluate((stats) => ({
          width: window.innerWidth,
          // Two signals, because one of them alone missed this. A line that does not wrap paints
          // past its own box without the box growing, so the *container's* own rect stays inside
          // the window and only its scrollable width gives it away; and the rows themselves are
          // spans holding other elements, so measuring leaf nodes — which was the first attempt —
          // measures the bits that sit safely inside and never the row that sticks out.
          overflow: stats.scrollWidth - stats.clientWidth,
          widest: Math.round(
            Math.max(
              stats.getBoundingClientRect().right,
              ...[...stats.children]
                .filter((row) => row.getBoundingClientRect().width > 0)
                .map((row) => row.getBoundingClientRect().right),
            ),
          ),
        }));
      expect(measured.overflow, `${language}: the stats scroll sideways`).toBe(0);
      expect(measured.widest, `${language}: a row of the stats`).toBeLessThanOrEqual(
        measured.width,
      );
    });
  }
});

test.describe('reading in Slovenian', () => {
  test('opens the Chráska text and Slovenian book names through the locale path', async ({
    page,
  }) => {
    await page.goto('./sl/threads/?t=chr1914-sl&ref=Gen.1.1');
    await waitForApp(page);
    await openPanel(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'sl');
    await expect(
      page.locator(PANEL).getByRole('heading', { name: '1. Mojzesova 1:1' }),
    ).toBeVisible();
    await expect(page.locator(PANEL)).toContainText('V začetku je ustvaril Bog nebesa in zemljo.');
    const search = page.locator(ACTIVE).getByRole('searchbox');
    await search.fill('5 Mz 1:1');
    await search.press('Enter');
    await expect(
      page.locator(PANEL).getByRole('heading', { name: '5. Mojzesova 1:1' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/ref=Deut.1.1/);
    await expect(page).toHaveURL(/t=chr1914-sl/);
  });

  test('keeps existing translation-only links working', async ({ page }) => {
    await open(page, '?t=chr1914-sl&ref=Gen.1.1');
    await expect(page.locator(PANEL)).toContainText('V začetku je ustvaril Bog nebesa in zemljo.');
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Translation/ })).toContainText(
      'CHR',
    );
  });
});
