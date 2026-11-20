# ADR 0008 · 资源管线：图集打包 + 音乐流式 + 按需加载

日期：2026-11-20
状态：已采纳

## 背景

工程化第 1 步把源码拆开之后，素材仍是一张张单独 `spritesheet` 直接内联进 `assets.js`。当前只用 9 张图，看起来没问题；但素材包里有 1359 个文件，一个房间要摆怪、道具、特效、UI，按"一图一请求"的方式长下去必炸：请求数线性上涨、首屏阻塞、也没法按章节增量更新。

## 决定

1. **构建期打图集**：`tools/pack_atlas.py` 把多张切片按货架式装进一张 PNG，出口是 `web/atlas/core.png` + `core.json`（每张切片的 `x/y/w/h/fw/fh`）。`tools/build.mjs` 在打包前调用它，切片清单仍只在 `build.mjs` 的 `img` 映射里维护一处。
2. **运行期还原 spritesheet**：`Boot.unpackAtlas()` 读区域清单，用 canvas 把每块区域画成独立纹理，再 `textures.addSpriteSheet(key, canvas, {frameWidth, frameHeight})`。这样**帧号语义完全不变**（`frame: row*4+col`、`frame 21` 地板、`heart` 五帧都照旧），业务代码不用改一行。
3. **音乐走原生 HTMLAudio 流式**：不进 Phaser 加载批次，`new Audio()` + `loop`，按房间情绪懒创建（普通房 `dungeon`、Boss 房 `fight`）。受自动播放策略约束，等第一次真实输入再 `unlock`。
4. **单文件版仍可用**：图集在 `--single` 模式下内联成 data URI，音乐用相对路径，双击 `web/game.html` 依旧能玩。

## 实测

| 项 | 结果 |
|---|---|
| 图集 | 1024×240，8 张切片，13.4 KB |
| 请求数 | 5 个（index / phaser / assets / game / core.png），与素材张数解耦 |
| 素材数据 | `assets.js` 62.4 KB（gzip 42.5 KB），其中 60 KB 是音效 base64；图集脱离 JS 后变成可缓存二进制 |
| 音乐 | 启动即拉 `dungeon.mp3`（readyState 4），**不播**（未输入）；按一下键后开始播；进 Boss 房自动切 `fight.mp3`，同一时刻只有一首在播 |
| 静音 | M 键把音量置 0，HUD 变"已静音 · 按 M 恢复" |
| 画面 | 图集还原后与原素材逐像素一致（hearts / 玩家 / 小怪 / 地板 / 墙 / Boss 均正常） |
| 单文件 | `file://` 双击可玩，音乐相对路径也能拉到 |

## 代价与边界

- **没省多少流量**：当前只有 8 张图，base64 换 PNG 只省约 10 KB（gzip 口径）。真正的收益是结构：素材涨到 1359 张时仍是 1 个请求、可独立缓存、可按章节拆多张图集。
- 图集宽度固定 1024、货架式装箱，不做旋转和最优装箱；切片尺寸差异大时会浪费空白（`field` 80×240 撑起整个高度）。切片数量到几百张时要换装箱算法或拆图集。
- canvas 还原是运行期开销（8 张切片可忽略，几百张要改成直接走 atlas frame 命名）。
- 音乐只用两首，切换靠"房间是不是 Boss 房"，还没有音量滑杆与周目情绪。

## 下一步（本 ADR 未做）

- 按章节/主题拆图集（`ch1.png`、`boss.png`），配合房间预加载做真正的懒加载。
- 字体：Fusion Pixel 中文点阵字体接入 HUD。
- 存档：`localStorage` 版本化存档（工程化第 3 步）。
