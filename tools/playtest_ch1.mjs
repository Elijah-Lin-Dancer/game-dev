/* 第一章实机输入试点：真实键盘移动 / 攻击 / 过门 / 天赋选择；不调用 __dbg.next() / __dbg.win()。
 * 用法：node tools/playtest_ch1.mjs --stages=1
 * 产物：docs/audit/PLAYTEST-CH1.json + docs/revamp/playtest/ 截图。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PW = process.env.PLAYWRIGHT_PATH || '/opt/vm/preinstall/npm-global/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const TILE = 32, COLS = 24, ROWS = 26;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const args = process.argv.slice(2);
const opt = (name, dflt) => { const a = args.find((x) => x.startsWith('--' + name + '=')); return a ? a.split('=')[1] : dflt; };
const CHAPTER = opt('chapter', 'bamboo');
// --stages=N 保留旧语义（从 --start 起跑 N 关）；--start / --end 用于单章分段回归。
const START = Math.max(1, Number(opt('start', 1)) || 1);
const STAGES = Math.max(1, Math.min(5, Number(opt('stages', 5)) || 5));
const END = Math.max(START, Math.min(6, Number(opt('end', START + STAGES - 1)) || (START + STAGES - 1)));
const STAGE_TIMEOUT = Number(opt('stageTime', 150000));
const MAX_ATTEMPTS = Math.max(1, Math.min(5, Number(opt('attempts', 3)) || 3));
const TAG = CHAPTER === 'bamboo' ? 'ch1' : CHAPTER;
const OUT_NAME = CHAPTER === 'bamboo' ? 'PLAYTEST-CH1' : `PLAYTEST-${CHAPTER.toUpperCase()}`;
const out = { chapter: CHAPTER, stages: [], errors: [], mode: 'real-keyboard-input', notes: 'Real movement / attack / doors / talent panel; no __dbg.next or __dbg.win.' };

// 测第二章起：预置前序章节通关星级，模拟玩家已完成第一章；不跳过目标章节自身解锁。
const CHAPTERS = JSON.parse(readFileSync(join(ROOT, 'web/data/chapters.json'), 'utf8')).chapters || [];
const CI = CHAPTERS.findIndex((c) => c.id === CHAPTER);
const seedStars = {};
if (CI >= 0) {
  // 前序章节全通；目标章节只补 START 之前的关卡，当前关仍要真实打。
  for (const c of CHAPTERS.slice(0, CI)) {
    for (let i = 1; i <= c.stages; i++) seedStars[`${c.id}:${i}`] = 1;
  }
  for (let i = 1; i < START; i++) seedStars[`${CHAPTER}:${i}`] = 1;
}
const seedSave = { v: 11, stars: seedStars, coins: 12, gem: 6, chars: ['ninja'], lastChar: 'ninja' };

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
      talking: !!p.talking, facing: p.facing, stageKey: st.stageKey, weapon: st.weapon, weaponKind: p.weapon && p.weapon.kind, kills: st.kills,
      coins: st.coins, gems: st.gems, boss: foes.find((e) => e.k === 'boss' || e.k === 'bossB' || e.k === 'racoonBoss' || e.k === 'mireWraith' || e.k === 'frostOwl' || e.k === 'magmaColossus' || e.k === 'bambooMirage' || e.k === 'sandMirage' || e.k === 'mossBeast'),
      bossHp: st.bossHp, iframe: st.iframe, slowLeft: Math.max(0, Math.round(((p.slowUntil || 0) - p.time.now))), qready: !!(p.char && p.char.skill && p.time.now - p.skillAt >= p.char.skill.cd), qleft: p.char && p.char.skill ? Math.max(0, Math.round(p.char.skill.cd - (p.time.now - p.skillAt))) : 0,
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

async function startFirstStage(page, startStage = START) {
  await page.goto(`${page.__base}/index.html?debug=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__chaptersData, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  if (await page.evaluate(() => window.__game.scene.isActive('story'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  await page.waitForFunction(() => window.__game.scene.isActive('map'), null, { timeout: 30000 });
  if (CHAPTER !== 'bamboo') {
    // 测试夹具：直接带 chapterId 进入目标章节选关页；关卡解锁仍由真实存档校验。
    await page.evaluate((arg) => window.__game.scene.start('map', { chapterId: arg.ch, stage: arg.st }), { ch: CHAPTER, st: startStage });
    await page.waitForTimeout(350);
  }
  await openSelect(page);
  await page.evaluate(() => window.__game.scene.getScene('select').confirm());
  await page.waitForFunction(() => window.__game.scene.isActive('play') && window.__state && window.__state.stageKey, null, { timeout: 30000 });
}

async function runStage(page, stageIndex, attempt) {
  await page.waitForFunction(() => window.__game.scene.isActive('play') && window.__state && window.__state.stageKey, null, { timeout: 20000 });
  // 仅用于武器专项抽查，不参与正式验收；正式跑不设 PT_WEAPON。
  if (process.env.PT_WEAPON) {
    await page.evaluate((w) => window.__dbg && window.__dbg.give && window.__dbg.give(w), process.env.PT_WEAPON);
    await page.waitForTimeout(180);
  }
  const start = await state(page);
  const rec = { stage: start.stageKey, stageIndex, attempt, startHp: start.hp, maxHp: start.maxHp, weapon: start.weapon, rooms: [], startedAt: Date.now(), maxRoom: 0, minHp: start.hp, hitsApprox: 0, talents: [], rest: 0, ended: '' };
  const rooms = new Map();
  let lastRoom = null, held = null, lastAtk = 0, lastQ = 0, lastSnapAt = 0, lastHp = start.hp, lastTraceAt = 0;
  let lastPosAt = Date.now(), lastPosX = start.px, lastPosY = start.py;
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
      console.error('TRACE ' + JSON.stringify({ t: Date.now() - t0, room: s.roomKey, idx: s.roomIdx, type: s.roomType, cleared: s.cleared, hp: s.hp, px: s.px, py: s.py, held, qready: s.qready, qleft: s.qleft, slowLeft: s.slowLeft, doors: s.doors, nextDoors: s.nextDoors, enemies: s.enemies.map((e) => ({ k: e.k, x: e.x, y: e.y, hp: e.hp })) }));
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
      // 篝火面板第一项是回血；首领门前的篝火是免费的，不能再要求 2 金币才按 1。
      const freeRest = (s.panelLabels[0] || '').includes('免费');
      if (s.roomType === 'rest' && s.hp < s.maxHp && (s.coins >= 2 || freeRest) && (s.panelLabels[0] || '').includes('回')) {
        await page.keyboard.press('1');
        rec.rest = (rec.rest || 0) + 1;
        await page.waitForTimeout(240);
        continue;
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(160); continue;
    }
    if (s.talking) { await release(); await page.keyboard.press('Space'); await page.waitForTimeout(140); continue; }

    // 顶墙脱困：机器人按路径顶住墙时，会一直保持同一方向直到超时。
    // 连续 1.2s 几乎没位移就反方向退一步，下一轮重新算路径。
    if (Date.now() - lastPosAt > 1200) {
      const moved = Math.hypot(s.px - lastPosX, s.py - lastPosY);
      if (held && moved < 5 && (s.enemies.length === 0 || s.bossInfo)) {
        const back = { a: 'd', d: 'a', w: 's', s: 'w' }[held];
        await release();
        if (back) { await page.keyboard.down(back); await page.waitForTimeout(320); await page.keyboard.up(back); }
        lastPosAt = Date.now(); lastPosX = s.px; lastPosY = s.py;
        continue;
      }
      lastPosAt = Date.now(); lastPosX = s.px; lastPosY = s.py;
    }

    const now = Date.now();
    // 先看迎面弹体：骷髅弹会转向，不能只在 36px 处做一次垂直位移；
    // 提前 0.85s 预判，并按“房间哪边空间大”选侧移方向，避免贴墙时原地吃弹。
    // 受击后的 700ms 无敌帧是靠近窗口：不要在这段时间继续躲，直接贴脸换血推进。
    let danger = null, dangerT = 9;
    if (!(s.iframe > 80)) {
      for (const sh of s.shots || []) {
        const rx = s.px - sh.x, ry = s.py - sh.y;
        const vv = sh.vx * sh.vx + sh.vy * sh.vy || 1;
        const t = -(rx * sh.vx + ry * sh.vy) / vv;
        if (t < 0 || t > 0.85) continue;
        const cx = rx + sh.vx * t, cy = ry + sh.vy * t;
        const d = Math.hypot(cx, cy);
        if (d < 42 && t < dangerT) { danger = { sh, d }; dangerT = t; }
      }
    }
    if (danger) {
      let side;
      if (Math.abs(danger.sh.vx) > Math.abs(danger.sh.vy)) {
        // 横向弹：上下躲，优先往房间中间/空间大的一侧。
        side = s.py < 540 ? 's' : 'w';
      } else {
        // 纵向弹：左右躲。
        side = s.px < 384 ? 'd' : 'a';
      }
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
        'dashWindup', 'diveWindup', 'dive', 'chargeWindup', 'charge', 'castWindup', 'cast', 'fanWindup', 'blinkOut', 'storm', 'roar', 'shift',
        // 蓝武士横斩 reach 96，比忍者刀 69 的实打范围更远；前摇/命中期必须退，
        // 否则机器人贴到 46 之前就被 4 点一刀打退，整场摸不到 Boss（fort:1 回归失败根因）。
        'slashWindup', 'slashHit'];
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
      const rangedBoss = s.weaponKind === 'ranged' || s.weaponKind === 'throw'
        || ['wand', 'bow', 'kunai'].includes(s.weapon);
      if (rangedBoss) {
        // 远程武器不能按近战 46px 贴脸：保持 90–180px，够得着就出手，Boss 逼近就后撤。
        if (bd < 72) {
          if (held !== baway) { await release(); await page.keyboard.down(baway); held = baway; }
          await page.waitForTimeout(140);
          continue;
        }
        if (bd <= 185) {
          if (held) await release();
          if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[bwant]) {
            await page.keyboard.down(bwant); await page.waitForTimeout(35); await page.keyboard.up(bwant);
          }
          if (now - lastAtk > 380) { await page.keyboard.press('Space'); lastAtk = now; }
          await page.waitForTimeout(180);
          continue;
        }
        if (bwant !== held) { await release(); await page.keyboard.down(bwant); held = bwant; }
        await page.waitForTimeout(100);
        continue;
      }
      // 近战出手距离按玩家真实攻击盒算：忍者刀 reach 30 + box 17 + Boss half 22 ≈ 69，
      // 不是贴脸 46；否则大体积 Boss 会永远停在 70–100 的外圈，机器人一刀不还手。
      const meleeReach = s.weapon === 'katana' ? 68 : 60;
      // Boss 刚退到 70–130 的外圈时，用疾影冲刺贴脸；否则恢复期只有 360ms，
      // 从 96px 外跑回去根本赶不上，长血 Boss 会被拖到超时。
      if (bd > meleeReach && bd < 132 && s.qready && now - lastQ > 1200) {
        if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[bwant]) {
          await release();
          await page.keyboard.down(bwant); await page.waitForTimeout(30); await page.keyboard.up(bwant);
        }
        await page.keyboard.press('q'); lastQ = now;
        await page.waitForTimeout(200);
        continue;
      }
      if (bd <= meleeReach) {
        if (now - lastAtk > 340) {
          if (held) await release();
          if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[bwant]) {
            await page.keyboard.down(bwant); await page.waitForTimeout(35); await page.keyboard.up(bwant);
          }
          await page.keyboard.press('Space'); lastAtk = now;
        }
      } else {
        // Boss 房有柱子和窄门，直接朝 Boss 走会顶墙；沿真实可走路径绕。
        const path = pathNear(new Set(s.walls), ...tileOf(s.px, s.py), ...tileOf(b.x, b.y));
        const moveWant = stepKey(s, path) || bwant;
        if (moveWant !== held) { await release(); await page.keyboard.down(moveWant); held = moveWant; }
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
      // 风筝/远程怪：蜘蛛、骷髅会站在 120+ 距离持续放弹幕，近身后要贴死，不能打一刀就退。
      const KITE = ['spider', 'skull', 'eye', 'octopus', 'flam', 'demon', 'lantern', 'spirit', 'mush'];
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
      // 自动换装可能把忍者刀换成苦无/魔杖/短弓；远程武器不能按近战 44px 贴脸逻辑打，
      // 否则会一直贴到碰撞距离、永远不出手（旧堡 5/6 机关房实机超时的根因）。
      const rangedWeapon = s.weaponKind === 'ranged' || s.weaponKind === 'throw'
        || ['wand', 'bow', 'kunai'].includes(s.weapon);
      if (rangedWeapon && dist <= 190) {
        if (dist < 90) {
          if (held !== away) { await release(); await page.keyboard.down(away); held = away; }
          await page.waitForTimeout(120); continue;
        }
        if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[want]) {
          await release();
          await page.keyboard.down(want); await page.waitForTimeout(35); await page.keyboard.up(want);
        }
        if (now - lastAtk > 380) { await page.keyboard.press('Space'); lastAtk = now; }
        await page.waitForTimeout(220); continue;
      }
      // 低血先面朝反方向疾影冲刺，借落地无敌脱离包围。
      if (s.hp <= 14 && s.qready && now - lastQ > 1000) {
        await release();
        const back = { d: 'a', a: 'd', s: 'w', w: 's' }[want];
        await page.keyboard.down(back); await page.waitForTimeout(30); await page.keyboard.up(back);
        await page.keyboard.press('q'); lastQ = now;
        await page.waitForTimeout(140); continue;
      }
      // 远程/风筝怪（蜘蛛、骷髅、眼怪等）站在 120+ 距离放弹幕，慢慢追只会被磨死。
      // 距离 70–170 且 Q 就绪时向前疾影冲刺 100px，落地无敌帧正好贴脸，再进入近战循环。
      if (KITE.includes(e.k) && dist >= 70 && dist <= 220 && s.qready && now - lastQ > 1400) {
        await release();
        if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[want]) {
          await page.keyboard.down(want); await page.waitForTimeout(30); await page.keyboard.up(want);
        }
        await page.keyboard.press('q'); lastQ = now;
        await page.waitForTimeout(220); continue;
      }
      // 小怪也按真实攻击盒出手：忍者刀 reach 30 + box 17 + 小怪 half 12 ≈ 59。
      // 但攻击盒是 34×30 的前向矩形，斜 40px 时纵轴会擦空；先在副轴对齐再砍，
      // 否则会在 48–54px 原地空挥到超时（fort:4 第二房蜘蛛超时根因）。
      const axisX = Math.abs(dx) >= Math.abs(dy);
      const cross = axisX ? Math.abs(dy) : Math.abs(dx);
      // 只在“还够得着但斜轴太偏”时对齐；dist <= 46 时直接砍。
      // 旧逻辑在 45° 斜角、dist 35 时也要求对齐，机器人贴墙后永远不出手，
      // 会在只剩 1 HP 的蜘蛛面前站到死（fort:2 单蜘蛛卡死根因）。
      if (dist > 46 && dist <= 60 && cross > 29) {
        const alignKey = axisX ? (dy > 0 ? 's' : 'w') : (dx > 0 ? 'd' : 'a');
        if (held !== alignKey) { await release(); await page.keyboard.down(alignKey); held = alignKey; }
        await page.waitForTimeout(90); continue;
      }
      if (dist <= 58 && now - lastAtk > 340) {
        if (held) { await release(); }
        if (s.facing !== { d: 'right', a: 'left', s: 'down', w: 'up' }[want]) {
          await page.keyboard.down(want); await page.waitForTimeout(35); await page.keyboard.up(want);
        }
        await page.keyboard.press('Space'); lastAtk = now;
        // 近战小怪：打一刀就退，等冷却再进。
        // 风筝怪：不能退，一退它就重新拉开 120px，整场都在追；贴着连续砍到死。
        const hold = KITE.includes(e.k) ? want : away;
        if (held !== hold) { await release(); await page.keyboard.down(hold); held = hold; }
        await page.waitForTimeout(230); continue;
      }
      // 攻击冷却中且贴脸：近战小怪退半步避免站桩吃碰撞；风筝怪必须继续贴住，
      // 否则一退它又拉开 120px，整场都在追（蜘蛛/骷髅实机软锁的根因）。
      if (dist < 46) {
        const hold = KITE.includes(e.k) ? want : away;
        if (held !== hold) { await release(); await page.keyboard.down(hold); held = hold; }
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
      // 旧堡 2–6 的篝火免费，不能再用“至少 2 金币”把自己挡在火堆外。
      const restAffordable = String(s.stageKey || '').startsWith('fort:') || s.coins >= 2;
      const rest = s.roomType === 'rest' && s.hp < s.maxHp && restAffordable ? s.props.find((x) => x.k === 'rest') : null;
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
      // 机关房：清完守卫后必须走到石像按 E 拉机关，否则门不开、机器人会在原地耗到超时。
      const gate = s.roomType === 'gate' ? s.props.find((x) => x.k === 'gate') : null;
      if (gate) {
        const [sx, sy] = tileOf(s.px, s.py), [gx, gy] = tileOf(gate.x, gate.y);
        const dist = Math.hypot(gate.x - s.px, gate.y - s.py);
        if (dist <= 44) {
          await release();
          await page.keyboard.press('e');
          await page.waitForTimeout(260);
          continue;
        }
        const path = pathNear(new Set(s.walls), sx, sy, gx, gy);
        const moveWant = stepKey(s, path) || keyFor(gate.x - s.px, gate.y - s.py);
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
  if (CI >= 0) {
    await page.addInitScript((s) => {
      if (!localStorage.getItem('na.save')) localStorage.setItem('na.save', JSON.stringify(s));
    }, seedSave);
  }
  page.__base = base;
  page.on('pageerror', (e) => out.errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') out.errors.push('CONSOLE ' + m.text()); });
  await startFirstStage(page);
  let stage = START, attempt = 1;
  while (stage <= END) {
    const attemptRec = await runStage(page, stage, attempt);
    out.stages.push(attemptRec);
    await page.screenshot({ path: join(ROOT, `docs/revamp/playtest/${TAG}-${stage}-a${attempt}-${attemptRec.ended || 'timeout'}.png`) });
    attemptRec.screenshot = `docs/revamp/playtest/${TAG}-${stage}-a${attempt}-${attemptRec.ended || 'timeout'}.png`;
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
      if (stage <= END) await startFromMap(page, stage);
      continue;
    }
    // 超时后游戏仍停在 play，直接重载并重新进本关；不算通关，只给同一关多一次真实输入机会。
    if (attempt < MAX_ATTEMPTS) {
      attempt += 1;
      await startFirstStage(page, stage);
      continue;
    }
    out.errors.push(`stage ${stage} timeout after ${attempt} attempts`);
    break;
  }
  await ctx.close();
} finally {
  await browser.close();
  server.close();
}
out.passed = out.errors.length === 0;
mkdirSync(join(ROOT, 'docs/audit'), { recursive: true });
writeFileSync(join(ROOT, `docs/audit/${OUT_NAME}.json`), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!out.passed) process.exitCode = 1;
