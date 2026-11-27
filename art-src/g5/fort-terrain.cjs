/* 旧堡地形套件 / Fort terrain kit
 * ink-studio 离线源：32px 格子的地面板与墙体块。逻辑碰撞仍走 game 的 32px walls。
 * 视觉只做预渲染：4×4 地面变体板（128×128）、4 帧墙体（128×32）、墙脚阴影。
 * seed 4207 固定色板与裂缝分布。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => {
  const P = [
    0x070404, 0x150c08, 0x241610, 0x332018, 0x422a1e, 0x523424,
    0x64402b, 0x7a4e34, 0x966247, 0xb8805a, 0x6a2418, 0xb84a2c,
    0x2a2018, 0xd8b48c,
    0x4a4238, 0x807260, 0x322b24,
  ];
  const mats = {
    dark: { r: [1, 2] },
    stone: { r: [3, 4, 5] },
    stoneWarm: { r: [4, 5, 6] },
    light: { r: [6, 7] },
    chip: { r: [7, 8] },
    rust: { r: [10, 11] },
    slate: { r: [14] },
    slateLight: { r: [15] },
    slateDark: { r: [16] },
  };
  const hash = (x, z, s) => (x * 17 + z * 29 + s * 7) % 11;

  function floor() {
    const B = makeBuilder(4207, P);
    const S = K.sculpt(makeSculpt(B));
    const { dark, stone, stoneWarm, light, chip, rust } = mats;
    // 深色勾缝底板：保证 4×4 板外沿与块间都是暗缝。
    S.box([0, -0.08, 0], [4.0, 0.08, 4.0], dark, { res: 0.030 });
    // 8×8 变体：256×256 图集切片，降低 4×4 在大房间里的重复感。
    for (let iz = 0; iz < 8; iz += 1) {
      for (let ix = 0; ix < 8; ix += 1) {
        const x = ix - 3.5, z = iz - 3.5, h = hash(ix, iz, 4207);
        S.box([x, -0.005, z], [0.458, 0.030, 0.458], (ix + iz) % 3 === 0 ? stoneWarm : stone, { res: 0.018, rd: 0.006 });
        if (h < 2) S.box([x - 0.30, 0.036, z - 0.32], [0.10, 0.003, 0.028], chip, { res: 0.005 });
        if (h > 8) S.box([x + 0.26, 0.036, z + 0.26], [0.08, 0.003, 0.035], dark, { res: 0.005 });
        if (h % 4 === 0) S.box([x, 0.035, z + 0.12], [0.36, 0.003, 0.012], dark, { res: 0.005 });
        if (h % 5 === 1) S.tube([[x + 0.08, 0.037, z + 0.24], [x + 0.18, 0.037, z + 0.10], [x + 0.28, 0.037, z - 0.08]], 0.007, 0.005, rust, { res: 0.004 });
      }
    }
    S.bake();
    return B.finish({ cam: { target: [0, 0, 0], dist: 20, pitch: 1.55, yaw: 0 }, detail: 12 });
  }

  function wall(variant) {
    const B = makeBuilder(4207, P);
    const S = K.sculpt(makeSculpt(B));
    const { dark, stone, stoneWarm, light, chip, slate, slateLight, slateDark } = mats;
    // 暗色底块只作为 32px 内的勾缝，墙体本身缩进 0.40。
    S.box([0, -0.055, 0], [0.488, 0.055, 0.488], dark, { res: 0.024 });
    S.box([0, 0.52, 0], [0.400, 0.52, 0.400], slate, { res: 0.022, rd: 0.035 });
    S.box([0, 1.00, 0], [0.350, 0.08, 0.350], slateLight, { res: 0.012, rd: 0.018 });
    // 正面（南侧）受光的下唇，给墙体一个明确的立面。
    S.box([0, 0.38, 0.405], [0.330, 0.28, 0.025], slateDark, { res: 0.012, rd: 0.008 });
    S.box([0, 0.24, 0.410], [0.300, 0.05, 0.012], slateLight, { res: 0.008 });
    // 顶面裂口与边角缺口，四个变体错开。
    if (variant % 2 === 0) S.tube([[-0.24, 1.088, 0.10], [-0.02, 1.088, -0.02], [0.22, 1.088, 0.14]], 0.011, 0.006, dark, { res: 0.005 });
    if (variant > 1) S.box([-0.28, 1.086, -0.27], [0.12, 0.004, 0.055], dark, { res: 0.005 });
    if (variant === 3) S.box([0.24, 1.086, 0.23], [0.08, 0.004, 0.05], chip, { res: 0.005 });
    S.bake();
    return B.finish({ cam: { target: [0, 0.52, 0], dist: 20, pitch: 1.30, yaw: 0 }, detail: 12 });
  }

  return {
    id: 'fort-terrain', name: '旧堡地形套件', seed: 4207,
    build(seed, part = 'floor') {
      return part === 'floor' ? floor() : wall(Number(part));
    },
  };
};
