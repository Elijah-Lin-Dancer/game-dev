/* Ninja Adventure 原型 B —— P1 战斗手感
 * 阶段 A（已验收）：移动 + 四向动画 + 双端输入 + 短边固定 360 自适应
 * 阶段 B（本次）：碰撞、挥砍、受击硬直、击退、血量、追击怪、音效
 *
 * 素材约定（已实测，见 ADR 0003）：
 *   Walk.png / Beast.png = 4 列 × 4 行，列是方向（下/上/左/右），行是帧
 *   某方向的序列 = [col, col+4, col+8, col+12]
 */
(() => {
  const WORLD = 1024;
  const SPEED = 96;
  const MINOR = 360;
  const MAX_MAJOR = 800;

  const CFG = {
    maxHp: 20,          // 5 颗心 × 4 档，对应 heart.png 的 5 帧
    touchDmg: 3,        // 怪碰一下掉 3/20，心掉 3/4
    playerDmg: 3,       // 挥砍一下 3 点
    enemyHp: 6,         // 两刀一只
    atkCd: 300,         // 攻击冷却 ms
    atkReach: 30,       // 判定中心到角色的距离
    atkBox: [34, 30],   // 判定框宽高
    enemySpeed: 46,
    chaseRange: 300,
    iFrame: 700,        // 玩家受击无敌 ms
    hitStop: 55,        // 命中冻结 ms
    maxAlive: 4,
    respawn: 2200,
  };

  const DIRS = { down: 0, up: 1, left: 2, right: 3 };
  const ANGLE = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 };
  const VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

  function logicalSize() {
    const a = window.innerWidth / window.innerHeight;
    if (a >= 1) {
      const H = MINOR;
      return { W: Math.min(MAX_MAJOR, Math.max(MINOR, Math.round(H * a))), H };
    }
    const W = MINOR;
    return { W, H: Math.min(MAX_MAJOR, Math.max(MINOR, Math.round(W / a))) };
  }
  const S = logicalSize();

  /* 某方向的 4 帧序列 */
  const dirFrames = (col) => [0, 4, 8, 12].map((row) => ({ key: null, frame: row + col }));

  class Boot extends Phaser.Scene {
    constructor() { super('boot'); }

    preload() {
      const A = window.ASSET_DATA;
      this.load.spritesheet('walk', A.walk, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('idle', A.idle, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('field', A.field, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('beast', A.beast, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('slash', A.slash, { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet('heart', A.heart, { frameWidth: 16, frameHeight: 16 });
      Object.entries(A.sfx).forEach(([k, uri]) => this.load.audio(k, uri));
    }

    create() {
      Object.entries(DIRS).forEach(([dir, col]) => {
        this.anims.create({
          key: 'walk-' + dir,
          frames: [0, 4, 8, 12].map((row) => ({ key: 'walk', frame: row + col })),
          frameRate: 9, repeat: -1,
        });
        this.anims.create({
          key: 'beast-' + dir,
          frames: [0, 4, 8, 12].map((row) => ({ key: 'beast', frame: row + col })),
          frameRate: 8, repeat: -1,
        });
      });
      this.anims.create({
        key: 'idle-down',
        frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
        frameRate: 5, repeat: -1,
      });
      this.anims.create({
        key: 'slash-play',
        frames: this.anims.generateFrameNumbers('slash', { start: 0, end: 3 }),
        frameRate: 13, repeat: 0,
      });
      this.scene.start('play');
    }
  }

  class Play extends Phaser.Scene {
    constructor() { super('play'); }

    create() {
      this.cameras.main.setBackgroundColor('#2f3b2a');
      this.add.tileSprite(0, 0, WORLD, WORLD, 'field', 18).setOrigin(0);

      const rnd = new Phaser.Math.RandomDataGenerator(['ninja-p1']);
      for (let i = 0; i < 26; i++) {
        this.add.image(rnd.between(64, WORLD - 64), rnd.between(64, WORLD - 64), 'field', 3).setAlpha(0.55);
      }

      this.player = this.add.sprite(WORLD / 2, WORLD / 2, 'walk', 0).setScale(2).setDepth(2);
      this.player.play('walk-down');
      this.facing = 'down';
      this.hp = CFG.maxHp;
      this.iframe = 0;
      this.atkAt = -9999;
      this.freeze = 0;
      this.score = 0;
      this.dead = false;
      this.press = null;

      this.cameras.main.setBounds(0, 0, WORLD, WORLD);
      this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
      this.cameras.main.setRoundPixels(true);

      // 敌人
      this.enemies = [];
      this.spawnTimer = 0;
      this.spawnEnemy();
      this.spawnEnemy();
      this.spawnEnemy();

      // 音效
      this.sfx = {};
      ['sword', 'hit', 'hurt', 'kill', 'gameover'].forEach((k) => {
        this.sfx[k] = this.sound.add(k, { volume: k === 'gameover' ? 0.45 : 0.5 });
      });

      // HUD
      this.hearts = [];
      for (let i = 0; i < 5; i++) {
        this.hearts.push(this.add.image(10 + i * 18, 10, 'heart', 4)
          .setScrollFactor(0).setOrigin(0).setScale(1.1).setDepth(20));
      }
      this.scoreText = this.add.text(10, 28, '', {
        fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#ffffff',
        backgroundColor: '#00000066', padding: { x: 5, y: 3 },
      }).setScrollFactor(0).setDepth(20);
      this.hint = this.add.text(10, S.H - 20, 'WASD 移动 · 空格/点击 挥砍 · 拖拽移动', {
        fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: '#ffffffcc',
      }).setScrollFactor(0).setDepth(20);
      this.scale.on('resize', (gs) => this.hint.setPosition(10, gs.height - 20));

      // 输入
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D');
      this.input.keyboard.on('keydown-SPACE', () => this.attack());
      this.input.keyboard.on('keydown-J', () => this.attack());
      this.input.keyboard.on('keydown-K', () => this.attack());
      this.input.keyboard.on('keydown-R', () => { if (this.dead) this.restart(); });

      this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
      this.ring = this.add.graphics().setScrollFactor(0).setDepth(30);

      this.input.on('pointerdown', (p) => {
        if (this.dead) { this.restart(); return; }
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
          this.stick.dx = 0;
          this.stick.dy = 0;
        }
      });
      const release = (p) => {
        // 轻点 = 挥砍；拖动 = 移动
        if (this.press && !this.dead) {
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

    spawnEnemy() {
      const p = this.player;
      let x = 0, y = 0;
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Phaser.Math.Between(180, 320);
        x = Phaser.Math.Clamp(p.x + Math.cos(a) * d, 32, WORLD - 32);
        y = Phaser.Math.Clamp(p.y + Math.sin(a) * d, 32, WORLD - 32);
        if (Phaser.Math.Distance.Between(x, y, p.x, p.y) > 150) break;
      }
      const spr = this.add.sprite(x, y, 'beast', 0).setScale(2).setDepth(2).setAlpha(0);
      spr.play('beast-down');
      this.tweens.add({ targets: spr, alpha: 1, duration: 260 });
      this.enemies.push({ spr, hp: CFG.enemyHp, kb: new Phaser.Math.Vector2(), flash: 0, cd: 0, dir: 'down' });
    }

    attack() {
      if (this.dead || this.time.now - this.atkAt < CFG.atkCd) return;
      this.atkAt = this.time.now;

      this.sfx.sword.play({ rate: Phaser.Math.FloatBetween(0.95, 1.08) });

      // 挥砍特效
      const v = VEC[this.facing];
      // 圆弧质心不在贴图中心，绕中心转会把特效甩到角色外面：
      // 直接以角色为圆心、贴图居中，弧线扫过角色四周
      const fx = this.add.sprite(
        this.player.x + v[0] * 14,
        this.player.y + v[1] * 12,
        'slash'
      ).setDepth(120).setRotation(ANGLE[this.facing] + Math.PI / 4).setScale(2.2);
      fx.play('slash-play');
      // 只放大不淡出：淡出会让白弧在浅绿草地上几乎看不见
      this.tweens.add({
        targets: fx, scale: 2.9, duration: 210, ease: 'Quad.easeOut',
        onComplete: () => fx.destroy(),
      });

      // 身体前冲一点，给动作一点重量
      this.tweens.add({
        targets: this.player,
        x: this.player.x + v[0] * 4, y: this.player.y + v[1] * 4,
        duration: 90, yoyo: true, ease: 'Quad.easeOut',
      });
      this.tweens.add({
        targets: this.player, scaleX: 2.3, scaleY: 1.75, duration: 70, yoyo: true,
      });

      // 判定
      const cx = this.player.x + v[0] * CFG.atkReach;
      const cy = this.player.y + v[1] * CFG.atkReach;
      const hw = CFG.atkBox[0] / 2, hh = CFG.atkBox[1] / 2;
      let hitAny = false;

      this.enemies.forEach((e) => {
        if (e.hp <= 0) return;
        const dx = Math.abs(e.spr.x - cx);
        const dy = Math.abs(e.spr.y - cy);
        if (dx > hw + 12 || dy > hh + 12) return; // 加怪物半宽

        hitAny = true;
        e.hp -= CFG.playerDmg;
        e.flash = 70;
        e.kb.set(v[0] * 120, v[1] * 120);
        e.spr.setAlpha(0.45);

        if (e.hp <= 0) {
          this.killEnemy(e);
        }
      });

      if (hitAny) {
        this.freeze = CFG.hitStop;
        this.cameras.main.shake(80, 0.006);
        this.sfx.hit.play({ rate: Phaser.Math.FloatBetween(0.9, 1.12) });
        // 火花：tintFill 会把整块矩形涂满，用几何图形代替
        const spark = this.add.circle(cx, cy, 7, 0xffffff, 1).setDepth(130);
        this.tweens.add({
          targets: spark, scale: 2.4, alpha: 0, duration: 160,
          ease: 'Quad.easeOut', onComplete: () => spark.destroy(),
        });
      }
    }

    killEnemy(e) {
      e.hp = 0;
      this.score += 1;
      this.sfx.kill.play({ rate: Phaser.Math.FloatBetween(0.95, 1.1) });
      this.tweens.add({
        targets: e.spr, alpha: 0, scaleX: 2.6, scaleY: 0.4, y: e.spr.y - 8,
        duration: 240, ease: 'Quad.easeOut',
      });
    }

    hurtPlayer(fromX, fromY) {
      if (this.iframe > 0 || this.dead) return;
      this.hp = Math.max(0, this.hp - CFG.touchDmg);
      this.iframe = CFG.iFrame;

      this.sfx.hurt.play({ rate: Phaser.Math.FloatBetween(0.9, 1.1) });
      this.cameras.main.shake(180, 0.012);
      const ring = this.add.circle(this.player.x, this.player.y, 10, 0xff5555, 0.85).setDepth(130);
      this.tweens.add({
        targets: ring, scale: 2.2, alpha: 0, duration: 220,
        ease: 'Quad.easeOut', onComplete: () => ring.destroy(),
      });

      // 击退
      const dir = new Phaser.Math.Vector2(this.player.x - fromX, this.player.y - fromY);
      if (dir.lengthSq() < 0.01) dir.set(0, 1);
      dir.normalize().scale(150);
      this.player.kb = dir;

      if (this.hp <= 0) this.playerDie();
    }

    playerDie() {
      this.dead = true;
      this.player.play('walk-down');
      this.sfx.gameover.play();
      this.player.setAlpha(0.7);

      const shade = this.add.rectangle(0, 0, S.W, S.H, 0x000000, 0.55)
        .setOrigin(0).setScrollFactor(0).setDepth(40);
      const t1 = this.add.text(S.W / 2, S.H / 2 - 16, '你倒了', {
        fontFamily: 'ui-monospace, monospace', fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(41);
      const t2 = this.add.text(S.W / 2, S.H / 2 + 12, '点击屏幕或按 R 重开', {
        fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#ffffffaa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(41);
      this.deadUi = [shade, t1, t2];
    }

    restart() {
      this.scene.restart();
    }

    update(_t, dt) {
      const d = new Phaser.Math.Vector2(0, 0);

      if (!this.dead) {
        if (this.cursors.left.isDown || this.keys.A.isDown) d.x -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) d.x += 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) d.y -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) d.y += 1;
        d.x += this.stick.dx;
        d.y += this.stick.dy;
      }

      // 命中冻结：只停角色的推进，画面抖动与快照仍在播
      if (this.freeze > 0) {
        this.freeze -= dt;
        this.updateHud();
        return;
      }

      this.player.setDepth(2 + this.player.y / 1000);

      // 玩家移动 + 击退衰减
      if (this.player.kb) {
        this.player.x += this.player.kb.x * (dt / 1000);
        this.player.y += this.player.kb.y * (dt / 1000);
        this.player.kb.scale(Math.pow(0.0025, dt / 1000));
        if (this.player.kb.lengthSq() < 1) this.player.kb = null;
      }

      if (!this.dead && d.lengthSq() > 0.01) {
        d.normalize();
        const step = SPEED * (1 - Math.max(0, this.atkAt + 160 - this.time.now) / 160 * 0.35) * (dt / 1000);
        this.player.x = Phaser.Math.Clamp(this.player.x + d.x * step, 8, WORLD - 8);
        this.player.y = Phaser.Math.Clamp(this.player.y + d.y * step, 8, WORLD - 8);
        const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : (d.y > 0 ? 'down' : 'up');
        if (dir !== this.facing) {
          this.facing = dir;
          this.player.play('walk-' + dir);
        } else if (!this.player.anims.isPlaying) {
          this.player.play('walk-' + dir);
        }
      } else if (!this.dead && this.player.anims.isPlaying) {
        this.player.stop();
        this.player.setFrame(DIRS[this.facing]);
        if (this.facing === 'down') this.player.play('idle-down');
      }

      // 无敌闪烁
      if (this.iframe > 0) {
        this.iframe -= dt;
        this.player.setAlpha(this.iframe > 0 && Math.floor(this.iframe / 90) % 2 ? 0.45 : 1);
        if (this.iframe <= 0) this.player.setAlpha(1);
      }

      // 敌人
      this.enemies.forEach((e) => {
        if (e.hp <= 0) { return; }
        const s = e.spr;
        if (e.flash > 0) {
          e.flash -= dt;
          if (e.flash <= 0) s.setAlpha(1);
        }

        // 击退
        if (e.kb.lengthSq() > 1) {
          s.x += e.kb.x * (dt / 1000);
          s.y += e.kb.y * (dt / 1000);
          e.kb.scale(Math.pow(0.002, dt / 1000));
        } else {
          const dist = Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y);
          if (dist < CFG.chaseRange && !this.dead) {
            const dirv = new Phaser.Math.Vector2(this.player.x - s.x, this.player.y - s.y).normalize();
            s.x += dirv.x * CFG.enemySpeed * (dt / 1000);
            s.y += dirv.y * CFG.enemySpeed * (dt / 1000);
            const dir = Math.abs(dirv.x) > Math.abs(dirv.y)
              ? (dirv.x > 0 ? 'right' : 'left') : (dirv.y > 0 ? 'down' : 'up');
            if (dir !== e.dir) { e.dir = dir; s.play('beast-' + dir); }
            else if (!s.anims.isPlaying) s.play('beast-' + dir);
          } else if (s.anims.isPlaying) {
            s.stop();
            s.setFrame(DIRS[e.dir]);
          }
        }

        s.x = Phaser.Math.Clamp(s.x, 8, WORLD - 8);
        s.y = Phaser.Math.Clamp(s.y, 8, WORLD - 8);
        s.setDepth(2 + s.y / 1000);

        // 接触伤害
        if (!this.dead && Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < 24) {
          this.hurtPlayer(s.x, s.y);
        }
      });

      // 简单分离力：怪之间保持不重叠
      for (let i = 0; i < this.enemies.length; i++) {
        const a = this.enemies[i];
        if (a.hp <= 0) continue;
        for (let j = i + 1; j < this.enemies.length; j++) {
          const b = this.enemies[j];
          if (b.hp <= 0) continue;
          const dx = b.spr.x - a.spr.x;
          const dy = b.spr.y - a.spr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 400 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = (20 - d) * 0.5;
            const nx = dx / d, ny = dy / d;
            a.spr.x -= nx * push; a.spr.y -= ny * push;
            b.spr.x += nx * push; b.spr.y += ny * push;
          }
        }
      }

      // 清尸体与补怪
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.hp <= 0 && e.spr.alpha <= 0.02) {
          e.spr.destroy();
          this.enemies.splice(i, 1);
        }
      }
      const alive = this.enemies.filter((e) => e.hp > 0).length;
      if (!this.dead && alive < CFG.maxAlive) {
        this.spawnTimer += dt;
        if (this.spawnTimer > CFG.respawn) {
          this.spawnTimer = 0;
          if (this.enemies.length < 8) this.spawnEnemy();
        }
      }

      // 摇杆可视化
      this.ring.clear();
      if (this.stick.active) {
        const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
        this.ring.lineStyle(1, 0xffffff, 0.3).strokeCircle(this.stick.ox, this.stick.oy, limit);
        this.ring.fillStyle(0xffffff, 0.45)
          .fillCircle(this.stick.ox + this.stick.dx * limit, this.stick.oy + this.stick.dy * limit, 4);
      }

      this.updateHud();
    }

    updateHud() {
      const full = Math.floor(this.hp / 4);
      const part = this.hp % 4; // 0–3 对应 heart 帧 0–3
      this.hearts.forEach((h, i) => {
        const remain = this.hp - i * 4;
        h.setFrame(Math.max(0, Math.min(4, remain)));
      });
      this.scoreText.setText('击杀 ' + this.score + '   HP ' + this.hp + '/' + CFG.maxHp);

      window.__state = {
        hp: this.hp, score: this.score, dead: this.dead,
        enemies: this.enemies.filter((e) => e.hp > 0).map((e) => ({ hp: e.hp, x: Math.round(e.spr.x), y: Math.round(e.spr.y) })),
        facing: this.facing, px: Math.round(this.player.x), py: Math.round(this.player.y),
        freeze: Math.round(this.freeze), w: this.scale.width, h: this.scale.height,
      };
    }
  }

  window.addEventListener('load', () => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: S.W, height: S.H,
      parent: 'game',
      backgroundColor: '#2f3b2a',
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.NONE, width: S.W, height: S.H },
      // WebAudio 无法解码 data URI 音频，强制走 HTML5 Audio 后端（可播 base64 mp3）
      audio: { disableWebAudio: true },
      scene: [Boot, Play],
    });

    function present() {
      const g = game.scale;
      const k = Math.min(window.innerWidth / g.width, window.innerHeight / g.height);
      game.canvas.style.width = Math.round(g.width * k) + 'px';
      game.canvas.style.height = Math.round(g.height * k) + 'px';
    }
    present();

    let timer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = logicalSize();
        game.scale.resize(next.W, next.H);
        present();
      }, 120);
    });
  });
})();
