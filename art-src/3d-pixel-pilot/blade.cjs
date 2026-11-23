module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'starfall-blade', name: '星火短刃', seed: 51,
  build(seed) {
    const P = [
      0x0d1117, 0x1b2430, 0x33445a, 0x566a82, 0x91a3b5, 0xdce3df,
      0x4a2e24, 0x714632, 0xa56a46, 0xd4a35f, 0xf3d28a, 0x2d3b32,
      0x4f6b4f, 0x8fa66b, 0xffc45c, 0xffe6a8
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const steel = { r: [2,3,4,5] };
    const edge = { r: [4,5] };
    const gold = { r: [9,10,14] };
    const leather = { r: [6,7,8] };
    const glow = { r: [14,15], em: true };
    // blade, lower-left to upper-right
    S.tube([[-0.30,-0.48,0.02],[-0.12,-0.10,0.02],[0.08,0.45,0.02],[0.30,0.98,0.02],[0.48,1.48,0.02]], 0.13, 0.018, steel, { res: 0.018 });
    S.tube([[-0.29,-0.40,0.055],[-0.08,0.02,0.055],[0.15,0.60,0.055],[0.36,1.18,0.055]], 0.020, 0.008, edge, { res: 0.012 });
    // glowing fuller / rune
    S.tube([[-0.24,-0.20,0.07],[0.02,0.40,0.07],[0.28,1.05,0.07]], 0.022, 0.012, glow, { res: 0.010 });
    S.ball([0.45,1.48,0.02], 0.035, { r: [5] }, { res: 0.010 });
    // guard: perpendicular to blade, gold
    S.tube([[-0.58,-0.47,-0.015],[-0.40,-0.53,-0.015],[-0.18,-0.59,-0.015],[0.02,-0.65,-0.015]], 0.12, 0.06, gold, { res: 0.018 });
    S.ball([-0.46,-0.56,0.06], 0.055, glow, { res: 0.012 });
    S.ball([-0.12,-0.62,0.06], 0.045, glow, { res: 0.012 });
    // grip and pommel
    S.tube([[-0.38,-0.55,-0.02],[-0.50,-0.78,-0.02],[-0.61,-1.02,-0.02]], 0.09, 0.075, leather, { res: 0.018 });
    S.ball([-0.65,-1.10,-0.02], 0.09, gold, { res: 0.015 });
    S.ball([-0.65,-1.10,0.08], 0.025, glow, { res: 0.010 });
    // small star charm
    for (let i=0;i<4;i++) { const a=i*Math.PI/2; S.tube([[0,0.30,0.12],[Math.cos(a)*0.16,0.30+Math.sin(a)*0.16,0.12]],0.018,0.004,glow,{res:0.008}); }
    S.bake();
    return B.finish({ cam: { target: [0, 0.15, 0], dist: 3.3, pitch: 0.10, yaw: 0.18 }, detail: 16, dither: 0.24, radius: 3 });
  }
});
