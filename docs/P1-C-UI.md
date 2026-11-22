# P1-C-1：UI 令牌、组件层与特殊关卡覆盖层

状态：已完成并推送 `2fc5906`；C1 上线时 Pages 曾切到 `game.0faa720c.js`，线上特殊覆盖层与开始按钮实测通过。
后续：P1-C-2 已上线 `game.357978dd.js`，本页线上记录为 C1 时点；最新状态见 `docs/P1-C-2.md`。

## 范围

- 新增 `src/systems/ui/tokens.js`：字号只保留 12 / 24，颜色、状态、图集键、九宫格边距集中管理。
- 新增 `src/systems/ui/primitives.js`：`makePanel / makeCard / makeButton / makeText`，只做表现层，不读写存档、不持有玩法状态。
- `tools/build.mjs` 接入 Theme1 20 张 UI 切片；图集从 97 增至 117 张。
- `map.js` 特殊关卡覆盖层从内联矩形/文本迁到组件层；章节、节点、Hall、Title、Select、Play HUD 未迁。

## 基线证据

- `title / map / hall / select` 四场景原有 31 处 `add.rectangle`、86 处 `add.text`、65 个硬编码色值（审计时统计）。
- 字号例外仍是 `title.js:52` 的 36px、`select.js:79` 的 16px、`map.js:279` 与 `map.js:382` 的 14px；本切片只处理特殊覆盖层，不动这些页面。
- 非整数缩放仍是 `title 1.4`、`hall 1.4 / 1.5`、`select 1.7 / 1.85`；本切片未接 Hall / Title / Select。
- Theme1 20 张 PNG 已存在，实际尺寸：按钮 16×8 四态、面板/背景 16×16、勾选 16×16、横滑条 13×11、竖滑条 11×13、进度 16×16。

## Theme1 视觉门禁

`nine_path_panel` 是带橙色填充的 16×16 切片，不是透明边框。直接作 600×320 九宫格时，中心被拉伸成大面积橙色十字，已判为不可用于大面板。

最终采用混合方案：

- 主面板：`uiBg2` 深色九宫格 + 2px `specialLine` 紫灰描边。
- 卡片：`uiBg` 底色、`uiBg2` 悬停层，左侧 4px 类型色条；选中卡片用金色 2px 描边。
- 按钮：`button_normal / hover / pressed / disabled` 原生暖橙，作为唯一高饱和主操作。
- 已入包但未启用的切片：`uiPanel`、`uiFocus`、勾选、滑条、进度；留给后续切片。

## 验收

构建：

- `dist/game.0faa720c.js` 209,064 B
- `dist/assets.5fb07765.js` 98,298 B
- `web/game.html` 1,897,044 B
- `web/atlas/core.png` 173,294 B / 117 张切片
- `index.html` 已指向 `game.0faa720c.js`

截图：

- `docs/revamp/p1/p1c-special-960.png`、`p1c-special-640.png`：正常选中 `商队速递`，13 卡 5/5/3，按钮可见。
- `docs/revamp/p1/p1c-special-locked-960.png`：选中锁卡 `灰烬墓`，卡名/类型可读，状态转红，开始按钮隐藏。
- `docs/revamp/p1/p1c-hover-button.png`、`p1c-hover-card.png`：按钮 hover 与卡片 hover 状态。
- `docs/revamp/p1/p1c-online-special.png`：线上 13 卡覆盖层，`商队速递` 选中，开始按钮可见。
- `docs/revamp/p1/p1c-online-select.png`：线上实际点击开始按钮后进入 Select，标签 `条件 · 商队速递`。

交互：

- 13 卡数量、`open / cleared` 数据与详情文案通过。
- 锁卡点击：`条件未达成：通关 无光回廊` toast，选中不变。
- 点击开放卡：`specialSel` 更新、详情更新。
- Enter：进入 Select；开始按钮点击：进入 Select。
- ESC：关闭覆盖层；点击空白遮罩：关闭覆盖层。
- 锁卡选中时「开始挑战」容器隐藏、命中层 disabled。

回归：

- `special_rules_accept.py`：`fists / poor / timer / firefly` 通过，`errs=[]`。
- `special_all_run.py`：13 关全量进入 / 结算 / 返回，`errs=[]`。
- `special_rules_single.py`：单文件 `fists / timer` 通过，`errs=[]`。
- 960×540 与 640×360 覆盖层截图均无裁切；控制台 `errs=[]`。

线上：

- C1 上线时入口 `https://elijah-lin-dancer.github.io/game-dev/` 指向 `dist/game.0faa720c.js` 与 `dist/assets.5fb07765.js`；P1-C-2 后已切到 `game.357978dd.js`。
- 新档全主线三星种子：13 卡、仅 `灰烬墓` 锁；`商队速递` 选中时 `startVisible / startEnabled` 均为 true。
- 实际点击锁卡 `灰烬墓`：选中保持 `商队速递`，无跳转。
- 实际点击「开始挑战」：进入 Select，`stage.special='speedrun'`，标签 `条件 · 商队速递`。
- 线上加载约 35–45 秒；全程控制台 `errs=[]`。

## 未完成

- P1-C-2：Hall 6 武器 / 3 角色卡与 Map 章节/节点/详情面板已完成，见 `docs/P1-C-2.md`。
- P1-C-3：Title / Select / 设置 / 制作名单 / 难度覆盖层，字号 36/16/14/11 收敛。
- P1-C-4：Play HUD，最后处理；本切片未改 `play.js`。
- 20 张 Theme1 切片中勾选/滑条/进度尚未接线；`uiFocus` 尚未使用。
