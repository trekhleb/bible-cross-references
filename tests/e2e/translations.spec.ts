import { expect, test } from '@playwright/test';
import { ACTIVE, PANEL, openPanel, openPassage, waitForApp } from './helpers.ts';

test.describe('translations', () => {
  test('the text changes when another translation is chosen, and the address says which', async ({
    page,
  }) => {
    await openPassage(page, 'John.3.16');
    await expect(page.locator(PANEL)).toContainText(/one and only Son/);

    await page
      .locator(ACTIVE)
      .getByRole('button', { name: /Translation/ })
      .click();
    await page
      .locator(ACTIVE)
      .getByRole('radio', { name: /King James/ })
      .check();

    await expect(page).toHaveURL(/t=kjv/);
    await expect(page.locator(PANEL)).toContainText(/only begotten Son/);
  });

  test('a shared address opens in the translation it names', async ({ page }) => {
    await openPassage(page, 'John.3.16', '&t=kjv');
    await expect(page.locator(PANEL)).toContainText(/only begotten Son/);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Translation/ })).toContainText(
      'KJV',
    );
  });

  test('the choice is remembered for the next visit', async ({ page }) => {
    await openPassage(page, 'John.3.16');
    await page
      .locator(ACTIVE)
      .getByRole('button', { name: /Translation/ })
      .click();
    await page
      .locator(ACTIVE)
      .getByRole('radio', { name: /King James/ })
      .check();
    await expect(page).toHaveURL(/t=kjv/);

    await page.goto('./');
    await waitForApp(page);
    await expect(page.locator(ACTIVE).getByRole('button', { name: /Translation/ })).toContainText(
      'KJV',
    );
  });

  /**
   * The two translations that are read but whose language the interface does not speak. Nothing
   * about choosing a Bible depends on the app having menus in that language, and this is what
   * says so: a German reader gets German scripture under English menus.
   */
  test.describe('a Bible in a language the interface does not speak', () => {
    const CASES = [
      { id: 'luther1912', radio: /Lutherbibel 1912/, group: 'Deutsch', says: /eingeborenen Sohn/ },
      {
        id: 'riveduta1927',
        radio: /Riveduta 1927/,
        group: 'Italiano',
        says: /unigenito Figliuolo/,
      },
      { id: 'vbl', radio: /Versión Biblia Libre/, group: 'Español', says: /su único Hijo/ },
    ] as const;

    for (const { id, radio, group, says } of CASES) {
      test(`${id} is offered under ${group}, and its text is what loads`, async ({ page }) => {
        await openPassage(page, 'John.3.16');
        await page
          .locator(ACTIVE)
          .getByRole('button', { name: /Translation/ })
          .click();
        const menu = page.locator(ACTIVE).getByRole('radiogroup', { name: 'Translation' });
        await expect(menu.getByText(group, { exact: true })).toBeVisible();
        await menu.getByRole('radio', { name: radio }).check();

        await expect(page).toHaveURL(new RegExp(`t=${id}`));
        await expect(page.locator(PANEL)).toContainText(says);
      });

      test(`a link naming ${id} opens in it`, async ({ page }) => {
        await openPassage(page, 'John.3.16', `&t=${id}`);
        await expect(page.locator(PANEL)).toContainText(says);
      });
    }
  });

  test('the credit in the footer follows the translation on screen', async ({ page }) => {
    await page.goto('./');
    await waitForApp(page);
    await expect(page.locator(`${ACTIVE} footer`)).toContainText('BSB');
  });

  test('a quote is copied with its reference and a link that names the translation', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openPassage(page, 'Ps.23.1');
    // The verse being read offers to be sent rather than copied; its words are one press
    // further in, in the sheet that opens, beside the picture of them.
    await page
      .locator(PANEL)
      .getByRole('button', { name: /^Share/ })
      .click();
    const sheet = page.locator('dialog[open]');
    await sheet.getByRole('button', { name: 'Copy text' }).click();
    // Writing to the clipboard is asynchronous, and the sheet says so when it has finished:
    // reading before that is a race, which is a slow machine away from an empty string.
    await expect(sheet.getByRole('status')).toHaveText(/Copied/);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Psalm 23:1');
    expect(copied).toContain('(BSB)');
    expect(copied).toContain('?ref=Ps.23.1&t=bsb');
  });
});

/**
 * The translations the app cannot include, offered as links to bible.com.
 *
 * Nothing may be fetched from bible.com, or sent to it, until a reader follows a link: that is
 * what keeps a plain link free of the consent and privacy duties an embedded widget would bring.
 * So in every test here, each request to bible.com — or to youversion.com, which serves its
 * pictures — is refused and recorded, and the test fails if there was one. The links are checked
 * by their addresses and never followed: YouVersion's terms forbid automated visits.
 */
test.describe('other translations, on bible.com', () => {
  let requested: string[] = [];

  test.beforeEach(async ({ page }) => {
    requested = [];
    await page
      .context()
      .route(/^https?:\/\/([^/]+\.)?(bible|youversion)\.com\//u, async (route) => {
        requested.push(route.request().url());
        await route.abort();
      });
  });

  test.afterEach(() => {
    expect(requested).toEqual([]);
  });

  test('a verse opens in the ESV, the NASB 1995 and the NLT, in a new tab, with nothing loaded first', async ({
    page,
  }) => {
    await openPassage(page, 'John.3.16');
    const links = page
      .locator(PANEL)
      .getByRole('group', { name: 'Read on bible.com' })
      .getByRole('link');
    await expect(links).toHaveText(['ESV', 'NASB 1995', 'NLT']);
    const addresses = [
      'https://www.bible.com/bible/59/JHN.3.16.ESV',
      'https://www.bible.com/bible/100/JHN.3.16.NASB1995',
      'https://www.bible.com/bible/116/JHN.3.16.NLT',
    ];
    for (const [index, address] of addresses.entries()) {
      const link = links.nth(index);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', address);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /\bnoreferrer\b/u);
    }
  });

  test('a chapter opens whole', async ({ page }) => {
    await openPassage(page, 'Ps.23');
    await expect(page.locator(PANEL).getByRole('link', { name: /^ESV:/u })).toHaveAttribute(
      'href',
      'https://www.bible.com/bible/59/PSA.23.ESV',
    );
  });

  test('the verse being read in Threads is offered the same way', async ({ page }) => {
    await page.goto('./threads/?ref=Ps.16.8');
    await waitForApp(page);
    await openPanel(page);
    await expect(page.locator(PANEL).getByRole('link', { name: /^NLT:/u })).toHaveAttribute(
      'href',
      'https://www.bible.com/bible/116/PSA.16.8.NLT',
    );
  });

  test('a text in another language is offered none, rather than links it may not read', async ({
    page,
  }) => {
    await openPassage(page, 'John.3.16', '&t=blivre');
    // The panel is up, in Portuguese, before its links are counted: a count of none taken
    // before the panel arrived would pass whatever the panel then showed.
    await expect(page.locator(PANEL)).toContainText(/Porque Deus amou ao mundo/u);
    await expect(page.locator(PANEL).getByRole('group')).toHaveCount(0);
    await expect(page.locator(PANEL).getByRole('link', { name: /bible\.com/u })).toHaveCount(0);
  });
});
