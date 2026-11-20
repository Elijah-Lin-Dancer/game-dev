/* 打击表现层：act 时间轴 + 顿帧/震屏分级
 *
 * 思路借自 pixelfx 的 "act"：一次打击不是一行行手写 tween，而是一串带时间点的 beat。
 * 业务代码只声明「这里发生了一次重击」，表现细节（闪屏多久、火花多大、碎片几片）
 * 全部在这张表里，改手感不用碰战斗逻辑。
 *
 * beat 种类：
 *   stop    顿帧（世界 + 补间 + 动画一起冻住）
 *   shake   震屏（按分级取时长/幅度）
 *   flash   全屏染色闪一下（带透明度，比 camera.flash 可控）
 *   ring    扩散圆环（描边，打击"接触点"用）
 *   spark   实心光点，快速放大消失
 *   debris  碎片：随机方向的方块飞散
 *   pop     给目标精灵一个纵向压扁（命中反馈里"被推了一下"的感觉）
 */
import { CFG } from '../core/config.js';

const F = () => CFG.feel;

export const ACTS = {
  /* 刀砍到东西：轻、短，绝不拖慢刷怪节奏。十字星 + 金环 + 碎片 + 目标压扁 */
  hit: [
    { at: 0, k: 'stop', v: 'stopLight' },
    { at: 0, k: 'pop' },
    { at: 0, k: 'shake', v: 'shakeHit' },
    { at: 0, k: 'star', len: 9, ms: 110, color: 0xffffff, rays: 4 },
    { at: 0, k: 'ring', r: 5, grow: 3.6, ms: 170, color: 0xffe08a, width: 3, fill: 0.14 },
    { at: 0, k: 'debris', n: 6, color: 0xffd479, speed: 160, size: 3, ms: 250 },
  ],
  /* 击杀：碎片更多、环更大，顿帧略长 */
  kill: [
    { at: 0, k: 'stop', v: 'stopKill' },
    { at: 0, k: 'shake', v: 'shakeHit' },
    { at: 0, k: 'star', len: 12, ms: 140, color: 0xffffff, rays: 6 },
    { at: 0, k: 'ring', r: 6, grow: 5, ms: 230, color: 0xffe08a, width: 2 },
    { at: 0, k: 'debris', n: 9, color: 0xffc9a0, speed: 160, size: 2, ms: 300 },
  ],
  /* 玩家挨打：红环 + 红闪 + 重震，最后一下"疼" */
  hurt: [
    { at: 0, k: 'stop', v: 'stopHurt' },
    { at: 0, k: 'shake', v: 'shakeHeavy' },
    { at: 0, k: 'flash', color: 0xff3b30, alpha: 'flashHurt', ms: 130 },
    { at: 0, k: 'ring', r: 9, grow: 2.6, ms: 220, color: 0xff5555, width: 2 },
    { at: 26, k: 'debris', n: 5, color: 0xff6b5a, speed: 110, size: 2, ms: 220 },
  ],
  /* 砸地：最重的一档，半径大、碎片多、整屏压一下 */
  slam: [
    { at: 0, k: 'stop', v: 'stopSlam' },
    { at: 0, k: 'shake', v: 'shakeBoss' },
    { at: 0, k: 'flash', color: 0xff8a3a, alpha: 'flashSlam', ms: 170 },
    { at: 0, k: 'ring', r: 16, grow: 5, ms: 380, color: 0xffd27a, width: 5, fill: 0.22, depth: 600 },
    { at: 0, k: 'ring', r: 12, grow: 4, ms: 300, color: 0xff9a55, width: 3 },
    { at: 0, k: 'debris', n: 14, color: 0xffc070, speed: 230, size: 4, ms: 420 },
    { at: 70, k: 'debris', n: 10, color: 0x7a5530, speed: 150, size: 4, ms: 340 },
    { at: 0, k: 'star', len: 14, ms: 160, color: 0xfff0c0, rays: 8 },
  ],
  /* Boss 变身吼：舞台级停顿，玩家必须看见 */
  roar: [
    { at: 0, k: 'stop', v: 'stopPhase' },
    { at: 0, k: 'shake', v: 'shakeBoss' },
    { at: 0, k: 'flash', color: 0xff4a3a, alpha: 'flashPhase', ms: 200 },
    { at: 0, k: 'ring', r: 12, grow: 6, ms: 420, color: 0xff8a7a, width: 3 },
    { at: 80, k: 'debris', n: 10, color: 0xff9a80, speed: 170, size: 3, ms: 340 },
  ],
  /* 捡东西：只有一点金色碎星，不能打断节奏 */
  pickup: [
    { at: 0, k: 'spark', size: 3, grow: 2, ms: 140, color: 0xffe9a8 },
    { at: 0, k: 'debris', n: 3, color: 0xffd479, speed: 90, size: 2, ms: 200 },
  ],
  /* 强化到手：比拾取更张扬，一圈+多碎片 */
  upgrade: [
    { at: 0, k: 'shake', v: 'shakeLight' },
    { at: 0, k: 'ring', r: 4, grow: 3.6, ms: 240, color: 0xffd479, width: 2 },
    { at: 0, k: 'debris', n: 6, color: 0xffe9a8, speed: 110, size: 2, ms: 260 },
  ],
};

