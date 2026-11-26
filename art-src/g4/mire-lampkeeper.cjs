module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-lampkeeper', name: '守灯人 阿烬', seed: 406,
  build(seed) {
    const P = [
      0x070a0c, 0x121718, 0x202724, 0x353d35, 0x555746, 0x797455,
      0xa79d77, 0xd8c99a, 0x261a15, 0x4a2b20, 0x7a4630, 0xb36b3e,
      0x3d6a70, 0x8bc5bd, 0xd9fff2, 0x2b211c, 0x5b4031, 0xc78a4f,
      0xffc15c, 0xffe4a8, 0x7a2c2c, 0xc25a3d
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const robe = { r: [1, 2, 3] };
    const robeLight = { r: [3, 4] };
    const ash = { r: [5, 6] };
    const bone = { r: [6, 7] };
    const boot = { r: [0, 1, 8] };
    const leather = { r: [8, 9, 10] };
    const skin = { r: [9, 10, 11] };
    const wood = { r: [15, 16] };
    const brass = { r: [17, 18] };
    const glow = { r: [18, 19], em: true };
    const teal = { r: [12, 13] };
    const tealGlow = { r: [13, 14], em: true };
    const ember = { r: [18, 19, 21], em: true };
    const red = { r: [20, 21] };
    const dark = { r: [0, 1] };

    // small feet, long ash robe with a wind-cut hem
    for (const sx of [-1, 1]) {
      S.box([sx * 0.14, 0.07, 0.08], [0.13, 0.09, 0.23], boot, { res: 0.025, rd: 0.04 });
    }
    S.lathe([0, 0.09, 0], 0.60, t => 0.22 + 0.30 * (1 - t), robe, { res: 0.03 });
    S.lathe([0, 0.22, 0], 0.66, t => 0.16 + 0.18 * (1 - t), robeLight, { res: 0.03 });
    // hem torn into three ash tongues
    for (const [x, z, w] of [[-0.34, 0.03, 0.22], [0.02, 0.04, 0.28], [0.37, 0.02, 0.20]]) {
      S.box([x, 0.04, z], [w, 0.045, 0.16], { r: [1, 2, 3] }, { res: 0.025, rd: 0.03 });
    }
    // bent shoulders and arms: right hand grips the lamp pole
    S.ball([0, 0.93, 0.01], [0.38, 0.35, 0.24], robe, { res: 0.025, rd: 0.06 });
    S.ball([0, 1.06, 0.01], [0.48, 0.12, 0.28], ash, { res: 0.03, rd: 0.05 });
    S.tube([[-0.28, 1.00, 0.04], [-0.38, 0.78, 0.12], [-0.34, 0.56, 0.18]], 0.09, 0.06, robe, { res: 0.02 });
    S.tube([[0.30, 1.00, 0.04], [0.43, 0.78, 0.16], [0.49, 0.62, 0.20]], 0.10, 0.065, robe, { res: 0.02 });
    S.ball([-0.33, 0.52, 0.18], 0.065, leather, { res: 0.015 });
    S.ball([0.50, 0.60, 0.20], 0.075, leather, { res: 0.015 });
    // neck and face: only the lower mask catches light
    S.tube([[0, 1.27, 0.01], [0, 1.43, 0.00]], 0.11, 0.10, skin, { res: 0.02 });
    S.ball([0, 1.55, 0.01], [0.25, 0.28, 0.23], skin, { res: 0.02 });
    S.ball([0, 1.48, 0.19], [0.18, 0.085, 0.07], teal, { res: 0.015 });
    // tall ash hood, high crown and a narrow brim
    S.ball([0, 1.62, -0.01], [0.34, 0.38, 0.29], dark, { res: 0.025, rd: 0.04 });
    S.ball([0, 1.88, 0.00], [0.19, 0.22, 0.18], robe, { res: 0.02, rd: 0.03 });
    S.ball([0, 2.00, 0.00], [0.07, 0.10, 0.07], ash, { res: 0.015 });
    S.tube([[-0.27, 1.72, 0.04], [0, 1.66, 0.19], [0.27, 1.72, 0.04]], 0.055, 0.035, ash, { res: 0.015 });
    // ember eyes under the hood; no mouth
    S.ball([-0.075, 1.57, 0.19], [0.023, 0.016, 0.008], ember, { res: 0.006 });
    S.ball([0.075, 1.57, 0.19], [0.023, 0.016, 0.008], ember, { res: 0.006 });
    // ash scarf wrapping the collar, tail trailing left
    S.tube([[-0.26, 1.30, 0.03], [0, 1.26, 0.13], [0.26, 1.30, 0.03]], 0.09, 0.07, ash, { res: 0.02 });
    S.tube([[-0.26, 1.28, 0.05], [-0.45, 1.06, 0.12], [-0.42, 0.80, 0.08]], 0.06, 0.025, ash, { res: 0.015 });
    // belt and small ember charm
    S.tube([[-0.34, 0.70, 0.02], [0, 0.70, 0.16], [0.34, 0.70, 0.02]], 0.07, 0.05, leather, { res: 0.015 });
    S.box([0, 0.70, 0.17], [0.07, 0.06, 0.03], brass, { res: 0.012 });
    S.ball([-0.31, 0.44, 0.22], 0.035, ember, { res: 0.008 });
    // left-hand lamp pole, taller than the hood
    S.tube([[-0.65, 0.05, 0.13], [-0.56, 0.90, 0.10], [-0.52, 1.72, 0.05]], 0.032, 0.018, wood, { res: 0.012 });
    S.tube([[-0.52, 1.72, 0.05], [-0.30, 1.86, 0.02]], 0.024, 0.012, wood, { res: 0.010 });
    S.tube([[-0.30, 1.86, 0.02], [-0.30, 1.68, 0.02]], 0.010, 0.006, wood, { res: 0.007 });
    // hanging lantern cage at chest height
    S.box([-0.30, 1.48, 0.03], [0.17, 0.21, 0.15], brass, { res: 0.016, rd: 0.02 });
    S.box([-0.30, 1.48, 0.05], [0.09, 0.13, 0.09], glow, { res: 0.012 });
    S.box([-0.30, 1.60, 0.03], [0.20, 0.025, 0.16], wood, { res: 0.010 });
    S.box([-0.30, 1.36, 0.03], [0.20, 0.025, 0.16], wood, { res: 0.010 });
    // cage bars
    for (const x of [-0.38, -0.22]) {
      S.box([x, 1.48, 0.13], [0.018, 0.17, 0.018], brass, { res: 0.008 });
    }
    // a few surviving reeds tucked at the back
    for (const [x, z, h] of [[0.38, -0.08, 0.80], [0.48, -0.04, 0.65], [-0.42, -0.06, 0.58]]) {
      S.tube([[x, 0.10, z], [x + 0.04, 0.10 + h, z - 0.02]], 0.012, 0.006, red, { res: 0.010 });
    }
    // warm rim under the lantern and a cold teal glint at the mask
    S.ball([-0.30, 1.36, 0.10], [0.085, 0.05, 0.05], glow, { res: 0.010 });
    S.ball([0, 1.30, 0.20], [0.035, 0.018, 0.012], tealGlow, { res: 0.008 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.02, 0.03], dist: 4.5, pitch: 0.14, yaw: 0.22 },
      detail: 18, dither: 0.20, radius: 4,
    });
  },
});
