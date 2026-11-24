module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-desert-nomad', name: '沙婆', seed: 231,
  build(seed) {
    const P = [
      0x0d0906, 0x20150f, 0x3b281b, 0x65462c, 0x95653c, 0xc99758,
      0xead39b, 0x8c3e2e, 0x4a2a1c, 0x7a512e, 0xd9a96b, 0xffdf9a,
      0x27433e, 0x57806e, 0x9fc3a1
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const robe = { r: [2, 3, 4] };
    const robeLight = { r: [4, 5] };
    const sand = { r: [5, 6] };
    const scarf = { r: [7, 8] };
    const skin = { r: [10, 11] };
    const wood = { r: [8, 9] };
    const glow = { r: [11, 12], em: true };
    const teal = { r: [12, 13, 14] };
    const dark = { r: [0, 1] };

    // boots and a wind-cut travelling cloak
    for (const sx of [-1, 1]) {
      S.box([sx * 0.15, 0.10, 0.06], [0.14, 0.10, 0.24], dark, { res: 0.025, rd: 0.04 });
    }
    S.lathe([0, 0.15, 0], 0.48, t => 0.24 + 0.28 * (1 - t), robe, { res: 0.03 });
    S.lathe([0, 0.30, 0], 0.56, t => 0.19 + 0.17 * (1 - t), robeLight, { res: 0.03 });
    // torso and shoulder mantle
    S.ball([0, 0.92, 0.02], [0.35, 0.37, 0.24], robe, { res: 0.025, rd: 0.06 });
    S.ball([0, 1.10, 0.01], [0.46, 0.14, 0.30], teal, { res: 0.03, rd: 0.04 });
    // arms, hands, a walking staff
    S.tube([[-0.30, 1.02, 0.05], [-0.42, 0.76, 0.14], [-0.40, 0.52, 0.18]], 0.09, 0.065, robe, { res: 0.02 });
    S.tube([[0.30, 1.02, 0.05], [0.42, 0.76, 0.14], [0.44, 0.54, 0.17]], 0.09, 0.065, robe, { res: 0.02 });
    S.ball([-0.40, 0.49, 0.18], 0.07, skin, { res: 0.015 });
    S.ball([0.44, 0.51, 0.17], 0.08, skin, { res: 0.015 });
    S.tube([[0.54, 0.10, 0.17], [0.53, 0.88, 0.13], [0.55, 1.52, 0.06]], 0.035, 0.020, wood, { res: 0.014 });
    S.tube([[0.55, 1.52, 0.06], [0.72, 1.64, 0.02]], 0.028, 0.012, wood, { res: 0.010 });
    // head, face shadow, turban and scarf
    S.ball([0, 1.48, 0.01], [0.27, 0.30, 0.25], skin, { res: 0.02 });
    S.ball([0, 1.55, 0.20], [0.17, 0.075, 0.10], dark, { res: 0.015 });
    S.ball([0, 1.65, 0.01], [0.30, 0.12, 0.28], scarf, { res: 0.025, rd: 0.04 });
    S.tube([[-0.32, 1.62, 0.01], [0, 1.78, 0.01], [0.32, 1.62, 0.01]], 0.055, 0.03, scarf, { res: 0.015 });
    S.ball([0, 1.71, 0.01], [0.13, 0.07, 0.18], teal, { res: 0.018 });
    // eyes and a water-skin at the belt
    S.ball([-0.07, 1.48, 0.20], [0.025, 0.018, 0.008], glow, { res: 0.006 });
    S.ball([0.07, 1.48, 0.20], [0.025, 0.018, 0.008], glow, { res: 0.006 });
    S.tube([[-0.26, 0.72, 0.02], [0, 0.70, 0.16], [0.26, 0.72, 0.02]], 0.06, 0.045, wood, { res: 0.015 });
    S.ball([-0.28, 0.57, 0.18], [0.14, 0.20, 0.12], sand, { res: 0.02 });
    S.box([-0.28, 0.74, 0.18], [0.08, 0.05, 0.08], dark, { res: 0.01 });
    // dust-coloured hem and a tiny wayfinder charm
    S.ball([0, 1.06, 0.24], 0.04, glow, { res: 0.008 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.92, 0.06], dist: 4.3, pitch: 0.16, yaw: 0.24 },
      detail: 18, dither: 0.20, radius: 4,
    });
  },
});
