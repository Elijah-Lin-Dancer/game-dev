module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'wanderer-hero', name: '旅人', seed: 41,
  build(seed) {
    const P = [
      0x0d1117, 0x1c2330, 0x2e3b52, 0x4d607e, 0x8c9ab2, 0xece7d8,
      0x5b382c, 0x8f4d38, 0xc76a4b, 0xf0a26b, 0x24362f, 0x3f5e49,
      0x688366, 0xa8b886, 0xd8b66b, 0xf4dfae, 0xffcf66
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const cloak = { r: [1,2,3,4] };
    const cloakDark = { r: [0,1,2] };
    const leather = { r: [6,7,8] };
    const skin = { r: [8,9,15] };
    const hair = { r: [0,1,2] };
    const scarf = { r: [7,8,9,15] };
    const metal = { r: [4,5] };
    const glow = { r: [16], em: true };

    // legs / boots
    for (const sx of [-1, 1]) {
      S.box([sx*0.16, 0.26, 0.02], [0.10, 0.22, 0.12], cloakDark, { res: 0.03, rd: 0.04 });
      S.box([sx*0.18, 0.08, 0.08], [0.14, 0.08, 0.20], leather, { res: 0.03, rd: 0.04 });
    }
    // cloak skirt, tapered from waist to hem
    S.lathe([0, 0.30, 0], 0.58, t => 0.28 + 0.30*(1-t), cloak, { res: 0.035 });
    // chest and shoulders
    S.ball([0, 1.18, 0], [0.40, 0.42, 0.30], cloak, { res: 0.03, rd: 0.09 });
    S.box([-0.40, 1.36, 0], [0.22, 0.20, 0.25], cloakDark, { res: 0.03, rd: 0.06 });
    S.box([0.40, 1.36, 0], [0.22, 0.20, 0.25], cloakDark, { res: 0.03, rd: 0.06 });
    // arms, hands
    S.tube([[-0.44,1.30,0.02],[-0.52,0.92,0.10],[-0.50,0.65,0.18]], 0.115, 0.085, cloak, { res: 0.025 });
    S.tube([[0.44,1.30,0.02],[0.52,0.92,0.10],[0.50,0.65,0.18]], 0.115, 0.085, cloak, { res: 0.025 });
    S.ball([-0.50,0.60,0.20], 0.09, skin, { res: 0.02 });
    S.ball([0.50,0.60,0.20], 0.09, skin, { res: 0.02 });
    // neck / head
    S.tube([[0,1.48,0.02],[0,1.78,0.05]], 0.13, 0.12, cloakDark, { res: 0.02 });
    // hood base; only a face plate catches the light
    S.ball([0,2.00,0.02], [0.34,0.38,0.32], cloakDark, { res: 0.025, rd: 0.05 });
    S.ball([0,1.98,0.25], [0.205,0.225,0.075], { r: [0,1,2] }, { res: 0.02 });
    // hood rim and cowl
    S.tube([[-0.30,2.10,0.16],[-0.34,1.96,0.28],[-0.25,1.78,0.30]], 0.075, 0.065, cloakDark, { res: 0.018 });
    S.tube([[0.30,2.10,0.16],[0.34,1.96,0.28],[0.25,1.78,0.30]], 0.075, 0.065, cloakDark, { res: 0.018 });
    // fringe across the forehead
    S.tube([[-0.24,2.14,0.27],[-0.10,2.10,0.34],[0.04,2.08,0.34],[0.22,2.13,0.27]], 0.06, 0.045, hair, { res: 0.018 });
    // eyes / mouth
    S.ball([-0.09,1.99,0.34], [0.045,0.035,0.012], { r: [15], em: true }, { res: 0.010 });
    S.ball([0.09,1.99,0.34], [0.045,0.035,0.012], { r: [15], em: true }, { res: 0.010 });
    S.ball([0,1.88,0.325], [0.032,0.010,0.006], { r: [6,7] }, { res: 0.010 });
    // scarf / cowl
    S.tube([[-0.32,1.62,0.08],[0,1.55,0.16],[0.32,1.62,0.08]], 0.13, 0.10, scarf, { res: 0.025 });
    S.tube([[0.28,1.58,0.08],[0.36,1.30,0.15],[0.50,1.08,0.12]], 0.10, 0.045, scarf, { res: 0.02 });
    // belt and buckle
    S.tube([[-0.38,1.02,0.0],[0,1.02,0.22],[0.38,1.02,0.0]], 0.09, 0.08, leather, { res: 0.02 });
    S.box([0,1.02,0.22], [0.08,0.07,0.03], { r: [14,15] }, { res: 0.015 });
    // short sword on back
    S.tube([[-0.18,0.72,-0.30],[0.24,1.92,-0.20]], 0.055, 0.022, metal, { res: 0.02 });
    S.tube([[-0.03,1.10,-0.25],[0.18,1.10,-0.20]], 0.045, 0.045, leather, { res: 0.02 });
    S.ball([0.38,2.14,-0.20], 0.045, { r: [14,15] }, { res: 0.012 });
    // small star charm
    S.ball([-0.27,1.34,0.26], 0.035, glow, { res: 0.01 });
    S.bake();
    return B.finish({ cam: { target: [0, 1.25, 0.05], dist: 4.5, pitch: 0.17, yaw: 0.30 }, detail: 16, dither: 0.25, radius: 4 });
  }
});
