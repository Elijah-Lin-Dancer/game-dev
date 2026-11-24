module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-volcano-smith', name: '熔匠 赤砧', seed: 243,
  build(seed) {
    const P = [
      0x070505, 0x17100d, 0x2a1812, 0x42251b, 0x5c3524, 0x7a432a,
      0x9c5834, 0xb87048, 0xd48a58, 0xe8a56a, 0x3a2018, 0x563126,
      0x6a6258, 0x9a9082, 0xc8c0b2, 0xff6a2e, 0xffb052, 0xffe5a0,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const skin = { r: [7, 8, 9] };
    const coat = { r: [2, 3, 4] };
    const coatLight = { r: [4, 5] };
    const apron = { r: [10, 11] };
    const leather = { r: [1, 2] };
    const metal = { r: [12, 13, 14] };
    const dark = { r: [0, 1] };
    const hot = { r: [15, 16], em: true };
    const hotCore = { r: [16, 17], em: true };

    // feet under a long leather work coat
    for (const sx of [-1, 1]) {
      S.box([sx * 0.16, 0.09, 0.05], [0.19, 0.15, 0.23], dark, { res: 0.02, rd: 0.03 });
    }
    S.lathe([0, 0.11, 0], 0.58, t => 0.26 + 0.17 * (1 - t), coat, { res: 0.03 });
    S.lathe([0, 0.27, 0], 0.60, t => 0.21 + 0.10 * (1 - t), coatLight, { res: 0.03 });
    // broad apron with a hot leather belt
    S.box([0, 0.55, 0.19], [0.46, 0.48, 0.12], apron, { res: 0.025, rd: 0.03 });
    S.box([0, 0.33, 0.20], [0.52, 0.10, 0.10], leather, { res: 0.02, rd: 0.02 });
    S.box([0, 0.82, 0.04], [0.56, 0.28, 0.30], coatLight, { res: 0.025, rd: 0.04 });
    // shoulders, arms, hands
    S.ball([0, 1.07, 0.02], [0.44, 0.14, 0.28], coat, { res: 0.025, rd: 0.04 });
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.30, 1.01, 0.06], [sx * 0.43, 0.78, 0.16], [sx * 0.40, 0.55, 0.20]], 0.095, 0.070, coatLight, { res: 0.02 });
      S.ball([sx * 0.40, 0.51, 0.22], 0.080, skin, { res: 0.015 });
    }
    // left hand holds tongs
    S.tube([[-0.40, 0.50, 0.23], [-0.58, 0.78, 0.25], [-0.70, 0.96, 0.23]], 0.028, 0.014, metal, { res: 0.010 });
    S.box([-0.72, 0.99, 0.23], [0.16, 0.05, 0.08], metal, { res: 0.012, rd: 0.015 });
    // right hand holds a long hammer resting on the ground
    S.tube([[0.40, 0.50, 0.23], [0.55, 0.30, 0.26], [0.58, 0.10, 0.23]], 0.032, 0.022, leather, { res: 0.012 });
    S.box([0.58, 0.07, 0.23], [0.30, 0.14, 0.13], metal, { res: 0.018, rd: 0.025 });
    // head, soot cap, beard, bright eyes
    S.ball([0, 1.47, 0.02], [0.25, 0.28, 0.23], skin, { res: 0.018 });
    S.ball([0, 1.33, 0.19], [0.14, 0.10, 0.07], skin, { res: 0.015 });
    S.ball([0, 1.63, 0.01], [0.31, 0.17, 0.28], leather, { res: 0.025, rd: 0.03 });
    S.tube([[-0.18, 1.64, 0.06], [0, 1.78, 0.04], [0.18, 1.64, 0.06]], 0.055, 0.025, leather, { res: 0.012 });
    S.ball([-0.075, 1.48, 0.22], [0.030, 0.020, 0.010], hot, { res: 0.006 });
    S.ball([0.075, 1.48, 0.22], [0.030, 0.020, 0.010], hot, { res: 0.006 });
    S.tube([[0, 1.38, 0.22], [-0.04, 1.18, 0.25], [0.02, 0.99, 0.22]], 0.090, 0.025, leather, { res: 0.015 });
    // belt ember charm
    S.ball([-0.20, 0.45, 0.26], [0.09, 0.12, 0.07], hot, { res: 0.012 });
    S.ball([-0.20, 0.52, 0.26], [0.035, 0.055, 0.035], hotCore, { res: 0.008 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.95, 0.04], dist: 4.4, pitch: 0.15, yaw: 0.22 },
      detail: 18, dither: 0.20, radius: 4,
    });
  },
});
