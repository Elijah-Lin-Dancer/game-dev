module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-volcano-forge', name: '熔岩锻炉', seed: 242,
  build(seed) {
    const P = [
      0x080606, 0x140e0d, 0x241816, 0x3a2620, 0x56382d, 0x744a36,
      0x8f5d3e, 0x1f1a18, 0x35302b, 0x6e6760, 0xff552e, 0xff9a3c,
      0xffdf7a, 0x2b1712,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stone = { r: [1, 2, 3] };
    const stoneLight = { r: [4, 5, 6] };
    const metal = { r: [8, 9] };
    const dark = { r: [0, 1] };
    const hot = { r: [10, 11], em: true };
    const hotCore = { r: [11, 12], em: true };
    const soot = { r: [7, 8] };
    const brick = { r: [3, 4, 13] };

    // stepped basalt plinth
    S.box([0, 0.10, 0], [1.56, 0.20, 0.70], stone, { res: 0.04, rd: 0.05 });
    S.box([0, 0.24, 0], [1.28, 0.14, 0.56], stoneLight, { res: 0.035, rd: 0.04 });
    // two thick side walls and a sooty back wall
    for (const sx of [-1, 1]) {
      S.box([sx * 0.62, 0.78, 0], [0.34, 1.20, 0.52], stone, { res: 0.04, rd: 0.04 });
      S.box([sx * 0.62, 1.42, 0], [0.40, 0.12, 0.56], stoneLight, { res: 0.03, rd: 0.03 });
    }
    S.box([0, 0.78, -0.24], [1.00, 1.16, 0.18], soot, { res: 0.035, rd: 0.03 });
    // lintel and a low roof
    S.box([0, 1.38, 0], [1.46, 0.16, 0.62], brick, { res: 0.035, rd: 0.04 });
    S.box([0, 1.50, 0], [1.28, 0.10, 0.50], stoneLight, { res: 0.03, rd: 0.03 });
    // chimney, offset to the right and open at the top
    S.box([0.38, 1.82, -0.10], [0.34, 0.70, 0.30], soot, { res: 0.03, rd: 0.03 });
    S.box([0.38, 2.18, -0.10], [0.44, 0.12, 0.38], stoneLight, { res: 0.03, rd: 0.03 });
    S.box([0.38, 2.26, -0.10], [0.20, 0.05, 0.18], dark, { res: 0.02, rd: 0.02 });
    // glowing forge mouth
    S.box([0, 0.54, 0.31], [0.58, 0.56, 0.08], dark, { res: 0.02, rd: 0.02 });
    S.box([0, 0.42, 0.36], [0.46, 0.20, 0.05], hot, { res: 0.02, rd: 0.02 });
    S.box([0, 0.34, 0.37], [0.30, 0.08, 0.04], hotCore, { res: 0.015, rd: 0.015 });
    // anvil and hammer by the door
    S.box([0.92, 0.32, 0.34], [0.34, 0.16, 0.18], metal, { res: 0.02, rd: 0.03 });
    S.box([0.92, 0.16, 0.34], [0.12, 0.20, 0.12], metal, { res: 0.02, rd: 0.02 });
    S.tube([[1.06, 0.28, 0.44], [1.12, 0.64, 0.46]], 0.030, 0.022, dark, { res: 0.01 });
    S.box([1.12, 0.68, 0.46], [0.16, 0.10, 0.08], metal, { res: 0.015, rd: 0.02 });
    // slag heap and a few embers at the base
    S.ball([-0.78, 0.12, 0.28], [0.30, 0.08, 0.18], soot, { res: 0.025, rd: 0.03 });
    S.ball([-0.62, 0.20, 0.31], 0.045, hot, { res: 0.01 });
    S.ball([0.18, 0.18, 0.40], 0.032, hotCore, { res: 0.008 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.18, 0.02], dist: 5.9, pitch: 0.14, yaw: 0.16 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
