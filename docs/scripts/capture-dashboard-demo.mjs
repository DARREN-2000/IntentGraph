import { chromium } from 'playwright';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:3001';
const screenshotsDir = '/workspaces/IntentGraph/docs/screenshots';
const videosDir = '/workspaces/IntentGraph/docs/videos';

const lowRiskIntent = 'Create an issue in github repo: my-repo title: Login bug';
const highRiskIntent = 'Create a pull request in github repo: my-repo title: Improve auth from: feat/auth to: main';

await mkdir(screenshotsDir, { recursive: true });
await mkdir(videosDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

const desktopContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: videosDir,
    size: { width: 1280, height: 720 },
  },
});

const page = await desktopContext.newPage();
const videoHandle = page.video();

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-home.png'), fullPage: true });

const intentInput = page.locator('input[placeholder="Describe what you want to do..."]');
await intentInput.fill(lowRiskIntent);
await page.getByRole('button', { name: 'Create' }).click();
await page.waitForSelector('text=Workflow planned with', { timeout: 15000 });
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-workflow-planned.png'), fullPage: true });

const executeButtons = page.getByRole('button', { name: 'Execute' });
await executeButtons.first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-execution-complete.png'), fullPage: true });

await intentInput.fill(highRiskIntent);
await page.getByRole('button', { name: 'Create' }).click();
await page.waitForSelector('text=Workflow planned with', { timeout: 15000 });
const prRow = page.locator('tbody tr', { hasText: 'pull request' }).first();
await prRow.waitFor({ timeout: 15000 });
await prRow.getByRole('button', { name: 'Execute' }).click();
await page.waitForSelector('button:has-text("Approve")', { timeout: 15000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-waiting-approval.png'), fullPage: true });

const approveButtons = page.getByRole('button', { name: 'Approve' });
if (await approveButtons.count()) {
  await approveButtons.first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-approval-complete.png'), fullPage: true });
}

await desktopContext.close();

if (videoHandle) {
  const recordedPath = await videoHandle.path();
  await copyFile(recordedPath, path.join(videosDir, 'intentgraph-dashboard-demo.webm'));
}

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(1200);
await mobilePage.screenshot({ path: path.join(screenshotsDir, 'dashboard-mobile.png'), fullPage: true });
await mobileContext.close();

await browser.close();

console.log('Capture complete.');
