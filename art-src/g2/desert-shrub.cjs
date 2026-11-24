module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-desert-shrub', name: '沙枣丛', seed: 232,
  build(seed) {
    const P = [
      0x120c08, 0x2a1b10, 0x4c3320, 0x72502f, 0x9d7041, 0xc39860,
      0xe0bd7f, 0xd87732, 0xffb24c, 0xffdf88, 0x6b452b, 0x3a271a
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const bark = { r: [1, 2, 3] };
    const leaf = { r: [3, 4, 5] };
    const leafLight = { r: [4, 5, 6] };
    const berry = { r: [7, 8, 9], em: true };
    const root = { r: [10, 11] };

    // low desert shrub with three dry branches
    S.ball([0, 0.08, 0.03], [0.32, 0.07, 0.20], root, { res: 0.025, rd: 0.03 });
    for (const [x, y, r] of [[-0.20, 0.46, 0.065], [0.14, 0.58, 0.06], [0.32, 0.38, 0.05]]) {
      S.tube([[0, 0.10, 0.02], [x * 0.5, y * 0.6, 0.04], [x, y, 0.02]], 0.035, r, bark, { res: 0.02 });
    }
    S.tube([[-0.22, 0.48, 0.02], [-0.44, 0.56, 0.03], [-0.54, 0.48, 0.01]], 0.035, 0.012, leafLight, { res: 0.015 });
    S.tube([[0.14, 0.60, 0.02], [0.36, 0.68, 0.03], [0.51, 0.58, 0.01]], 0.032, 0.012, leaf, { res: 0.015 });
    S.tube([[0.31, 0.40, 0.02], [0.50, 0.36, 0.03], [0.60, 0.25, 0.01]], 0.030, 0.010, leafLight, { res: 0.015 });
    // orange berries: the quest item silhouette
    S.ball([-0.48, 0.51, 0.12], [0.075, 0.075, 0.065], berry, { res: 0.015 });
    S.ball([0.48, 0.55, 0.14], [0.070, 0.070, 0.060], berry, { res: 0.015 });
    S.ball([0.57, 0.28, 0.11], [0.060, 0.060, 0.055], berry, { res: 0.013 });
    S.ball([0.05, 0.67, 0.12], [0.055, 0.055, 0.050], berry, { res: 0.013 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.38, 0.04], dist: 3.5, pitch: 0.15, yaw: 0.20 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
