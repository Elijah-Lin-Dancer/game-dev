/* G4-2 世界 Boss：沉灯水魇 / Drowned Lantern Wraith
 * 3D 像素离线源。mire-6 归水：一盏沉在沼底的守灯被水草与旧祠木架缠住，
 * 长成一个弓背的灯影。正面是一盏有双绿眼的旧灯，背面是裂开的祠脊和拖尾水草。
 * pose: idle / charge / roar；同一个 seed 保留灯框、铜环和水草走向。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-wraith', name: '沉灯水魇', seed: 405,
  build(seed, pose = 'idle') {
    const P = [
      0x030806, 0x08110d, 0x1b2f24, 0x2c4937, 0x3e5b45, 0x5d7b5e,
      0x667d5b, 0x92a47b, 0xc4cba0, 0xe9e8c4,
      0x211a14, 0x3c2a1d, 0x62452a, 0x91673c, 0xc28f51, 0xe3b86f,
      0x3c9a83, 0x7ce0c5, 0xc7ffe9, 0xf3fff5,
      0x7d2d2a, 0xc24e3d, 0xf08a57, 0xffc47a,
      0x476a57, 0x6d9475,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const bog = { r: [1, 2, 3] };
    const robe = { r: [2, 3, 4, 5] };
    const robeLight = { r: [5, 6, 7] };
    const reed = { r: [6, 7, 8] };
    const pale = { r: [8, 9] };
    const wood = { r: [10, 11, 12] };
    const brass = { r: [12, 13, 14] };
    const gold = { r: [14, 15], em: true };
    const teal = { r: [16, 17], em: true };
    const tealLight = { r: [18, 19], em: true };
    const ember = { r: [20, 21, 22, 23], em: true };
    const dark = { r: [0, 1] };
    const moss = { r: [24, 25] };

    const charge = pose === 'charge';
    const roar = pose === 'roar';
    const lean = charge ? 0.32 : 0;
    const bodyY = charge ? 1.17 : (roar ? 1.36 : 1.27);
    const headY = charge ? 2.02 : (roar ? 2.30 : 2.17);
    const headZ = charge ? 0.24 : 0.18;
    const spread = roar ? 0.46 : (charge ? -0.18 : 0.04);

    // 沼底：半沉的水面、泥台和被水泡白的旧石，给 Boss 一个落点。
    S.ball([0, 0.13, 0.08], [1.20, 0.16, 0.74], bog, { res: 0.032, rd: 0.06 });
    S.ball([0, 0.20, 0.16], [0.82, 0.10, 0.54], moss, { res: 0.022, rd: 0.04 });
    S.ball([0, 0.04, 0.30], [1.16, 0.035, 0.38], pale, { res: 0.018, rd: 0.03 });
    for (const [x, z, w] of [[-0.64, 0.28, 0.24], [0.58, 0.30, 0.20], [0.08, 0.44, 0.16]]) {
      S.box([x, 0.12, z], [w, 0.11, 0.18], { r: [5, 6] }, { res: 0.016, rd: 0.03 });
    }

    // 沉在水里的旧祠基座：只露半截木梁，作为脚边的叙事碎片。
    S.box([-0.70, 0.34, -0.06], [0.22, 0.62, 0.18], wood, { res: 0.022, rd: 0.04 });
    S.box([0.68, 0.30, -0.02], [0.18, 0.48, 0.16], wood, { res: 0.020, rd: 0.04 });
    S.box([0, 0.42, -0.28], [1.10, 0.08, 0.14], moss, { res: 0.020, rd: 0.03 });

    // 身体：从水面长出的宽袍，腰腹被水草缠紧，肩背隆起。
    S.lathe([0, 0.22, 0], 0.58, t => 0.23 + 0.34 * (1 - t), robe, { res: 0.032 });
    S.lathe([0, 0.34, 0.02], 0.48, t => 0.20 + 0.19 * (1 - t), robeLight, { res: 0.028 });
    S.ball([0, bodyY, 0.04], [0.52, 0.52, 0.40], robe, { res: 0.030, rd: 0.06 });
    S.ball([0, bodyY + 0.12, 0.16], [0.42, 0.26, 0.28], robeLight, { res: 0.024, rd: 0.04 });
    S.ball([0, bodyY + 0.34, -0.02], [0.55, 0.17, 0.32], reed, { res: 0.022, rd: 0.04 });
    // 背面裂开的祠脊：roar 时像一排湿木刺竖起。
    S.tube([[0, bodyY + 0.35, -0.18], [0, bodyY + 0.85 + (roar ? 0.12 : 0), -0.30], [0, bodyY + 1.25 + (roar ? 0.18 : 0), -0.20]], 0.10, 0.028, wood, { res: 0.012 });
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.14, bodyY + 0.44, -0.22], [sx * 0.34, bodyY + 0.90, -0.36], [sx * (0.46 + (roar ? 0.10 : 0)), bodyY + 1.18, -0.30]], 0.045, 0.012, moss, { res: 0.009 });
    }

    // 双肩：湿草肩甲，向外翘出几根断苇。
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.36, bodyY + 0.36, 0.02], [0.26, 0.12, 0.22], reed, { res: 0.018, rd: 0.03 });
      for (let i = 0; i < 3; i += 1) {
        const tipX = sx * (0.58 + i * 0.10 + spread * 0.25);
        S.tube([[sx * 0.34, bodyY + 0.36, -0.02], [tipX, bodyY + 0.60 + i * 0.10, -0.12], [tipX + sx * 0.10, bodyY + 0.86 + i * 0.12, -0.06]], 0.032, 0.010, i === 1 ? pale : reed, { res: 0.008 });
      }
    }

    // 手臂：从肩胛垂下，肘部折回，末端是三根湿木爪。
    for (const sx of [-1, 1]) {
      const handX = sx * (0.60 + spread * 0.55);
      const handY = bodyY - (roar ? 0.24 : 0.36);
      const elbowX = sx * (0.52 + spread * 0.25);
      S.tube([
        [sx * 0.38, bodyY + 0.22, 0.08],
        [elbowX, bodyY - 0.12, 0.24],
        [handX, handY, 0.38],
      ], 0.14, 0.075, robe, { res: 0.020 });
      S.ball([handX, handY, 0.38], [0.11, 0.10, 0.09], pale, { res: 0.014 });
      for (let i = 0; i < 3; i += 1) {
        S.tube([
          [handX, handY - 0.02, 0.40],
          [handX + sx * (0.07 + i * 0.02), handY - 0.20 - i * 0.03, 0.48],
          [handX + sx * (0.15 + i * 0.04), handY - 0.32 - i * 0.04, 0.52],
        ], 0.030, 0.008, i === 1 ? teal : wood, { res: 0.007 });
      }
    }

    // 长颈与灯头：灯框是旧祠的挂灯，玻璃里是一张发白的面。
    S.tube([[0, bodyY + 0.38, 0.06], [0, headY - 0.42, headZ], [0, headY - 0.18, headZ + 0.04]], 0.20, 0.13, robe, { res: 0.020 });
    S.box([0, headY, headZ + 0.02], [0.62, 0.66, 0.46], wood, { res: 0.026, rd: 0.05 });
    S.box([0, headY + 0.02, headZ + 0.30], [0.46, 0.48, 0.22], pale, { res: 0.020, rd: 0.03 });
    // 正面灯窗：厚玻璃，略微发光，避免在暗色灯框里读成一张黑脸。
    S.box([0, headY + 0.02, headZ + 0.40], [0.40, 0.40, 0.035], { r: [9], em: true }, { res: 0.010 });
    S.box([0, headY + 0.01, headZ + 0.43], [0.27, 0.28, 0.012], { r: [18, 19], em: true }, { res: 0.006 });
    // 灯框四角的铜柱与顶部风钩，正面 / 侧面都能读出“灯”。
    for (const sx of [-1, 1]) {
      S.box([sx * 0.27, headY, headZ + 0.12], [0.06, 0.70, 0.08], brass, { res: 0.009 });
      // 正面两根细铜条，让灯窗有框，不是一整块发光面。
      S.box([sx * 0.20, headY + 0.01, headZ + 0.45], [0.035, 0.44, 0.020], wood, { res: 0.006 });
    }
    S.box([0, headY + 0.34, headZ + 0.04], [0.70, 0.08, 0.36], wood, { res: 0.014 });
    S.box([0, headY - 0.34, headZ + 0.04], [0.62, 0.07, 0.34], wood, { res: 0.012 });
    S.tube([[0, headY + 0.34, headZ + 0.02], [0, headY + 0.55, headZ - 0.02], [0, headY + 0.70, headZ + 0.04]], 0.035, 0.014, brass, { res: 0.008 });
    // 灯顶的断祠木角：两根向内弯的湿木，让轮廓比一座方灯更高。
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.18, headY + 0.36, headZ + 0.02], [sx * 0.30, headY + 0.66, headZ - 0.06], [sx * 0.42, headY + 0.84, headZ + 0.02]], 0.045, 0.012, wood, { res: 0.009 });
      S.tube([[sx * 0.36, headY + 0.62, headZ - 0.04], [sx * 0.54, headY + 0.72, headZ - 0.14], [sx * 0.64, headY + 0.92, headZ - 0.08]], 0.026, 0.008, moss, { res: 0.007 });
    }
    // 双绿眼与纵向灯芯；roar 时灯芯外露更长。
    // 灯窗中央的一团冷火：不是人脸，而是一盏被水泡久了的灯芯。
    S.box([0, headY + 0.04, headZ + 0.56], [0.16, 0.24, 0.025], dark, { res: 0.006 });
    S.ball([0, headY + 0.05, headZ + 0.60], [0.085, 0.145, 0.020], tealLight, { res: 0.006 });
    S.ball([0, headY + 0.05, headZ + 0.62], [0.038, 0.085, 0.008], gold, { res: 0.004 });
    // 灯窗下沿的暗缝，像一张没有嘴唇的旧面具。
    S.box([0, headY - 0.23, headZ + 0.58], [0.22, 0.026, 0.015], dark, { res: 0.004 });
    // 灯下悬着的小铜牌，给头部一条垂直的轮廓。
    S.tube([[0, headY - 0.32, headZ + 0.34], [0, headY - 0.48, headZ + 0.40]], 0.012, 0.006, gold, { res: 0.005 });
    S.box([0, headY - 0.55, headZ + 0.42], [0.10, 0.13, 0.04], brass, { res: 0.008 });

    // 胸腹前的旧灯芯：一盏小灯，给正面一个暖色焦点。
    S.tube([[0, bodyY + 0.28, 0.26], [0, bodyY + 0.12, 0.34], [0, bodyY - 0.02, 0.32]], 0.024, 0.012, brass, { res: 0.007 });
    S.box([0, bodyY - 0.16, 0.34], [0.22, 0.26, 0.14], wood, { res: 0.012, rd: 0.02 });
    S.box([0, bodyY - 0.16, 0.40], [0.12, 0.16, 0.06], gold, { res: 0.008 });
    S.box([0, bodyY - 0.18, 0.43], [0.055, 0.11, 0.02], tealLight, { res: 0.005 });

    // 腰间的湿草束与拖尾：roar 时向两侧铺开，idle 时收在水里。
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        S.tube([
          [sx * (0.18 + i * 0.10), 0.48, 0.14],
          [sx * (0.34 + i * 0.16 + spread * 0.10), 0.24, 0.30],
          [sx * (0.48 + i * 0.20 + spread * 0.22), 0.08, 0.42],
        ], 0.035, 0.010, i === 2 ? pale : reed, { res: 0.008 });
      }
    }
    // 背后拖出的水草尾，像一条湿透的披风。
    for (const [x, z, len] of [[-0.20, -0.42, 0.44], [0, -0.52, 0.58], [0.20, -0.42, 0.44]]) {
      S.tube([[x * 0.2, bodyY - 0.34, z], [x, bodyY - 0.78, z - len * 0.45], [x * 1.8, bodyY - 1.06, z - len]], 0.06, 0.020, moss, { res: 0.010 });
      S.ball([x * 1.8, bodyY - 1.06, z - len], [0.045, 0.055, 0.035], teal, { res: 0.006 });
    }

    // 水面上的呼吸光：两圈低透明冷光，作为灯影的落水倒影。
    S.ball([0, 0.10, 0.46], [0.78, 0.035, 0.22], { r: [16, 17], em: true }, { res: 0.012 });
    S.ball([0, 0.09, 0.60], [0.48, 0.024, 0.12], { r: [18, 19], em: true }, { res: 0.008 });

    S.bake();
    return B.finish({
      cam: { target: [0, 1.23, 0.12], dist: 7.3, pitch: 0.11, yaw: 0.08 },
      detail: 22, dither: 0.16, radius: 4,
    });
  },
});
