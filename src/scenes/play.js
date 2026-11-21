/* 主场景：移动 / 战斗 / 房间 / 门 / 掉落 / Boss / HUD */
import { CFG, FONT, DIRS, ANGLE, VEC, OPPOSITE, TILE, COLS, ROWS, RW, RH, S } from '../core/config.js';
import { playAct, hitStop as fxHitStop, resumeStop } from '../systems/fx.js';
import { makeDungeon } from '../systems/dungeon.js';
import { setMood, stopMusic, toggleMute, isMuted, unlockMusic, musicState, setMuted } from '../systems/music.js';
import { loadSave, patchSave, resetSave, saveVersion } from '../systems/save.js';
import { normalizeWeapons, rollWeapon } from '../systems/weapons.js';
import { normalizeTalents, rollTalents, mergeMods, RARITY_NAME } from '../systems/talents.js';
import { normalizeChars, pickChar } from '../systems/chars.js';
import { loadOptions, difficultyMods } from '../systems/options.js';
import { stageSpec, starsOf, starRating } from '../systems/stages.js';

const ROOM_COLOR = {
  battle: 0x7a6a52, elite: 0xffd479, treasure: 0xe8c15a,
  shop: 0x7fd8ff, shrine: 0x9fd8d0, rest: 0xff9a5a, gate: 0xc9a45a, boss: 0xff6b5a,
};
const UPG_ICON = { power: 'upgPower', speed: 'upgSpeed', atk: 'upgAtk' };
const UPG_NAME = { power: '攻击', speed: '移速', atk: '攻速' };
const TYPE_NAME = { battle: '战斗', elite: '精英', treasure: '宝箱', shop: '行脚商', shrine: '石龛', rest: '篝火', gate: '机关', boss: '首领' };

/* 批 10：怪物与 Boss 的名称/贴图/前缀全部读 web/data/*.json，代码只留行为 */
const ENEMY_META = () => ((window.__enemiesData && window.__enemiesData.list) || []);
const BOSS_META = () => ((window.__bossesData && window.__bossesData.list) || []);
const bossMeta = (id) => BOSS_META().find((b) => b.id === id) || null;
const bossMetaByKind = (kind) => BOSS_META().find((b) => b.id === kind || b.kind === kind) || null;

export class Play extends Phaser.Scene {
  constructor() { super('play'); }

  create(data) {
    this.meta = loadSave();
    this.options = loadOptions();
    this.diff = difficultyMods(this.options);
    this.paused = false;
    setMuted(this.meta.muted || this.options.muted);
    this.meta = patchSave({ runs: this.meta.runs + 1 });
    // 批 5：角色决定起始血量/伤害/移速/武器/技能；数值来自 chars.json
    this.chars = normalizeChars(window.__charsData);
    this.charId = (data && data.char) || this.meta.lastChar || 'ninja';
    this.char = pickChar(this.chars, this.charId);
    this.charId = this.char.id;
    patchSave({ lastChar: this.char.id });
    this.skillAt = -9999;
    this.guardUntil = 0;
    this.skillInvulnUntil = 0;
    this.guardAura = null;
    this.story = window.__storyData || {};
    // 批 9：章节关卡。没有 stage 参数时退回老的"随机一局"（?char= 调试仍走这条）
    this.stageData = (data && data.stage) || null;
    this.spec = this.stageData ? stageSpec(this.stageData.chapter, this.stageData.index) : null;
    this.stageMul = this.spec ? this.spec.diff : 1;
    this.usedRest = false;
    this.chapterTheme = this.spec ? this.spec.chapter.theme : null;
    this.cycle = this.meta.cycle;
    this.talking = false;
    this.panelOpen = false;
    this.props = [];
    this.zones = [];          // 毒雾等地面持续区域
    this.fireRain = [];       // 熔岩火雨预警圈
    this.fireRainT = 0;
    this.rainOn = false;
    this.rainCount = 2;       // 普通火雨 2 圈；终章第三幕 4 圈
    this.rainTint = 0xff7a2a;
    this.rainEdge = 0xfff0b0;
    this.rainBoom = 0xff6a20;
    this.rainDmg = 2;
    this.slowUntil = 0;       // 被蜘蛛网打中的减速截止时间
    // maxHp() 依赖 mods，先放一份零修正，天赋表在下面读完再覆盖
    this.mods = mergeMods(normalizeTalents(null), []);
    this.hp = this.maxHp();
    this.kills = 0;
    this.coins = 0;
    this.gems = 0;        // 本局宝石：Boss 1–3、通关 +5，结算时写进存档
    this.dead = false;
    this.won = false;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.atkAt = -9999;
    this.freeze = 0;
    this.freezePaused = false;
    this.facing = 'down';
    this.press = null;
    this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };

    this.cameras.main.setBackgroundColor('#2f3b2a');
    this.cameras.main.setBounds(0, 0, RW, RH);
    this.cameras.main.setRoundPixels(true);
    window.__playScene = this;


    // 音效实例表：键必须与 build.mjs 的 sfx 表一致，少一个就会在调用点静默失败
    this.sfx = {};
    const SFX_KEYS = ['sword', 'hit', 'hurt', 'kill', 'gameover', 'coin', 'ui', 'bonus', 'boom', 'alarm', 'magic'];
    const SFX_VOL = { gameover: 0.45, boom: 0.55, alarm: 0.5, ui: 0.4, bonus: 0.5, magic: 0.45 };
    SFX_KEYS.forEach((k) => {
      this.sfx[k] = this.sound.add(k, { volume: SFX_VOL[k] || 0.5 });
    });

    const SKIN_TEX = { ninja: 'walk', mage: 'walkMage', knight: 'walkKnight' };
    this.player = this.add.sprite(RW / 2, RH / 2, SKIN_TEX[this.char.skin] || 'walk', 0).setScale(2).setDepth(500);
    this.player.play('p-' + this.char.skin + '-idle-' + this.facing);
    this.camLook = { x: 0, y: 0 };
    this.cameras.main.startFollow(this.player, true, CFG.camLerp, CFG.camLerp);

    this.enemies = [];
    this.shots = [];          // 敌人射出的弹（会伤害玩家）
    this.bolts = [];          // 玩家射出的弹（会伤害敌人）
    this.W = normalizeWeapons(window.__weaponsData);
    this.weapon = this.W.byId[this.char.weapon] || this.W.byId[this.W.global.startWeapon];
    // 批 7：只有已解锁的武器进掉落池；职业起始武器永远保底，别让空池把掉落打崩
    const unlockedW = this.meta.unlockedWeapons || [];
    const keep = (w) => unlockedW.indexOf(w.id) >= 0 || w.id === this.char.weapon || w.id === this.W.global.startWeapon;
    const pool = this.W.list.filter(keep);
    this.W.list = pool.length ? pool : [this.weapon];
    // 天赋：本局三选一，重开清零；与 upg 分开算（flat 先、mul 后）
    this.T = normalizeTalents(window.__talentsData);
    this.talents = [];
    this.mods = mergeMods(this.T, this.talents);
    this.roomsEntered = 0;
    this.talentOpen = false;
    this.hand = this.add.image(0, 0, this.weapon.inhand || this.weapon.icon).setScale(2).setDepth(519);
    const legacy = Math.min(3, Math.max(0, (this.cycle - 1) * CFG.cycle.legacyPower));
    this.upg = { power: legacy, speed: 0, atk: 0 };
    this.drops = [];
    this.keyCount = 0;        // 本局钥匙：宝箱 1 把，精英必掉，商店可买（注意别叫 this.keys，那是 WASD 键位表）
    this.seenRooms = {};
    this.doorLocks = {};
    this.walls = new Set();
    this.roomWrap = null;

    this.dungeon = makeDungeon(this.spec ? { rooms: this.spec.rooms, template: this.spec.template } : null);
    this.roomTotal = this.dungeon.path.length;
    this.bossKind = '';
    this.bossId = '';
    this.enterRoom(this.dungeon.start, null);

    this.buildHud();
    setMood(this.room.isBoss ? 'fight' : 'dungeon');
    this.bindInput();