/* 触发一次 act。at>0 的 beat 用 tween 的 delay 排队：
 * 顿帧期间 tween 被整体 pauseAll，时间轴跟着冻住，不会"顿帧没结束特效先播完"。 */
export function playAct(scene, name, x, y, opt = {}) {
  const beats = ACTS[name];
  if (!beats) return;
  for (const b of beats) {
    if (b.at > 0) {
      const holder = { t: 0 };
      scene.tweens.add({
        targets: holder, t: 1, delay: b.at, duration: 1,
        onComplete: () => runBeat(scene, b, x, y, opt),
      });
    } else {
      runBeat(scene, b, x, y, opt);
    }
  }
}

function tier(v) {
  const [ms, mag] = {
    shakeLight: [F().shakeLightMs, F().shakeLightMag],
    shakeHit: [F().shakeHitMs, F().shakeHitMag],
    shakeHeavy: [F().shakeHeavyMs, F().shakeHeavyMag],
    shakeBoss: [F().shakeBossMs, F().shakeBossMag],
  }[v] || [80, 0.006];
  return [ms, mag];
}

function runBeat(scene, b, x, y, opt) {
  switch (b.k) {
    case 'stop':
      scene.hitStop(F()[b.v] || 0);
      break;
    case 'shake': {
      const [ms, mag] = tier(b.v);
      scene.cameras.main.shake(ms, mag);
      break;
    }
    case 'flash': {
      const rect = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, b.color, F()[b.alpha] || 0.15)
        .setOrigin(0).setScrollFactor(0).setDepth(880);
      scene.tweens.add({ targets: rect, alpha: 0, duration: b.ms, ease: 'Quad.easeOut',
        onComplete: () => rect.destroy() });
      break;
    }
    case 'ring': {
      // 用 scale 而不是改 radius：Arc 的 radius 是几何量，缩放更好 tween，也更省重建
      const ring = scene.add.circle(x, y, b.r, b.color, b.fill || 0).setDepth(b.depth || 620);
      ring.setStrokeStyle(b.width || 2, b.color, 0.95);
      scene.tweens.add({ targets: ring, scale: b.grow, alpha: 0, duration: b.ms,
        ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
      break;
    }
    case 'star': {
      // 十字星：几根细长条从接触点向外弹开，比一团白点更像"打到了"
      const rays = b.rays || 4;
      for (let i = 0; i < rays; i++) {
        const ray = scene.add.rectangle(x, y, (b.len || 8) * 2, 2, b.color, 1)
          .setDepth(622).setRotation((Math.PI / rays) * i + (i % 2 ? Math.PI / 4 : 0));
        scene.tweens.add({ targets: ray, scaleX: 1.9, alpha: 0, duration: b.ms || 110,
          ease: 'Quad.easeOut', onComplete: () => ray.destroy() });
      }
      break;
    }
    case 'spark': {
      const sp = scene.add.rectangle(x, y, b.size, b.size, b.color, 1).setDepth(621);
      scene.tweens.add({ targets: sp, scale: b.grow, alpha: 0, duration: b.ms,
        ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
      break;
    }
    case 'debris': {
      for (let i = 0; i < (b.n || 4); i++) {
        const a = Math.random() * Math.PI * 2;
        const d = (b.speed || 120) * (0.55 + Math.random() * 0.6);
        const piece = scene.add.rectangle(x, y, b.size || 2, b.size || 2, b.color, 1).setDepth(622);
        scene.tweens.add({
          targets: piece,
          x: x + Math.cos(a) * d * 0.28, y: y + Math.sin(a) * d * 0.28 - 6,
          alpha: 0, scale: 0.4, duration: (b.ms || 260) * (0.7 + Math.random() * 0.5),
          ease: 'Quad.easeOut', onComplete: () => piece.destroy(),
        });
      }
      break;
    }
    case 'pop': {
      const t = opt.target;
      if (!t) break;
      const bx = t.scaleX, by = t.scaleY;
      scene.tweens.add({ targets: t, scaleX: bx * 1.25, scaleY: by * 0.72, duration: 60,
        yoyo: true, ease: 'Quad.easeOut', onComplete: () => t.setScale(bx, by) });
      break;
    }
    default:
      break;
  }
}

/* 顿帧：冻住世界逻辑与精灵动画，但**不冻特效补间**。
 * 这里踩过一个坑：一开始把 tweens 也 pauseAll，结果顿帧那 130ms 画面定格在
 * "特效刚创建、还没长开"的那一帧——玩家看到的是静止的、几乎没有反馈的画面，
 * 顿帧越长越像卡住。现在精灵定格（打击感靠这个），火花/碎片/闪屏继续播（反馈靠这个）。 */
export function hitStop(scene, ms) {
  if (!ms || ms <= 0) return;
  scene.freeze = Math.max(scene.freeze || 0, ms);
  if (!scene.freezePaused) {
    scene.freezePaused = true;
    if (scene.sys.anims) scene.sys.anims.pauseAll();
  }
}

export function resumeStop(scene) {
  if (!scene.freezePaused) return;
  scene.freezePaused = false;
  if (scene.sys.anims) scene.sys.anims.resumeAll();
}
