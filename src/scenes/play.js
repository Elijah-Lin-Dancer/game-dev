/* 主场景：移动 / 战斗 / 房间 / 门 / 掉落 / Boss / HUD */
import { CFG, FONT, DIRS, ANGLE, VEC, OPPOSITE, TILE, COLS, ROWS, RW, RH, S } from '../core/config.js';
import { playAct, hitStop as fxHitStop, resumeStop } from '../systems/fx.js';
import { makeDungeon } from '../systems/dungeon.js';
import { setMood, stopMusic, toggleMute, isMuted, unlockMusic, musicState, setMuted } from '../systems/music.js';
import { loadSave, patchSave, resetSave, saveVersion } from '../systems/save.js';
import { normalizeWeapons, rollWeapon } from '../systems/weapons.js';

const ROOM_COLOR = {
  battle: 0x7a6a52, elite: 0xffd479, treasure: 0xe8c15a,
  shop: 0x7fd8ff, shrine: 0x9fd8d0, rest: 0xff9a5a, boss: 0xff6b5a,
};
const UPG_ICON = { power: 'upgPower', speed: 'upgSpeed', atk: 'upgAtk' };
const UPG_NAME = { power: '攻击', speed: '移速', atk: '攻速' };

export class Play extends Phaser.Scene {
  constructor() { super('play'); }

