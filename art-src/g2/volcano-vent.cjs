module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-volcano-vent', name: '熔岩裂口', seed: 242,
  build(seed) {
    const P = [
      0x080608, 0x151012, 0x281a1a, 0x3d2824, 0x5f3a2e, 0x88513a,
      0x1b1414, 0xff4e24, 0xff9138, 0xffd160, 0xfff0b0, 0x2a2222
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const rock = { r: [1, 2, 3] };
    const rim = { r: [3, 4, 5] };
    const ash = { r: [6, 11] };
    const lava = { r: [7, 8], em: true };
    const core = { r: [9, 10], em: true };

    // low broken rock ring around a bright pool
    S.ball([0, 0.02, 0.06], [0.72, 0.07, 0.34], ash, { res: 0.035, rd: 0.03 });
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      const x = Math.cos(a) * 0.58;
      const z = Math.sin(a) * 0.30;
      S.box([x, 0.12 + (i % 3) * 0.06, z], [0.22, 0.20 + (i % 2) * 0.08, 0.20], i % 2 ? rim : rock, { res: 0.02, rd: 0.03 });
    }
    S.ball([0, 0.08, 0.04], [0.38, 0.04, 0.20], lava, { res: 0.025 });
    S.ball([0, 0.10, 0.02], [0.20, 0.035, 0.11], core, { res: 0.02 });
    // lava spill to one side
    S.tube([[0.20, 0.08, 0.10], [0.38, 0.03, 0.16], [0.58, 0.02, 0.14]], 0.06, 0.018, lava, { res: 0.018 });
    // smoke/ash lumps
    S.ball([-0.34, 0.24, 0.10], [0.12, 0.10, 0.09], ash, { res: 0.02 });
    S.ball([0.36, 0.18, 0.15], [0.10, 0.07, 0.08], rock, { res: 0.02 });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.24, 0.02], dist: 4.2, pitch: 0.26, yaw: 0.16 },
      detail: 16, dither: 0.22, radius: 3,
    });
  },
});
