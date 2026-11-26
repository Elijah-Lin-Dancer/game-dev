/* 第一章实机输入试点：真实键盘移动 / 攻击 / 过门 / 天赋选择；不调用 __dbg.next() / __dbg.win()。
 * 用法：node tools/playtest_ch1.mjs --stages=1
 * 产物：docs/audit/PLAYTEST-CH1.json + docs/revamp/playtest/ 截图。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const TILE = 32, COLS = 24, ROWS = 26;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const args = process.argv.slice(2);
const opt = (name, dflt) => { const a = args.find((x) => x.startsWith('--' + name + '=')); return a ? a.split('=')[1] : dflt; };
const STAGES = Math.max(1, Math.min(5, Number(opt('stages', 5)) || 5));
const STAGE_TIMEOUT = Number(opt('stageTime', 150000));
const MAX_ATTEMPTS = Math.max(1, Math.min(5, Number(opt('attempts', 3)) || 3));
const out = { stages: [], errors: [], mode: 'real-keyboard-input', notes: 'Real movement / attack / doors / talent panel; no __dbg.next or __dbg.win.' };

function serve() {
  return new Promise((done) => {
    const s = createServer((req, res) => {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = resolve(join(ROOT, normalize(raw === '/' ? '/index.html' : raw)));
      if (!file.startsWith(ROOT + '/') || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => done(s));
  });
}

function keyFor(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'd' : 'a';
  return dy > 0 ? 's' : 'w';
}
function tileOf(x, y) { return [Math.max(1, Math.min(COLS - 1, Math.floor(x / TILE))), Math.max(1, Math.min(ROWS - 1, Math.floor(y / TILE)))]; }
function pathTo(walls, sx, sy, gx, gy) {
  const wall = (x, y) => walls.has(x + ',' + y) || x < 1 || x >= COLS - 1 || y < 1 || y >= ROWS - 1;
  if (wall(gx, gy)) return null;
  const q = [[sx, sy]], prev = new Map(), seen = new Set([sx + ',' + sy]);
  while (q.length) {
    const [x, y] = q.shift();
    if (x === gx && y === gy) {
      const p = [];
      let k = x + ',' + y;
      while (k !== sx + ',' + sy) { p.push(k.split(',').map(Number)); k = prev.get(k); }
      p.reverse();
      return p;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = nx + ',' + ny;
      if (seen.has(nk) || wall(nx, ny)) continue;
      seen.add(nk); prev.set(nk, x + ',' + y); q.push([nx, ny]);
    }
  }
  return null;
}
// 下一步先对齐格子中心，再横/纵移动；否则贴着墙角会一直顶墙。
function stepKey(s, path) {
  if (!path || !path.length) return null;
  const [nx, ny] = path[0];
  const [sx, sy] = tileOf(s.px, s.py);
  const cx = sx * TILE + TILE / 2, cy = sy * TILE + TILE / 2;
  if (nx !== sx) {
    if (Math.abs(s.py - cy) > 4) return s.py < cy ? 's' : 'w';
    return nx > sx ? 'd' : 'a';
  }
  if (ny !== sy) {
    if (Math.abs(s.px - cx) > 4) return s.px < cx ? 'd' : 'a';
    return ny > sy ? 's' : 'w';
  }
  return null;
}

// 敌人可能贴墙；直接目标不可达时，退而求其次走到它四周的空格，再从那里攻击。
function pathNear(walls, sx, sy, gx, gy) {
  let best = null;
  for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const p = pathTo(walls, sx, sy, gx + ox, gy + oy);
    if (p && (!best || p.length < best.length)) best = p;
  }
  return best;
}

async function state(page) {
  return page.evaluate(() => {
    const p = window.__playScene, st = window.__state;
    const pnl = window.__dbg && window.__dbg.panel && window.__dbg.panel();
    const foes = window.__dbg && window.__dbg.foes ? window.__dbg.foes().filter((e) => e.hp > 0) : [];
    return {
      hp: st.hp, maxHp: st.maxHp, px: st.px, py: st.py, roomIdx: p.room.idx, roomKey: p.roomKey, roomType: p.room.type || 'battle',
      roomTotal: st.total, cleared: !!p.room.cleared, doors: Object.keys(p.room.doors || {}), walls: Array.from(p.walls || []),
      nextDoors: Object.entries(p.room.doors || {}).map(([dir, key]) => { const r = p.dungeon && p.dungeon.rooms && p.dungeon.rooms.get(key); return { dir, targetIdx: r ? r.idx : -1 }; }).filter((x) => x.targetIdx > p.room.idx),
      enemies: foes, dead: !!p.dead, won: !!p.won, panelOpen: !!p.panelOpen, panelType: pnl && pnl.type,
      talking: !!p.talking, facing: p.facing, stageKey: st.stageKey, weapon: st.weapon, kills: st.kills,
      coins: st.coins, gems: st.gems, boss: foes.find((e) => e.k === 'boss' || e.k === 'bossB' || e.k === 'racoonBoss' || e.k === 'mireWraith' || e.k === 'frostOwl' || e.k === 'magmaColossus' || e.k === 'bambooMirage' || e.k === 'sandMirage' || e.k === 'mossBeast'),
      bossHp: st.bossHp, iframe: st.iframe, qready: !!(p.char && p.char.skill && p.time.now - p.skillAt >= p.char.skill.cd), qleft: p.char && p.char.skill ? Math.max(0, Math.round(p.char.skill.cd - (p.time.now - p.skillAt))) : 0,
      bossInfo: window.__dbg && window.__dbg.bossInfo ? window.__dbg.bossInfo() : null,
      bossKind: window.__dbg && window.__dbg.bossKind ? window.__dbg.bossKind() : '',
      props: window.__dbg && window.__dbg.props ? window.__dbg.props().filter((x) => !x.used) : [],
      panelLabels: pnl && pnl.opts ? pnl.opts.map((o) => (typeof o === 'string' ? o : (o.label || ''))) : [],
      shots: (p.shots || []).map((x) => ({ x: x.spr.x, y: x.spr.y, vx: x.vx, vy: x.vy })),
      drops: window.__dbg && window.__dbg.dropList ? window.__dbg.dropList() : [],
    };
  });
}

async function chooseTalent(page) {
  const p = await page.evaluate(() => (window.__dbg && window.__dbg.panel ? window.__dbg.panel() : null));
  if (!p || !p.opts || !p.opts.length) return null;
  // 按生存权重选卡，模拟“想通关的玩家”，而不是盲选第一张。
  // 第一章 maxHp 只有 20，连续拿血契/孤注一掷/玻璃大炮会把容错压到 12–16，机器人无法稳定验证关卡。
  const score = { 厚皮: 8, 稳手: 7, 铁胃: 6, 吸血: 5, 狂战: 4, 重击: 4, 快手: 3, 疾风: 3, 拾荒: 1, 贪婪: 0, 轻步: 0, 玻璃大炮: -4, 孤注一掷: -5, 血契: -4 };
  const labels = p.opts.map((o) => (typeof o === 'string' ? o : (o.label || '')));
  let best = 0, bestScore = -99;
  labels.forEach((l, i) => { const v = score[l] == null ? 2 : score[l]; if (v > bestScore) { bestScore = v; best = i; } });
  await page.keyboard.press(String(best + 1));
  await page.waitForTimeout(180);
  return labels[best];
}

async function openSelect(page) {
  // Map.activate 有时首次只播转场；沿用 smoke 的二次激活，确保进入 Select。
  await page.evaluate(() => { const m = window.__game.scene.getScene('map'); m.activate(); });
  await page.waitForTimeout(140);
  await page.evaluate(() => { const m = window.__game.scene.getScene('map'); m.activate(); });
  await page.waitForFunction(() => window.__game.scene.isActive('select'), null, { timeout: 15000 });
}

async function startFirstStage(page) {
  await page.goto(`${page.__base}/index.html?debug=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  if (await page.evaluate(() => window.__game.scene.isActive('story'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 30000 });
  await openSelect(page);
  await page.evaluate(() => window.__game.scene.getScene('select').confirm());
  await page.waitForFunction(() => window.__game.scene.isActive('play') && window.__state && window.__state.stageKey, null, { timeout: 30000 });
}

async function runStage(page, stageIndex, attempt) {
  await page.waitForFunction(() => window.__game.scene.isActive('play') && window.__state && window.__state.stageKey, null, { timeout: 20000 });
  const start = await state(page);
  const rec = { stage: start.stageKey, stageIndex, attempt, startHp: start.hp, maxHp: start.maxHp, weapon: start.weapon, rooms: [], startedAt: Date.now(), maxRoom: 0, minHp: start.hp, hitsApprox: 0, talents: [], rest: 0, ended: '' };
  const rooms = new Map();
  let lastRoom = null, held = null, lastAtk = 0, lastQ = 0, lastSnapAt = 0, lastHp = start.hp, lastTraceAt = 0;
  const t0 = Date.now();
  const release = async () => { if (held) { await page.keyboard.up(held); held = null; } };
  while (Date.now() - t0 < STAGE_TIMEOUT) {
    const s = await state(page);
    if (s.hp < lastHp) rec.hitsApprox += 1;
    lastHp = s.hp; rec.minHp = Math.min(rec.minHp, s.hp);
    if (!rooms.has(s.roomKey)) {
      rooms.set(s.roomKey, { key: s.roomKey, idx: s.roomIdx, type: s.roomType, hpAt: s.hp, enemiesAt: s.enemies.length, startedAt: Date.now() });
      rec.rooms.push(rooms.get(s.roomKey));
      rec.maxRoom = Math.max(rec.maxRoom, s.roomIdx);
      lastRoom = s.roomKey;
    }
    if (process.env.PT_DEBUG && Date.now() - lastTraceAt > 1500) {
      lastTraceAt = Date.now();
      console.error('TRACE ' + JSON.stringify({ t: Date.now() - t0, room: s.roomKey, idx: s.roomIdx, type: s.roomType, cleared: s.cleared, hp: s.hp, px: s.px, py: s.py, held, doors: s.doors, nextDoors: s.nextDoors, enemies: s.enemies.map((e) => ({ k: e.k, x: e.x, y: e.y, hp: e.hp })) }));
    }
    if (s.dead) { rec.ended = 'dead'; break; }
    if (s.won) { rec.ended = 'win'; break; }
    if (s.panelType === 'talent') {
      await release();
      const picked = await chooseTalent(page);
      if (picked) rec.talents.push(picked);
      await page.waitForTimeout(150);
      continue;
    }
    if (s.panelOpen) {
      if (process.env.PT_DEBUG) console.error('PANEL ' + JSON.stringify({ room: s.roomType, coins: s.coins, hp: s.hp, maxHp: s.maxHp, type: s.panelType, labels: s.panelLabels }));
      await release();
      // 篝火面板第一项是付费回血；只在这个明确场景按 1，避免误触事件献祭。
      if (s.roomType === 'rest' && s.coins >= 2 && s.hp < s.maxHp && (s.panelLabels[0] || '').includes('回')) {
        await page.keyboard.press('1');
        rec.rest = (rec.rest || 0) + 1;
        await page.waitForTimeout(240);
        continue;
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(160); continue;
    }
    if (s.talking) { await release(); await page.keyboard.press('Space'); await page.waitForTimeout(140); continue; }

    const now = Date.now();
    // 先看迎面弹体：预测 0.6s 内最近距离，小于 34px 就垂直位移让开。
    let danger = null, dangerT = 9;
    for (const sh of s.shots || []) {
      const rx = s.px - sh.x, ry = s.py - sh.y;
      const vv = sh.vx * sh.vx + sh.vy * sh.vy || 1;
      const t = -(rx * sh.vx + ry * sh.vy) / vv;
      if (t < 0 || t > 0.65) continue;
      const cx = rx + sh.vx * t, cy = ry + sh.vy * t;
      const d = Math.hypot(cx, cy);
      if (d < 36 && t < dangerT) { danger = { sh, d }; dangerT = t; }
    }
    if (danger) {
      const side = Math.abs(danger.sh.vx) > Math.abs(danger.sh.vy) ? (danger.sh.vx > 0 ? 's' : 'w') : (danger.sh.vy > 0 ? 'd' : 'a');
      if (held !== side) { await release(); await page.keyboard.down(side); held = side; }
      await page.waitForTimeout(100);
      continue;
    }
    // Boss：只读 phase / ring。前摇与冲撞期躲避，硬直 recover 才贴脸反击。
    // 浣熊跃扑的落点是前摇时玩家脚下，必须离开 ring；青蛙直线冲撞则横向侧移。
    if (s.bossInfo) {
      const b = s.bossInfo;
      const bdx = b.x - s.px, bdy = b.y - s.py, bd = b.dist;
      const bwant = Math.abs(bdx) >= Math.abs(bdy) ? (bdx > 0 ? 'd' : 'a') : (bdy > 0 ? 's' : 'w');
      const baway = { d: 'a', a: 'd', s: 'w', w: 's' }[bwant];
      const DANGER = ['windup', 'lunge', 'slamWindup', 'slamAir', 'pounceWindup', 'pounceAir', 'swipeWindup', 'swipeHit',
        'dashWindup', 'diveWindup', 'dive', 'chargeWindup', 'charge', 'castWindup', 'cast', 'fanWindup', 'blinkOut', 'storm', 'roar', 'shift'];
      if (DANGER.includes(b.ph)) {
        let esc = baway;
        if (b.ring) {
          // 落点圈：沿离圈心最远的轴逃；圈小的时候必须当真。
          const rx = s.px - b.ring.x, ry = s.py - b.ring.y;
          if (Math.hypot(rx, ry) < b.ring.r + 12) {
            const opts = [['a', -1, 0], ['d', 1, 0], ['w', 0, -1], ['s', 0, 1]];
            let best = -1e9, bestK = baway;
            for (const [k, dx, dy] of opts) {
              const v = rx * dx + ry * dy;
              if (v > best) { best = v; bestK = k; }
            }
            esc = bestK;
          }
        } else if (Math.abs(bdx) >= Math.abs(bdy)) {
          // 横向来的冲撞，纵向侧移；挑空间大的一侧。
          esc = s.py < 416 ? 's' : 'w';
        } else {
          esc = s.px < 416 ? 'd' : 'a';
        }
        if (s.hp <= 14 && s.qready && now - lastQ > 1200) {
          // Boss 前摇期用疾影冲刺吃无敌帧，别把 Q 留到死。
          await release();
          await page.keyboard.down(esc); await page.waitForTimeout(30); await page.keyboard.up(esc);
          await page.keyboard.press('q'); lastQ = now;
          await page.waitForTimeout(120);
          continue;
        }
        if (held !== esc) { await release(); await page.keyboard.down(esc); held = esc; }
        await page.waitForTimeout(100);
        continue;
      }
      // 不在危险相位就贴上去打；Boss 前摇一到，上面的 DANGER 分支会立刻接管躲避。
      // 不再只等 recover：青蛙 recover 只有 380ms，从 100 距离根本赶不上一刀。
      if (bd <= 46) {
        if (now - lastAtk > 340) {
          if (held) await release();
          if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[bwant]) {
            await page.keyboard.down(bwant); await page.waitForTimeout(35); await page.keyboard.up(bwant);
          }
          await page.keyboard.press('Space'); lastAtk = now;
        }
      } else if (bwant !== held) {
        await release(); await page.keyboard.down(bwant); held = bwant;
      }
      await page.waitForTimeout(100);
      continue;
    }
    // 独眼/蜥蜴蓄力冲刺：横向侧移，别沿冲锋线后退（后退必吃）。
    const dashThreat = s.enemies.find((e) => (e.k === 'cyclope' || e.k === 'lizard') && (e.ph === 'windup' || e.ph === 'dash'));
    if (dashThreat) {
      const ddx = dashThreat.x - s.px, ddy = dashThreat.y - s.py;
      const side = Math.abs(ddx) >= Math.abs(ddy) ? (s.py < 416 ? 's' : 'w') : (s.px < 416 ? 'd' : 'a');
      if (held !== side) { await release(); await page.keyboard.down(side); held = side; }
      await page.waitForTimeout(180);
      continue;
    }
    if (s.enemies.length) {
      // 按“真实可走路径”选目标，而不是直线距离：隔墙的敌人会让我方穿过整房吃弹幕。
      let e = null, epath = null, bestLen = 1e9;
      for (const foe of s.enemies) {
        const [sx0, sy0] = tileOf(s.px, s.py), [gx0, gy0] = tileOf(foe.x, foe.y);
        const p0 = pathNear(new Set(s.walls), sx0, sy0, gx0, gy0);
        const len = p0 ? p0.length : 999;
        if (len < bestLen) { bestLen = len; e = foe; epath = p0; }
      }
      if (!e) e = s.enemies[0];
      const dx = e.x - s.px, dy = e.y - s.py, dist = Math.hypot(dx, dy);
      const want = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
      const away = { d: 'a', a: 'd', s: 'w', w: 's' }[want];
      // 低血先面朝反方向疾影冲刺，借落地无敌脱离包围。
      if (s.hp <= 12 && s.qready && now - lastQ > 1000) {
        await release();
        const back = { d: 'a', a: 'd', s: 'w', w: 's' }[want];
        await page.keyboard.down(back); await page.waitForTimeout(30); await page.keyboard.up(back);
        await page.keyboard.press('q'); lastQ = now;
        await page.waitForTimeout(140); continue;
      }
      // 先砍再退：贴脸时如果先退，墙角被堵会永远退不出去，形成 110s 软锁（实机第 2 关已复现）。
      if (dist <= 44 && now - lastAtk > 340) {
        if (held) { await release(); }
        if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[want]) {
          await page.keyboard.down(want); await page.waitForTimeout(35); await page.keyboard.up(want);
        }
        await page.keyboard.press('Space'); lastAtk = now;
        // 打一刀就退，等冷却再进；不让小怪贴住。
        if (held !== away) { await release(); await page.keyboard.down(away); held = away; }
        await page.waitForTimeout(230); continue;
      }
      // 攻击冷却中且贴脸，才退半步，避免站桩吃碰撞。
      if (dist < 36) {
        if (held !== away) { await release(); await page.keyboard.down(away); held = away; }
        await page.waitForTimeout(120); continue;
      }
      if (dist > 48) {
        const path = epath;
        let moveWant;
        moveWant = stepKey(s, path) || want;
        if (moveWant !== held) { await release(); await page.keyboard.down(moveWant); held = moveWant; }
      }
    } else {
      // 清房后先捡掉落（金币/心/宝石/强化），再考虑篝火和门。只靠走近拾取，不按任何作弊键。
      // 武器掉落会原地互换，先跳过；本轮只收金币 / 心 / 强化 / 钥匙。
      const drop = (s.drops || []).find((x) => x.k !== 'weapon');
      if (drop) {
        const [sx, sy] = tileOf(s.px, s.py), [gx, gy] = tileOf(drop.x, drop.y);
        const dist = Math.hypot(drop.x - s.px, drop.y - s.py);
        if (dist > 18) {
          const path = pathNear(new Set(s.walls), sx, sy, gx, gy);
          const moveWant = stepKey(s, path) || keyFor(drop.x - s.px, drop.y - s.py);
          if (moveWant !== held) { await release(); await page.keyboard.down(moveWant); held = moveWant; }
          await page.waitForTimeout(100);
          continue;
        }
      }
      // 篝火：血量不满且 2 金币时，先走到火堆按 E 付钱回血，再走门。
      const rest = s.roomType === 'rest' && s.hp < s.maxHp && s.coins >= 2 ? s.props.find((x) => x.k === 'rest') : null;
      if (rest) {
        const [sx, sy] = tileOf(s.px, s.py), [gx, gy] = tileOf(rest.x, rest.y);
        const dist = Math.hypot(rest.x - s.px, rest.y - s.py);
        if (dist <= 44) {
          await release();
          await page.keyboard.press('e');
          await page.waitForTimeout(260);
          continue;
        }
        const path = pathNear(new Set(s.walls), sx, sy, gx, gy);
        const moveWant = stepKey(s, path) || keyFor(rest.x - s.px, rest.y - s.py);
        if (moveWant !== held) { await release(); await page.keyboard.down(moveWant); held = moveWant; }
        await page.waitForTimeout(120);
        continue;
      }
      // 清房后只走能通向更高 idx 的门；避免在两间房之间来回触发天赋。只走门中心，不调用 tryExit。
      const dirs = (s.nextDoors && s.nextDoors.length ? s.nextDoors.map((d) => d.dir) : []);
      const dir = dirs.includes('r') ? 'r' : dirs.includes('l') ? 'l' : dirs.includes('d') ? 'd' : dirs.includes('u') ? 'u' : null;
      if (dir) {
        const target = dir === 'l' ? [1, 13] : dir === 'r' ? [22, 13] : dir === 'u' ? [12, 1] : [12, 24];
        const [sx, sy] = tileOf(s.px, s.py);
        const path = pathTo(new Set(s.walls), sx, sy, target[0], target[1]);
        let want;
        const step = stepKey(s, path);
        want = step || (dir === 'l' ? 'a' : dir === 'r' ? 'd' : dir === 'u' ? 'w' : 's');
        if (want !== held) { await release(); await page.keyboard.down(want); held = want; }
        // 到门边再持续按方向，让 checkDoors 触发。
        const near = (dir === 'l' && s.px < 40) || (dir === 'r' && s.px > 728) || (dir === 'u' && s.py < 40) || (dir === 'd' && s.py > 792);
        if (near) { await page.waitForTimeout(80); }
      } else {
        await release();
        // 门还没开时等待；若卡住超过 2s 仍无门，交给上层超时。
        await page.waitForTimeout(150);
      }
    }
    await page.waitForTimeout(90);
  }
  await release();
  const end = await state(page);
  rec.endHp = end.hp;
  rec.endRoom = end.roomIdx;
  rec.endRoomKey = end.roomKey;
  rec.endedAt = Date.now();
  rec.durationMs = rec.endedAt - rec.startedAt;
  rec.kills = end.kills;
  rec.coins = end.coins;
  rec.gems = end.gems;
  rec.talentsFinal = await page.evaluate(() => window.__state.talents.slice());
  rec.bossKind = end.bossKind || '';
  rec.bossEnd = end.bossInfo ? { ph: end.bossInfo.ph, hp: end.bossInfo.hp, maxHp: end.bossInfo.maxHp } : null;
  rec.endEnemies = end.enemies.map((e) => ({ k: e.k, x: e.x, y: e.y, hp: e.hp }));
  rec.endPx = end.px; rec.endPy = end.py;
  rec.error = endedTimeout(rec) ? 'timeout' : '';
  return rec;
}
function endedTimeout(rec) { return rec.ended === ''; }

async function afterRun(page, advance) {
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  if (await page.evaluate(() => window.__game.scene.isActive('play'))) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
  await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 15000 });
  // 胜利后地图默认仍停在刚通关的关卡；按 ↓ 选中下一关，再由 openSelect 进入。
  if (advance) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(180);
  }
}
async function startFromMap(page, stageIndex) {
  await openSelect(page);
  await page.evaluate(() => window.__game.scene.getScene('select').confirm());
  await page.waitForFunction(() => window.__game.scene.isActive('play') && window.__state && window.__state.stageKey, null, { timeout: 30000 });
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox', '--disable-gpu', '--no-proxy-server'] });
mkdirSync(join(ROOT, 'docs/revamp/playtest'), { recursive: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  page.__base = base;
  page.on('pageerror', (e) => out.errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') out.errors.push('CONSOLE ' + m.text()); });
  await startFirstStage(page);
  let stage = 1, attempt = 1;
  while (stage <= STAGES) {
    const attemptRec = await runStage(page, stage, attempt);
    out.stages.push(attemptRec);
    await page.screenshot({ path: join(ROOT, `docs/revamp/playtest/ch1-${stage}-a${attempt}-${attemptRec.ended || 'timeout'}.png`) });
    attemptRec.screenshot = `docs/revamp/playtest/ch1-${stage}-a${attempt}-${attemptRec.ended || 'timeout'}.png`;
    if (attemptRec.ended === 'dead') {
      if (attempt >= MAX_ATTEMPTS) {
        out.errors.push(`stage ${stage} dead after ${attempt} attempts; abort remaining stages`);
        break;
      }
      attempt += 1;
      await afterRun(page, false);
      await startFromMap(page, stage);
      continue;
    }
    if (attemptRec.ended === 'win') {
      await afterRun(page, true);
      stage += 1; attempt = 1;
      if (stage <= STAGES) await startFromMap(page, stage);
      continue;
    }
    out.errors.push(`stage ${stage} timeout`);
    break;
  }
  await ctx.close();
} finally {
  await browser.close();
  server.close();
}
out.passed = out.errors.length === 0;
mkdirSync(join(ROOT, 'docs/audit'), { recursive: true });
writeFileSync(join(ROOT, 'docs/audit/PLAYTEST-CH1.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!out.passed) process.exitCode = 1;
