module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-desert-arch', name: '沙海旧门', seed: 221,
  build(seed) {
    const P = [
      0x120c08, 0x2b1b10, 0x4c2e1b, 0x71462a, 0x9a6538, 0xc68b4d,
      0xe0b06b, 0xf1cf91, 0x6b3f24, 0x3a2118, 0xffd08a
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stone = { r: [2, 3, 4] };
    const light = { r: [4, 5, 6] };
    const sand = { r: [6, 7, 8] };
    const dark = { r: [0, 1] };
    const glow = { r: [9, 10], em: true };

    // Wide broken gate: two weathered pillars, one lintel, rubble at feet.
    for (const sx of [-1, 1]) {
      S.box([sx * 1.15, 0.16, 0], [0.54, 0.30, 0.42], stone, { res: 0.04, rd: 0.05 });
      S.box([sx * 1.12, 0.95, 0], [0.44, 1.50, 0.34], stone, { res: 0.04, rd: 0.04 });
      S.box([sx * 1.08, 1.72, 0.01], [0.50, 0.12, 0.38], light, { res: 0.03, rd: 0.03 });
      // chipped top, deliberately uneven
      S.ball([sx * 1.02, 1.84, 0.02], [0.20, 0.10, 0.14], light, { res: 0.02 });
    }
    S.box([0, 1.91, 0], [1.98, 0.18, 0.38], stone, { res: 0.04, rd: 0.04 });
    S.box([0, 2.02, 0.01], [1.58, 0.10, 0.30], light, { res: 0.03, rd: 0.03 });
    // A broken notch in the lintel: subtract a rough ball.
    S.ball([0.42, 2.04, 0.18], [0.24, 0.12, 0.16], stone, { neg: true, res: 0.02 });
    // Sand drift and fallen blocks
    // Two irregular sand drifts at the feet instead of one flat beam across the opening.
    S.ball([-1.02, 0.06, 0.10], [0.26, 0.06, 0.18], sand, { res: 0.03, rd: 0.03 });
    S.ball([1.02, 0.05, 0.08], [0.22, 0.05, 0.16], sand, { res: 0.03, rd: 0.03 });
    S.box([-1.58, 0.10, 0.10], [0.30, 0.16, 0.26], stone, { res: 0.02, rd: 0.03 });
    S.box([1.60, 0.12, 0.08], [0.24, 0.20, 0.20], stone, { res: 0.02, rd: 0.03 });
    // A single warm rune still alive.
    S.ball([0, 1.54, 0.20], 0.045, glow, { res: 0.01 });
    S.tube([[-0.08, 1.50, 0.21], [0.08, 1.50, 0.21]], 0.012, 0.008, glow, { res: 0.006 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.20, 0.02], dist: 5.6, pitch: 0.13, yaw: 0.12 },
      detail: 16, dither: 0.24, radius: 4,
    });
  },
});
