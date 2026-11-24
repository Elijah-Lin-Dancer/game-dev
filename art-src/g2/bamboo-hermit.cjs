module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-bamboo-hermit', name: '竹隐', seed: 213,
  build(seed) {
    const P = [
      0x080d0a, 0x16231a, 0x27402b, 0x3b5b3a, 0x627d4e, 0x8ca267,
      0xc8c79a, 0x2b1d13, 0x4e3421, 0x7b512c, 0xa97942, 0xe6b96e,
      0xffdf9c, 0x143e31, 0x2d6650, 0xb7d89a
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const robe = { r: [2, 3, 4] };
    const robeLight = { r: [4, 5] };
    const skin = { r: [10, 11] };
    const straw = { r: [9, 10, 11] };
    const wood = { r: [7, 8] };
    const lantern = { r: [11, 12], em: true };
    const dark = { r: [0, 1] };

    // boots + long layered robe
    for (const sx of [-1, 1]) {
      S.box([sx * 0.15, 0.10, 0.06], [0.14, 0.10, 0.24], dark, { res: 0.025, rd: 0.04 });
    }
    S.lathe([0, 0.15, 0], 0.45, t => 0.22 + 0.28 * (1 - t), robe, { res: 0.03 });
    S.lathe([0, 0.32, 0], 0.55, t => 0.18 + 0.16 * (1 - t), robeLight, { res: 0.03 });
    // torso, shoulders
    S.ball([0, 0.92, 0.02], [0.34, 0.36, 0.24], robe, { res: 0.025, rd: 0.06 });
    S.box([-0.28, 1.08, 0.02], [0.18, 0.14, 0.18], dark, { res: 0.025, rd: 0.04 });
    S.box([0.28, 1.08, 0.02], [0.18, 0.14, 0.18], dark, { res: 0.025, rd: 0.04 });
    // arms + hands
    S.tube([[-0.30, 1.02, 0.05], [-0.40, 0.74, 0.14], [-0.38, 0.52, 0.19]], 0.09, 0.065, robe, { res: 0.02 });
    S.tube([[0.30, 1.02, 0.05], [0.40, 0.76, 0.14], [0.41, 0.56, 0.18]], 0.09, 0.065, robe, { res: 0.02 });
    S.ball([-0.38, 0.49, 0.19], 0.07, skin, { res: 0.015 });
    S.ball([0.41, 0.53, 0.18], 0.08, skin, { res: 0.015 });
    // wide straw hat, head, face shadow
    S.ball([0, 1.48, 0.01], [0.27, 0.30, 0.25], skin, { res: 0.02 });
    S.ball([0, 1.58, 0.20], [0.17, 0.08, 0.10], dark, { res: 0.015 });
    S.ball([0, 1.58, 0.01], [0.48, 0.08, 0.40], straw, { res: 0.025, rd: 0.04 });
    S.tube([[-0.36, 1.60, 0.01], [0, 1.72, 0.01], [0.36, 1.60, 0.01]], 0.055, 0.03, straw, { res: 0.015 });
    // eyes: warm pinpoints
    S.ball([-0.07, 1.48, 0.20], [0.025, 0.018, 0.008], lantern, { res: 0.006 });
    S.ball([0.07, 1.48, 0.20], [0.025, 0.018, 0.008], lantern, { res: 0.006 });
    // scarf and belt
    S.tube([[-0.24, 1.20, 0.02], [0, 1.16, 0.11], [0.24, 1.20, 0.02]], 0.08, 0.06, robeLight, { res: 0.018 });
    S.tube([[-0.26, 0.72, 0.02], [0, 0.72, 0.16], [0.26, 0.72, 0.02]], 0.06, 0.045, wood, { res: 0.015 });
    // staff and lantern, asymmetrical silhouette
    S.tube([[0.46, 0.10, 0.18], [0.48, 0.72, 0.16], [0.45, 1.28, 0.10], [0.54, 1.58, 0.04]], 0.035, 0.020, wood, { res: 0.014 });
    S.tube([[0.54, 1.58, 0.04], [0.66, 1.70, 0.01]], 0.028, 0.014, wood, { res: 0.010 });
    S.tube([[-0.40, 0.50, 0.19], [-0.48, 0.28, 0.23], [-0.48, 0.06, 0.23]], 0.018, 0.012, wood, { res: 0.008 });
    S.box([-0.48, 0.02, 0.24], [0.18, 0.16, 0.12], { r: [11, 12], em: true }, { res: 0.018 });
    S.box([-0.48, 0.02, 0.25], [0.10, 0.09, 0.09], lantern, { res: 0.012 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.92, 0.06], dist: 4.3, pitch: 0.16, yaw: 0.24 },
      detail: 18, dither: 0.20, radius: 4,
    });
  },
});
