module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'mossplate-armor', name: '苔纹护甲', seed: 61,
  build(seed) {
    const P = [
      0x0d1117, 0x1c2428, 0x303b3b, 0x4d5b4c, 0x73825e, 0xa6b077,
      0x4e3728, 0x78543a, 0xb48452, 0xe0b26a, 0xf6d99b, 0x24352b,
      0x405a40, 0x678055, 0xffc75e, 0xffe8ab
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const armor = { r: [2,3,4,5] };
    const dark = { r: [0,1,2] };
    const bronze = { r: [7,8,9,10] };
    const moss = { r: [11,12,13] };
    const glow = { r: [14,15], em: true };
    // main breastplate with a real neck opening
    const chest = S.ball([0,0.62,0], [0.72,0.80,0.32], armor, { hold: true, res: 0.045, rd: 0.13 });
    const neckHole = S.ball([0,1.48,0.05], [0.32,0.24,0.28], armor, { hold: true, res: 0.04 });
    S.join('cut', chest, neckHole, { res: 0.040 });
    // collar ring
    const ring = [];
    for (let i=0;i<=12;i++) { const a=i*Math.PI*2/12; ring.push([Math.cos(a)*0.33,1.39+Math.sin(a)*0.02,Math.sin(a)*0.26]); }
    S.tube(ring, 0.075, 0.055, bronze, { res: 0.018 });
    // dark inner collar
    S.ball([0,1.42,0.02], [0.26,0.10,0.24], dark, { res: 0.025 });
    // shoulder pads
    for (const sx of [-1,1]) {
      S.ball([sx*0.64,1.05,0.0], [0.34,0.26,0.30], { r: [2,3,4] }, { res: 0.03, rd: 0.10 });
      S.ball([sx*0.68,1.18,-0.01], [0.33,0.10,0.27], bronze, { res: 0.025 });
      S.rock([sx*0.58,1.27,0.04], [0.20,0.11,0.22], moss, { res: 0.025 });
    }
    // chest ridge and ribs
    S.tube([[0,1.14,0.30],[0,0.92,0.37],[0,0.62,0.38]], 0.055, 0.045, bronze, { res: 0.020 });
    for (const sx of [-1,1]) {
      S.tube([[sx*0.52,1.02,0.30],[sx*0.42,0.78,0.36],[sx*0.34,0.52,0.34]], 0.055, 0.04, { r: [3,4,5] }, { res: 0.018 });
    }
    // belt and lower plate
    S.tube([[-0.68,0.05,0.05],[0,0.02,0.34],[0.68,0.05,0.05]], 0.11, 0.08, { r: [0,1,2] }, { res: 0.020 });
    S.box([0,0.03,0.18], [0.20,0.10,0.08], bronze, { res: 0.020, rd: 0.04 });
    // moss seams
    S.rock([-0.30,0.75,0.32], [0.22,0.15,0.10], moss, { res: 0.025 });
    S.rock([0.26,0.45,0.33], [0.16,0.10,0.08], moss, { res: 0.025 });
    S.rock([0.02,1.22,0.20], [0.12,0.07,0.10], moss, { res: 0.020 });
    // glowing rune
    S.ball([0,0.76,0.37], 0.10, glow, { res: 0.015 });
    for (let i=0;i<6;i++) { const a=i*Math.PI/3; S.tube([[0,0.76,0.39],[Math.cos(a)*0.17,0.76+Math.sin(a)*0.17,0.39]],0.024,0.006,glow,{res:0.010}); }
    // rivets
    for (const sx of [-1,1]) for (const y of [1.10,0.88,0.62]) S.ball([sx*0.63,y,0.28],0.035,bronze,{res:0.012});
    S.bake();
    return B.finish({ cam: { target: [0, 0.58, 0], dist: 3.0, pitch: 0.12, yaw: 0.38 }, detail: 16, dither: 0.24, radius: 3 });
  }
});
