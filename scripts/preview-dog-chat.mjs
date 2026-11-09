import { chromium } from '@playwright/test';
import { copyFile, mkdir } from 'node:fs/promises';

const output = 'preview/dog-assistant';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width: 1180, height: 760 },
  deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 1180, height: 760 } },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.goto('http://127.0.0.1:3010/chat', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.getByRole('heading', { name: 'Ask PetMeta Dog' }).waitFor({ timeout: 60000 });
await page.screenshot({ path: `${output}/dog-chat-welcome.png` });
// Leave enough time to capture the real waiting state before the live reply arrives.
await page.route('**/api/chat', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 1600));
  await route.continue();
}, { times: 1 });
await page.getByRole('button', { name: /Help me plan a puppy routine/ }).click();
await page.locator('.dog-process').waitFor();
await page.locator('.dog-thinking-row [data-dog-mood="thinking"]').waitFor({ timeout: 10000 });
await page.waitForTimeout(420);
await page.screenshot({ path: `${output}/dog-chat-thinking.png` });
const thinkingImages = await page.locator('.dog-thinking-row img').evaluateAll((images) => images.map((image) => ({ src: image.getAttribute('src'), opacity: getComputedStyle(image.parentElement).opacity, complete: image.complete })));
await page.locator('.dog-message-row.assistant .dog-typed-answer').waitFor({ timeout: 30000 });
await page.waitForTimeout(260);
await page.screenshot({ path: `${output}/dog-chat-speaking.png` });
await page.waitForTimeout(6500);
await page.screenshot({ path: `${output}/dog-chat-answer.png` });

const answer = await page.locator('.dog-message-row.assistant').innerText();
await context.close();
const video = await page.video().path();
await copyFile(video, `${output}/dog-assistant-demo.webm`);
await browser.close();
console.log(JSON.stringify({ answerLength: answer.length, thinkingImages, errors, video: `${output}/dog-assistant-demo.webm` }));
if (errors.length || !answer.trim()) process.exitCode = 1;
