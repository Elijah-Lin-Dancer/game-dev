module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-desert-palm', name: '沙棕', seed: 235,
  build(seed) {
    const P = [
      0x120c08, 0x2a1b10, 0x4c3320, 0x72502f, 0x9d7041, 0xc39860,
      0x1b3524, 0x295338, 0x3f7343, 0x6b9a4e, 0x9fbf60, 0xe0bd7f,
      0x70452a, 0x3a271a,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const trunk = { r: [1, 2, 3, 12] };
    const trunkLight = { r: [3, 4, 5] };
    const leaf = { r: [6, 7, 8] };
    const leafLight = { r: [8, 9, 10] };
    const date = { r: [11, 12, 5] };

    // leaning trunk with ring bands
    S.tube([[0, 0.02, 0], [-0.10, 0.65, 0.02], [0.05, 1.25, 0.03], [0.12, 1.95, 0.02]], 0.13, 0.085, trunk, { res: 0.025 });
    for (let i = 0; i < 8; i += 1) {
      const y = 0.20 + i * 0.22;
      S.ball([-0.02 + i * 0.018, y, 0.01], [0.15, 0.025, 0.10], trunkLight, { res: 0.012, rd: 0.01 });
    }
    // six broad fronds around the crown
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + 0.12;
      const endX = Math.cos(a) * 0.82;
      const endZ = Math.sin(a) * 0.40;
      const midX = Math.cos(a) * 0.42;
      const midZ = Math.sin(a) * 0.20;
      S.tube([[0.10, 1.96, 0.02], [midX, 2.14 + (i % 2) * 0.06, midZ], [endX, 1.86 - (i % 2) * 0.08, endZ]], 0.095, 0.018, i % 2 ? leaf : leafLight, { res: 0.015 });
      S.tube([[midX, 2.14 + (i % 2) * 0.06, midZ], [endX * 0.72, 1.72, endZ * 0.72]], 0.025, 0.008, leaf, { res: 0.010 });
    }
    // crown cap and date clusters
    S.ball([0.11, 1.98, 0.02], [0.24, 0.10, 0.18], leafLight, { res: 0.02 });
    for (const [x, z] of [[-0.28, 0.16], [0.34, 0.12], [-0.08, -0.22]]) {
      S.ball([x, 1.70, z], [0.11, 0.13, 0.10], date, { res: 0.015 });
    }
    S.bake();

    return B.finish({
      cam: { target: [0, 1.12, 0.02], dist: 6.3, pitch: 0.12, yaw: 0.18 },
      detail: 16, dither: 0.21, radius: 4,
    });
  },
});
