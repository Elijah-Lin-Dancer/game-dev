/* 主场景：移动 / 战斗 / 房间 / 门 / 掉落 / Boss / HUD */
import { CFG, DIRS, ANGLE, VEC, OPPOSITE, TILE, COLS, ROWS, RW, RH, S } from '../core/config.js';
import { makeDungeon } from '../systems/dungeon.js';
import { setMood, toggleMute, isMuted, unlockMusic, musicState, setMuted } from '../systems/music.js';
import { loadSave, patchSave, resetSave, saveVersion } from '../systems/save.js';
export class Play extends Phaser.Scene {
  constructor() { super('play'); }

  create() {
    this.meta = loadSave();
    setMuted(this.meta.muted);
    this.meta = patchSave({ runs: this.meta.runs + 1 });
    this.hp = CFG.maxHp;
    this.kills = 0;
    this.coins = 0;
    this.dead = false;
    this.won = false;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.atkAt = -9999;
    this.freeze = 0;
    this.facing = 'down';
    this.press = null;
    this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };

    this.cameras.main.setBackgroundColor('#2f3b2a');
    this.cameras.main.setBounds(0, 0, RW, RH);
    this.cameras.main.setRoundPixels(true);

    this.sfx = {};
    ['sword', 'hit', 'hurt', 'kill', 'gameover', 'coin'].forEach((k) => {
      this.sfx[k] = this.sound.add(k, { volume: k === 'gameover' ? 0.45 : 0.5 });
    });

    this.player = this.add.sprite(RW / 2, RH / 2, 'walk', 0).setScale(2).setDepth(500);
    this.player.play('walk-down');
    this.camLook = { x: 0, y: 0 };
    this.cameras.main.startFollow(this.player, true, CFG.camLerp, CFG.camLerp);

