# 3D 像素资产试验（G1 后）

用途：用 [siliconjungle/shapeshift-labs-ink-studio](https://github.com/siliconjungle/shapeshift-labs-ink-studio)
把 SDF 雕塑烘成像素风 Gaussian splat，再导出透明 RGBA 多方向图集。
本轮只做离线素材试验，**不接运行时**，不改 Phaser 场景 / 图集 / 存档。

## 产出

`docs/revamp/3d-pixel/`

- `boss-atlas.png`：苔背巨兽，96×96，4 方向，384×96
- `hero-atlas.png`：旅人，64×64，4 方向，256×64
- `blade-atlas.png`：星火短刃，80×80，4 方向，320×80
- `armor-atlas.png`：苔纹护甲，80×80，4 方向，320×80
- 同名 `.json`：每帧的 rect / pivot / unitsPerPixel / direction / yaw
- `pilot-board.png`：放大对照板
- `boss-64.png` / `hero-32.png` / `blade-64.png` / `armor-64.png`：按游戏显示尺寸从源图最近邻缩放
- `hero-16.png` / `hero-24.png`：尺寸下限测试；16px 脸部已不可读，24px 可用但偏糊

## 复现

工具链固定 checkout：`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio`（commit `823981c`）。

工具链是独立 checkout，不入本仓库：

```bash
git clone https://github.com/siliconjungle/shapeshift-labs-ink-studio /home/user/Doubao/chats/38454996042111490/toolchains/ink-studio
cd /home/user/Doubao/chats/38454996042111490/toolchains/ink-studio
git checkout 823981c
npm run build
node cli/ink-studio.js render examples/sculpt.js --colored --out /tmp/sculpt.png
```

然后：

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio node art-src/3d-pixel-pilot/render.cjs
```

注意：工具包 `package.json` 的 `private` 为 true，没有 npm 正式发布；实验请固定
`/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio` 的 commit（本轮为 `823981c`），不要追 `main`。MIT 许可，若把生成图用于正式发行，
保留其版权与许可声明。

## 调参记录

- 模型正面朝 `+Z`，`S.ball` / `S.box` / `S.tube` 的坐标以米为单位。
- `spriteAtlas` 的 `view.dist` 是真正控制单帧占幅的参数；`world.cam.dist` 只是默认。
  刀尖在 64 帧会顶到画布，所以武器改用 80 帧、`dist=5.4`。
- 输出是 `straight RGBA`，透明背景；但 16px 下细节会塌，必须再做一次缩放验收。
- 当前样张是“3D 像素”而不是严格 16px 手绘图：体积光和轮廓更强，但边缘比
  Ninja Adventure 软；正式接入前需要量化到游戏色板 + 手工修边。
