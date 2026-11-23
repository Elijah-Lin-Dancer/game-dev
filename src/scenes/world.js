/* G0 开放世界雏形：草原 → 竹林 → 沙漠
 *
 * 这一批只做“能走出去、能回来”的最小闭环：
 *   - 3 屏横向世界，640×360 单屏，镜头跟随；到边缘自然滑到下一屏；
 *   - 草原小雨、沙漠沙尘；竹林是晴；
 *   - 3 丛草药（E 读条 2 秒、90 秒重生）+ 村医 + 采 5 株交付；
 *   - 独立 na.world 存档，刷新后保留到过哪屏 / 草药数量 / 委托状态；
 *   - 从归途小屋东门进入，ESC 回小屋。
 *
 * 不接战斗掉落、不接主线 na.save；这些是 G1/G2 的范围。
 */
import { S } from '../core/config.js';
import { loadSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { loadWorldSave, patchWorldSave } from '../systems/worldSave.js';
import { UI } from '../systems/ui/tokens.js';
import { makePanel, makeCard, makeText } from '../systems/ui/primitives.js';

const SCREEN_W = S.W;
const SCREEN_H = S.H;
const SPEED = 82;
const GATHER_MS = 2000;
const RESPAWN_MS = 90000;
const TINT = { field: UI.world.field, bamboo: UI.world.bamboo, desert: UI.world.desert };
const QUEST_LABEL = { none: '未接委托', active: '采集', done: '委托完成' };

function mixColor(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return ((Math.round(ar + (br - ar) * t) << 16)
    | (Math.round(ag + (bg - ag) * t) << 8)
    | Math.round(ab + (bb - ab) * t));
}

function hudText(scene, x, y, text, role = 'body', opts = {}) {
  const { depth = 800, background = UI.hud.bg, padding = { x: 6, y: 4 }, ...style } = opts;
  const t = makeText(scene, x, y, text, role, {
    ...style,
    ...(background ? { backgroundColor: background, padding } : {}),
  });
  return t.setScrollFactor(0).setDepth(depth);
}

function screenPanel(scene, opts) {
  const p = makePanel(scene, opts);
  p.container.setScrollFactor(0);
  return p;
}

function destroyRow(row) {
  if (!row) return;
  if (row.card) { row.card.container.destroy(); row.card.hit.destroy(); return; }
  row.destroy();
}

function normalizeWorld(raw) {
  const src = raw && Array.isArray(raw.screens) ? raw.screens : [];
  const screens = src.filter((s) => s && s.id).map((s, i) => ({
    id: String(s.id),
    name: String(s.name || s.id),
    biome: String(s.biome || 'field'),
    weather: String(s.weather || 'clear'),
    weatherName: String(s.weatherName || '晴'),
    deco: Array.isArray(s.deco) ? s.deco : [],
    herbs: Array.isArray(s.herbs) ? s.herbs.filter((h) => Array.isArray(h) && h.length >= 2) : [],
    npc: s.npc || null,
    x: i * SCREEN_W,
  }));
  const q = raw && raw.quest ? raw.quest : {};
  return {
    screens,
    quest: {
      id: String(q.id || 'herb5'),
      name: String(q.name || '草药五株'),
      need: Math.max(1, Math.round(Number(q.need) || 5)),
      yield: Math.max(1, Math.round(Number(q.yield) || 2)),
      rewardTokens: Math.max(0, Math.round(Number(q.rewardTokens) || 1)),
    },
  };
}

export class World extends Phaser.Scene {
  constructor() { super('world'); }

  create() {
    const main = loadSave();
    this.charId = main.lastChar || 'ninja';
    this.world = normalizeWorld(window.__worldData);
    this.save = loadWorldSave();
    this.screenIndex = -1;
    this.screenId = '';
    this.weather = '';
    this.talking = false;
    this.talk = null;
    this.panelOpen = false;
    this.panel = null;
    this.gathering = null;
    this.pointerTarget = null;
    this.herbs = [];
    this.npc = null;

    if (!this.world.screens.length) {
      this.add.text(SCREEN_W / 2, SCREEN_H / 2, 'world.json 缺失', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
      }).setOrigin(0.5);
      return;
    }

    this.buildGround();
    this.buildNPC();
    this.buildHerbs();
    this.buildPlayer();
    this.buildWeather();
    this.buildHud();
    this.bindInput();

    this.cameras.main.setBounds(0, 0, this.world.screens.length * SCREEN_W, SCREEN_H);
    // 0.1/帧 在 60fps 下约 0.45s 收敛到目标；跨屏不黑场，玩家保持可控。
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#0d1017');
    this.applyScreen(0, true);
    this.updateHud();

    if (location.search.indexOf('debug') >= 0) window.__world = this;
  }

  /* ---------- 地表与装饰 ---------- */
  makeSeamTexture() {
    if (this.textures.exists('__worldSeam')) return;
    const cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 1;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 96, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.88)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 1);
    this.textures.addCanvas('__worldSeam', cv);
  }

  buildGround() {
    this.makeSeamTexture();
    this.screens = this.world.screens;
    this.screens.forEach((s) => {
      const tint = TINT[s.biome] || TINT.field;
      this.add.tileSprite(s.x, 0, SCREEN_W, SCREEN_H, 'field', 21)
        .setOrigin(0).setTint(tint).setDepth(0);
      this.add.rectangle(s.x, 0, SCREEN_W, SCREEN_H, 0x0a120c, 0.12)
        .setOrigin(0).setDepth(1);
      s.deco.forEach((d) => {
        const [dx, dy, frame = 0, scale = 1] = d;
        this.add.image(s.x + dx, dy, 'floorDetail', frame)
          .setScale(scale).setAlpha(0.48).setTint(tint).setDepth(2);
      });
      // 竹林加几束斜光，和草原 / 沙漠拉开层次；不使用战斗房的暗角。
      if (s.biome === 'bamboo') {
        for (let k = 0; k < 4; k += 1) {
          const beam = this.add.image(s.x + 90 + k * 145, 36, 'ray', 0)
            .setOrigin(0.5, 0).setScale(1.35, 1.8).setRotation(-0.12)
            .setAlpha(0.12).setTint(0xc8e8b0).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
          this.tweens.add({
            targets: beam, alpha: 0.05, duration: 1700 + k * 90, yoyo: true, repeat: -1,
          });
        }
      } else if (s.biome === 'field') {
        const beam = this.add.image(s.x + 330, 30, 'ray', 0)
          .setOrigin(0.5, 0).setScale(1.2, 1.7).setRotation(0.16)
          .setAlpha(0.07).setTint(0xd8f0c8).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
        this.tweens.add({ targets: beam, alpha: 0.03, duration: 1800, yoyo: true, repeat: -1 });
      }
      this.add.text(s.x + 18, 60, s.name, {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      }).setAlpha(0.55).setDepth(3);
    });

    // 两屏交界不画一条硬线：用 12 条窄色带做 48px 的色调过渡，镜头滑过时不会像贴图接缝。
    for (let i = 1; i < this.screens.length; i += 1) {
      const from = TINT[this.screens[i - 1].biome] || TINT.field;
      const to = TINT[this.screens[i].biome] || TINT.field;
      const bx = this.screens[i].x;
      this.add.image(bx, 0, '__worldSeam')
        .setOrigin(0.5, 0).setDisplaySize(112, SCREEN_H)
        .setTint(mixColor(from, to, 0.5)).setAlpha(0.62).setDepth(1.6);
    }
  }

  /* ---------- 村医 ---------- */
  buildNPC() {
    const s = this.screens.find((x) => x.npc);
    if (!s) return;
    const n = s.npc;
    const x = s.x + Number(n.x || 500);
    const y = Number(n.y || 210);
    const glow = this.add.image(x, y - 10, 'aura', 0)
      .setScale(1.4).setAlpha(0.16).setTint(UI.world.herbGold)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
    this.tweens.add({ targets: glow, alpha: 0.06, scale: 1.8, duration: 900, yoyo: true, repeat: -1 });
    const sprite = this.add.sprite(x, y, 'villager2', 0)
      .setOrigin(0.5, 1).setScale(2).setDepth(25);
    this.tweens.add({ targets: sprite, y: y - 2, duration: 620, yoyo: true, repeat: -1 });
    const label = this.add.text(x, y - 48, String(n.name || '村医'), {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.primary,
      backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(40);
    const prompt = this.add.text(x, y - 68, 'E 交谈', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
      backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      if (this.talking || this.panelOpen || this.gathering) return;
      if (this.distPlayer(x, y) <= 52) this.interactNpc();
      else this.pointerTarget = { x, y };
    });
    this.npc = { ...n, x, y, sprite, label, prompt };
  }

  /* ---------- 三丛草药 ---------- */
  buildHerbs() {
    this.screens.forEach((s) => {
      s.herbs.forEach((h, i) => {
        const x = s.x + Number(h[0]);
        const y = Number(h[1]);
        const glow = this.add.circle(x, y - 6, 13, UI.world.herb, 0.13)
          .setDepth(23).setBlendMode(Phaser.BlendModes.ADD);
        const sprite = this.add.sprite(x, y, 'herb', 0)
          .setOrigin(0.5, 1).setScale(2).setDepth(24);
        this.tweens.add({ targets: sprite, y: y - 3, duration: 760 + i * 90, yoyo: true, repeat: -1 });
        const prompt = this.add.text(x, y - 28, 'E 采集', {
          fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
          backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
        }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
        sprite.setInteractive({ useHandCursor: true });
        const node = {
          id: s.id + '-' + i, screen: s.id, x, y, sprite, glow, prompt,
          active: true, respawnAt: 0,
        };
        sprite.on('pointerdown', () => {
          if (this.talking || this.panelOpen || this.gathering) return;
          if (!node.active) return;
          if (this.distPlayer(x, y) <= 48) this.startGather(node);
          else this.pointerTarget = { x, y };
        });
        this.herbs.push(node);
      });
    });
  }

  /* ---------- 玩家 ---------- */
  buildPlayer() {
    const skin = ['ninja', 'mage', 'knight'].includes(this.charId) ? this.charId : 'ninja';
    this.player = this.add.sprite(86, SCREEN_H - 52, 'walk', 0)
      .setOrigin(0.5, 1).setScale(2).setDepth(30);
    this.player.shadow = this.add.ellipse(86, SCREEN_H - 50, 22, 6, 0x000000, 0.25)
      .setDepth(29);
    this.face = 'right';
    this.player.anims.play('p-' + skin + '-idle-down');
    this.charSkin = skin;
  }

  /* ---------- 两种气候 ---------- */
  makeVignette() {
    if (this.textures.exists('worldVig')) return;
    const cv = document.createElement('canvas');
    cv.width = 640;
    cv.height = 360;
    const ctx = cv.getContext('2d');
    const grd = ctx.createRadialGradient(320, 180, 120, 320, 180, 430);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.52, 'rgba(0,0,0,0.04)');
    grd.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 640, 360);
    this.textures.addCanvas('worldVig', cv);
  }

  buildWeather() {
    this.makeVignette();
    this.rain = this.add.particles(0, 0, 'dust', {
      x: { min: -20, max: SCREEN_W + 20 },
      y: -12,
      lifespan: { min: 620, max: 980 },
      speedX: { min: -14, max: 8 },
      speedY: { min: 190, max: 280 },
      scaleX: { min: 0.35, max: 0.65 },
      scaleY: { min: 1.1, max: 1.8 },
      alpha: { start: 0.85, end: 0.18 },
      quantity: 2,
      frequency: 36,
      tint: UI.world.rain,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.rain.stop();

    this.dust = this.add.particles(0, 0, 'dust', {
      x: { min: -40, max: SCREEN_W + 40 },
      y: { min: 40, max: SCREEN_H - 20 },
      lifespan: { min: 900, max: 1500 },
      speedX: { min: -92, max: -46 },
      speedY: { min: -8, max: 14 },
      scale: { min: 0.8, max: 1.8 },
      alpha: { start: 0.35, end: 0 },
      quantity: 1,
      frequency: 34,
      tint: UI.world.dust,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.dust.stop();

    this.dustVeil = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, UI.world.dustVeil, 0.16)
      .setOrigin(0).setScrollFactor(0).setDepth(790).setAlpha(0);
    this.worldVig = this.add.image(0, 0, 'worldVig').setOrigin(0)
      .setDisplaySize(SCREEN_W, SCREEN_H).setScrollFactor(0).setDepth(789).setAlpha(0.12);
  }

  /* ---------- HUD ---------- */
  buildHud() {
    this.hudBg = this.add.rectangle(0, 0, SCREEN_W, 36, UI.color.panel, 0.82)
      .setOrigin(0).setScrollFactor(0).setDepth(800);
    this.hudTitle = hudText(this, 12, 7, '远征', 'h2', { background: null });
    this.hudPlace = hudText(this, SCREEN_W - 12, 7, '', 'body', {
      background: null, color: UI.text.muted, origin: [1, 0],
    });
    this.hudQuest = hudText(this, SCREEN_W - 12, 20, '', 'body', {
      background: null, color: UI.text.body, origin: [1, 0],
    });
    this.hudHint = hudText(this, SCREEN_W / 2, SCREEN_H - 18, 'WASD / 方向键 移动 · E 采集 / 交谈 · ESC 回小屋', 'body', {
      background: UI.hud.bgSoft, color: UI.text.foot, origin: [0.5, 0],
    });
  }

  updateHud() {
    if (!this.hudTitle) return;
    const s = this.screens[this.screenIndex] || this.screens[0];
    const q = this.world.quest;
    this.hudTitle.setText('远征 · ' + s.name);
    this.hudPlace.setText(s.weatherName + ' · 第 ' + (this.screenIndex + 1) + '/' + this.screens.length + ' 屏');
    let qs = QUEST_LABEL[this.save.quest] || QUEST_LABEL.none;
    if (this.save.quest === 'active') {
      qs = '采集 ' + Math.min(this.save.herbs, q.need) + '/' + q.need;
      if (this.save.herbs >= q.need) qs = '可交付 ' + q.need + '/' + q.need;
    }
    this.hudQuest.setText('草药 ' + this.save.herbs + ' · ' + qs);
    this.hudQuest.setColor(this.save.quest === 'done' ? UI.text.gold : UI.text.body);
    this.hudHint.setText(this.hudHintText());
  }

  hudHintText() {
    if (this.gathering) return '正在采集 · 移动会打断';
    if (this.save.quest === 'active' && this.save.herbs >= this.world.quest.need) {
      return '草药够了 · 去找村医阿杏交付 · ESC 回小屋';
    }
    return 'WASD / 方向键 移动 · E 采集 / 交谈 · ESC 回小屋';
  }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = hudText(this, SCREEN_W / 2, 44, msg, 'body', {
      background: UI.hud.bgSoft, color: UI.text.heading, origin: [0.5, 0], depth: 900,
    });
    this.time.delayedCall(1700, () => {
      if (this.toastT) this.toastT.destroy();
      this.toastT = null;
    });
  }

  banner(text) {
    if (this.bannerT) this.bannerT.destroy();
    this.bannerT = hudText(this, SCREEN_W / 2, 82, text, 'h1', {
      background: UI.hud.bgSoft, color: UI.text.heading, origin: [0.5, 0], depth: 850,
    }).setAlpha(0);
    this.tweens.add({
      targets: this.bannerT, alpha: 1, duration: 220, yoyo: true, hold: 700,
      onComplete: () => { if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; } },
    });
  }

  /* ---------- 屏幕切换 ---------- */
  applyScreen(index, initial = false) {
    const s = this.screens[index];
    if (!s) return;
    this.screenIndex = index;
    this.screenId = s.id;
    this.weather = s.weather;
    this.rain.stop();
    this.dust.stop();
    this.dustVeil.setAlpha(0);
    this.worldVig.setAlpha(s.weather === 'dust' ? 0.62 : (s.biome === 'bamboo' ? 0.2 : 0.12));
    if (s.weather === 'rain') this.rain.start();
    if (s.weather === 'dust') {
      this.dust.start();
      this.dustVeil.setAlpha(0.13);
    }
    if (!this.save.visited.includes(s.id)) {
      this.save = patchWorldSave({ visited: [...this.save.visited, s.id] });
    }
    this.updateHud();
    if (!initial) this.banner(s.name);
  }

  /* ---------- 输入 ---------- */
  bindInput() {
    this.keys = this.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      w: 'W', a: 'A', s: 'S', d: 'D',
    });
    this.input.keyboard.on('keydown-E', () => this.onAction());
    this.input.keyboard.on('keydown-ESC', () => this.onEsc());
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (currentlyOver && currentlyOver.length) return;
      if (this.talking || this.panelOpen || this.gathering) return;
      if (pointer.y < 38 || pointer.y > SCREEN_H - 32) return;
      this.pointerTarget = { x: pointer.worldX, y: pointer.worldY };
    });
    this.input.keyboard.on('keydown-W', () => { this.pointerTarget = null; });
    this.input.keyboard.on('keydown-A', () => { this.pointerTarget = null; });
    this.input.keyboard.on('keydown-S', () => { this.pointerTarget = null; });
    this.input.keyboard.on('keydown-D', () => { this.pointerTarget = null; });
  }

  onEsc() {
    if (this.panelOpen) { this.closePanel(); return; }
    if (this.talking) { this.closeTalk(); return; }
    if (this.gathering) { this.cancelGather(); return; }
    this.leave();
  }

  leave() {
    try { this.sound.play('ui', { volume: 0.3 }); } catch (e) {}
    if (!NAV.back()) this.scene.start('title');
  }

  onAction() {
    if (this.talking) { this.advanceTalk(); return; }
    if (this.panelOpen || this.gathering) return;
    const herb = this.nearestHerb();
    if (herb && this.distPlayer(herb.x, herb.y) <= 46) {
      this.startGather(herb);
      return;
    }
    if (this.npc && this.distPlayer(this.npc.x, this.npc.y) <= 52) {
      this.interactNpc();
      return;
    }
    this.toast('走近草药或村医再按 E');
  }

  /* ---------- 移动与每帧 ---------- */
  update(time, delta) {
    if (!this.player || !this.screens) return;
    if (this.panelOpen) return;
    if (this.talking) return;
    if (this.gathering) {
      this.updateGather(delta);
      return;
    }
    let vx = 0;
    let vy = 0;
    const k = this.keys;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;

    if (vx || vy) {
      this.pointerTarget = null;
      this.movePlayer(vx, vy, delta);
    } else if (this.pointerTarget) {
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d <= 4) {
        this.pointerTarget = null;
        this.playIdle();
      } else {
        this.movePlayer(dx / d, dy / d, delta);
      }
    } else {
      this.playIdle();
    }

    this.player.shadow.x = this.player.x;
    this.player.shadow.y = this.player.y - 1;
    this.updatePrompts();
    this.updateRespawns(time);
    const next = Math.max(0, Math.min(this.screens.length - 1, Math.floor((this.player.x + 2) / SCREEN_W)));
    if (next !== this.screenIndex) this.applyScreen(next);
  }

  movePlayer(vx, vy, delta) {
    const d = Math.hypot(vx, vy) || 1;
    const mul = this.weather === 'rain' ? 1.05 : 1;
    const step = SPEED * mul * (delta / 1000);
    const nx = vx / d;
    const ny = vy / d;
    this.player.x = Phaser.Math.Clamp(this.player.x + nx * step, 8, this.screens.length * SCREEN_W - 8);
    this.player.y = Phaser.Math.Clamp(this.player.y + ny * step, 42, SCREEN_H - 16);
    if (Math.abs(nx) > Math.abs(ny)) this.face = nx < 0 ? 'left' : 'right';
    else this.face = ny < 0 ? 'up' : 'down';
    const anim = 'p-' + this.charSkin + '-walk-' + this.face;
    if (this.player.anims.currentAnim?.key !== anim) this.player.anims.play(anim, true);
  }

  playIdle() {
    const anim = 'p-' + this.charSkin + '-idle-' + this.face;
    if (this.player.anims.currentAnim?.key !== anim) this.player.anims.play(anim, true);
  }

  distPlayer(x, y) {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y - 14, x, y - 8);
  }

  nearestHerb() {
    let best = null;
    let bestD = 999;
    this.herbs.forEach((n) => {
      if (!n.active) return;
      const d = this.distPlayer(n.x, n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    return bestD <= 80 ? best : null;
  }

  updatePrompts() {
    const busy = this.talking || this.panelOpen || !!this.gathering;
    this.herbs.forEach((n) => n.prompt.setVisible(false));
    if (this.npc) this.npc.prompt.setVisible(false);
    if (busy) return;
    const herb = this.nearestHerb();
    if (herb && this.distPlayer(herb.x, herb.y) <= 46) herb.prompt.setVisible(true);
    else if (this.npc && this.distPlayer(this.npc.x, this.npc.y) <= 52) this.npc.prompt.setVisible(true);
  }

  updateRespawns(time) {
    this.herbs.forEach((n) => {
      if (!n.active && n.respawnAt && time >= n.respawnAt) {
        n.active = true;
        n.respawnAt = 0;
        n.sprite.setVisible(true);
        n.glow.setVisible(true);
        this.toast('一丛草药重新长成了');
      }
    });
  }

  /* ---------- 采集读条 ---------- */
  startGather(node) {
    if (!node || !node.active || this.gathering) return;
    this.pointerTarget = null;
    this.playIdle();
    const x = node.x;
    const y = node.y - 34;
    this.gathering = { node, t: 0, dur: GATHER_MS };
    this.gatherBg = this.add.rectangle(x - 20, y, 40, 5, 0x000000, 0.8)
      .setOrigin(0).setDepth(50);
    this.gatherFill = this.add.rectangle(x - 19, y + 1, 0, 3, UI.world.herbGold, 1)
      .setOrigin(0).setDepth(51);
    this.gatherLabel = this.add.text(x, y - 4, '采集中', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
      backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 1).setDepth(52);
    node.prompt.setVisible(false);
    this.updateHud();
  }

  updateGather(delta) {
    const g = this.gathering;
    if (!g) return;
    const k = this.keys;
    if (k.left.isDown || k.a.isDown || k.right.isDown || k.d.isDown
      || k.up.isDown || k.w.isDown || k.down.isDown || k.s.isDown) {
      this.cancelGather('移动打断采集');
      return;
    }
    g.t += delta;
    this.gatherFill.width = 38 * Math.min(1, g.t / g.dur);
    if (g.t >= g.dur) this.completeGather();
  }

  cancelGather(msg) {
    const g = this.gathering;
    this.gathering = null;
    this.destroyGather();
    if (msg) this.toast(msg);
    this.updateHud();
    if (g) this.updatePrompts();
  }

  destroyGather() {
    [this.gatherBg, this.gatherFill, this.gatherLabel].forEach((o) => { if (o) o.destroy(); });
    this.gatherBg = this.gatherFill = this.gatherLabel = null;
  }

  completeGather() {
    const g = this.gathering;
    if (!g) return;
    const node = g.node;
    this.gathering = null;
    this.destroyGather();
    node.active = false;
    node.respawnAt = this.time.now + RESPAWN_MS;
    node.sprite.setVisible(false);
    node.glow.setVisible(false);
    this.save = patchWorldSave({ herbs: this.save.herbs + this.world.quest.yield });
    this.toast('采到草药 ×' + this.world.quest.yield);
    this.updateHud();
    if (this.save.quest === 'active' && this.save.herbs >= this.world.quest.need) {
      this.toast('草药够了 · 去找村医阿杏交付');
    }
  }

  /* ---------- 村医与委托 ---------- */
  interactNpc() {
    if (!this.npc) return;
    const q = this.world.quest;
    if (this.save.quest === 'done') {
      this.say(this.npc.name, ['这些草药救了不少人。', '路上小心，星火会记得你。']);
      return;
    }
    if (this.save.quest === 'none') {
      this.say(this.npc.name, [
        '你来得正好。村东的草药被雨泡坏了不少。',
        '能帮我采 5 株回来吗？草原上还有三丛。',
      ], () => {
        this.save = patchWorldSave({ quest: 'active' });
        this.updateHud();
        this.toast('委托已接受 · 草药五株');
      });
      return;
    }
    if (this.save.herbs < q.need) {
      this.say(this.npc.name, [
        '还差 ' + (q.need - this.save.herbs) + ' 株。',
        '草原上那三丛，采完会重新长出来。',
      ]);
      return;
    }
    this.showQuestChoice();
  }

  showQuestChoice() {
    const q = this.world.quest;
    const W = Math.min(390, SCREEN_W - 40);
    const H = 154;
    const x = SCREEN_W / 2 - W / 2;
    const y = SCREEN_H / 2 - H / 2;
    this.panelOpen = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const dim = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    p.add(makeText(this, 14, 12, '委托 · ' + q.name, 'h2', { color: UI.text.heading }));
    p.add(makeText(this, 14, 34, '阿杏需要 ' + q.need + ' 株草药，当前 ' + this.save.herbs + ' 株。', 'body', {
      color: UI.text.body,
    }));
    const rows = [
      ['交付 ' + q.need + ' 株草药', () => this.deliverQuest()],
      ['再等等', () => this.closePanel()],
    ].map(([label, cb], i) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 68 + i * 32, w: W - 32, h: 26,
        accent: i === 0 ? UI.color.gold : UI.color.lineMuted,
        depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      card.add(makeText(this, 12, 7, label, 'body', {
        color: i === 0 ? UI.text.primary : UI.text.muted,
      }));
      return { card };
    });
    this.panel = { dim, panel: p, rows };
  }

  deliverQuest() {
    const q = this.world.quest;
    const herbs = Math.max(0, this.save.herbs - q.need);
    this.save = patchWorldSave({
      herbs,
      quest: 'done',
      tokens: this.save.tokens + q.rewardTokens,
    });
    this.closePanel();
    this.updateHud();
    this.toast('委托完成 · 星火碎片 +' + q.rewardTokens);
    this.say(this.npc.name, ['这些草药够了。', '收下这枚星火碎片吧，路上用得上。']);
  }

  closePanel() {
    if (this.panel) {
      this.panel.rows.forEach((r) => destroyRow(r));
      this.panel.dim.destroy();
      this.panel.panel.container.destroy();
      this.panel = null;
    }
    this.panelOpen = false;
    if (this.hudHint) this.hudHint.setVisible(true);
    this.updatePrompts();
  }

  /* ---------- 对话 ---------- */
  say(name, lines, onDone) {
    if (this.talking) return;
    this.talking = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const arr = Array.isArray(lines) ? lines : [String(lines)];
    const W = SCREEN_W - 48;
    const H = 96;
    const x = 24;
    const y = SCREEN_H - H - 26;
    this.talkHit = this.add.rectangle(0, 0, SCREEN_W, SCREEN_H, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(96).setInteractive();
    this.talkHit.on('pointerdown', () => this.advanceTalk());
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    const nameT = makeText(this, 12, 9, name, 'h2', { color: UI.text.heading });
    const body = makeText(this, 12, 30, '', 'body', {
      color: UI.text.body, wordWrap: { width: W - 24 }, lineSpacing: 4,
    });
    const hint = makeText(this, W - 12, H - 12, 'E / 点击 继续', 'caption', {
      color: UI.text.muted, origin: [1, 1],
    });
    p.add(nameT, body, hint);
    this.talk = { p, name, lines: arr, index: 0, body, onDone, hit: this.talkHit };
    this.showTalkLine();
    this.updatePrompts();
    this.updateHud();
  }

  showTalkLine() {
    if (!this.talk) return;
    this.talk.body.setText(this.talk.lines[this.talk.index] || '');
  }

  advanceTalk() {
    if (!this.talk) return;
    if (this.talk.index < this.talk.lines.length - 1) {
      this.talk.index += 1;
      this.showTalkLine();
      return;
    }
    const cb = this.talk.onDone;
    this.closeTalk();
    if (cb) cb();
  }

  closeTalk() {
    if (!this.talk) return;
    this.talk.p.container.destroy();
    if (this.talk.hit) this.talk.hit.destroy();
    this.talk = null;
    this.talking = false;
    if (this.hudHint) this.hudHint.setVisible(!this.panelOpen);
    this.updatePrompts();
    this.updateHud();
  }
}
