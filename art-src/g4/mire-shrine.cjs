module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-shrine', name: '沉祠', seed: 403,
  build(seed) {
    const P = [
      0x08100d, 0x18271f, 0x2d4035, 0x4b6151, 0x74856b, 0xa3ad8c,
      0xc9cba6, 0xececc0, 0x3a2a1d, 0x64452b, 0x916b40, 0xc79b5b,
      0x73cfb2, 0xc4fae0, 0x244333
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stone = { r: [1, 2, 3] };
    const stoneLight = { r: [3, 4, 5] };
    const moss = { r: [4, 5, 13] };
    const wood = { r: [8, 9, 10] };
    const gold = { r: [10, 11] };
    const glow = { r: [12, 13], em: true };
    const dark = { r: [0, 1] };
    const pale = { r: [5, 6, 7] };

    // half-sunken two-step base
    S.box([0, 0.05, 0.03], [1.54, 0.10, 0.64], stone, { res: 0.04, rd: 0.05 });
    S.box([0, 0.15, 0.02], [1.10, 0.12, 0.48], stoneLight, { res: 0.035, rd: 0.04 });
    S.box([0, 0.01, 0.34], [1.40, 0.025, 0.16], pale, { res: 0.02 });
    // tall, uneven gate pillars: the left one is shorter and tilted into the water
    for (const [sx, h, lean] of [[-1, 1.54, -0.04], [1, 1.82, 0.01]]) {
      for (const sz of [-1, 1]) {
        S.tube([[sx * 0.42, 0.26, sz * 0.13], [sx * 0.42 + lean, 0.26 + h, sz * 0.13]], 0.085, 0.055, wood, { res: 0.022 });
      }
      S.box([sx * 0.42, 0.60, 0], [0.22, 0.07, 0.26], stoneLight, { res: 0.02 });
    }
    // high sagging eave, moss and a ridge cap
    S.box([-0.05, 2.04, 0], [1.16, 0.10, 0.54], wood, { res: 0.03, rd: 0.03 });
    S.lathe([-0.03, 2.14, 0], 0.34, t => 0.80 * (1 - t) + 0.10, stone, { res: 0.035 });
    S.lathe([-0.03, 2.18, 0], 0.30, t => 0.70 * (1 - t) + 0.08, moss, { res: 0.035 });
    S.tube([[-0.66, 2.20, 0.26], [-0.03, 2.40, 0.26], [0.60, 2.20, 0.26]], 0.05, 0.025, moss, { res: 0.015 });
    S.box([0.02, 2.33, 0.02], [0.24, 0.10, 0.22], wood, { res: 0.018 });
    S.ball([0.02, 2.42, 0.02], [0.10, 0.10, 0.10], gold, { res: 0.012 });
    // hanging lamp under the eave, inner altar / green flame
    S.tube([[0.26, 2.08, 0.30], [0.26, 1.82, 0.30]], 0.012, 0.006, gold, { res: 0.008 });
    S.box([0.26, 1.73, 0.30], [0.17, 0.20, 0.13], { r: [10, 11], em: true }, { res: 0.018 });
    S.box([0.26, 1.73, 0.31], [0.08, 0.10, 0.08], glow, { res: 0.012 });
    S.box([-0.05, 0.56, 0.01], [0.40, 0.26, 0.28], stoneLight, { res: 0.024, rd: 0.03 });
    S.ball([-0.05, 0.84, 0.03], [0.10, 0.18, 0.10], glow, { res: 0.018 });
    S.ball([-0.05, 1.00, 0.03], [0.045, 0.11, 0.045], { r: [13, 13, 12], em: true }, { res: 0.012 });
    // waterline, algae and a fallen roof shard
    S.box([0, 0.03, 0.38], [1.54, 0.02, 0.12], pale, { res: 0.02 });
    for (let i = 0; i < 6; i += 1) {
      S.ball([-0.62 + i * 0.25, 0.15, 0.30], [0.15, 0.035, 0.07], moss, { res: 0.012 });
    }
    S.box([0.54, 0.16, 0.24], [0.26, 0.08, 0.18], stoneLight, { res: 0.02 });
    S.box([-0.56, 0.10, 0.30], [0.20, 0.06, 0.16], stone, { res: 0.02 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.12, 0.03], dist: 5.3, pitch: 0.15, yaw: 0.12 },
      detail: 17, dither: 0.21, radius: 4,
    });
  },
});
