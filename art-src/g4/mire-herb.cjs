module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-herb', name: '灯芯草', seed: 404,
  build(seed) {
    const P = [
      0x07110d, 0x14251b, 0x2a4432, 0x4a6647, 0x789164, 0xb0bf83,
      0xd9d7a2, 0xf4edc0, 0x28503e, 0x69cfb2, 0xbfffe4, 0x3d2b1c
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const mud = { r: [0, 1, 11] };
    const stem = { r: [2, 3, 4] };
    const leaf = { r: [3, 4] };
    const glow = { r: [8, 9, 10], em: true };
    const warm = { r: [6, 7], em: true };
    const dark = { r: [0, 1] };

    // low mud clump, five thin lamp-wick stems
    S.ball([0, 0.04, 0.03], [0.37, 0.07, 0.23], mud, { res: 0.025, rd: 0.03 });
    for (const [x, h, sy, curve] of [
      [-0.24, 0.44, 0.02, -0.04], [-0.10, 0.56, 0.06, 0.03],
      [0.04, 0.50, 0.00, -0.02], [0.18, 0.40, 0.05, 0.05],
      [0.30, 0.34, 0.01, 0.08]
    ]) {
      S.tube([[x * 0.25, 0.07, 0.02], [x * 0.65, h * 0.55, 0.03 + sy], [x + curve, h, 0.02 + sy]], 0.026, 0.012, stem, { res: 0.012 });
      S.ball([x + curve, h + 0.04, 0.03 + sy], [0.060, 0.095, 0.055], glow, { res: 0.012 });
      S.ball([x + curve, h + 0.12, 0.03 + sy], [0.025, 0.030, 0.025], warm, { res: 0.006 });
    }
    // two ribbon leaves and a small seed head
    S.tube([[-0.32, 0.24, 0.02], [-0.50, 0.32, 0.02], [-0.56, 0.25, 0.01]], 0.025, 0.006, leaf, { res: 0.01 });
    S.tube([[0.32, 0.22, 0.02], [0.50, 0.28, 0.02], [0.54, 0.20, 0.01]], 0.022, 0.006, leaf, { res: 0.01 });
    S.ball([0.02, 0.20, 0.17], [0.055, 0.10, 0.045], dark, { res: 0.01 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.34, 0.04], dist: 3.45, pitch: 0.15, yaw: 0.20 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
