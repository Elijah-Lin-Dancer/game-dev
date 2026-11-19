# game-dev

**在线试玩**：<https://elijah-lin-dancer.github.io/game-dev/>


新游戏的开发仓库。当前阶段：主美术与技术栈已定，P1 战斗已实现，P2 房间结构已实现并跑通一局（随机房间 / 清房开门 / 掉落 / Boss / 通关与死亡重开）。

## 目录

| 位置 | 内容 |
|---|---|
| `index.html` | Pages 入口，跳转到 `web/game.html` |
| `web/game.html` | **可直接打开玩的单文件原型**（Phaser + 素材 + 音效全内联，1.25 MB） |
| `src/` | 源码（`core/config.js` 数值、`systems/dungeon.js` 地牢、`scenes/` 场景、`main.js` 入口） |
| `dist/` | 构建产物：`game.<hash>.js`（逻辑）、`assets.<hash>.js`（素材） |
| `tools/build.mjs` | esbuild 打包，生成 Pages 入口与单文件自测版 |
| `web/audio/` | 从素材包里转出来的 5 个 mp3 音效（已入库，不必重转） |
| `docs/ASSET-SOURCES.md` | 素材来源清单：GitHub 仓库、平台、按类型、授权红线 |
| `docs/ASSET-INVENTORY.md` | Ninja Adventure 落地清点：来源链、分类统计、缺口 |
| `docs/STYLE-PICK.md` | 主美术四选一的对比与推荐顺位（已定稿） |
| `docs/style-comparison/style-compare.png` | 四套候选的官方示例对比图 |
| `docs/decisions/` | 决策记录（ADR 0001–0005） |
| `docs/PLAYTEST-1.md` | **P1 上手自测清单**（六问，凭直觉答） |
| `docs/PLAYTEST-2.md` | P2 验证记录（门锁 / 换房 / 掉落 / Boss / 重开的实测证据） |
| `docs/ACCEPTANCE.md` | 验收标准（草案，未冻结） |
| `assets/` | 素材落地目录；`00-raw` 放原始包与包内 LICENSE，不入 git |
| `assets/CREDITS.md` | 逐件素材登记表 |
| `tools/fetch-assets.sh` | 拉取可 clone 的 CC0 素材仓库 |

| `CURRENT.md` / `LEDGER.md` | 当前目标 / 任务台账 |

## 已定

| 项 | 结论 | 记录 |
|---|---|---|
| 主美术 | Ninja Adventure（CC0，16×16） | ADR 0002 |
| 形态 | Web App（Pages 托管）+ 未来原生壳（Capacitor） | ADR 0003 / 0006 |
| 技术栈 | Phaser 3.80.1，本地 vendor 内联 | ADR 0003 |
| 分辨率 | 短边固定 360，长边 360–800 自适应 | ADR 0003 |
| P1 战斗参数 | 手感清单与数值表 | ADR 0004 |
| P2 房间结构 | 3×3 随机游走 3–6 间、清房开门、掉落跨房保留、Boss 房收尾 | ADR 0005 |

## 玩法形态

三层叠加，分期落地：秒级动作（P1）→ 分钟级一局结构（P2）→ 跨局冒险叙事（P3）。

## 待定

P3 叙事形态（NPC / 对话 / 存盘）尚未定；Boss 预警与二阶段待做。

## 阶段

按 `ElijahZhao/List-of-open-source-projects-for-AI-coding-agent-specification` 的新项目路径推进：

| 段 | 状态 |
|---|---|
| 0 立项分诊 | 目标假设已有，成功判据草案见 `docs/ACCEPTANCE.md` |
| 1 调研（素材来源） | 完成，见 ADR 0001 |
| 2 目标冻结 | 技术栈与分辨率已冻结；玩法按「动作 + roguelike 结构 + 冒险叙事」三层叠 |
| 3 方案 | P1 战斗、P2 房间结构均已落地 |
| 4 开发 | P1 战斗手感 + P2 一局结构（房间 / 门 / 掉落 / Boss / 输赢）已跑通；P3 未开工 |

## 部署

仓库公开后，GitHub Pages 直接托管 `main` 分支根目录：

- 入口：<https://elijah-lin-dancer.github.io/game-dev/>（跳到 `web/game.html`）
- 每次 `npm run build`（即 `node tools/build.mjs --single`）→ `git commit` → `git push`，Pages 自动重建
- 引擎 `web/vendor/phaser.min.js` 与带 hash 的 `dist/*.js` 分开交付：首次访问约 365 KB（gzip），之后改玩法只重下约 6 KB
- 根目录 `.nojekyll` 用来跳过 Jekyll 处理，避免下划线路径被忽略

## 用法

```bash
# 直接玩：浏览器打开 web/game.html（无需服务、无需联网）

# 想换音效：源 wav 在 assets/00-raw/NinjaAdventure/Sounds/Game/
# ffmpeg -i <源>.wav -c:a libmp3lame -b:a 96k -ac 1 web/audio/<名>.mp3

# 首次：装构建依赖
npm install

# 构建（同时产出自测用单文件版）
npm run build

# 拉取素材（已存在会跳过）
bash tools/fetch-assets.sh

# 校验登记表完整性
bash tools/check-credits.sh
```

`web/vendor/phaser.min.js` 为本地第三方依赖，已入库以保证离线可复现。
