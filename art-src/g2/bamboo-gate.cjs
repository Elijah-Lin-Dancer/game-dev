module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-bamboo-gate', name: '竹林石门', seed: 212,
  build(seed) {
    const P = [
      0x07100b, 0x142219, 0x263b2d, 0x3e5940, 0x637c53, 0x93ad72,
      0xcbd39a, 0x2e2116, 0x513522, 0x7f5731, 0xf1d49a, 0xffb45c,
      0xffe6a0, 0x183c2c, 0x2c5b43
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stone = { r: [2, 3, 4] };
    const stoneLight = { r: [4, 5, 6] };
    const wood = { r: [7, 8, 9] };
    const moss = { r: [13, 14] };
    const glow = { r: [11, 12], em: true };
    const dark = { r: [0, 1] };

    // Two stone feet with moss caps.
    for (const sx of [-1, 1]) {
      S.box([sx * 1.05, 0.12, 0], [0.58, 0.24, 0.44], stone, { res: 0.04, rd: 0.05 });
      S.box([sx * 1.05, 0.25, 0], [0.62, 0.08, 0.46], moss, { res: 0.03, rd: 0.03 });
    }
    // Two timber posts leaning slightly inwards.
    S.tube([[-1.02, 0.22, 0], [-0.86, 2.00, 0.01], [-0.78, 3.15, 0.01]], 0.15, 0.11, wood, { res: 0.03 });
    S.tube([[1.02, 0.22, 0], [0.86, 2.00, 0.01], [0.78, 3.15, 0.01]], 0.15, 0.11, wood, { res: 0.03 });
    // Lintel + top bracket, slightly oversized for silhouette.
    S.box([0, 3.22, 0], [2.18, 0.20, 0.34], wood, { res: 0.04, rd: 0.04 });
    S.box([0, 3.42, 0], [1.90, 0.14, 0.28], stoneLight, { res: 0.035, rd: 0.03 });
    S.box([0, 3.46, 0], [0.18, 0.26, 0.18], dark, { res: 0.025 });
    // Hanging paper lanterns.
    for (const sx of [-0.64, 0.64]) {
      S.tube([[sx, 3.18, 0.13], [sx, 2.94, 0.18]], 0.018, 0.012, dark, { res: 0.008 });
      S.ball([sx, 2.78, 0.19], [0.13, 0.18, 0.11], { r: [10, 11, 12], em: true }, { res: 0.02 });
      S.box([sx, 2.62, 0.19], [0.12, 0.05, 0.10], dark, { res: 0.01 });
      S.ball([sx, 2.78, 0.28], 0.035, glow, { res: 0.008 });
    }
    // Moss patches on posts, and a small charm at the center.
    S.ball([-0.82, 0.68, 0.17], [0.14, 0.18, 0.06], moss, { res: 0.02 });
    S.ball([0.80, 1.04, 0.17], [0.13, 0.15, 0.05], moss, { res: 0.02 });
    S.ball([0, 3.04, 0.18], 0.08, glow, { res: 0.012 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.72, 0.02], dist: 6.2, pitch: 0.12, yaw: 0.12 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
