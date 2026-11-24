module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-volcano-lava', name: '熔岩池', seed: 245,
  build(seed) {
    const P = [
      0x080606, 0x16100e, 0x2a1b16, 0x40251b, 0x5c3120,
      0x7d3a20, 0xff4a22, 0xff7a2e, 0xffb64a, 0xffe08a, 0x1e1a18,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const crust = { r: [2, 3, 4] };
    const rim = { r: [4, 5, 10] };
    const lava = { r: [6, 7], em: true };
    const hot = { r: [8, 9], em: true };

    // wide, flat lava pool with a broken basalt rim
    S.ball([0, 0.03, 0.02], [0.92, 0.10, 0.48], lava, { res: 0.035, rd: 0.04 });
    S.ball([0, 0.09, 0.03], [0.70, 0.05, 0.36], hot, { res: 0.03, rd: 0.03 });
    S.ball([-0.52, 0.12, 0.14], [0.24, 0.08, 0.14], crust, { res: 0.025, rd: 0.03 });
    S.ball([0.56, 0.11, 0.10], [0.20, 0.06, 0.12], crust, { res: 0.02, rd: 0.02 });
    S.box([-0.82, 0.10, 0.02], [0.22, 0.16, 0.12], rim, { res: 0.02, rd: 0.03 });
    S.box([0.84, 0.09, 0.04], [0.16, 0.12, 0.10], rim, { res: 0.02, rd: 0.02 });
    S.tube([[-0.60, 0.08, 0.30], [-0.18, 0.04, 0.34], [0.30, 0.06, 0.32]], 0.025, 0.010, crust, { res: 0.012 });
    // three slow bubbles and a splash at the edge
    S.ball([-0.20, 0.16, 0.16], [0.10, 0.06, 0.08], hot, { res: 0.015 });
    S.ball([0.22, 0.18, 0.12], [0.07, 0.05, 0.06], hot, { res: 0.012 });
    S.ball([0.44, 0.12, 0.24], [0.05, 0.10, 0.04], lava, { res: 0.008 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.24, 0.04], dist: 4.6, pitch: 0.20, yaw: 0.12 },
      detail: 16, dither: 0.24, radius: 4,
    });
  },
});
