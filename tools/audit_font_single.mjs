/* 单文件字体 / HUD 冒烟：file:// 打开 web/game.html，进入 Map 并截图。 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const out = { errors: [], screenshot: 'docs/revamp/b30-font/font-map-single-960.png' };
const browser = await chromium.launch({ headless: true, executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--disable-gpu', '--no-proxy-server'] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => out.errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') out.errors.push('CONSOLE ' + m.text()); });
  await page.goto(pathToFileURL(join(ROOT, 'web/game.html')).href + '?debug=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 30000 });
  await page.waitForTimeout(350);
  await page.evaluate(() => window.__game.scene.start('map', { chapter: 0 }));
  await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 15000 });
  await page.waitForTimeout(300);
  out.info = await page.evaluate(() => {
    const m = window.__game.scene.getScene('map');
    return { special: m.specialText.text, tier: m.tierLine(m.list[0], true), scroll: document.documentElement.scrollWidth, fontCheck: document.fonts.check('12px NinjaPixel', '● × > -') };
  });
  await page.screenshot({ path: join(ROOT, out.screenshot) });
  if (out.info.scroll > 960) out.errors.push('overflow ' + out.info.scroll);
  if (!/^特殊关卡 \d+ >$/.test(out.info.special)) out.errors.push('special ' + out.info.special);
} finally { await browser.close(); }
out.passed = out.errors.length === 0;
writeFileSync(join(ROOT, 'docs/audit/FONT-SINGLE.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!out.passed) process.exitCode = 1;
