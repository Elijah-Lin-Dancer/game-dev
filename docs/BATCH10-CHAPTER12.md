# 批 10：一、二章内容（竹林村 / 旧堡）

> 目标：把第一、二章从“同一套随机地牢换数值”变成两张可分辨的脸：各自的怪池、Boss 池、房型模板与压力机制，并补齐图鉴。素材仍然全部取自 Ninja Adventure 包内，外部件 0、自绘 0。

## 1. 数据表

| 文件 | 内容 | 说明 |
|---|---|---|
| `web/data/enemies.json` | 11 只小怪元数据（id/name/sheet/kind） | 新增 `racoon` 浣熊；供章节池与图鉴共用 |
| `web/data/bosses.json` | 5 个 Boss（frog/racoon/samBlue/samRed/weaver） | hp/dmg/speed/half/scale/prefix/seen；`weaver` 暂为终章占位 |
| `web/data/chapters.json` | 一章 `monsters/bossPool/roomTemplate`；二章改为 `fort` 主题 + 机关模板 | 数据是唯一真源，代码只做通用编排 |

两章配置：

| 章 | 主题 | 单关房数 | 怪池 | Boss 池 | 房型模板 |
|---|---|---|---|---|---|
| 一 · 竹林村 | `field` | 5 | beast / cyclope / eye / racoon | frog / racoon | 战斗×2、商店、休整 → Boss |
| 二 · 旧堡 | `fort` | 6 | larva / skull / spider / mole / slime | samBlue / samRed | 战斗×2、宝箱、精英、机关 → Boss |

Boss 按关轮换：`bossPool[(stage.index - 1) % pool.length]`。所以一章 1/2 关是青蛙大王/巨浣熊，二章 1/2 关是蓝武士/赤武士；章节池为空时按 `field→frog / 其他→samBlue` 回落。

## 2. 素材与帧尺寸修正

| 素材 | 原问题 | 修正 |
|---|---|---|
| `GiantBlueSamurai/Idle.png`、`Walk.png` | 实际是 6 帧 × 96×48，构建按 48×48 切成 12 帧，动画只播左半身 | 构建帧尺寸改 `[96,48]`，`sam-walk` 从 `0..11` 改 `0..5` |
| `GiantRedSamurai/*` | 与蓝武士同尺寸；攻击帧是 96×96 | 新增 `rsamIdle/rsamWalk/rsamAtkL/rsamAtkR/rsamChg*` 切片与 `rsam-*` 动画 |
| `GiantRacoon/*` | Idle 6 帧、Attack 4 帧、Jump 5 帧、charge 2 帧 | 按实际帧数切片，新增 `racoon-*` 动画 |
| `Monsters/Racoon/SpriteSheet.png` | 64×64、4×4、16px 帧 | 复用 walk 行做四向动画，新增 `racoon` 小怪与跳扑 AI |

## 3. 行为

### 3.1 巨浣熊 Boss（racoon）

- 接近玩家；距离 320 内按 `moveCount` 轮换两种招：
  - **跃扑**：先蓄力并在玩家位置画红圈预警，随后沿弧线跳到落点（正弦弧高 54），落地 74 半径内 4 伤并击退 160。
  - **抓击**：近身短前摇，前方 64 内 3 伤，橙色圆扩散 FX。
- 半血进入 `roar`：600ms 咆哮、血条变橙、速度 ×1.25，之后进二阶段；跃扑/抓击前摇缩短 20%。
- 接触伤害只在 `swipeHit` 帧生效；跃扑落地单独判伤，避免“贴着就掉血”。

### 3.2 赤武士（samRed）

- 复用 `updateSamurai` 与 `samuraiSlash`，通过 `e.prefix` 切 `sam-*` / `rsam-*` 动画与 `samAtk*` / `rsamAtk*` 攻击覆盖层。
- 行为与蓝武士一致：横斩、突进斩、召唤、半血二阶段；差异在血量/速度/贴图。

### 3.3 小浣熊（racoon 小怪）

- 追击玩家；距离 150 内且冷却好时进入 180ms 跳扑，速度 155，起跳放大到基础体型 ×1.15，落地恢复。
- 精英缩放不被跳扑覆盖：以 `e.baseScale` 记录当前体型。

