module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-volcano-spire', name: '黑曜尖柱', seed: 241,
  build(seed) {
    const P = [
      0x080608, 0x141012, 0x22191c, 0x332428, 0x513438, 0x6e4642,
      0x2b1b1b, 0xff552e, 0xff9a3c, 0xffdf7a, 0x171515
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const obsidian = { r: [1, 2, 3] };
    const edge = { r: [3, 4, 5] };
    const hot = { r: [7, 8], em: true };
    const hotCore = { r: [8, 9], em: true };
    const ash = { r: [0, 6] };

    // jagged obsidian pillar, tapered and leaning
    const pts = [
      [-0.05, 0.08, 0.02],
      [-0.22, 0.75, 0.02],
      [-0.10, 1.48, 0.01],
      [-0.26, 2.18, 0.00],
    ];
    S.tube(pts, 0.36, 0.08, obsidian, { res: 0.035 });
    S.tube([[-0.10, 1.48, 0.01], [0.20, 1.64, 0.01], [0.36, 1.52, 0.00]], 0.13, 0.03, edge, { res: 0.02 });
    S.tube([[-0.16, 0.74, 0.02], [-0.46, 0.86, 0.02], [-0.62, 0.78, 0.01]], 0.10, 0.02, edge, { res: 0.02 });
    S.tube([[-0.20, 1.05, 0.02], [0.22, 1.14, 0.01], [0.44, 1.06, 0.00]], 0.08, 0.02, edge, { res: 0.02 });
    // fissures of hot magma embedded in the column
    S.tube([[-0.06, 0.18, 0.19], [-0.16, 0.66, 0.18], [-0.12, 1.10, 0.17], [-0.20, 1.54, 0.15]], 0.018, 0.012, hot, { res: 0.008 });
    S.tube([[-0.12, 0.82, 0.16], [0.04, 0.98, 0.16], [0.10, 1.20, 0.15]], 0.012, 0.006, hotCore, { res: 0.006 });
    S.ball([-0.24, 2.14, 0.06], [0.035, 0.08, 0.03], hotCore, { res: 0.01 });
    // ash and slag at the base
    S.ball([0, 0.06, 0.10], [0.48, 0.07, 0.24], ash, { res: 0.03, rd: 0.03 });
    S.box([-0.52, 0.08, 0.12], [0.22, 0.08, 0.14], obsidian, { res: 0.02, rd: 0.02 });
    S.box([0.42, 0.07, 0.10], [0.16, 0.06, 0.12], edge, { res: 0.018, rd: 0.02 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.20, 0.02], dist: 5.4, pitch: 0.13, yaw: 0.18 },
      detail: 16, dither: 0.24, radius: 4,
    });
  },
});
