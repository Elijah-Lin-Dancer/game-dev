/* 地牢拓扑
 * 1) 老模式（?char= 直进 / 无章节）：3×3 随机游走，一局 3–6 间。
 * 2) 章节模式（批 9）：按章节给的房数与模板生成一条"蛇形"路线，房型由 chapters.json 指定。
 *    不按模板时仍走随机权重（批 2 的规则），两套互不影响。
 */
import { OPPOSITE } from '../core/config.js';

/* 蛇形路线：G×G 网格按行折返，取前 n 格。四条边随机翻转，起点/终点因此不固定 */
function snakePath(n, G) {
  const cells = [];
  for (let y = 0; y < G; y += 1) {
    const xs = [];
    for (let x = 0; x < G; x += 1) xs.push(x);
    if (y % 2 === 1) xs.reverse();
    xs.forEach((x) => cells.push([x, y]));
  }
  const flipX = Math.random() < 0.5;
  const flipY = Math.random() < 0.5;
  const path = cells.slice(0, n).map(([x, y]) => [flipX ? G - 1 - x : x, flipY ? G - 1 - y : y]);
  return path;
}

function buildRooms(path, isBossAt) {
  const rooms = new Map();
  path.forEach(([x, y], i) => rooms.set(x + ',' + y, {
    x, y, idx: i, doors: {}, cleared: false, built: false,
    isBoss: isBossAt(x, y, i),
  }));
  for (let i = 1; i < path.length; i += 1) {
    const a = rooms.get(path[i - 1].join(','));
    const b = rooms.get(path[i].join(','));
    const dx = b.x - a.x; const dy = b.y - a.y;
    const dir = dx === 1 ? 'r' : dx === -1 ? 'l' : dy === 1 ? 'd' : 'u';
    a.doors[dir] = b.x + ',' + b.y;
    b.doors[OPPOSITE[dir]] = a.x + ',' + a.y;
  }
  return rooms;
}

/* ---------- 章节模式 ---------- */
function makeStagedDungeon(opts) {
  const want = Math.max(1, Math.round(opts.rooms || 5));
  const G = Math.max(2, Math.ceil(Math.sqrt(want + 1)));
  const path = snakePath(want, G);
  const rooms = buildRooms(path, (x, y, i) => i === path.length - 1);
  const tpl = Array.isArray(opts.template) ? opts.template : [];
  path.forEach((key, i) => {
    const room = rooms.get(key.join(','));
    const t = String(tpl[i] || (i === path.length - 1 ? 'boss' : 'battle'));
    room.type = (i === path.length - 1) ? 'boss' : (t === 'boss' ? 'battle' : t);
  });
  if (path.length > 1) rooms.get(path[0].join(',')).type = 'battle';
  return { rooms, path, start: path[0].join(','), mode: 'stage' };
}

function makeDungeon(opts) {
  if (opts && opts.rooms) return makeStagedDungeon(opts);
  const G = 3, goal = [2, 2];
  let cur = [0, 0];
  const path = [[0, 0]];
  const seen = new Set(['0,0']);
  let guard = 0;

  while ((cur[0] !== goal[0] || cur[1] !== goal[1]) && guard++ < 200) {
    const cand = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => [cur[0] + dx, cur[1] + dy])
      .filter(([x, y]) => x >= 0 && x < G && y >= 0 && y < G && !seen.has(x + ',' + y));
    if (!cand.length) break;
    // 六成概率直奔终点，四成随机，保证路径有弯也有直
    cand.sort((a, b) => (Math.abs(a[0] - goal[0]) + Math.abs(a[1] - goal[1]))
      - (Math.abs(b[0] - goal[0]) + Math.abs(b[1] - goal[1])));
    const forceGoal = path.length >= 5;   // 太长就直奔终点，一局 3–6 间
    const next = (forceGoal || Math.random() < 0.65 || cand.length === 1) ? cand[0] : cand[Math.floor(Math.random() * cand.length)];
    cur = next;
    seen.add(cur[0] + ',' + cur[1]);
    path.push(cur.slice());
  }

  const rooms = buildRooms(path, (x, y) => x === goal[0] && y === goal[1]);
  assignTypes(rooms, path);
  return { rooms, path, start: path[0].join(','), mode: 'free' };
}

/* ---------- 房间类型（批 2） ----------
 * 权重来自 ROADMAP §4：非战斗房合计 33%，低于 35% 的上限。
 * 约束：首间固定 battle（教学），末间 boss，精英房不放在首尾，一局至少 1 个非战斗房。
 */
const TYPE_WEIGHT = [
  ['battle', 55], ['elite', 12], ['treasure', 10], ['shop', 10], ['shrine', 8], ['rest', 5],
];
export const ROOM_TYPES = TYPE_WEIGHT.map((t) => t[0]);
export const NON_COMBAT = ['treasure', 'shop', 'shrine', 'rest'];

function rollType(canElite) {
  const pool = TYPE_WEIGHT.filter(([k]) => k !== 'elite' || canElite);
  const total = pool.reduce((n, [, w]) => n + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of pool) {
    r -= w;
    if (r <= 0) return k;
  }
  return 'battle';
}

function assignTypes(rooms, path) {
  const n = path.length;
  const last = path[n - 1].join(',');
  const mid = path.slice(1, n - 1).map(([x, y]) => x + ',' + y);
  let eliteUsed = 0;
  mid.forEach((key) => {
    const room = rooms.get(key);
    room.type = rollType(eliteUsed === 0);
    if (room.type === 'elite') eliteUsed += 1;
  });
  // 一局至少一间非战斗房：全是战斗就把中间挑一间改成祭坛或篝火
  if (!mid.some((k) => NON_COMBAT.indexOf(rooms.get(k).type) >= 0)) {
    const pick = mid.length ? mid[Math.floor(Math.random() * mid.length)] : null;
    if (pick) rooms.get(pick).type = Math.random() < 0.5 ? 'rest' : 'shrine';
  }
  // 避免一局走三步全是房不打架
  for (let i = 1; i < mid.length; i += 1) {
    const a = rooms.get(mid[i - 1]), b = rooms.get(mid[i]);
    if (NON_COMBAT.indexOf(a.type) >= 0 && NON_COMBAT.indexOf(b.type) >= 0) b.type = 'battle';
  }
  rooms.get(path[0].join(',')).type = 'battle';
  rooms.get(last).type = 'boss';

  // 钥匙断供保护：有宝箱但整局既没精英也没商店，就把一间普通战斗房改成精英
  const types = mid.map((k) => rooms.get(k).type);
  if (types.indexOf('treasure') >= 0 && types.indexOf('elite') < 0 && types.indexOf('shop') < 0) {
    const pick = mid[types.findIndex((t) => t === 'battle')];
    if (pick) rooms.get(pick).type = 'elite';
  }
}

export { makeDungeon, assignTypes };