### 3.4 机关房（gate）

- 固定刷 3 只本章小怪 + 一尊金色石像机关。
- 清怪后门仍锁；靠近石像提示 `E 拉机关`，按 E 后：
  - `room.gateOpen = true`、石像灰化、浮字“机关已启”、bonus 音效 + 震屏；
  - 若已清场则 `room.cleared = true`，门锁消失；未清场时先拉机关也不会提前开门。
- 小地图色 `0xc9a45a`，房名“机关”。

## 4. 旧堡皮肤（fort）

`paintFloorAndWalls()` 现在分 `field / fort / dungeon` 三套：

| 项 | field | fort | dungeon |
|---|---|---|---|
| 地面 | `field` frame 21 | `floorDungeon` frame 322 + 暖色 tint + 加法暖光 | frame 322 |
| 贴花 | 草簇 6 种 | 裂纹/碎石 5 种 | 裂纹/骨/碎石 7 种 |
| 墙色 | `0x2b3a20` | `0x3a2822` | `0x2a2426` |
| 暗角 | `[0.72,0.12]` | `[0.66,0.16]` | `[0.62,0.2]` |
| 火把 | `0xffc27a` | `0xff8a5a` | `0xff9a4a` |
| 光柱 | 无 | 无 | 有 |

旧堡第一版直接给地面压 `0xd8b49a`，实测过暗；最终改为 `0xffcbb0` + 22% 加法暖光，只提亮地面，不盖角色与墙。

## 5. 图鉴补位

- `src/scenes/hall.js`：`FOES` 补 `racoon`（11 只）、`BOSSES` 补 `racoon / samuraiRed`（4 个）、`ROOM_NAME` 补 `gate`（8 类）。
- 新增“进过的房型才点亮”：`enterRoom` 调 `markSeen('rooms', type)`；此前房间栏永远全是 `???`。
- Boss 图标按各自尺寸给缩放：青蛙 1.4、浣熊 1.0、武士 0.5，避免 96px 武士撑破 44px 格子。

## 6. 验收

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| N1 | 两章皮肤肉眼可分 | 同分辨率实机截图：一章草地房 vs 二章旧堡房 | 通过；绿草地 vs 暖褐石砖，一眼可分（`b10-1-skins.png`） |
| N2 | Boss 按池抽 | 直接按章/关启动并跳 Boss 房，读 `__state.bossId` | 通过；bamboo:1=frog、bamboo:2=racoon、fort:1=samBlue、fort:2=samRed（`b10-2-bosses.png`） |
| N3 | 精英/宝箱密度符合表 | `__dbg.plan()` + 逐房 `__dbg.foes()` | 通过；竹林 5 房 `battle,battle,shop,rest,boss`；旧堡 6 房 `battle,battle,treasure,elite,gate,boss`；宝箱 2 守卫、精英 1 精英+2 小怪、机关 3 守卫 |
| N4 | 机关门锁 | 清怪不拉机关 → 门锁仍可见；拉机关 → `gateOpen/cleared` 同步、门锁消失 | 通过；`doorLocks=[true,true] → [false,false]`（`b10-3-gate.png`） |
| N5 | 两章怪池不串 | 逐房收集 `kinds` 并比对本章池 | 通过；竹林只出现 beast/cyclope/eye/racoon，旧堡只出现 larva/skull/spider/mole/slime |
| N6 | 单文件版可走通 | `web/game.html?debug` 启一章/二章、跳机关房、拉机关、跳 Boss | 通过；三份数据 `__chaptersData/__enemiesData/__bossesData` 均在，`errs=[]` |

## 7. 已知限制

- 织命者仍是青蛙占位，批 12 再接三阶段。
- 武士攻击覆盖层是 96×96 单独贴图，和 96×48 本体叠加；视觉上体型偏大，等批 11/12 有更合适 Boss 素材时再统一锚点。
- 巨浣熊跃扑红圈在落地时销毁；截图里保留一帧是验收截图的相位冻结效果，不是常驻 FX。
- 旧堡暖光是整屏地面加法层，极暗显示器上仍偏沉；若后续加“伽马/亮度”选项再统一调。
- 二章解锁仍要求一章第 5 关至少 1 星；本章验收用直接启动绕过地图，不代表解锁门槛被改动。
