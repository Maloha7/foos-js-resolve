import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

// Unique per run so the suite is repeatable against a shared dev database.
const stamp = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Note: the ported email validation only accepts 2-3 char TLDs (faithful to
// reSolve), so use .com.
const uniqueEmail = () => `e2e${stamp()}@foos.com`;

async function registerViaUi(page: Page): Promise<void> {
  await page.goto('/register');
  await page.fill('input[name="username"]', uniqueEmail());
  await page.fill('input[name="password"]', 'secret');
  await page.click('button[type="submit"]');
  // Landed on /leagues and recognised as logged in (httpOnly cookie -> /auth/me).
  await page.waitForURL('**/leagues');
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
}

async function createLeagueViaUi(page: Page, name: string): Promise<void> {
  await page.goto('/leagues/create');
  await page.fill('input[type="text"]', name);
  await page.getByRole('button', { name: 'Create League' }).click();
  await page.waitForURL('**/leagues');
}

test('app loads and shows the Leagues navigation', async ({ page }) => {
  await page.goto('/leagues');
  await expect(page.getByRole('link', { name: 'Leagues' })).toBeVisible();
});

test('register, log in, create a league, and see its season scoreboard', async ({
  page,
}) => {
  const leagueName = `E2E League ${stamp()}`;

  await registerViaUi(page);
  await createLeagueViaUi(page, leagueName);

  const leagueLink = page.getByRole('link', { name: leagueName });
  await expect(leagueLink).toBeVisible();
  await leagueLink.click();

  // The LeagueCreation saga creates + starts the season asynchronously; the
  // view polls, so "Loading" resolves into the season Scoreboard within a few
  // seconds. (Exercises auth, the saga, and the view-model polling fix.)
  await expect(page.getByText('Scoreboard')).toBeVisible({ timeout: 20_000 });
});

test('registering a match updates the live scoreboard over WebSocket', async ({
  page,
}) => {
  // Seed two players via the API (createPlayer is unguarded).
  const p1 = randomUUID();
  const p2 = randomUUID();
  const alice = `Alice ${stamp()}`;
  const bob = `Bob ${stamp()}`;
  await page.request.post(`/api/players/${p1}`, {
    data: { name: alice, email: uniqueEmail() },
  });
  await page.request.post(`/api/players/${p2}`, {
    data: { name: bob, email: uniqueEmail() },
  });

  await registerViaUi(page);
  const leagueName = `E2E Live ${stamp()}`;
  await createLeagueViaUi(page, leagueName);

  await page.getByRole('link', { name: leagueName }).click();
  await expect(page.getByText('Scoreboard')).toBeVisible({ timeout: 20_000 });

  // Resolve the current season id via the API.
  const leagues: Array<{ name: string; currentSeason?: string }> = await (
    await page.request.get('/api/leagues')
  ).json();
  const league = leagues.find((l) => l.name === leagueName);
  expect(league?.currentSeason).toBeTruthy();

  // Give the SeasonView WebSocket subscription a moment to establish so the
  // single ranks push isn't missed.
  await page.waitForTimeout(1500);

  // Register a match via the API while the scoreboard is open. The gateway
  // pushes the updated SeasonRanks over socket.io, so the open view updates
  // live (no reload) to show both players.
  const res = await page.request.post(
    `/api/seasons/${league!.currentSeason}/matches`,
    { data: { matchid: randomUUID(), winners: [p1], losers: [p2] } },
  );
  expect(res.ok()).toBeTruthy();

  // The names appear in several places once the ranks push arrives (scoreboard
  // row, latest matches, chart legend), so match the first occurrence.
  await expect(page.getByText(alice).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(bob).first()).toBeVisible({ timeout: 20_000 });
});

test('new match picker shows scoreboard players first and finds others via search', async ({
  page,
}) => {
  const ranked = randomUUID();
  const opponent = randomUUID();
  const newcomer = randomUUID();
  const rankedName = `Ranked ${stamp()}`;
  const opponentName = `Opponent ${stamp()}`;
  const newcomerName = `Newcomer ${stamp()}`;
  for (const [id, name] of [
    [ranked, rankedName],
    [opponent, opponentName],
    [newcomer, newcomerName],
  ]) {
    await page.request.post(`/api/players/${id}`, {
      data: { name, email: uniqueEmail() },
    });
  }

  await registerViaUi(page);
  const leagueName = `E2E Picker ${stamp()}`;
  await createLeagueViaUi(page, leagueName);
  await page.getByRole('link', { name: leagueName }).click();
  await expect(page.getByText('Scoreboard')).toBeVisible({ timeout: 20_000 });

  const leagues: Array<{ name: string; currentSeason?: string }> = await (
    await page.request.get('/api/leagues')
  ).json();
  const season = leagues.find((l) => l.name === leagueName)?.currentSeason;
  expect(season).toBeTruthy();

  await page.waitForTimeout(1500);
  const seeded = await page.request.post(`/api/seasons/${season}/matches`, {
    data: { matchid: randomUUID(), winners: [ranked], losers: [opponent] },
  });
  expect(seeded.ok()).toBeTruthy();
  await expect(page.getByText(rankedName).first()).toBeVisible();

  await page.getByRole('button', { name: 'New Match' }).click();
  await page.getByRole('button', { name: 'Single', exact: true }).click();
  const modal = page.locator('.modal-content');

  await modal.getByText('Winner', { exact: true }).click();
  await expect(modal.getByRole('button', { name: rankedName })).toBeVisible();
  await expect(modal.getByRole('button', { name: newcomerName })).toHaveCount(0);

  await modal.getByRole('button', { name: 'Show all players' }).click();
  await modal.getByRole('searchbox', { name: 'Search players' }).fill(newcomerName);
  await expect(modal.getByRole('button', { name: rankedName })).toHaveCount(0);
  await modal.getByRole('button', { name: newcomerName }).click();

  await modal.getByText('Loser', { exact: true }).click();
  await modal.getByRole('button', { name: rankedName }).click();

  await modal.getByRole('button', { name: 'Add' }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByText(newcomerName).first()).toBeVisible();
});
