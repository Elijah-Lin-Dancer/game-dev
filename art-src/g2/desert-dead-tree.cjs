module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-desert-dead-tree', name: '枯沙木', seed: 222,
  build(seed) {
    const P = [
      0x120c08, 0x2a1b11, 0x4d3120, 0x725033, 0x9a7048, 0xc29a66,
      0xe0c28a, 0x6b452b, 0x3a271a, 0x261810
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const bark = { r: [1, 2, 3] };
    const barkLight = { r: [3, 4, 5] };
    const dead = { r: [4, 5, 6] };
    const root = { r: [7, 8] };

    // gnarled trunk leaning in the wind
    S.tube([[0, 0.06, 0.02], [-0.08, 0.65, 0.03], [-0.02, 1.25, 0.02], [0.12, 1.88, 0.01]], 0.18, 0.09, bark, { res: 0.03 });
    S.tube([[0.12, 1.88, 0.01], [0.34, 2.16, 0.01], [0.48, 2.42, 0.00]], 0.09, 0.025, dead, { res: 0.02 });
    // branches: one long arm left, one broken short right
    S.tube([[-0.02, 1.35, 0.02], [-0.42, 1.55, 0.03], [-0.76, 1.72, 0.02], [-1.02, 1.92, 0.00]], 0.075, 0.022, barkLight, { res: 0.02 });
    S.tube([[-0.76, 1.72, 0.02], [-0.78, 1.94, 0.01], [-0.96, 2.08, 0.00]], 0.04, 0.012, dead, { res: 0.012 });
    S.tube([[0.12, 1.12, 0.02], [0.48, 1.30, 0.03], [0.76, 1.40, 0.01]], 0.065, 0.020, barkLight, { res: 0.02 });
    S.tube([[0.76, 1.40, 0.01], [0.94, 1.56, 0.00]], 0.036, 0.010, dead, { res: 0.01 });
    // roots and a dry halo of thorns
    S.ball([0, 0.06, 0.04], [0.48, 0.07, 0.24], root, { res: 0.03, rd: 0.03 });
    for (let i = 0; i < 5; i += 1) {
      const a = -0.9 + i * 0.45;
      S.tube([[Math.cos(a) * 0.28, 0.06, Math.sin(a) * 0.18],
        [Math.cos(a) * 0.52, 0.02, Math.sin(a) * 0.30]], 0.025, 0.008, root, { res: 0.01 });
    }
    S.bake();

    return B.finish({
      cam: { target: [0, 1.20, 0.02], dist: 5.3, pitch: 0.14, yaw: 0.18 },
      detail: 16, dither: 0.24, radius: 4,
    });
  },
});
