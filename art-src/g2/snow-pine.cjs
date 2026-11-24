module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-snow-pine', name: '雪松', seed: 231,
  build(seed) {
    const P = [
      0x071019, 0x111f2b, 0x20384a, 0x345267, 0x527489, 0x809b9f,
      0xb9cac2, 0xdce9df, 0xf7fbf0, 0x18221d, 0x2b392b, 0x7a5a3b
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const trunk = { r: [9, 10, 11] };
    const pine = { r: [1, 2, 3] };
    const pineLight = { r: [3, 4, 5] };
    const snow = { r: [7, 8, 9] };
    const snowBlue = { r: [5, 6, 7] };

    // trunk and root flare
    S.tube([[0, 0.05, 0.04], [0, 0.55, 0.02], [-0.03, 1.45, 0.01]], 0.12, 0.07, trunk, { res: 0.025 });
    S.ball([0, 0.05, 0.06], [0.26, 0.05, 0.16], snowBlue, { res: 0.025, rd: 0.02 });
    // stacked conical branches
    const tiers = [
      { y: 0.42, r: 0.72, h: 0.42 },
      { y: 0.92, r: 0.58, h: 0.42 },
      { y: 1.42, r: 0.43, h: 0.38 },
      { y: 1.87, r: 0.28, h: 0.34 },
    ];
    tiers.forEach((t, i) => {
      S.lathe([0, t.y, 0.01], t.h, p => t.r * (1 - p) + 0.02, pine, { res: 0.035 });
      S.lathe([0, t.y + 0.03, 0.01], t.h * 0.38, p => (t.r - 0.04) * (1 - p) + 0.02, pineLight, { res: 0.03 });
      // snow shelf along the top of each tier: flattened balls, asymmetric
      for (let n = 0; n < 5; n += 1) {
        const a = (n / 5) * Math.PI * 2 + i * 0.38;
        const x = Math.cos(a) * (t.r - 0.06) * 0.72;
        const z = Math.sin(a) * (t.r - 0.06) * 0.42;
        S.ball([x, t.y + t.h * 0.74, z], [0.16, 0.045, 0.12], n % 3 === 0 ? snowBlue : snow, { res: 0.02, rd: 0.02 });
      }
    });
    // star-like top, a single bright snow cap
    S.ball([0, 2.22, 0.01], [0.13, 0.16, 0.12], snow, { res: 0.02 });
    S.ball([0, 2.36, 0.01], [0.045, 0.09, 0.04], { r: [8, 9], em: true }, { res: 0.01 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.22, 0.02], dist: 5.4, pitch: 0.13, yaw: 0.16 },
      detail: 16, dither: 0.21, radius: 4,
    });
  },
});
