/* Pages PWA 离线字体复核：新 SW 控制 -> 断网 reload -> Title / Map 可用。 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const SITE = 'https://elijah-lin-dancer.github.io/game-dev/';
const errors = [];
const out = { site: SITE };
const browser = await chromium.launch({ headless: true, executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  await page.goto(SITE + '?v=fe1cc4c&debug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.ready, null, { timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => navigator.serviceWorker.controller && window.__game, null, { timeout: 30000 });
  out.online = await page.evaluate(() => ({
    controller: navigator.serviceWorker.controller.scriptURL,
    sw: !!navigator.serviceWorker.controller,
    cache: 'na-b18-1ac43899',
  }));
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  out.offlineTitle = await page.evaluate(() => ({
    fontReady: document.fonts.check('12px NinjaPixel', '● × > -'),
    scroll: document.documentElement.scrollWidth,
  }));
  await page.evaluate(() => window.__game.scene.start('map', { chapter: 0 }));
  await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 15000 });
  await page.waitForTimeout(300);
  out.offlineMap = await page.evaluate(() => {
    const m = window.__game.scene.getScene('map');
    return { special: m.specialText.text, tier: m.tierLine(m.list[0], true), scroll: document.documentElement.scrollWidth };
  });
  await page.screenshot({ path: join(ROOT, 'docs/revamp/b30-font/font-online-pwa-offline-960.png') });
  out.screenshot = 'docs/revamp/b30-font/font-online-pwa-offline-960.png';
  if (!out.offlineTitle.fontReady || out.offlineTitle.scroll > 960) errors.push('offline title');
  if ((out.offlineMap.scroll || 0) > 960) errors.push('offline map overflow');
  await ctx.close();
} finally { await browser.close(); }
out.errors = errors;
out.passed = errors.length === 0;
mkdirSync(join(ROOT, 'docs/audit'), { recursive: true });
writeFileSync(join(ROOT, 'docs/audit/FONT-PWA.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!out.passed) process.exitCode = 1;
