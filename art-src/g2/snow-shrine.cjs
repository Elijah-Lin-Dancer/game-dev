module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-snow-shrine', name: '雪中小祠', seed: 232,
  build(seed) {
    const P = [
      0x080e16, 0x17212b, 0x2c3944, 0x4c5d63, 0x74877f, 0xa8b4a4,
      0xd6dfcd, 0xf5f9ee, 0x29484e, 0x83d4d2, 0xc8fbf1, 0x3a2b24,
      0x5e4230, 0x8a6545
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stone = { r: [1, 2, 3] };
    const stoneLight = { r: [3, 4, 5] };
    const snow = { r: [6, 7, 8] };
    const wood = { r: [11, 12, 13] };
    const glow = { r: [9, 10], em: true };
    const dark = { r: [0, 1] };

    // stepped stone base
    S.box([0, 0.10, 0], [1.42, 0.18, 0.62], stone, { res: 0.04, rd: 0.05 });
    S.box([0, 0.24, 0], [1.12, 0.14, 0.50], stoneLight, { res: 0.035, rd: 0.04 });
    // four timber pillars and a snow-loaded roof
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        S.tube([[sx * 0.42, 0.30, sz * 0.16], [sx * 0.42, 1.30, sz * 0.16]], 0.075, 0.06, wood, { res: 0.02 });
      }
    }
    S.box([0, 1.34, 0], [1.10, 0.10, 0.52], wood, { res: 0.03, rd: 0.03 });
    S.lathe([0, 1.45, 0], 0.34, t => 0.74 * (1 - t) + 0.10, stone, { res: 0.035 });
    S.lathe([0, 1.49, 0], 0.30, t => 0.68 * (1 - t) + 0.08, snow, { res: 0.035 });
    S.tube([[-0.62, 1.52, 0.24], [0, 1.72, 0.24], [0.62, 1.52, 0.24]], 0.045, 0.025, snow, { res: 0.015 });
    // inner altar with a cold blue flame
    S.box([0, 0.46, 0.02], [0.44, 0.28, 0.26], stoneLight, { res: 0.025, rd: 0.03 });
    S.ball([0, 0.74, 0.04], [0.11, 0.18, 0.11], glow, { res: 0.018 });
    S.ball([0, 0.90, 0.04], [0.045, 0.12, 0.045], { r: [10, 10, 9], em: true }, { res: 0.012 });
    // hanging icicles under the eaves
    for (let i = 0; i < 5; i += 1) {
      const x = -0.46 + i * 0.23;
      S.tube([[x, 1.44, 0.28], [x, 1.30 - (i % 2) * 0.05, 0.28]], 0.018, 0.004, snow, { res: 0.008 });
    }
    // snow drift at the foot
    S.ball([0, 0.04, 0.13], [0.72, 0.05, 0.22], snow, { res: 0.03, rd: 0.03 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.94, 0.02], dist: 4.9, pitch: 0.14, yaw: 0.12 },
      detail: 16, dither: 0.21, radius: 4,
    });
  },
});
