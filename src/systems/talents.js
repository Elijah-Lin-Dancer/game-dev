/* 层间天赋：数据归一化 + 按深度加权抽卡 + 修正合并
 * 与 upg（power/speed/atk 线性小强化）分开算：先吃 flat，再吃 mul，避免两套倍率互相污染。
 */
const RARITY = ['common', 'rare', 'epic'];
const COLORS = { common: '#cfd8c4', rare: '#7fd8ff', epic: '#ffb46b' };
const RARITY_NAME = { common: '普通', rare: '稀有', epic: '史诗' };

/* 允许的修正键：多一个拼错的键会静默无效，所以走白名单 */
const MOD_KEYS = [
  'atk', 'maxHp', 'speed', 'atkCd', 'dmgMul', 'takenMul',
  'healOnKill', 'healOnRoom', 'coinBonus', 'coinMul', 'dropLuck',
];

const NUM = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function normalizeTalents(raw) {
  const src = raw && Array.isArray(raw.list) ? raw.list : [];
  const list = [];
  const byId = {};
  src.forEach((t) => {
    if (!t || typeof t.id !== 'string' || !t.id) return;
    if (byId[t.id]) return;
    const mods = {};
    let any = false;
    MOD_KEYS.forEach((k) => {
      if (!t.mods || typeof t.mods[k] !== 'number') return;
      const v = NUM(t.mods[k]);
      if (!v) return;
      mods[k] = v;
      any = true;
    });
    if (!any) return;
    const entry = {
      id: t.id,
      name: String(t.name || t.id),
      rarity: RARITY.indexOf(t.rarity) >= 0 ? t.rarity : 'common',
      desc: String(t.desc || ''),
      mods,
      color: COLORS[t.rarity] || COLORS.common,
    };
    list.push(entry);
    byId[entry.id] = entry;
  });
  return {
    list,
    byId,
    rarityWeight: {
      common: NUM(raw && raw.rarityWeight && raw.rarityWeight.common, 60),
      rare: NUM(raw && raw.rarityWeight && raw.rarityWeight.rare, 30),
      epic: NUM(raw && raw.rarityWeight && raw.rarityWeight.epic, 10),
    },
    depthShift: {
      common: NUM(raw && raw.depthShift && raw.depthShift.common, -4),
      rare: NUM(raw && raw.depthShift && raw.depthShift.rare, 1),
      epic: NUM(raw && raw.depthShift && raw.depthShift.epic, 4),
    },
  };
}

/* 已选过的 id 不进池；深度越深，越容易出稀有/史诗 */
function rollTalents(T, taken, depth, n) {
  const want = n || 3;
  const pool = T.list.filter((t) => taken.indexOf(t.id) < 0);
  if (!pool.length) return [];
  const picked = [];
  const local = pool.slice();
  for (let i = 0; i < want && local.length; i++) {
    const weights = local.map((t) => {
      const base = T.rarityWeight[t.rarity] || 10;
      const shift = T.depthShift[t.rarity] || 0;
      return Math.max(2, base + shift * Math.max(0, depth - 1));
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let k = 0; k < local.length; k++) {
      r -= weights[k];
      if (r <= 0) { idx = k; break; }
      idx = k;
    }
    picked.push(local[idx]);
    local.splice(idx, 1);
  }
  // 三张全是普通太闷：只要池里还有稀有/史诗，就换掉一张
  if (picked.length && picked.every((t) => t.rarity === 'common')) {
    const idx = local.findIndex((t) => t.rarity !== 'common');
    if (idx >= 0) {
      const t = local[idx];
      local.splice(idx, 1);
      picked[picked.length - 1] = t;
    }
  }
  // 按稀有度排序，史诗/稀有放前面，玩家一眼看到重点
  const order = { epic: 0, rare: 1, common: 2 };
  picked.sort((a, b) => order[a.rarity] - order[b.rarity]);
  return picked;
}

/* 合并修正：flat 相加、mul 相乘、其余相加 */
function mergeMods(T, ids) {
  const m = {
    atk: 0, maxHp: 0, speed: 0, atkCd: 0, dmgMul: 1, takenMul: 1,
    healOnKill: 0, healOnRoom: 0, coinBonus: 0, coinMul: 1, dropLuck: 0,
  };
  ids.forEach((id) => {
    const t = T.byId[id];
    if (!t) return;
    Object.keys(t.mods).forEach((k) => {
      const v = t.mods[k];
      if (k === 'dmgMul' || k === 'takenMul' || k === 'coinMul') m[k] *= v;
      else m[k] += v;
    });
  });
  m.coinMul = Math.max(0, m.coinMul);
  m.dmgMul = Math.max(0.1, m.dmgMul);
  m.takenMul = Math.max(0.1, m.takenMul);
  return m;
}

export { normalizeTalents, rollTalents, mergeMods, RARITY_NAME, MOD_KEYS };
