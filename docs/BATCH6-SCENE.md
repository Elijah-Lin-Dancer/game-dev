# 批 6 · 场景、光照与转场（实施记录，2026-11-21）

## 1. 做了什么

房间不再"永远一片草地"：前半程草地、后半程石砖，地板撒裂纹碎石，屏幕有暗角、墙角有火把、石砖房有光柱、空气里有灰尘，过门 120ms 黑场并弹房名横幅。

**素材：0 外部件、0 自绘**，全部取自包内 `Backgrounds/Tilesets/Interior/TilesetInteriorFloor.png`、`Backgrounds/Tilesets/TilesetFloorDetail.png`、`FX/Environment/Raylight.png`、`FX/Particle/Snow.png`、`Actor/FX/Aura/*`。

| 块 | 实现 | 素材来源 |
|---|---|---|
| 主题 | `paintFloorAndWalls()` 按 `room.isBoss ｜ room.idx >= ceil(roomTotal/2) ｜ cycle >= 2` 选 `dungeon`，其余 `field` | — |
| 地板 | `tileSprite` 整屏铺：石砖 `Interior/TilesetInteriorFloor` frame 322，草地 `field` frame 21 | 包内 |
| 贴花 | 每房 16 个随机点，石砖用裂纹/碎石/骨（frame 0/1/6/8/9/12/15，α 0.55），草地用草簇（32/35/39/44/46/47，α 0.4） | `TilesetFloorDetail` |
| 墙上色 | `WALL_TONE` 石砖 `0x2a2426` / 草地 `0x2b3a20` | 代码矩形（既有做法） |
| 暗角 | 相机 postFX `addVignette`，`dungeon [0.62, 0.2]`、`field [0.72, 0.12]`（第 3 参半径、第 4 参强度） | 运行时 |
| 火把 | 两处墙角 `aura` 帧，`Scale 2.6→3.2`、`ADD`、α `0.32↔0.18` 呼吸 | `Actor/FX/Aura` |
| 光柱 | 石砖房 `Raylight` 一束，`Scale 1.6`、`rotation 0.42`、α `0.1↔0.05` | `FX/Environment` |
| 灰尘 | `Snow.png` 8×8 粒子，`lifespan 2400–4600`、`frequency 520`、`maxAliveParticles 14`、`ADD`，石砖 `0xd8c8a8` / 草地 `0xf2ecc8` | `FX/Particle/Snow` |
| 转场 | `enterRoom` 里 `cameras.main.fadeIn(120,0,0,0)` + `roomBanner()`（屏中 16px、Boss 红字、1100ms 后 300ms 淡出，depth 830 不挡 HUD） | — |
| 兼容 | 删掉 `enterRoom` 里旧的房名 `floatText`，避免和横幅重复 | — |

调试口（`window.__dbg`）新增：`theme()` / `light(on)` / `dustCount()` / `dustCount(on)` / `fxChild(i,on)` / `hearts()`。

## 2. 与 ROADMAP §8 的偏差（有意）

- **没用 `TilesetDungeon.png`**：实测该图是 192×64 的**道具图**（罐子、雕像、宝珠、石块），不是可平铺地砖。若拿它铺地会得到"满地罐子"。改为 `Interior/TilesetInteriorFloor` 的花砖（frame 322）+ `TilesetFloorDetail` 裂纹贴花，仍是**包内现成件**，符合 ADR 0013 的第一顺位。
- **暗色遮罩用相机 postFX 而非手绘径向渐变**：Phaser 自带 `addVignette`，零素材、零代码画图，且玩家恒在镜头中心天然跟随。
- **房名从 `floatText` 升级为横幅**：原实现只有 12px 浮字跟着玩家，过门时容易漏看；横幅是纯文本对象，无新素材。

## 3. 实测与参数收敛

| 项 | 首版 | 现状 | 原因 |
|---|---|---|---|
| 暗角强度 | `dungeon [0.5, 0.85]` | `dungeon [0.62, 0.2]` / `field [0.72, 0.12]` | 0.85 把整屏（含 HUD 与天赋面板）压到几乎不可读，直接违反"暗度上限 0.35" |
| 火把 | `Scale 2.2`、α 0.14 | `Scale 2.6→3.2`、α 0.32→0.18 | 0.14 在 720p 下几乎看不见 |
| 石砖底色 | Interior frame 322 | 保持 322 | 试过 121 纯色底 + 贴花：整屏一片平色更空；也试过 `TilesetFloor` 泥地帧压灰蓝：纹理几乎被乘色吃光。322 的花砖在暗角下读作"旧地砖"，配合 16 个裂纹贴花不显单调 |

**帧率**（同一石砖房、同敌人数量，无头 chromium + swiftshader，5 秒 rAF 平均）：

| 状态 | 帧率 |
|---|---|
| 光照开（暗角+火把+光柱+灰尘） | 23 fps |
| 光照关（`__dbg.light(0)`） | 23 fps |

差值为 0 —— 伪光全部是贴图叠 `ADD`，没有逐像素光照管线，符合"帧率不降"。23 是无头软渲染的天花板（之前同类场景实测 36，取决于窗口/贴图规模），不作为线上指标。

**灰尘**：石砖房/草地房实测存活 5–8 颗（`maxAliveParticles 14`），0.6s 内采样会读到 0，需等 ≥2s。

**跑房**：`jump(0..4)` 逐间进入，主题序列 `field, field, field, dungeon, dungeon`，无 pageerror；`win()` 结算层正常。

## 4. 截图（`docs/screens/`）

| 文件 | 内容 |
|---|---|
| `b6-0-field.png` | 草地房：草簇贴花 + 轻暗角 + 灰尘，HUD 清晰 |
| `b6-1-dungeon.png` | 石砖房：花砖地 + 裂纹/骨贴花 + 暗角 + 尘粒 |
| `b6-3-light-off.png` | 同房 `light(0)`：火把/光柱/尘粒关闭，只剩暗角 |
| `b6-4-banner.png` | 过门瞬间：黑场淡入 + "通道"横幅 |
| `b6-5-win.png` | 通关结算层在暗角下仍可读 |

> 早期三张（旧 0.85 暗角版）已覆盖；本轮截图前统一 `__dbg.wipe()` + `__dbg.hp(20)`，避免"你倒了"覆盖层糊在画面中央。

## 5. 已知限制

- 暗角作用在**整个相机**，四角的 HUD（心数、信息条、提示行）会一并变暗。当前 0.2 强度下文字仍可读，但没有做到"HUD 免疫"。彻底解法是拆一个只画 HUD 的相机（`main.ignore(hud)` + `hudCam.ignore(world)`），属批 8 工程化范围。
- 石砖地是单帧平铺，远看仍有网格感；增加变体帧或按房随机 `tilePosition` 能缓解，属美术打磨，非本批验收项。
- `__dbg.hp(n)` 是直接改数值、不走 `rebuildHearts()`，截图里可能出现 `20/13` 这类越界显示；正常游戏路径不会。
- 转场 120ms + 横幅 1100ms 的手感只做了截图确认，未做真人连续过门体感测试（本地无头环境无法评估）。
