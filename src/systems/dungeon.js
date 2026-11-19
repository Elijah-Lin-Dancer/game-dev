/* 地牢拓扑：3×3 网格随机游走，起点 (0,0)、终点 (2,2) 为 Boss 房 */
import { OPPOSITE } from '../core/config.js';
function makeDungeon() {
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

  // 相邻房间之间开门
  const rooms = new Map();
  path.forEach(([x, y], i) => rooms.set(x + ',' + y, {
    x, y, idx: i, doors: {}, cleared: false, built: false,
    isBoss: (x === goal[0] && y === goal[1]),
  }));
  for (let i = 1; i < path.length; i++) {
    const a = rooms.get(path[i - 1].join(','));
    const b = rooms.get(path[i].join(','));
    const dx = b.x - a.x, dy = b.y - a.y;
    const dir = dx === 1 ? 'r' : dx === -1 ? 'l' : dy === 1 ? 'd' : 'u';
    a.doors[dir] = b.x + ',' + b.y;
    b.doors[OPPOSITE[dir]] = a.x + ',' + a.y;
  }
  return { rooms, path, start: path[0].join(',') };
}

export { makeDungeon };
