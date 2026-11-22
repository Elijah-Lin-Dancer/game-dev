# P0-1：导航底座与返回栈

> 2026-11-22。目标：先修“玩家被页面层级卡住”的四个问题（#1 制作名单无返回、#2 Hall 死胡同、#4 收藏层挡在冒险入口、#5 页面返回关系混乱），不做内容扩张、不改战斗核心、不碰开放世界 G0。

## 1. 交付

| 模块 | 文件 | 行为 |
|---|---|---|
| 导航层 | `src/systems/nav.js`（新） | 场景返回栈 `reset / push / back / path`，覆盖层登记 `openOverlay / closeOverlay / topOverlay`；跳转通过当前场景的 `scene.start` 执行，确保旧场景真正停止，避免后台场景继续吃键盘事件 |
| 入口 | `src/main.js` | 创建 Phaser 后 `initNav(game)`，调试口 `window.__nav` |
| 标题页 | `src/scenes/title.js` | 菜单改为「开始冒险 / 收藏小屋 / 设置 / 制作名单」；开始冒险直达 Map，收藏小屋进 Hall；制作名单支持 ESC、右键、遮罩、关闭按钮四条返回路径，设置/名单登记为覆盖层 |
| 收藏小屋 | `src/scenes/hall.js` | 顶部「← 返回」、ESC、右键回来源；Enter / 空格改为 `NAV.push('map')` |
| 世界地图 | `src/scenes/map.js` | 顶部「← 返回」、ESC、右键回来源；进入关卡改为 `NAV.push('select')`；页脚改为「ESC 返回」 |
| 选人页 | `src/scenes/select.js` | 顶部「← 返回地图」、ESC、右键回来源，并把 `chapterId / stage` 带回 Map；进入 Play 前重置导航栈，避免旧 Select 留在栈里 |

## 2. 行为矩阵

| 入口 | 动作 | 返回结果 |
|---|---|---|
| Title「开始冒险」 | `NAV.push('map')` | Map ESC / 返回 → Title |
| Title「收藏小屋」 | `NAV.push('hall')` | Hall ESC / 返回 → Title |
| Hall「出发」 | `NAV.push('map')` | Map ESC / 返回 → Hall |
| Map 选关 | `NAV.push('select')` | Select ESC / 返回 → Map，保留章与关索引 |
| Title「制作名单」 | 覆盖层 | ESC / 右键 / 点遮罩 / 「关闭 ×」→ 回 Title |
| Select 确认 | `NAV.reset('play')` + Play | 不再保留 Select 作为返回目标；本批不接 Play 暂停/结算 |

## 3. 实际验证

用 Playwright 从真实入口跑键盘与鼠标路径，读取 `window.__nav.path()` 与 `window.__game.scene.getScenes(true)`：

| 路径 | 结果 |
|---|---|
| 冷启动 | `["title"]`，仅 Title active |
| Title → Map | `["title","map"]`，仅 Map active |
| Map → Title（ESC / 返回按钮） | `["title"]`，仅 Title active |
| Title → Hall | `["title","hall"]`，仅 Hall active |
| Hall → Title（ESC） | `["title"]`，仅 Title active |
| Hall → Map → Hall | `["title","hall","map"]` → `["title","hall"]`，场景同步停止 |
| Map → Select | `["title","map","select"]`，仅 Select active |
| Select → Map | `["title","map"]`，`map.ci/si` 保留 |
| 制作名单打开/关闭 | `overlay=credits` → `null`；ESC、右键、关闭按钮均实测 |
| 右键点标题菜单 | 不触发进入，覆盖层保持 `null` |

**构建**：`node tools/build.mjs --single`；`dist/game.b6c0538f.js`、`dist/assets.5a11159c.js`、单文件 `web/game.html` 1820 KB。Pages 入口与单文件版均 `errs=[]`。

## 4. 本批未做

- 逐章普通 / 噩梦 / 地狱难度（P0-2）；
- Play 暂停 / 死亡结算接入 NAV（后续批次，避免动战斗核心）；
- 地图章节一层 + 节点二层、武器/角色双栏、Theme1 视觉组件（P1）；
- 角色 / 武器 / 饰品的成长与经济系统（P1–P2）。
