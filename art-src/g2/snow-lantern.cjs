module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-snow-lantern', name: '雪灯草', seed: 234,
  build(seed) {
    const P = [
      0x071016, 0x172831, 0x2b4652, 0x4f6d73, 0x89a5a3, 0xdcebe2,
      0xf8fff8, 0x2d6977, 0x70cbd8, 0xd5ffff, 0x52645b,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const snow = { r: [4, 5, 6] };
    const leaf = { r: [2, 3, 10] };
    const stem = { r: [1, 2] };
    const glow = { r: [7, 8, 9], em: true };

    // low drift, three stems and cold blue lantern berries
    S.ball([0, 0.04, 0.03], [0.34, 0.07, 0.22], snow, { res: 0.025, rd: 0.03 });
    for (const [x, h, r] of [[-0.22, 0.42, 0.045], [0.02, 0.58, 0.04], [0.24, 0.38, 0.035]]) {
      S.tube([[0, 0.08, 0.02], [x * 0.45, h * 0.55, 0.03], [x, h, 0.02]], 0.028, 0.018, leaf, { res: 0.015 });
      S.ball([x, h + 0.03, 0.03], [0.060, 0.070, 0.055], glow, { res: 0.012 });
      S.ball([x, h + 0.09, 0.03], [0.025, 0.030, 0.025], { r: [9, 9, 8], em: true }, { res: 0.006 });
    }
    S.tube([[-0.30, 0.28, 0.02], [-0.46, 0.36, 0.02], [-0.52, 0.30, 0.01]], 0.022, 0.008, leaf, { res: 0.010 });
    S.tube([[0.28, 0.30, 0.02], [0.44, 0.34, 0.02], [0.50, 0.26, 0.01]], 0.022, 0.008, leaf, { res: 0.010 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.36, 0.04], dist: 3.4, pitch: 0.15, yaw: 0.20 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