    if (location.search.indexOf('debug') >= 0) {
      window.__cfg = CFG;
      window.__dbg = {
        clear: () => this.enemies.filter((e) => e.hp > 0).forEach((e) => this.killEnemy(e)),
        hp: (v) => { this.hp = v; },
        exit: (dir) => this.tryExit(dir, true),
        next: () => {
          for (const dir of ['r', 'l', 'd', 'u']) {
            const key = this.room.doors[dir];
            if (!key) continue;
            const r = this.dungeon.rooms.get(key);
            if (r && r.idx > this.room.idx) { this.tryExit(dir, true); return dir; }
          }
          return false;
        },
        tp: (x, y) => this.player.setPosition(x, y),
        music: () => musicState(),
        playMood: (m, once) => { setMood(m, { loop: !once }); return musicState(); },
        sfxTest: (n) => { const a = this.sfx[n]; if (!a) return 'missing:' + n; a.play(); return 'ok:' + n; },
        save: () => loadSave(),
        plan: () => Array.from(this.dungeon.rooms.values()).sort((a, b) => a.idx - b.idx).map((r) => r.idx + ':' + r.type),
        die: () => this.gameOver(),
        win: () => this.win(),
        reset: () => resetSave(),
        bal: () => (window.__balance || null),
        spawn: (kind, x, y) => this.spawnFoe(kind, 0, { x, y }).kind,
        wipe: () => { this.enemies.forEach((e) => { if (e.ring) e.ring.destroy(); if (e.spr) e.spr.destroy(); }); this.enemies = []; },
        bosshp: (v) => { const b = this.enemies.find((e) => e.type === 'boss'); if (b) b.hp = v; },
        shots: () => this.shots.length,
        foes: () => this.enemies.map((e) => ({ k: e.kind || e.type, hp: e.hp, max: e.maxHp, el: !!e.elite, x: Math.round(e.spr.x), y: Math.round(e.spr.y), s: Math.round(e.speed), ph: e.phase, inv: !!e.invuln, sh: e.shield || 0, af: e.affix || '', d: e.dmg, wm: e.windupMul || 1 })),
        shotPos: () => this.shots.map((b) => [Math.round(b.spr.x), Math.round(b.spr.y)]),
        upgGive: (k, n) => { this.upg[k] += (n || 1); },
        atk: () => this.attack(),
        // 截图用：出招后 ms 毫秒把场景冻住，保证每次抓到的都是同一帧
        atkHold: (ms) => { this.attack(); this.time.delayedCall(ms || 80, () => this.scene.pause()); },
        resume: () => this.scene.resume(),
        stats: () => ({ dmg: this.wdmg(), cd: Math.round(this.wcd()), spd: Math.round(this.moveSpeed()), w: this.weapon.id }),
        weapon: () => ({ id: this.weapon.id, name: this.weapon.name, kind: this.weapon.kind, dmg: this.wdmg(), cd: Math.round(this.wcd()) }),
        give: (id) => { this.equipWeapon(id, true); return this.weapon.id; },
        dropW: (id) => this.dropItem(this.player.x + 22, this.player.y + 8, 'weapon', null, id || 'bigsword'),
        bolts: () => this.bolts.map((b) => [Math.round(b.spr.x), Math.round(b.spr.y), b.pierce]),
        props: () => this.props.map((p) => ({ k: p.kind, t: p.type, x: Math.round(p.spr.x), y: Math.round(p.spr.y), used: p.used })),
        dlg: () => (this.dlg ? { i: this.dlg.i, n: this.dlg.lines.length, line: this.dlg.lines[this.dlg.i], done: !this.dlg.timer } : null),
        panel: () => (this.panel ? { type: (this.panel.prop && this.panel.prop.type) || (this.panel.cards ? 'talent' : '?'), opts: this.panel.options.map((o) => o.label) } : null),
        advance: () => this.dlgAdvance(),
        chooseIdx: (i) => this.choose(i),
        toProp: (i) => { const p = this.props[i]; if (p) this.player.setPosition(p.spr.x, p.spr.y + 30); },
        cycle: () => this.cycle,
        forceEvent: (k) => {
          this.room.eventKind = k; this.room.cleared = false;
          this.props.forEach((p) => p.spr.destroy()); this.props = [];
          this.spawnRoomProps(this.room);
        },
        slowmo: (k) => { this.tweens.timeScale = k || 1; },
        pframe: () => (this.player.anims.currentFrame ? this.player.anims.currentFrame.index : -1),
        fxCount: () => this.children.list.filter((c) => c.depth >= 620 && c.depth < 900).length,
        slam: () => { const b = this.enemies.find((e) => e.type === 'boss'); if (b) this.slamImpact(b); },
        coins: (n) => { this.coins = n; },
        gems: (n) => { if (typeof n === 'number') this.gems = n; return this.gems; },
        weapons: () => this.W.list.map((w) => w.id),
        seen: () => { const m = loadSave(); return m.seen || {}; },
        jump: (i) => {
          const rooms = [...this.dungeon.rooms.values()];
          const target = typeof i === 'string' ? [...this.dungeon.rooms.values()].find((r) => r.isBoss)
            : rooms[Math.max(0, Math.min(rooms.length - 1, i))];
          if (!target) return;
          this.enemies.forEach((e) => e.spr.destroy());
          this.enemies = [];
          this.enterRoom(target.x + ',' + target.y, null);
        },
        hpv: () => this.hp,
        hearts: () => this.hearts.map((h) => ({ x: h.x, y: h.y, v: h.visible, a: h.alpha, d: h.depth, f: h.frame.name })),
        dropUpg: (k) => this.dropItem(this.player.x + 10, this.player.y + 6, 'upg', k),
        // 批 2：房间编排
        roomTypes: () => this.dungeon.path.map(([x, y]) => {
          const r = this.dungeon.rooms.get(x + ',' + y);
          return { i: r.idx, x, y, t: r.type, seen: !!r.built };
        }),
        roomType: () => this.room.type || 'battle',
        gate: () => ({ type: this.room.type, open: !!this.room.gateOpen, cleared: !!this.room.cleared,
          props: (this.props || []).filter((p) => p.kind === 'gate').length }),
        pull: () => { const p = (this.props || []).find((x) => x.kind === 'gate'); if (p) this.pullGate(p); return p ? 'ok' : 'none'; },
        // 批 3：层间天赋
        talents: () => ({ ids: this.talents.slice(), mods: Object.assign({}, this.mods),
          maxHp: this.maxHp(), dmg: this.dmg(), cd: Math.round(this.atkCd()), spd: Math.round(this.moveSpeed()) }),
        talentPool: (depth) => rollTalents(this.T, this.talents, depth || this.room.idx + 1, 3)
          .map((t) => [t.id, t.rarity]),
        openTalent: () => { this.offerTalent(); return !!this.panel; },
        pick: (i) => { this.pickTalent(i); return this.talents.slice(); },
        talentList: () => this.T.list.map((t) => [t.id, t.rarity]),
        addTalent: (id) => {
          if (!this.T.byId[id] || this.talents.indexOf(id) >= 0) return this.talents.slice();
          this.talents.push(id);
          this.mods = mergeMods(this.T, this.talents);
          this.hp = Math.min(this.hp, this.maxHp());
          this.rebuildHearts();
          this.updateHud();
          return this.talents.slice();
        },
        // 按房型直接跳（截图/验收用）：jumpType('shop')
        jumpType: (t) => {
          const r = [...this.dungeon.rooms.values()].find((x) => x.type === t);
          if (!r) return false;
          this.enemies.forEach((e) => { e.spr.destroy(); if (e.aura) e.aura.destroy(); });
          this.enemies = [];
          this.enterRoom(r.x + ',' + r.y, null);
          return true;
        },
        keys: (n) => { if (typeof n === 'number') this.keyCount = n; return this.keyCount; },
        keyDrop: () => this.dropItem(this.player.x + 20, this.player.y + 6, 'key'),
        use: () => this.interact(),
        tex: (k) => { const t = this.textures.get(k); return { ok: t.key !== '__MISSING', frames: t.getFrameNames().length }; },
        auraTest: () => {
          const s = this.add.sprite(this.player.x + 40, this.player.y, 'aura', 0)
            .setScale(2).setAlpha(0.9).setDepth(3).play('aura-pulse');
          s.setTint(0xffcc66);
          return 'ok';
        },
        shopStock: () => (this.room.shopStock || []).map((o) => [o.kind, o.label, o.price]),
        chestOpen: () => this.openChest((this.props || []).find((p) => p.kind === 'chest') || { spr: null, used: true }),
        clearDead: () => { this.enemies = this.enemies.filter((e) => e.hp > 0); },
        // 批 4
        newFoe: (kind) => { const at = { x: this.player.x + 70, y: this.player.y }; const e = this.spawnFoe(kind, 0, at); return e ? e.kind : 'cap'; },
        eliteFoe: (kind, affix) => {
          const at = { x: this.player.x + 80, y: this.player.y };
          const e = this.spawnFoe(kind || 'beast', 0, at);
          this.makeElite(e);
          if (affix) {
            e.affix = affix;
            e.shield = 0;
            if (affix === 'shield') { e.shield = 1; e.aura && e.aura.setTint(0x9fd8ff); }
            if (affix === 'split') { e.shield = 0; e.aura && e.aura.setTint(0x9be27a); }
          }
          return { kind: e.kind, affix: e.affix, hp: e.hp, shield: e.shield };
        },
        zonesList: () => this.zones.map((z) => [Math.round(z.x), Math.round(z.y), Math.round(z.radius), z.spr.alpha]),
        pressure: () => ({ waterSlow: this.waterSlow || 0, envSpeed: this.envSpeedMul(), currents: (this.currents || []).map((c) => [c.y, c.vx]), zones: this.zones.filter((z) => z.kind === 'quicksand').length, burn: this.zones.filter((z) => z.kind === 'burn').length, fireRain: (this.fireRain || []).length, rainT: Math.round(this.fireRainT || 0) }),
        bossKind: () => this.bossKind || '',
        boss: (k) => { this.forceKind = k; this.spawnBoss(); return this.bossKind; },
        forceBoss: (k) => { this.bossKind = k; return this.bossKind; },
        clock: () => Math.round(this.time.now),
        char: () => ({ id: this.char.id, hp: this.maxHp(), dmg: this.dmg(), spd: Math.round(this.moveSpeed()), w: this.weapon.id, skill: this.char.skill.id }),
        theme: () => this.theme || '',
        light: (on) => {
          if (this.roomFx) this.roomFx.setVisible(!!on);
          if (this.vig) this.vig.setVisible(!!on);
          return !!on;
        },
        dustCount: () => (this.dust ? this.dust.getAliveParticleCount() : 0),
        dust: (on) => { if (this.dust) { on ? this.dust.start() : this.dust.stop(); } return !!on; },
        fxChild: (i, on) => { if (!this.roomFx) return false; const c = this.roomFx.getAt ? this.roomFx.getAt(i) : null; if (!c) return false; c.setVisible(!!on); return true; },
        chars: () => this.chars.map((c) => [c.id, c.hp, c.dmg, c.speed, c.weapon, c.skill.id]),
        skill: () => this.castSkill(),
        skillState: () => ({
          id: this.char.skill.id,
          left: Math.max(0, Math.round(this.char.skill.cd - (this.time.now - this.skillAt))),
          guard: Math.max(0, Math.round(this.guardUntil - this.time.now)),
          invuln: Math.max(0, Math.round(this.skillInvulnUntil - this.time.now)),
        }),
        pickChar: (id) => this.scene.restart({ char: id }),
        wallAt: (x, y, h) => this.isWall(x, y, h || 10),
        bossInfo: () => { const b = this.enemies.find((e) => e.type === 'boss'); return b ? { x: Math.round(b.spr.x), y: Math.round(b.spr.y), ph: b.phase, dist: Math.round(Phaser.Math.Distance.Between(b.spr.x, b.spr.y, this.player.x, this.player.y)), px: Math.round(this.player.x), py: Math.round(this.player.y), speed: b.speed, blockedW: this.isWall(b.spr.x, b.spr.y, b.half) } : null; },
        slowNow: () => (this.time.now < this.slowUntil ? Math.round(this.slowUntil - this.time.now) : 0),
        webAt: () => { this.slowUntil = this.time.now + CFG.spider.webSlowMs; return Math.round(this.slowUntil - this.time.now); },
      };
    }
  }

  /* ---------- 房间 ---------- */
  enterRoom(key, fromDir) {
    const room = this.dungeon.rooms.get(key);
    // 离开上一间时，把它没捡的掉落记在房间上，回来还在
    if (this.room && this.drops) {
      this.room.dropState = this.drops.map((d) => ({ kind: d.kind, x: d.baseX, y: d.baseY, up: d.up, id: d.id }));
      this.drops.forEach((d) => d.spr.destroy());
    }
    this.room = room;
    this.roomKey = key;
    if (this.roomWrap) this.roomWrap.destroy(true);
    if (this.roomFx) { this.roomFx.destroy(true); this.roomFx = null; }
    if (this.dust) { this.dust.destroy(); this.dust = null; }
    this.roomWrap = this.add.container(0, 0).setDepth(0);
    this.enemies = [];
    this.drops = [];
    this.doorLocks = {};
    this.walls = new Set();
    // 批 11：跨房清理毒雾/流沙/水流，避免上一间的区域残留
    (this.zones || []).forEach((z) => { if (z.spr) z.spr.destroy(); });
    this.zones = [];
    (this.currents || []).forEach((c) => { if (c.spr) c.spr.destroy(); });
    this.currents = [];
    (this.fireRain || []).forEach((r) => { if (r.spr) r.spr.destroy(); });
    this.fireRain = [];
    this.fireRainT = 0;
    this.rainOn = false;
    this.rainCount = 2;
    this.rainTint = 0xff7a2a;
    this.rainEdge = 0xfff0b0;
    this.rainBoom = 0xff6a20;
    this.rainDmg = 2;
    this.waterSlow = 0;

    const t = room.type || 'battle';
    setMood(room.isBoss ? 'fight' : (t === 'shop' ? 'shop' : (t === 'rest' ? 'cave' : 'dungeon')));
    this.props.forEach((p) => p.spr && p.spr.destroy());
    this.props = [];
    this.closePanel();

    this.entry = fromDir ? OPPOSITE[fromDir] : null;
    this.paintFloorAndWalls(room);
    if (this.markSeen) this.markSeen('rooms', t);
    this.spawnRoomEnemies(room);
    this.spawnRoomProps(room);
    (room.dropState || []).forEach((d) => this.dropItem(d.x, d.y, d.kind, d.up, d.id));

    // 从哪个门进来，就落在对面的门口
    if (fromDir) {
      const back = OPPOSITE[fromDir];
      const p = this.player;
      if (back === 'l') p.setPosition(TILE * 2.5, RH / 2);
      else if (back === 'r') p.setPosition(RW - TILE * 2.5, RH / 2);
      else if (back === 'u') p.setPosition(RW / 2, TILE * 2.5);
      else p.setPosition(RW / 2, RH - TILE * 2.5);
    } else {
      this.player.setPosition(RW / 2, RH / 2);
    }
    if (this.spec) this.applyRoomPressure(room);
    this.cameras.main.setBounds(0, 0, RW, RH);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.room.built = true;
    if (room.isBoss) this.iframe = 700;   // 进门先给一口气，避免贴脸秒杀
    this.refreshDoorLocks();
    this.drawMinimap();
    this.trackRoom(room);

    // 层间天赋：每进 2 间给一次三选一；进房回血的天赋在这里生效
    this.roomsEntered = (this.roomsEntered || 0) + 1;
    if (this.roomsEntered > 1 && this.mods.healOnRoom) {
      this.hp = Math.min(this.maxHp(), this.hp + this.mods.healOnRoom);
      this.floatText(this.player.x, this.player.y - 30, '+' + this.mods.healOnRoom + ' HP', '#9be27a');
    }
    if (this.roomsEntered > 1 && this.roomsEntered % 2 === 0 && !room.isBoss) {
      this.time.delayedCall(240, () => this.offerTalent());
    }
    const RD = (this.story.rooms || {})[t] || {};

    // 转场：120ms 黑场淡入 + 屏幕中央房名横幅（Boss 房用红字）
    this.cameras.main.fadeIn(120, 0, 0, 0);
    this.roomBanner(RD.name || TYPE_NAME[t] || '', room.isBoss);
  }

  /* 房名横幅：屏幕中央淡入淡出，不挡 HUD */
  roomBanner(name, boss) {
    if (!name) return;
    const txt = this.add.text(S.W / 2, S.H * 0.3, name, {
      fontFamily: FONT, fontSize: '16px', color: boss ? '#ff8a7a' : '#ffe9b0',
      backgroundColor: '#00000066', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(830).setAlpha(0);
    this.tweens.add({ targets: txt, alpha: 1, y: S.H * 0.3 - 6, duration: 260, ease: 'Quad.easeOut' });
    this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: txt, alpha: 0, duration: 300, onComplete: () => txt.destroy() });
    });
  }

  /* 房型进过一次就记一笔（只写不读，给批 7 的图鉴用） */
  trackRoom(room) {
    const t = room.type || 'battle';
    if (this.seenRooms[this.roomKey]) return;
    this.seenRooms[this.roomKey] = true;
    const seen = Object.assign({}, this.meta.roomsSeen || {});
    seen[t] = (seen[t] || 0) + 1;
    this.meta = patchSave({ roomsSeen: seen });
  }

  /* 3×3 小地图：未进过的点暗，进过的点按房型上色，当前房间白框 */
  drawMinimap() {
    if (!this.mini) this.mini = this.add.graphics().setScrollFactor(0).setDepth(800);
    const g = this.mini;
    g.clear();
    const px = S.W - 56, py = 46, cell = 11, gap = 2;
    this.dungeon.rooms.forEach((r) => {
      const x = px + r.x * (cell + gap);
      const y = py + r.y * (cell + gap);
      const seen = r.built || r === this.room;
      const color = seen ? (ROOM_COLOR[r.type] || ROOM_COLOR.battle) : 0x2b3226;
      g.fillStyle(color, seen ? 0.95 : 0.45);
      g.fillRect(x, y, cell, cell);
      if (r === this.room) {
        g.lineStyle(2, 0xffffff, 0.95);
        g.strokeRect(x - 1, y - 1, cell + 2, cell + 2);
      } else if (seen) {
        g.lineStyle(1, 0x000000, 0.55);
        g.strokeRect(x, y, cell, cell);
      }
    });
  }

  /* 暗角改用 UI 层下面的贴图：postFX 会把 HUD 一起压黑，熔岩强暗角下连血量都看不清 */
  buildVignette(theme) {
    if (this.vig) { this.vig.destroy(); this.vig = null; }
    if (!this.textures.exists('roomVig')) {
      const w = 640, h = 360;
      const tex = this.textures.createCanvas('roomVig', w, h);
      const ctx = tex.getContext();
      const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, w * 0.66);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.55, 'rgba(0,0,0,0.06)');
      grd.addColorStop(1, 'rgba(0,0,0,0.34)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      tex.refresh();
    }
    const alpha = { field: 0.5, fort: 0.78, desert: 0.78, water: 0.88, lava: 1, sky: 1, dungeon: 0.9 };
    this.vig = this.add.image(0, 0, 'roomVig').setOrigin(0)
      .setDisplaySize(S.W, S.H).setScrollFactor(0).setDepth(790)
      .setAlpha(alpha[theme] || 0.85);
  }

  paintFloorAndWalls(room) {
    const wrap = this.roomWrap;
    // 主题：前半程草地、后半程石砖；Boss 房与二周目起强制石砖
    // 章节模式：沙漠/水殿沿用石砖底板，靠染色 + 环境粒子/光柱区分（包内没有整屏专属地板）
    const THEME_SET = ['field', 'fort', 'desert', 'water', 'lava', 'sky'];
    const theme = this.spec
      ? (THEME_SET.indexOf(this.chapterTheme) >= 0 ? this.chapterTheme : 'dungeon')
      : ((room.isBoss || room.idx >= Math.ceil(this.roomTotal / 2) || this.cycle >= 2) ? 'dungeon' : 'field');
    this.theme = theme;
    const stone = theme !== 'field';
    const floorKey = stone ? 'floorDungeon' : 'field';
    // 石砖房用 Interior 花砖（322）作底；旧堡/沙海/水殿再压一层主题色
    const floorFrame = stone ? 322 : 21;
    const floor = this.add.tileSprite(0, 0, RW, RH, floorKey, floorFrame).setOrigin(0);
    wrap.add(floor);
    if (theme === 'fort' || theme === 'desert' || theme === 'water' || theme === 'lava' || theme === 'sky') {
      const TINT = { fort: 0xffcbb0, desert: 0xf2cf9a, water: 0x9fd8e8, lava: 0xffb08a, sky: 0x7060a8 };
      const GLOW = { fort: 0xff9a50, desert: 0xffc060, water: 0x3a9fd0, lava: 0xff4a20, sky: 0x7a5aff };
      floor.setTint(TINT[theme]);
      const warm = this.add.rectangle(0, 0, RW, RH, GLOW[theme], theme === 'water' ? 0.2 : (theme === 'lava' ? 0.24 : (theme === 'sky' ? 0.14 : 0.22))).setOrigin(0)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(0.15);
      wrap.add(warm);
    }

    // 地板贴花：石砖用裂纹/碎石/头骨，草地用草簇（全部取自 TilesetFloorDetail，半透明压在地面）
    const decals = theme === 'field' ? [32, 35, 39, 44, 46, 47]
      : (theme === 'fort' ? [0, 1, 6, 8, 12]
        : (theme === 'desert' ? [0, 6, 8, 9, 12]
          : (theme === 'water' ? [0, 1, 6, 8, 15]
            : (theme === 'lava' ? [0, 1, 6, 8, 9, 12] : (theme === 'sky' ? [0, 6, 8, 9, 12, 15] : [0, 1, 6, 8, 9, 12, 15])))));
    for (let i = 0; i < 16; i++) {
      const dx = Phaser.Math.Between(TILE * 3, RW - TILE * 3);
      const dy = Phaser.Math.Between(TILE * 3, RH - TILE * 3);
      wrap.add(this.add.image(dx, dy, 'floorDetail', decals[i % decals.length])
        .setAlpha(theme === 'field' ? 0.4 : 0.55).setTint(theme === 'lava' ? 0xff7a4a : 0xffffff).setDepth(0.4));
    }
    if (theme === 'lava') {
      // 熔岩裂纹：用同一套地板贴花染橙并加法叠亮，避免再引一张外部底图
      for (let i = 0; i < 7; i++) {
        const dx = Phaser.Math.Between(TILE * 3, RW - TILE * 3);
        const dy = Phaser.Math.Between(TILE * 3, RH - TILE * 3);
        wrap.add(this.add.image(dx, dy, 'floorDetail', [0, 6, 8, 12][i % 4])
          .setAlpha(0.34).setTint(0xff5a20).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.35));
      }
    }
    if (theme === 'sky') {
      // 星空：用包内 Snow 粒子的单帧当星点，不改图集、不新绘素材
      const stars = [];
      for (let i = 0; i < 58; i++) {
        const star = this.add.image(
          Phaser.Math.Between(TILE * 2, RW - TILE * 2),
          Phaser.Math.Between(TILE * 2, RH - TILE * 2),
          'dust', Phaser.Math.Between(0, 6),
        ).setTint(Phaser.Math.RND.pick([0xe8d8ff, 0xffe8c8, 0xc8d8ff]))
          .setAlpha(Phaser.Math.FloatBetween(0.18, 0.65))
          .setScale(Phaser.Math.FloatBetween(0.5, 1.25))
          .setDepth(0.22).setBlendMode(Phaser.BlendModes.ADD);
        wrap.add(star);
        stars.push(star);
      }
      this.tweens.add({ targets: stars, alpha: '+=0.28', duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const halo = this.add.image(RW / 2, RH * 0.16, 'aura', 0)
        .setScale(4.2).setTint(0xd8c8ff).setAlpha(0.1)
        .setDepth(0.3).setBlendMode(Phaser.BlendModes.ADD);
      wrap.add(halo);
    }

    if (room.isBoss) {
      const BT = { dungeon: 0x223322, fort: 0x33221a, desert: 0x33220f, water: 0x0e2633, lava: 0x33100c, sky: 0x100820 };
      wrap.add(this.add.rectangle(0, 0, RW, RH, BT[theme] || 0x223322, 0.25).setOrigin(0));
    }

    const midX = Math.floor(COLS / 2), midY = Math.floor(ROWS / 2);
    const doorGap = (x, y) => {
      if (x === 0) return !!room.doors.l && Math.abs(y - midY) <= 1;
      if (x === COLS - 1) return !!room.doors.r && Math.abs(y - midY) <= 1;
      if (y === 0) return !!room.doors.u && Math.abs(x - midX) <= 1;
      if (y === ROWS - 1) return !!room.doors.d && Math.abs(x - midX) <= 1;
      return false;
    };

    const wallRect = (parent, x, y, color) => parent.add(this.add.rectangle(
      x * TILE + TILE / 2, y * TILE + TILE / 2, TILE, TILE, color
    ).setStrokeStyle(2, 0x0b120a, 0.45));

    const WALL_TONE = theme === 'field' ? 0x2b3a20
      : (theme === 'fort' ? 0x3a2822
        : (theme === 'desert' ? 0x5a4128
          : (theme === 'water' ? 0x22364a
            : (theme === 'lava' ? 0x4a2018 : (theme === 'sky' ? 0x1a1830 : 0x2a2426)))));
    const wallAt = (x, y) => {
      wallRect(wrap, x, y, WALL_TONE);
      this.walls.add(x + ',' + y);
    };

    for (let x = 0; x < COLS; x++) {
      if (!doorGap(x, 0)) wallAt(x, 0);
      if (!doorGap(x, ROWS - 1)) wallAt(x, ROWS - 1);
    }
    for (let y = 0; y < ROWS; y++) {
      if (!doorGap(0, y)) wallAt(0, y);
      if (!doorGap(COLS - 1, y)) wallAt(COLS - 1, y);
    }

    // 门洞：沙地底 + 锁着的墙
    ['l', 'r', 'u', 'd'].forEach((dir) => {
      if (!room.doors[dir]) return;
      const cells = [];
      if (dir === 'l' || dir === 'r') {
        const x = dir === 'l' ? 0 : COLS - 1;
        for (let dy = -1; dy <= 1; dy++) cells.push([x, midY + dy]);
      } else {
        const y = dir === 'u' ? 0 : ROWS - 1;
        for (let dx = -1; dx <= 1; dx++) cells.push([midX + dx, y]);
      }
      cells.forEach(([x, y]) => wrap.add(
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'field', 3).setScale(2)
      ));

      const lock = this.add.container(0, 0);
      cells.forEach(([x, y]) => wallRect(lock, x, y, 0x5c5648));
      wrap.add(lock);
      lock.cells = cells;
      this.doorLocks[dir] = lock;
      cells.forEach(([x, y]) => this.walls.add(x + ',' + y));
    });

    // 内部障碍：2×2 深绿块
    let placed = 0, guard = 0;
    while (placed < 4 && guard++ < 80) {
      const bx = Phaser.Math.Between(3, COLS - 5);
      const by = Phaser.Math.Between(3, ROWS - 5);
      if (Math.abs(bx - midX) <= 3 && Math.abs(by - midY) <= 3) continue;      // 别堵住出生点
      if (Math.abs(by - midY) <= 3 && (bx < 4 || bx > COLS - 5)) continue;     // 别堵左右门
      if (Math.abs(bx - midX) <= 3 && (by < 4 || by > ROWS - 5)) continue;     // 别堵上下门
      for (let ix = 0; ix < 2; ix++) for (let iy = 0; iy < 2; iy++) wallAt(bx + ix, by + iy);
      placed++;
    }
    /* 伪光照：屏幕暗角（贴图压在 HUD 下面，避免把血量/文字也压黑）+ 墙角火把 + 石砖房光柱 + 灰尘粒子 */
    this.buildVignette(theme);
    const fx = this.add.container(0, 0).setDepth(615);
    this.roomFx = fx;

    const corners = [[TILE * 3, TILE * 3], [RW - TILE * 3, TILE * 3], [TILE * 3, RH - TILE * 3], [RW - TILE * 3, RH - TILE * 3]];
    for (let i = 0; i < 2; i++) {
      const [tx, ty] = corners[i === 0 ? 0 : 3];
      const torch = this.add.image(tx, ty, 'aura', 0)
        .setScale(2.6).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(theme === 'field' ? 0xffc27a
          : theme === 'fort' ? 0xff8a5a
            : theme === 'desert' ? 0xffb060
              : theme === 'water' ? 0x8ad8ff
                : theme === 'lava' ? 0xff6a30 : (theme === 'sky' ? 0xc8a0ff : 0xff9a4a));
      fx.add(torch);
      this.tweens.add({ targets: torch, alpha: 0.18, scale: 3.2, duration: 520 + i * 90, yoyo: true, repeat: -1 });
    }

    if (theme === 'dungeon' || theme === 'water' || theme === 'desert' || theme === 'lava' || theme === 'sky') {
      const BEAM_TINT = { dungeon: 0xffe0b0, water: 0x9fe4ff, desert: 0xffd08a, lava: 0xff8a4a, sky: 0xd8c8ff };
      const beam = this.add.image(RW * 0.32, RH * 0.36, 'ray', 0)
        .setScale(theme === 'water' ? 1.9 : (theme === 'sky' ? 2.1 : 1.6)).setRotation(theme === 'water' ? 0.2 : (theme === 'sky' ? -0.18 : 0.42))
        .setAlpha(theme === 'water' ? 0.14 : (theme === 'lava' ? 0.12 : (theme === 'sky' ? 0.16 : 0.1)))
        .setBlendMode(Phaser.BlendModes.ADD).setTint(BEAM_TINT[theme]);
      fx.add(beam);
      this.tweens.add({ targets: beam, alpha: theme === 'sky' ? 0.08 : (theme === 'water' ? 0.07 : 0.05), duration: 1600, yoyo: true, repeat: -1 });
    }

    this.dust = this.add.particles(0, 0, 'dust', {
      x: { min: TILE * 2, max: RW - TILE * 2 },
      y: { min: TILE * 2, max: RH - TILE * 2 },
      lifespan: { min: 2400, max: 4600 },
      speedX: { min: -8, max: 8 }, speedY: { min: -12, max: -3 },
      scale: { min: 0.35, max: 0.8 },
      alpha: { start: 0.28, end: 0 },
      quantity: 1, frequency: 520, maxAliveParticles: 14,
      tint: theme === 'field' ? 0xf2ecc8
        : (theme === 'fort' ? 0xe8c4a8
          : (theme === 'desert' ? 0xf0d8a8 : (theme === 'water' ? 0xb8ecff
            : (theme === 'lava' ? 0xff9a5a : (theme === 'sky' ? 0xe8d8ff : 0xd8c8a8))))),
      blendMode: 'ADD',
    }).setDepth(614);

  }

  /* 批 11 环境压力：沙海流沙 / 水殿水沟。
   * 只作用于战斗与精英房，Boss 房保持干净读招；进房时旧区域已被 enterRoom 清空。 */
  applyRoomPressure(room) {
    if (!this.spec) return;
    const t = room.type || 'battle';
    if (t !== 'battle' && t !== 'elite') return;
    const press = (this.spec.chapter && this.spec.chapter.pressure) || [];

    if (press.indexOf('quicksand') >= 0) {
      for (let i = 0; i < 2; i++) {
        let x = 0, y = 0, ok = false;
        for (let tries = 0; tries < 30 && !ok; tries++) {
          x = Phaser.Math.Between(TILE * 4, RW - TILE * 4);
          y = Phaser.Math.Between(TILE * 4, RH - TILE * 4);
          ok = !this.isWall(x, y, 58)
            && Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 120;
        }
        if (!ok) continue;
        const radius = 58;
        const spr = this.add.circle(x, y, radius, 0x6a4a28, 0.26)
          .setDepth(0.8).setStrokeStyle(3, 0xe8c890, 0.82);
        const core = this.add.circle(x, y, radius * 0.55, 0x3a2410, 0.28)
          .setDepth(0.82).setStrokeStyle(1, 0xd8b070, 0.55);
        this.tweens.add({ targets: [spr, core], alpha: 0.24, scale: 1.06, duration: 900 + i * 120, yoyo: true, repeat: -1 });
        this.zones.push({
          kind: 'quicksand', x, y, radius, pull: 52, slow: 0.62,
          until: Number.MAX_SAFE_INTEGER, tickAt: 0, tick: 1, dmg: 0, spr,
        });
        this.roomWrap.add(core);
        this.roomWrap.add(spr);
        spr.setDepth(0.8); core.setDepth(0.82);
      }
      // 沙尘横吹，给一张"风在动"的底
      const haze = this.add.rectangle(0, 0, RW, RH, 0xd8a860, 0.06).setOrigin(0)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(0.2);
      this.roomWrap.add(haze);
    }

    if (press.indexOf('waterSlow') >= 0) {
      this.waterSlow = 0.85;
      for (let i = 0; i < 2; i++) {
        const y = Math.round(RH * (i ? 0.64 : 0.36));
        const h = TILE * 2.4;
        const dir = i ? -1 : 1;
        const spr = this.add.rectangle(RW / 2, y, RW - TILE * 4, h, 0x4aa8d8, 0.10)
          .setDepth(0.9).setStrokeStyle(1, 0x8ad8ff, 0.25);
        this.roomWrap.add(spr);
        for (let k = 0; k < 4; k++) {
          const ax = RW * (0.18 + k * 0.2);
          const tri = this.add.triangle(ax, y, 0, 0, 16, 8, 0, 16, 0x8ad8ff, 0.28)
            .setDepth(1).setAngle(dir > 0 ? 0 : 180);
          this.roomWrap.add(tri);
        }
        this.currents.push({ x: RW / 2, y, w: RW - TILE * 4, h, vx: dir * 34, spr });
      }
    }

    // 批 12A：熔岩地心 —— 灼烧地裂 + 火雨预警
    if (press.indexOf('burn') >= 0) {
      for (let i = 0; i < 3; i++) {
        let x = 0, y = 0, ok = false;
        for (let tries = 0; tries < 30 && !ok; tries++) {
          x = Phaser.Math.Between(TILE * 4, RW - TILE * 4);
          y = Phaser.Math.Between(TILE * 4, RH - TILE * 4);
          ok = !this.isWall(x, y, 44)
            && Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 120;
        }
        if (!ok) continue;
        const radius = 44;
        const spr = this.add.circle(x, y, radius, 0x9a2c10, 0.4)
          .setDepth(0.78).setStrokeStyle(3, 0xff6a30, 0.9);
        const core = this.add.circle(x, y, radius * 0.5, 0xff6a20, 0.28)
          .setDepth(0.8).setStrokeStyle(2, 0xffb060, 0.6)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: [spr, core], alpha: 0.3, scale: 1.07, duration: 720 + i * 100, yoyo: true, repeat: -1 });
        this.roomWrap.add(core);
        this.roomWrap.add(spr);
        spr.setDepth(0.78); core.setDepth(0.8);
        this.zones.push({
          kind: 'burn', x, y, radius, until: Number.MAX_SAFE_INTEGER,
          tickAt: 0, tick: 650, dmg: 1, spr,
        });
      }
      const heat = this.add.rectangle(0, 0, RW, RH, 0xff3a10, 0.05).setOrigin(0)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(0.18);
      this.roomWrap.add(heat);
    }
    if (press.indexOf('firerain') >= 0) {
      this.rainOn = true;
      this.fireRainT = 1800;
      const haze = this.add.rectangle(0, 0, RW, RH, 0xff5a20, 0.04).setOrigin(0)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(0.19);
      this.roomWrap.add(haze);
    }
  }

  envSpeedMul() {
    let m = this.waterSlow || 1;
    for (const z of this.zones) {
      if (z.kind !== 'quicksand') continue;
      const d = Phaser.Math.Distance.Between(z.x, z.y, this.player.x, this.player.y);
      if (d <= z.radius) m *= z.slow;
    }
    return m;
  }

  applyEnvForces(dt) {
    const p = this.player;
    for (const z of this.zones) {
      if (z.kind !== 'quicksand') continue;
      const d = Phaser.Math.Distance.Between(z.x, z.y, p.x, p.y);
      if (d > z.radius || d < 2) continue;
      const pull = z.pull * (dt / 1000);
      this.moveActor(p, (z.x - p.x) / d * pull, (z.y - p.y) / d * pull, 10);
    }
    for (const c of this.currents) {
      if (Math.abs(p.y - c.y) > c.h / 2) continue;
      this.moveActor(p, c.vx * (dt / 1000), 0, 10);
    }
  }

  refreshDoorLocks() {
    const alive = this.enemiesAlive();
    Object.entries(this.doorLocks).forEach(([dir, lock]) => {
      if (!lock) return;
      const gateShut = this.room.type === 'gate' && !this.room.gateOpen;
      const open = this.room.cleared || (alive === 0 && !gateShut);
      lock.setVisible(!open);
      (lock.cells || []).forEach(([x, y]) => {
        if (open) this.walls.delete(x + ',' + y);
        else this.walls.add(x + ',' + y);
      });
    });
  }

  enemiesAlive() {
    return this.enemies.filter((e) => e.hp > 0).length;
  }

  spawnRoomEnemies(room) {
    if (room.cleared && room.built) return;
    if (room.isBoss) { this.spawnBoss(); return; }
    const t = room.type || 'battle';

    // 非战斗房直接算清场：门锁不拦路，玩家可以安心翻箱
    if (t === 'shop' || t === 'shrine' || t === 'rest') { room.cleared = true; return; }

    if (t === 'elite') {
      const e = this.spawnFoe(this.pickKind(Math.max(1, room.idx)), 240);
      this.makeElite(e);
      for (let i = 0; i < 2; i++) this.spawnFoe(this.pickKind(room.idx), 170);
      return;
    }
    if (t === 'treasure') {
      // 宝箱有 2 个守卫：想开箱子先清场（清完宝箱本体仍锁着，等钥匙）
      for (let i = 0; i < 2; i++) this.spawnFoe(this.pickKind(room.idx), 150);
      return;
    }
    if (t === 'gate') {
      // 机关房：3 个守卫 + 一尊机关石像；石像不拉，门不开
      for (let i = 0; i < 3; i++) this.spawnFoe(this.pickKind(room.idx), 170);
      return;
    }
    const n = Phaser.Math.Between(CFG.roomEnemiesMin, CFG.roomEnemiesMax) + Math.min(2, room.idx);
    for (let i = 0; i < n; i++) this.spawnFoe(this.pickKind(room.idx), 200);
  }

  /* 精英：任意怪带 1 个词缀（狂暴/护盾/分裂/迅捷），外观放大 + 染色 + 脚下光环 */
  makeElite(e) {
    const E = CFG.elite;
    const AFFIX = ['enrage', 'shield', 'split', 'swift'];
    const affix = AFFIX[Phaser.Math.Between(0, AFFIX.length - 1)];
    const NAME = { enrage: '狂暴', shield: '护盾', split: '分裂', swift: '迅捷' };
    const COLOR = { enrage: 0xff9a7a, shield: 0x9fd8ff, split: 0x9be27a, swift: 0xffe08a };

    e.elite = true;
    e.affix = affix;
    e.maxHp = e.hp = Math.max(1, Math.round(e.hp * (E.hpMul || 1.8)));
    const A = (E.affix && E.affix[affix]) || {};
    if (affix === 'enrage') {
      e.maxHp = e.hp = Math.max(1, Math.round(e.hp * (A.hp || 1)));
      e.dmg = Math.max(1, Math.round(e.dmg * (A.dmg || 1)));
      e.speed = Math.round(e.speed * (A.speed || 1));
    }
    if (affix === 'swift') {
      e.speed = Math.round(e.speed * (A.speed || 1));
      e.windupMul = A.windup || 0.7;
    }
    if (affix === 'shield') e.shield = 1;

    e.spr.setScale(2.5).setTint(COLOR[affix]);
    e.aura = this.add.sprite(e.spr.x, e.spr.y + 10, 'aura', 0)
      .setScale(1.7).setAlpha(0.9).setDepth(1.2).play('aura-pulse').setTint(COLOR[affix]);
    this.floatText(e.spr.x, e.spr.y - 30, '精英 · ' + NAME[affix], '#ffd479');
    return e;
  }

  /* 找一个不压墙、且离玩家至少 minDist 的空地 */
  findFreeSpot(minDistFromPlayer) {
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(TILE + 16, RW - TILE - 16);
      const y = Phaser.Math.Between(TILE + 16, RH - TILE - 16);
      if (this.isWall(x, y, 14)) continue;
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < minDistFromPlayer) continue;
      return { x, y };
    }
    return { x: RW / 2, y: TILE * 3 };
  }

  spawnBeast() { this.spawnFoe('beast', 200); }

  /* 小怪统一出生：行为差异全在 updateFoe 里分派 */
  spawnFoe(kind, minDist, at) {
    // 同屏上限 8：再多就打不过来了，分裂/召唤也不会无限铺场
    if (this.enemiesAlive() >= 8) return null;
    const spot = at || this.findFreeSpot(minDist || 200);
    const cfg = kind === 'beast' ? {
      hp: CFG.enemyHp, speed: CFG.enemySpeed, dmg: CFG.touchDmg, half: 12,
    } : CFG[kind];
    this.markSeen('enemies', kind);
    const spr = this.add.sprite(spot.x, spot.y, kind, 0).setScale(2).setDepth(2).setAlpha(0);
    spr.play(kind + '-down');
    this.tweens.add({ targets: spr, alpha: 1, duration: 240 });
    const mul = (1 + CFG.cycle.hpMul * (this.cycle - 1)) * (this.stageMul || 1);
    const hp = Math.max(1, Math.round(cfg.hp * mul * this.diff.hp));
    const e = {
      type: 'foe', kind, spr, hp, maxHp: hp,
      kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
      speed: cfg.speed, dmg: cfg.dmg * (1 + (this.stageMul - 1) * 0.4), half: cfg.half || 12,
      stuckT: 0, slideT: 0, slide: new Phaser.Math.Vector2(),
      phase: 'walk', phaseT: 0, cdT: 0, mini: false,
      shield: 0, invuln: false, affix: '', windupMul: 1, baseScale: 2,
    };
    if (kind === 'owl') { e.phase = 'hover'; e.phaseT = cfg.hoverMs; }
    if (kind === 'mush') { e.phase = 'walk'; e.cdT = cfg.poisonCd; }
    if (kind === 'racoon') { e.hop = new Phaser.Math.Vector2(); e.cdT = cfg.hopCd; }
    if (kind === 'axolot') e.healT = cfg.healCd;
    if (kind === 'kappa') e.phaseT = 0;
    if (kind === 'flam' || kind === 'dragon' || kind === 'lantern' || kind === 'spirit') e.cdT = cfg.shotCd;
    if (kind === 'demon') e.cdT = cfg.chargeCd;
    this.enemies.push(e);
    return e;
  }

  /* 越往里走越可能遇到"带脾气"的怪：房间序号决定权重，保证前两间是纯近战教学 */
  pickKind(idx) {
    // 章节模式：只从本章怪池里抽；首间优先近战，别一进门就吃弹幕
    if (this.spec) {
      const pool = ((this.spec.chapter && this.spec.chapter.monsters) || [])
        .filter((k) => k === 'beast' || CFG[k]);
      if (pool.length) {
        if (idx <= 0) {
          // 首间只出低威胁怪，并按已生成数量交替，避免整间清一色同一种
          const easy = ['beast', 'larva', 'slime', 'racoon', 'spider', 'mole', 'snake', 'lizard', 'mouse', 'fish', 'axolot', 'mollusc', 'flam', 'demon']
            .filter((k) => pool.includes(k));
          if (easy.length) return easy[this.enemies.length % easy.length];
          return pool[0];
        }
        return pool[Phaser.Math.Between(0, pool.length - 1)];
      }
    }
    if (idx <= 0) return 'beast';
    const pool = ['beast', 'beast'];
    if (idx >= 1) pool.push('cyclope', 'slime');
    if (idx >= 2) pool.push('eye', 'spider');
    if (idx >= 3) pool.push('larva', 'mush');
    if (idx >= 4) pool.push('owl', 'mole');
    if (idx >= 5) pool.push('skull', 'spider');
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  /* Boss 选择：返回 bosses.json 的 id；老模式仍是青蛙/蓝武士随机 */
  pickBossKind() {
    if (this.forceKind) {
      const f = bossMetaByKind(this.forceKind);
      return f ? f.id : 'frog';
    }
    if (!this.spec) return Math.random() < 0.5 ? 'frog' : 'samBlue';
    const pool = (this.spec.bossPool || []).filter((id) => bossMeta(id));
    if (!pool.length) return this.chapterTheme === 'field' ? 'frog' : 'samBlue';
    return pool[(this.spec.index - 1) % pool.length];
  }

  spawnBoss() {
    // 生成在对侧，别压在玩家进门的位置上；用相对距离而不是固定半场，
    // 这样从任何门进来 Boss 都在镜头附近，不会一开局就在屏幕外。
    const p = this.player;
    const bx = RW / 2;
    const by = Phaser.Math.Clamp(p.y + (p.y >= RH / 2 ? 150 : -150), TILE * 3, RH - TILE * 3);
    const id = this.pickBossKind();
    const def = bossMeta(id) || bossMeta('frog');
    this.forceKind = null;
    this.bossId = def.id;
    this.bossKind = def.kind;
    this.markSeen('bosses', def.seen || def.id);
    const cyc = 1 + CFG.cycle.bossMul * (this.cycle - 1);
    const hp = Math.round((def.hp || CFG.bossHp) * cyc * this.diff.hp * this.stageMul);
    const dmg = (def.dmg || CFG.bossDmg) * (1 + (this.stageMul - 1) * 0.3);
    const speed = def.speed || CFG.bossSpeed;
    const half = def.half || 24;

    if (def.kind === 'sam') {
      const B = CFG.bossB;
      const prefix = def.prefix || 'sam';
      const spr = this.add.sprite(bx, by, prefix + 'Idle', 0).setScale(def.scale || 1.5).setDepth(2);
      spr.play(prefix + '-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'sam', bossId: def.id, prefix, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'approach', phaseT: 0, moveCount: 0, sumT: B.summonCd,
        slashDir: new Phaser.Math.Vector2(0, 1),
      });
    } else if (def.kind === 'racoon') {
      const R = CFG.racoonBoss;
      const spr = this.add.sprite(bx, by, 'racoonIdle', 0).setScale(def.scale || 1.15).setDepth(2);
      spr.play('racoon-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'racoon', bossId: def.id, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'approach', phaseT: 0, moveCount: 0,
        lunge: new Phaser.Math.Vector2(0, 1),
      });
    } else if (def.kind === 'tengu') {
      const prefix = def.prefix || 'tengu';
      const spr = this.add.sprite(bx, by, def.sheet || 'tenguBlueWalk', 0)
        .setScale(def.scale || 1.45).setDepth(2);
      spr.play(prefix + '-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'tengu', bossId: def.id, prefix, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'hover', phaseT: 700, cdT: 620, dive: new Phaser.Math.Vector2(0, 1),
        baseScale: def.scale || 1.45,
      });
    } else if (def.kind === 'spirit') {
      const spr = this.add.sprite(bx, by, 'spiritIdle', 0)
        .setScale(def.scale || 2.2).setDepth(2).setAlpha(0.88);
      spr.play('spirit-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'spirit', bossId: def.id, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'hover', phaseT: 700, castT: 900, blinkT: CFG.spiritBoss.blinkCd,
        baseScale: def.scale || 2.2,
      });
    } else if (def.kind === 'demon') {
      const prefix = def.prefix || 'demon';
      const spr = this.add.sprite(bx, by, def.sheet || 'demonIdle', 0)
        .setScale(def.scale || 2.2).setDepth(2);
      spr.play(prefix + '-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'demon', bossId: def.id, prefix, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'approach', phaseT: 0, moveCount: 0, summonT: CFG.demonBoss.summonCd,
        lunge: new Phaser.Math.Vector2(0, 1), minion: def.minion || 'fish',
        baseScale: def.scale || 2.2,
      });
    } else if (def.kind === 'flam') {
      const spr = this.add.sprite(bx, by, 'flamIdle', 0)
        .setScale(def.scale || 2.0).setDepth(2);
      spr.play('flam-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'flam', bossId: def.id, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'hover', phaseT: 700, castT: 1000,
        baseScale: def.scale || 2.0,
      });
    } else if (def.kind === 'weaver') {
      const spr = this.add.sprite(bx, by, 'spiritIdle', 0)
        .setScale(def.scale || 2.2).setDepth(2).setAlpha(0.94).setTint(0xd8c0ff);
      spr.play('spirit-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'weaver', bossId: def.id, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        fp: 1, phase: 'stalk', phaseT: 700, dashT: 900, castT: 1400,
        summonT: 2200, blinkT: 2200,
        dashDir: new Phaser.Math.Vector2(0, 1),
        baseScale: def.scale || 2.2,
      });
    } else {
      const spr = this.add.sprite(bx, by, 'boss', 0).setScale(def.scale || 1.6).setDepth(2);
      spr.play('boss-idle');
      this.enemies.push({
        type: 'boss', bossKind: 'frog', bossId: def.id, spr,
        hp, maxHp: hp,
        kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
        speed, dmg, half,
        phase: 'approach', phaseT: 0, lunge: new Phaser.Math.Vector2(),
      });
    }

    this.bossBarBg = this.add.rectangle(0, S.H - 26, 220, 8, 0x000000, 0.6).setScrollFactor(0).setDepth(810);
    this.bossBar = this.add.rectangle(0, S.H - 26, 216, 4, 0xff6b5a, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(811);
    if (def.kind === 'weaver') {
      this.bossBar.setFillStyle(0xc8b0ff, 1);
      this.weaverPips = [0, 1, 2].map((i) => this.add.rectangle(
        S.W / 2 - 14 + i * 14, S.H - 38, 8, 6, i === 0 ? 0xd8c0ff : 0x5a5460, 0.9,
      ).setScrollFactor(0).setDepth(812));
    }
  }

  /* ---------- 移动与碰撞 ---------- */
  isWall(px, py, r) {
    const pts = [[px - r, py - r], [px + r, py - r], [px - r, py + r], [px + r, py + r]];
    for (const [x, y] of pts) {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
      if (this.walls.has(tx + ',' + ty)) return true;
    }
    return false;
  }

  moveActor(spr, dx, dy, r) {
    if (dx && !this.isWall(spr.x + dx, spr.y, r)) spr.x += dx;
    if (dy && !this.isWall(spr.x, spr.y + dy, r)) spr.y += dy;
    spr.x = Phaser.Math.Clamp(spr.x, 8, RW - 8);
    spr.y = Phaser.Math.Clamp(spr.y, 8, RH - 8);
  }

  /* ---------- 叙事：NPC、房间事件、周目 ---------- */
  spawnRoomProps(room) {
    const put = (kind, type, x, y, sprite, pb) => {
      const spr = this.add.sprite(x, y, sprite, 0).setScale(2).setDepth(2 + y / 1000);
      spr.setOrigin(0.5, pb ? 1 : 0.5);
      const prop = { kind, type, spr, x, y, used: false };
      this.props.push(prop);
      return prop;
    };

    // Boss 房不放引路人/商店/石龛等可交互物，避免终章 1 房关的 Boss 与 NPC 同场
    if (room.isBoss) return;

    // 第一间一定有引路人（开局就把规则讲清楚）
    if (room.idx === 0) {
      const spot = this.findFreeSpot(120);
      put('npc', 'guide', spot.x, spot.y, 'villager');
    }

    const t = room.type || 'battle';

    if (t === 'treasure') {
      const spot = this.findFreeSpot(120);
      const p = put('chest', 'treasure', spot.x, spot.y, 'chest', true);
      p.spr.setScale(2.6);
      return;
    }

    if (t === 'shop') {
      const spot = this.findFreeSpot(120);
      put('npc', 'vendor', spot.x, spot.y, 'villager2', true).spr.setTint(0xd8e7ff);
      if (!room.shopStock) room.shopStock = this.rollShopStock();
      // 三件货就是三个悬浮图标：不画货架，用"货摆在地上"表达明码标价
      room.shopStock.forEach((o, i) => {
        const x = spot.x - 36 + i * 36;
        const y = spot.y + 26;
        const spr = this.add.image(x, y, o.icon, o.frame || 0).setScale(o.kind === 'key' ? 2.6 : 2).setDepth(3);
        this.tweens.add({ targets: spr, y: y - 5, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.props.push({ kind: 'shelf', type: o.kind, spr, x, y, used: false, offer: o });
      });
      return;
    }

    if (t === 'shrine') {
      const spot = this.findFreeSpot(150);
      const p = put('event', 'shrine', spot.x, spot.y, 'statue', true);
      p.spr.setTint(0x9fd8d0);
      return;
    }

    if (t === 'gate') {
      const spot = this.findFreeSpot(170);
      const p = put('gate', 'gate', spot.x, spot.y, 'statue', true);
      p.spr.setScale(2.6).setTint(0xffd479);
      this.tweens.add({ targets: p.spr, alpha: 0.72, duration: 720, yoyo: true, repeat: -1 });
      return;
    }

    if (t === 'rest') {
      const spot = this.findFreeSpot(120);
      const p = put('rest', 'rest', spot.x, spot.y, 'campfire', true);
      p.spr.setScale(3).play('campfire-burn');
      return;
    }
  }

  /* 商店货：武器 / 回血 / 钥匙，价格固定，写在 story.json 里做文案，数值留在这 */
  rollShopStock() {
    const w = rollWeapon(this.W, this.weapon.id) || this.W.list[0];
    return [
      { kind: 'weapon', id: w.id, icon: w.icon, price: 10, label: '武器 · ' + w.name },
      { kind: 'heal', icon: 'heart', frame: 4, price: 4, label: '回血 +6' },
      { kind: 'key', icon: 'key', price: 5, label: '钥匙 ×1' },
    ];
  }

  updatePrompt() {
    if (!this.promptT) return;
    const p = this.nearestProp(56);
    if (!p || this.dead || this.won) { this.promptT.setVisible(false); return; }
    const ui = this.story.ui || {};
    const HINT = {
      npc: ui.talkHint || 'E 交谈',
      chest: ui.chestHint || 'E 开箱',
      rest: ui.restHint || 'E 烤火',
      shelf: ui.shopHint || 'E 看货',
      gate: 'E 拉机关',
      event: ui.eventHint || 'E 查看',
    };
    let label = HINT[p.kind] || ui.eventHint || 'E 查看';
    // 用过的一次性物件：提示换成"已用"状态，别继续骗玩家按 E
    if (p.used && p.kind === 'chest') label = ui.chestUsedHint || 'E 空箱子';
    if (p.used && p.kind === 'rest') label = ui.restUsedHint || '火快灭了';
    if (p.used && p.kind === 'gate') label = '机关已启';
    this.promptT.setText(label).setPosition(p.spr.x, p.spr.y - 40).setVisible(true);
  }

  nearestProp(maxDist) {
    let best = null, bd = maxDist;
    for (const p of this.props) {
      if (p.used && p.kind === 'event' && p.type !== 'vendor') continue;
      const d = Phaser.Math.Distance.Between(p.spr.x, p.spr.y, this.player.x, this.player.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  interact() {
    if (this.dead || this.won || this.talking || this.panelOpen) return;
    const p = this.nearestProp(56);
    if (!p) return;
    if (p.kind === 'gate') { this.pullGate(p); return; }
    if (p.kind === 'npc') {
      const npc = (this.story.npc || {})[p.type] || { name: '陌生人', lines: ['……'] };
      const seen = this.meta && this.meta.kills > 0;
      const lines = seen && npc.repeat ? [npc.repeat] : npc.lines;
      // 商店里的行脚商：说完开场白直接接价目面板，免得玩家还要再找一次"货架"
      const shop = (this.room.type === 'shop') ? () => this.openShop(p) : null;
      this.talk(lines, npc.name, shop);
    } else if (p.kind === 'chest') {
      this.openChest(p);
    } else if (p.kind === 'rest') {
      this.openRest(p);
    } else if (p.kind === 'shelf') {
      this.openShop(p);
    } else {
      this.openEvent(p);
    }
  }

  talk(lines, name, onDone) {
    if (this.talking || !lines || !lines.length) return;
    this.talking = true;
    if (this.promptT) this.promptT.setVisible(false);
    if (this.hint) this.hint.setVisible(false);
    const W = S.W, H = S.H;
    const bg = this.add.rectangle(10, H - 84, W - 20, 64, 0x000000, 0.72)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(860);
    bg.setStrokeStyle(1, 0xffffff, 0.25);
    const nameT = this.add.text(20, H - 80, name || '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffd479',
    }).setScrollFactor(0).setDepth(861);
    const body = this.add.text(20, H - 62, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
      wordWrap: { width: W - 40 },
    }).setScrollFactor(0).setDepth(861);
    const hint = this.add.text(W - 20, H - 26, 'E / 空格 继续', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffbb',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(861);

    this.dlg = { lines, i: 0, char: 0, name, onDone, ui: [bg, nameT, body, hint], timer: null };
    this.dlgLine();
  }

  dlgLine() {
    const d = this.dlg;
    const line = d.lines[d.i];
    d.char = 0;
    d.ui[2].setText('');
    if (d.timer) d.timer.remove();
    d.timer = this.time.addEvent({
      delay: 28, loop: true,
      callback: () => {
        d.char += 1;
        d.ui[2].setText(line.slice(0, d.char));
        if (d.char >= line.length) { d.timer.remove(); d.timer = null; }
      },
    });
  }

  dlgAdvance() {
    const d = this.dlg;
    if (!d) return;
    const line = d.lines[d.i];
    if (d.timer) {
      // 还在打字：直接补全这一行
      d.timer.remove(); d.timer = null;
      d.ui[2].setText(line);
      d.char = line.length;
      return;
    }
    if (d.i + 1 < d.lines.length) { d.i += 1; this.dlgLine(); return; }
    this.closeTalk();
  }

  closeTalk() {
    const d = this.dlg;
    if (!d) return;
    if (d.timer) d.timer.remove();
    d.ui.forEach((o) => o.destroy());
    const cb = d.onDone;
    this.dlg = null;
    this.talking = false;
    if (this.hint) this.hint.setVisible(true);
    if (cb) cb();
  }

  /* 面板通用外壳：事件 / 商店 / 篝火 / 宝箱共用 */
  showPanel(title, text, options, prop) {
    const W = S.W, H = S.H;
    const bw = Math.min(400, W - 32);
    const bh = Math.max(168, 112 + options.length * 24);
    const top = H / 2 - bh / 2;
    this.panelOpen = true;
    this.sfx.ui.play({ rate: 1.0, volume: 0.8 });

    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.4)
      .setOrigin(0).setScrollFactor(0).setDepth(864);
    const bg = this.add.rectangle(W / 2, H / 2, bw, bh, 0x0d1017, 0.95)
      .setScrollFactor(0).setDepth(870).setStrokeStyle(1, 0xffffff, 0.22);
    const ttl = this.add.text(W / 2, top + 14, title, {
      fontFamily: FONT, fontSize: '24px', color: '#ffd479',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(871);
    const body = this.add.text(W / 2, top + 46, text, {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffcc',
      wordWrap: { width: bw - 40 }, align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(871);

    const rows = options.map((o, i) => this.add.text(W / 2, top + 92 + i * 24, `${i + 1}. ${o.label}`, {
      fontFamily: FONT, fontSize: '12px', color: o.dim ? '#ffffff77' : '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(871).setInteractive({ useHandCursor: true }));

    this.panel = { dim, bg, title: ttl, text: body, rows, options, prop, hotkeys: [] };
    rows.forEach((row, i) => {
      row.on('pointerdown', () => this.choose(i));
      const key = ['ONE', 'TWO', 'THREE', 'FOUR'][i];
      if (key) this.panel.hotkeys.push(this.input.keyboard.on('keydown-' + key, () => this.choose(i)));
    });
  }

  openEvent(p) {
    const EV = (this.story.events || {})[p.type] || { title: '', text: '' };
    let options;
    if (p.type === 'shrine') {
      options = [
        { label: '攻击 +1', act: () => this.gainUpg('power') },
        { label: '移速 +1', act: () => this.gainUpg('speed') },
        { label: '攻速 +1', act: () => this.gainUpg('atk') },
      ];
    } else if (p.type === 'vendor') {
      options = [
        { label: '回血 +6（3 金币）', act: () => this.buy(3, () => this.heal(6)) },
        { label: '强化 +1（6 金币）', act: () => this.buy(6, () => this.gainUpg(this.rollUpgrade())) },
      ];
    } else {
      options = [{ label: '献祭 5 血换 +2 强化', act: () => this.sacrifice() }];
    }
    options.push({ label: (this.story.ui || {}).leave || '离开', act: () => {} });
    this.showPanel(EV.title, EV.text, options, p);
    if (p.type !== 'vendor') p.used = true;
    if (p.type === 'shrine' || p.type === 'curse') p.spr.setTint(0x777777);
  }

  /* 商店：三件货明码标价，金币不足 buy() 会提示且不扣钱 */
  openShop(p) {
    const R = (this.story.rooms || {}).shop || {};
    const stock = this.room.shopStock || [];
    const options = stock.map((o) => ({
      label: `${o.label} · ${o.price} 金币${o.kind === 'key' ? '（本局持有 ' + this.keyCount + '）' : ''}`,
      act: () => this.buy(o.price, () => {
        if (o.kind === 'weapon') this.dropItem(p.spr.x + 28, p.spr.y - 4, 'weapon', null, o.id);
        else if (o.kind === 'heal') this.heal(6);
        else {
          this.keyCount += 1;
          this.floatText(this.player.x, this.player.y - 24, '钥匙 +1', '#ffd479');
          this.sfx.bonus.play({ rate: 1.1, volume: 0.8 });
        }
      }),
    }));
    options.push({ label: (this.story.ui || {}).leave || '离开', act: () => {} });
    this.showPanel(R.name || '商店', R.text || '三件货，明码标价，银货两讫。', options, p);
  }

  /* 宝箱：必须持 1 把钥匙；开完变敞开帧，不再可交互 */
  openChest(p) {
    const R = (this.story.rooms || {}).treasure || {};
    if (p.used) {
      this.floatText(p.spr.x, p.spr.y - 22, R.empty || '已经开过了', '#ffffffaa');
      return;
    }
    if (this.keyCount <= 0) {
      this.floatText(p.spr.x, p.spr.y - 22, R.locked || '需要 1 把钥匙', '#ff8a7a');
      this.sfx.ui.play({ rate: 0.6, volume: 0.6 });
      return;
    }
    p.used = true;
    this.keyCount -= 1;
    p.spr.setFrame(1);
    this.sfx.bonus.play({ volume: 0.95 });
    playAct(this, 'upgrade', p.spr.x, p.spr.y - 6);
    const w = rollWeapon(this.W, this.weapon.id);
    if (w) this.dropItem(p.spr.x + 44, p.spr.y - 6, 'weapon', null, w.id);
    this.dropItem(p.spr.x - 44, p.spr.y - 6, 'coin');
    this.dropItem(p.spr.x, p.spr.y + 26, 'upg', this.rollUpgrade());
    this.floatText(p.spr.x, p.spr.y - 30, R.opened || '宝箱开启', '#ffd479');
  }

  /* 篝火：付 2 金币回 6 血，一间一次 */
  openRest(p) {
    const R = (this.story.rooms || {}).rest || {};
    const options = [];
    if (p.used) {
      options.push({ label: R.spent || '已经休息过了', act: () => {}, dim: true });
    } else {
      options.push({
        label: `${R.pay || '付 2 金币'} · 回 ${CFG.healAmount + 2} 血`,
        act: () => this.buy(2, () => {
          p.used = true;
          this.usedRest = true;
          p.spr.setTint(0x8f8a82);
          this.heal(CFG.healAmount + 2);
        }),
      });
    }
    options.push({ label: (this.story.ui || {}).leave || '离开', act: () => {} });
    this.showPanel(R.name || '篝火', R.text || '火还在烧，坐一会儿再走。', options, p);
  }

  pullGate(p) {
    if (p.used) {
      this.floatText(p.spr.x, p.spr.y - 26, '机关已经开过了', '#ffffffaa');
      return;
    }
    p.used = true;
    this.room.gateOpen = true;
    p.spr.setTint(0x8f8a82);
    this.floatText(p.spr.x, p.spr.y - 28, '机关已启', '#ffd479');
    this.sfx.bonus.play({ volume: 0.9 });
    this.shake(110, 0.008);
    if (this.enemiesAlive() === 0) this.room.cleared = true;
    this.refreshDoorLocks();
    this.drawMinimap();
    this.updateHud();
  }

  heal(n) {
    this.hp = Math.min(this.maxHp(), this.hp + n);
    this.floatText(this.player.x, this.player.y - 26, '+' + n + ' HP', '#9be27a');
    this.sfx.bonus.play({ rate: 0.9, volume: 0.75 });
    this.updateHud();
  }

  /* ---------- 层间天赋 ---------- */
  offerTalent() {
    if (this.talentOpen || this.dead || this.won) return;
    if (this.panelOpen || this.talking) return;   // 面板/对话占着就先跳过，下次二选一再给
    const cards = rollTalents(this.T, this.talents, this.room.idx + 1, 3);
    if (!cards.length) return;
    this.talentOpen = true;
    this.showTalentPanel(cards);
  }

  /* 三张卡：稀有度描边 + 名字 + 代价说明，点卡或按 1-3 */
  showTalentPanel(cards) {
    const W = S.W, H = S.H;
    const cw = 108, gap = 10, ch = 116;
    const total = cards.length * cw + (cards.length - 1) * gap;
    const left = W / 2 - total / 2;
    const cy = H / 2 + 8;
    this.panelOpen = true;
    this.sfx.ui.play({ rate: 1.0, volume: 0.8 });

    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.55)
      .setOrigin(0).setScrollFactor(0).setDepth(864);
    const bg = this.add.rectangle(W / 2, H / 2, total + 40, ch + 96, 0x0d1017, 0.96)
      .setScrollFactor(0).setDepth(870).setStrokeStyle(1, 0xffffff, 0.22);
    const title = this.add.text(W / 2, H / 2 - (ch + 96) / 2 + 12, '天赋 · 选一张带到底', {
      fontFamily: FONT, fontSize: '24px', color: '#ffd479',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(871);

    const ui = [dim, bg, title];
    const options = [];
    cards.forEach((t, i) => {
      const cx = left + i * (cw + gap) + cw / 2;
      const stroke = parseInt(t.color.slice(1), 16);
      const rect = this.add.rectangle(cx, cy, cw, ch, 0x141a12, 0.95)
        .setScrollFactor(0).setDepth(872).setStrokeStyle(2, stroke, 0.95)
        .setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => this.pickTalent(i));
      const name = this.add.text(cx, cy - ch / 2 + 10, t.name, {
        fontFamily: FONT, fontSize: '14px', color: t.color,
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(873);
      const rar = this.add.text(cx, cy - ch / 2 + 30, RARITY_NAME[t.rarity] || '', {
        fontFamily: FONT, fontSize: '12px', color: t.color,
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(873).setAlpha(0.8);
      const desc = this.add.text(cx, cy - ch / 2 + 48, t.desc, {
        fontFamily: FONT, fontSize: '12px', color: '#ffffffcc',
        wordWrap: { width: cw - 14 }, align: 'center',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(873);
      const num = this.add.text(cx, cy + ch / 2 - 18, String(i + 1), {
        fontFamily: FONT, fontSize: '12px', color: '#ffffff88',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(873);
      ui.push(rect, name, rar, desc, num);
      options.push({ label: t.name, act: () => this.pickTalent(i) });
    });

    this.panel = { dim, bg, title, rows: ui, options, cards, hotkeys: [] };
    ['ONE', 'TWO', 'THREE'].forEach((k, i) => {
      if (cards[i]) this.panel.hotkeys.push(this.input.keyboard.on('keydown-' + k, () => this.pickTalent(i)));
    });
  }

  pickTalent(i) {
    const t = this.panel && this.panel.cards && this.panel.cards[i];
    if (!t) return;
    this.talents.push(t.id);
    this.mods = mergeMods(this.T, this.talents);
    this.hp = Math.min(this.hp, this.maxHp());
    this.rebuildHearts();
    this.talentOpen = false;
    this.sfx.bonus.play({ volume: 0.9 });
    playAct(this, 'upgrade', this.player.x, this.player.y - 8);
    this.floatText(this.player.x, this.player.y - 34, t.name, t.color);
    this.closePanel();
    this.updateHud();
  }

  choose(i) {
    if (!this.panelOpen || !this.panel) return;
    const opt = this.panel.options[i];
    if (!opt) return;
    this.panelOpen = false;
    const cb = opt.act;
    this.closePanel();
    if (cb) cb();
    this.updateHud();
  }

  closePanel() {
    if (!this.panel) { this.panelOpen = false; return; }
    const pnl = this.panel;
    pnl.rows.forEach((r) => r.destroy());
    ['dim', 'bg', 'title', 'text'].forEach((k) => pnl[k] && pnl[k].destroy());
    (pnl.hotkeys || []).forEach((h) => h && h.remove && h.remove());
    if (pnl.cards) this.talentOpen = false;
    this.panel = null;
    this.panelOpen = false;
  }

  gainUpg(k) {
    this.upg[k] += 1;
    this.floatText(this.player.x, this.player.y - 24, UPG_NAME[k] + ' +1', '#ffd479');
    playAct(this, 'upgrade', this.player.x, this.player.y - 10);
    this.sfx.bonus.play({ volume: 0.85 });
    if (k === 'power') this.hp = Math.min(this.maxHp(), this.hp);
  }

  buy(cost, effect) {
    if (this.coins < cost) {
      this.floatText(this.player.x, this.player.y - 24, '金币不足', '#ff8a7a');
      return;
    }
    this.coins -= cost;
    effect();
    this.sfx.coin.play({ rate: 0.9 });
  }

  sacrifice() {
    if (this.hp <= 5) {
      this.floatText(this.player.x, this.player.y - 24, '血不够', '#ff8a7a');
      return;
    }
    this.hp -= 5;
    this.gainUpg(this.rollUpgrade());
    this.gainUpg(this.rollUpgrade());
    this.shake(160, 0.012);
  }

  /* ---------- 战斗 ---------- */
  /* ---------- 武器与攻击（批 1） ----------
   * 近战：按武器的斩击帧 + 矩形判定；远程/投掷：生成 this.bolts 里的弹体。
   * 三系差异全部来自 web/data/weapons.json，这一段不写死任何一把武器。 */
  /* ---------- 批 5：角色主动技能（统一 8s 冷却，走 castSkill 入口） ---------- */
  castSkill() {
    if (this.paused || this.talking || this.panelOpen || this.dead || this.won) return;
    const K = this.char.skill;
    if (this.time.now - this.skillAt < K.cd) {
      const left = Math.ceil((K.cd - (this.time.now - this.skillAt)) / 1000);
      this.floatText(this.player.x, this.player.y - 30, '冷却 ' + left + 's', '#8fa0a8');
      return;
    }
    this.skillAt = this.time.now;
    if (K.id === 'dash') return this.skillDash(K);
    if (K.id === 'fireball') return this.skillFireball(K);
    if (K.id === 'guard') return this.skillGuard(K);
  }

  /* 忍者：向前瞬移，落地 0.4s 无敌（无敌期间不受碰撞/弹体伤害） */
  skillDash(K) {
    const v = VEC[this.facing] || [0, 1];
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      this.moveActor(this.player, (v[0] * K.distance) / steps, (v[1] * K.distance) / steps, 10);
      if (i === 1 || i === 3) {
        const ghost = this.add.image(this.player.x - v[0] * 7, this.player.y - v[1] * 7, this.player.texture.key, 0)
          .setScale(2).setAlpha(0.55).setDepth(499).setTint(0x9fd8ff);
        this.tweens.add({ targets: ghost, alpha: 0, duration: 260, onComplete: () => ghost.destroy() });
      }
    }
    this.skillInvulnUntil = this.time.now + K.invuln;
    this.floatText(this.player.x, this.player.y - 32, '疾影', '#9fd8ff');
    this.sfx.ui.play({ rate: 1.8, volume: 0.45 });
    playAct(this, 'pickup', this.player.x, this.player.y);
  }

  /* 法师：穿透火球，命中后小范围爆炸（爆炸只结算一次，不递归） */
  skillFireball(K) {
    const v = VEC[this.facing] || [0, 1];
    const spr = this.add.sprite(this.player.x + v[0] * 14, this.player.y + v[1] * 12, 'fireball', 0)
      .setScale(2.4).setDepth(612);
    spr.play('fireball-play');
    this.bolts.push({
      spr, vx: v[0] * K.speed, vy: v[1] * K.speed,
      life: K.life, dmg: K.dmg, pierce: K.pierce, knock: 90, hits: [],
      blast: K.blast, blastDmg: K.blastDmg,
    });
    this.shake(60, 0.004);
    this.sfx.magic.play({ rate: 0.8, volume: 0.6 });
  }

  /* 骑士：3s 受伤减半 + 把身边敌人震开 */
  skillGuard(K) {
    this.guardUntil = this.time.now + K.duration;
    if (this.guardAura) this.guardAura.destroy();
    this.guardAura = this.add.sprite(this.player.x, this.player.y + 6, 'aura', 0)
      .setScale(2.6).setAlpha(0.9).setDepth(498).setTint(0xffe08a).play('aura-pulse');
    this.guardAuraTween = this.tweens.add({
      targets: this.guardAura, alpha: 0.35, duration: 500, yoyo: true, repeat: 3,
    });
    this.enemies.forEach((e) => {
      if (e.hp <= 0 || e.type === 'boss') return;
      const d = new Phaser.Math.Vector2(e.spr.x - this.player.x, e.spr.y - this.player.y);
      if (d.length() > 90) return;
      if (d.lengthSq() < 1) d.set(0, 1);
      d.normalize().scale(K.push * 2);
      e.kb.copy(d);
    });
    this.shake(80, 0.006);
    this.floatText(this.player.x, this.player.y - 34, '壁垒', '#ffe08a');
    this.sfx.bonus.play({ rate: 0.6, volume: 0.5 });
  }

  attack() {
    if (this.paused || this.talking || this.panelOpen) return;
    if (this.dead || this.won) return;
    if (this.time.now - this.atkAt < this.wcd()) return;
    this.atkAt = this.time.now;
    const w = this.weapon;
    const v = VEC[this.facing];
    const s = this.sfx[w.sfx] || this.sfx.sword;
    s.play({ rate: Phaser.Math.FloatBetween(0.95, 1.08), volume: 0.5 });
    if (w.kind === 'melee') this.attackMelee(w, v);
    else this.attackRanged(w, v);
    this.swingHand(w);
  }

  /* 攻速强化对武器冷却同样生效，但每把武器有自己的基准节奏 */
  wcd() {
    const base = this.weapon.cd;
    return Math.max(base * CFG.upgrades.minAtkMul, base * (1 - CFG.upgrades.atkStep * this.upg.atk));
  }

  /* 伤害 = 角色基础 × 武器倍率（乘区 1） + 力量强化（乘区 2） */
  wdmg() {
    return Math.round(CFG.playerDmg * this.weapon.dmgMul + CFG.upgrades.powerStep * this.upg.power);
  }

  attackMelee(w, v) {
    // 斩击帧直接套在人物身上（只往前偏 8px）：32×32 的弧在 2.x 倍下会扩到 70px，
    // 挂太远会"脱手"，观感像特效在人物外面独立播放
    const rot = ANGLE[this.facing] + (w.fx === 'slC' ? 0 : Math.PI / 4);
    const fx = this.add.sprite(this.player.x + v[0] * 12, this.player.y + v[1] * 9, w.fx)
      .setDepth(600).setRotation(rot).setScale(w.fxScale);
    fx.play(w.fx + '-play');
    this.tweens.add({
      targets: fx, scale: w.fxScale + 0.45, duration: 200, ease: 'Quad.easeOut',
      onComplete: () => fx.destroy(),
    });

    // 挥动时向前顶半步 + 压扁：重武器的顶得更远、压得更狠
    const push = w.hitHeavy >= 2 ? 6 : (w.hitHeavy ? 5 : 4);
    this.tweens.add({
      targets: this.player,
      x: this.player.x + v[0] * push, y: this.player.y + v[1] * push,
      duration: 90, yoyo: true, ease: 'Quad.easeOut',
    });
    const sq = w.hitHeavy >= 2 ? [2.05, 1.9] : (w.hitHeavy ? [2.3, 1.8] : [2.35, 1.75]);
    this.tweens.add({ targets: this.player, scaleX: sq[0], scaleY: sq[1], duration: 70, yoyo: true });

    const cx = this.player.x + v[0] * w.reach;
    const cy = this.player.y + v[1] * w.reach;
    const hw = w.box[0] / 2, hh = w.box[1] / 2;
    const dmg = this.wdmg();
    let firstHit = null;

    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;
      if (Math.abs(e.spr.x - cx) > hw + e.half || Math.abs(e.spr.y - cy) > hh + e.half) return;
      if (!firstHit) firstHit = e;
      this.damageFoe(e, dmg, v[0] * w.knock, v[1] * w.knock);
    });

    if (firstHit) {
      this.sfx.hit.play({ rate: Phaser.Math.FloatBetween(0.9, 1.12) });
      playAct(this, 'hit', cx, cy, { target: firstHit.spr });
      // 重武器额外补一档震屏：锤子砸下来要能"听见"
      if (w.hitHeavy >= 2) this.shake(CFG.feel.shakeHeavyMs, CFG.feel.shakeHeavyMag);
      else if (w.hitHeavy) this.shake(CFG.feel.shakeHitMs, CFG.feel.shakeHitMag);
    }
  }

  attackRanged(w, v) {
    // 远程有一个极小的后坐：玩家往后缩 2px，表示"发出去的是东西"
    this.tweens.add({
      targets: this.player, x: this.player.x - v[0] * 2, y: this.player.y - v[1] * 2,
      duration: 80, yoyo: true, ease: 'Quad.easeOut',
    });
    const spr = this.add.sprite(this.player.x + v[0] * 14, this.player.y + v[1] * 12, w.proj, 0)
      .setDepth(610).setScale(w.proj === 'fireball' ? 2 : 2.2);
    if (w.projAnim) spr.play(w.projAnim);
    else spr.setRotation(Math.atan2(v[1], v[0]));
    this.bolts.push({
      spr, vx: v[0] * w.projSpeed, vy: v[1] * w.projSpeed,
      life: w.projLife, dmg: this.wdmg(), pierce: w.pierce, knock: w.knock, hits: [],
    });
    playAct(this, 'pickup', spr.x, spr.y);
  }

  /* 玩家弹体：飞行 → 撞墙消失 → 逐个命中，pierce 允许多穿几个目标 */
  updateBolts(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dt;
      b.spr.x += b.vx * (dt / 1000);
      b.spr.y += b.vy * (dt / 1000);
      if (b.life <= 0 || this.isWall(b.spr.x, b.spr.y, 3)) {
        b.spr.destroy();
        this.bolts.splice(i, 1);
        continue;
      }
      let spent = false;
      for (const e of this.enemies) {
        if (e.hp <= 0 || b.hits.indexOf(e) >= 0) continue;
        if (Phaser.Math.Distance.Between(b.spr.x, b.spr.y, e.spr.x, e.spr.y) > 10 + e.half) continue;
        b.hits.push(e);
        const n = Math.hypot(b.vx, b.vy) || 1;
        this.damageFoe(e, b.dmg, (b.vx / n) * b.knock, (b.vy / n) * b.knock);
        playAct(this, 'hit', b.spr.x, b.spr.y, { target: e.spr });
        this.sfx.hit.play({ rate: Phaser.Math.FloatBetween(1.05, 1.2), volume: 0.45 });
        if (b.blast) this.blastAt(b.spr.x, b.spr.y, b.blast, b.blastDmg);
        if (b.pierce > 0) b.pierce -= 1;
        else spent = true;
        break;
      }
      if (spent) { b.spr.destroy(); this.bolts.splice(i, 1); }
    }
  }

  /* 统一的"打到怪"：扣血、白闪、击退、死亡判定都在这里，武器只提供数值 */
  /* 火球爆炸：以命中点为中心的短半径伤害，不再连锁爆炸 */
  blastAt(x, y, radius, dmg) {
    const ring = this.add.circle(x, y, radius, 0xffb04a, 0.35).setDepth(611);
    this.tweens.add({ targets: ring, alpha: 0, scale: 1.25, duration: 240, onComplete: () => ring.destroy() });
    playAct(this, 'slam', x, y);
    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;
      if (Phaser.Math.Distance.Between(x, y, e.spr.x, e.spr.y) > radius + e.half) return;
      this.damageFoe(e, dmg, 0, 0);
    });
  }

  damageFoe(e, dmg, kx, ky) {
    if (e.invuln) { this.floatText(e.spr.x, e.spr.y - 20, '无敌', '#c8b48a'); return; }
    if (e.shield > 0) {
      e.shield = 0;
      e.aura && e.aura.clearTint();
      playAct(this, 'upgrade', e.spr.x, e.spr.y - 6);
      this.floatText(e.spr.x, e.spr.y - 26, '护盾破', '#9fd8ff');
      this.sfx.boom.play({ rate: 1.2, volume: 0.4 });
      return;
    }
    // 影织者的两幕门槛：最后一击只把血钉在门槛上，下一帧进转场，绝不跳过整幕
    if (e.bossKind === 'weaver' && e.fp < 3) {
      const T = CFG.weaverBoss;
      const gate = e.maxHp * (e.fp === 1 ? T.at1 : T.at2);
      if (e.hp > gate && e.hp - dmg <= gate) {
        e.hp = Math.max(1, Math.floor(gate));
        e.flash = 70;
        e.spr.setAlpha(0.45);
        e.kb.set(kx, ky);
        return;
      }
    }
    e.hp -= dmg;
    e.flash = 70;
    e.kb.set(kx, ky);
    if (e.type === 'boss') e.spr.setAlpha(0.45);
    else e.spr.setTintFill(0xffffff);
    if (e.hp <= 0) this.killEnemy(e);
  }

  /* 换武器：图标、手持贴图、HUD 一起换；旧武器由调用方决定要不要掉回地上 */
  /* 图鉴点亮：只写一个键，不改别的；localStorage 每只怪一次，量很小 */
  markSeen(kind, id) {
    if (!id) return;
    const m = loadSave();
    const seen = m.seen || {};
    const bucket = seen[kind] || {};
    if (bucket[id]) return;
    const next = Object.assign({}, seen, { [kind]: Object.assign({}, bucket, { [id]: 1 }) });
    this.meta = patchSave({ seen: next });
  }

  equipWeapon(id, silent) {
    const w = this.W.byId[id];
    if (!w) return;
    this.markSeen('weapons', id);
    this.weapon = w;
    this.hand.setTexture(w.inhand || w.icon);
    if (this.weaponIcon) this.weaponIcon.setTexture(w.icon);
    if (this.weaponName) this.weaponName.setText(w.name);
    if (!silent) this.floatText(this.player.x, this.player.y - 28, w.name, '#ffe9a8');
  }

  /* 手持武器只在出手瞬间出现：素材里每把武器只有"举着"的静态姿势，
     常驻挂在手边会像肩上插了把剑；挥动时露 240ms，配合斩击帧反而更像挥砍 */
  updateHand() {
    const p = this.player;
    const off = this.facing === 'right' ? [11, 1] : this.facing === 'left' ? [-11, 1]
      : this.facing === 'up' ? [7, -7] : [8, 4];
    this.hand.setPosition(p.x + off[0], p.y + off[1]);
    this.hand.setFlipX(this.facing === 'left');
    this.hand.setDepth(this.facing === 'up' ? 499 : 521);
    this.hand.setVisible(this.time.now < (this.swingUntil || 0));
  }

  swingHand(w) {
    const sign = this.facing === 'left' ? -1 : 1;
    this.swingUntil = this.time.now + 260;
    this.hand.setRotation(0);
    this.tweens.add({
      targets: this.hand, rotation: 0.75 * sign, duration: 120, yoyo: true,
      ease: 'Quad.easeOut', onComplete: () => { this.hand.setRotation(0); },
    });
    if (w.hitHeavy) this.tweens.add({ targets: this.hand, scale: 2.4, duration: 100, yoyo: true });
  }

  /* Boss：靠近 → 蓄力（红身抖动）→ 直线冲撞 → 缓 0.38 秒 → 循环 */
  /* Boss 一阶段：靠近 → 蓄力（红身抖动）→ 冲撞 → 缓 0.38 秒
     二阶段（半血后）：吼一嗓 → 移动更快、蓄力更短，并且每三次出手改砸地（带地面预警圈） */
  updateBoss(e, dt) {
    if (e.bossKind === 'sam') return this.updateSamurai(e, dt);
    if (e.bossKind === 'flam') return this.updateFlamBoss(e, dt);
    if (e.bossKind === 'weaver') return this.updateWeaver(e, dt);
    if (e.bossKind === 'racoon') return this.updateRaccoon(e, dt);
    if (e.bossKind === 'tengu') return this.updateTengu(e, dt);
    if (e.bossKind === 'spirit') return this.updateSpirit(e, dt);
    if (e.bossKind === 'demon') return this.updateDemon(e, dt);
    const s = e.spr, p = this.player;
    const B2 = CFG.boss2;
    e.phaseT -= dt;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * B2.at) {
      e.phase = 'roar';
      e.phaseT = B2.roarMs;
      playAct(this, 'roar', s.x, s.y);
      this.sfx.alarm.play({ volume: 0.8 });
      this.sfx.hurt.play({ rate: 0.4, volume: 0.5 });
      this.floatText(s.x, s.y - 26, '狂暴', '#ff8a7a');
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }

    if (e.phase === 'roar') {
      s.setScale(1.6 + 0.18 * Math.sin(this.time.now / 40)).setTint(0xff5a4a);
      if (e.phaseT <= 0) {
        e.phase2 = true;
        e.phase = 'approach';
        e.speed *= B2.speedMul;
        e.moveCount = 0;
        s.setScale(1.7).setTint(0xffb8a8);
      }
      return;
    }

    if (e.phase === 'windup') {
      const pulse = 1.7 + 0.07 * Math.sin(this.time.now / 55);
      s.setScale(1.7 * pulse).setTint(0xff8a7a);
      if (e.phaseT <= 0) {
        e.phase = 'lunge';
        e.phaseT = CFG.bossLungeTime;
        s.clearTint().setScale(1.7);
        this.shake(90, 0.008);
      }
      return;
    }
    if (e.phase === 'lunge') {
      const sp = CFG.bossLungeSpeed * (dt / 1000);
      this.moveActor(s, e.lunge.x * sp, e.lunge.y * sp, e.half);
      if (e.phaseT <= 0) { e.phase = 'recover'; e.phaseT = CFG.bossRecover; }
      return;
    }
    if (e.phase === 'slamWindup') {
      const pulse = 1.7 + 0.12 * Math.sin(this.time.now / 45);
      s.setScale(pulse).setTint(0xffe08a);
      if (!e.ring) {
        e.ring = this.add.circle(p.x, p.y, B2.slamRadius, 0xff5533, 0.22).setDepth(1);
        e.ring.setStrokeStyle(2, 0xff8866, 0.9);
      }
      if (e.phaseT <= 0) {
        e.phase = 'slamAir';
        e.phaseT = B2.slamAir;
        e.jumpFrom = { x: s.x, y: s.y };
        e.landAt = { x: e.ring ? e.ring.x : s.x, y: e.ring ? e.ring.y : s.y };
        s.clearTint().setScale(1.7);
      }
      return;
    }
    if (e.phase === 'slamAir') {
      const pr = 1 - Math.max(0, e.phaseT) / B2.slamAir;
      s.x = e.jumpFrom.x + (e.landAt.x - e.jumpFrom.x) * pr;
      s.y = e.jumpFrom.y + (e.landAt.y - e.jumpFrom.y) * pr - Math.sin(Math.PI * pr) * 36;
      if (e.phaseT <= 0) {
        s.setPosition(e.landAt.x, e.landAt.y);
        this.slamImpact(e);
        e.phase = 'recover';
        e.phaseT = CFG.bossRecover;
      }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) e.phase = 'approach';
      return;
    }

    if (this.dead || this.won) return;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;

    // 二阶段：每三次出手，第三次改成砸地
    if (e.phase2 && (e.moveCount || 0) % 3 === 2 && dist < 340) {
      e.moveCount += 1;
      e.phase = 'slamWindup';
      e.phaseT = B2.slamWindup;
      this.sfx.hurt.play({ rate: 0.45, volume: 0.4 });
      return;
    }

    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    const sp = e.speed * (dt / 1000);
    this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
    s.setFlipX(dirv.x < 0);

    if (dist < CFG.bossLungeReach) {
      e.phase = 'windup';
      e.phaseT = CFG.bossWindup * (e.phase2 ? B2.windupMul : 1);
      e.lunge.copy(dirv);
      e.moveCount = (e.moveCount || 0) + 1;
      this.sfx.hurt.play({ rate: 0.55, volume: 0.35 });
    }
  }

  /* 蓝武士：横斩（前方扇形/矩形）→ 突进斩 → 召唤 2 小怪，三招轮换 */
  /* 巨浣熊：近身抓击 / 中距离跃扑；半血后更急 */
  updateRaccoon(e, dt) {
    const s = e.spr, p = this.player;
    const R = CFG.racoonBoss;
    e.phaseT -= dt;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * R.at) {
      e.phase = 'roar';
      e.phaseT = 600;
      s.setTint(0xff8a6a);
      this.sfx.alarm.play({ volume: 0.8 });
      this.floatText(s.x, s.y - 30, '狂暴', '#ff8a7a');
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }
    if (e.phase === 'roar') {
      s.setScale(1.15 + 0.12 * Math.sin(this.time.now / 40));
      if (e.phaseT <= 0) {
        e.phase2 = true;
        e.phase = 'approach';
        e.speed *= R.speedMul;
        s.clearTint().setScale(1.15);
      }
      return;
    }

    if (e.phase === 'pounceWindup') {
      const pulse = 1.15 + 0.08 * Math.sin(this.time.now / 45);
      s.setScale(pulse).setTint(0xff8a5a);
      if (!e.ring) {
        e.ring = this.add.circle(p.x, p.y, R.pounceRadius, 0xff5533, 0.18).setDepth(1);
        e.ring.setStrokeStyle(2, 0xff8866, 0.85);
      }
      if (e.phaseT <= 0) {
        e.phase = 'pounceAir';
        e.phaseT = R.pounceAir;
        e.jumpFrom = { x: s.x, y: s.y };
        e.landAt = { x: e.ring ? e.ring.x : s.x, y: e.ring ? e.ring.y : s.y };
        s.clearTint().setScale(1.15).play('racoon-jump');
        this.sfx.hurt.play({ rate: 0.5, volume: 0.4 });
      }
      return;
    }
    if (e.phase === 'pounceAir') {
      const pr = 1 - Math.max(0, e.phaseT) / R.pounceAir;
      s.x = e.jumpFrom.x + (e.landAt.x - e.jumpFrom.x) * pr;
      s.y = e.jumpFrom.y + (e.landAt.y - e.jumpFrom.y) * pr - Math.sin(Math.PI * pr) * 54;
      if (e.phaseT <= 0) {
        s.setPosition(e.landAt.x, e.landAt.y);
        s.stop().play('racoon-idle');
        this.racoonImpact(e);
        e.phase = 'recover';
        e.phaseT = 460;
      }
      return;
    }
    if (e.phase === 'swipeWindup') {
      s.setTint(0xffd479);
      if (e.phaseT <= 0) {
        e.phase = 'swipeHit';
        e.phaseT = R.swipeHit;
        s.clearTint().play('racoon-atk');
        this.racoonSwipe(e);
      }
      return;
    }
    if (e.phase === 'swipeHit') {
      if (e.phaseT <= 0) { e.phase = 'recover'; e.phaseT = 380; s.play('racoon-idle'); }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) e.phase = 'approach';
      return;
    }

    if (this.dead || this.won) return;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist > 96) {
      const sp = e.speed * (dt / 1000);
      this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
      if (!s.anims.isPlaying) s.play('racoon-idle');
    }
    s.setFlipX(dirv.x < 0);

    if (dist < 320) {
      e.moveCount = (e.moveCount || 0) + 1;
      e.lunge.copy(dirv);
      if (dist > R.swipeReach + 8) {
        e.phase = 'pounceWindup';
        e.phaseT = R.pounceWindup * (e.phase2 ? 0.8 : 1);
      } else if (e.moveCount % 2 === 0) {
        e.phase = 'pounceWindup';
        e.phaseT = R.pounceWindup * (e.phase2 ? 0.8 : 1);
      } else {
        e.phase = 'swipeWindup';
        e.phaseT = R.swipeWindup * (e.phase2 ? 0.8 : 1);
      }
      this.sfx.hurt.play({ rate: 0.6, volume: 0.3 });
    }
  }

  racoonImpact(e) {
    const R = CFG.racoonBoss;
    if (e.ring) { e.ring.destroy(); e.ring = null; }
    this.shake(180, 0.014);
    this.sfx.boom.play({ volume: 0.85 });
    playAct(this, 'slam', e.spr.x, e.spr.y);
    if (this.dead || this.won) return;
    const d = Phaser.Math.Distance.Between(e.spr.x, e.spr.y, this.player.x, this.player.y);
    if (d < R.pounceRadius) {
      this.hurtPlayer(e.spr.x, e.spr.y, R.pounceDmg);
      this.player.kb = new Phaser.Math.Vector2(this.player.x - e.spr.x, this.player.y - e.spr.y)
        .normalize().scale(160);
    }
  }

  racoonSwipe(e) {
    const R = CFG.racoonBoss;
    const s = e.spr, p = this.player;
    this.sfx.sword.play({ rate: 0.9, volume: 0.6 });
    this.shake(70, 0.006);
    const d = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (d < R.swipeReach) this.hurtPlayer(s.x, s.y, R.swipeDmg);
    const fx = this.add.circle(s.x, s.y, R.swipeReach, 0xffb066, 0.25).setDepth(2.2);
    this.tweens.add({ targets: fx, alpha: 0, scale: 1.35, duration: 220, onComplete: () => fx.destroy() });
  }

  /* 天狗：飞行悬浮，扇射/俯冲轮换；半血后扇面更宽、间隔更短 */
  updateTengu(e, dt) {
    const s = e.spr, p = this.player, T = CFG.tenguBoss;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    e.cdT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    const sc = e.baseScale || 1.45;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * T.at) {
      e.phase = 'roar'; e.phaseT = T.roarMs;
      s.setTint(0xff8a7a);
      this.sfx.alarm.play({ volume: 0.8 });
      this.floatText(s.x, s.y - 40, '风起', '#ff8a7a');
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }
    if (e.phase === 'roar') {
      s.setScale(sc + 0.12 * Math.sin(this.time.now / 40));
      if (e.phaseT <= 0) {
        e.phase2 = true; e.phase = 'hover'; e.phaseT = 500; e.cdT = 220;
        e.speed *= T.speedMul; s.clearTint().setScale(sc);
      }
      return;
    }
    if (e.phase === 'fanWindup') {
      s.setScale(sc + 0.06 * Math.sin(this.time.now / 45)).setTint(0x9fd8ff);
      s.y += Math.sin(this.time.now / 80) * 0.4;
      if (e.phaseT <= 0) {
        s.clearTint().setScale(sc);
        this.tenguFan(e);
        e.phase = 'recover'; e.phaseT = 420; e.cdT = T.fanCd;
      }
      return;
    }
    if (e.phase === 'diveWindup') {
      s.setScale(sc + 0.08 * Math.sin(this.time.now / 40)).setTint(0xffd479);
      s.y += Math.sin(this.time.now / 70) * 0.5;
      if (e.phaseT <= 0) {
        s.clearTint().setScale(sc).play(e.prefix + '-atk');
        e.phase = 'dive'; e.phaseT = T.diveTime;
        e.diveFrom = { x: s.x, y: s.y };
        e.diveAt = { x: p.x, y: p.y };
        this.sfx.hurt.play({ rate: 0.6, volume: 0.4 });
      }
      return;
    }
    if (e.phase === 'dive') {
      const pr = 1 - Math.max(0, e.phaseT) / T.diveTime;
      s.x = e.diveFrom.x + (e.diveAt.x - e.diveFrom.x) * pr;
      s.y = e.diveFrom.y + (e.diveAt.y - e.diveFrom.y) * pr;
      if (e.phaseT <= 0) {
        s.play(e.prefix + '-walk');
        this.shake(90, 0.01);
        playAct(this, 'slam', s.x, s.y);
        e.phase = 'recover'; e.phaseT = 460; e.cdT = 700;
      }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) { e.phase = 'hover'; e.phaseT = 500; s.play(e.prefix + '-idle'); }
      return;
    }

    // hover：保持中距，太近退、太远追，两侧小幅绕行
    if (dist > T.keepMax) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
      s.setFlipX(dirv.x < 0);
    } else if (dist < T.keepMin) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
      s.setFlipX(dirv.x < 0);
    }
    s.y += Math.sin(this.time.now / 100) * 0.35;
    if (!s.anims.isPlaying || s.anims.currentAnim.key !== e.prefix + '-walk') s.play(e.prefix + '-walk');
    if (e.phaseT <= 0 && e.cdT <= 0) {
      if (dist < 150 || Math.random() < 0.55) {
        e.phase = 'fanWindup'; e.phaseT = T.fanWindup * (e.phase2 ? 0.8 : 1);
      } else {
        e.phase = 'diveWindup'; e.phaseT = T.diveWindup * (e.phase2 ? 0.82 : 1);
      }
      this.sfx.hurt.play({ rate: 0.7, volume: 0.3 });
    }
  }

  tenguFan(e) {
    const T = CFG.tenguBoss, s = e.spr, p = this.player;
    const base = Math.atan2(p.y - s.y, p.x - s.x);
    const n = e.phase2 ? T.fanCount2 : T.fanCount;
    const tint = e.prefix === 'rtengu' ? 0xffb08a : 0x9fd8ff;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * T.fanSpread;
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.5).setTint(tint).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: Math.cos(a) * T.fanSpeed, vy: Math.sin(a) * T.fanSpeed,
        life: 2600, dmg: T.fanDmg,
      });
    }
    this.sfx.magic.play({ rate: 1.2, volume: 0.35 });
  }

  /* 魂灵：飘移保持中距 → 环形弹幕 → 淡出瞬移；半血弹数更多 */
  updateSpirit(e, dt) {
    const s = e.spr, p = this.player, T = CFG.spiritBoss;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    e.castT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    const sc = e.baseScale || 2.2;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * T.at) {
      e.phase = 'roar'; e.phaseT = 640;
      s.setTint(0xff9ad8);
      this.sfx.alarm.play({ volume: 0.8 });
      this.floatText(s.x, s.y - 36, '怨念', '#ff9ad8');
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }
    if (e.phase === 'roar') {
      s.setScale(sc + 0.1 * Math.sin(this.time.now / 45));
      if (e.phaseT <= 0) {
        e.phase2 = true; e.phase = 'hover'; e.castT = 700; s.clearTint().setScale(sc); s.setAlpha(0.9);
      }
      return;
    }
    if (e.phase === 'castWindup') {
      s.setScale(sc + 0.07 * Math.sin(this.time.now / 38)).setTint(0xd8a0ff);
      s.setAlpha(0.72 + 0.15 * Math.sin(this.time.now / 60));
      if (e.phaseT <= 0) {
        s.clearTint().setScale(sc).setAlpha(0.9);
        this.spiritBurst(e);
        e.phase = 'cast'; e.phaseT = 220;
      }
      return;
    }
    if (e.phase === 'cast') {
      if (e.phaseT <= 0) {
        e.phase = 'blinkOut'; e.phaseT = T.blinkMs;
        e.invuln = true;
        s.setAlpha(0.18);
      }
      return;
    }
    if (e.phase === 'blinkOut') {
      if (e.phaseT <= 0) {
        let nx = s.x, ny = s.y;
        for (let tr = 0; tr < 12; tr++) {
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const rr = Phaser.Math.Between(150, 220);
          nx = Phaser.Math.Clamp(p.x + Math.cos(a) * rr, TILE * 3, RW - TILE * 3);
          ny = Phaser.Math.Clamp(p.y + Math.sin(a) * rr, TILE * 3, RH - TILE * 3);
          if (!this.isWall(nx, ny, e.half)) break;
        }
        s.setPosition(nx, ny);
        e.invuln = false;
        e.phase = 'hover'; e.phaseT = 300;
        e.castT = T.castCd * (e.phase2 ? 0.8 : 1);
        s.setAlpha(0.9);
      }
      return;
    }

    if (dist > T.keepMax) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
      s.setFlipX(dirv.x < 0);
    }
    s.y += Math.sin(this.time.now / 110) * 0.45;
    if (!s.anims.isPlaying) s.play('spirit-idle');
    if (e.castT <= 0 && e.phaseT <= 0) {
      e.phase = 'castWindup';
      e.phaseT = T.castWindup * (e.phase2 ? 0.82 : 1);
      this.sfx.magic.play({ rate: 0.8, volume: 0.3 });
    }
  }

  spiritBurst(e) {
    const T = CFG.spiritBoss, s = e.spr;
    const n = e.phase2 ? T.burst2 : T.burst;
    const base = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const a = base + (Math.PI * 2 / n) * i;
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.6).setTint(0xd8a0ff).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: Math.cos(a) * T.orbSpeed, vy: Math.sin(a) * T.orbSpeed,
        life: 3000, dmg: T.orbDmg,
      });
    }
    this.sfx.magic.play({ rate: 0.7, volume: 0.4 });
    this.shake(60, 0.006);
  }

  /* 影织者：三幕终战
   * 第一幕追击（蓄力影袭）→ 第二幕影潮（瞬移 + 影仆 + 环形弹）→ 第三幕星火（全屏火雨 + 密集弹幕）。
   * 血量门槛由 damageFoe 钉住，不会一刀跨幕；转场期间无敌并清弹。 */
  updateWeaver(e, dt) {
    const s = e.spr, p = this.player, T = CFG.weaverBoss;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    const sc = e.baseScale || 2.2;
    const ratio = e.hp / e.maxHp;

    if (e.fp === 1 && e.phase !== 'shift' && ratio <= T.at1) { this.weaverShift(e, 2); return; }
    if (e.fp === 2 && e.phase !== 'shift' && ratio <= T.at2) { this.weaverShift(e, 3); return; }

    if (e.phase === 'shift') {
      s.setScale(sc * (1 + 0.12 * Math.sin(this.time.now / 42)));
      if (e.phaseT <= 0) {
        e.fp = e.nextFp;
        e.invuln = false;
        e.phase = e.fp === 2 ? 'hover' : 'storm';
        e.phaseT = 220;
        s.setScale(sc).setAlpha(0.94).setTint(e.fp === 2 ? 0xffb8e0 : 0xff8a9a);
        if (e.fp === 2) {
          e.summonT = 500; e.castT = 700; e.blinkT = T.blinkCd;
        } else {
          e.speed = T.speed3; e.castT = 650;
          this.rainOn = true; this.rainCount = T.rainCount;
          this.rainTint = 0xff6a9a; this.rainEdge = 0xffd8ea; this.rainBoom = 0xff4a7a;
          this.fireRainT = 500;
        }
        this.updateWeaverPips(e);
        this.floatText(s.x, s.y - 44, e.fp === 2 ? '第二幕 · 影潮' : '第三幕 · 星火', e.fp === 2 ? '#ffb8e0' : '#ff8a9a');
        if (this.bossBar) this.bossBar.setFillStyle(e.fp === 2 ? 0xffb8e0 : 0xff6a9a, 1);
      }
      return;
    }

    this.updateWeaverPips(e);
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (e.fp === 1) return this.weaverPhase1(e, dt, dist);
    if (e.fp === 2) return this.weaverPhase2(e, dt, dist);
    this.weaverPhase3(e, dt, dist);
  }

  weaverPhase1(e, dt, dist) {
    const s = e.spr, p = this.player, T = CFG.weaverBoss, sc = e.baseScale || 2.2;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (e.phase === 'stalk') {
      e.dashT -= dt;
      if (dist > 90) this.moveActor(s, dirv.x * e.speed * dt / 1000, dirv.y * e.speed * dt / 1000, e.half);
      else if (dist < 48) this.moveActor(s, -dirv.x * e.speed * 0.55 * dt / 1000, -dirv.y * e.speed * 0.55 * dt / 1000, e.half);
      s.setFlipX(dirv.x < 0);
      s.y += Math.sin(this.time.now / 110) * 0.4;
      s.setTint(0xd8c0ff);
      if (!s.anims.isPlaying) s.play('spirit-idle');
      if (e.dashT <= 0) {
        e.dashDir.copy(dirv);
        e.phase = 'dashWindup'; e.phaseT = T.dashWindup;
        s.setTint(0xffffff);
        this.sfx.alarm.play({ rate: 0.8, volume: 0.5 });
        this.floatText(s.x, s.y - 38, '影袭', '#d8c0ff');
      }
      return;
    }
    if (e.phase === 'dashWindup') {
      s.setScale(sc + 0.09 * Math.sin(this.time.now / 38));
      if (e.phaseT <= 0) {
        s.setScale(sc).setTint(0xd8c0ff);
        e.phase = 'lunge'; e.phaseT = T.dashTime;
      }
      return;
    }
    if (e.phase === 'lunge') {
      this.moveActor(s, e.dashDir.x * T.dashSpeed * dt / 1000, e.dashDir.y * T.dashSpeed * dt / 1000, e.half);
      this.weaverGhost(e);
      if (e.phaseT <= 0) {
        e.phase = 'recover'; e.phaseT = 240; e.dashT = T.dashCd;
      }
      return;
    }
    if (e.phase === 'recover' && e.phaseT <= 0) {
      e.phase = 'stalk';
      s.setScale(sc).setTint(0xd8c0ff);
    }
  }

  weaverPhase2(e, dt, dist) {
    const s = e.spr, p = this.player, T = CFG.weaverBoss, sc = e.baseScale || 2.2;
    if (e.phase === 'hover') {
      e.summonT -= dt; e.blinkT -= dt; e.castT -= dt;
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      if (dist > T.keepMax) this.moveActor(s, dirv.x * e.speed * dt / 1000, dirv.y * e.speed * dt / 1000, e.half);
      else if (dist < T.keepMin) this.moveActor(s, -dirv.x * e.speed * 0.7 * dt / 1000, -dirv.y * e.speed * 0.7 * dt / 1000, e.half);
      s.setFlipX(dirv.x < 0);
      s.y += Math.sin(this.time.now / 105) * 0.5;
      s.setTint(0xffb8e0);
      if (!s.anims.isPlaying) s.play('spirit-idle');
      if (e.castT <= 0) {
        e.phase = 'castWindup'; e.phaseT = T.castWindup;
        s.setTint(0xffffff);
        this.sfx.magic.play({ rate: 0.7, volume: 0.35 });
        return;
      }
      if (e.blinkT <= 0) {
        e.phase = 'blinkOut'; e.phaseT = T.blinkMs;
        e.invuln = true; s.setAlpha(0.15);
        return;
      }
      if (e.summonT <= 0) {
        this.weaverSummon(e);
        e.summonT = T.summonCd;
      }
      return;
    }
    if (e.phase === 'blinkOut') {
      if (e.phaseT <= 0) {
        this.weaverTeleport(e);
        e.invuln = false;
        s.setAlpha(0.94).setTint(0xffb8e0);
        e.phase = 'hover'; e.phaseT = 220; e.blinkT = T.blinkCd;
      }
      return;
    }
    if (e.phase === 'castWindup') {
      s.setScale(sc + 0.08 * Math.sin(this.time.now / 36));
      if (e.phaseT <= 0) {
        s.setScale(sc).setTint(0xffb8e0);
        this.weaverBurst(e, T.burst, T.orbSpeed, T.orbDmg, 0xff9ad8);
        e.phase = 'cast'; e.phaseT = 240;
      }
      return;
    }
    if (e.phase === 'cast' && e.phaseT <= 0) {
      e.phase = 'hover'; e.castT = T.castCd;
    }
  }

  weaverPhase3(e, dt, dist) {
    const s = e.spr, p = this.player, T = CFG.weaverBoss, sc = e.baseScale || 2.2;
    if (!this.rainOn) {
      this.rainOn = true; this.rainCount = T.rainCount;
      this.rainTint = 0xff6a9a; this.rainEdge = 0xffd8ea; this.rainBoom = 0xff4a7a;
    }
    if (e.phase === 'storm') {
      e.castT -= dt;
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      if (dist > 190) this.moveActor(s, dirv.x * e.speed * dt / 1000, dirv.y * e.speed * dt / 1000, e.half);
      else if (dist < 100) this.moveActor(s, -dirv.x * e.speed * dt / 1000, -dirv.y * e.speed * dt / 1000, e.half);
      s.setFlipX(dirv.x < 0);
      s.y += Math.sin(this.time.now / 80) * 0.55;
      s.setTint(0xff8a9a);
      if (!s.anims.isPlaying) s.play('spirit-idle');
      if (e.castT <= 0) {
        e.phase = 'castWindup'; e.phaseT = T.castWindup;
        s.setTint(0xffffff);
        this.sfx.alarm.play({ rate: 0.7, volume: 0.45 });
      }
      return;
    }
    if (e.phase === 'castWindup') {
      s.setScale(sc + 0.1 * Math.sin(this.time.now / 32));
      if (e.phaseT <= 0) {
        s.setScale(sc).setTint(0xff8a9a);
        this.weaverBurst(e, T.burst3, 128, T.orbDmg, 0xff6a9a);
        e.phase = 'storm'; e.phaseT = 220; e.castT = T.rainCd;
      }
    }
  }

  weaverShift(e, n) {
    const s = e.spr, T = CFG.weaverBoss, sc = e.baseScale || 2.2;
    e.nextFp = n;
    e.phase = 'shift'; e.phaseT = 900; e.invuln = true;
    e.hp = Math.max(e.hp, Math.floor(e.maxHp * (n === 2 ? T.at1 : T.at2)));
    s.setTint(0xffffff).setScale(sc * 1.08);
    this.sfx.alarm.play({ volume: 0.9 });
    this.shake(260, 0.014);
    this.cameras.main.flash(160, 255, 220, 255);
    this.floatText(s.x, s.y - 46, n === 2 ? '第二幕 · 影潮' : '第三幕 · 星火', n === 2 ? '#ffb8e0' : '#ff8a9a');
    if (this.bossBar) this.bossBar.setFillStyle(n === 2 ? 0xffb8e0 : 0xff6a9a, 1);
    const ring = this.add.circle(s.x, s.y, 20, 0xd8a0ff, 0.3).setDepth(1.5).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: ring, scale: 4.5, alpha: 0, duration: 520, onComplete: () => ring.destroy() });
  }

  weaverBurst(e, n, speed, dmg, tint) {
    const s = e.spr;
    const base = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const a = base + (Math.PI * 2 / n) * i;
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.7).setTint(tint).setDepth(4).play('ball-fly');
      this.shots.push({ spr, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 3200, dmg });
    }
    this.sfx.magic.play({ rate: 0.75, volume: 0.45 });
    this.shake(80, 0.007);
  }

  weaverSummon(e) {
    const s = e.spr, T = CFG.weaverBoss;
    let made = 0;
    for (let i = 0; i < T.summonCount; i++) {
      let at = { x: s.x + (i === 0 ? -44 : 44), y: s.y + 10 };
      for (let tr = 0; tr < 8; tr++) {
        if (!this.isWall(at.x, at.y, 12)) break;
        at = { x: Phaser.Math.Between(TILE * 3, RW - TILE * 3), y: Phaser.Math.Between(TILE * 3, RH - TILE * 3) };
      }
      const mini = this.spawnFoe('spirit', 0, at);
      if (!mini) continue;
      mini.spr.setTint(0xb89aff);
      mini.hp = mini.maxHp = Math.max(2, Math.round(mini.maxHp * 0.45));
      mini.speed = 44;
      mini.dmg = 2;
      made++;
    }
    if (made) {
      this.sfx.magic.play({ rate: 0.65, volume: 0.35 });
      this.floatText(s.x, s.y - 34, '影仆 ×' + made, '#b89aff');
    }
  }

  weaverTeleport(e) {
    const s = e.spr, p = this.player, T = CFG.weaverBoss;
    let nx = s.x, ny = s.y;
    for (let tr = 0; tr < 14; tr++) {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const rr = Phaser.Math.Between(150, 220);
      nx = Phaser.Math.Clamp(p.x + Math.cos(a) * rr, TILE * 3, RW - TILE * 3);
      ny = Phaser.Math.Clamp(p.y + Math.sin(a) * rr, TILE * 3, RH - TILE * 3);
      if (!this.isWall(nx, ny, e.half)) break;
    }
    this.weaverGhost(e);
    s.setPosition(nx, ny);
    this.floatText(nx, ny - 30, '影移', '#b89aff');
  }

  weaverGhost(e) {
    if (e.ghostT && this.time.now < e.ghostT) return;
    e.ghostT = this.time.now + 80;
    const s = e.spr, sc = e.baseScale || 2.2;
    const g = this.add.image(s.x, s.y, 'spiritIdle', 0)
      .setScale(sc).setTint(0x9a7aff).setAlpha(0.28).setDepth(1.8);
    this.tweens.add({ targets: g, alpha: 0, scale: sc * 0.85, duration: 240, onComplete: () => g.destroy() });
  }

  updateWeaverPips(e) {
    if (!this.weaverPips) return;
    const col = e.fp === 1 ? 0xd8c0ff : e.fp === 2 ? 0xffb8e0 : 0xff6a9a;
    this.weaverPips.forEach((pip, i) => pip.setFillStyle(i < e.fp ? col : 0x5a5460, 0.9));
  }

  /* 炎狱巨灵：飞行火灵，扇射与近身火环轮换；半血后火环更密 */
  updateFlamBoss(e, dt) {
    const s = e.spr, p = this.player, T = CFG.flamBoss;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    e.castT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    const sc = e.baseScale || 2.0;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * T.at) {
      e.phase = 'roar'; e.phaseT = 640;
      s.setTint(0xff6a30);
      this.sfx.alarm.play({ volume: 0.85 });
      this.floatText(s.x, s.y - 38, '火起', '#ff8a4a');
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }
    if (e.phase === 'roar') {
      s.setScale(sc + 0.14 * Math.sin(this.time.now / 40));
      if (e.phaseT <= 0) {
        e.phase2 = true; e.phase = 'hover'; e.phaseT = 500; e.castT = 500;
        e.speed *= T.speedMul; s.clearTint().setScale(sc);
      }
      return;
    }
    if (e.phase === 'castWindup') {
      s.setScale(sc + 0.08 * Math.sin(this.time.now / 42)).setTint(0xffd08a);
      if (e.phaseT <= 0) {
        s.clearTint().setScale(sc);
        if (dist < T.ringRadius + 30) this.flamNova(e);
        else this.flamFan(e);
        e.phase = 'recover'; e.phaseT = 380;
        e.castT = T.castCd * (e.phase2 ? 0.8 : 1);
      }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) e.phase = 'hover';
      return;
    }

    // hover：保持中距，太近退、太远追，轻微上下浮动
    if (dist > T.keepMax) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
      s.setFlipX(dirv.x < 0);
    } else if (dist < T.keepMin) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
      s.setFlipX(dirv.x < 0);
    }
    s.y += Math.sin(this.time.now / 100) * 0.4;
    if (!s.anims.isPlaying) s.play('flam-idle');
    if (e.castT <= 0 && e.phaseT <= 0) {
      e.phase = 'castWindup';
      e.phaseT = T.castWindup * (e.phase2 ? 0.8 : 1);
      this.sfx.magic.play({ rate: 0.6, volume: 0.3 });
    }
  }

  flamFan(e) {
    const T = CFG.flamBoss, s = e.spr, p = this.player;
    const base = Math.atan2(p.y - s.y, p.x - s.x);
    const n = e.phase2 ? T.burst2 : T.burst;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.30;
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.65).setTint(0xff7a3a).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: Math.cos(a) * T.orbSpeed, vy: Math.sin(a) * T.orbSpeed,
        life: 2800, dmg: T.orbDmg,
      });
    }
    this.sfx.magic.play({ rate: 0.8, volume: 0.35 });
  }

  flamNova(e) {
    const T = CFG.flamBoss, s = e.spr, p = this.player;
    const n = e.phase2 ? T.burst2 + 2 : T.burst + 2;
    const base = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const a = base + (Math.PI * 2 / n) * i;
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.75).setTint(0xff6a30).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: Math.cos(a) * T.orbSpeed, vy: Math.sin(a) * T.orbSpeed,
        life: 2600, dmg: T.orbDmg,
      });
    }
    this.shake(150, 0.014);
    this.sfx.boom.play({ volume: 0.8 });
    if (this.dead || this.won) return;
    const d = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (d < T.ringRadius) this.hurtPlayer(s.x, s.y, T.ringDmg);
  }

  /* 恶魔独眼：冲撞 → 震地 → 召唤鱼人；半血后蓄力更短 */
  updateDemon(e, dt) {
    const s = e.spr, p = this.player, T = CFG.demonBoss;
    const Q = e.prefix || 'demon';
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    e.summonT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    const sc = e.baseScale || 2.2;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * T.at) {
      e.phase = 'roar'; e.phaseT = 640;
      s.setTint(0xff8a6a);
      this.sfx.alarm.play({ volume: 0.85 });
      this.floatText(s.x, s.y - 40, '狂怒', '#ff8a6a');
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }
    if (e.phase === 'roar') {
      s.setScale(sc + 0.14 * Math.sin(this.time.now / 40));
      if (e.phaseT <= 0) {
        e.phase2 = true; e.phase = 'approach'; e.speed *= T.speedMul; e.summonT = T.summonCd;
        s.clearTint().setScale(sc);
      }
      return;
    }
    if (e.phase === 'chargeWindup') {
      s.setTint(0xffe08a);
      s.setScale(sc + 0.06 * Math.sin(this.time.now / 42));
      if (e.phaseT <= 0) {
        s.clearTint().setScale(sc);
        e.phase = 'charge'; e.phaseT = T.chargeTime;
        this.shake(100, 0.01);
      }
      return;
    }
    if (e.phase === 'charge') {
      const blockX = s.x, blockY = s.y;
      this.moveActor(s, e.lunge.x * T.chargeSpeed * (dt / 1000), e.lunge.y * T.chargeSpeed * (dt / 1000), e.half);
      const stopped = Math.abs(s.x - blockX) < 1 && Math.abs(s.y - blockY) < 1;
      if (e.phaseT <= 0 || stopped) { e.phase = 'recover'; e.phaseT = 420; }
      return;
    }
    if (e.phase === 'slamWindup') {
      s.setTint(0xffb06a);
      s.setScale(sc + 0.1 * Math.sin(this.time.now / 38));
      if (!e.ring) {
        e.ring = this.add.circle(p.x, p.y, T.slamRadius, 0xff5533, 0.2).setDepth(1);
        e.ring.setStrokeStyle(2, 0xff8866, 0.9);
      }
      if (e.phaseT <= 0) {
        s.clearTint().setScale(sc);
        this.demonSlam(e);
        e.phase = 'recover'; e.phaseT = 480;
      }
      return;
    }
    if (e.phase === 'summon') {
      if (e.phaseT <= 0) {
        for (let i = 0; i < T.summonCount; i++) {
          const at = { x: s.x + (i ? 44 : -44), y: s.y + 18 };
          if (this.isWall(at.x, at.y, 10)) { at.x = s.x; at.y = s.y + (i ? -38 : 38); }
          this.spawnFoe(e.minion || 'fish', 0, at);
        }
        playAct(this, 'roar', s.x, s.y - 4);
        this.sfx.alarm.play({ rate: 1.1, volume: 0.4 });
        e.phase = 'recover'; e.phaseT = 460;
      }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) e.phase = 'approach';
      return;
    }

    if (dist > 70) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
      s.setFlipX(dirv.x < 0);
      if (!s.anims.isPlaying || s.anims.currentAnim.key !== Q + '-walk') s.play(Q + '-walk');
    } else if (s.anims.currentAnim && s.anims.currentAnim.key === Q + '-walk') {
      s.play(Q + '-idle');
    }

    if (e.summonT <= 0 && this.enemiesAlive() < 5 && dist < 300) {
      e.summonT = T.summonCd;
      e.phase = 'summon'; e.phaseT = 360;
      this.floatText(s.x, s.y - 36, '召唤', '#ffd479');
      return;
    }
    if (dist < 260) {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      e.moveCount = (e.moveCount || 0) + 1;
      if (e.moveCount % 3 === 0) {
        e.phase = 'slamWindup';
        e.phaseT = T.slamWindup * (e.phase2 ? T.windupMul : 1);
      } else {
        e.phase = 'chargeWindup';
        e.phaseT = T.chargeWindup * (e.phase2 ? T.windupMul : 1);
        e.lunge.copy(dirv);
      }
      this.sfx.hurt.play({ rate: 0.55, volume: 0.35 });
    }
  }

  demonSlam(e) {
    const T = CFG.demonBoss;
    if (e.ring) { e.ring.destroy(); e.ring = null; }
    this.shake(220, 0.018);
    this.sfx.boom.play({ volume: 0.9 });
    playAct(this, 'slam', e.spr.x, e.spr.y);
    const ring = this.add.circle(e.spr.x, e.spr.y, T.slamRadius * 0.5, 0xffb06a, 0.25).setDepth(2.2);
    this.tweens.add({ targets: ring, radius: T.slamRadius, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
    if (this.dead || this.won) return;
    const d = Phaser.Math.Distance.Between(e.spr.x, e.spr.y, this.player.x, this.player.y);
    if (d < T.slamRadius) {
      this.hurtPlayer(e.spr.x, e.spr.y, T.slamDmg);
      this.player.kb = new Phaser.Math.Vector2(this.player.x - e.spr.x, this.player.y - e.spr.y)
        .normalize().scale(150);
    }
  }

  updateSamurai(e, dt) {
    const s = e.spr, p = this.player;
    const B = CFG.bossB;
    const Q = e.prefix || 'sam';
    e.phaseT -= dt;
    e.sumT = (e.sumT || 0) - dt;

    if (!e.phase2 && e.phase !== 'roar' && e.hp <= e.maxHp * B.at) {
      e.phase = 'roar';
      e.phaseT = 600;
      playAct(this, 'roar', s.x, s.y);
      this.sfx.alarm.play({ volume: 0.8 });
      this.floatText(s.x, s.y - 30, '刀势转急', '#ff8a7a');
      s.setTint(0xffb8a8);
      if (this.bossBar) this.bossBar.setFillStyle(0xffb03a, 1);
      return;
    }
    if (e.phase === 'roar') {
      s.setScale(1.5 + 0.16 * Math.sin(this.time.now / 40));
      if (e.phaseT <= 0) {
        e.phase2 = true;
        e.phase = 'approach';
        e.speed *= 1.3;
        s.setScale(1.5).setTint(0xffc8b8);
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y);
    if (dirv.lengthSq() < 0.001) dirv.set(0, 1);
    dirv.normalize();

    if (e.phase === 'slashWindup') {
      s.setTint(0xffe08a);
      s.setScale(1.5 + 0.06 * Math.sin(this.time.now / 45));
      if (e.phaseT <= 0) {
        e.phase = 'slashHit';
        e.phaseT = 220;
        s.clearTint().setScale(1.5);
        this.samuraiSlash(e);
      }
      return;
    }
    if (e.phase === 'slashHit') {
      if (e.phaseT <= 0) { e.phase = 'recover'; e.phaseT = 360; }
      return;
    }
    if (e.phase === 'chargeWindup') {
      s.setTint(0x9fd8ff);
      if (e.phaseT <= 0) {
        e.phase = 'charge';
        e.phaseT = B.chargeTime;
        s.clearTint();
        this.shake(90, 0.008);
      }
      return;
    }
    if (e.phase === 'charge') {
      const sp = B.chargeSpeed * (dt / 1000);
      this.moveActor(s, e.lunge.x * sp, e.lunge.y * sp, e.half);
      if (e.phaseT <= 0) { e.phase = 'recover'; e.phaseT = 420; }
      return;
    }
    if (e.phase === 'summon') {
      if (e.phaseT <= 0) {
        for (let i = 0; i < B.summonCount; i++) {
          const at = { x: s.x + (i ? 40 : -40), y: s.y + 20 };
          if (this.isWall(at.x, at.y, 14)) { at.x = s.x; at.y = s.y + (i ? -40 : 40); }
          this.spawnFoe('beast', 0, at);
        }
        playAct(this, 'roar', s.x, s.y - 6);
        this.sfx.alarm.play({ rate: 1.2, volume: 0.4 });
        e.phase = 'recover';
        e.phaseT = 420;
      }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) e.phase = 'approach';
      return;
    }

    if (this.dead || this.won) return;

    // 靠近玩家
    if (dist > 90) {
      const sp = e.speed * (dt / 1000);
      this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
      if (!s.anims.isPlaying || s.anims.currentAnim.key !== Q + '-walk') s.play(Q + '-walk');
    } else if (s.anims.currentAnim && s.anims.currentAnim.key === Q + '-walk') {
      s.play(Q + '-idle');
    }
    s.setFlipX(dirv.x < 0);

    if (dist < 110) {
      e.slashDir.copy(dirv);
      if (e.sumT <= 0 && this.enemiesAlive() < 4) {
        e.sumT = B.summonCd;
        e.phase = 'summon'; e.phaseT = 300;
        return;
      }
      e.moveCount = (e.moveCount || 0) + 1;
      if (e.moveCount % 3 === 0) {
        e.phase = 'chargeWindup';
        e.phaseT = B.chargeWindup * (e.phase2 ? 0.8 : 1);
        e.lunge = dirv.clone();
      } else {
        e.phase = 'slashWindup';
        e.phaseT = B.slashWindup * (e.phase2 ? 0.8 : 1);
      }
      this.sfx.hurt.play({ rate: 0.6, volume: 0.3 });
    }
  }

  /* 横斩判定：武士前方一个矩形，命中一次 */
  samuraiSlash(e) {
    const s = e.spr, p = this.player;
    const B = CFG.bossB;
    const Q = e.prefix || 'sam';
    const d = e.slashDir;
    const cx = s.x + d.x * (B.slashReach / 2);
    const cy = s.y + d.y * (B.slashReach / 2);
    // 攻击帧本身带身体（96×96），和本体同尺寸同中心叠加，避免出现"两个武士"
    const overlay = this.add.sprite(s.x, s.y, d.x < 0 ? Q + 'AtkL' : Q + 'AtkR', 0)
      .setOrigin(0.5, 0.5).setScale(1.5).setDepth(2.2);
    overlay.play(d.x < 0 ? Q + '-atkL' : Q + '-atkR');
    this.time.delayedCall(320, () => overlay.destroy());
    this.shake(80, 0.007);
    this.sfx.sword.play({ rate: 0.8, volume: 0.6 });
    const hw = Math.abs(d.x) > Math.abs(d.y) ? B.slashWidth / 2 : 22;
    const hh = Math.abs(d.x) > Math.abs(d.y) ? 22 : B.slashWidth / 2;
    if (Math.abs(p.x - cx) < hw + 10 && Math.abs(p.y - cy) < hh + 10) {
      this.hurtPlayer(cx, cy, B.slashDmg);
    }
  }

  /* 砸地落点：只判定一次，预警圈消失，落点范围内的玩家吃伤害并被推开 */
  slamImpact(e) {
    const B2 = CFG.boss2;
    this.sfx.boom.play({ volume: 0.9 });
    playAct(this, 'slam', e.spr.x, e.spr.y);
    if (e.ring) { e.ring.destroy(); e.ring = null; }
    if (this.dead || this.won) return;
    const d = Phaser.Math.Distance.Between(e.spr.x, e.spr.y, this.player.x, this.player.y);
    if (d < B2.slamRadius) {
      this.hurtPlayer(e.spr.x, e.spr.y, B2.slamDmg);
      this.player.kb = new Phaser.Math.Vector2(this.player.x - e.spr.x, this.player.y - e.spr.y)
        .normalize().scale(150);
    }
  }

  /* 小怪：直线追人，卡住超过阈值就顺侧向滑一段再继续 */
  updateBeast(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;

    if (e.slideT > 0) {
      e.slideT -= dt;
      const sp = e.speed * (dt / 1000);
      this.moveActor(s, e.slide.x * sp, e.slide.y * sp, e.half);
      return;
    }

    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;

    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    const sp = e.speed * (dt / 1000);
    const bx = s.x, by = s.y;
    this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);

    const moved = Phaser.Math.Distance.Between(bx, by, s.x, s.y);
    e.stuckT = moved < sp * 0.4 ? e.stuckT + dt : 0;
    if (e.stuckT > CFG.beastStuckMs) {
      e.stuckT = 0;
      e.slideT = CFG.beastSlideMs;
      const side = Math.random() < 0.5 ? 1 : -1;
      e.slide.set(-dirv.y * side, dirv.x * side);
    }

    const dir = Math.abs(dirv.x) > Math.abs(dirv.y)
      ? (dirv.x > 0 ? 'right' : 'left') : (dirv.y > 0 ? 'down' : 'up');
    if (dir !== e.dir) { e.dir = dir; s.play(e.kind + '-' + dir); }
    else if (!s.anims.isPlaying) s.play(e.kind + '-' + dir);
  }

  /* 小浣熊：追人，近了先缩一下再侧跳扑过来 */
  updateRacoonFoe(e, dt) {
    const s = e.spr, p = this.player;
    const C = CFG.racoon;
    if (this.dead || this.won) return;
    if (e.phase === 'hop') {
      e.phaseT -= dt;
      const sp = C.hopSpeed * (dt / 1000);
      this.moveActor(s, e.hop.x * sp, e.hop.y * sp, e.half);
      if (e.phaseT <= 0) { e.phase = 'walk'; s.setScale(e.baseScale || 2); }
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist < C.hopRange && e.cdT <= 0) {
      e.cdT = C.hopCd;
      e.phase = 'hop';
      e.phaseT = 180;
      e.hop.copy(dirv);
      e.baseScale = e.baseScale || s.scaleX;
      s.setScale(e.baseScale * 1.15);
      this.floatText(s.x, s.y - 18, '!', '#ffd479');
      return;
    }
    const sp = e.speed * (dt / 1000);
    this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
    const dir = Math.abs(dirv.x) > Math.abs(dirv.y)
      ? (dirv.x > 0 ? 'right' : 'left') : (dirv.y > 0 ? 'down' : 'up');
    if (dir !== e.dir) { e.dir = dir; s.play('racoon-' + dir); }
    else if (!s.anims.isPlaying) s.play('racoon-' + dir);
  }

  /* ---------- 小怪行为：四种脾气 ---------- */
  updateFoe(e, dt) {
    e.cdT -= dt;
    if (e.windupMul && e.windupMul < 1) e.cdT -= dt * (1 / e.windupMul - 1);   // 迅捷：出手更勤
    if (e.kind === 'cyclope') return this.updateCyclope(e, dt);
    if (e.kind === 'eye') return this.updateEye(e, dt);
    if (e.kind === 'slime') return this.updateBeast(e, dt);
    if (e.kind === 'spider') return this.updateSpider(e, dt);
    if (e.kind === 'owl') return this.updateOwl(e, dt);
    if (e.kind === 'mush') return this.updateMush(e, dt);
    if (e.kind === 'mole') return this.updateMole(e, dt);
    if (e.kind === 'skull') return this.updateSkull(e, dt);
    if (e.kind === 'racoon') return this.updateRacoonFoe(e, dt);
    if (e.kind === 'snake') return this.updateSnake(e, dt);
    if (e.kind === 'lizard') return this.updateLizard(e, dt);
    if (e.kind === 'mouse') return this.updateMouse(e, dt);
    if (e.kind === 'fish') return this.updateFish(e, dt);
    if (e.kind === 'octopus') return this.updateOctopus(e, dt);
    if (e.kind === 'kappa') return this.updateKappa(e, dt);
    if (e.kind === 'axolot') return this.updateAxolot(e, dt);
    if (e.kind === 'flam') return this.updateFlam(e, dt);
    if (e.kind === 'dragon') return this.updateDragon(e, dt);
    if (e.kind === 'demon') return this.updateDemonFoe(e, dt);
    if (e.kind === 'lantern') return this.updateLantern(e, dt);
    if (e.kind === 'spirit') return this.updateSpiritFoe(e, dt);
    return this.updateBeast(e, dt);          // beast / larva / reptile / mollusc：追击
  }

  /* 蛇：左右摆动着逼近，贴脸咬人 */
  updateSnake(e, dt) {
    const s = e.spr, p = this.player, C = CFG.snake;
    if (this.dead || this.won) return;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    const side = new Phaser.Math.Vector2(-dirv.y, dirv.x);
    const w = Math.sin(this.time.now / 1000 * C.weaveHz * Math.PI * 2) * C.weave;
    const sp = e.speed * (dt / 1000);
    this.moveActor(s, (dirv.x * e.speed + side.x * w) * (dt / 1000), (dirv.y * e.speed + side.y * w) * (dt / 1000), e.half);
    s.setFlipX(dirv.x < 0);
    if (!s.anims.isPlaying) this.faceAnim(e, dirv);
  }

  /* 蜥蜴：短蓄力后直线冲刺；冲刺结束会僵一下 */
  updateLizard(e, dt) {
    const s = e.spr, p = this.player, C = CFG.lizard;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.phase === 'windup') {
      const base = e.baseScale || 2;
      s.setScale(base + 0.1 * Math.sin(this.time.now / 40)).setTint(0xffd479);
      if (e.phaseT <= 0) {
        e.phase = 'dash'; e.phaseT = C.dashTime;
        s.clearTint().setScale(base);
      }
      return;
    }
    if (e.phase === 'dash') {
      this.moveActor(s, e.dash.x * C.dashSpeed * (dt / 1000), e.dash.y * C.dashSpeed * (dt / 1000), e.half);
      if (e.phaseT <= 0) { e.phase = 'walk'; e.cdT = C.dashCd; }
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (dist < C.dashRange && e.cdT <= 0) {
      e.phase = 'windup'; e.phaseT = C.windup;
      e.dash = dirv.clone();
      this.sfx.hurt.play({ rate: 0.65, volume: 0.25 });
    }
  }

  /* 老鼠：高频小跳突进，靠走位而不是硬碰 */
  updateMouse(e, dt) {
    const s = e.spr, p = this.player, C = CFG.mouse;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.phase === 'dash') {
      this.moveActor(s, e.dash.x * C.dashSpeed * (dt / 1000), e.dash.y * C.dashSpeed * (dt / 1000), e.half);
      if (e.phaseT <= 0) e.phase = 'walk';
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (dist < C.dashRange && e.cdT <= 0) {
      e.phase = 'dash'; e.phaseT = C.dashTime;
      e.dash = dirv.clone();
      e.cdT = C.dashCd;
      const base = e.baseScale || 2;
      s.setScale(base * 1.08);
      this.time.delayedCall(C.dashTime, () => { if (s.active) s.setScale(base); });
    }
  }

  /* 鱼人：在陆上也像在水里，短距直线冲刺 */
  updateFish(e, dt) {
    const s = e.spr, p = this.player, C = CFG.fish;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.phase === 'windup') {
      s.setTint(0x9fd8ff);
      if (e.phaseT <= 0) { e.phase = 'dash'; e.phaseT = C.dashTime; s.clearTint(); }
      return;
    }
    if (e.phase === 'dash') {
      this.moveActor(s, e.dash.x * C.dashSpeed * (dt / 1000), e.dash.y * C.dashSpeed * (dt / 1000), e.half);
      if (e.phaseT <= 0) { e.phase = 'walk'; e.cdT = C.dashCd; }
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (dist < C.dashRange && e.cdT <= 0) {
      e.phase = 'windup'; e.phaseT = C.windup;
      e.dash = dirv.clone();
    }
  }

  /* 章鱼：保持中距，喷墨减速 */
  updateOctopus(e, dt) {
    const s = e.spr, p = this.player, C = CFG.octopus;
    if (this.dead || this.won) return;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist < C.keepMin) {
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
    } else if (dist > C.keepMax) {
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) {
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.7).setTint(0x3a3a5a).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: dirv.x * C.shotSpeed, vy: dirv.y * C.shotSpeed,
        life: 2600, dmg: C.shotDmg, slow: C.inkSlow, slowMs: C.inkSlowMs,
      });
      e.cdT = C.shotCd;
      this.sfx.magic.play({ rate: 0.55, volume: 0.25 });
    }
  }

  /* 河童：周期性缩壳护盾（破盾前不掉血），其余时间追人 */
  updateKappa(e, dt) {
    const s = e.spr, p = this.player, C = CFG.kappa;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.shield > 0) {
      if (e.phaseT <= 0) { e.shield = 0; s.clearTint(); }
      return;
    }
    if (e.cdT <= 0) {
      e.shield = 1; e.phaseT = C.shieldMs; e.cdT = C.shieldCd;
      s.setTint(0x9fd8ff);
      this.floatText(s.x, s.y - 18, '缩壳', '#9fd8ff');
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
  }

  /* 蝾螈：保持距离吐泡，并缓慢自愈；压血线要先打断回复 */
  updateAxolot(e, dt) {
    const s = e.spr, p = this.player, C = CFG.axolot;
    if (this.dead || this.won) return;
    e.healT -= dt;
    if (e.healT <= 0 && e.hp < e.maxHp) {
      e.hp = Math.min(e.maxHp, e.hp + C.heal);
      e.healT = C.healCd;
      this.floatText(s.x, s.y - 18, '+' + C.heal, '#9be27a');
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist < 90) {
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) {
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.3).setTint(0x9fe8ff).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: dirv.x * C.shotSpeed, vy: dirv.y * C.shotSpeed,
        life: 2400, dmg: C.shotDmg,
      });
      e.cdT = C.shotCd;
      this.sfx.ui.play({ rate: 1.5, volume: 0.2 });
    }
  }

  /* 火焰精灵：保持中距，短前摇后喷单发火球；贴脸就退 */
  updateFlam(e, dt) {
    const s = e.spr, p = this.player, C = CFG.flam;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.phase === 'windup') {
      s.setTint(0xffd08a);
      if (e.phaseT <= 0) {
        s.clearTint();
        this.enemyShot(e, e.aim, 0xff8a3a, C.shotSpeed, C.shotDmg, { scale: 1.45 });
        e.phase = 'hover'; e.cdT = C.shotCd;
        this.sfx.magic.play({ rate: 1.3, volume: 0.25 });
      }
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist < C.keepMin) {
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
    } else if (dist > C.keepMax) {
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) {
      e.phase = 'windup'; e.phaseT = C.windup; e.aim = dirv.clone();
      this.sfx.ui.play({ rate: 0.7, volume: 0.2 });
    }
  }

  /* 熔岩龙：远距三连扇形火球，前摇长，绕侧/贴墙能躲 */
  updateDragon(e, dt) {
    const s = e.spr, p = this.player, C = CFG.dragon;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.phase === 'breath') {
      s.setTint(0xffb060);
      if (e.phaseT <= 0) {
        s.clearTint();
        const base = Math.atan2(e.aim.y, e.aim.x);
        for (let i = 0; i < C.spread; i++) {
          const a = base + (i - (C.spread - 1) / 2) * 0.3;
          this.enemyShot(e, { x: Math.cos(a), y: Math.sin(a) }, 0xff6a30, C.shotSpeed, C.shotDmg, { scale: 1.5 });
        }
        e.phase = 'hover'; e.cdT = C.shotCd;
        this.sfx.magic.play({ rate: 0.7, volume: 0.3 });
      }
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist < C.keepMin) {
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
    } else if (dist > C.keepMax) {
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) {
      e.phase = 'breath'; e.phaseT = C.windup; e.aim = dirv.clone();
      this.sfx.alarm.play({ rate: 0.6, volume: 0.22 });
    }
  }

  /* 炎魔：慢速逼近，近身短蓄力后直线冲撞；侧闪后它要喘一口气 */
  updateDemonFoe(e, dt) {
    const s = e.spr, p = this.player, C = CFG.demon;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    if (e.phase === 'windup') {
      s.setTint(0xff6a30);
      if (e.phaseT <= 0) {
        s.clearTint(); e.phase = 'charge'; e.phaseT = C.chargeTime;
        this.shake(55, 0.006);
      }
      return;
    }
    if (e.phase === 'charge') {
      this.moveActor(s, e.aim.x * C.chargeSpeed * (dt / 1000), e.aim.y * C.chargeSpeed * (dt / 1000), e.half);
      if (e.phaseT <= 0) { e.phase = 'walk'; e.cdT = C.chargeCd; }
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (dist < C.chargeRange && e.cdT <= 0) {
      e.phase = 'windup'; e.phaseT = C.windup; e.aim = dirv.clone();
      this.sfx.hurt.play({ rate: 0.55, volume: 0.25 });
    }
  }

  /* 鬼灯：漂浮慢追，放追踪火；靠近就后退，逼玩家绕弹 */
  updateLantern(e, dt) {
    const s = e.spr, p = this.player, C = CFG.lantern;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    s.y += Math.sin(this.time.now / 90) * 0.5;
    if (dist < C.keepMin) {
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
    } else if (dist > C.keepMax) {
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    }
    if (e.cdT <= 0) {
      this.enemyShot(e, dirv, 0xffb08a, C.shotSpeed, C.shotDmg, { scale: 1.25, life: 3200, homing: C.homing, speed: C.shotSpeed });
      e.cdT = C.shotCd;
      this.sfx.magic.play({ rate: 1.5, volume: 0.2 });
    }
  }

  /* 火魂：半透明飘移，三向扇形火弹；近身就后撤，保持"打不到"的距离 */
  updateSpiritFoe(e, dt) {
    const s = e.spr, p = this.player, C = CFG.spirit;
    if (this.dead || this.won) return;
    e.phaseT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    s.setAlpha(0.78 + 0.12 * Math.sin(this.time.now / 70));
    if (dist < C.keepMin) {
      this.moveActor(s, -dirv.x * e.speed * (dt / 1000), -dirv.y * e.speed * (dt / 1000), e.half);
    } else if (dist > C.keepMax) {
      this.moveActor(s, dirv.x * e.speed * (dt / 1000), dirv.y * e.speed * (dt / 1000), e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) {
      const base = Math.atan2(dirv.y, dirv.x);
      for (let i = 0; i < C.burst; i++) {
        const a = base + (i - (C.burst - 1) / 2) * 0.42;
        this.enemyShot(e, { x: Math.cos(a), y: Math.sin(a) }, 0xffb8d8, C.shotSpeed, C.shotDmg, { scale: 1.3 });
      }
      e.cdT = C.shotCd;
      this.sfx.magic.play({ rate: 1.0, volume: 0.25 });
    }
  }

  /* 蜘蛛：保持中距离，吐网（命中减速 40% / 1.5s），绕侧就能躲 */
  updateSpider(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const C = CFG.spider;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    if (dist < C.keepMin) {
      const sp = e.speed * (dt / 1000);
      this.moveActor(s, -dirv.x * sp, -dirv.y * sp, e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) { this.shootWeb(e, dirv); e.cdT = C.webCd; }
  }

  shootWeb(e, dirv) {
    const spr = this.add.sprite(e.spr.x, e.spr.y, 'ball', 0)
      .setScale(1.2).setTint(0xcfd8ff).setDepth(4).play('ball-fly');
    this.shots.push({
      spr, vx: dirv.x * CFG.spider.webSpeed, vy: dirv.y * CFG.spider.webSpeed,
      life: 2400, dmg: CFG.spider.dmg, slow: CFG.spider.webSlow, slowMs: CFG.spider.webSlowMs,
    });
    this.sfx.ui.play({ rate: 1.6, volume: 0.25 });
  }

  /* 猫头鹰：先悬停（影子落在脚下），再锁玩家当前位置俯冲；看影子挪开就行 */
  updateOwl(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const C = CFG.owl;
    e.phaseT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (e.phase === 'hover') {
      if (dist > 6) {
        const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
        const sp = e.speed * (dt / 1000);
        this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
        s.setFlipX(dirv.x < 0);
      }
      s.y += Math.sin(this.time.now / 90) * 0.6;
      if (e.phaseT <= 0 && dist < C.diveRange) {
        e.phase = 'windup'; e.phaseT = 360;
        e.diveAt = { x: p.x, y: p.y };
        e.shadow = this.add.ellipse(p.x, p.y + 6, 34, 14, 0x000000, 0.45).setDepth(1);
        s.setTint(0xffe08a);
      } else if (e.phaseT <= 0) e.phaseT = C.hoverMs;
      return;
    }
    if (e.phase === 'windup') {
      s.setScale(2 + 0.15 * Math.sin(this.time.now / 40));
      if (e.phaseT <= 0) {
        e.phase = 'dive'; e.phaseT = 260;
        s.clearTint().setScale(2);
        e.diveFrom = { x: s.x, y: s.y };
        this.sfx.hurt.play({ rate: 1.7, volume: 0.3 });
      }
      return;
    }
    if (e.phase === 'dive') {
      const pr = 1 - Math.max(0, e.phaseT) / 260;
      s.x = e.diveFrom.x + (e.diveAt.x - e.diveFrom.x) * pr;
      s.y = e.diveFrom.y + (e.diveAt.y - e.diveFrom.y) * pr;
      if (e.shadow) e.shadow.setScale(1 + pr * 0.4);
      if (e.phaseT <= 0) {
        if (e.shadow) { e.shadow.destroy(); e.shadow = null; }
        e.phase = 'recover'; e.phaseT = 420;
      }
      return;
    }
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) { e.phase = 'hover'; e.phaseT = C.hoverMs; }
      return;
    }
  }

  /* 蘑菇：几乎不动，隔一会儿在脚下放毒雾；想近战就得打一下退出来 */
  updateMush(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const C = CFG.mush;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.poisonRange) return;
    if (e.cdT <= 0) { this.spawnPoison(s.x, s.y); e.cdT = C.poisonCd; }
  }

  spawnPoison(x, y) {
    const C = CFG.mush;
    const spr = this.add.circle(x, y, C.poisonRadius, 0x7bff8a, 0.18)
      .setDepth(1).setStrokeStyle(2, 0x6ad47a, 0.45);
    this.tweens.add({ targets: spr, alpha: 0.28, duration: 700, yoyo: true, repeat: -1 });
    this.zones.push({ x, y, radius: C.poisonRadius, until: this.time.now + C.poisonLife, tickAt: 0, dmg: C.poisonDmg, tick: C.poisonTick, spr });
    this.sfx.ui.play({ rate: 0.5, volume: 0.25 });
  }

  /* 地鼠：钻地（无敌）→ 在玩家脚下冒头；看到土堆就挪窝 */
  updateMole(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const C = CFG.mole;
    e.phaseT -= dt;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (e.phase === 'walk') {
      if (dist > 6) {
        const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
        const sp = e.speed * (dt / 1000);
        this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
        s.setFlipX(dirv.x < 0);
        this.faceAnim(e, dirv);
      }
      if (dist < C.diveRange && e.cdT <= 0) {
        e.phase = 'dive';
        e.phaseT = C.diveMs;
        e.invuln = true;
        s.setAlpha(0.35).setTint(0x9a8a6a);
        this.floatText(s.x, s.y - 22, '钻地', '#c8b48a');
      }
      return;
    }
    if (e.phase === 'dive') {
      const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
      const sp = e.speed * 1.6 * (dt / 1000);
      this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
      if (e.phaseT <= 0) {
        e.phase = 'emerge';
        e.phaseT = C.emergeMs;
        e.invuln = false;
        s.setAlpha(1).clearTint();
        playAct(this, 'slam', s.x, s.y);
        this.shake(70, 0.006);
        this.floatText(s.x, s.y - 26, '冒头', '#ffd479');
      }
      return;
    }
    if (e.phase === 'emerge') {
      if (e.phaseT <= 0) { e.phase = 'walk'; e.cdT = 1800; }
    }
  }

  /* 骷髅：放追踪弹（会转向），贴墙或急转能甩掉 */
  updateSkull(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const C = CFG.skull;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > C.range) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);
    if (e.cdT <= 0) {
      const spr = this.add.sprite(s.x, s.y, 'ball', 0)
        .setScale(1.3).setTint(0xb8a0ff).setDepth(4).play('ball-fly');
      this.shots.push({
        spr, vx: dirv.x * C.shotSpeed, vy: dirv.y * C.shotSpeed,
        life: 3200, dmg: C.shotDmg, homing: C.turn, speed: C.shotSpeed,
      });
      e.cdT = C.shotCd;
      this.sfx.magic.play({ rate: 1.4, volume: 0.3 });
    }
  }

  /* 独眼：走近到一定距离就蓄力扑一个直线冲刺，冲完瘫一下 */
  updateCyclope(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const C = CFG.cyclope;
    e.phaseT -= dt;

    if (e.phase === 'windup') {
      const pulse = 1 + 0.09 * Math.sin(this.time.now / 48);
      s.setScale(2 * pulse).setTint(0xffc98a);
      if (e.phaseT <= 0) {
        e.phase = 'dash'; e.phaseT = C.dashTime;
        s.clearTint().setScale(2);
        this.shake(70, 0.004);
      }
      return;
    }
    if (e.phase === 'dash') {
      const sp = C.dashSpeed * (dt / 1000);
      this.moveActor(s, e.dash.x * sp, e.dash.y * sp, e.half);
      if (e.phaseT <= 0) { e.phase = 'walk'; e.cdT = C.dashCd; }
      return;
    }

    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    const sp = e.speed * (dt / 1000);
    this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);

    if (dist < C.dashRange && e.cdT <= 0) {
      e.phase = 'windup'; e.phaseT = 400;
      e.dash = dirv.clone();
      this.sfx.hurt.play({ rate: 0.7, volume: 0.3 });
    }
  }

  /* 眼怪：保持中距离，每 1.6 秒吐一颗能量球 */
  updateEye(e, dt) {
    const s = e.spr, p = this.player;
    if (this.dead || this.won) return;
    const E = CFG.eye;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > E.range) return;

    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    let move = new Phaser.Math.Vector2(0, 0);
    if (dist < E.keepMin) move.set(-dirv.x, -dirv.y);        // 太近就退
    else if (dist > E.keepMax) move.set(dirv.x, dirv.y);     // 太远就追
    if (move.lengthSq() > 0) {
      const sp = e.speed * (dt / 1000);
      this.moveActor(s, move.x * sp, move.y * sp, e.half);
    }
    s.setFlipX(dirv.x < 0);
    this.faceAnim(e, dirv);

    if (e.cdT <= 0) {
      this.shoot(e, dirv);
      e.cdT = E.shotCd;
    }
  }

  faceAnim(e, dirv) {
    const dir = Math.abs(dirv.x) > Math.abs(dirv.y)
      ? (dirv.x > 0 ? 'right' : 'left') : (dirv.y > 0 ? 'down' : 'up');
    if (dir !== e.dir) { e.dir = dir; e.spr.play(e.kind + '-' + dir); }
  }

  shoot(e, dirv) {
    const spr = this.add.sprite(e.spr.x, e.spr.y, 'ball', 0)
      .setScale(1.8).setDepth(4).play('ball-fly');
    this.shots.push({
      spr, vx: dirv.x * CFG.eye.shotSpeed, vy: dirv.y * CFG.eye.shotSpeed,
      life: 2600, dmg: CFG.eye.shotDmg,
    });
    this.sfx.hurt.play({ rate: 1.5, volume: 0.22 });
  }

  /* 敌人弹体统一出口：颜色/速度/追踪可按怪单独调 */
  enemyShot(e, dirv, tint, speed, dmg, opt) {
    const spr = this.add.sprite(e.spr.x, e.spr.y, 'ball', 0)
      .setScale((opt && opt.scale) || 1.35).setTint(tint).setDepth(4).play('ball-fly');
    this.shots.push(Object.assign({
      spr, vx: dirv.x * speed, vy: dirv.y * speed, life: (opt && opt.life) || 2600, dmg,
    }, opt || {}));
  }

  /* 毒雾：站在圈里每 tick 掉血；圈没了自动清 */
  updateZones(dt) {
    if (!this.zones.length) return;
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      if (this.time.now >= z.until) { z.spr.destroy(); this.zones.splice(i, 1); continue; }
      if (this.dead || this.won) continue;
      const d = Phaser.Math.Distance.Between(z.x, z.y, this.player.x, this.player.y);
      if (d > z.radius) continue;
      if (z.kind === 'quicksand') continue;     // 流沙只减速/吸附，不结算伤害
      if (this.time.now < z.tickAt) continue;
      z.tickAt = this.time.now + z.tick;
      this.hurtPlayer(z.x, z.y, z.dmg);
      if (z.kind === 'burn') this.floatText(this.player.x, this.player.y - 30, '灼烧 -' + z.dmg, '#ff8a4a');
      else this.floatText(this.player.x, this.player.y - 30, '中毒 -' + z.dmg, '#9be27a');
    }
  }

  /* 熔岩火雨：先落预警圈，0.85s 后砸下；命中才掉血，镜头不抖到影响读招 */
  updateFireRain(dt) {
    if (!this.rainOn) return;
    if (this.dead || this.won) return;
    this.fireRainT -= dt;
    const now = this.time.now;
    for (let i = this.fireRain.length - 1; i >= 0; i--) {
      const m = this.fireRain[i];
      if (now < m.until) continue;
      if (!m.hit) {
        m.hit = true;
        const dmg = this.rainDmg || 2;
        const boom = this.add.circle(m.x, m.y, m.r, this.rainBoom || 0xff6a20, 0.55)
          .setDepth(1.35).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: boom, alpha: 0, scale: 1.5, duration: 240, onComplete: () => boom.destroy() });
        this.shake(90, 0.008);
        this.sfx.boom.play({ rate: 1.35, volume: 0.35 });
        const d = Phaser.Math.Distance.Between(m.x, m.y, this.player.x, this.player.y);
        if (d < m.r) {
          this.hurtPlayer(m.x, m.y, dmg);
          this.floatText(this.player.x, this.player.y - 30, '火雨 -' + dmg, '#ff8a4a');
        }
      }
      if (now > m.until + 420) {
        m.spr.destroy();
        this.fireRain.splice(i, 1);
      }
    }
    if (this.fireRainT > 0) return;
    if (this.fireRain.length >= 8) { this.fireRainT = 900; return; }
    this.fireRainT = 2800;
    const p = this.player;
    const count = this.rainCount || 2;
    const base = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let i = 0; i < count; i++) {
      // 火雨落在玩家四周，保证预警圈始终在镜头内；撞墙时换半径/角度重试。
      let x = p.x, y = p.y;
      let ok = false;
      for (let tr = 0; tr < 10; tr++) {
        const a = base + (Math.PI * 2 / count) * i + (tr ? Phaser.Math.FloatBetween(-0.4, 0.4) : 0);
        const rad = Phaser.Math.Between(56, 132);
        x = Phaser.Math.Clamp(p.x + Math.cos(a) * rad, TILE * 2, RW - TILE * 2);
        y = Phaser.Math.Clamp(p.y + Math.sin(a) * rad, TILE * 2, RH - TILE * 2);
        if (!this.isWall(x, y, 16)) { ok = true; break; }
      }
      if (!ok) {
        x = Phaser.Math.Clamp(x, p.x - 140, p.x + 140);
        y = Phaser.Math.Clamp(y, p.y - 120, p.y + 120);
      }
      const spr = this.add.circle(x, y, 28, this.rainTint || 0xff7a2a, 0.2)
        .setDepth(1.25).setStrokeStyle(4, this.rainEdge || 0xfff0b0, 1);
      this.roomWrap.add(spr);
      this.fireRain.push({ x, y, r: 34, until: now + 850, hit: false, spr });
    }
    this.sfx.alarm.play({ rate: 0.75, volume: 0.22 });
  }

  updateShots(dt) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const b = this.shots[i];
      b.life -= dt;
      // 骷髅弹会转向：越拖越难甩，靠墙/急转能骗它撞墙
      if (b.homing) {
        const dx = this.player.x - b.spr.x, dy = this.player.y - b.spr.y;
        const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const tx = (dx / len) * b.speed, ty = (dy / len) * b.speed;
        const k = Math.min(1, b.homing * (dt / 100));
        b.vx += (tx - b.vx) * k;
        b.vy += (ty - b.vy) * k;
      }
      b.spr.x += b.vx * (dt / 1000);
      b.spr.y += b.vy * (dt / 1000);
      const dead = b.life <= 0 || this.isWall(b.spr.x, b.spr.y, 4);
      const hit = !this.dead && !this.won
        && Phaser.Math.Distance.Between(b.spr.x, b.spr.y, this.player.x, this.player.y) < 16;
      if (dead || hit) {
        if (hit) {
          if (b.slow) {
            this.slowUntil = this.time.now + b.slowMs;
            this.floatText(this.player.x, this.player.y - 26, '被网住', '#cfd8ff');
          }
          this.hurtPlayer(b.spr.x, b.spr.y, b.dmg);
        }
        b.spr.destroy();
        this.shots.splice(i, 1);
      }
    }
  }

  /* 强化：翻倍吃到就叠层，直接改伤害/攻速/移速 */
  maxHp() { return Math.max(1, (this.char ? this.char.hp : CFG.maxHp) + this.mods.maxHp); }
  atkCd() {
    const base = Math.max(CFG.atkCd * CFG.upgrades.minAtkMul, CFG.atkCd * (1 - CFG.upgrades.atkStep * this.upg.atk));
    return Math.max(120, base * (1 + this.mods.atkCd));
  }
  dmg() {
    const flat = (this.char ? this.char.dmg : CFG.playerDmg) + CFG.upgrades.powerStep * this.upg.power + this.mods.atk;
    return Math.max(1, Math.round(flat * this.mods.dmgMul));
  }
  moveSpeed() { return (this.char ? this.char.speed : 96) * Math.max(0.4, 1 + CFG.upgrades.speedStep * this.upg.speed + this.mods.speed); }

  rollUpgrade() {
    const pool = ['power', 'speed', 'atk', 'power', 'speed'];
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  killEnemy(e) {
    e.hp = 0;
    if (e.ring) { e.ring.destroy(); e.ring = null; }
    this.kills += 1;
    if (this.mods.healOnKill) {
      this.hp = Math.min(this.maxHp(), this.hp + this.mods.healOnKill);
      this.floatText(e.spr.x, e.spr.y - 18, '+' + this.mods.healOnKill + ' HP', '#9be27a');
    }
    this.sfx.kill.play({ rate: Phaser.Math.FloatBetween(0.95, 1.1) });
    playAct(this, 'kill', e.spr.x, e.spr.y - 4);
    const isBoss = e.type === 'boss';
    this.tweens.add({
      targets: e.spr,
      alpha: 0, scaleX: e.spr.scaleX * 1.3, scaleY: e.spr.scaleY * 0.4,
      y: e.spr.y - (isBoss ? 24 : 8),
      duration: isBoss ? 520 : 240, ease: 'Quad.easeOut',
    });

    const spot = { x: e.spr.x, y: e.spr.y };

    // 幼虫：死了裂成两只小号幼虫（小号不再分裂，防止无限爆兵）
    if (e.kind === 'larva' && !e.mini) {
      const L = CFG.larva;
      for (let i = 0; i < L.splitCount; i++) {
        const off = (i === 0 ? -18 : 18);
        const at = { x: spot.x + off, y: spot.y };
        if (this.isWall(at.x, at.y, 10)) { at.x = spot.x; at.y = spot.y + off; }
        const mini = this.spawnFoe('larva', 0, at);
        if (!mini) continue;
        mini.mini = true;
        mini.hp = mini.maxHp = L.miniHp;
        mini.speed = L.miniSpeed;
        mini.half = L.miniHalf;
        mini.spr.setScale(1.4);
      }
      this.floatText(spot.x, spot.y - 14, '分裂', '#9be27a');
    }

    // 史莱姆：死亡裂成 2 只更小的（小号不再裂）
    if (e.kind === 'slime' && !e.mini) {
      const C = CFG.slime;
      for (let i = 0; i < C.splitCount; i++) {
        const off = i === 0 ? -16 : 16;
        const at = { x: spot.x + off, y: spot.y };
        if (this.isWall(at.x, at.y, 10)) { at.x = spot.x; at.y = spot.y + off; }
        const mini = this.spawnFoe('slime', 0, at);
        if (!mini) continue;
        mini.mini = true;
        mini.hp = mini.maxHp = C.splitHp;
        mini.speed = C.splitSpeed;
        mini.spr.setScale(1.3);
      }
      this.floatText(spot.x, spot.y - 14, '分裂', '#9be27a');
    }
    // 精英"分裂"词缀：死后裂 2 只 30% 血的小号
    if (e.elite && e.affix === 'split' && !e.mini) {
      for (let i = 0; i < 2; i++) {
        const off = i === 0 ? -18 : 18;
        const at = { x: spot.x + off, y: spot.y };
        const mini = this.spawnFoe(e.kind, 0, at);
        if (!mini) continue;
        mini.mini = true;
        mini.elite = false;
        mini.affix = null;
        mini.hp = mini.maxHp = Math.max(1, Math.round(e.maxHp * 0.3));
        mini.spr.setScale(1.3).clearTint();
      }
      this.floatText(spot.x, spot.y - 20, '分裂', '#9be27a');
    }

    if (isBoss) {
      if (e.ring) { e.ring.destroy(); e.ring = null; }
      if (e.bossKind === 'weaver') {
        this.rainOn = false;
        (this.fireRain || []).forEach((r) => { if (r.spr) r.spr.destroy(); });
        this.fireRain = [];
      }
      const got = Phaser.Math.Between(1, 3);
      this.gems += got;
      this.floatText(spot.x, spot.y - 34, '宝石 +' + got, '#9fe0ff');
      this.dropItem(spot.x, spot.y, 'coin');
      this.dropItem(spot.x + 20, spot.y, 'heart');
      this.dropItem(spot.x - 20, spot.y, 'upg', this.rollUpgrade());
      for (let i = 0; i < this.W.global.bossExtra; i++) {
        const w = rollWeapon(this.W, this.weapon.id);
        if (w) this.dropItem(spot.x + (i ? 24 : -44), spot.y - 14, 'weapon', null, w.id);
      }
    } else {
      if (Math.random() < CFG.coinChance) this.dropItem(spot.x, spot.y, 'coin');
      if (Math.random() < CFG.heartChance) this.dropItem(spot.x + 12, spot.y, 'heart');
      if (Math.random() < this.W.global.dropChance + this.mods.dropLuck) {
        const w = rollWeapon(this.W, this.weapon.id);
        if (w) this.dropItem(spot.x - 14, spot.y, 'weapon', null, w.id);
      }
    }
    if (e.elite) {
      this.dropItem(spot.x, spot.y + 12, 'key');
      const w2 = rollWeapon(this.W, this.weapon.id);
      if (w2) this.dropItem(spot.x + 22, spot.y, 'weapon', null, w2.id);
      this.floatText(spot.x, spot.y - 26, '精英击破 · 钥匙', '#ffd479');
      if (e.aura) {
        this.tweens.add({ targets: e.aura, alpha: 0, duration: 320 });
      }
    }
    if (isBoss) this.time.delayedCall(900, () => this.win());
  }

  dropItem(x, y, kind, up, id) {
    let spr;
    if (kind === 'coin') {
      spr = this.add.sprite(x, y, 'coin', 0).setScale(2.4).setDepth(3).play('coin-spin');
    } else if (kind === 'upg') {
      spr = this.add.image(x, y, UPG_ICON[up], 0).setScale(2).setDepth(3);
    } else if (kind === 'weapon') {
      const w = this.W.byId[id] || this.W.list[0];
      id = w.id;
      spr = this.add.image(x, y, w.icon, 0).setScale(2.4).setDepth(3);
    } else if (kind === 'key') {
      spr = this.add.image(x, y, 'key', 0).setScale(2).setDepth(3);
    } else {
      spr = this.add.image(x, y, 'heart', 4).setScale(1.6).setDepth(3);
    }
    this.tweens.add({ targets: spr, y: y - 6, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // lock：刚因换武器掉在地上的旧枪，别在同一帧又被自己捡回去
    this.drops.push({ kind, up, id, spr, baseX: x, baseY: y, lock: 0 });
  }

  /* 伤害数字一样的飘字，拾取/击杀反馈用 */
  floatText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontFamily: FONT, fontSize: '12px', color: color || '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(640);
    this.tweens.add({
      targets: t, y: y - 18, alpha: 0, duration: 820, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /* 遮罩：白图 1×1 拉满再染成近黑，比 Graphics 形状在本场景管线里稳 */
  dim(on) {
    if (on) {
      if (!this.dimShade) {
        this.dimShade = this.add.image(0, 0, '__WHITE').setOrigin(0).setScrollFactor(0)
          .setDisplaySize(S.W, S.H).setTint(0x0a0d12).setAlpha(0.86).setDepth(890);
      }
      return;
    }
    if (this.dimShade) { this.dimShade.destroy(); this.dimShade = null; }
  }

  /* 暂停：批 8 外壳。ESC 打开，物理与 AI 全部停在 update 第一行，不额外 pause 场景 */
  togglePause() {
    if (this.dead || this.won || this.talking) return;
    this.paused = !this.paused;
    if (!this.paused) {
      if (this.pausePanel) { this.pausePanel.forEach((o) => o.destroy()); this.pausePanel = null; }
      this.dim(false);
      return;
    }
    this.dim(true);
    const t = this.add.text(S.W / 2, S.H / 2 - 34, '暂停', {
      fontFamily: FONT, fontSize: '24px', color: '#ffe9b0',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(921);
    const a = this.add.text(S.W / 2, S.H / 2 + 6, 'ESC / Enter 继续游戏', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(921);
    const b = this.add.text(S.W / 2, S.H / 2 + 28, 'H 回到小屋（本局作废）', {
      fontFamily: FONT, fontSize: '12px', color: '#ffb0a0',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(921).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.backToHall());
    this.pausePanel = [t, a, b];
    this.input.keyboard.once('keydown-ENTER', () => { if (this.paused) this.togglePause(); });
    this.input.keyboard.once('keydown-H', () => { if (this.paused) this.backToHall(); });
  }

  backToHall() {
    this.paused = false;
    this.scene.start('hall');
  }

  /* 震屏开关：设置里关掉后一处都不抖，数值本身不变 */
  shake(ms, mag) {
    if (this.options && this.options.shake === false) return;
    this.cameras.main.shake(ms, mag);
  }

  hurtPlayer(fromX, fromY, dmg) {
    if (window.__GOD) return;   // 验收/截图用：只在手动设置全局时生效
    if (this.dead || this.won) return;
    if (this.time.now < this.skillInvulnUntil) return;   // 疾影冲刺的落地无敌
    // 冷却按时钟算，不按帧累积：掉帧时也不会被连击打穿
    if (this.time.now - this.lastHurtAt < CFG.iFrame) return;
    this.lastHurtAt = this.time.now;
    let taken = Math.max(1, Math.round(dmg * this.mods.takenMul * this.diff.dmg));
    if (this.time.now < this.guardUntil) taken = Math.max(1, Math.round(taken * this.char.skill.takenMul));
    this.hp = Math.max(0, this.hp - taken);
    this.iframe = CFG.iFrame;
    this.sfx.hurt.play({ rate: Phaser.Math.FloatBetween(0.9, 1.1) });
    playAct(this, 'hurt', this.player.x, this.player.y);
    const dir = new Phaser.Math.Vector2(this.player.x - fromX, this.player.y - fromY);
    if (dir.lengthSq() < 0.01) dir.set(0, 1);
    dir.normalize().scale(150);
    this.player.kb = dir;
    if (this.hp <= 0) this.gameOver();
  }

  gameOver() {
    this.dead = true;
    stopMusic();
    this.commitRun(false);
    this.sfx.gameover.play();
    this.player.setAlpha(0.7);
    this.showOverlay('你倒了',
      this.roomLabel() + ' · 击杀 ' + this.kills
      + ' · 金币 ' + this.coins + ' · 宝石 ' + this.gems,
      this.spec ? '点击 / Enter 回地图' : '点击或按 R 重开',
      this.spec ? { chapterId: this.spec.chapterId, stage: this.spec.index } : null);
  }

  win() {
    if (this.won) return;
    this.won = true;
    setMood('victory', { loop: false });
    if (this.spec) {
      // 章节关：结算星级（通关 / 剩血 ≥70% / 未用休整房），取历史最高
      const got = starRating({ hp: this.hp, maxHp: this.maxHp(), usedRest: this.usedRest });
      const prev = starsOf(this.meta, this.spec.chapterId, this.spec.index);
      const stars = Math.max(prev, got);
      const map = Object.assign({}, this.meta.stars || {});
      map[this.spec.key] = stars;
      this.meta = patchSave({ stars: map });
      if (this.spec.chapterId === 'final') {
        // 终章：结局演出 + 周目写盘。普通章节关不涨周目，只有这里 commitRun(true)。
        this.gems += 5;
        this.commitRun(true);
        this.finalFx();
        const marks = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        this.starMarks = marks;
        const cyc = this.meta.cycle || 1;
        this.showOverlay(
          '星火归位',
          marks + ' · 影织者散去 · 村子回暖 · 第 ' + cyc + ' 周目',
          '点击 / Enter 回地图（下一周目）',
          { chapterId: this.spec.chapterId, stage: this.spec.index },
        );
        return;
      }
      this.gems += 2;
      this.commitRun(false);
      const marks = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      this.starMarks = marks;
      this.showOverlay(
        this.spec.chapterName + ' ' + this.spec.index + ' 关 通关',
        marks + ' · 击杀 ' + this.kills + ' · 金币 ' + this.coins + ' · 宝石 +' + this.gems,
        '点击 / Enter 回地图',
        { chapterId: this.spec.chapterId, stage: this.spec.index },
      );
      return;
    }
    this.gems += 5;
    this.commitRun(true);
    this.showOverlay('通关',
      '击杀 ' + this.kills + ' · 金币 ' + this.coins + ' · 宝石 +' + this.gems + ' · 剩 ' + this.hp + ' 血');
  }

  /* 终章收束：星火炸开 + 白闪，粒子压在结算压暗层之上 */
  finalFx() {
    this.cameras.main.flash(620, 255, 240, 210);
    this.shake(520, 0.018);
    for (let i = 0; i < 22; i++) {
      const a = (Math.PI * 2 / 22) * i + Phaser.Math.FloatBetween(-0.08, 0.08);
      const rr = Phaser.Math.Between(70, 190);
      const star = this.add.image(S.W / 2, S.H / 2, 'dust', i % 7)
        .setScrollFactor(0).setScale(Phaser.Math.FloatBetween(0.8, 1.8))
        .setTint(Phaser.Math.RND.pick([0xffe8b0, 0xffd8ff, 0xc8e8ff]))
        .setDepth(895).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: star,
        x: S.W / 2 + Math.cos(a) * rr,
        y: S.H / 2 + Math.sin(a) * rr,
        alpha: 0,
        duration: Phaser.Math.Between(700, 1050),
        delay: i * 18,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  showOverlay(title, sub, hint, back) {
    this.dim(true);
    this.overlayBack = back || null;
    const t1 = this.add.text(S.W / 2, S.H / 2 - 18, title, {
      fontFamily: FONT, fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    const t2 = this.add.text(S.W / 2, S.H / 2 + 12, sub, {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffcc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    const t3 = this.add.text(S.W / 2, S.H / 2 + 34, hint || '点击或按 R 重开', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffbb',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    this.overlay = [t1, t2, t3];
  }

  /* 一局结束才写盘：金币与击杀累加，最深取大值，通关次数单独计 */
  commitRun(cleared) {
    if (this.committed) return;
    this.committed = true;
    const m = this.meta || loadSave();
    const depth = Math.max(m.bestRoom, this.room.idx + 1);
    this.meta = patchSave({
      coins: m.coins + this.coins,
      kills: m.kills + this.kills,
      bestRoom: depth,
      // 章节关不涨周目：只有终章通关（或无章节的老模式）才 +1
      wins: m.wins + (cleared && (!this.spec || this.spec.chapterId === 'final') ? 1 : 0),
      cycle: m.cycle + (cleared && (!this.spec || this.spec.chapterId === 'final') ? 1 : 0),
      gem: (m.gem || 0) + this.gems,
    });
    this.updateHud();
  }

  restart() { this.committed = false; this.bolts.forEach((b) => b.spr.destroy()); this.scene.restart(); }

  /* ---------- 过门 ---------- */
  tryExit(dir, force) {
    const room = this.room;
    if (!room.doors[dir]) return false;
    if (!room.cleared && this.enemiesAlive() > 0 && !force) return false;
    room.cleared = true;
    this.enterRoom(room.doors[dir], dir);
    return true;
  }

  checkDoors() {
    const p = this.player, m = 22;
    const midY = Math.abs(p.y - RH / 2) < TILE * 1.7;
    const midX = Math.abs(p.x - RW / 2) < TILE * 1.7;
    if (p.x < m && midY) this.tryExit('l');
    else if (p.x > RW - m && midY) this.tryExit('r');
    else if (p.y < m && midX) this.tryExit('u');
    else if (p.y > RH - m && midX) this.tryExit('d');
  }

  /* ---------- HUD 与输入 ---------- */
  /* 章节模式显示"章 关-房"，老模式显示"第 x/y 间"；两者都短到不挤出 640 宽 */
  roomLabel() {
    if (this.spec) {
      return this.spec.chapterName + ' ' + this.spec.index + ' · 房 ' + (this.room.idx + 1) + '/' + this.roomTotal;
    }
    return '第 ' + (this.room.idx + 1) + '/' + this.roomTotal + ' 间';
  }

  buildHud() {
    this.rebuildHearts();
    this.info = this.add.text(8, 34, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
      backgroundColor: '#00000099', padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(800);
    this.hint = this.add.text(10, S.H - 22, 'WASD 移动 · 空格 攻击 · Q 技能 · 拾取武器自动换装 · M 静音', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffee',
      backgroundColor: '#00000055', padding: { x: 5, y: 3 },
    }).setScrollFactor(0).setDepth(800);
    this.skillText = this.add.text(10, S.H - 46, '', {
      fontFamily: FONT, fontSize: '12px', color: '#9fd8ff',
      backgroundColor: '#00000077', padding: { x: 5, y: 3 },
    }).setScrollFactor(0).setDepth(800);
    this.upgText = this.add.text(S.W - 10, 36, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffd479cc',
      backgroundColor: '#00000044', padding: { x: 4, y: 2 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(800);
    this.metaText = this.add.text(S.W - 10, 12, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffcc',
      backgroundColor: '#00000055', padding: { x: 5, y: 3 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(800);
    // 武器行：图标 2× 保证在 16px 图标上也认得出形状，底色加深以免压在墙上糊掉
    this.weaponIcon = this.add.image(20, 78, this.weapon.icon)
      .setScrollFactor(0).setDepth(800).setScale(2);
    this.weaponName = this.add.text(32, 70, this.weapon.name, {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
      backgroundColor: '#000000cc', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(800);
    this.promptT = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe9b0',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(850).setVisible(false);
    this.fitHint();
    this.scale.on('resize', (gs) => {
      this.hint.setPosition(10, gs.height - 20);
      this.fitHint();
    });
  }

  /* 心数跟着血量上限走：上限 17 是 5 颗（最后一颗半格），上限 24 是 6 颗 */
  rebuildHearts() {
    if (this.hearts) this.hearts.forEach((h) => h.destroy());
    this.hearts = [];
    const n = Math.max(1, Math.ceil(this.maxHp() / 4));
    for (let i = 0; i < n; i++) {
      this.hearts.push(this.add.image(10 + i * 18, 10, 'heart', 4)
        .setScrollFactor(0).setOrigin(0).setScale(1.1).setDepth(800));
    }
  }

  /* 窄屏时把提示条等比缩进去，别被裁掉 */
  fitHint() {
    const w = this.scale.width || S.W;
    this.hint.setScale(this.hint.width > w - 20 ? (w - 20) / this.hint.width : 1);
  }

  bindInput() {
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.talking) { this.dlgAdvance(); return; }
      if (this.panelOpen) return;
      this.attack();
    });
    this.input.keyboard.on('keydown-E', () => {
      if (this.talking) { this.dlgAdvance(); return; }
      if (this.panelOpen) return;
      this.interact();
    });
    this.input.keyboard.on('keydown-Q', () => this.castSkill());
    this.input.keyboard.on('keydown-J', () => this.attack());
    this.input.keyboard.on('keydown-K', () => this.attack());
    this.input.keyboard.on('keydown-R', () => { if ((this.dead || this.won) && !this.spec) this.restart(); });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.spec && (this.dead || this.won)) this.scene.start('map', this.overlayBack);
    });
    this.input.keyboard.on('keydown-M', () => {
      const m = toggleMute();
      this.meta = patchSave({ muted: m });
      this.updateHud();
    });
    const unlockOnce = () => {
      unlockMusic();
      this.input.keyboard.off('keydown', unlockOnce);
      this.input.off('pointerdown', unlockOnce);
    };
    this.input.keyboard.on('keydown', unlockOnce);
    this.input.on('pointerdown', unlockOnce);

    this.ring = this.add.graphics().setScrollFactor(0).setDepth(700);
    this.input.on('pointerdown', (p) => {
      if (this.talking) { this.dlgAdvance(); return; }
      if (this.panelOpen) return;
      if (this.dead || this.won) { if (this.spec) this.scene.start('map', this.overlayBack); else this.restart(); return; }
      this.press = { x: p.x, y: p.y, t: this.time.now };
      this.stick = { active: true, ox: p.x, oy: p.y, dx: 0, dy: 0 };
    });
    this.input.on('pointermove', (p) => {
      if (!this.stick.active) return;
      const v = new Phaser.Math.Vector2(p.x - this.stick.ox, p.y - this.stick.oy);
      const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
      const len = v.length();
      if (len > 10) {
        const mag = Math.min(len, limit);
        v.normalize();
        this.stick.dx = (v.x * mag) / limit;
        this.stick.dy = (v.y * mag) / limit;
      } else {
        this.stick.dx = 0; this.stick.dy = 0;
      }
    });
    const release = (p) => {
      if (this.press && !this.dead && !this.won) {
        const dt = this.time.now - this.press.t;
        const moved = Phaser.Math.Distance.Between(p.x, p.y, this.press.x, this.press.y);
        if (dt < 320 && moved < 26) this.attack();
      }
      this.press = null;
      this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
      this.ring.clear();
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
    this.input.addPointer(1);
  }

  /* 顿帧入口：表现层（fx.js）通过它把世界、补间、动画一起冻住 */
  hitStop(ms) { fxHitStop(this, ms); }

  /* ---------- 主循环 ---------- */
  update(_t, dtRaw) {
    if (this.paused) return;
    // 卡帧保护：浏览器切后台/追帧时 delta 会飙到几百毫秒，不夹住会把无敌帧一帧烧完
    const dt = Math.min(dtRaw, 50);
    const d = new Phaser.Math.Vector2(0, 0);
    if (!this.dead && !this.won) {
      if (this.cursors.left.isDown || this.keys.A.isDown) d.x -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) d.x += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) d.y -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) d.y += 1;
      d.x += this.stick.dx;
      d.y += this.stick.dy;
    }

    if (this.talking || this.panelOpen) { this.updateHud(); return; }
    if (this.freeze > 0) {
      this.freeze -= dt;
      if (this.freeze <= 0) { this.freeze = 0; resumeStop(this); }
      this.updateHud();
      return;
    }

    this.player.setDepth(500 + this.player.y / 1000);

    if (this.player.kb) {
      this.moveActor(this.player, this.player.kb.x * (dt / 1000), this.player.kb.y * (dt / 1000), 10);
      this.player.kb.scale(Math.pow(0.0025, dt / 1000));
      if (this.player.kb.lengthSq() < 1) this.player.kb = null;
    }
    if (!this.dead && !this.won) this.applyEnvForces(dt);

    if (!this.dead && !this.won && d.lengthSq() > 0.01) {
      d.normalize();
      const slow = 1 - Math.max(0, this.atkAt + 160 - this.time.now) / 160 * 0.35;
      const webbed = this.time.now < this.slowUntil ? 0.6 : 1;   // 网住 -40%
      const spd = this.moveSpeed() * slow * webbed * this.envSpeedMul() * (dt / 1000);
      this.moveActor(this.player, d.x * spd, d.y * spd, 10);
      const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : (d.y > 0 ? 'down' : 'up');
      if (dir !== this.facing) {
        this.facing = dir;
        this.player.play('p-' + this.char.skin + '-walk-' + dir);
      } else if (!this.player.anims.isPlaying) {
        this.player.play('p-' + this.char.skin + '-walk-' + dir);
      }
    } else if (!this.dead && !this.won && this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setFrame(DIRS[this.facing]);
      this.player.play('p-' + this.char.skin + '-idle-' + this.facing);
    }

    if (this.iframe > 0) {
      this.iframe -= dt;
      this.player.setAlpha(this.iframe > 0 && Math.floor(this.iframe / 90) % 2 ? 0.45 : 1);
      if (this.iframe <= 0) this.player.setAlpha(1);
    }

    // 敌人
    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;
      const s = e.spr;
      if (e.flash > 0) {
        e.flash -= dt;
        if (e.flash <= 0) { s.setAlpha(1); if (e.type !== 'boss') s.clearTint(); }
      }

      if (e.kb.lengthSq() > 1) {
        this.moveActor(s, e.kb.x * (dt / 1000), e.kb.y * (dt / 1000), e.half);
        e.kb.scale(Math.pow(0.002, dt / 1000));
      } else if (e.type === 'boss') {
        this.updateBoss(e, dt);
      } else {
        this.updateFoe(e, dt);
      }
      s.setDepth(2 + s.y / 1000);

      // Boss 只有明确的攻击窗口能伤人，蓄力时贴上去不掉血
      const canHurt = e.type === 'boss'
        ? (e.bossKind === 'racoon'
          ? (e.phase === 'swipeHit')
          : (e.bossKind === 'tengu'
            ? (e.phase === 'dive')
            : (e.bossKind === 'spirit'
              ? (e.phase !== 'blinkOut' && e.phase !== 'blinkIn' && e.phase !== 'roar')
              : (e.bossKind === 'demon'
                ? (e.phase === 'charge')
                : (e.phase === 'lunge' || e.phase === 'charge' || e.phase === 'slashHit')))))
        : !e.invuln;
      if (canHurt && !this.dead && !this.won) {
        const hitR = e.type === 'boss'
          ? (e.bossKind === 'tengu' || e.bossKind === 'spirit' || e.bossKind === 'demon' ? (e.half || 24) + 8 : 34)
          : 24;
        if (Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < hitR) {
          this.hurtPlayer(s.x, s.y, e.dmg);
        }
      }
    });

    this.updateShots(dt);
    this.updateBolts(dt);
    this.updateZones(dt);
    this.updateFireRain(dt);
    this.updateHand();

    // 分离
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (a.hp <= 0) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j];
        if (b.hp <= 0) continue;
        const dx = b.spr.x - a.spr.x, dy = b.spr.y - a.spr.y;
        const d2 = dx * dx + dy * dy;
        const rr = a.half + b.half;
        if (d2 < rr * rr && d2 > 0.01) {
          const dd = Math.sqrt(d2), push = (rr - dd) * 0.5;
          a.spr.x -= (dx / dd) * push; a.spr.y -= (dy / dd) * push;
          b.spr.x += (dx / dd) * push; b.spr.y += (dy / dd) * push;
        }
      }
    }

    // 拾取
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const it = this.drops[i];
      if (it.lock > this.time.now) continue;
      if (Phaser.Math.Distance.Between(it.spr.x, it.spr.y, this.player.x, this.player.y) < 22
        && !this.dead && !this.won) {
        if (it.kind === 'coin') {
          // 金币倍率可能是 0.5，不能直接四舍五入（0.5 会变成 1，等于没减），攒够整数再结算
          this.coinAcc = (this.coinAcc || 0) + Math.max(0, (1 + this.mods.coinBonus) * this.mods.coinMul);
          const whole = Math.floor(this.coinAcc);
          this.coinAcc -= whole;
          this.coins += whole;
          playAct(this, 'pickup', it.spr.x, it.spr.y);
          this.sfx.coin.play({ rate: Phaser.Math.FloatBetween(0.95, 1.1) });
        } else if (it.kind === 'upg') {
          this.upg[it.up] += 1;
          this.sfx.bonus.play({ rate: 1.15, volume: 0.8 });
          this.floatText(this.player.x, this.player.y - 22, UPG_NAME[it.up] + ' +1', '#ffd479');
        } else if (it.kind === 'weapon') {
          const old = this.weapon;
          this.equipWeapon(it.id);
          this.sfx.bonus.play({ rate: 1.3, volume: 0.7 });
          playAct(this, 'upgrade', this.player.x, this.player.y - 6);
          // 旧武器留在脚下，取回就能换回去（swapKeepOld 可关）
          if (this.W.global.swapKeepOld) {
            this.dropItem(this.player.x - 16, this.player.y + 6, 'weapon', null, old.id);
            this.drops[this.drops.length - 1].lock = this.time.now + 700;
          }
          it.spr.destroy();
          this.drops.splice(i, 1);
          continue;
        } else if (it.kind === 'key') {
          this.keyCount += 1;
          this.sfx.bonus.play({ rate: 1.25, volume: 0.75 });
          playAct(this, 'pickup', it.spr.x, it.spr.y);
          this.floatText(this.player.x, this.player.y - 22, '钥匙 +1', '#ffd479');
        } else {
          this.hp = Math.min(this.maxHp(), this.hp + CFG.healAmount);
          this.sfx.coin.play({ rate: 0.8 });
        }
        it.spr.destroy();
        this.drops.splice(i, 1);
      }
    }

    // 清尸体
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0 && e.spr.alpha <= 0.02) {
        e.spr.destroy();
        if (e.aura) { e.aura.destroy(); e.aura = null; }
        this.enemies.splice(i, 1);
      }
    }

    // 清房判定 → 开门
    const gateShut = this.room.type === 'gate' && !this.room.gateOpen;
    if (!this.room.cleared && this.enemiesAlive() === 0 && !this.room.isBoss && !gateShut) {
      this.room.cleared = true;
      if (Math.random() < CFG.upgrades.dropChance) {
        this.dropItem(this.player.x + 26, this.player.y - 10, 'upg', this.rollUpgrade());
      }
    }
    this.refreshDoorLocks();
    this.checkDoors();

    this.ring.clear();
    if (this.stick.active) {
      const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
      this.ring.lineStyle(1, 0xffffff, 0.3).strokeCircle(this.stick.ox, this.stick.oy, limit);
      this.ring.fillStyle(0xffffff, 0.45)
        .fillCircle(this.stick.ox + this.stick.dx * limit, this.stick.oy + this.stick.dy * limit, 4);
    }

    this.updatePrompt();
    this.updateCameraLook(dt);
    this.updateHud();
  }

  /* 镜头朝面朝方向轻微前瞻，转身时平滑过渡 */
  updateCameraLook(dt) {
    const v = VEC[this.facing];
    const k = 1 - Math.pow(0.004, dt / 1000);
    this.camLook.x += (-v[0] * CFG.camLookAhead - this.camLook.x) * k;
    this.camLook.y += (-v[1] * CFG.camLookAhead * 0.8 - this.camLook.y) * k;
    this.cameras.main.setFollowOffset(this.camLook.x, this.camLook.y);
  }

  updateHud() {
    if (this.upgText) {
      const u = this.upg;
      this.upgText.setVisible(u.power + u.speed + u.atk > 0);
      this.upgText.setText(`攻+${u.power} 速+${u.speed} 频+${u.atk}`);
    }
    if (this.metaText) {
      const m = this.meta || loadSave();
      this.metaText.setText(`第 ${this.cycle} 周目 · 累计 ${m.coins} 金币 · 最深 ${m.bestRoom}/${this.roomTotal || 6}`);
    }
    if (this.skillText) {
      const K = this.char.skill;
      const left = Math.max(0, K.cd - (this.time.now - this.skillAt));
      const cdTxt = left > 0 ? ' ' + Math.ceil(left / 1000) + 's' : '';
      this.skillText.setText('Q ' + K.name + cdTxt);
      this.skillText.setColor(left > 0 ? '#8fa0a8' : '#9fd8ff');
    }
    if (this.guardAura) {
      this.guardAura.setVisible(this.time.now < this.guardUntil);
      this.guardAura.setPosition(this.player.x, this.player.y + 6);
    }
    const wantHint = isMuted() ? '已静音 · 按 M 恢复 · 空格 攻击 · Q 技能' : 'WASD 移动 · 空格 攻击 · Q 技能 · 拾取武器自动换装 · M 静音';
    if (this.hint && this.hint.text !== wantHint) { this.hint.setText(wantHint); this.fitHint(); }
    this.hearts.forEach((h, i) => {
      const left = Math.max(0, Math.min(4, Math.min(this.hp, this.maxHp()) - i * 4));
      h.setFrame(left);
      h.setVisible(this.maxHp() - i * 4 > 0);
    });
    this.info.setText(
      this.roomLabel() + ' · 击杀 ' + this.kills
      + ' · 金币 ' + this.coins + ' · 宝石 ' + this.gems + ' · 钥匙 ' + this.keyCount + ' · HP ' + this.hp + '/' + this.maxHp()
    );

    // 精英光环跟着走，怪物死了就藏起来（sprite 由清尸循环销毁）
    this.enemies.forEach((e) => {
      if (!e.aura) return;
      e.aura.setVisible(e.hp > 0);
      e.aura.setPosition(e.spr.x, e.spr.y + 10);
    });

    if (this.room) this.room.dropState = this.drops.map((d) => ({ kind: d.kind, x: d.baseX, y: d.baseY, up: d.up, id: d.id }));

    const boss = this.enemies.find((e) => e.type === 'boss' && e.hp > 0);
    if (boss && this.bossBar && this.bossBarBg) {
      const cam = this.cameras.main;
      this.bossBarBg.setPosition(cam.width / 2, cam.height - 26);
      this.bossBar.setPosition(cam.width / 2 - 104, cam.height - 26);
      this.bossBar.setSize(208 * Math.max(0, boss.hp / boss.maxHp), 4);
    } else if (this.bossBar) {
      this.bossBar.setVisible(false);
      this.bossBarBg.setVisible(false);
    }

    window.__state = {
      hp: this.hp, kills: this.kills, coins: this.coins, gems: this.gems, weapon: this.weapon.id,
      room: this.roomKey, roomType: this.room.type || 'battle', keys: this.keyCount,
      slowUntil: Math.round(this.slowUntil || 0), zones: (this.zones || []).length,
      bossKind: this.bossKind || '', bossId: this.bossId || '',
      talents: this.talents.slice(), maxHp: this.maxHp(),
      roomIdx: this.room.idx + 1, total: this.roomTotal,
      stageKey: this.spec ? this.spec.key : '', stageName: this.spec ? (this.spec.chapterName + ' ' + this.spec.index) : '',
      stageRooms: this.spec ? this.spec.rooms : 0, stageDiff: +this.stageMul.toFixed(2), usedRest: !!this.usedRest,
      cleared: this.room.cleared, isBoss: this.room.isBoss,
      doors: Object.keys(this.room.doors), entry: this.entry,
      enemies: this.enemiesAlive(), drops: this.drops.length,
      enemyList: this.enemies.filter((e) => e.hp > 0).map((e) => [Math.round(e.spr.x), Math.round(e.spr.y), e.kind || e.type, e.affix || '']),
      bossHp: (this.enemies.find((e) => e.type === 'boss') || {}).hp,
      bossPhase: (this.enemies.find((e) => e.type === 'boss') || {}).phase,
      bossPhase2: !!(this.enemies.find((e) => e.type === 'boss') || {}).phase2,
      shots: this.shots.length,
      kinds: this.enemies.filter((e) => e.hp > 0).map((e) => e.kind || e.type),
      upg: { ...this.upg },
      bossX: Math.round((this.enemies.find((e) => e.type === 'boss') || {}).spr ? this.enemies.find((e) => e.type === 'boss').spr.x : -1),
      bossY: Math.round((this.enemies.find((e) => e.type === 'boss') || {}).spr ? this.enemies.find((e) => e.type === 'boss').spr.y : -1),
      dropList: this.drops.map((d) => ({ k: d.kind, x: Math.round(d.baseX), y: Math.round(d.baseY) })),
      dead: this.dead, won: this.won, iframe: Math.round(this.iframe),
      freeze: Math.round(this.freeze), freezePaused: !!this.freezePaused,
      px: Math.round(this.player.x), py: Math.round(this.player.y),
      camX: Math.round(this.cameras.main.scrollX), camY: Math.round(this.cameras.main.scrollY),
      w: this.scale.width, h: this.scale.height,
    };
  }
}
