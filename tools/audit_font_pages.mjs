/* Pages 字体 / HUD 线上复核：入口哈希、字体字节、Title / Map 三档、0 pageerror。
 * 用法：node tools/audit_font_pages.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const SITE = 'https://elijah-lin-dancer.github.io/game-dev/';
const EXPECT = { game: 'game.79e777bc.js', assets: 'assets.7758173e.js', fontBytes: 133724 };
const errors = [];
const out = { site: SITE, expected: EXPECT, screenshots: [] };
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/local/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] });

try {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  await page.goto(SITE + '?v=fe1cc4c&debug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 45000 });
  await page.waitForTimeout(500);
  out.entry = await page.evaluate(() => ({
    scripts: [...document.querySelectorAll('script[src]')].map((x) => x.getAttribute('src')).filter((x) => /game|assets/.test(x)),
    chapters: window.__chaptersData.chapters.length,
    stages: window.__chaptersData.chapters.reduce((n, c) => n + c.stages, 0),
    fontReady: document.fonts.check('12px NinjaPixel', '● × > -'),
  }));
  const scripts = out.entry.scripts.map((x) => x.split('/').pop());
  if (!scripts.includes(EXPECT.game) || !scripts.includes(EXPECT.assets)) errors.push('entry scripts ' + out.entry.scripts.join(','));
  await page.screenshot({ path: join(ROOT, 'docs/revamp/b30-font/font-online-title-960.png') });
  out.screenshots.push('docs/revamp/b30-font/font-online-title-960.png');
  await page.evaluate(() => window.__game.scene.start('map', { chapter: 0 }));
  await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 15000 });
  await page.waitForTimeout(300);
  out.map960 = await page.evaluate(() => {
    const m = window.__game.scene.getScene('map');
    return { special: m.specialText.text, tier: m.tierLine(m.list[0], true), scroll: document.documentElement.scrollWidth };
  });
  await page.screenshot({ path: join(ROOT, 'docs/revamp/b30-font/font-online-map-960.png') });
  out.screenshots.push('docs/revamp/b30-font/font-online-map-960.png');
  await ctx.close();

  for (const [w, h, label] of [[640, 360, '640'], [844, 390, '844']]) {
    const c = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    p.on('pageerror', (e) => errors.push(label + ' PAGEERR ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(label + ' CONSOLE ' + m.text()); });
    await p.goto(SITE + `?v=fe1cc4c&debug=1&w=${label}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await p.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 45000 });
    await p.waitForTimeout(400);
    await p.evaluate(() => window.__game.scene.start('map', { chapter: 0 }));
    await p.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 15000 });
    await p.waitForTimeout(300);
    out[label] = await p.evaluate(() => {
      const m = window.__game.scene.getScene('map');
      return { special: m.specialText.text, tier: m.tierLine(m.list[0], true), scroll: document.documentElement.scrollWidth };
    });
    await p.screenshot({ path: join(ROOT, `docs/revamp/b30-font/font-online-map-${label}.png`) });
    out.screenshots.push(`docs/revamp/b30-font/font-online-map-${label}.png`);
    if (out[label].scroll > w) errors.push(label + ' overflow');
    await c.close();
  }

  for (const k of ['map960', '640', '844']) {
    if (!out[k]) continue;
    if (!/^特殊关卡 \d+ >$/.test(out[k].special)) errors.push(k + ' special ' + out[k].special);
    if (!/[●×—]/.test(out[k].tier)) errors.push(k + ' tier ' + out[k].tier);
  }

  // 直接抓线上字体，核对字节数（随后用 fontTools 另核 cmap）。
  const fp = await browser.newPage();
  out.font = await fp.evaluate(async (url) => {
    const r = await fetch(url, { cache: 'no-store' });
    const b = await r.arrayBuffer();
    return { status: r.status, bytes: b.byteLength };
  }, SITE + 'web/fonts/game.woff2');
  await fp.close();
  if (out.font.status !== 200 || out.font.bytes !== EXPECT.fontBytes) errors.push('font bytes ' + JSON.stringify(out.font));
} finally { await browser.close(); }

out.errors = errors;
out.passed = errors.length === 0;
mkdirSync(join(ROOT, 'docs/audit'), { recursive: true });
writeFileSync(join(ROOT, 'docs/audit/FONT-PAGES.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!out.passed) process.exitCode = 1;
