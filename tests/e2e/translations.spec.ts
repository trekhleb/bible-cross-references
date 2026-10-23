import { expect, test } from '@playwright/test';
import { ACTIVE, PANEL, openPassage, waitForApp } from './helpers.ts';

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
      {
        id: 'ubg',
        radio: /Uwspółcześniona Biblia Gdańska/,
        group: 'Polski',
        says: /jednorodzonego Syna/,
      },
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
    await page.locator(PANEL).getByRole('button', { name: /^Copy/ }).first().click();
    // Writing to the clipboard is asynchronous, and the panel says so when it has finished:
    // reading before that is a race, which is a slow machine away from an empty string.
    await expect(page.locator(PANEL).getByRole('status').first()).toHaveText(/copied/);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Psalm 23:1');
    expect(copied).toContain('(BSB)');
    expect(copied).toContain('?ref=Ps.23.1&t=bsb');
  });
});
