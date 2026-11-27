/* 旧堡第 1 关 Boss：蓝武士 / Blue Samurai
 * ink-studio 离线源。旧堡的守门人：重甲、长兜、金前立、双刀。
 * 造型优先读剪影：高兜角、宽肩窄腰、长刀斜线、背旗红缨。
 * pose: idle / walk / slash / charge / roar；同一 seed 保甲片、金饰、刀身连续。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'fort-samurai-blue', name: '蓝武士', seed: 3901,
  build(seed, pose = 'idle') {
    const P = [
      0x05070b, 0x0a111a, 0x142433, 0x20384c, 0x31586f, 0x477d93,
      0x6fa8b5, 0xa8d2d3, 0xd8efea, 0xf7fff8,
      0x5b371b, 0x95602a, 0xd09942, 0xffd77a,
      0x561b22, 0xa52f3a, 0xe06054,
      0x80543b, 0xc59470,
      0x6de2ff, 0xd6ffff
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const ink = { r: [0, 1] };
    const cloth = { r: [1, 2, 3] };
    const clothLight = { r: [3, 4, 5] };
    const steelDark = { r: [3, 4] };
    const steel = { r: [4, 5, 6] };
    const steelLight = { r: [6, 7, 8] };
    const pale = { r: [8, 9] };
    const goldDark = { r: [10, 11] };
    const gold = { r: [11, 12] };
    const goldLight = { r: [12, 13], em: true };
    const redDark = { r: [14] };
    const red = { r: [15, 16] };
    const skin = { r: [17, 18] };
    const eye = { r: [19], em: true };
    const eyeHot = { r: [20], em: true };

    const walk = pose === 'walk';
    const slash = pose === 'slash';
    const charge = pose === 'charge';
    const roar = pose === 'roar';
    const crouch = charge ? -0.16 : 0;
    const hipY = 0.90 + crouch;
    const chestY = 1.24 + crouch;
    const shoulderY = 1.54 + crouch;
    const headY = 1.92 + crouch;
    const lean = slash ? 0.06 : (charge ? 0.12 : 0);
    const stride = walk ? 0.14 : (charge ? 0.10 : 0);

    // 脚：宽底足甲；前脚随 walk / charge 前探。
    for (const sx of [-1, 1]) {
      const z = sx > 0 ? 0.10 + stride : -0.12 - stride * 0.4;
      S.box([sx * 0.27, 0.09, z], [0.22, 0.14, 0.36], steelDark, { res: 0.020, rd: 0.035 });
      S.box([sx * 0.27, 0.14, z + 0.03], [0.19, 0.10, 0.26], steel, { res: 0.016, rd: 0.03 });
      S.box([sx * 0.27, 0.055, z + 0.20], [0.19, 0.032, 0.08], gold, { res: 0.010, rd: 0.02 });
      S.box([sx * 0.27, 0.24, z + 0.01], [0.24, 0.10, 0.18], steelDark, { res: 0.014, rd: 0.025 });
    }

    // 腿：袴 + 胫甲；裤色比甲片浅，避免下半身糊成黑块。
    for (const sx of [-1, 1]) {
      const z = sx > 0 ? 0.08 + stride : -0.08 - stride * 0.4;
      S.tube([
        [sx * 0.16, hipY, z],
        [sx * 0.25, 0.56 + crouch * 0.6, z + 0.04],
        [sx * 0.27, 0.24, z + 0.03],
      ], 0.155, 0.095, clothLight, { res: 0.022 });
      S.box([sx * 0.26, 0.44 + crouch * 0.6, z + 0.13], [0.15, 0.10, 0.07], steel, { res: 0.010, rd: 0.015 });
      S.box([sx * 0.27, 0.29, z + 0.14], [0.14, 0.06, 0.06], steelLight, { res: 0.009, rd: 0.012 });
      S.box([sx * 0.27, 0.20, z + 0.15], [0.13, 0.045, 0.05], goldDark, { res: 0.008, rd: 0.01 });
    }

    // 腰：黑带 + 三片草摺，正面给出横向层次。
    S.tube([[-0.32, hipY, 0.02], [0, hipY - 0.03, 0.18], [0.32, hipY, 0.02]], 0.09, 0.075, ink, { res: 0.018 });
    for (let i = 0; i < 3; i += 1) {
      const y = hipY - 0.12 - i * 0.10;
      S.box([0, y, 0.16 + i * 0.012], [0.46 + i * 0.04, 0.07, 0.09], i === 1 ? steel : steelDark, { res: 0.010, rd: 0.015 });
      S.box([0, y + 0.012, 0.215 + i * 0.012], [0.32 + i * 0.03, 0.016, 0.02], goldDark, { res: 0.005 });
    }
    // 宽下摆：只到膝上，别把腿全遮住
    S.lathe([0, 0.44, 0], 0.58, t => 0.24 + 0.10 * (1 - t), clothLight, { res: 0.026 });

    // 胸甲：下腹深色，胸口亮钢；金色家纹落在正中。
    S.ball([0, chestY, lean], [0.33, 0.34, 0.24], steelDark, { res: 0.024, rd: 0.055 });
    S.box([0, chestY + 0.04, 0.20 + lean], [0.38, 0.31, 0.11], steelDark, { res: 0.018, rd: 0.035 });
    S.box([0, chestY + 0.08, 0.27 + lean], [0.31, 0.24, 0.07], steel, { res: 0.015, rd: 0.03 });
    S.box([0, chestY + 0.20, 0.26 + lean], [0.24, 0.035, 0.025], steelLight, { res: 0.006 });
    S.box([0, chestY + 0.03, 0.335 + lean], [0.10, 0.10, 0.014], goldDark, { res: 0.006 });
    S.box([0, chestY + 0.03, 0.345 + lean], [0.048, 0.048, 0.012], goldLight, { res: 0.005 });
    S.ball([0, chestY + 0.03, 0.36 + lean], [0.016, 0.016, 0.006], eye, { res: 0.003 });
    // 腰腹两侧的青色甲片
    for (const sx of [-1, 1]) {
      S.box([sx * 0.26, chestY - 0.04, 0.20 + lean], [0.08, 0.16, 0.05], steel, { res: 0.008, rd: 0.012 });
      // 侧胸板：3D 四向里侧视也要读成甲胄，不能只看到深色内衬
      S.box([sx * 0.31, chestY + 0.04, lean - 0.02], [0.06, 0.26, 0.24], steelDark, { res: 0.012, rd: 0.02 });
      S.box([sx * 0.335, chestY + 0.06, lean + 0.04], [0.018, 0.20, 0.03], goldDark, { res: 0.004 });
      // 侧腰草摺：把深色下摆切出甲片层次
      S.box([sx * 0.29, hipY - 0.20, 0.02], [0.08, 0.22, 0.26], steel, { res: 0.010, rd: 0.018 });
      S.box([sx * 0.33, hipY - 0.22, 0.06], [0.016, 0.16, 0.03], goldDark, { res: 0.004 });
    }

    // 肩甲：外翘两层，短金棘；正面最宽，给头部留空隙。
    for (const sx of [-1, 1]) {
      const y = shoulderY;
      S.ball([sx * 0.40, y + 0.02, lean], [0.18, 0.10, 0.20], steelDark, { res: 0.016, rd: 0.03 });
      S.box([sx * 0.40, y - 0.03, 0.10 + lean], [0.28, 0.10, 0.22], steel, { res: 0.014, rd: 0.025 });
      S.box([sx * 0.39, y - 0.10, 0.12 + lean], [0.23, 0.06, 0.19], steelLight, { res: 0.012, rd: 0.02 });
      S.box([sx * 0.41, y + 0.05, 0.06 + lean], [0.07, 0.09, 0.13], goldDark, { res: 0.008, rd: 0.015 });
      S.tube([[sx * 0.48, y + 0.09, 0.01], [sx * 0.56, y + 0.23, -0.02], [sx * 0.60, y + 0.31, -0.04]], 0.03, 0.008, gold, { res: 0.007 });
    }

    // 手臂：袖口浅蓝、护腕亮钢；手在胸前 0.36 的高度，刀能露出来。
    const rightHand = slash
      ? [0.50, 1.40 + crouch, 0.38]
      : (charge ? [0.40, 1.03 + crouch, -0.18] : [0.60, 1.02 + crouch, 0.36]);
    const leftHand = roar
      ? [-0.60, 1.28 + crouch, 0.34]
      : [-0.57, 1.02 + crouch, 0.34];
    S.tube([[0.38, shoulderY, 0.04 + lean], [0.51, 1.26 + crouch, 0.20 + lean], rightHand], 0.115, 0.062, clothLight, { res: 0.016 });
    S.tube([[-0.38, shoulderY, 0.04 + lean], [-0.50, 1.26 + crouch, 0.20 + lean], leftHand], 0.105, 0.058, clothLight, { res: 0.016 });
    S.box([0.49, 1.20 + crouch, 0.18 + lean], [0.18, 0.09, 0.12], steelDark, { res: 0.010, rd: 0.018 });
    S.box([-0.48, 1.20 + crouch, 0.18 + lean], [0.16, 0.08, 0.11], steelDark, { res: 0.010, rd: 0.018 });
    S.ball(rightHand, 0.068, skin, { res: 0.012 });
    S.ball(leftHand, 0.062, skin, { res: 0.012 });

    // 长刀：右手持，刀身斜过体前；idle 刀尖向右下，roar 竖起，charge 收到背后。
    const katana = slash
      ? [[[0.50, 1.40 + crouch, 0.38], [0.76, 1.55 + crouch, 0.44], [1.00, 1.50 + crouch, 0.46], [1.16, 1.34 + crouch, 0.44]], 0.052, 0.014]
      : (charge
        ? [[[0.40, 1.03 + crouch, -0.18], [0.27, 0.72 + crouch, -0.30], [0.18, 0.38 + crouch, -0.34], [0.16, 0.16 + crouch, -0.35]], 0.05, 0.014]
        : (roar
          ? [[[0.60, 1.44 + crouch, 0.36], [0.62, 1.80 + crouch, 0.34], [0.58, 2.14 + crouch, 0.30], [0.50, 2.42 + crouch, 0.24]], 0.052, 0.013]
          : [[[0.60, 1.02 + crouch, 0.36], [0.76, 0.79 + crouch, 0.42], [0.88, 0.48 + crouch, 0.46], [0.96, 0.16 + crouch, 0.46]], 0.052, 0.012]));
    S.tube(katana[0], katana[1], katana[2], steelLight, { res: 0.009 });
    // 刀柄与刀镡
    const hilt = katana[0][0];
    const hiltUp = slash ? 0.18 : 0.15;
    S.tube([[hilt[0], hilt[1] + hiltUp, hilt[2] - 0.01], hilt], 0.052, 0.045, ink, { res: 0.008 });
    S.box([hilt[0], hilt[1] + 0.02, hilt[2]], [0.18, 0.035, 0.05], gold, { res: 0.007, rd: 0.01 });
    S.box([hilt[0], hilt[1] + 0.02, hilt[2] + 0.02], [0.05, 0.05, 0.02], goldLight, { res: 0.005 });
    for (let i = 0; i < 3; i += 1) {
      S.box([hilt[0], hilt[1] + hiltUp - 0.03 - i * 0.035, hilt[2]], [0.052, 0.016, 0.03], redDark, { res: 0.004 });
    }

    // 胁差：左手短刀，刀身向右下；与长刀形成交叉。
    const waki = roar
      ? [[[-0.60, 1.28 + crouch, 0.34], [-0.78, 1.54 + crouch, 0.38], [-0.92, 1.82 + crouch, 0.36], [-0.98, 2.08 + crouch, 0.30]], 0.045, 0.012]
      : [[[-0.57, 1.02 + crouch, 0.34], [-0.72, 0.74 + crouch, 0.40], [-0.84, 0.44 + crouch, 0.44], [-0.91, 0.20 + crouch, 0.43]], 0.042, 0.010];
    S.tube(waki[0], waki[1], waki[2], steel, { res: 0.008 });
    S.tube([[waki[0][0][0], waki[0][0][1] + 0.14, waki[0][0][2]], waki[0][0]], 0.042, 0.036, ink, { res: 0.007 });
    S.box([waki[0][0][0], waki[0][0][1] + 0.02, waki[0][0][2]], [0.13, 0.03, 0.04], goldDark, { res: 0.006, rd: 0.008 });

    // 颈与头：把兜抬离肩甲，露出脖子和面甲。
    S.tube([[0, 1.46 + crouch, 0.02], [0, headY - 0.17, 0.02]], 0.12, 0.10, ink, { res: 0.014 });
    S.ball([0, headY, 0.02], [0.235, 0.205, 0.21], steel, { res: 0.020, rd: 0.035 });
    // 兜檐：压在眉上，前面留出面具的位置
    S.box([0, headY - 0.01, 0.12], [0.50, 0.045, 0.22], steelDark, { res: 0.012, rd: 0.025 });
    S.box([0, headY - 0.03, 0.24], [0.36, 0.035, 0.07], steel, { res: 0.008, rd: 0.015 });
    // 面甲：深色铁面，只露青眼与下半张脸的骨白；不做一块发光的白板
    S.box([0, headY - 0.11, 0.32], [0.25, 0.18, 0.07], steelDark, { res: 0.010, rd: 0.02 });
    S.box([0, headY - 0.19, 0.365], [0.145, 0.055, 0.026], pale, { res: 0.006, rd: 0.010 });
    S.box([0, headY - 0.205, 0.382], [0.095, 0.016, 0.008], ink, { res: 0.004 });
    for (const sx of [-1, 1]) {
      S.box([sx * 0.062, headY - 0.070, 0.370], [0.092, 0.064, 0.012], ink, { res: 0.005 });
      S.box([sx * 0.062, headY - 0.070, 0.380], [0.068, 0.036, 0.008], eye, { res: 0.004 });
      S.box([sx * 0.062, headY - 0.068, 0.386], [0.030, 0.014, 0.005], eyeHot, { res: 0.003 });
      // 眼上的一道金压条，给眼神一个方向
      S.box([sx * 0.062, headY - 0.034, 0.368], [0.095, 0.018, 0.010], goldDark, { res: 0.003 });
      // 颊骨：只留两块窄的高光，不做整块白脸
      S.box([sx * 0.108, headY - 0.155, 0.350], [0.032, 0.045, 0.010], pale, { res: 0.004 });
      S.box([sx * 0.145, headY - 0.12, 0.24], [0.065, 0.14, 0.09], steelDark, { res: 0.008, rd: 0.015 });
    }
    // 面甲中脊：一条窄高光，避免脸读成一块黑洞
    S.box([0, headY - 0.10, 0.368], [0.025, 0.16, 0.012], steelLight, { res: 0.004 });
    // 兜后护颈：三片，背视有层次
    for (let i = 0; i < 3; i += 1) {
      S.box([0, headY - 0.14 - i * 0.045, -0.19 - i * 0.025], [0.32 - i * 0.04, 0.055, 0.10], steelDark, { res: 0.009, rd: 0.018 });
    }
    // 金前立：两只后弯角 + 中央金轮
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.075, headY + 0.13, 0.17], [sx * 0.17, headY + 0.34, 0.14], [sx * 0.27, headY + 0.60, 0.04]], 0.038, 0.010, gold, { res: 0.007 });
      S.tube([[sx * 0.15, headY + 0.28, 0.15], [sx * 0.20, headY + 0.26, 0.10]], 0.020, 0.008, goldDark, { res: 0.005 });
    }
    S.ball([0, headY + 0.19, 0.18], [0.070, 0.080, 0.032], gold, { res: 0.008 });
    S.ball([0, headY + 0.20, 0.20], [0.032, 0.034, 0.011], goldLight, { res: 0.005 });
    // 大前立：横跨额头的金新月，远处也能认出是武士兜
    S.tube([
      [-0.24, headY + 0.075, 0.20],
      [-0.13, headY + 0.150, 0.235],
      [0, headY + 0.105, 0.255],
      [0.13, headY + 0.150, 0.235],
      [0.24, headY + 0.075, 0.20],
    ], 0.040, 0.018, gold, { res: 0.007 });
    S.tube([
      [-0.18, headY + 0.065, 0.225],
      [-0.09, headY + 0.110, 0.250],
      [0, headY + 0.085, 0.262],
      [0.09, headY + 0.110, 0.250],
      [0.18, headY + 0.065, 0.225],
    ], 0.022, 0.010, goldLight, { res: 0.005 });
    // 红缨：从兜后垂下，侧 / 背视都读得到
    for (let i = 0; i < 4; i += 1) {
      S.tube([
        [0, headY + 0.14, -0.10],
        [0, headY - 0.12 - i * 0.04, -0.27],
        [0, headY - 0.40 - i * 0.06, -0.44],
      ], 0.050, 0.016, i % 2 ? red : redDark, { res: 0.007 });
    }

    // 背旗：一根中杆 + 窄旗面；背视有强识别，正面只露旗杆
    if (!charge) {
      S.tube([[0, 0.95, -0.24], [0.02, 1.55, -0.30], [0.06, 2.16, -0.28]], 0.024, 0.012, ink, { res: 0.007 });
      S.box([0.02, 1.78, -0.30], [0.26, 0.52, 0.025], clothLight, { res: 0.008, rd: 0.01 });
      S.box([0.02, 1.78, -0.282], [0.035, 0.24, 0.014], goldDark, { res: 0.004 });
      S.box([0.02, 1.98, -0.30], [0.20, 0.035, 0.012], red, { res: 0.004 });
    }
    // 背后腰结与两条布尾
    S.box([0, hipY - 0.02, -0.20], [0.20, 0.12, 0.08], goldDark, { res: 0.008, rd: 0.018 });
    const tailLift = roar ? 0.12 : 0;
    for (const sx of [-1, 1]) {
      S.tube([[sx * 0.10, hipY - 0.06, -0.22], [sx * 0.18, hipY - 0.32 + tailLift, -0.38], [sx * (0.26 + (roar ? 0.06 : 0)), hipY - 0.52 + tailLift * 1.2, -0.52]], 0.065, 0.020, sx < 0 ? clothLight : cloth, { res: 0.008 });
    }

    // 鞋底接地：只一层很薄的暗色，不投影到地面
    for (const sx of [-1, 1]) {
      const z = sx > 0 ? 0.10 + stride : -0.12 - stride * 0.4;
      S.ball([sx * 0.27, 0.035, z + 0.06], [0.20, 0.018, 0.20], ink, { res: 0.010 });
    }

    S.bake();
    return B.finish({
      cam: { target: [0, 1.10, 0.04], dist: 4.65, pitch: 0.13, yaw: 0.10 },
      detail: 20, dither: 0.18, radius: 4,
    });
  },
});
