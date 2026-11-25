module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g4-mire-keeper', name: '守泽人 阿芦', seed: 401,
  build(seed) {
    const P = [
      0x06100c, 0x10231a, 0x1d3a2b, 0x315844, 0x54775a, 0x8aa477,
      0xb9c19a, 0xe8e6c2, 0x3a291d, 0x6a4a2f, 0xa57643, 0xd6a95e,
      0x7fd9c2, 0xc8fff0, 0x344b3a, 0x1b2b24
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const coat = { r: [1, 2, 3] };
    const coatLight = { r: [3, 4] };
    const reed = { r: [9, 10, 11] };
    const straw = { r: [6, 7, 11] };
    const skin = { r: [10, 11] };
    const wood = { r: [8, 9] };
    const glow = { r: [12, 13], em: true };
    const dark = { r: [0, 1] };
    const moss = { r: [14, 15] };

    // bare feet, layered wading coat, reed belt
    for (const sx of [-1, 1]) {
      S.box([sx * 0.15, 0.08, 0.08], [0.15, 0.09, 0.25], dark, { res: 0.025, rd: 0.04 });
    }
    S.lathe([0, 0.10, 0], 0.58, t => 0.24 + 0.29 * (1 - t), coat, { res: 0.03 });
    S.lathe([0, 0.25, 0], 0.62, t => 0.18 + 0.17 * (1 - t), coatLight, { res: 0.03 });
    S.ball([0, 0.93, 0.02], [0.34, 0.37, 0.24], coat, { res: 0.025, rd: 0.06 });
    // shoulder mantle of matted reed
    S.ball([0, 1.10, 0.01], [0.47, 0.14, 0.29], reed, { res: 0.03, rd: 0.05 });
    // arms, pale hands
    S.tube([[-0.30, 1.02, 0.05], [-0.41, 0.78, 0.14], [-0.40, 0.57, 0.18]], 0.09, 0.065, coat, { res: 0.02 });
    S.tube([[0.30, 1.02, 0.05], [0.42, 0.78, 0.15], [0.46, 0.58, 0.18]], 0.09, 0.065, coat, { res: 0.02 });
    S.ball([-0.40, 0.53, 0.18], 0.07, skin, { res: 0.015 });
    S.ball([0.46, 0.55, 0.18], 0.08, skin, { res: 0.015 });
    // head, dark eye shadow, wide reed hat
    S.ball([0, 1.50, 0.01], [0.26, 0.29, 0.24], skin, { res: 0.02 });
    S.ball([0, 1.56, 0.20], [0.16, 0.075, 0.10], dark, { res: 0.015 });
    S.ball([0, 1.62, 0.01], [0.48, 0.075, 0.40], straw, { res: 0.025, rd: 0.04 });
    S.tube([[-0.38, 1.64, 0.01], [0, 1.76, 0.01], [0.38, 1.64, 0.01]], 0.055, 0.03, straw, { res: 0.015 });
    S.ball([0, 1.73, 0.01], [0.08, 0.10, 0.10], reed, { res: 0.02 });
    // pale green eyes, scarf and belt
    S.ball([-0.07, 1.50, 0.20], [0.025, 0.018, 0.008], glow, { res: 0.006 });
    S.ball([0.07, 1.50, 0.20], [0.025, 0.018, 0.008], glow, { res: 0.006 });
    S.tube([[-0.26, 1.18, 0.02], [0, 1.15, 0.11], [0.26, 1.18, 0.02]], 0.08, 0.06, moss, { res: 0.018 });
    S.tube([[-0.27, 0.72, 0.02], [0, 0.72, 0.16], [0.27, 0.72, 0.02]], 0.06, 0.042, wood, { res: 0.015 });
    // staff with a hanging marsh lantern
    S.tube([[0.56, 0.08, 0.16], [0.55, 0.88, 0.12], [0.58, 1.56, 0.05]], 0.036, 0.02, wood, { res: 0.014 });
    S.tube([[0.58, 1.56, 0.05], [0.76, 1.68, 0.02]], 0.026, 0.012, wood, { res: 0.010 });
    S.tube([[0.76, 1.68, 0.02], [0.76, 1.52, 0.02]], 0.012, 0.006, wood, { res: 0.008 });
    S.box([0.76, 1.44, 0.02], [0.15, 0.17, 0.12], { r: [10, 11], em: true }, { res: 0.018 });
    S.box([0.76, 1.44, 0.03], [0.085, 0.10, 0.08], glow, { res: 0.012 });
    // reed charm and bog hem
    S.tube([[-0.30, 0.32, 0.23], [-0.44, 0.46, 0.26], [-0.48, 0.26, 0.25]], 0.025, 0.008, straw, { res: 0.01 });
    S.ball([0, 0.04, 0.12], [0.55, 0.04, 0.22], moss, { res: 0.03, rd: 0.03 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.94, 0.05], dist: 4.35, pitch: 0.15, yaw: 0.24 },
      detail: 18, dither: 0.20, radius: 4,
    });
  },
});
