module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-lamp-herb', name: '长明芯草', seed: 407,
  build(seed) {
    const P = [
      0x080b08, 0x162013, 0x2c3d1d, 0x4d5c28, 0x7b8340, 0xbfa55a,
      0xffb34e, 0xffd479, 0xffedb0, 0xfff9dd, 0x8d4b1e, 0x4f2c14
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const mud = { r: [0, 1, 11] };
    const stem = { r: [2, 3] };
    const leaf = { r: [3, 4] };
    const amber = { r: [5, 6, 10] };
    const glow = { r: [6, 7, 8], em: true };
    const core = { r: [8, 9], em: true };
    const dark = { r: [0, 1] };

    // wet mud base, three low wick stems around one tall lantern pod
    S.ball([0, 0.04, 0.03], [0.35, 0.07, 0.23], mud, { res: 0.025, rd: 0.03 });
    for (const [x, h, curve] of [
      [-0.22, 0.38, -0.04], [0.02, 0.52, 0.02], [0.24, 0.40, 0.05]
    ]) {
      S.tube([[0, 0.07, 0.02], [x * 0.55, h * 0.55, 0.04], [x + curve, h, 0.02]], 0.030, 0.014, leaf, { res: 0.014 });
      S.ball([x + curve, h + 0.03, 0.03], [0.055, 0.075, 0.050], glow, { res: 0.012 });
      S.ball([x + curve, h + 0.10, 0.03], [0.022, 0.030, 0.022], core, { res: 0.006 });
    }
    // central lantern pod: amber body, bright core, dark cage ribs and cap
    S.tube([[0, 0.07, 0.02], [0, 0.28, 0.03], [0, 0.42, 0.02]], 0.040, 0.020, stem, { res: 0.014 });
    S.ball([0, 0.47, 0.03], [0.135, 0.150, 0.100], amber, { res: 0.014 });
    S.ball([0, 0.48, 0.10], [0.055, 0.075, 0.035], glow, { res: 0.008 });
    S.ball([0, 0.58, 0.03], [0.050, 0.060, 0.040], core, { res: 0.008 });
    for (const dx of [-0.085, 0, 0.085]) {
      S.tube([[dx, 0.42, 0.10], [dx * 0.92, 0.50, 0.10], [dx * 0.78, 0.55, 0.08]], 0.010, 0.007, dark, { res: 0.008 });
    }
    S.ball([0, 0.62, 0.03], [0.070, 0.025, 0.055], dark, { res: 0.008 });
    // two ribbon leaves, slightly lower than the lantern
    S.tube([[-0.30, 0.24, 0.02], [-0.48, 0.31, 0.02], [-0.55, 0.24, 0.01]], 0.024, 0.007, leaf, { res: 0.010 });
    S.tube([[0.30, 0.24, 0.02], [0.47, 0.30, 0.02], [0.54, 0.22, 0.01]], 0.022, 0.007, leaf, { res: 0.010 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.34, 0.04], dist: 3.45, pitch: 0.15, yaw: 0.20 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