  create() {
    this.meta = loadSave();
    setMuted(this.meta.muted);
    this.meta = patchSave({ runs: this.meta.runs + 1 });
    this.story = window.__storyData || {};
    this.cycle = this.meta.cycle;
    this.talking = false;
    this.panelOpen = false;
    this.props = [];
    this.hp = CFG.maxHp;
    this.kills = 0;
    this.coins = 0;
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

    // 音效实例表：键必须与 build.mjs 的 sfx 表一致，少一个就会在调用点静默失败
    this.sfx = {};
    const SFX_KEYS = ['sword', 'hit', 'hurt', 'kill', 'gameover', 'coin', 'ui', 'bonus', 'boom', 'alarm', 'magic'];
    const SFX_VOL = { gameover: 0.45, boom: 0.55, alarm: 0.5, ui: 0.4, bonus: 0.5, magic: 0.45 };
    SFX_KEYS.forEach((k) => {
      this.sfx[k] = this.sound.add(k, { volume: SFX_VOL[k] || 0.5 });
    });

    this.player = this.add.sprite(RW / 2, RH / 2, 'walk', 0).setScale(2).setDepth(500);
    this.player.play('walk-down');
    this.camLook = { x: 0, y: 0 };
    this.cameras.main.startFollow(this.player, true, CFG.camLerp, CFG.camLerp);

    this.enemies = [];
    this.shots = [];          // 敌人射出的弹（会伤害玩家）
    this.bolts = [];          // 玩家射出的弹（会伤害敌人）
    this.W = normalizeWeapons(window.__weaponsData);
    this.weapon = this.W.byId[this.W.global.startWeapon];
    this.hand = this.add.image(0, 0, this.weapon.inhand || this.weapon.icon).setScale(2).setDepth(519);
    const legacy = Math.min(3, Math.max(0, (this.cycle - 1) * CFG.cycle.legacyPower));
    this.upg = { power: legacy, speed: 0, atk: 0 };
    this.drops = [];
    this.keyCount = 0;        // 本局钥匙：宝箱 1 把，精英必掉，商店可买（注意别叫 this.keys，那是 WASD 键位表）
    this.seenRooms = {};
    this.doorLocks = {};
    this.walls = new Set();
    this.roomWrap = null;

    this.dungeon = makeDungeon();
    this.roomTotal = this.dungeon.path.length;
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
        tp: (x, y) => this.player.setPosition(x, y),
        music: () => musicState(),
        playMood: (m, once) => { setMood(m, { loop: !once }); return musicState(); },
        sfxTest: (n) => { const a = this.sfx[n]; if (!a) return 'missing:' + n; a.play(); return 'ok:' + n; },
        save: () => loadSave(),
        die: () => this.gameOver(),
        win: () => this.win(),
        reset: () => resetSave(),
        bal: () => (window.__balance || null),
        spawn: (kind, x, y) => this.spawnFoe(kind, 0, { x, y }),
        bosshp: (v) => { const b = this.enemies.find((e) => e.type === 'boss'); if (b) b.hp = v; },
        shots: () => this.shots.length,
        foes: () => this.enemies.map((e) => ({ k: e.kind || e.type, hp: e.hp, max: e.maxHp, el: !!e.elite, x: Math.round(e.spr.x), y: Math.round(e.spr.y), s: Math.round(e.speed) })),
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
        panel: () => (this.panel ? { type: this.panel.prop.type, opts: this.panel.options.map((o) => o.label) } : null),
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
        dropUpg: (k) => this.dropItem(this.player.x + 10, this.player.y + 6, 'upg', k),
        // 批 2：房间编排
        roomTypes: () => this.dungeon.path.map(([x, y]) => {
          const r = this.dungeon.rooms.get(x + ',' + y);
          return { i: r.idx, x, y, t: r.type, seen: !!r.built };
        }),
        roomType: () => this.room.type || 'battle',
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
    this.roomWrap = this.add.container(0, 0).setDepth(0);
    this.enemies = [];
    this.drops = [];
    this.doorLocks = {};
    this.walls = new Set();

    const t = room.type || 'battle';
    setMood(room.isBoss ? 'fight' : (t === 'shop' ? 'shop' : (t === 'rest' ? 'cave' : 'dungeon')));
    this.props.forEach((p) => p.spr && p.spr.destroy());
    this.props = [];
    this.closePanel();

    this.entry = fromDir ? OPPOSITE[fromDir] : null;
    this.paintFloorAndWalls(room);
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
    this.cameras.main.setBounds(0, 0, RW, RH);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.room.built = true;
    if (room.isBoss) this.iframe = 700;   // 进门先给一口气，避免贴脸秒杀
    this.refreshDoorLocks();
    this.drawMinimap();
    this.trackRoom(room);
    const RD = (this.story.rooms || {})[t] || {};
    if (RD.name && room.idx > 0) this.floatText(this.player.x, this.player.y - 46, RD.name, '#ffe9b0');
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

  paintFloorAndWalls(room) {
    const wrap = this.roomWrap;
    wrap.add(this.add.tileSprite(0, 0, RW, RH, 'field', 21).setOrigin(0));

    if (room.isBoss) wrap.add(this.add.rectangle(0, 0, RW, RH, 0x223322, 0.25).setOrigin(0));

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

    const wallAt = (x, y) => {
      wallRect(wrap, x, y, 0x2b3a20);
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
  }

  refreshDoorLocks() {
    const alive = this.enemiesAlive();
    Object.entries(this.doorLocks).forEach(([dir, lock]) => {
      if (!lock) return;
      const open = this.room.cleared || alive === 0;
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
    const n = Phaser.Math.Between(CFG.roomEnemiesMin, CFG.roomEnemiesMax) + Math.min(2, room.idx);
    for (let i = 0; i < n; i++) this.spawnFoe(this.pickKind(room.idx), 200);
  }

  /* 精英：同一个 kind，血量 ×2.4、伤害 ×1.2、体型 ×1.25，脚下挂一圈金色光环 */
  makeElite(e) {
    e.elite = true;
    e.maxHp = e.hp = Math.max(1, Math.round(e.hp * 2.4));
    e.dmg = Math.round(e.dmg * 1.2);
    e.speed = Math.round(e.speed * 1.1);
    e.spr.setScale(2.5);
    e.spr.setTint(0xffd0a0);
    e.aura = this.add.sprite(e.spr.x, e.spr.y + 10, 'aura', 0)
      .setScale(1.7).setAlpha(0.9).setDepth(1.2).play('aura-pulse');
    this.floatText(e.spr.x, e.spr.y - 30, '精英', '#ffd479');
    return e;
  }

  /* 越往里走越可能遇到"带脾气"的怪：房间序号决定权重，保证前两间是纯近战教学 */
  pickKind(idx) {
    if (idx <= 0) return 'beast';
    const pool = ['beast', 'beast'];
    if (idx >= 1) pool.push('cyclope');
    if (idx >= 2) pool.push('eye');
    if (idx >= 3) pool.push('larva', 'cyclope');
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  findFreeSpot(minDistFromPlayer) {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(2 * TILE, RW - 2 * TILE);
      const y = Phaser.Math.Between(2 * TILE, RH - 2 * TILE);
      if (this.isWall(x, y, 14)) continue;
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < minDistFromPlayer) continue;
      return { x, y };
    }
    return { x: RW / 2, y: TILE * 3 };
  }

  spawnBeast() { this.spawnFoe('beast', 200); }

  /* 四种小怪的统一出生：行为差异全在 updateFoe 里分派 */
  spawnFoe(kind, minDist, at) {
    const spot = at || this.findFreeSpot(minDist || 200);
    const cfg = kind === 'beast' ? {
      hp: CFG.enemyHp, speed: CFG.enemySpeed, dmg: CFG.touchDmg, half: 12,
    } : CFG[kind];
    const spr = this.add.sprite(spot.x, spot.y, kind, 0).setScale(2).setDepth(2).setAlpha(0);
    spr.play(kind + '-down');
    this.tweens.add({ targets: spr, alpha: 1, duration: 240 });
    const mul = 1 + CFG.cycle.hpMul * (this.cycle - 1);
    const hp = Math.max(1, Math.round(cfg.hp * mul));
    const e = {
      type: 'foe', kind, spr, hp, maxHp: hp,
      kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
      speed: cfg.speed, dmg: cfg.dmg, half: cfg.half || 12,
      stuckT: 0, slideT: 0, slide: new Phaser.Math.Vector2(),
      phase: 'walk', phaseT: 0, cdT: 0, mini: false,
    };
    this.enemies.push(e);
    return e;
  }

  spawnBoss() {
    // 生成在对侧，别压在玩家进门的位置上
    const p = this.player;
    const bx = RW / 2;
    const by = p.y < RH / 2 ? RH * 0.72 : RH * 0.28;
    const spr = this.add.sprite(bx, by, 'boss', 0).setScale(1.6).setDepth(2);
    spr.play('boss-idle');
    this.enemies.push({
      type: 'boss', spr,
      hp: Math.round(CFG.bossHp * (1 + CFG.cycle.bossMul * (this.cycle - 1))),
      maxHp: Math.round(CFG.bossHp * (1 + CFG.cycle.bossMul * (this.cycle - 1))),
      kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
      speed: CFG.bossSpeed, dmg: CFG.bossDmg, half: 24,
      phase: 'approach', phaseT: 0, lunge: new Phaser.Math.Vector2(),
    });
    this.bossBarBg = this.add.rectangle(0, S.H - 26, 220, 8, 0x000000, 0.6).setScrollFactor(0).setDepth(810);
    this.bossBar = this.add.rectangle(0, S.H - 26, 216, 4, 0xff6b5a, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(811);
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

    // 第一间一定有引路人（开局就把规则讲清楚）
    if (room.idx === 0) {
      const spot = this.findFreeSpot(120);
      put('npc', 'guide', spot.x, spot.y, 'villager');
    }
    if (room.isBoss) return;

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
      event: ui.eventHint || 'E 查看',
    };
    let label = HINT[p.kind] || ui.eventHint || 'E 查看';
    // 用过的一次性物件：提示换成"已用"状态，别继续骗玩家按 E
    if (p.used && p.kind === 'chest') label = ui.chestUsedHint || 'E 空箱子';
    if (p.used && p.kind === 'rest') label = ui.restUsedHint || '火快灭了';
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
          p.spr.setTint(0x8f8a82);
          this.heal(CFG.healAmount + 2);
        }),
      });
    }
    options.push({ label: (this.story.ui || {}).leave || '离开', act: () => {} });
    this.showPanel(R.name || '篝火', R.text || '火还在烧，坐一会儿再走。', options, p);
  }

  heal(n) {
    this.hp = Math.min(CFG.maxHp, this.hp + n);
    this.floatText(this.player.x, this.player.y - 26, '+' + n + ' HP', '#9be27a');
    this.sfx.bonus.play({ rate: 0.9, volume: 0.75 });
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
    this.panel = null;
    this.panelOpen = false;
  }

  gainUpg(k) {
    this.upg[k] += 1;
    this.floatText(this.player.x, this.player.y - 24, UPG_NAME[k] + ' +1', '#ffd479');
    playAct(this, 'upgrade', this.player.x, this.player.y - 10);
    this.sfx.bonus.play({ volume: 0.85 });
    if (k === 'power') this.hp = Math.min(CFG.maxHp, this.hp);
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
    this.cameras.main.shake(160, 0.012);
  }

  /* ---------- 战斗 ---------- */
  /* ---------- 武器与攻击（批 1） ----------
   * 近战：按武器的斩击帧 + 矩形判定；远程/投掷：生成 this.bolts 里的弹体。
   * 三系差异全部来自 web/data/weapons.json，这一段不写死任何一把武器。 */
  attack() {
    if (this.talking || this.panelOpen) return;
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
      if (w.hitHeavy >= 2) this.cameras.main.shake(CFG.feel.shakeHeavyMs, CFG.feel.shakeHeavyMag);
      else if (w.hitHeavy) this.cameras.main.shake(CFG.feel.shakeHitMs, CFG.feel.shakeHitMag);
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
        if (b.pierce > 0) b.pierce -= 1;
        else spent = true;
        break;
      }
      if (spent) { b.spr.destroy(); this.bolts.splice(i, 1); }
    }
  }

  /* 统一的"打到怪"：扣血、白闪、击退、死亡判定都在这里，武器只提供数值 */
  damageFoe(e, dmg, kx, ky) {
    e.hp -= dmg;
    e.flash = 70;
    e.kb.set(kx, ky);
    if (e.type === 'boss') e.spr.setAlpha(0.45);
    else e.spr.setTintFill(0xffffff);
    if (e.hp <= 0) this.killEnemy(e);
  }

  /* 换武器：图标、手持贴图、HUD 一起换；旧武器由调用方决定要不要掉回地上 */
  equipWeapon(id, silent) {
    const w = this.W.byId[id];
    if (!w) return;
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
        this.cameras.main.shake(90, 0.008);
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

  /* ---------- 小怪行为：四种脾气 ---------- */
  updateFoe(e, dt) {
    e.cdT -= dt;
    if (e.kind === 'cyclope') return this.updateCyclope(e, dt);
    if (e.kind === 'eye') return this.updateEye(e, dt);
    return this.updateBeast(e, dt);          // beast / larva：追击（larva 更快）
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
        this.cameras.main.shake(70, 0.004);
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

  updateShots(dt) {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const b = this.shots[i];
      b.life -= dt;
      b.spr.x += b.vx * (dt / 1000);
      b.spr.y += b.vy * (dt / 1000);
      const dead = b.life <= 0 || this.isWall(b.spr.x, b.spr.y, 4);
      const hit = !this.dead && !this.won
        && Phaser.Math.Distance.Between(b.spr.x, b.spr.y, this.player.x, this.player.y) < 16;
      if (dead || hit) {
        if (hit) this.hurtPlayer(b.spr.x, b.spr.y, b.dmg);
        b.spr.destroy();
        this.shots.splice(i, 1);
      }
    }
  }

  /* 强化：翻倍吃到就叠层，直接改伤害/攻速/移速 */
  atkCd() { return Math.max(CFG.atkCd * CFG.upgrades.minAtkMul, CFG.atkCd * (1 - CFG.upgrades.atkStep * this.upg.atk)); }
  dmg() { return CFG.playerDmg + CFG.upgrades.powerStep * this.upg.power; }
  moveSpeed() { return 96 * (1 + CFG.upgrades.speedStep * this.upg.speed); }

  rollUpgrade() {
    const pool = ['power', 'speed', 'atk', 'power', 'speed'];
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  killEnemy(e) {
    e.hp = 0;
    this.kills += 1;
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
        mini.mini = true;
        mini.hp = mini.maxHp = L.miniHp;
        mini.speed = L.miniSpeed;
        mini.half = L.miniHalf;
        mini.spr.setScale(1.4);
      }
      this.floatText(spot.x, spot.y - 14, '分裂', '#9be27a');
    }

    if (isBoss) {
      if (e.ring) { e.ring.destroy(); e.ring = null; }
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
      if (Math.random() < this.W.global.dropChance) {
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

  hurtPlayer(fromX, fromY, dmg) {
    if (this.dead || this.won) return;
    // 冷却按时钟算，不按帧累积：掉帧时也不会被连击打穿
    if (this.time.now - this.lastHurtAt < CFG.iFrame) return;
    this.lastHurtAt = this.time.now;
    this.hp = Math.max(0, this.hp - dmg);
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
      '第 ' + (this.room.idx + 1) + '/' + this.roomTotal + ' 间 · 击杀 ' + this.kills + ' · 金币 ' + this.coins);
  }

  win() {
    if (this.won) return;
    this.won = true;
    setMood('victory', { loop: false });
    this.commitRun(true);
    this.showOverlay('通关',
      '击杀 ' + this.kills + ' · 金币 ' + this.coins + ' · 剩 ' + this.hp + ' 血');
  }

  showOverlay(title, sub) {
    const shade = this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.55)
      .setOrigin(0).setScrollFactor(0).setDepth(900);
    const t1 = this.add.text(S.W / 2, S.H / 2 - 18, title, {
      fontFamily: FONT, fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    const t2 = this.add.text(S.W / 2, S.H / 2 + 12, sub, {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffcc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    const t3 = this.add.text(S.W / 2, S.H / 2 + 34, '点击或按 R 重开', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffbb',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    this.overlay = [shade, t1, t2, t3];
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
      wins: m.wins + (cleared ? 1 : 0),
      cycle: m.cycle + (cleared ? 1 : 0),
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
  buildHud() {
    this.hearts = [];
    for (let i = 0; i < 5; i++) {
      this.hearts.push(this.add.image(10 + i * 18, 10, 'heart', 4)
        .setScrollFactor(0).setOrigin(0).setScale(1.1).setDepth(800));
    }
    this.info = this.add.text(8, 34, '', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
      backgroundColor: '#00000099', padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(800);
    this.hint = this.add.text(10, S.H - 22, 'WASD 移动 · 空格 攻击 · 拾取武器自动换装 · M 静音', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffffee',
      backgroundColor: '#00000055', padding: { x: 5, y: 3 },
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

  /* 窄屏时把提示条等比缩进去，别被裁掉 */
  fitHint() {
    const w = this.scale.width || S.W;
    this.hint.setScale(this.hint.width > w - 20 ? (w - 20) / this.hint.width : 1);
  }

  bindInput() {
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
    this.input.keyboard.on('keydown-J', () => this.attack());
    this.input.keyboard.on('keydown-K', () => this.attack());
    this.input.keyboard.on('keydown-R', () => { if (this.dead || this.won) this.restart(); });
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
      if (this.dead || this.won) { this.restart(); return; }
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

    if (!this.dead && !this.won && d.lengthSq() > 0.01) {
      d.normalize();
      const slow = 1 - Math.max(0, this.atkAt + 160 - this.time.now) / 160 * 0.35;
      const spd = this.moveSpeed() * slow * (dt / 1000);
      this.moveActor(this.player, d.x * spd, d.y * spd, 10);
      const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : (d.y > 0 ? 'down' : 'up');
      if (dir !== this.facing) {
        this.facing = dir;
        this.player.play('walk-' + dir);
      } else if (!this.player.anims.isPlaying) {
        this.player.play('walk-' + dir);
      }
    } else if (!this.dead && !this.won && this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setFrame(DIRS[this.facing]);
      if (this.facing === 'down') this.player.play('idle-down');
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

      // Boss 只有冲撞那一下能伤人，蓄力时贴上去不掉血
      const canHurt = e.type === 'boss' ? e.phase === 'lunge' : true;
      if (canHurt && !this.dead && !this.won) {
        const hitR = e.type === 'boss' ? 34 : 24;
        if (Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < hitR) {
          this.hurtPlayer(s.x, s.y, e.dmg);
        }
      }
    });

    this.updateShots(dt);
    this.updateBolts(dt);
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
          this.coins += 1;
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
          this.hp = Math.min(CFG.maxHp, this.hp + CFG.healAmount);
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
    if (!this.room.cleared && this.enemiesAlive() === 0 && !this.room.isBoss) {
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
    const wantHint = isMuted() ? '已静音 · 按 M 恢复 · 空格 攻击' : 'WASD 移动 · 空格 攻击 · 拾取武器自动换装 · M 静音';
    if (this.hint && this.hint.text !== wantHint) { this.hint.setText(wantHint); this.fitHint(); }
    this.hearts.forEach((h, i) => {
      h.setFrame(Math.max(0, Math.min(4, this.hp - i * 4)));
    });
    this.info.setText(
      '第 ' + (this.room.idx + 1) + '/' + this.roomTotal + ' 间 · 击杀 ' + this.kills
      + ' · 金币 ' + this.coins + ' · 钥匙 ' + this.keyCount + ' · HP ' + this.hp + '/' + CFG.maxHp
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
      hp: this.hp, kills: this.kills, coins: this.coins, weapon: this.weapon.id,
      room: this.roomKey, roomType: this.room.type || 'battle', keys: this.keyCount,
      roomIdx: this.room.idx + 1, total: this.roomTotal,
      cleared: this.room.cleared, isBoss: this.room.isBoss,
      doors: Object.keys(this.room.doors), entry: this.entry,
      enemies: this.enemiesAlive(), drops: this.drops.length,
      enemyList: this.enemies.filter((e) => e.hp > 0).map((e) => [Math.round(e.spr.x), Math.round(e.spr.y), e.type]),
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
