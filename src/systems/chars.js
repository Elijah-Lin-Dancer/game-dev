/* 角色表：白名单归一化，坏条目直接丢，缺字段补默认值
 * 数值只影响起始属性与技能，不改 CFG 的全局平衡。
 */
const ORDER = ['ninja', 'mage', 'knight'];
const SKILL_IDS = ['dash', 'fireball', 'guard'];

const int = (v, d, lo) => (Number.isFinite(+v) ? Math.max(lo, Math.round(+v)) : d);

export function normalizeChars(list) {
  const src = Array.isArray(list) ? list : [];
  const out = [];
  src.forEach((c) => {
    if (!c || !ORDER.includes(c.id)) return;
    if (out.some((x) => x.id === c.id)) return;
    const s = c.skill || {};
    out.push({
      id: c.id,
      name: String(c.name || c.id),
      tag: String(c.tag || ''),
      skin: ORDER.includes(c.skin) ? c.skin : c.id,
      hp: int(c.hp, 20, 1),
      dmg: int(c.dmg, 3, 1),
      speed: int(c.speed, 96, 40),
      weapon: String(c.weapon || 'katana'),
      face: String(c.face || 'faceNinja'),
      desc: String(c.desc || ''),
      skill: {
        id: SKILL_IDS.includes(s.id) ? s.id : 'dash',
        name: String(s.name || '技能'),
        cd: int(s.cd, 8000, 1000),
        desc: String(s.desc || ''),
        distance: int(s.distance, 100, 20),
        invuln: int(s.invuln, 400, 0),
        speed: int(s.speed, 260, 60),
        dmg: int(s.dmg, 7, 1),
        pierce: int(s.pierce, 2, 0),
        blast: int(s.blast, 44, 0),
        blastDmg: int(s.blastDmg, 3, 0),
        life: int(s.life, 900, 100),
        duration: int(s.duration, 3000, 500),
        takenMul: Number.isFinite(+s.takenMul) ? Math.min(1, Math.max(0.1, +s.takenMul)) : 0.5,
        push: int(s.push, 96, 0),
      },
    });
  });
  ORDER.forEach((id) => {
    if (!out.some((c) => c.id === id)) {
      out.push({
        id, name: id, tag: '', skin: id, hp: 20, dmg: 3, speed: 96, weapon: 'katana',
        face: 'faceNinja', desc: '', skill: { id: 'dash', name: '技能', cd: 8000, desc: '' },
      });
    }
  });
  return out.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
}

export function pickChar(chars, id) {
  return chars.find((c) => c.id === id) || chars[0];
}
