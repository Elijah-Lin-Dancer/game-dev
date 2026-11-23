module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'hub-merchant', name: '商人', seed: 81,
  build(seed) {
    const P = [
      0x0b1211, 0x172622, 0x233a33, 0x365a4c, 0x5d8266, 0x91ad7e,
      0x5b3f2c, 0x8a6240, 0xb68552, 0xd9a86a, 0xefe0c2, 0x2c3a44,
      0x4a6970, 0x7fb4a2, 0xd9b866, 0xffd479, 0xffe6a8
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const cloak = { r: [1, 2, 3] };
    const cloakLight = { r: [3, 4, 5] };
    const leather = { r: [6, 7, 8] };
    const skin = { r: [8, 9, 10] };
    const scarf = { r: [12, 13] };
    const pack = { r: [3, 4, 6] };
    const gold = { r: [14, 15] };
    const glow = { r: [15, 16], em: true };
    const dark = { r: [0, 1, 2] };

    // slim boots and cloak skirt
    for (const sx of [-1, 1]) {
      S.box([sx * 0.16, 0.10, 0.04], [0.13, 0.10, 0.22], leather, { res: 0.03, rd: 0.04 });
    }
    S.lathe([0, 0.18, 0], 0.82, t => 0.23 + 0.24 * (1 - t), cloak, { res: 0.032 });
    // torso and shoulder wrap
    S.ball([0, 1.08, 0.02], [0.34, 0.40, 0.27], cloak, { res: 0.028, rd: 0.08 });
    S.tube([[-0.38, 1.30, 0.04], [0, 1.36, 0.14], [0.38, 1.30, 0.04]], 0.11, 0.10, cloakLight, { res: 0.024 });
    // arms and hands
    S.tube([[-0.34, 1.22, 0.04], [-0.48, 0.92, 0.12], [-0.44, 0.68, 0.22]], 0.095, 0.07, cloak, { res: 0.022 });
    S.tube([[0.34, 1.22, 0.04], [0.47, 0.94, 0.12], [0.44, 0.70, 0.24]], 0.095, 0.07, cloak, { res: 0.022 });
    S.ball([-0.44, 0.64, 0.22], 0.075, skin, { res: 0.018 });
    S.ball([0.44, 0.66, 0.24], 0.075, skin, { res: 0.018 });
    // big hood and face slot
    S.tube([[0, 1.42, 0.02], [0, 1.64, 0.04]], 0.115, 0.10, cloak, { res: 0.02 });
    S.ball([0, 1.88, 0.02], [0.37, 0.40, 0.33], cloak, { res: 0.024, rd: 0.05 });
    S.ball([0, 1.86, 0.28], [0.20, 0.22, 0.08], dark, { res: 0.018 });
    // hood rim and scarf across mouth
    S.tube([[-0.30, 2.02, 0.12], [-0.36, 1.86, 0.28], [-0.26, 1.68, 0.32]], 0.065, 0.055, cloak, { res: 0.018 });
    S.tube([[0.30, 2.02, 0.12], [0.36, 1.86, 0.28], [0.26, 1.68, 0.32]], 0.065, 0.055, cloak, { res: 0.018 });
    S.tube([[-0.26, 1.66, 0.28], [0, 1.60, 0.36], [0.26, 1.66, 0.28]], 0.075, 0.05, scarf, { res: 0.018 });
    S.ball([-0.075, 1.87, 0.35], [0.032, 0.028, 0.01], glow, { res: 0.008 });
    S.ball([0.075, 1.87, 0.35], [0.032, 0.028, 0.01], glow, { res: 0.008 });
    // scarf tail
    S.tube([[0.24, 1.58, 0.16], [0.38, 1.30, 0.12], [0.50, 1.08, 0.06]], 0.08, 0.035, scarf, { res: 0.02 });
    // waist sash and coin pouch
    S.tube([[-0.32, 0.96, 0.02], [0, 0.98, 0.18], [0.32, 0.96, 0.02]], 0.07, 0.06, leather, { res: 0.018 });
    S.ball([0.28, 0.82, 0.20], [0.12, 0.14, 0.08], gold, { res: 0.02 });
    S.ball([0.28, 0.82, 0.27], 0.025, glow, { res: 0.008 });
    // huge travel pack on the back
    S.box([0, 1.10, -0.34], [0.52, 0.64, 0.28], pack, { res: 0.035, rd: 0.06 });
    S.box([0, 1.42, -0.34], [0.42, 0.18, 0.22], leather, { res: 0.03, rd: 0.04 });
    S.tube([[-0.24, 1.40, -0.20], [0, 1.28, 0.04], [0.24, 1.40, -0.20]], 0.028, 0.022, leather, { res: 0.012 });
    S.tube([[0.34, 0.96, -0.26], [0.44, 0.68, -0.20]], 0.032, 0.025, leather, { res: 0.012 });
    // rolled map / ledger tube
    S.tube([[-0.40, 0.68, -0.18], [-0.54, 1.18, -0.12]], 0.07, 0.07, { r: [8, 9, 10] }, { res: 0.018 });
    S.ball([-0.54, 1.20, -0.12], 0.035, gold, { res: 0.01 });
    // staff with a small lantern
    S.tube([[0.46, 0.10, 0.20], [0.50, 0.82, 0.18], [0.46, 1.48, 0.12], [0.50, 1.90, 0.06]], 0.035, 0.022, leather, { res: 0.014 });
    S.box([0.50, 1.96, 0.06], [0.16, 0.20, 0.14], gold, { res: 0.018 });
    S.box([0.50, 1.96, 0.07], [0.09, 0.12, 0.10], glow, { res: 0.012 });
    S.bake();
    return B.finish({ cam: { target: [0, 1.18, 0.05], dist: 4.8, pitch: 0.17, yaw: -0.30 }, detail: 16, dither: 0.24, radius: 4 });
  }
});
