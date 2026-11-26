/* Pages 线上复核：入口 / 数据规模 / 10 房代表关 / 第 36 屏 + mireLampHerb / 0 pageerror。
 * 用法：node tools/audit_pages.mjs
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const SITE = 'https://elijah-lin-dancer.github.io/game-dev/';
const errors = [];
const out = {};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/chromium',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
await page.goto(SITE + '?debug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForFunction(() => window.__game && window.__chaptersData && window.__worldData, null, { timeout: 45000 });
await page.waitForTimeout(600);

out.entry = await page.evaluate(() => ({
  chapters: window.__chaptersData.chapters.length,
  stages: window.__chaptersData.chapters.reduce((n, c) => n + c.stages, 0),
  side: window.__chaptersData.side.length,
  hidden: window.__chaptersData.hidden.length,
  conditional: window.__chaptersData.conditional.length,
  screens: window.__worldData.screens.length,
  bosses: window.__worldData.bosses.length,
  scripts: [...document.querySelectorAll('script[src]')].map((x) => x.getAttribute('src')).filter((x) => /game|assets|vendor/.test(x)),
  sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
}));
if (out.entry.chapters !== 6 || out.entry.stages !== 36 || out.entry.screens !== 36 || out.entry.bosses !== 6) errors.push('entry counts');

// 代表关：第五章第 9 关，10 房；逐房到 Boss，再结算写星。
await page.evaluate(() => {
  const g = window.__game;
  if (g.scene.isActive('play')) g.scene.stop('play');
  g.scene.start('play', { char: 'ninja', difficulty: 'normal', stage: { chapter: 'lava', chapterName: '熔岩地心', index: 9 } });
});
await page.waitForFunction(() => window.__playScene && window.__playScene.spec && window.__playScene.spec.key === 'lava:9' && window.__state && window.__state.stageKey === 'lava:9', null, { timeout: 30000 });
await page.waitForTimeout(200);
out.stage = await page.evaluate(() => ({ key: window.__playScene.spec.key, rooms: window.__playScene.spec.rooms, plan: window.__dbg.plan(), total: window.__state.total }));
for (let r = 1; r < 10; r += 1) {
  const moved = await page.evaluate(() => window.__dbg.next());
  if (!moved) { errors.push('lava:9 next stopped at ' + r); break; }
  await page.waitForTimeout(120);
  const idx = await page.evaluate(() => window.__state.roomIdx);
  if (idx !== r + 1) errors.push('lava:9 room ' + idx + ' != ' + (r + 1));
}
await page.evaluate(() => window.__dbg.win());
await page.waitForTimeout(200);
out.stage.save = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('na.save') || '{}');
  return { v: s.v, star: s.stars && s.stars['lava:9'] };
});

// 世界：装第 36 屏全 done 存档，核对 mire-6 / mireLampHerb。
await page.evaluate(() => localStorage.setItem('na.world', JSON.stringify({
  v: 16, visited: ['field-1','field-2','field-3','field-4','field-5','field-6','bamboo-1','bamboo-2','bamboo-3','bamboo-4','bamboo-5','bamboo-6','desert-1','desert-2','desert-3','desert-4','desert-5','desert-6','snow-1','snow-2','snow-3','snow-4','snow-5','snow-6','volcano-1','volcano-2','volcano-3','volcano-4','volcano-5','volcano-6','mire-1','mire-2','mire-3','mire-4','mire-5','mire-6'],
  herbs: 0, quest: 'done', fieldQuest2: 'done', bambooHerbs: 0, bambooQuest: 'done', bambooQuest2: 'done',
  desertHerbs: 0, desertQuest: 'done', desertQuest2: 'done', snowHerbs: 0, snowQuest: 'done', snowQuest2: 'done',
  volcanoHerbs: 0, volcanoQuest: 'done', volcanoQuest2: 'done', volcanoVents: [],
  mireHerbs: 7, mireQuest: 'done', mireQuest2: 'done', lampQuest: 'active', lampHerbs: 0,
  expedition: 1, boss: 'done', bosses: { mossBeast: 'done', bambooMirage: 'done', sandMirage: 'done', frostOwl: 'done', magmaColossus: 'done', mireWraith: 'done' }, tokens: 20,
})));
await page.goto(SITE + 'index.html?world&debug=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForFunction(() => window.__world && window.__world.screens && window.__world.screens.length === 36, null, { timeout: 30000 });
await page.waitForTimeout(500);
out.world = await page.evaluate(() => {
  const w = window.__world;
  w.applyScreen(35);
  return {
    screenIndex: w.screenIndex, screenId: w.screenId,
    lampTex: w.textures.exists('mireLampHerb'),
    lampNodes: w.herbs.filter((n) => n.screenIndex === 35 && n.lampOnly).length,
    hud: w.hudPlace && w.hudPlace.text,
    visible: w.children.list.filter((o) => o.visible && o.depth >= 0).length,
    missing: (() => { const seen = new Set(); const m = []; w.children.list.forEach((o) => { const k = o.texture && o.texture.key; if (k && k.indexOf('__') !== 0 && !seen.has(k)) { seen.add(k); if (!w.textures.exists(k)) m.push(k); } }); return m; })(),
  };
});
if (out.world.screenIndex !== 35 || !out.world.lampTex || out.world.missing.length) errors.push('world check');

out.errors = errors;
out.passed = errors.length === 0;
mkdirSync(resolve(ROOT, 'docs/audit'), { recursive: true });
writeFileSync(resolve(ROOT, 'docs/audit/PAGES-AUDIT.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
