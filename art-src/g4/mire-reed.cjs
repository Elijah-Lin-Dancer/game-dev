module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-reed', name: '雾泽芦苇', seed: 402,
  build(seed) {
    const P = [
      0x07120d, 0x12261b, 0x244331, 0x3d6142, 0x66855a, 0x9caf76,
      0xc1c89a, 0xe8dcb0, 0x47321f, 0x76502c, 0xa9773d, 0xd6aa62,
      0x78d0ad, 0xbaf6d8, 0x2d4f3a
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stalk = { r: [2, 3, 4] };
    const leaf = { r: [3, 4, 13] };
    const head = { r: [8, 9, 10] };
    const gold = { r: [10, 11], em: true };
    const mud = { r: [0, 1, 8] };
    const wet = { r: [13, 14], em: true };
    const dark = { r: [0, 1] };

    // wet mud mound and a shallow root pool
    S.ball([0, 0.05, 0.04], [0.46, 0.08, 0.28], mud, { res: 0.03, rd: 0.035 });
    S.ball([0, 0.025, 0.15], [0.40, 0.025, 0.18], wet, { res: 0.02 });
    // seven reeds, varied heights; one broken
    const stems = [
      [-0.34, 1.42, 0.08, 0.078], [-0.22, 1.72, 0.02, 0.065],
      [-0.08, 1.55, 0.12, 0.055], [0.08, 1.86, 0.03, 0.066],
      [0.22, 1.62, 0.14, 0.060], [0.34, 1.35, 0.05, 0.072],
      [0.44, 1.10, 0.12, 0.055],
    ];
    for (const [x, h, sy, r] of stems) {
      S.tube([[x * 0.30, 0.11, 0.04 + sy * 0.3], [x * 0.75, h * 0.48, 0.04 + sy], [x, h, 0.02 + sy]], r, r * 0.55, stalk, { res: 0.012 });
      S.ball([x, h + 0.10, 0.04 + sy], [0.085, 0.24, 0.07], head, { res: 0.014, rd: 0.02 });
      S.ball([x, h + 0.28, 0.04 + sy], [0.032, 0.09, 0.028], gold, { res: 0.008 });
    }
    // leaning leaves
    for (const [x0, y0, x1, y1] of [
      [-0.30, 0.38, -0.51, 0.66], [-0.12, 0.45, -0.28, 0.82],
      [0.12, 0.40, 0.35, 0.74], [0.30, 0.34, 0.53, 0.60],
      [0.03, 0.28, 0.02, 0.58]
    ]) {
      S.tube([[x0, y0, 0.04], [x0 * 0.55, (y0 + y1) * 0.55, 0.08], [x1, y1, 0.02]], 0.05, 0.006, leaf, { res: 0.012 });
    }
    // broken reed stump and floating leaf
    S.tube([[-0.44, 0.10, 0.10], [-0.42, 0.58, 0.08]], 0.035, 0.028, head, { res: 0.012 });
    S.tube([[0.46, 0.08, 0.16], [0.64, 0.14, 0.15]], 0.04, 0.008, leaf, { res: 0.01 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.92, 0.04], dist: 5.15, pitch: 0.11, yaw: 0.15 },
      detail: 17, dither: 0.20, radius: 4,
    });
  },
});