    this.enemies = [];
    this.drops = [];
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
        save: () => loadSave(),
        die: () => this.gameOver(),
        win: () => this.win(),
        reset: () => resetSave(),
        bal: () => (window.__balance || null),
      };
    }
  }

  /* ---------- 房间 ---------- */
  enterRoom(key, fromDir) {
    const room = this.dungeon.rooms.get(key);
    // 离开上一间时，把它没捡的掉落记在房间上，回来还在
    if (this.room && this.drops) {
      this.room.dropState = this.drops.map((d) => ({ kind: d.kind, x: d.baseX, y: d.baseY }));
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

    setMood(room.isBoss ? 'fight' : 'dungeon');
    this.entry = fromDir ? OPPOSITE[fromDir] : null;
    this.paintFloorAndWalls(room);
    this.spawnRoomEnemies(room);
    (room.dropState || []).forEach((d) => this.dropItem(d.x, d.y, d.kind));

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
    const n = Phaser.Math.Between(CFG.roomEnemiesMin, CFG.roomEnemiesMax) + Math.min(2, room.idx);
    for (let i = 0; i < n; i++) this.spawnBeast();
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

  spawnBeast() {
    const spot = this.findFreeSpot(200);
    const spr = this.add.sprite(spot.x, spot.y, 'beast', 0).setScale(2).setDepth(2).setAlpha(0);
    spr.play('beast-down');
    this.tweens.add({ targets: spr, alpha: 1, duration: 240 });
    this.enemies.push({
      type: 'beast', spr, hp: CFG.enemyHp, maxHp: CFG.enemyHp,
      kb: new Phaser.Math.Vector2(), flash: 0, dir: 'down',
      speed: CFG.enemySpeed, dmg: CFG.touchDmg, half: 12,
      stuckT: 0, slideT: 0, slide: new Phaser.Math.Vector2(),
    });
  }

  spawnBoss() {
    // 生成在对侧，别压在玩家进门的位置上
    const p = this.player;
    const bx = RW / 2;
    const by = p.y < RH / 2 ? RH * 0.72 : RH * 0.28;
    const spr = this.add.sprite(bx, by, 'boss', 0).setScale(1.6).setDepth(2);
    spr.play('boss-idle');
    this.enemies.push({
      type: 'boss', spr, hp: CFG.bossHp, maxHp: CFG.bossHp,
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

  /* ---------- 战斗 ---------- */
  attack() {
    if (this.dead || this.won || this.time.now - this.atkAt < CFG.atkCd) return;
    this.atkAt = this.time.now;
    this.sfx.sword.play({ rate: Phaser.Math.FloatBetween(0.95, 1.08) });

    const v = VEC[this.facing];
    const fx = this.add.sprite(
      this.player.x + v[0] * 18, this.player.y + v[1] * 16, 'slash'
    ).setDepth(600).setRotation(ANGLE[this.facing] + Math.PI / 4).setScale(2.2);
    fx.play('slash-play');
    this.tweens.add({
      targets: fx, scale: 2.9, duration: 210, ease: 'Quad.easeOut',
      onComplete: () => fx.destroy(),
    });

    this.tweens.add({
      targets: this.player,
      x: this.player.x + v[0] * 4, y: this.player.y + v[1] * 4,
      duration: 90, yoyo: true, ease: 'Quad.easeOut',
    });
    this.tweens.add({ targets: this.player, scaleX: 2.3, scaleY: 1.75, duration: 70, yoyo: true });

    const cx = this.player.x + v[0] * CFG.atkReach;
    const cy = this.player.y + v[1] * CFG.atkReach;
    const hw = CFG.atkBox[0] / 2, hh = CFG.atkBox[1] / 2;
    let hitAny = false;

    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;
      if (Math.abs(e.spr.x - cx) > hw + e.half || Math.abs(e.spr.y - cy) > hh + e.half) return;
      hitAny = true;
      e.hp -= CFG.playerDmg;
      e.flash = 70;
      e.kb.set(v[0] * (e.type === 'boss' ? 40 : 120), v[1] * (e.type === 'boss' ? 40 : 120));
      e.spr.setAlpha(0.45);
      if (e.hp <= 0) this.killEnemy(e);
    });

    if (hitAny) {
      this.freeze = CFG.hitStop;
      this.cameras.main.shake(80, 0.006);
      this.sfx.hit.play({ rate: Phaser.Math.FloatBetween(0.9, 1.12) });
      const spark = this.add.circle(cx, cy, 7, 0xffffff, 1).setDepth(620);
      this.tweens.add({
        targets: spark, scale: 2.4, alpha: 0, duration: 160,
        ease: 'Quad.easeOut', onComplete: () => spark.destroy(),
      });
    }
  }

  /* Boss：靠近 → 蓄力（红身抖动）→ 直线冲撞 → 缓 0.38 秒 → 循环 */
  updateBoss(e, dt) {
    const s = e.spr, p = this.player;
    e.phaseT -= dt;

    if (e.phase === 'windup') {
      const pulse = 1 + 0.07 * Math.sin(this.time.now / 55);
      s.setScale(1.6 * pulse).setTint(0xff8a7a);
      if (e.phaseT <= 0) {
        e.phase = 'lunge';
        e.phaseT = CFG.bossLungeTime;
        s.clearTint().setScale(1.6);
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
    if (e.phase === 'recover') {
      if (e.phaseT <= 0) e.phase = 'approach';
      return;
    }

    if (this.dead || this.won) return;
    const dist = Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y);
    if (dist > CFG.chaseRange) return;
    const dirv = new Phaser.Math.Vector2(p.x - s.x, p.y - s.y).normalize();
    const sp = e.speed * (dt / 1000);
    this.moveActor(s, dirv.x * sp, dirv.y * sp, e.half);
    s.setFlipX(dirv.x < 0);

    if (dist < CFG.bossLungeReach) {
      e.phase = 'windup';
      e.phaseT = CFG.bossWindup;
      e.lunge.copy(dirv);
      this.sfx.hurt.play({ rate: 0.55, volume: 0.35 });
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
    if (dir !== e.dir) { e.dir = dir; s.play('beast-' + dir); }
    else if (!s.anims.isPlaying) s.play('beast-' + dir);
  }

  killEnemy(e) {
    e.hp = 0;
    this.kills += 1;
    this.sfx.kill.play({ rate: Phaser.Math.FloatBetween(0.95, 1.1) });
    const isBoss = e.type === 'boss';
    this.tweens.add({
      targets: e.spr,
      alpha: 0, scaleX: e.spr.scaleX * 1.3, scaleY: e.spr.scaleY * 0.4,
      y: e.spr.y - (isBoss ? 24 : 8),
      duration: isBoss ? 520 : 240, ease: 'Quad.easeOut',
    });

    const spot = { x: e.spr.x, y: e.spr.y };
    if (isBoss) {
      this.dropItem(spot.x, spot.y, 'coin');
      this.dropItem(spot.x + 20, spot.y, 'heart');
    } else {
      if (Math.random() < CFG.coinChance) this.dropItem(spot.x, spot.y, 'coin');
      if (Math.random() < CFG.heartChance) this.dropItem(spot.x + 12, spot.y, 'heart');
    }
    if (isBoss) this.time.delayedCall(900, () => this.win());
  }

  dropItem(x, y, kind) {
    const spr = kind === 'coin'
      ? this.add.sprite(x, y, 'coin', 0).setScale(2.4).setDepth(3).play('coin-spin')
      : this.add.image(x, y, 'heart', 4).setScale(1.6).setDepth(3);
    this.tweens.add({ targets: spr, y: y - 6, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.drops.push({ kind, spr, baseX: x, baseY: y });
  }

  hurtPlayer(fromX, fromY, dmg) {
    if (this.dead || this.won) return;
    // 冷却按时钟算，不按帧累积：掉帧时也不会被连击打穿
    if (this.time.now - this.lastHurtAt < CFG.iFrame) return;
    this.lastHurtAt = this.time.now;
    this.hp = Math.max(0, this.hp - dmg);
    this.iframe = CFG.iFrame;
    this.sfx.hurt.play({ rate: Phaser.Math.FloatBetween(0.9, 1.1) });
    this.cameras.main.shake(180, 0.012);
    const ring = this.add.circle(this.player.x, this.player.y, 10, 0xff5555, 0.85).setDepth(620);
    this.tweens.add({
      targets: ring, scale: 2.2, alpha: 0, duration: 220,
      ease: 'Quad.easeOut', onComplete: () => ring.destroy(),
    });
    const dir = new Phaser.Math.Vector2(this.player.x - fromX, this.player.y - fromY);
    if (dir.lengthSq() < 0.01) dir.set(0, 1);
    dir.normalize().scale(150);
    this.player.kb = dir;
    if (this.hp <= 0) this.gameOver();
  }

  gameOver() {
    this.dead = true;
    this.commitRun(false);
    this.sfx.gameover.play();
    this.player.setAlpha(0.7);
    this.showOverlay('你倒了',
      '第 ' + (this.room.idx + 1) + '/' + this.roomTotal + ' 间 · 击杀 ' + this.kills + ' · 金币 ' + this.coins);
  }

  win() {
    if (this.won) return;
    this.won = true;
    this.commitRun(true);
    this.showOverlay('通关',
      '击杀 ' + this.kills + ' · 金币 ' + this.coins + ' · 剩 ' + this.hp + ' 血');
  }

  showOverlay(title, sub) {
    const shade = this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.55)
      .setOrigin(0).setScrollFactor(0).setDepth(900);
    const t1 = this.add.text(S.W / 2, S.H / 2 - 18, title, {
      fontFamily: 'ui-monospace, monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    const t2 = this.add.text(S.W / 2, S.H / 2 + 12, sub, {
      fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#ffffffcc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(901);
    const t3 = this.add.text(S.W / 2, S.H / 2 + 34, '点击或按 R 重开', {
      fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#ffffff88',
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
    });
    this.updateHud();
  }

  restart() { this.committed = false; this.scene.restart(); }

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
    this.info = this.add.text(8, 26, '', {
      fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#00000099', padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(800);
    this.hint = this.add.text(10, S.H - 22, 'WASD 移动 · 空格 挥砍 · M 静音 · Boss 红身=蓄力', {
      fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#ffffffee',
      backgroundColor: '#00000055', padding: { x: 5, y: 3 },
    }).setScrollFactor(0).setDepth(800);
    this.metaText = this.add.text(S.W - 10, 12, '', {
      fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#ffffffcc',
      backgroundColor: '#00000055', padding: { x: 5, y: 3 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(800);
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
    this.input.keyboard.on('keydown-SPACE', () => this.attack());
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

    if (this.freeze > 0) {
      this.freeze -= dt;
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
      this.moveActor(this.player, d.x * 96 * slow * (dt / 1000), d.y * 96 * slow * (dt / 1000), 10);
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
        if (e.flash <= 0) s.setAlpha(1);
      }

      if (e.kb.lengthSq() > 1) {
        this.moveActor(s, e.kb.x * (dt / 1000), e.kb.y * (dt / 1000), e.half);
        e.kb.scale(Math.pow(0.002, dt / 1000));
      } else if (e.type === 'boss') {
        this.updateBoss(e, dt);
      } else {
        this.updateBeast(e, dt);
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
      if (Phaser.Math.Distance.Between(it.spr.x, it.spr.y, this.player.x, this.player.y) < 22
        && !this.dead && !this.won) {
        if (it.kind === 'coin') {
          this.coins += 1;
          this.sfx.coin.play({ rate: Phaser.Math.FloatBetween(0.95, 1.1) });
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
        this.enemies.splice(i, 1);
      }
    }

    // 清房判定 → 开门
    if (!this.room.cleared && this.enemiesAlive() === 0 && !this.room.isBoss) {
      this.room.cleared = true;
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
    if (this.metaText) {
      const m = this.meta || loadSave();
      this.metaText.setText(`累计 ${m.coins} 金币 · 最深 ${m.bestRoom}/${this.roomTotal || 6} · 通关 ${m.wins}`);
    }
    const wantHint = isMuted() ? '已静音 · 按 M 恢复 · 空格 挥砍' : 'WASD 移动 · 空格 挥砍 · M 静音 · Boss 红身=蓄力';
    if (this.hint && this.hint.text !== wantHint) { this.hint.setText(wantHint); this.fitHint(); }
    this.hearts.forEach((h, i) => {
      h.setFrame(Math.max(0, Math.min(4, this.hp - i * 4)));
    });
    this.info.setText(
      '第 ' + (this.room.idx + 1) + '/' + this.roomTotal + ' 间 · 击杀 ' + this.kills
      + ' · 金币 ' + this.coins + ' · HP ' + this.hp + '/' + CFG.maxHp
    );

    if (this.room) this.room.dropState = this.drops.map((d) => ({ kind: d.kind, x: d.baseX, y: d.baseY }));

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
      hp: this.hp, kills: this.kills, coins: this.coins,
      room: this.roomKey, roomIdx: this.room.idx + 1, total: this.roomTotal,
      cleared: this.room.cleared, isBoss: this.room.isBoss,
      doors: Object.keys(this.room.doors), entry: this.entry,
      enemies: this.enemiesAlive(), drops: this.drops.length,
      enemyList: this.enemies.filter((e) => e.hp > 0).map((e) => [Math.round(e.spr.x), Math.round(e.spr.y), e.type]),
      bossHp: (this.enemies.find((e) => e.type === 'boss') || {}).hp,
      bossPhase: (this.enemies.find((e) => e.type === 'boss') || {}).phase,
      bossX: Math.round((this.enemies.find((e) => e.type === 'boss') || {}).spr ? this.enemies.find((e) => e.type === 'boss').spr.x : -1),
      bossY: Math.round((this.enemies.find((e) => e.type === 'boss') || {}).spr ? this.enemies.find((e) => e.type === 'boss').spr.y : -1),
      dropList: this.drops.map((d) => ({ k: d.kind, x: Math.round(d.baseX), y: Math.round(d.baseY) })),
      dead: this.dead, won: this.won, iframe: Math.round(this.iframe),
      px: Math.round(this.player.x), py: Math.round(this.player.y),
      camX: Math.round(this.cameras.main.scrollX), camY: Math.round(this.cameras.main.scrollY),
      w: this.scale.width, h: this.scale.height,
    };
  }
}
