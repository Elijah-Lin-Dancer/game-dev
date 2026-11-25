/* G3 世界 Boss：熔心巨像 / Magmaheart Colossus
 * 3D 像素离线源。火山 volcano-6 的世界 Boss：一座从旧熔炉里站起来的
 * 黑曜石巨像，胸口开着炉膛，肩背插着排烟管，双臂垂着铁砧般的拳头。
 * 剪影是“宽肩、短腿、方头”的人形铁炉，和四只兽形 Boss 明确分开。
 * pose: idle / charge / roar；同一 seed 保持黑曜岩、赤金炉心与烟管一致。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g3-magma-colossus', name: '熔心巨像', seed: 307,
  build(seed, pose = 'idle') {
    const P = [
      0x08090a, 0x111316, 0x1b1e22, 0x272b31, 0x343a41, 0x434a52,
      0x555e67, 0x6d7780, 0x8a949c, 0xadb6bb,
      0x2a211d, 0x40322b, 0x5a4539, 0x745646,
      0x8e2d1d, 0xc44722, 0xec6a2e, 0xff9b3d, 0xffd06a,
      0x6b2b1d, 0xa84324, 0xd96b33,
      0x4c555b, 0x67737a, 0x89979d, 0xb3c0c3, 0xd9e2df,
      0x2d2922, 0x5e513f, 0x95815f, 0xc4a878,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const rockDark = { r: [2, 3] };
    const rock = { r: [4, 5] };
    const rockMid = { r: [6, 7] };
    const rockLight = { r: [8, 9] };
    const ironDark = { r: [10, 11] };
    const iron = { r: [11, 12] };
    const ironWarm = { r: [12, 13] };
    const lavaDark = { r: [14, 15], em: true };
    const lava = { r: [15, 16], em: true };
    const lavaBright = { r: [16, 17, 18], em: true };
    const brassDark = { r: [19, 20] };
    const brass = { r: [20, 21] };
    const steelDark = { r: [22, 23] };
    const steel = { r: [23, 24] };
    const steelLight = { r: [25, 26] };
    const soot = { r: [0, 1] };
    const dark = { r: [0, 1] };
    const gold = { r: [27, 28] };
    const charge = pose === 'charge';
    const roar = pose === 'roar';

    const bodyY = charge ? 2.08 : (roar ? 2.34 : 2.22);
    const bodyZ = charge ? 0.22 : 0;
    const headY = charge ? 2.92 : (roar ? 3.28 : 3.12);
    const headZ = charge ? 0.74 : (roar ? 0.22 : 0.38);
    const lean = charge ? 0.42 : 0;

    // 脚：两只宽大的黑曜石靴，短腿把重量压在地上。
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.42, 1.10, bodyZ + 0.10], [sx * 0.54, 0.54, bodyZ + 0.18], [sx * 0.56, 0.24, bodyZ + 0.22]], 0.28, 0.15, rockDark, { res: 0.022 });
      S.ball([sx * 0.56, 0.16, bodyZ + 0.26], [0.36, 0.14, 0.46], rock, { res: 0.018, rd: 0.03 });
      for (const zz of [-0.22, 0, 0.22]) {
        S.box([sx * 0.64, 0.10, bodyZ + 0.26 + zz], [0.20, 0.06, 0.16], ironDark, { res: 0.008, rd: 0.012 });
      }
      // 脚踝的熔缝：一眼能看出是炉渣而不是普通石头。
      S.tube([[sx * 0.40, 0.46, bodyZ + 0.40], [sx * 0.52, 0.35, bodyZ + 0.48], [sx * 0.62, 0.30, bodyZ + 0.56]], 0.035, 0.012, lava, { res: 0.006 });
    }

    // 骨盆 / 腰腹：一块宽厚黑岩，腰部收窄，突出巨像的“铁砧”比例。
    S.ball([0, 1.58, bodyZ - 0.04], [0.82, 0.52, 0.58], rock, { res: 0.028, rd: 0.05 });
    S.ball([0, 1.36, bodyZ + 0.10], [0.58, 0.24, 0.44], ironDark, { res: 0.020, rd: 0.03 });
    S.box([0, 1.64, bodyZ + 0.42], [0.52, 0.20, 0.30], iron, { res: 0.014, rd: 0.02 });

    // 主躯干：宽肩窄腰的倒梯形，胸骨是一整块冷却的熔炉壳。
    S.ball([0, bodyY, bodyZ], [1.04, 0.92, 0.74], rockDark, { res: 0.032, rd: 0.06 });
    S.ball([0, bodyY + 0.20, bodyZ + 0.12], [0.92, 0.68, 0.66], rock, { res: 0.030, rd: 0.05 });
    S.ball([0, bodyY - 0.28, bodyZ + 0.30], [0.70, 0.40, 0.52], rockMid, { res: 0.024, rd: 0.04 });
    // 胸口的炉膛：深色方框里嵌赤金炉心，roar 时更亮更大。
    S.box([0, bodyY + 0.04, bodyZ + 0.66], [0.66, 0.58, 0.12], ironDark, { res: 0.018, rd: 0.02 });
    S.box([0, bodyY + 0.04, bodyZ + 0.74], [0.50, 0.42, 0.09], lavaDark, { res: 0.014, rd: 0.02 });
    S.ball([0, bodyY + 0.04, bodyZ + 0.79], [0.32 + (roar ? 0.10 : 0), 0.28 + (roar ? 0.08 : 0), 0.12], lava, { res: 0.014, rd: 0.02 });
    S.ball([0, bodyY + 0.02, bodyZ + 0.85], [0.15 + (roar ? 0.05 : 0), 0.16, 0.08], lavaBright, { res: 0.008, rd: 0.02 });
    // 炉门的四根铁栅，挡住炉心但不挡住光。
    for (const x of [-0.21, -0.07, 0.07, 0.21]) {
      S.box([x, bodyY + 0.04, bodyZ + 0.84], [0.035, 0.44, 0.035], ironWarm, { res: 0.004 });
    }
    S.box([0, bodyY + 0.30, bodyZ + 0.82], [0.58, 0.06, 0.04], brass, { res: 0.004 });
    S.box([0, bodyY - 0.20, bodyZ + 0.82], [0.58, 0.06, 0.04], brass, { res: 0.004 });

    // 肩：两座熔渣小山，上面架着排烟管和铁刺。
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.82, bodyY + 0.54, bodyZ - 0.02], [0.48, 0.38, 0.48], rock, { res: 0.024, rd: 0.04 });
      S.ball([sx * 0.82, bodyY + 0.72, bodyZ + 0.08], [0.28, 0.16, 0.28], rockLight, { res: 0.016, rd: 0.03 });
      // 肩上的排烟管：两短一长，末端有暗红余烬。
      S.tube([[sx * 0.78, bodyY + 0.72, bodyZ - 0.10], [sx * 0.86, bodyY + 1.04, bodyZ - 0.22], [sx * 0.94, bodyY + 1.24, bodyZ - 0.28]], 0.10, 0.055, ironWarm, { res: 0.012 });
      S.ball([sx * 0.94, bodyY + 1.26, bodyZ - 0.28], [0.075, 0.08, 0.07], lavaDark, { res: 0.008 });
      // 肩铁刺，从侧面看像熔炉的铆钉。
      S.tube([[sx * 0.94, bodyY + 0.44, bodyZ + 0.10], [sx * 1.18, bodyY + 0.64, bodyZ + 0.04], [sx * 1.34, bodyY + 0.82, bodyZ - 0.02]], 0.06, 0.015, iron, { res: 0.008 });
    }

    // 双臂：上臂粗短，前臂是铁砧般的重拳；charge 前伸，roar 展开。
    for (const sx of [-1, 1]) {
      const reach = charge ? 0.24 : (roar ? 0.36 : 0.08);
      const elbow = [sx * (1.00 + reach * 0.4), bodyY - 0.12, bodyZ + 0.34 + reach * 0.5];
      const wrist = [sx * (0.94 + reach * 0.8), bodyY - 0.66, bodyZ + 0.62 + reach];
      S.tube([[sx * 0.80, bodyY + 0.36, bodyZ + 0.06], elbow, wrist], 0.24, 0.14, ironDark, { res: 0.020 });
      // 前臂铁套和金色铆钉
      S.ball([sx * 1.02, bodyY - 0.52, bodyZ + 0.54], [0.25, 0.30, 0.22], ironWarm, { res: 0.016, rd: 0.03 });
      S.box([sx * 1.02, bodyY - 0.54, bodyZ + 0.68], [0.30, 0.12, 0.08], brassDark, { res: 0.008, rd: 0.015 });
      // 拳：方正的熔炉铁砧，比头还大。
      S.box([wrist[0], wrist[1] - 0.18, wrist[2] + 0.06], [0.40, 0.34, 0.38], rockDark, { res: 0.018, rd: 0.03 });
      S.box([wrist[0], wrist[1] - 0.20, wrist[2] + 0.26], [0.34, 0.22, 0.10], iron, { res: 0.010, rd: 0.02 });
      S.box([wrist[0], wrist[1] - 0.36, wrist[2] + 0.20], [0.38, 0.08, 0.24], steelDark, { res: 0.008, rd: 0.015 });
      for (const dx of [-0.12, 0.12]) {
        S.box([wrist[0] + dx, wrist[1] - 0.14, wrist[2] + 0.34], [0.08, 0.08, 0.06], gold, { res: 0.005 });
      }
      // 手腕裂口
      S.tube([[wrist[0] + sx * 0.04, wrist[1] - 0.02, wrist[2] + 0.04], [wrist[0] + sx * 0.12, wrist[1] - 0.14, wrist[2] + 0.12]], 0.035, 0.012, lava, { res: 0.005 });
    }

    // 头：方脸黑岩，两枚金红眼，头顶锯齿冠与两根后掠黑角。
    S.ball([0, headY, bodyZ + headZ], [0.58, 0.48, 0.52], rock, { res: 0.026, rd: 0.04 });
    S.box([0, headY - 0.06, bodyZ + headZ + 0.36], [0.54, 0.34, 0.24], rockDark, { res: 0.014, rd: 0.02 });
    S.box([0, headY + 0.22, bodyZ + headZ + 0.10], [0.58, 0.14, 0.38], ironDark, { res: 0.012, rd: 0.02 });
    for (const sx of [-1, 1]) {
      S.box([sx * 0.20, headY + 0.02, bodyZ + headZ + 0.50], [0.18, 0.11, 0.05], dark, { res: 0.006, rd: 0.01 });
      S.box([sx * 0.20, headY + 0.02, bodyZ + headZ + 0.54], [0.11, 0.085, 0.04], lavaBright, { res: 0.005 });
      // 角：从额角向后上方掠，末端断口发红。
      S.tube([[sx * 0.34, headY + 0.28, bodyZ + headZ - 0.06], [sx * 0.58, headY + 0.56, bodyZ + headZ - 0.28], [sx * 0.76, headY + 0.72, bodyZ + headZ - 0.54]], 0.12, 0.025, ironDark, { res: 0.010 });
      S.ball([sx * 0.76, headY + 0.72, bodyZ + headZ - 0.54], [0.055, 0.06, 0.05], lava, { res: 0.006 });
    }
    // 头顶的锯齿冠：一排矮铁刺，正面像炉盖。
    for (const [x, h] of [[-0.24, 0.18], [-0.08, 0.26], [0.08, 0.24], [0.24, 0.16]]) {
      S.tube([[x, headY + 0.32, bodyZ + headZ + 0.02], [x + 0.02, headY + 0.32 + h * 0.6, bodyZ + headZ - 0.02], [x - 0.02, headY + 0.32 + h, bodyZ + headZ - 0.06]], 0.10, 0.015, iron, { res: 0.008 });
    }
    // 下颌熔缝：roar 时从嘴里喷出金色炉火。
    S.box([0, headY - 0.24, bodyZ + headZ + 0.42], [0.34, 0.07, 0.12], lavaDark, { res: 0.008, rd: 0.012 });
    if (roar) {
      S.ball([0, headY - 0.38, bodyZ + headZ + 0.48], [0.24, 0.12, 0.16], lavaBright, { res: 0.012 });
    } else if (charge) {
      S.ball([0, headY - 0.30, bodyZ + headZ + 0.46], [0.16, 0.07, 0.10], lava, { res: 0.008 });
    }

    // 背部的炉排 / 烟道：背面识别，四向转身时不至于只剩一块黑岩。
    for (const [x, y, z, sx, sy, sz] of [
      [-0.34, bodyY + 0.42, bodyZ - 0.62, 0.28, 0.34, 0.18],
      [0.24, bodyY + 0.52, bodyZ - 0.64, 0.24, 0.28, 0.16],
      [0.00, bodyY - 0.10, bodyZ - 0.68, 0.40, 0.22, 0.12],
    ]) {
      S.ball([x, y, z], [sx, sy, sz], ironDark, { res: 0.018, rd: 0.03 });
      S.box([x, y + 0.18, z - 0.12], [sx * 0.8, 0.05, 0.04], { r: [17, 18], em: true }, { res: 0.005 });
    }
    // 背脊熔缝：一条从颈到尾的断续金线。
    for (const [x, y, z, len] of [[0, bodyY + 0.58, bodyZ - 0.54, 0.24], [0.10, bodyY + 0.24, bodyZ - 0.68, 0.30], [-0.08, bodyY - 0.18, bodyZ - 0.62, 0.22]]) {
      S.tube([[x, y, z], [x + 0.02, y - len * 0.5, z - 0.04], [x - 0.02, y - len, z]], 0.035, 0.012, lava, { res: 0.006 });
    }

    // 地面炉渣：脚边的碎渣与余烬，给 1x 一个暗红底。
    for (const [x, z, sx, sz] of [[-0.68, 0.52, 0.22, 0.16], [0.58, 0.62, 0.18, 0.14], [-0.20, 0.74, 0.14, 0.12]]) {
      S.ball([x, 0.10, bodyZ + z], [sx, 0.06, sz], rockDark, { res: 0.010, rd: 0.02 });
      S.ball([x + 0.04, 0.09, bodyZ + z + 0.02], [0.05, 0.025, 0.04], { r: [16, 18], em: true }, { res: 0.004 });
    }

    S.bake();

    return B.finish({
      cam: { target: [0, 1.88, 0.10], dist: 12.4, pitch: 0.12, yaw: 0.06 },
      detail: 22, dither: 0.16, radius: 4,
    });
  },
});
