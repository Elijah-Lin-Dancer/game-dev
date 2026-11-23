/* 批 17 冒烟：构建后 3 分钟内跑完标题→地图→选人→战斗、存档、触屏按键。
 *
 * 用法：npm run build && node tools/smoke.mjs
 * 本脚本自带静态服务器，不依赖 python / MCP；Chromium 可用 CHROME_PATH 覆盖。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.css': 'text/css; charset=utf-8',
};

function serve() {
  return new Promise((done) => {
    const server = createServer((req, res) => {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = raw === '/' ? '/index.html' : raw;
      const file = resolve(join(ROOT, normalize(rel)));
      if (!file.startsWith(ROOT + '/') || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => done(server));
  });
}

async function waitFor(page, fn, ms = 15000) {
  await page.waitForFunction(fn, null, { timeout: ms });
}

async function main() {
  if (!existsSync(join(ROOT, 'index.html')) || !existsSync(join(ROOT, 'dist'))) {
    throw new Error('缺少构建产物：先运行 npm run build');
  }
  const server = await serve();
  const port = server.address().port;
  const chrome = [process.env.CHROME_PATH, '/usr/local/bin/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome']
    .find((p) => p && existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chrome ? { executablePath: chrome } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--no-proxy-server'],
  });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  const base = `http://127.0.0.1:${port}`;
  const pass = (msg) => console.log('PASS ' + msg);

  try {
    await page.goto(`${base}/index.html?debug=1`, { waitUntil: 'load', timeout: 20000 });
    await waitFor(page, () => window.__game && window.__storyData?.story?.nodes?.length === 9);
    const boot = await page.evaluate(() => ({
      active: window.__game.scene.getScenes(true).map((s) => s.scene.key),
      story: window.__storyData.story.nodes.length,
      chars: window.__charsData.length,
      v: JSON.parse(localStorage.getItem('na.save') || '{}').v,
    }));
    if (boot.story !== 9 || boot.chars !== 3) throw new Error('数据装载失败 ' + JSON.stringify(boot));
    pass('Title / story 9 / chars 3');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    if (await page.evaluate(() => window.__game.scene.isActive('story'))) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    await waitFor(page, () => window.__game.scene.isActive('map'));
    pass('Title → Map');

    await page.evaluate(() => { const m = window.__game.scene.getScene('map'); m.activate(); });
    await page.waitForTimeout(120);
    await page.evaluate(() => { const m = window.__game.scene.getScene('map'); m.activate(); });
    await waitFor(page, () => window.__game.scene.isActive('select'));
    pass('Map 章节 → Select');
    await page.evaluate(() => { const s = window.__game.scene.getScene('select'); s.confirm(); });
    await waitFor(page, () => window.__game.scene.isActive('play'));
    pass('Select → Play');

    const before = await page.evaluate(() => ({ x: window.__playScene.player.x, atk: window.__playScene.atkAt }));
    await page.keyboard.down('d');
    await page.waitForTimeout(450);
    await page.keyboard.up('d');
    const moved = await page.evaluate(() => window.__playScene.player.x);
    if (!(moved > before.x + 8)) throw new Error('WASD 未移动 ' + before.x + ' → ' + moved);
    pass('WASD 移动');

    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const atk = await page.evaluate(() => window.__playScene.atkAt);
    if (!(atk > before.atk)) throw new Error('攻击未触发');
    pass('攻击');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    const paused = await page.evaluate(() => ({ paused: window.__playScene.paused, panel: !!window.__playScene.pausePanel }));
    if (!paused.paused || !paused.panel) throw new Error('暂停未打开');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    if (await page.evaluate(() => window.__playScene.paused)) throw new Error('暂停未恢复');
    pass('暂停 / 恢复');

    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('na.save')));
    if (save.v !== 11) throw new Error('存档版本不是 v11');
    pass('存档 v11 / runs ' + save.runs);

    // 触屏：独立上下文，检查按钮存在、攻击命中、不误触摇杆
    const touchPage = await browser.newPage({
      viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true,
    });
    touchPage.on('pageerror', (e) => errors.push('TOUCHERR ' + e.message));
    await touchPage.goto(`${base}/index.html?debug=1`, { waitUntil: 'load', timeout: 20000 });
    await waitFor(touchPage, () => window.__game && window.__game.scene.isActive('title'));
    await touchPage.evaluate(() => window.__game.scene.start('play', { char: 'ninja' }));
    await waitFor(touchPage, () => window.__playScene);
    await touchPage.waitForTimeout(1000);
    await touchPage.bringToFront();
    const touch = await touchPage.evaluate(() => {
      const g = window.__playScene;
      const rect = document.querySelector('canvas').getBoundingClientRect();
      const s = g.scale;
      const at = g.touchCtl.items.find((it) => it.id === 'attack');
      return {
        has: !!g.touchCtl,
        css: { x: rect.left + at.x * rect.width / s.width, y: rect.top + at.y * rect.height / s.height },
        atk: g.atkAt,
      };
    });
    if (!touch.has) throw new Error('触屏没有创建 TouchControls');
    await touchPage.touchscreen.tap(touch.css.x, touch.css.y);
    await touchPage.waitForTimeout(200);
    const touchAfter = await touchPage.evaluate(() => ({
      atk: window.__playScene.atkAt, press: window.__playScene.press, stick: window.__playScene.stick.active,
    }));
    if (!(touchAfter.atk > touch.atk) || touchAfter.press || touchAfter.stick) {
      throw new Error('触屏攻击或摇杆互斥失败 ' + JSON.stringify(touchAfter));
    }
    pass('触屏攻击 / 摇杆互斥');
    await touchPage.close();
  } finally {
    await browser.close();
    server.close();
  }
  if (errors.length) throw new Error('控制台错误：' + errors.slice(0, 8).join(' | '));
  console.log('SMOKE OK');
}

main().catch((e) => {
  console.error('SMOKE FAIL ' + e.message);
  process.exitCode = 1;
});
