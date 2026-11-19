/* Ninja Adventure 原型 —— 阶段 A：角色移动 + 四向动画 + 触屏/键鼠双输入
 * 依赖：Phaser 3（由构建脚本内联），素材走 window.ASSET_DATA 内联的 data URI
 * 逻辑高度固定 360，逻辑宽度随窗口比例在 360–720 之间自适应
 */
(() => {
  const WORLD = 1024;
  const SPEED = 96;
  const MINOR = 360;      // 短边固定 360 逻辑像素
  const MAX_MAJOR = 800;  // 长边上限，避免超宽/超高屏把视野拉得太散

  // 横屏：高固定 360，宽随比例；竖屏：宽固定 360，高随比例
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

  class Boot extends Phaser.Scene {
    constructor() { super('boot'); }

    preload() {
      const A = window.ASSET_DATA;
      this.load.spritesheet('walk', A.walk, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('idle', A.idle, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('attack', A.attack, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet('field', A.field, { frameWidth: 16, frameHeight: 16 });
    }

    create() {
      // Walk.png 为 4 列 × 4 行：列是方向（0 下 / 1 上 / 2 左 / 3 右），行是帧
      // 帧索引 = 行 * 4 + 列，所以某方向的序列是 [col, col+4, col+8, col+12]
      const cols = { down: 0, up: 1, left: 2, right: 3 };
      Object.entries(cols).forEach(([dir, col]) => {
        this.anims.create({
          key: 'walk-' + dir,
          frames: [0, 4, 8, 12].map((row) => ({ key: 'walk', frame: row + col })),
          frameRate: 9,
          repeat: -1,
        });
      });
      this.anims.create({
        key: 'idle-down',
        frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1,
      });
      this.scene.start('play');
    }
  }

  class Play extends Phaser.Scene {
    constructor() { super('play'); }

    create() {
      // 地面：TilesetField 第 3 行第 3 列（纯色草皮），frame 索引 = 行 * 5 + 列
      this.add.tileSprite(0, 0, WORLD, WORLD, 'field', 18).setOrigin(0);

      // 少量沙土斑块作地形参照
      const rnd = new Phaser.Math.RandomDataGenerator(['ninja-demo']);
      for (let i = 0; i < 26; i++) {
        const x = rnd.between(64, WORLD - 64);
        const y = rnd.between(64, WORLD - 64);
        this.add.image(x, y, 'field', 3).setAlpha(0.55);
      }

      this.player = this.add.sprite(WORLD / 2, WORLD / 2, 'walk', 0).setScale(2);
      this.player.play('walk-down');
      this.facing = 'down';
      this.dnd = { down: 'idle-down', up: 'walk-up', left: 'walk-left', right: 'walk-right' };

      this.cameras.main.setBounds(0, 0, WORLD, WORLD);
      this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
      this.cameras.main.setRoundPixels(true);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D');

      // 触屏摇杆：按下记原点，拖动出方向
      this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
      this.ring = this.add.graphics().setScrollFactor(0).setDepth(10);

      this.input.on('pointerdown', (p) => {
        this.stick = { active: true, ox: p.x, oy: p.y, dx: 0, dy: 0 };
      });
      this.input.on('pointermove', (p) => {
        if (!this.stick.active) return;
        const v = new Phaser.Math.Vector2(p.x - this.stick.ox, p.y - this.stick.oy);
        const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
        const len = v.length();
        if (len > 4) {
          // 先取长度再归一化：若先 normalize，长度恒为 1，输出会被削成噪声
          const mag = Math.min(len, limit);
          v.normalize();
          this.stick.dx = (v.x * mag) / limit;
          this.stick.dy = (v.y * mag) / limit;
        } else {
          this.stick.dx = 0;
          this.stick.dy = 0;
        }
      });
      const release = () => { this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 }; this.ring.clear(); };
      this.input.on('pointerup', release);
      this.input.on('pointerupoutside', release);

      // HUD
      this.hud = this.add.text(8, 8, '', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#00000066',
        padding: { x: 6, y: 4 },
      }).setScrollFactor(0).setDepth(20);
      this.hint = this.add.text(8, this.scale.height - 22, '移动：WASD / 方向键 / 拖拽屏幕', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '10px',
        color: '#ffffffcc',
      }).setScrollFactor(0).setDepth(20);

      // 旋转或改窗口大小时，HUD 跟着重新贴边
      this.scale.on('resize', (gs) => {
        this.hint.setPosition(8, gs.height - 22);
      });

      this.input.addPointer(1); // 支持双指
    }

    update(_t, dt) {
      const d = new Phaser.Math.Vector2(0, 0);

      if (this.cursors.left.isDown || this.keys.A.isDown) d.x -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) d.x += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) d.y -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) d.y += 1;

      if (this.stick.active) {
        d.x += this.stick.dx;
        d.y += this.stick.dy;
      }

      if (d.lengthSq() > 0.01) {
        d.normalize();
        const step = SPEED * (dt / 1000);
        this.player.x = Phaser.Math.Clamp(this.player.x + d.x * step, 8, WORLD - 8);
        this.player.y = Phaser.Math.Clamp(this.player.y + d.y * step, 8, WORLD - 8);

        const dir = Math.abs(d.x) > Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : (d.y > 0 ? 'down' : 'up');
        if (dir !== this.facing) {
          this.facing = dir;
          this.player.play('walk-' + dir);
        } else if (!this.player.anims.isPlaying) {
          this.player.play('walk-' + dir);
        }
      } else if (this.player.anims.isPlaying) {
        this.player.stop();
        // 停下时用该朝向的第 0 帧，避免抽帧跳动
        const col = { down: 0, up: 1, left: 2, right: 3 }[this.facing];
        this.player.setFrame(col);
        if (this.facing === 'down') this.player.play('idle-down');
      }

      // 摇杆可视化
      this.ring.clear();
      if (this.stick.active) {
        const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
        this.ring.lineStyle(1, 0xffffff, 0.35).strokeCircle(this.stick.ox, this.stick.oy, limit);
        this.ring.fillStyle(0xffffff, 0.5).fillCircle(this.stick.ox + this.stick.dx * limit, this.stick.oy + this.stick.dy * limit, 4);
      }

      window.__state = {
        facing: this.facing,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        stick: this.stick.active,
        dx: +this.stick.dx.toFixed(2),
        dy: +this.stick.dy.toFixed(2),
        w: this.scale.width,
        h: this.scale.height,
      };

      this.hud.setText(
        'facing ' + this.facing + '  |  ' + this.scale.width + 'x' + this.scale.height + '  |  fps ' + Math.round(this.game.loop.actualFps)
      );
    }
  }

  window.addEventListener('load', () => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: S.W,
      height: S.H,
      parent: 'game',
      backgroundColor: '#2f3b2a',
      pixelArt: true,
      roundPixels: true,
      // 用 NONE 自己控制呈现：Phaser 的 FIT 在改尺寸后仍按旧比例算展示尺寸
      scale: {
        mode: Phaser.Scale.NONE,
        width: S.W,
        height: S.H,
      },
      scene: [Boot, Play],
    });

    // 把 canvas 按 contain 方式铺进窗口，保持整数像素感
    function present() {
      const g = game.scale;
      const k = Math.min(window.innerWidth / g.width, window.innerHeight / g.height);
      game.canvas.style.width = Math.round(g.width * k) + 'px';
      game.canvas.style.height = Math.round(g.height * k) + 'px';
    }
    present();

    // 窗口尺寸变化（含手机横竖屏切换）时重算逻辑分辨率
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
