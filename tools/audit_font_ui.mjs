/* HUD 字形 / 界面截图：Title 与 Map（960 / 640 / 844），并核对 map 文案已改用字体支持的符号。 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const out = { screenshots: [], errors: [] };
const server = await new Promise((done) => {
  const s = createServer((req, res) => {
    const raw = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = resolve(join(ROOT, normalize(raw === '/' ? '/index.html' : raw)));
    if (!file.startsWith(ROOT + '/') || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  s.listen(0, '127.0.0.1', () => done(s));
});
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--disable-gpu', '--no-proxy-server'] });
mkdirSync(join(ROOT, 'docs/revamp/b30-font'), { recursive: true });
try {
  for (const [w, h, label] of [[960, 540, '960'], [640, 360, '640'], [844, 390, '844']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => out.errors.push('PAGEERR ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') out.errors.push('CONSOLE ' + m.text()); });
    await page.goto(base + '/index.html?debug=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 30000 });
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(ROOT, `docs/revamp/b30-font/font-title-${label}.png`) });
    out.screenshots.push(`docs/revamp/b30-font/font-title-${label}.png`);
    await page.evaluate(() => {
      const g = window.__game;
      g.scene.start('map', { chapter: 0 });
    });
    await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 15000 });
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => {
      const m = window.__game.scene.getScene('map');
      return {
        special: m.specialText && m.specialText.text,
        tier: m.tierLine(m.list[0], true),
        start: m.pStart && m.pStart.label && m.pStart.label.text,
        scroll: document.documentElement.scrollWidth,
        fontCheck: document.fonts.check('12px NinjaPixel', '● × > -'),
      };
    });
    await page.screenshot({ path: join(ROOT, `docs/revamp/b30-font/font-map-${label}.png`) });
    out.screenshots.push(`docs/revamp/b30-font/font-map-${label}.png`);
    out[label] = { ...info, viewport: [w, h] };
    if (!/^特殊关卡 \d+ >$/.test(info.special || '')) out.errors.push(label + ' special text ' + info.special);
    if (!/[●×—]/.test(info.tier || '')) out.errors.push(label + ' tier glyph ' + info.tier);
    if ((info.scroll || 0) > w) out.errors.push(label + ' overflow ' + info.scroll);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
out.passed = out.errors.length === 0;
writeFileSync(join(ROOT, 'docs/audit/FONT-UI.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!out.passed) process.exitCode = 1;
