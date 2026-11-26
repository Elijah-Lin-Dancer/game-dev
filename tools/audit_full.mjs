/* 全案收口审计：49 关结构 / 结算写档 + 36 屏逐屏 + Boss 六屏 + 跨屏边界。
 *
 * 用法：npm run build && node tools/audit_full.mjs
 * 可选：LIMIT=3 WORLD_ONLY=1
 * 产物：docs/audit/FULL-AUDIT.json、终端 PASS/FAIL。
 *
 * 说明：49 关不是手打全通；本脚本逐关启动真实 Play 场景，核对房间表 / 末房 Boss /
 * 纹理完整 / 结算星级写入。玩法操作回归仍由各批验收负责。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const LIMIT = Number(process.env.LIMIT || 0) || 0;
const WORLD_ONLY = process.env.WORLD_ONLY === '1';
const STAGE_ONLY = process.env.STAGE_ONLY === '1';

const chaptersData = JSON.parse(readFileSync(join(ROOT, 'web/data/chapters.json'), 'utf8'));
const worldData = JSON.parse(readFileSync(join(ROOT, 'web/data/world.json'), 'utf8'));
const bossData = JSON.parse(readFileSync(join(ROOT, 'web/data/bosses.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.css': 'text/css',
};
const results = { startedAt: new Date().toISOString(), stages: [], screens: [], bosses: [], transitions: [], errors: [] };
const fail = (scope, msg) => { results.errors.push(scope + ': ' + msg); console.log('FAIL ' + scope + ' ' + msg); };

function serve() {
  return new Promise((done) => {
    const server = createServer((req, res) => {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = raw === '/' ? '/index.html' : raw;
      const file = resolve(join(ROOT, normalize(rel)));
      if (!file.startsWith(ROOT + '/') || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => done(server));
  });
}

const wait = (page, fn, arg = null, ms = 20000) => page.waitForFunction(fn, arg, { timeout: ms });
const keyOf = (entry) => entry.special ? 'sp_' + entry.special + ':1' : entry.chapter + ':' + entry.index;

function stageList() {
  const out = [];
  chaptersData.chapters.forEach((c) => {
    for (let i = 1; i <= c.stages; i += 1) {
      out.push({ chapter: c.id, chapterName: c.name, index: i, key: c.id + ':' + i, rooms: c.rooms[i - 1], kind: 'main' });
    }
  });
  ['side', 'hidden', 'conditional'].forEach((type) => {
    (chaptersData[type] || []).forEach((s) => {
      out.push({ special: s.id, chapterName: s.name, index: 1, key: 'sp_' + s.id + ':1', rooms: s.rooms, kind: type });
    });
  });
  return out;
}

function saveFixtures() {
  const bossIds = ['mossBeast', 'bambooMirage', 'sandMirage', 'frostOwl', 'magmaColossus', 'mireWraith'];
  const screenIds = worldData.screens.map((s) => s.id);
  const base = {
    v: 16, visited: screenIds, herbs: 0, quest: 'done',
    fieldQuest2: 'done', bambooHerbs: 0, bambooQuest: 'done', bambooQuest2: 'done',
    desertHerbs: 0, desertQuest: 'done', desertQuest2: 'done',
    snowHerbs: 0, snowQuest: 'done', snowQuest2: 'done',
    volcanoHerbs: 0, volcanoQuest: 'done', volcanoQuest2: 'done', volcanoVents: [],
    mireHerbs: 0, mireQuest: 'done', mireQuest2: 'done',
    lampQuest: 'active', lampHerbs: 0, expedition: 1, boss: 'none', tokens: 20,
  };
  const allDone = { ...base, bosses: Object.fromEntries(bossIds.map((id) => [id, 'done'])) };
  const freshBoss = { ...base, bosses: Object.fromEntries(bossIds.map((id) => [id, 'none'])) };
  return { allDone, freshBoss };
}
const WORLD_SAVE = saveFixtures();

async function openPage(browser, base, width, height, world = false) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => results.errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') results.errors.push('CONSOLE ' + m.text()); });
  const url = `${base}/index.html?${world ? 'world&' : ''}debug=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await wait(page, () => window.__game && window.__chaptersData && window.__worldData);
  return { ctx, page };
}

async function runStages(browser, base) {
  const all = stageList();
  const limited = LIMIT ? all.slice(0, LIMIT) : all;
  const { ctx, page } = await openPage(browser, base, 960, 540);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(page, () => window.__game && window.__chaptersData);
  console.log(`STAGES expect=${all.length} run=${limited.length}`);

  for (const entry of limited) {
    const payload = entry.special
      ? { special: entry.special, chapterName: entry.chapterName, label: entry.kind + ' · ' + entry.chapterName, index: 1 }
      : { chapter: entry.chapter, chapterName: entry.chapterName, index: entry.index };
    try {
      await page.evaluate((p) => {
        const g = window.__game;
        if (g.scene.isActive('play')) g.scene.stop('play');
        g.scene.start('play', { char: 'ninja', stage: p, difficulty: 'normal' });
      }, payload);
      await wait(page, (key) => {
        const s = window.__playScene;
        return !!(s && s.spec && s.spec.key === key && s.scene.isActive() && window.__state && window.__state.stageKey === key);
      }, entry.key, 15000);
      await page.waitForTimeout(140);
      const info = await page.evaluate(() => {
        const g = window.__playScene;
        const seen = new Set();
        const missing = [];
        g.children.list.forEach((o) => {
          const k = o.texture && o.texture.key;
          if (!k || k.indexOf('__') === 0) return;
          if (!seen.has(k)) { seen.add(k); if (!g.textures.exists(k)) missing.push(k); }
        });
        return {
          key: g.spec.key, name: g.spec.chapterName, rooms: g.spec.rooms,
          stageRooms: window.__state.stageRooms, plan: window.__dbg.plan(),
          bossPool: g.spec.bossPool, roomType: window.__state.roomType,
          doors: window.__state.doors, textures: seen.size, missing,
          roomIdx: window.__state.roomIdx, total: window.__state.total,
          stageDiff: window.__state.stageDiff,
        };
      });
      const plan = info.plan || [];
      const issues = [];
      if (info.key !== entry.key) issues.push('key ' + info.key);
      if (info.stageRooms !== entry.rooms) issues.push('stageRooms ' + info.stageRooms + ' != ' + entry.rooms);
      if (plan.length !== entry.rooms) issues.push('plan length ' + plan.length);
      if (!plan.length || !plan[plan.length - 1].endsWith(':boss')) issues.push('last room not boss: ' + plan[plan.length - 1]);
      if (plan.filter((p) => p.endsWith(':boss')).length !== 1) issues.push('boss room count != 1');
      if (!info.bossPool || !info.bossPool.length) issues.push('empty bossPool');
      if (info.total !== entry.rooms) issues.push('state.total ' + info.total);
      if (info.missing.length) issues.push('missing textures ' + info.missing.join(','));
      // 逐房走完 328 间：用真实 __dbg.next() 强制走过门，不直接跳结算。
      const rooms = [];
      for (let r = 0; r < entry.rooms; r += 1) {
        if (r > 0) {
          const moved = await page.evaluate(() => window.__dbg.next());
          if (!moved) { issues.push('next stopped at room ' + r); break; }
          await page.waitForTimeout(40);
        }
        const room = await page.evaluate(() => {
          const s = window.__state;
          const g = window.__playScene;
          const missing = [];
          g.children.list.forEach((o) => {
            const k = o.texture && o.texture.key;
            if (k && k.indexOf('__') !== 0 && !g.textures.exists(k)) missing.push(k);
          });
          return { idx: s.roomIdx, type: s.roomType, missing, win: s.won, hp: s.hp };
        });
        rooms.push(room);
        if (room.idx !== r + 1) issues.push('room idx ' + room.idx + ' != ' + (r + 1));
        if (room.missing.length) issues.push('room textures ' + room.missing.join(','));
      }
      if (rooms.length !== entry.rooms) issues.push('rooms visited ' + rooms.length + '/' + entry.rooms);
      if (rooms.length && rooms[rooms.length - 1].type !== 'boss') issues.push('last room type ' + rooms[rooms.length - 1].type);
      // 结算写档：真实 win() 路径，不伪造 star 值。
      await page.evaluate(() => window.__dbg.win());
      await page.waitForTimeout(80);
      const save = await page.evaluate(() => JSON.parse(localStorage.getItem('na.save') || '{}'));
      if (!(save.stars && save.stars[entry.key] >= 1)) issues.push('star not written');
      if (save.v !== 11) issues.push('save v ' + save.v);
      results.stages.push({ ...entry, pass: issues.length === 0, issues, plan, textures: info.textures, roomsVisited: rooms.length, roomTypes: rooms.map((r) => r.type), stageDiff: info.stageDiff });
      console.log((issues.length ? 'FAIL ' : 'PASS ') + entry.key + ' ' + entry.chapterName + ' rooms=' + entry.rooms + ' plan=' + plan.join(','));
    } catch (e) {
      results.stages.push({ ...entry, pass: false, issues: [String(e.message || e)] });
      fail('stage ' + entry.key, String(e.message || e));
    }
  }
  await ctx.close();
  return all.length;
}

async function setWorld(page, save, base) {
  await page.goto(`${base}/index.html?world&debug=1`, { waitUntil: 'domcontentloaded' });
  await wait(page, () => window.__game && window.__worldData);
  await page.evaluate((s) => localStorage.setItem('na.world', JSON.stringify(s)), save);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(page, () => window.__world && window.__world.screens && window.__world.screens.length === 36);
  await page.waitForTimeout(300);
}

async function screenInfo(page, i) {
  return page.evaluate((idx) => {
    const w = window.__world;
    const s = w.screens[idx];
    w.applyScreen(idx);
    const wy = (w.scale.height - 272) / 2;
    w.player.setPosition(s.x + 240, wy + 200);
    w.player.shadow.setPosition(w.player.x, w.player.y - 2);
    w.cameras.main.scrollX = Math.max(0, Math.min(w.worldWidth - w.scale.width, s.x + 240 - w.scale.width / 2));
    w.updateLayer(true);
    w.updateHud();
    const seen = new Set();
    const missing = [];
    w.children.list.forEach((o) => {
      const k = o.texture && o.texture.key;
      if (!k || k.indexOf('__') === 0) return;
      if (!seen.has(k)) { seen.add(k); if (!w.textures.exists(k)) missing.push(k); }
    });
    return {
      id: s.id, name: s.name, biome: s.biome, index: w.screenIndex,
      hud: w.hudPlace && w.hudPlace.text, weather: w.hudWeather && w.hudWeather.text,
      visible: w.children.list.filter((o) => o.visible && o.depth >= 0).length,
      textures: seen.size, missing,
      herbs: w.herbs.filter((n) => n.screenIndex === idx).length,
      npcs: w.npcs.filter((n) => n.screenIndex === idx).length,
      camps: w.campfires.filter((c) => c.screenIndex === idx).length,
      scroll: document.documentElement.scrollWidth,
      playerX: Math.round(w.player.x), playerY: Math.round(w.player.y),
      lampTex: w.textures.exists('mireLampHerb'),
    };
  }, i);
}

async function runWorld(browser, base) {
  console.log('WORLD screens=36');
  for (const [width, height, label] of [[960, 540, '960'], [640, 360, '640'], [844, 390, '844']]) {
    const { ctx, page } = await openPage(browser, base, width, height, true);
    await setWorld(page, WORLD_SAVE.allDone, base);
    for (let i = 0; i < 36; i += 1) {
      try {
        const info = await screenInfo(page, i);
        const expected = worldData.screens[i];
        const issues = [];
        if (info.id !== expected.id) issues.push('id ' + info.id);
        if (info.index !== i) issues.push('index ' + info.index);
        if (!info.hud || info.hud.indexOf(expected.weatherName) < 0 || info.hud.indexOf(`第 ${i + 1}/36 屏`) < 0) issues.push('hud ' + info.hud);
        if (info.visible < 8) issues.push('visible objects ' + info.visible);
        if (info.missing.length) issues.push('missing textures ' + info.missing.join(','));
        if (!info.lampTex) issues.push('mireLampHerb missing');
        if (info.scroll > width) issues.push('overflow ' + info.scroll + ' > ' + width);
        results.screens.push({ width: label, ...info, pass: issues.length === 0, issues, expected: expected.id });
        console.log((issues.length ? 'FAIL ' : 'PASS ') + label + ' ' + expected.id + ' objects=' + info.visible + ' tex=' + info.textures + ' herb=' + info.herbs);
      } catch (e) {
        results.screens.push({ width: label, expected: worldData.screens[i].id, pass: false, issues: [String(e.message || e)] });
        fail('screen ' + label + ' ' + worldData.screens[i].id, String(e.message || e));
      }
    }
    await ctx.close();
  }
  // 边界：35 条相邻屏通道，真实走 update 的 screenIndex 检查。
  const { ctx, page } = await openPage(browser, base, 960, 540, true);
  await setWorld(page, WORLD_SAVE.allDone, base);
  for (let i = 0; i < 35; i += 1) {
    try {
      const info = await page.evaluate((idx) => {
        const w = window.__world;
        const s = w.screens[idx];
        const wy = (w.scale.height - 272) / 2;
        w.applyScreen(idx);
        w.player.setPosition(s.x + 479, wy + 200);
        w.player.shadow.setPosition(w.player.x, w.player.y - 2);
        w.update(1);
        return { from: s.id, to: w.screenId, index: w.screenIndex };
      }, i);
      const issues = info.index !== i + 1 || info.to !== worldData.screens[i + 1].id ? ['transition ' + JSON.stringify(info)] : [];
      results.transitions.push({ from: info.from, to: info.to, index: info.index, pass: issues.length === 0, issues });
      console.log((issues.length ? 'FAIL ' : 'PASS ') + 'edge ' + info.from + ' -> ' + info.to);
    } catch (e) {
      results.transitions.push({ from: worldData.screens[i].id, pass: false, issues: [String(e.message || e)] });
      fail('edge ' + worldData.screens[i].id, String(e.message || e));
    }
  }
  await ctx.close();
}

async function runBosses(browser, base) {
  const { ctx, page } = await openPage(browser, base, 960, 540, true);
  await setWorld(page, WORLD_SAVE.freshBoss, base);
  for (const def of (worldData.bosses || [])) {
    try {
      const i = worldData.screens.findIndex((s) => s.id === def.screen);
      const info = await page.evaluate((idx) => {
        const w = window.__world;
        w.applyScreen(idx);
        return {
          id: w.boss && w.boss.id, active: w.bossActive, dead: w.bossDead,
          gate: !!w.bossGate, visible: !!(w.boss && w.boss.spr && w.boss.spr.visible),
          screen: w.screenId,
        };
      }, i);
      const issues = [];
      if (info.screen !== def.screen) issues.push('screen ' + info.screen);
      if (!info.id || info.id !== def.id) issues.push('boss ' + info.id);
      if (def.bossGate) {
        if (info.active) issues.push('gated boss active');
        if (!info.gate) issues.push('gate missing');
        if (info.visible) issues.push('gated boss visible');
      } else if (!info.active || info.dead) issues.push('boss not active');
      results.bosses.push({ screen: def.screen, boss: def.id, gate: !!def.bossGate, ...info, pass: issues.length === 0, issues });
      console.log((issues.length ? 'FAIL ' : 'PASS ') + 'boss ' + def.screen + ' / ' + def.id + ' gate=' + !!def.bossGate);
    } catch (e) {
      results.bosses.push({ screen: def.screen, boss: def.id, pass: false, issues: [String(e.message || e)] });
      fail('boss ' + def.screen, String(e.message || e));
    }
  }
  await ctx.close();
}

async function main() {
  if (!existsSync(join(ROOT, 'dist/game.61c24f45.js'))) console.log('WARN dist entry not the G4-9 hash');
  const server = await serve();
  const port = server.address().port;
  const chrome = [process.env.CHROME_PATH, '/usr/local/bin/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => p && existsSync(p));
  const browser = await chromium.launch({
    headless: true, ...(chrome ? { executablePath: chrome } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--no-proxy-server'],
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    if (!WORLD_ONLY) await runStages(browser, base);
    if (!STAGE_ONLY) {
      await runWorld(browser, base);
      await runBosses(browser, base);
    }
  } finally {
    await browser.close();
    server.close();
  }
  results.finishedAt = new Date().toISOString();
  results.summary = {
    stagesExpected: stageList().length,
    stagesRun: results.stages.length,
    stagesPass: results.stages.filter((r) => r.pass).length,
    screensExpected: 36 * 3,
    screensPass: results.screens.filter((r) => r.pass).length,
    bossesPass: results.bosses.filter((r) => r.pass).length,
    transitionsPass: results.transitions.filter((r) => r.pass).length,
  };
  mkdirSync(join(ROOT, 'docs/audit'), { recursive: true });
  writeFileSync(join(ROOT, 'docs/audit/FULL-AUDIT.json'), JSON.stringify(results, null, 2));
  console.log('SUMMARY ' + JSON.stringify(results.summary));
  const bad = results.errors.length + results.stages.filter((r) => !r.pass).length
    + results.screens.filter((r) => !r.pass).length + results.bosses.filter((r) => !r.pass).length
    + results.transitions.filter((r) => !r.pass).length;
  if (bad) { console.log('AUDIT FAIL ' + bad); process.exitCode = 1; } else console.log('AUDIT OK');
}

await main();
