/* G3 世界 Boss：沙海蜃 / Sandsea Mirage
 * 3D 像素离线源。沙漠群系 desert-6 的世界 Boss：一只贴地游走的沙海活体，
 * 宽薄的沙帆翼、玻璃质沙壳、四只短桨足、长鞭尾；它不驮龛，也不背苔，
 * 轮廓要和苔背巨兽的“小丘”、雾竹蜃的“高龛”明确分开。
 * pose: idle / charge / roar；同一 seed 保持沙壳、玻璃刺与青焰眼一致。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g3-sand-mirage', name: '沙海蜃', seed: 303,
  build(seed, pose = 'idle') {
    const P = [
      0x050505, 0x0c0b08, 0x15130d, 0x1e1b12, 0x2a2517, 0x39321f,
      0x4a4028, 0x5e5032, 0x776540, 0x917d51, 0xac9666, 0xc8b27c,
      0xe2cea0, 0x2a2016, 0x3e2c1d, 0x5a3d25,
      0x17534f, 0x2a8177, 0x4cc3a5, 0x92ffd0,
      0x9a6b35, 0xc99348, 0xf1c56b,
      0x742b26, 0xa94233,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const sandDark = { r: [3, 4] };
    const sandMid = { r: [5, 6] };
    const sandLight = { r: [8, 9] };
    const sandPale = { r: [10, 11] };
    const bone = { r: [11, 12] };
    const glass = { r: [13, 14] };
    const glassLight = { r: [15, 16] };
    const tealDark = { r: [17, 18] };
    const teal = { r: [18, 19], em: true };
    const gold = { r: [20, 21] };
    const goldLight = { r: [22] };
    const red = { r: [23, 24] };
    const dark = { r: [0, 1] };
    const charge = pose === 'charge';
    const roar = pose === 'roar';

    const bodyY = charge ? 0.64 : (roar ? 0.86 : 0.72);
    const bodyZ = charge ? -0.08 : 0;
    const headY = charge ? 0.62 : (roar ? 0.98 : 0.76);
    const headZ = charge ? 1.18 : (roar ? 1.34 : 1.26);
    const stride = charge ? 0.20 : 0;

    // 低而宽的主躯干：沙壳 + 深色腹甲，宽度接近体长的一半。
    S.ball([0, bodyY, bodyZ], [0.90, 0.38, 1.18], sandMid, { res: 0.030, rd: 0.06 });
    S.ball([0, bodyY + 0.16, bodyZ - 0.14], [0.76, 0.28, 0.96], sandLight, { res: 0.025, rd: 0.05 });
    S.ball([0, bodyY - 0.18, bodyZ + 0.08], [0.78, 0.22, 0.94], sandDark, { res: 0.025, rd: 0.05 });

    // 侧翼：两片后掠的沙帆翼，正面看成宽大的“沙蛾”，侧面只留薄翼缘。
    for (const sx of [-1, 1]) {
      S.tube([
        [sx * 0.48, bodyY + 0.08, bodyZ + 0.22],
        [sx * 1.08, bodyY - 0.04, bodyZ - 0.06],
        [sx * 1.48, bodyY - 0.12, bodyZ - 0.38],
      ], 0.25, 0.055, sandLight, { res: 0.020 });
      S.tube([
        [sx * 0.48, bodyY - 0.04, bodyZ + 0.34],
        [sx * 1.16, bodyY - 0.18, bodyZ + 0.02],
        [sx * 1.60, bodyY - 0.22, bodyZ - 0.30],
      ], 0.10, 0.018, sandPale, { res: 0.012 });
      // 翼缘玻璃刺：侧视一眼能认出是沙海活体，不是一块沙丘。
      S.tube([[sx * 1.02, bodyY - 0.05, bodyZ - 0.12], [sx * 1.40, bodyY - 0.14, bodyZ - 0.48]], 0.05, 0.012, glassLight, { res: 0.008 });
    }

    // 四只短桨足：脚底站在 y≈0.12，膝节外翻；charge 前足前探，roar 后足撑起。
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const front = sz > 0;
        const footZ = sz * (front ? 0.72 : 0.70) + (charge && front ? stride : 0);
        const hip = [sx * 0.48, bodyY - 0.02, bodyZ + sz * 0.48];
        const knee = [sx * 0.66, bodyY - 0.30, bodyZ + sz * 0.60 + (charge && front ? stride * 0.5 : 0)];
        const ankle = [sx * 0.60, 0.30, bodyZ + footZ];
        const foot = [sx * 0.58, 0.12, bodyZ + footZ + (front ? 0.10 : 0.02)];
        S.tube([hip, knee, ankle], 0.14, 0.075, sandDark, { res: 0.018 });
        S.ball([sx * 0.66, bodyY - 0.30, bodyZ + sz * 0.60 + (charge && front ? stride * 0.5 : 0)], [0.12, 0.07, 0.12], sandPale, { res: 0.010, rd: 0.02 });
        S.box([foot[0], foot[1], foot[2]], [0.24, 0.10, 0.38], sandMid, { res: 0.012, rd: 0.02 });
        for (const zz of [-0.13, 0, 0.13]) {
          S.box([foot[0] + sx * 0.13, 0.06, foot[2] + zz], [0.09, 0.035, 0.08], glassLight, { res: 0.006 });
        }
      }
    }

    // 背部沙壳：三块覆瓦状沙甲，裂缝透青；中心一枚沙玻璃脊。
    S.ball([0, bodyY + 0.34, bodyZ - 0.18], [0.68, 0.24, 0.74], sandPale, { res: 0.022, rd: 0.05 });
    S.ball([-0.22, bodyY + 0.28, bodyZ + 0.26], [0.40, 0.16, 0.44], sandLight, { res: 0.016, rd: 0.04 });
    S.ball([0.28, bodyY + 0.26, bodyZ - 0.58], [0.36, 0.14, 0.38], sandLight, { res: 0.014, rd: 0.03 });
    for (const [x, z, sx, sz] of [[0, -0.18, 0.10, 0.28], [-0.22, 0.26, 0.06, 0.20], [0.28, -0.58, 0.055, 0.18]]) {
      S.box([x, bodyY + 0.48, bodyZ + z], [sx, 0.035, sz], tealDark, { res: 0.006, rd: 0.01 });
      S.box([x, bodyY + 0.50, bodyZ + z], [sx * 0.55, 0.018, sz * 0.55], teal, { res: 0.004 });
    }

    // 背帆：一道后掠的新月形沙玻璃帆，idle 低伏、charge 压低、roar 张开。
    const finBaseY = bodyY + 0.33;
    const finTop = charge ? 1.66 : (roar ? 2.32 : 1.92);
    const finZ = charge ? -0.40 : (roar ? -0.08 : -0.18);
    const finPts = [
      [0, finBaseY, bodyZ + finZ + 0.56],
      [0, finBaseY + (finTop - finBaseY) * 0.36, bodyZ + finZ + 0.30],
      [0, finBaseY + (finTop - finBaseY) * 0.74, bodyZ + finZ - 0.04],
      [0, finTop, bodyZ + finZ - 0.30],
      [0, finBaseY + (finTop - finBaseY) * 0.60, bodyZ + finZ - 0.58],
      [0, finBaseY + 0.10, bodyZ + finZ - 0.62],
    ];
    S.tube(finPts, 0.14, 0.028, sandPale, { res: 0.012 });
    // 帆膜：沿脊线填薄片，正面 / 背面能读成一条高脊，侧面读成新月。
    for (let i = 0; i < 8; i += 1) {
      const t = i / 7;
      const y = finBaseY + (finTop - finBaseY) * (0.16 + t * 0.78);
      const z = bodyZ + finZ + 0.28 - t * 0.76;
      S.box([0, y, z], [0.07, 0.19, 0.22], i % 2 ? sandLight : sandPale, { res: 0.008, rd: 0.01 });
    }
    // 帆缘玻璃骨针 + 青焰眼点，给 1x 一条清楚的亮边。
    for (let i = 0; i < 5; i += 1) {
      const t = i / 4;
      const y = finBaseY + (finTop - finBaseY) * (0.40 + t * 0.48);
      const z = bodyZ + finZ + 0.10 - t * 0.52;
      S.box([0, y, z], [0.020, 0.10, 0.12], glassLight, { res: 0.005 });
      if (i === 2) S.box([0, y + 0.10, z], [0.045, 0.045, 0.045], teal, { res: 0.004 });
    }

    // 帆的前后向骨架：让正面不再是一根光桅杆，而是一扇有厚度的沙帆。
    for (const sx of [-1, 1]) {
      S.tube([
        [sx * 0.05, finBaseY + 0.12, bodyZ + finZ + 0.22],
        [sx * 0.18, finBaseY + (finTop - finBaseY) * 0.42, bodyZ + finZ + 0.02],
        [sx * 0.38, finBaseY + (finTop - finBaseY) * 0.78, bodyZ + finZ - 0.28],
      ], 0.060, 0.012, sandLight, { res: 0.008 });
    }

    // 头：宽楔形沙壳，正面两只青焰眼 + 横裂口；侧面保留颊刺与短吻。
    S.ball([0, headY, headZ], [0.62, 0.34, 0.50], sandMid, { res: 0.024, rd: 0.05 });
    S.box([0, headY + 0.20, headZ + 0.26], [0.66, 0.10, 0.28], sandPale, { res: 0.012, rd: 0.03 });
    S.box([0, headY - 0.02, headZ + 0.42], [0.52, 0.16, 0.22], sandPale, { res: 0.012, rd: 0.03 });
    // 两侧颊甲把方盒子脸收成楔形，避免正面读成一块木板。
    for (const sx of [-1, 1]) {
      S.box([sx * 0.34, headY - 0.04, headZ + 0.28], [0.16, 0.13, 0.24], sandDark, { res: 0.010, rd: 0.02 });
      S.box([sx * 0.26, headY - 0.10, headZ + 0.48], [0.13, 0.07, 0.10], sandMid, { res: 0.006, rd: 0.01 });
    }
    S.box([0, headY - 0.15, headZ + 0.55], [0.30, 0.06, 0.10], dark, { res: 0.006, rd: 0.01 });
    for (const tx of [-0.16, -0.08, 0, 0.08, 0.16]) {
      S.box([tx, headY - 0.15, headZ + 0.57], [0.040, 0.060, 0.030], bone, { res: 0.005 });
    }
    if (roar || charge) {
      S.box([0, headY - 0.24, headZ + 0.50], [0.22, 0.06, 0.10], red, { res: 0.006 });
      S.ball([0, headY - 0.17, headZ + 0.47], [0.09, 0.045, 0.06], teal, { res: 0.005 });
    }
    // 两颗向下的小獠牙，打破横条口的“格栅”感。
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.19, headY - 0.08, headZ + 0.56], [sx * 0.21, headY - 0.26, headZ + 0.62]], 0.028, 0.007, bone, { res: 0.006 });
    }
    // 正面双眼：深眼窝 + 青焰瞳 + 金色高光；眉骨压低，避免像蛙。
    for (const sx of [-1, 1]) {
      // 圆形眼窝 + 青焰瞳，去掉方形护目镜感；金色高光只留一粒。
      S.ball([sx * 0.22, headY + 0.17, headZ + 0.51], [0.120, 0.105, 0.055], dark, { res: 0.005 });
      S.ball([sx * 0.22, headY + 0.17, headZ + 0.55], [0.078, 0.068, 0.026], teal, { res: 0.004 });
      S.ball([sx * 0.22 + 0.020, headY + 0.21, headZ + 0.57], [0.018, 0.015, 0.008], goldLight, { res: 0.003 });
      S.box([sx * 0.22, headY + 0.28, headZ + 0.46], [0.22, 0.040, 0.030], sandDark, { res: 0.004 });
      // 侧眼：压成一道竖缝，侧视有眼神，背视不会读成第三只眼。
      S.box([sx * 0.54, headY + 0.05, headZ + 0.18], [0.026, 0.085, 0.030], dark, { res: 0.004 });
      S.box([sx * 0.555, headY + 0.05, headZ + 0.19], [0.012, 0.055, 0.014], tealDark, { res: 0.003 });
    }
    // 额脊：一枚沙玻璃短脊，正面也能把两只眼分开。
    S.box([0, headY + 0.25, headZ + 0.16], [0.10, 0.08, 0.22], sandLight, { res: 0.006, rd: 0.01 });
    S.box([0, headY + 0.31, headZ + 0.08], [0.045, 0.16, 0.10], glassLight, { res: 0.005 });
    // 颊刺 / 须：沙玻璃的短角，侧视靠它和背帆读出“蜃”。
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.46, headY + 0.10, headZ + 0.18], [sx * 0.72, headY + 0.20, headZ - 0.04], [sx * 0.84, headY + 0.28, headZ - 0.22]], 0.055, 0.014, glassLight, { res: 0.008 });
      S.tube([[sx * 0.30, headY - 0.10, headZ + 0.46], [sx * 0.42, headY - 0.22, headZ + 0.66]], 0.034, 0.010, bone, { res: 0.006 });
    }

    // 臀鳍：背面朝镜头时，给体后一条高出沙壳的识别点。
    S.box([0, bodyY + 0.48, bodyZ - 0.88], [0.10, 0.24, 0.18], sandPale, { res: 0.008, rd: 0.02 });
    S.box([0, bodyY + 0.57, bodyZ - 0.90], [0.045, 0.10, 0.10], gold, { res: 0.004 });
    S.box([0, bodyY + 0.60, bodyZ - 0.91], [0.022, 0.055, 0.05], teal, { res: 0.003 });

    // 长鞭尾：三节沙壳 + 玻璃倒刺；背面 / 侧面是主要识别点。
    const tailLift = charge ? 0.04 : (roar ? 0.32 : 0.14);
    const tailPts = [
      [0, bodyY - 0.05, bodyZ - 1.10],
      [0.10, bodyY + 0.02 + tailLift, bodyZ - 1.56],
      [0.26, bodyY + 0.12 + tailLift * 1.1, bodyZ - 2.02],
      [0.48, bodyY + 0.22 + tailLift * 1.25, bodyZ - 2.36],
    ];
    S.tube(tailPts, 0.17, 0.035, sandMid, { res: 0.018 });
    for (let i = 0; i < 3; i += 1) {
      const z = bodyZ - 1.24 - i * 0.36;
      const y = bodyY - 0.02 + tailLift * (0.55 + i * 0.18);
      const x = 0.10 + i * 0.09;
      S.ball([x, y, z], [0.12, 0.075, 0.14], sandPale, { res: 0.010, rd: 0.02 });
      S.box([x + 0.04, y + 0.02, z - 0.10], [0.035, 0.08, 0.10], glassLight, { res: 0.005 });
    }
    S.box([0.48, bodyY + 0.24 + tailLift * 1.25, bodyZ - 2.40], [0.13, 0.07, 0.22], glassLight, { res: 0.006 });
    S.box([0.48, bodyY + 0.18 + tailLift * 1.25, bodyZ - 2.52], [0.035, 0.18, 0.09], gold, { res: 0.004 });
    // 尾端的沙玻璃旗刺：回到背面时，仍有一条高出体表的识别线。
    S.tube([[0.46, bodyY + 0.14 + tailLift * 1.25, bodyZ - 2.30], [0.50, bodyY + 0.42 + tailLift * 1.25, bodyZ - 2.46]], 0.045, 0.012, glassLight, { res: 0.006 });

    // 腹部沙尘 / 热浪：只在脚踝高度，低伏不飘，避免和地面投影打架。
    for (const sx of [-1, 1]) {
      S.box([sx * 0.58, 0.06, 0.78], [0.30, 0.015, 0.34], tealDark, { res: 0.005 });
      S.box([sx * 0.58, 0.08, 0.78], [0.16, 0.010, 0.20], teal, { res: 0.004 });
    }

    // 沙壳上的金色沙尘点：小，但让 1x 的沙漠色不糊成一团。
    for (const [x, y, z] of [[-0.62, 0.38, 0.10], [0.54, 0.32, -0.18], [0.18, 0.46, 0.38], [-0.24, 0.30, -0.62]]) {
      S.ball([x, y, z], [0.035, 0.022, 0.030], goldLight, { res: 0.004 });
    }

    S.bake();

    return B.finish({
      cam: { target: [0, 1.04, 0.0], dist: 10.2, pitch: 0.13, yaw: 0.04 },
      detail: 22, dither: 0.16, radius: 4,
    });
  },
});
