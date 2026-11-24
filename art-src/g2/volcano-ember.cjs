module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-volcano-ember', name: '火种', seed: 244,
  build(seed) {
    const P = [
      0x0a0706, 0x1a100c, 0x2c1a13, 0x45261a, 0x5e321e,
      0x7a4326, 0x2a2620, 0xff552e, 0xff8f2e, 0xffcf6a, 0xffefb0,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const basalt = { r: [1, 2, 3] };
    const soot = { r: [2, 6] };
    const ember = { r: [7, 8], em: true };
    const core = { r: [9, 10], em: true };

    // scorched stone cradle
    S.ball([0, 0.04, 0.06], [0.42, 0.08, 0.24], basalt, { res: 0.025, rd: 0.03 });
    S.ball([-0.25, 0.08, 0.10], [0.16, 0.08, 0.12], soot, { res: 0.02, rd: 0.02 });
    S.ball([0.26, 0.06, 0.06], [0.14, 0.07, 0.11], basalt, { res: 0.02, rd: 0.02 });
    // three hot shards, tallest in the middle
    for (const [x, h, r] of [[-0.18, 0.46, 0.10], [0.02, 0.68, 0.12], [0.20, 0.40, 0.09]]) {
      S.tube([[x, 0.06, 0.06], [x * 0.9, h * 0.55, 0.07], [x * 1.1, h, 0.06]], r, r * 0.28, ember, { res: 0.018 });
      S.ball([x * 1.1, h + 0.03, 0.06], [r * 0.45, r * 0.55, r * 0.40], core, { res: 0.008 });
    }
    // a low ring of dead cinders and two sparks
    S.tube([[-0.40, 0.11, 0.04], [-0.10, 0.05, 0.13], [0.24, 0.08, 0.12], [0.42, 0.12, 0.03]], 0.022, 0.010, soot, { res: 0.012 });
    S.ball([-0.10, 0.55, 0.10], 0.022, core, { res: 0.006 });
    S.ball([0.31, 0.43, 0.08], 0.016, ember, { res: 0.005 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.40, 0.05], dist: 3.7, pitch: 0.16, yaw: 0.18 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
