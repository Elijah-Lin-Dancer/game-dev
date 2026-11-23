module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'hub-forge-anvil', name: '锻造铁砧', seed: 91,
  build(seed) {
    const P = [
      0x0b0f12, 0x1a2227, 0x2b373e, 0x45545d, 0x6f7f85, 0xaeb8b5,
      0x3b271b, 0x5c3b25, 0x825638, 0xa9744b, 0xff8a3d, 0xffc45c,
      0xffebad
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const wood = { r: [6, 7, 8, 9] };
    const steel = { r: [1, 2, 3, 4] };
    const shine = { r: [4, 5] };
    const fire = { r: [10, 11, 12], em: true };
    const dark = { r: [0, 1] };

    // stump base
    S.box([0, 0.08, 0], [1.05, 0.16, 0.62], wood, { res: 0.03, rd: 0.05 });
    S.box([0, 0.24, 0], [0.78, 0.18, 0.46], { r: [6, 7, 8] }, { res: 0.03, rd: 0.05 });
    // anvil waist
    S.box([0, 0.42, 0], [0.52, 0.24, 0.32], steel, { res: 0.03, rd: 0.05 });
    S.box([0, 0.62, 0], [0.94, 0.20, 0.44], steel, { res: 0.03, rd: 0.05 });
    // top face and horn
    S.box([0, 0.76, 0], [1.05, 0.12, 0.52], shine, { res: 0.03, rd: 0.04 });
    S.tube([[0.48, 0.76, 0.06], [0.80, 0.76, 0.10], [1.06, 0.82, 0.12], [1.24, 0.94, 0.12]], 0.15, 0.035, steel, { res: 0.025 });
    // ledge and heel
    S.tube([[-0.52, 0.78, 0.24], [-0.56, 0.64, 0.34], [-0.50, 0.46, 0.34]], 0.09, 0.035, steel, { res: 0.02 });
    S.box([0, 0.90, 0], [0.28, 0.06, 0.35], dark, { res: 0.02, rd: 0.03 });
    // hot metal bar and sparks
    S.box([0.10, 0.90, 0.02], [0.56, 0.07, 0.14], fire, { res: 0.02, rd: 0.02 });
    S.ball([-0.30, 0.84, 0.26], 0.03, fire, { res: 0.008 });
    S.ball([0.48, 0.92, 0.22], 0.025, fire, { res: 0.008 });
    // hammer resting on top
    S.tube([[-0.42, 0.84, 0.26], [-0.16, 1.02, 0.22], [0.12, 1.14, 0.18]], 0.035, 0.025, wood, { res: 0.014 });
    S.box([0.18, 1.18, 0.18], [0.30, 0.18, 0.20], steel, { res: 0.025, rd: 0.04 });
    S.box([0.18, 1.18, 0.18], [0.22, 0.12, 0.22], shine, { res: 0.02, rd: 0.03 });
    S.bake();
    return B.finish({ cam: { target: [0.10, 0.62, 0.05], dist: 3.4, pitch: 0.24, yaw: 0.36 }, detail: 16, dither: 0.22, radius: 3 });
  }
});
