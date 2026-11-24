/* G3 世界 Boss：雾竹蜃 / Mistbamboo Mirage
 * 3D 像素离线源。竹林群系 bamboo-6 的世界 Boss：四足高跷由老竹搭成，
 * 背上驮一座小竹龛，龛窗透青焰，脸是一张旧戏面，竹枝从冠后斜生。
 * 设计重点是“高、瘦、会走的神龛”，和苔背巨兽的低伏小丘剪影完全分开。
 * pose: idle / charge / roar；同一 seed 保持竹节、纸符与青焰一致。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g3-bamboo-mirage', name: '雾竹蜃', seed: 302,
  build(seed, pose = 'idle') {
    const P = [
      0x040706, 0x0a100d, 0x111a15, 0x17251b, 0x203422, 0x2c4a2b,
      0x3d6034, 0x557a3e, 0x71934a, 0x94ad61, 0x2a2118, 0x413324,
      0x5c4830, 0x7d6442, 0xb09a6a, 0xd6c392, 0xeadcb2, 0x8e2f28,
      0xc0503b, 0x1d5a57, 0x2f8a7d, 0x57c7a8, 0x9dffd2, 0xe6b455,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const bambooDark = { r: [3, 4] };
    const bambooMid = { r: [5, 6] };
    const bambooLight = { r: [7, 8] };
    const bambooPale = { r: [8, 9] };
    const oldWood = { r: [10, 11] };
    const oldWoodLight = { r: [12, 13] };
    const parchment = { r: [14, 15] };
    const parchmentLight = { r: [16] };
    const lacquer = { r: [0, 1, 2] };
    const roof = { r: [2, 3] };
    const moss = { r: [5, 9] };
    const talisman = { r: [17, 18] };
    const flameDark = { r: [19, 20] };
    const flame = { r: [20, 21], em: true };
    const flameBright = { r: [21, 22], em: true };
    const gold = { r: [23] };
    const charge = pose === 'charge';
    const roar = pose === 'roar';

    // 高跷腿：四条两段老竹，膝盖外翻，脚是窄铁蹄。
    const bodyY = charge ? 1.92 : (roar ? 2.24 : 2.12);
    const bodyZ = charge ? 0.18 : 0;
    const headY = charge ? 2.86 : (roar ? 3.72 : 3.28);
    const headZ = charge ? 1.18 : (roar ? 0.96 : 1.04);
    const stride = charge ? 0.24 : 0;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const front = sz > 0;
        const footZ = sz * (front ? 0.92 : 0.78) + (charge && front ? stride : 0);
        const hip = [sx * 0.42, bodyY + 0.02, bodyZ + sz * 0.42];
        const knee = [sx * 0.66, bodyY - 0.72, bodyZ + sz * 0.56 + (charge && front ? stride * 0.55 : 0)];
        const ankle = [sx * 0.58, 0.46, bodyZ + footZ];
        const foot = [sx * 0.58, 0.28, bodyZ + footZ + (front ? 0.10 : 0.04)];
        S.tube([hip, knee], 0.17, 0.13, front ? bambooMid : bambooDark, { res: 0.018 });
        S.tube([knee, ankle], 0.14, 0.10, front ? bambooLight : bambooMid, { res: 0.018 });
        // 竹节：膝盖和脚踝各一圈浅色节环，1x 下能读成竹制高跷
        S.ball([sx * 0.66, bodyY - 0.72, bodyZ + sz * 0.56 + (charge && front ? stride * 0.55 : 0)], [0.17, 0.09, 0.17], bambooPale, { res: 0.010, rd: 0.01 });
        S.ball([sx * 0.58, 0.46, bodyZ + footZ], [0.14, 0.08, 0.14], bambooPale, { res: 0.009, rd: 0.01 });
        S.box([foot[0], 0.18, foot[2]], [0.24, 0.10, 0.38], lacquer, { res: 0.012, rd: 0.02 });
        S.box([foot[0], 0.24, foot[2] + (front ? 0.12 : -0.10)], [0.18, 0.06, 0.16], oldWoodLight, { res: 0.008, rd: 0.01 });
      }
    }

    // 腹部是一口旧木箱，外箍竹架；两侧/正面留透青的纸窗。
    S.ball([0, bodyY, bodyZ], [0.50, 0.38, 0.64], oldWood, { res: 0.025, rd: 0.05 });
    S.box([0, bodyY + 0.28, bodyZ], [0.86, 0.07, 0.88], bambooDark, { res: 0.012, rd: 0.02 });
    S.box([0, bodyY - 0.28, bodyZ], [0.80, 0.06, 0.80], bambooDark, { res: 0.012, rd: 0.02 });
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        S.tube([[sx * 0.39, bodyY - 0.32, bodyZ + sz * 0.34], [sx * 0.41, bodyY + 0.34, bodyZ + sz * 0.32]], 0.065, 0.065, bambooMid, { res: 0.012 });
      }
    }
    S.box([0, bodyY - 0.10, bodyZ + 0.64], [0.46, 0.035, 0.028], bambooLight, { res: 0.006 });
    // 纸窗：正面 1，侧面 2；青焰从窗里透出来
    S.box([0, bodyY + 0.02, bodyZ + 0.68], [0.42, 0.17, 0.035], parchment, { res: 0.010 });
    S.box([0, bodyY + 0.02, bodyZ + 0.70], [0.25, 0.09, 0.018], flame, { res: 0.006 });
    S.box([0, bodyY + 0.02, bodyZ + 0.72], [0.12, 0.04, 0.012], flameBright, { res: 0.004 });
    for (const sx of [-1, 1]) {
      S.box([sx * 0.51, bodyY + 0.02, bodyZ], [0.035, 0.17, 0.38], parchment, { res: 0.010 });
      S.box([sx * 0.53, bodyY + 0.02, bodyZ], [0.018, 0.09, 0.22], flame, { res: 0.006 });
      S.box([sx * 0.545, bodyY + 0.02, bodyZ], [0.012, 0.04, 0.12], flameBright, { res: 0.004 });
    }
    // 四角竹柱 + 背龛屋顶（两重檐，顶上有金顶）
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        S.tube([[sx * 0.35, bodyY + 0.30, bodyZ + sz * 0.30], [sx * 0.35, bodyY + 0.70, bodyZ + sz * 0.30]], 0.060, 0.060, bambooLight, { res: 0.012 });
      }
    }
    S.box([0, bodyY + 0.60, bodyZ], [0.88, 0.08, 0.82], roof, { res: 0.014, rd: 0.02 });
    S.box([0, bodyY + 0.69, bodyZ], [0.66, 0.09, 0.60], roof, { res: 0.014, rd: 0.02 });
    S.box([0, bodyY + 0.78, bodyZ], [0.46, 0.08, 0.82], roof, { res: 0.012, rd: 0.02 });
    S.box([0, bodyY + 0.86, bodyZ], [0.56, 0.06, 0.92], roof, { res: 0.010, rd: 0.02 });
    S.ball([0, bodyY + 0.92, bodyZ], [0.09, 0.12, 0.09], gold, { res: 0.008, rd: 0.01 });
    S.tube([[0, bodyY + 0.96, bodyZ], [0, bodyY + 1.06, bodyZ], [0, bodyY + 1.12, bodyZ]], 0.030, 0.010, gold, { res: 0.006 });

    // 颈：一束竹管从龛前伸向戏面
    S.tube([[0, bodyY + 0.24, bodyZ + 0.42], [0, headY - 0.30, headZ - 0.18], [0, headY - 0.06, headZ]], 0.15, 0.10, bambooMid, { res: 0.020 });
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.09, bodyY + 0.25, bodyZ + 0.46], [sx * 0.07, headY - 0.24, headZ - 0.02]], 0.040, 0.030, bambooLight, { res: 0.008 });
    }

    // 戏面：薄木面具 + 厚眉 + 空眼窝 + 青焰眼；下颌可开。
    S.box([0, headY, headZ + 0.08], [0.46, 0.54, 0.18], parchment, { res: 0.016, rd: 0.035 });
    S.ball([0, headY + 0.10, headZ + 0.10], [0.20, 0.24, 0.12], parchmentLight, { res: 0.012, rd: 0.025 });
    S.box([-0.15, headY + 0.22, headZ + 0.21], [0.20, 0.055, 0.05], bambooDark, { res: 0.006, rd: 0.01 });
    S.box([0.15, headY + 0.22, headZ + 0.21], [0.20, 0.055, 0.05], bambooDark, { res: 0.006, rd: 0.01 });
    for (const sx of [-1, 1]) {
      S.box([sx * 0.13, headY + 0.04, headZ + 0.24], [0.155, 0.16, 0.045], lacquer, { res: 0.006, rd: 0.010 });
      S.ball([sx * 0.13, headY + 0.04, headZ + 0.30], [0.050, 0.045, 0.012], flame, { res: 0.004 });
    }
    // 长喙：雾竹蜃不是一头熊，而是一只驮龛的竹喙蜃；侧视靠这根弯喙认轮廓。
    S.tube([[0, headY - 0.08, headZ + 0.18], [0, headY - 0.14, headZ + 0.58], [0, headY - 0.34, headZ + 1.02]], 0.105, 0.032, oldWoodLight, { res: 0.008 });
    S.tube([[0, headY - 0.34, headZ + 1.02], [0, headY - 0.40, headZ + 1.10]], 0.032, 0.014, lacquer, { res: 0.005 });
    S.ball([0, headY - 0.11, headZ + 0.42], [0.060, 0.050, 0.08], bambooPale, { res: 0.005 });
    // 侧脸眼：Boss 默认会朝左看玩家，侧视也要能读出一只青焰眼。

    for (const sx of [-1, 1]) {
      S.box([sx * 0.272, headY + 0.05, headZ + 0.06], [0.060, 0.17, 0.13], lacquer, { res: 0.006, rd: 0.010 });
      S.ball([sx * 0.318, headY + 0.05, headZ + 0.07], [0.050, 0.042, 0.020], flame, { res: 0.004 });
      S.box([sx * 0.247, headY - 0.19, headZ + 0.10], [0.018, 0.045, 0.12], talisman, { res: 0.005 });
      S.box([sx * 0.250, headY - 0.05, headZ + 0.04], [0.020, 0.30, 0.14], talisman, { res: 0.005 });
    }
    // 鼻梁 / 颧骨 / 额头的朱砂符
    S.box([0, headY - 0.06, headZ + 0.29], [0.085, 0.24, 0.035], oldWoodLight, { res: 0.006 });
    S.box([0, headY + 0.36, headZ + 0.22], [0.095, 0.17, 0.018], talisman, { res: 0.005 });
    S.box([0, headY + 0.34, headZ + 0.25], [0.040, 0.08, 0.010], gold, { res: 0.004 });
    // 朱砂颊纹：正面左右各一枚，侧向也能读成戏面
    for (const sx of [-1, 1]) {
      S.box([sx * 0.18, headY - 0.12, headZ + 0.25], [0.065, 0.085, 0.016], talisman, { res: 0.004 });
    }
    // 下颌：roar / charge 时张开，露出青焰喉
    const jawY = headY - (roar ? 0.40 : (charge ? 0.30 : 0.26));
    const jawZ = headZ + (roar ? 0.24 : 0.16);
    S.box([0, jawY, jawZ], [0.36, 0.08, 0.24], oldWood, { res: 0.008, rd: 0.02 });
    S.box([0, jawY + 0.07, jawZ + 0.09], [0.26, 0.05, 0.15], parchment, { res: 0.005 });
    if (roar || charge) {
      S.ball([0, headY - 0.22, headZ + 0.14], [0.16, 0.12, 0.10], flameDark, { res: 0.008 });
      S.ball([0, headY - 0.22, headZ + 0.19], [0.10, 0.07, 0.05], flameBright, { res: 0.006 });
      S.box([-0.13, jawY + 0.08, jawZ + 0.14], [0.045, 0.10, 0.04], talisman, { res: 0.004 });
      S.box([0.13, jawY + 0.08, jawZ + 0.14], [0.045, 0.10, 0.04], talisman, { res: 0.004 });
    }

    // 冠后竹角：主角两枝向上外张，枝梢挂小纸符/竹叶
    for (const sx of [-1, 1]) {
      const ax = sx * 0.22;
      const tipX = sx * (roar ? 0.50 : 0.42);
      const tipY = headY + (roar ? 0.86 : 0.72);
      S.tube([[ax, headY + 0.30, headZ - 0.04], [sx * 0.34, headY + 0.54, headZ - 0.12], [tipX, tipY, headZ - 0.08]], 0.060, 0.020, bambooLight, { res: 0.010 });
      S.tube([[sx * 0.34, headY + 0.54, headZ - 0.12], [sx * 0.58, headY + 0.64, headZ + 0.06], [sx * 0.68, headY + 0.82, headZ + 0.10]], 0.035, 0.012, bambooMid, { res: 0.007 });
      for (const [lx, ly, lz] of [[tipX, tipY, headZ - 0.08], [sx * 0.68, headY + 0.82, headZ + 0.10]]) {
        S.ball([lx, ly + 0.06, lz], [0.055, 0.10, 0.035], bambooPale, { res: 0.006 });
        S.ball([lx + sx * 0.08, ly + 0.02, lz + 0.03], [0.06, 0.028, 0.035], moss, { res: 0.005 });
      }
    }

    // 背龛两侧垂纸符：朱砂与米纸交替，让“雾竹蜃”在 1x 也有暖色点
    for (const [x, z, len, warm] of [
      [-0.56, 0.22, 0.38, true], [-0.54, -0.28, 0.30, false],
      [0.56, 0.16, 0.40, false], [0.54, -0.30, 0.32, true],
      [-0.30, -0.62, 0.30, true], [0.30, -0.58, 0.36, false],
    ]) {
      const y0 = bodyY + 0.74;
      S.tube([[x, y0, bodyZ + z], [x * 1.03, y0 - len * 0.55, bodyZ + z + 0.02], [x * 1.08, y0 - len, bodyZ + z]], 0.036, 0.014, warm ? talisman : parchmentLight, { res: 0.007 });
      S.box([x * 1.08, y0 - len - 0.06, bodyZ + z], [0.05, 0.12, 0.02], warm ? parchmentLight : talisman, { res: 0.004 });
    }

    // 龛下悬灯：从腹底垂下一盏小青灯，正面/侧面都能看到一点青焰。
    S.tube([[0, bodyY - 0.30, bodyZ + 0.30], [0, bodyY - 0.48, bodyZ + 0.36]], 0.028, 0.022, oldWood, { res: 0.006 });
    S.box([0, bodyY - 0.51, bodyZ + 0.37], [0.13, 0.035, 0.11], gold, { res: 0.005 });
    S.ball([0, bodyY - 0.60, bodyZ + 0.38], [0.095, 0.13, 0.085], parchment, { res: 0.007, rd: 0.02 });
    S.ball([0, bodyY - 0.60, bodyZ + 0.40], [0.055, 0.075, 0.035], flame, { res: 0.005 });
    S.box([0, bodyY - 0.69, bodyZ + 0.38], [0.11, 0.030, 0.09], gold, { res: 0.004 });

    // 尾：三根断竹向后拖，末端挂纸铃，给背面识别
    for (const [x, y, z, len] of [[-0.16, bodyY - 0.12, -0.88, 0.34], [0.04, bodyY - 0.02, -0.96, 0.44], [0.22, bodyY - 0.20, -0.84, 0.28]]) {
      S.tube([[x, y, bodyZ + z], [x + 0.02, y - 0.06, bodyZ + z - len * 0.55], [x + 0.08, y - 0.12, bodyZ + z - len]], 0.065, 0.025, bambooDark, { res: 0.008 });
      S.ball([x + 0.08, y - 0.14, bodyZ + z - len], [0.055, 0.055, 0.045], gold, { res: 0.005 });
    }

    // 背脊的竹叶与苔：不是苔背巨兽那种“背甲”，是细碎植被
    for (const [x, y, z, sx, sy, sz] of [
      [-0.44, bodyY + 0.50, -0.28, 0.28, 0.16, 0.32],
      [0.36, bodyY + 0.52, 0.22, 0.30, 0.15, 0.28],
      [0.00, bodyY + 0.55, -0.54, 0.24, 0.13, 0.24],
    ]) {
      S.ball([x, y, bodyZ + z], [sx, sy, sz], moss, { res: 0.020, rd: 0.04 });
      S.ball([x - 0.04, y + 0.05, bodyZ + z], [sx * 0.55, sy * 0.45, sz * 0.55], bambooPale, { res: 0.010, rd: 0.02 });
    }

    // 龛顶后侧的细竹梢：roar 时抬高，charge 时压低后掠
    for (const [x, z, h] of [[-0.30, -0.52, 0.46], [0.28, -0.48, 0.38], [0.00, -0.68, 0.52]]) {
      const baseY = bodyY + 1.02;
      const rise = charge ? h * 0.55 : (roar ? h * 1.05 : h);
      S.tube([[x, baseY, bodyZ + z], [x + (charge ? -0.12 : 0.05), baseY + rise * 0.55, bodyZ + z - 0.05], [x + (charge ? -0.20 : 0.10), baseY + rise, bodyZ + z + 0.04]], 0.045, 0.015, bambooMid, { res: 0.008 });
      S.ball([x + (charge ? -0.20 : 0.10), baseY + rise + 0.03, bodyZ + z + 0.04], [0.055, 0.09, 0.035], bambooPale, { res: 0.006 });
    }

    // 脚底雾：只在脚踝附近，落地后不飘，避免运行时和地面投影打架
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.58, 0.10, 0.94], [0.24, 0.06, 0.15], { r: [21, 22], em: true }, { res: 0.008 });
    }

    S.bake();

    return B.finish({
      cam: { target: [0, 2.02, 0.10], dist: 12.0, pitch: 0.10, yaw: 0.16 },
      detail: 22, dither: 0.16, radius: 4,
    });
  },
});
