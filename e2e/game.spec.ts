import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Reproducible deals without adding a test-only API to the application.
  await page.addInitScript(() => {
    let seed = 123;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  });
});

test('home, setup and tutorial are responsive and free from runtime errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /A little strategy/ }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('home.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'How to play' }).last().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let i = 0; i < 7; i++)
    await page.getByRole('button', { name: 'Next lesson' }).click();
  await expect(
    page.getByRole('heading', { name: 'A little memory goes a long way.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Next lesson' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Let’s play' }).click();
  await page.getByRole('button', { name: '5 players', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Seat 5 name' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('setup.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('English terminology and saved settings survive reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  {
    await page.getByRole('button', { name: 'english', exact: true }).click();
    await page.getByRole('switch', { name: 'Animations' }).click();
    await page.getByRole('switch', { name: 'Table sounds' }).click();
    await page.getByRole('button', { name: 'Close dialog' }).click();
  }
  await expect(
    page.getByRole('button', { name: 'Last Card home' }),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Kazhutha');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Last Card home' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'How to play' }).last().click();
  await page.getByRole('button', { name: 'Lesson 4', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'No matching suit? Cut!' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).not.toContainText('Vettu');
});

test('five-player pass and play hides cards at every handoff', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s play' }).click();
  await page.getByRole('button', { name: '5 players', exact: true }).click();
  await page.getByRole('button', { name: /Pass & play/ }).click();
  for (let seat = 2; seat <= 5; seat++)
    await page.getByLabel(`Seat ${seat} type`).selectOption('human');
  await page.getByRole('button', { name: 'Deal me in' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Pass the device', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.hand-section .playing-card')).toHaveCount(0);
  const firstName = await page.locator('.privacy-screen h2').textContent();
  await page.getByRole('button', { name: /Show my hand/ }).click();
  await expect(
    page.locator('.hand-section .playing-card').first(),
  ).toBeVisible();
  await expect(page.locator('.hand-card-wrapper').last()).toHaveCSS('opacity', '1');
  await page.screenshot({
    path: testInfo.outputPath('game-table.png'),
    fullPage: true,
  });
  await page
    .locator('.hand-section .playing-card:not(:disabled)')
    .first()
    .click();
  await page.getByRole('button', { name: 'Play card', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Pass the device', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.hand-section .playing-card')).toHaveCount(0);
  expect(await page.locator('.privacy-screen h2').textContent()).not.toBe(
    firstName,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('single player supports legal card selection, bots, settings and public history', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s play' }).click();
  await page.getByRole('button', { name: '2 players', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Your name', exact: true })
    .fill('Snehith');
  await page.getByRole('button', { name: 'Deal me in' }).click();
  const legal = page.locator('.hand-section .playing-card:not(:disabled)');
  await expect(legal.first()).toBeEnabled({ timeout: 10000 });
  await legal.first().click();
  await expect(
    page.getByRole('button', { name: 'Play card', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Play card', exact: true }).click();
  await expect(page.locator('.round-pill')).not.toHaveText('Round 01', {
    timeout: 10000,
  });
  await expect(legal.first()).toBeEnabled({ timeout: 10000 });
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await expect(page.locator('.history-round')).toHaveCount(1);
  await expect(page.locator('.history-plays .history-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Game settings' }).click();
  await expect(page.getByRole('switch', { name: 'Animations' })).toBeVisible();
  await page.getByRole('switch', { name: 'Animations' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.screenshot({
    path: testInfo.outputPath('two-player.png'),
    fullPage: true,
  });
});

test('home, settings and setup meet automated accessibility checks', async ({ page }) => {
  await page.goto('/');
  const issues: unknown[] = [];
  const audit = async (screen: string) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    issues.push(...results.violations.map((violation) => ({ screen, rule: violation.id, nodes: violation.nodes.map((node) => ({ target: node.target, problem: node.failureSummary })) })));
  };
  await audit('home');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await audit('settings');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Let’s play' }).click();
  await audit('setup');
  expect(issues).toEqual([]);
});
