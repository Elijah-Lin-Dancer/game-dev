module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'hub-training-dummy', name: '训练木桩', seed: 101,
  build(seed) {
    const P = [
      0x120d09, 0x261a11, 0x3c2a19, 0x5b3f24, 0x805c32, 0xb18348,
      0xc2a061, 0xd9c07a, 0xefe0b0, 0x8a3a2a, 0xc85a3a, 0xe98a55,
      0x5b6a4b, 0x879c65, 0xffd479, 0xffe6a8
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const wood = { r: [1, 2, 3, 4] };
    const woodLight = { r: [4, 5] };
    const straw = { r: [6, 7, 8] };
    const red = { r: [9, 10, 11] };
    const grass = { r: [12, 13] };
    const gold = { r: [14, 15] };
    const dark = { r: [0, 1] };

    // ground stump and post
    S.box([0, 0.10, 0], [0.58, 0.18, 0.48], wood, { res: 0.03, rd: 0.05 });
    S.tube([[0, 0.18, 0], [0, 0.92, 0], [0, 1.82, 0]], 0.13, 0.10, woodLight, { res: 0.03 });
    // crossbar and straw arms
    S.tube([[-0.72, 1.20, 0.02], [0, 1.24, 0.04], [0.72, 1.20, 0.02]], 0.09, 0.07, wood, { res: 0.025 });
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.54, 1.22, 0.02], [sx * 0.84, 1.22, 0.06], [sx * 0.96, 1.10, 0.10]], 0.10, 0.05, straw, { res: 0.025 });
      S.tube([[sx * 0.80, 1.18, 0.08], [sx * 0.72, 0.98, 0.14]], 0.025, 0.018, straw, { res: 0.012 });
    }
    // burlap body
    S.ball([0, 1.00, 0.02], [0.38, 0.42, 0.26], straw, { res: 0.035, rd: 0.08 });
    S.box([0, 1.00, 0.24], [0.52, 0.58, 0.08], { r: [7, 8] }, { res: 0.03, rd: 0.04 });
    S.tube([[-0.28, 1.26, 0.26], [0, 1.30, 0.30], [0.28, 1.26, 0.26]], 0.045, 0.03, red, { res: 0.014 });
    S.tube([[-0.28, 0.86, 0.26], [0, 0.82, 0.28], [0.28, 0.86, 0.26]], 0.04, 0.028, red, { res: 0.012 });
    // target rings on the chest
    S.ball([0, 1.06, 0.32], [0.20, 0.20, 0.015], { r: [8] }, { res: 0.012 });
    S.ball([0, 1.06, 0.33], [0.13, 0.13, 0.02], red, { res: 0.012 });
    S.ball([0, 1.06, 0.34], [0.07, 0.07, 0.015], gold, { res: 0.010 });
    // straw head with floppy hat
    S.ball([0, 1.66, 0.02], [0.24, 0.26, 0.22], straw, { res: 0.03, rd: 0.06 });
    S.tube([[-0.30, 1.78, 0.02], [0, 1.88, 0.04], [0.30, 1.78, 0.02]], 0.065, 0.055, straw, { res: 0.02 });
    S.ball([-0.08, 1.70, 0.24], [0.03, 0.025, 0.01], dark, { res: 0.008 });
    S.ball([0.08, 1.70, 0.24], [0.03, 0.025, 0.01], dark, { res: 0.008 });
    S.tube([[-0.09, 1.58, 0.20], [0, 1.54, 0.24], [0.09, 1.58, 0.20]], 0.035, 0.015, red, { res: 0.012 });
    // scattered straw and a little grass at the base
    for (const [x, z, a] of [[-0.38, 0.20, 0.2], [0.34, 0.24, -0.4], [0.16, -0.18, 0.8]]) {
      S.tube([[x, 0.12, z], [x + Math.cos(a) * 0.20, 0.18, z + Math.sin(a) * 0.12]], 0.025, 0.008, straw, { res: 0.010 });
    }
    S.tube([[-0.44, 0.14, 0.28], [-0.52, 0.30, 0.34], [-0.48, 0.42, 0.32]], 0.025, 0.012, grass, { res: 0.012 });
    S.tube([[0.40, 0.14, 0.24], [0.48, 0.28, 0.34], [0.44, 0.40, 0.30]], 0.022, 0.010, grass, { res: 0.012 });
    S.bake();
    return B.finish({ cam: { target: [0, 1.00, 0.05], dist: 4.0, pitch: 0.18, yaw: 0.26 }, detail: 16, dither: 0.24, radius: 4 });
  }
});
