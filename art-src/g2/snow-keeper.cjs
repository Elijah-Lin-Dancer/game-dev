module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-snow-keeper', name: '守灯人 阿霁', seed: 233,
  build(seed) {
    const P = [
      0x071016, 0x111e28, 0x203645, 0x345367, 0x52758a, 0x879fae,
      0xc3d7de, 0xf4fbff, 0x314b55, 0x7fc9d3, 0xd8ffff, 0x70513b,
      0xa47952, 0x3c2a20,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const coat = { r: [1, 2, 3] };
    const coatLight = { r: [3, 4] };
    const fur = { r: [6, 7] };
    const skin = { r: [11, 12] };
    const wood = { r: [11, 13] };
    const glow = { r: [9, 10], em: true };
    const dark = { r: [0, 1] };
    const ice = { r: [8, 9] };

    for (const sx of [-1, 1]) {
      S.box([sx * 0.15, 0.10, 0.06], [0.14, 0.10, 0.24], dark, { res: 0.025, rd: 0.04 });
    }
    // long snow-coat and hem
    S.lathe([0, 0.12, 0], 0.56, t => 0.25 + 0.26 * (1 - t), coat, { res: 0.03 });
    S.lathe([0, 0.26, 0], 0.62, t => 0.19 + 0.15 * (1 - t), coatLight, { res: 0.03 });
    S.ball([0, 0.94, 0.02], [0.34, 0.38, 0.24], coat, { res: 0.025, rd: 0.06 });
    // fur mantle
    S.ball([0, 1.12, 0.01], [0.48, 0.15, 0.30], fur, { res: 0.03, rd: 0.05 });
    // arms and gloves
    S.tube([[-0.30, 1.03, 0.05], [-0.42, 0.80, 0.14], [-0.40, 0.58, 0.18]], 0.09, 0.065, coat, { res: 0.02 });
    S.tube([[0.30, 1.03, 0.05], [0.43, 0.80, 0.14], [0.45, 0.59, 0.17]], 0.09, 0.065, coat, { res: 0.02 });
    S.ball([-0.40, 0.54, 0.18], 0.07, fur, { res: 0.015 });
    S.ball([0.45, 0.56, 0.17], 0.08, fur, { res: 0.015 });
    // staff with a cold lamp
    S.tube([[0.55, 0.08, 0.16], [0.54, 0.92, 0.12], [0.57, 1.55, 0.05]], 0.036, 0.020, wood, { res: 0.014 });
    S.tube([[0.57, 1.55, 0.05], [0.72, 1.68, 0.02]], 0.028, 0.012, wood, { res: 0.010 });
    S.ball([0.72, 1.70, 0.02], [0.09, 0.12, 0.07], glow, { res: 0.012 });
    S.ball([0.72, 1.78, 0.02], [0.04, 0.06, 0.03], { r: [10, 10, 9], em: true }, { res: 0.008 });
    // head and deep hood
    S.ball([0, 1.50, 0.01], [0.26, 0.29, 0.24], skin, { res: 0.02 });
    S.ball([0, 1.57, 0.18], [0.16, 0.07, 0.09], dark, { res: 0.015 });
    S.ball([0, 1.66, 0.01], [0.33, 0.18, 0.30], coat, { res: 0.025, rd: 0.04 });
    S.tube([[-0.32, 1.63, 0.01], [0, 1.82, 0.01], [0.32, 1.63, 0.01]], 0.065, 0.034, coatLight, { res: 0.015 });
    S.ball([0, 1.74, -0.02], [0.11, 0.08, 0.16], fur, { res: 0.018 });
    // pale eyes, frost scarf and belt lantern
    S.ball([-0.07, 1.50, 0.20], [0.025, 0.018, 0.008], glow, { res: 0.006 });
    S.ball([0.07, 1.50, 0.20], [0.025, 0.018, 0.008], glow, { res: 0.006 });
    S.tube([[-0.28, 0.76, 0.02], [0, 0.74, 0.17], [0.28, 0.76, 0.02]], 0.055, 0.040, ice, { res: 0.015 });
    S.ball([-0.27, 0.60, 0.18], [0.10, 0.14, 0.09], glow, { res: 0.015 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.92, 0.05], dist: 4.3, pitch: 0.15, yaw: 0.24 },
      detail: 18, dither: 0.20, radius: 4,
    });
  },
});
