/* G3 世界 Boss：霜灯巨鸮 / Frostlantern Owl
 * 3D 像素离线源。雪原 snow-6 的世界 Boss：一只立在雪岩上的巨鸮，
 * 头顶冰枝角、胸口悬一盏旧雪灯，翅缘挂霜；正面像一座守夜的灯台，
 * 侧面保留鸮的圆头与钩喙，和苔背巨兽 / 雾竹蜃 / 沙海蜃的剪影分开。
 * pose: idle / charge / roar；同一 seed 保持冰枝、羽毛与灯光一致。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g3-frost-owl', name: '霜灯巨鸮', seed: 306,
  build(seed, pose = 'idle') {
    const P = [
      0x04070b, 0x0a1119, 0x111d2a, 0x1a2c3c, 0x274354, 0x365b6b,
      0x4b7583, 0x67939d, 0x8db5ba, 0xb8d5d5, 0xdcebec, 0xf4fbfa,
      0x24424f, 0x356472, 0x4d8792, 0x78b9bd, 0xb4e7df,
      0x2b4f6e, 0x3e7496, 0x67a9c7, 0xa5e8f2,
      0x5d3a22, 0x8a5a30, 0xc39254, 0xe6bd76,
      0x7a2e2a, 0xb34a3c, 0xe58f73,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const featherDark = { r: [3, 4] };
    const feather = { r: [5, 6] };
    const featherMid = { r: [7, 8] };
    const featherLight = { r: [9, 10] };
    const snow = { r: [10, 11] };
    const wingDark = { r: [12, 13] };
    const wing = { r: [14, 15] };
    const wingLight = { r: [15, 16] };
    const iceDark = { r: [17, 18] };
    const ice = { r: [18, 19], em: true };
    const iceLight = { r: [20, 21], em: true };
    const wood = { r: [22, 23, 24] };
    const gold = { r: [25, 26] };
    const ember = { r: [26, 27], em: true };
    const dark = { r: [0, 1] };
    const charge = pose === 'charge';
    const roar = pose === 'roar';

    const bodyY = charge ? 1.58 : (roar ? 1.98 : 1.82);
    const bodyZ = charge ? 0.10 : 0;
    const headY = charge ? 2.64 : (roar ? 3.18 : 2.96);
    const headZ = charge ? 1.02 : (roar ? 0.72 : 0.82);
    const lean = charge ? 0.28 : 0;

    // 雪岩基座：脚下是一块被霜包住的旧石，Boss 立在上面而不是悬空。
    S.ball([0, 0.18, 0.16], [0.92, 0.18, 0.72], iceDark, { res: 0.030, rd: 0.05 });
    S.ball([0, 0.25, 0.22], [0.74, 0.12, 0.58], snow, { res: 0.024, rd: 0.04 });
    S.box([-0.42, 0.20, 0.52], [0.20, 0.08, 0.18], iceLight, { res: 0.010, rd: 0.02 });

    // 站立的鸮身：下宽上收的胸腹，正面对称，侧面是厚羽球。
    S.ball([0, bodyY, bodyZ], [0.78, 0.96, 0.72], feather, { res: 0.030, rd: 0.06 });
    S.ball([0, bodyY - 0.22, bodyZ + 0.20], [0.66, 0.72, 0.62], featherMid, { res: 0.028, rd: 0.05 });
    S.ball([0, bodyY + 0.26, bodyZ - 0.04], [0.58, 0.28, 0.52], featherLight, { res: 0.020, rd: 0.04 });
    // 胸羽的层叠：三道浅色横线，1x 也能读出鸟胸。
    for (const yy of [-0.30, -0.06, 0.18]) {
      S.ball([0, bodyY + yy, bodyZ + 0.52], [0.44 - Math.abs(yy) * 0.20, 0.10, 0.24], featherLight, { res: 0.012, rd: 0.02 });
    }

    // 双爪：短而厚的羽腿，钩趾扣住雪岩。
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.34, bodyY - 0.54, bodyZ + 0.02], [sx * 0.38, 0.54, bodyZ + 0.12], [sx * 0.38, 0.26, bodyZ + 0.16]], 0.19, 0.11, featherDark, { res: 0.018 });
      S.box([sx * 0.38, 0.13, bodyZ + 0.20], [0.26, 0.09, 0.30], wood, { res: 0.012, rd: 0.02 });
      for (const zz of [-0.12, 0.02, 0.16]) {
        S.tube([[sx * 0.38, 0.14, bodyZ + 0.20 + zz], [sx * 0.40, 0.07, bodyZ + 0.30 + zz], [sx * 0.44, 0.02, bodyZ + 0.36 + zz]], 0.055, 0.018, iceLight, { res: 0.006 });
      }
    }

    // 双翼：收在身侧时像两片厚披风；roar 展开，charge 后掠。
    for (const sx of [-1, 1]) {
      const spread = roar ? 0.42 : (charge ? -0.22 : 0.10);
      const wingTipX = sx * (0.92 + spread * 0.9);
      const wingTipY = bodyY - (roar ? 0.05 : 0.42);
      S.tube([
        [sx * 0.58, bodyY + 0.32, bodyZ - 0.22],
        [sx * (0.86 + spread), bodyY + 0.10, bodyZ - 0.10],
        [wingTipX, wingTipY, bodyZ + 0.22],
      ], 0.30, 0.09, wing, { res: 0.022 });
      // 翼缘的霜羽：三根长羽，让轮廓像结霜的刀刃。
      for (let i = 0; i < 3; i += 1) {
        const t = i / 2;
        S.tube([
          [sx * (0.62 + t * 0.14), bodyY + 0.14, bodyZ - 0.22 + t * 0.10],
          [sx * (0.90 + spread * 0.75), bodyY - 0.16 - t * 0.10, bodyZ - 0.02 + t * 0.14],
          [sx * (1.04 + spread), bodyY - 0.42 - t * 0.08, bodyZ + 0.20 + t * 0.18],
        ], 0.07, 0.018, i === 2 ? iceLight : wingLight, { res: 0.008 });
      }
      S.ball([sx * (1.02 + spread), bodyY - 0.38, bodyZ + 0.22], [0.07, 0.05, 0.05], ice, { res: 0.006 });
    }

    // 尾羽：三根短而宽的霜羽向后撑，让侧面有“鸟尾”而不是圆球。
    for (const [dx, dz, len] of [[-0.18, -0.54, 0.34], [0, -0.62, 0.46], [0.18, -0.54, 0.34]]) {
      S.tube([[dx * 0.2, bodyY - 0.42, bodyZ + dz], [dx * 0.65, bodyY - 0.62, bodyZ + dz - len * 0.6], [dx * 0.9, bodyY - 0.78, bodyZ + dz - len]], 0.12, 0.035, wingDark, { res: 0.012 });
      S.ball([dx * 0.9, bodyY - 0.78, bodyZ + dz - len], [0.06, 0.06, 0.045], snow, { res: 0.006 });
    }

    // 圆头 + 面盘：鸮的识别核心，两只冰蓝眼嵌在深色面盘里。
    S.ball([0, headY, bodyZ + headZ], [0.66, 0.56, 0.56], feather, { res: 0.028, rd: 0.05 });
    // 侧脸颊的白色面盘边：侧向转身时仍能读出“鸮脸”，不再只剩一颗圆头。
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.56, headY + 0.02, bodyZ + headZ + 0.19], [0.13, 0.22, 0.16], snow, { res: 0.012, rd: 0.02 });
      S.ball([sx * 0.61, headY + 0.04, bodyZ + headZ + 0.21], [0.060, 0.060, 0.045], iceLight, { res: 0.005 });
    }
    // 大面盘：白色前半球扣在圆头上，侧面看是圆润的面罩，不是一片薄板。
    S.ball([0, headY + 0.04, bodyZ + headZ + 0.20], [0.62, 0.54, 0.46], featherDark, { res: 0.018, rd: 0.04 });
    S.ball([0, headY + 0.04, bodyZ + headZ + 0.30], [0.58, 0.50, 0.42], snow, { res: 0.016, rd: 0.03 });
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.235, headY + 0.03, bodyZ + headZ + 0.62], [0.190, 0.175, 0.12], dark, { res: 0.010, rd: 0.02 });
      S.ball([sx * 0.235, headY + 0.03, bodyZ + headZ + 0.72], [0.115, 0.105, 0.05], iceLight, { res: 0.006 });
      S.ball([sx * 0.235, headY + 0.03, bodyZ + headZ + 0.755], [0.022, 0.040, 0.011], dark, { res: 0.004 });
    }
    // 钩喙：短、弯、骨色，roar 时向下张开；放在面盘中心前方。
    S.box([0, headY - 0.18, bodyZ + headZ + 0.68], [0.16, 0.10, 0.10], gold, { res: 0.008, rd: 0.02 });
    S.tube([[0, headY - 0.22, bodyZ + headZ + 0.72], [0, headY - 0.31, bodyZ + headZ + 0.78], [0, headY - 0.23, bodyZ + headZ + 0.84]], 0.06, 0.014, gold, { res: 0.006 });
    if (roar) {
      S.ball([0, headY - 0.36, bodyZ + headZ + 0.72], [0.13, 0.07, 0.10], ember, { res: 0.008 });
    }

    // 耳羽与冰枝角：从头顶向后上方分叉，是雪原 Boss 最远的轮廓线。
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.34, headY + 0.36, bodyZ + headZ - 0.02], [sx * 0.42, headY + 0.60, bodyZ + headZ - 0.08], [sx * 0.50, headY + 0.78, bodyZ + headZ - 0.02]], 0.10, 0.02, featherDark, { res: 0.010 });
      // 冰枝：三叉，枝梢有小冰晶。
      S.tube([[sx * 0.26, headY + 0.48, bodyZ + headZ - 0.04], [sx * 0.42, headY + 0.82, bodyZ + headZ - 0.18], [sx * 0.54, headY + 1.08, bodyZ + headZ - 0.24]], 0.06, 0.015, ice, { res: 0.008 });
      S.tube([[sx * 0.40, headY + 0.78, bodyZ + headZ - 0.16], [sx * 0.28, headY + 1.00, bodyZ + headZ - 0.08], [sx * 0.24, headY + 1.16, bodyZ + headZ - 0.02]], 0.045, 0.012, iceLight, { res: 0.006 });
      S.tube([[sx * 0.46, headY + 0.88, bodyZ + headZ - 0.20], [sx * 0.66, headY + 1.04, bodyZ + headZ - 0.28], [sx * 0.74, headY + 1.18, bodyZ + headZ - 0.22]], 0.04, 0.010, iceLight, { res: 0.006 });
      S.ball([sx * 0.54, headY + 1.10, bodyZ + headZ - 0.24], [0.035, 0.05, 0.03], snow, { res: 0.004 });
    }

    // 胸前的旧雪灯：木质灯框 + 冰蓝灯芯 + 金火，是“守夜”的叙事焦点。
    S.tube([[0, bodyY + 0.43, bodyZ + 0.52], [0, bodyY + 0.30, bodyZ + 0.62], [0, bodyY + 0.12, bodyZ + 0.56]], 0.035, 0.018, wood, { res: 0.006 });
    S.ball([0, bodyY + 0.02, bodyZ + 0.62], [0.24, 0.28, 0.17], wood, { res: 0.012, rd: 0.02 });
    S.ball([0, bodyY + 0.02, bodyZ + 0.70], [0.17, 0.21, 0.10], ice, { res: 0.010, rd: 0.02 });
    S.ball([0, bodyY + 0.02, bodyZ + 0.75], [0.09, 0.13, 0.06], gold, { res: 0.008, rd: 0.02 });
    S.ball([0, bodyY - 0.02, bodyZ + 0.78], [0.045, 0.075, 0.025], ember, { res: 0.005 });
    for (const sx of [-1, 1]) {
      S.box([sx * 0.18, bodyY + 0.02, bodyZ + 0.69], [0.04, 0.30, 0.04], gold, { res: 0.005 });
    }

    // 背脊雪披：从后颈落到背中，背面和侧面都有一道白脊。
    S.ball([0, bodyY + 0.30, bodyZ - 0.46], [0.54, 0.18, 0.30], snow, { res: 0.018, rd: 0.03 });
    S.ball([0, bodyY + 0.14, bodyZ - 0.52], [0.38, 0.12, 0.20], featherLight, { res: 0.014, rd: 0.02 });

    // 肩背积雪：几片压扁的雪块，让正面有“雪原守夜者”的白帽。
    for (const [x, y, z, sx, sy, sz] of [
      [-0.40, bodyY + 0.44, bodyZ + 0.04, 0.34, 0.10, 0.28],
      [0.36, bodyY + 0.44, bodyZ + 0.02, 0.30, 0.09, 0.26],
      [0.00, bodyY + 0.48, bodyZ - 0.30, 0.26, 0.08, 0.22],
    ]) {
      S.ball([x, y, z], [sx, sy, sz], snow, { res: 0.016, rd: 0.03 });
    }

    // 脚下霜尘：只在脚踝附近，不飘。
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.50, 0.16, bodyZ + 0.40], [0.26, 0.05, 0.18], { r: [16, 17], em: true }, { res: 0.007 });
    }

    S.bake();

    return B.finish({
      cam: { target: [0, 1.82, 0.12], dist: 10.0 + lean * 0.2, pitch: 0.11, yaw: 0.08 },
      detail: 22, dither: 0.16, radius: 4,
    });
  },
});
