import { test, expect } from '@playwright/test';

const DEMO_USER = { identifier: 'vincent_etf', password: 'Demo1234!' };

test('login, create a discussion, reply without a reload', async ({ page }) => {
  const title = `E2E discussion ${Date.now()}`;
  const replyContent = `E2E reply ${Date.now()}`;

  await page.goto('/login');
  await page.getByLabel('Identifiant ou email').fill(DEMO_USER.identifier);
  await page.getByLabel('Mot de passe').fill(DEMO_USER.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  // "Publier" is always in the header, logged in or not — wait for the
  // one element that only renders once authenticated instead.
  await expect(page.getByRole('button', { name: 'Déconnexion' })).toBeVisible({ timeout: 15_000 });

  await page.goto('/discussions/new');

  await page.getByLabel('Titre').fill(title);
  await page.getByLabel('Catégorie', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('Contenu').fill('Contenu de discussion créé par le test end-to-end.');
  await page.getByRole('button', { name: 'Publier' }).click();

  await expect(page).toHaveURL(/\/discussions\/[^/]+$/);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  const replyBox = page.getByPlaceholder('Votre réponse…');
  await expect(replyBox).toBeVisible();

  // Proves the reply landed via the optimistic mutation, not a page reload:
  // a reload would bump this past 1.
  let loadCount = 0;
  page.on('load', () => {
    loadCount += 1;
  });

  await replyBox.fill(replyContent);
  await page.getByRole('button', { name: 'Publier ma réponse' }).click();

  await expect(page.getByText(replyContent)).toBeVisible();
  expect(loadCount).toBe(0);
});
