module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g2-bamboo-grove', name: '竹林竹丛', seed: 211,
  build(seed) {
    const P = [
      0x08120d, 0x14261a, 0x24452a, 0x386b38, 0x5f9a4b, 0x8cc466,
      0xc4df87, 0x2a1e14, 0x4a3220, 0x74502c, 0xe5d9a8
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const stalk = { r: [2, 3, 4] };
    const leaf = { r: [4, 5, 6] };
    const leafDark = { r: [2, 3, 4] };
    const node = { r: [6, 9] };
    const soil = { r: [7, 8] };
    const tip = { r: [6, 9], em: true };

    // Three staggered stems with nodes and leaf clusters.
    const stems = [
      { x: -0.38, h: 2.45, lean: -0.20, seed: 0.8 },
      { x: 0.05, h: 2.95, lean: 0.06, seed: 1.0 },
      { x: 0.44, h: 2.15, lean: 0.22, seed: 0.7 },
    ];
    stems.forEach((st, i) => {
      const pts = [];
      for (let n = 0; n < 5; n += 1) {
        const t = n / 4;
        pts.push([st.x + st.lean * t * t + Math.sin(t * 4.2 + i) * 0.035, 0.12 + st.h * t, 0.02 + Math.sin(t * 3.1 + i) * 0.03]);
      }
      S.tube(pts, 0.085, 0.055, stalk, { res: 0.018 });
      for (let n = 1; n < 5; n += 1) {
        const t = n / 5;
        S.box([st.x + st.lean * t * t, 0.12 + st.h * t, 0.02], [0.20, 0.045, 0.16], node, { res: 0.012, rd: 0.01 });
      }
      // leaves fan out near the top, alternating sides
      for (let n = 0; n < 7; n += 1) {
        const side = n % 2 ? 1 : -1;
        const t = 0.55 + (n % 4) * 0.11;
        const y = 0.12 + st.h * t;
        const x = st.x + st.lean * t * t + side * (0.10 + (n % 3) * 0.07);
        const z = 0.10 + (n % 2) * 0.13;
        S.ball([x, y, z], [0.16 + (n % 3) * 0.05, 0.035, 0.08], (n % 3 === 0) ? leafDark : leaf, { res: 0.018, rd: 0.02 });
        S.tube([[x - side * 0.02, y, z], [x + side * 0.10, y + 0.02, z + 0.02]], 0.018, 0.008, leafDark, { res: 0.008 });
      }
      S.ball([st.x + st.lean, 0.12 + st.h + 0.02, 0.02], [0.045, 0.09, 0.045], tip, { res: 0.01 });
    });
    // mossy soil clump and fallen leaves
    S.ball([0, 0.06, 0.08], [0.48, 0.09, 0.24], soil, { res: 0.03, rd: 0.03 });
    S.ball([-0.42, 0.08, 0.10], [0.18, 0.03, 0.07], leaf, { res: 0.01 });
    S.ball([0.48, 0.08, 0.09], [0.15, 0.03, 0.06], leafDark, { res: 0.01 });
    S.bake();

    return B.finish({
      cam: { target: [0, 1.45, 0.02], dist: 5.2, pitch: 0.14, yaw: 0.18 },
      detail: 16, dither: 0.22, radius: 4,
    });
  },
});
