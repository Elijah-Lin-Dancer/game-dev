/* G3 世界 Boss：苔背巨兽 / Mossback Behemoth
 * 3D 像素离线源。苔背巨兽是草原群系 field-6 的世界 Boss，四足、低伏、
 * 背甲由湿苔 / 蕨草 / 旧石堆叠而成，正面看像一座会走的小丘。
 * pose: idle / charge / roar；同一 seed 保持外壳、苔斑与骨色一致。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g3-moss-beast', name: '苔背巨兽', seed: 301,
  build(seed, pose = 'idle') {
    const P = [
      0x050706, 0x0b100c, 0x131b14, 0x1b271c, 0x263623, 0x35482c,
      0x4b5e37, 0x64764a, 0x849463, 0xaab77d, 0x2a1b16, 0x3e2720,
      0x58382a, 0x7a5138, 0xa8895d, 0xc9b98d, 0xe7d8ae, 0xffb347,
      0xffe07a, 0x8d3a2e, 0xbd5a3b,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const fur = { r: [10, 11, 12] };
    const furDark = { r: [9, 10] };
    const furLight = { r: [12, 13] };
    const moss = { r: [3, 4, 5, 6] };
    const mossLight = { r: [7, 8, 9] };
    const stone = { r: [12, 13, 14] };
    const bone = { r: [14, 15, 16] };
    const eye = { r: [17, 18], em: true };
    const tongue = { r: [19, 20] };
    const dark = { r: [0, 1] };
    const charge = pose === 'charge';
    const roar = pose === 'roar';
    const bodyY = charge ? 0.74 : (roar ? 0.92 : 0.84);
    const headY = charge ? 0.55 : (roar ? 1.06 : 0.72);
    const headZ = charge ? 1.54 : (roar ? 1.30 : 1.36);
    const stride = charge ? 0.24 : 0;

    // hind/haunch mass
    S.ball([0, bodyY + 0.02, -0.40], [1.02, 0.78, 1.10], fur, { res: 0.035, rd: 0.08 });
    S.ball([0, bodyY + 0.25, 0.05], [1.00, 0.66, 1.16], furDark, { res: 0.035, rd: 0.07 });
    // front chest and shoulders
    S.ball([0, bodyY + 0.14, 0.68], [0.94, 0.72, 0.78], fur, { res: 0.035, rd: 0.06 });
    S.ball([-0.50, bodyY + 0.18, 0.38], [0.28, 0.54, 0.54], furLight, { res: 0.025, rd: 0.05 });
    S.ball([0.50, bodyY + 0.18, 0.38], [0.28, 0.54, 0.54], furLight, { res: 0.025, rd: 0.05 });
    // four stout legs, planted wide; charge stretches the back pair
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.40, bodyY + 0.20, 0.50], [sx * 0.58, bodyY - 0.16, 0.70], [sx * 0.62, bodyY - 0.54, 0.78]], 0.20, 0.135, furDark, { res: 0.025 });
      S.tube([[sx * 0.39, bodyY + 0.20, -0.45], [sx * 0.56, bodyY - 0.12, -0.62], [sx * 0.60, bodyY - 0.53 - stride, -0.74 - stride]], 0.23, 0.145, fur, { res: 0.025 });
      // broad paws + bone claws
      S.ball([sx * 0.62, bodyY - 0.58, 0.82], [0.23, 0.10, 0.28], furDark, { res: 0.018, rd: 0.03 });
      S.ball([sx * 0.60, bodyY - 0.57 - stride, -0.78 - stride], [0.25, 0.11, 0.30], fur, { res: 0.018, rd: 0.03 });
      for (const zz of [0.70, 0.82, 0.94]) {
        S.box([sx * 0.70, bodyY - 0.66, zz], [0.10, 0.035, 0.16], bone, { res: 0.008, rd: 0.012 });
      }
      for (const zz of [-0.88, -0.76, -0.64]) {
        S.box([sx * 0.68, bodyY - 0.66 - stride, zz - stride], [0.11, 0.035, 0.17], bone, { res: 0.008, rd: 0.012 });
      }
    }
    // tail: short, heavy, sweeping low
    S.tube([[0, bodyY + 0.02, -1.04], [0.10, bodyY - 0.05, -1.35], [0.34, bodyY - 0.15, -1.58]], 0.18, 0.07, furDark, { res: 0.025 });
    S.ball([0.37, bodyY - 0.16, -1.61], [0.12, 0.13, 0.12], moss, { res: 0.018, rd: 0.02 });
    // head: low wedge with bone tusks and ember eyes
    S.ball([0, headY, headZ], [0.66, 0.52, 0.58], fur, { res: 0.030, rd: 0.06 });
    S.ball([0, headY + 0.26, headZ - 0.02], [0.44, 0.20, 0.40], furLight, { res: 0.020, rd: 0.04 });
    S.ball([0, headY - 0.02, headZ + 0.34], [0.50, 0.35, 0.34], fur, { res: 0.025, rd: 0.05 });
    S.box([0, headY - 0.18, headZ + 0.56], [0.42, 0.14, 0.16], furDark, { res: 0.015, rd: 0.02 });
    // snout, nose and open maw
    S.ball([0, headY - 0.12, headZ + 0.57], [0.28, 0.18, 0.22], furLight, { res: 0.015, rd: 0.03 });
    S.box([0, headY - 0.21, headZ + 0.68], [0.18, 0.05, 0.14], dark, { res: 0.008, rd: 0.012 });
    for (const tx of [-0.12, -0.04, 0.04, 0.12]) {
      S.box([tx, headY - 0.22, headZ + 0.69], [0.045, 0.075, 0.035], bone, { res: 0.006 });
    }
    if (roar || charge) {
      S.ball([0, headY - 0.29, headZ + 0.58], [0.18, 0.08, 0.18], tongue, { res: 0.012, rd: 0.02 });
      S.ball([-0.16, headY - 0.27, headZ + 0.68], [0.06, 0.08, 0.07], bone, { res: 0.008, rd: 0.01 });
      S.ball([0.16, headY - 0.27, headZ + 0.68], [0.06, 0.08, 0.07], bone, { res: 0.008, rd: 0.01 });
    }
    // ears and tusks
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.42, headY + 0.19, headZ - 0.02], [0.16, 0.23, 0.10], furDark, { res: 0.012, rd: 0.02 });
      S.tube([[sx * 0.32, headY - 0.18, headZ + 0.66], [sx * 0.54, headY - 0.22, headZ + 0.90], [sx * 0.58, headY + 0.02, headZ + 1.08]], 0.10, 0.025, bone, { res: 0.010 });
    }
    // amber eyes under a heavy brow
    S.box([0, headY + 0.17, headZ + 0.40], [0.50, 0.10, 0.14], furDark, { res: 0.012, rd: 0.02 });
    S.box([-0.19, headY + 0.07, headZ + 0.62], [0.18, 0.13, 0.05], dark, { res: 0.008, rd: 0.01 });
    S.box([0.19, headY + 0.07, headZ + 0.62], [0.18, 0.13, 0.05], dark, { res: 0.008, rd: 0.01 });
    S.ball([-0.19, headY + 0.07, headZ + 0.72], [0.052, 0.041, 0.018], eye, { res: 0.005 });
    S.ball([0.19, headY + 0.07, headZ + 0.72], [0.052, 0.041, 0.018], eye, { res: 0.005 });
    // breathing glow in the throat
    S.ball([0, headY - 0.22, headZ + 0.45], [0.16, 0.10, 0.08], { r: [18, 17], em: true }, { res: 0.010 });
    // moss shell: overlapping moss caps, old stone ridges, hanging strands
    const caps = [
      [-0.36, 1.33, -0.24, 0.55, 0.28, 0.60],
      [0.30, 1.36, -0.20, 0.62, 0.26, 0.55],
      [0.00, 1.43, 0.18, 0.70, 0.27, 0.58],
      [-0.30, 1.32, 0.54, 0.44, 0.20, 0.40],
      [0.32, 1.28, 0.58, 0.42, 0.18, 0.40],
      [0.00, 1.33, -0.62, 0.52, 0.22, 0.48],
    ];
    for (const [x, y, z, sx, sy, sz] of caps) {
      S.ball([x, y, z], [sx, sy, sz], moss, { res: 0.035, rd: 0.06 });
      S.ball([x - 0.05, y + sy * 0.28, z], [sx * 0.74, sy * 0.48, sz * 0.78], mossLight, { res: 0.025, rd: 0.04 });
    }
    // ridge stones piercing the moss
    S.box([-0.30, 1.62, -0.15], [0.20, 0.13, 0.32], stone, { res: 0.018, rd: 0.02 });
    S.box([0.34, 1.54, 0.30], [0.16, 0.10, 0.26], stone, { res: 0.015, rd: 0.02 });
    S.box([0.02, 1.48, -0.70], [0.23, 0.12, 0.22], stone, { res: 0.015, rd: 0.02 });
    // hanging moss and fern fronds over the flanks
    for (const [x, z, len] of [[-0.54, 0.28, 0.26], [-0.50, -0.42, 0.20], [0.55, 0.18, 0.30], [0.52, -0.50, 0.22], [0.12, -0.82, 0.20]]) {
      const y0 = 1.12;
      S.tube([[x, y0, z], [x * 0.94, y0 - len * 0.6, z + 0.03], [x * 1.04, y0 - len, z - 0.02]], 0.055, 0.018, mossLight, { res: 0.010 });
      S.ball([x * 1.04, y0 - len, z - 0.02], [0.05, 0.035, 0.045], mossLight, { res: 0.006 });
    }
    // dorsal ridge: a row of dark moss cones gives the back a readable saw-tooth edge
    for (const [x, y, z, h] of [[0, 1.56, -0.75, 0.20], [-0.12, 1.62, -0.45, 0.24], [0.12, 1.66, -0.10, 0.26], [-0.10, 1.64, 0.28, 0.22], [0.08, 1.58, 0.62, 0.18]]) {
      S.tube([[x, y, z], [x + 0.04, y + h * 0.55, z - 0.04], [x - 0.02, y + h, z - 0.10]], 0.13, 0.02, moss, { res: 0.012 });
    }
    // three tall fern fronds catch the skyline and sell "living hill" at dusk
    for (const [x, z, lean, h] of [[-0.26, 0.62, -0.18, 0.46], [0.24, 0.50, 0.16, 0.40], [0.02, -0.30, -0.04, 0.34]]) {
      const y0 = 1.58;
      S.tube([[x, y0, z], [x + lean * 0.5, y0 + h * 0.55, z - 0.05], [x + lean, y0 + h, z + 0.04]], 0.045, 0.015, mossLight, { res: 0.010 });
      for (const side of [-1, 1]) {
        S.tube([[x + lean * 0.62, y0 + h * 0.66, z - 0.03], [x + lean * 0.62 + side * 0.12, y0 + h * 0.82, z + 0.08], [x + lean * 0.62 + side * 0.18, y0 + h * 0.88, z + 0.14]], 0.030, 0.012, mossLight, { res: 0.008 });
      }
    }
    // a few pale mushrooms on the shell, tiny but readable at 1x
    for (const [x, z] of [[-0.18, 0.92], [0.22, -0.44]]) {
      S.tube([[x, 1.48, z], [x + 0.02, 1.58, z]], 0.035, 0.020, bone, { res: 0.006 });
      S.ball([x + 0.02, 1.59, z], [0.075, 0.030, 0.065], bone, { res: 0.007, rd: 0.01 });
    }
    S.bake();

    return B.finish({
      cam: { target: [0, 0.96, 0.08], dist: 6.0, pitch: 0.18, yaw: 0.22 },
      detail: 22, dither: 0.18, radius: 4,
    });
  },
});
