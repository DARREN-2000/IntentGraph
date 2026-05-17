#!/usr/bin/env node
/**
 * Capture new dashboard media for GitHub Pages demo.
 * 
 * This script regenerates screenshots and video from the latest UI.
 * 
 * Usage (requires dashboard running at http://127.0.0.1:3001):
 *   node docs/scripts/capture-media-ci.mjs
 * 
 * For CI/GitHub Actions:
 *   1. Ensure Docker Compose services are running
 *   2. Wait for API health check to pass
 *   3. Start web dashboard in demo mode
 *   4. Run this script
 */

import { chromium } from 'playwright';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.DASHBOARD_URL || 'http://127.0.0.1:3001';
const screenshotsDir = '/workspaces/IntentGraph/docs/screenshots';
const videosDir = '/workspaces/IntentGraph/docs/videos';
const timeout = parseInt(process.env.CAPTURE_TIMEOUT || '30000', 10);

console.log(`Capturing media from ${baseUrl}...`);
console.log(`Screenshots: ${screenshotsDir}`);
console.log(`Videos: ${videosDir}`);

const lowRiskIntent = 'Create an issue in github repo: my-repo title: Login bug';
const highRiskIntent = 'Create a pull request in github repo: my-repo title: Improve auth from: feat/auth to: main';

try {
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

  // Navigate to dashboard
  console.log('Navigating to dashboard...');
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout });
  await page.waitForTimeout(1200);
  console.log('Capturing: dashboard-home.png');
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-home.png'), fullPage: true });

  // Test low-risk workflow
  console.log('Testing low-risk workflow...');
  const intentInput = page.locator('input[placeholder="Describe what you want to do..."]');
  await intentInput.fill(lowRiskIntent);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForSelector('text=Workflow planned with', { timeout });
  await page.waitForTimeout(700);
  console.log('Capturing: dashboard-workflow-planned.png');
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-workflow-planned.png'), fullPage: true });

  const executeButtons = page.getByRole('button', { name: 'Execute' });
  await executeButtons.first().click();
  await page.waitForTimeout(1200);
  console.log('Capturing: dashboard-execution-complete.png');
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-execution-complete.png'), fullPage: true });

  // Test high-risk workflow (requires approval)
  console.log('Testing high-risk workflow...');
  await intentInput.fill(highRiskIntent);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForSelector('text=Workflow planned with', { timeout });
  const prRow = page.locator('tbody tr', { hasText: 'pull request' }).first();
  await prRow.waitFor({ timeout });
  await prRow.getByRole('button', { name: 'Execute' }).click();
  await page.waitForSelector('button:has-text("Approve")', { timeout });
  await page.waitForTimeout(1000);
  console.log('Capturing: dashboard-waiting-approval.png');
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-waiting-approval.png'), fullPage: true });

  const approveButtons = page.getByRole('button', { name: 'Approve' });
  if (await approveButtons.count()) {
    await approveButtons.first().click();
    await page.waitForTimeout(1500);
    console.log('Capturing: dashboard-approval-complete.png');
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-approval-complete.png'), fullPage: true });
  }

  await desktopContext.close();

  // Save video
  if (videoHandle) {
    const recordedPath = await videoHandle.path();
    console.log('Saving video: intentgraph-dashboard-demo.webm');
    await copyFile(recordedPath, path.join(videosDir, 'intentgraph-dashboard-demo.webm'));
  }

  // Mobile screenshot
  console.log('Capturing mobile view...');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseUrl, { waitUntil: 'networkidle', timeout });
  await mobilePage.waitForTimeout(1200);
  console.log('Capturing: dashboard-mobile.png');
  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'dashboard-mobile.png'), fullPage: true });
  await mobileContext.close();

  await browser.close();

  console.log('✓ Media capture complete.');
  process.exit(0);
} catch (error) {
  console.error('✗ Media capture failed:', error.message);
  process.exit(1);
}
