module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'hub-smith', name: '铁匠', seed: 71,
  build(seed) {
    const P = [
      0x100d0b, 0x241b16, 0x3a2a20, 0x5b3d29, 0x80563a, 0xb07a4e,
      0x8a4d32, 0xc56b45, 0xe09a66, 0xf2c28d, 0x2b3338, 0x4d5b63,
      0x7c8b8c, 0xb8c2b7, 0xffd479, 0xff8a5a, 0xffe0a0
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const leather = { r: [2, 3, 4] };
    const apron = { r: [5, 6] };
    const skin = { r: [7, 8, 9] };
    const hair = { r: [5, 6, 7] };
    const steel = { r: [0, 10, 11, 12] };
    const steelLight = { r: [12, 13] };
    const forge = { r: [14, 15, 16], em: true };
    const dark = { r: [0, 1, 2] };

    // legs and boots, stocky
    for (const sx of [-1, 1]) {
      S.box([sx * 0.20, 0.22, 0.02], [0.16, 0.24, 0.16], leather, { res: 0.03, rd: 0.04 });
      S.box([sx * 0.21, 0.08, 0.08], [0.19, 0.10, 0.26], { r: [2, 3, 4] }, { res: 0.03, rd: 0.05 });
    }
    // barrel chest and apron
    S.ball([0, 1.10, 0.06], [0.53, 0.50, 0.34], skin, { res: 0.03, rd: 0.10 });
    S.box([0, 1.00, 0.30], [0.62, 0.62, 0.12], apron, { res: 0.035, rd: 0.06 });
    S.box([0, 0.80, 0.30], [0.54, 0.32, 0.10], { r: [3, 4] }, { res: 0.035, rd: 0.05 });
    S.tube([[-0.42, 1.16, 0.14], [0, 1.06, 0.22], [0.42, 1.16, 0.14]], 0.075, 0.06, steel, { res: 0.02 });
    // shoulders and arms
    S.ball([-0.48, 1.36, 0.02], [0.22, 0.20, 0.22], steel, { res: 0.025 });
    S.ball([0.48, 1.36, 0.02], [0.22, 0.20, 0.22], steel, { res: 0.025 });
    S.tube([[-0.50, 1.26, 0.04], [-0.62, 0.92, 0.16], [-0.54, 0.64, 0.26]], 0.13, 0.09, skin, { res: 0.025 });
    S.tube([[0.50, 1.26, 0.04], [0.63, 0.96, 0.16], [0.56, 0.70, 0.28]], 0.13, 0.09, skin, { res: 0.025 });
    S.ball([-0.54, 0.60, 0.28], 0.10, skin, { res: 0.02 });
    S.ball([0.56, 0.66, 0.30], 0.10, skin, { res: 0.02 });
    // neck, head and beard
    S.tube([[0, 1.44, 0.02], [0, 1.62, 0.04]], 0.15, 0.14, skin, { res: 0.02 });
    S.ball([0, 1.78, 0.04], [0.31, 0.30, 0.28], skin, { res: 0.025, rd: 0.06 });
    S.ball([0, 1.64, 0.25], [0.22, 0.16, 0.14], hair, { res: 0.02 });
    S.tube([[0, 1.55, 0.22], [0, 1.42, 0.20], [0, 1.31, 0.16]], 0.14, 0.08, hair, { res: 0.02 });
    // brows, eyes and nose
    S.box([-0.12, 1.85, 0.28], [0.10, 0.025, 0.02], dark, { res: 0.01, rd: 0.01 });
    S.box([0.12, 1.85, 0.28], [0.10, 0.025, 0.02], dark, { res: 0.01, rd: 0.01 });
    S.ball([-0.085, 1.80, 0.33], [0.028, 0.024, 0.01], forge, { res: 0.008 });
    S.ball([0.085, 1.80, 0.33], [0.028, 0.024, 0.01], forge, { res: 0.008 });
    S.ball([0, 1.74, 0.34], [0.045, 0.035, 0.025], skin, { res: 0.01 });
    // headband
    S.tube([[-0.30, 1.92, 0.10], [0, 1.96, 0.18], [0.30, 1.92, 0.10]], 0.055, 0.04, { r: [3, 6] }, { res: 0.018 });
    // hammer, handle in right hand
    S.tube([[0.56, 0.66, 0.30], [0.74, 1.10, 0.12], [0.90, 1.54, 0.02]], 0.045, 0.028, leather, { res: 0.018 });
    S.box([0.98, 1.60, 0.00], [0.42, 0.24, 0.26], steel, { res: 0.035, rd: 0.05 });
    S.box([0.98, 1.60, 0.00], [0.30, 0.18, 0.28], steelLight, { res: 0.03, rd: 0.04 });
    S.ball([0.76, 1.52, 0.02], 0.035, forge, { res: 0.01 });
    // apron strings
    S.tube([[-0.28, 1.24, 0.28], [0, 1.18, 0.34], [0.28, 1.24, 0.28]], 0.035, 0.025, { r: [2, 3] }, { res: 0.012 });
    // little spark
    S.ball([-0.74, 1.08, 0.34], 0.025, forge, { res: 0.008 });
    S.bake();
    return B.finish({ cam: { target: [0.05, 1.10, 0.12], dist: 4.8, pitch: 0.15, yaw: 0.34 }, detail: 16, dither: 0.24, radius: 4 });
  }
});
