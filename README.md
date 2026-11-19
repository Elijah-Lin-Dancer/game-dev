# game-dev

新游戏的开发仓库。当前阶段：主美术与技术栈已定，P1 战斗手感已实现（移动 / 挥砍 / 受击 / 追击怪 / 音效），待主测。

## 目录

| 位置 | 内容 |
|---|---|
| `web/game.html` | **可直接打开玩的单文件原型**（Phaser + 素材 + 音效全内联，1.25 MB） |
| `web/main.js` | 游戏逻辑源码（改完跑 `node tools/build-webapp.mjs` 重新生成） |
| `web/audio/` | 从素材包里转出来的 5 个 mp3 音效（已入库，不必重转） |
| `docs/ASSET-SOURCES.md` | 素材来源清单：GitHub 仓库、平台、按类型、授权红线 |
| `docs/ASSET-INVENTORY.md` | Ninja Adventure 落地清点：来源链、分类统计、缺口 |
| `docs/STYLE-PICK.md` | 主美术四选一的对比与推荐顺位（已定稿） |
| `docs/style-comparison/style-compare.png` | 四套候选的官方示例对比图 |
| `docs/decisions/` | 决策记录（ADR 0001–0003） |
| `docs/PLAYTEST-1.md` | **P1 上手自测清单**（六问，凭直觉答） |
| `docs/ACCEPTANCE.md` | 验收标准（草案，未冻结） |
| `assets/` | 素材落地目录；`00-raw` 放原始包与包内 LICENSE，不入 git |
| `assets/CREDITS.md` | 逐件素材登记表 |
| `tools/fetch-assets.sh` | 拉取可 clone 的 CC0 素材仓库 |
| `tools/build-webapp.mjs` | 把 Phaser + 素材 + 逻辑打成单文件 HTML |
| `CURRENT.md` / `LEDGER.md` | 当前目标 / 任务台账 |

## 已定

| 项 | 结论 | 记录 |
|---|---|---|
| 主美术 | Ninja Adventure（CC0，16×16） | ADR 0002 |
| 形态 | Web App（单文件 HTML） | ADR 0003 |
| 技术栈 | Phaser 3.80.1，本地 vendor 内联 | ADR 0003 |
| 分辨率 | 短边固定 360，长边 360–800 自适应 | ADR 0003 |
| P1 战斗参数 | 手感清单与数值表 | ADR 0004 |

## 待定

玩法方向：动作 / 冒险 / roguelike 三选一。

## 阶段

按 `ElijahZhao/List-of-open-source-projects-for-AI-coding-agent-specification` 的新项目路径推进：

| 段 | 状态 |
|---|---|
| 0 立项分诊 | 目标假设已有，成功判据草案见 `docs/ACCEPTANCE.md` |
| 1 调研（素材来源） | 完成，见 ADR 0001 |
| 2 目标冻结 | 技术栈与分辨率已冻结；玩法按「动作 + roguelike 结构 + 冒险叙事」三层叠 |
| 3 方案 | P1 战斗系统已落地；房间结构与数值待定 |
| 4 开发 | P1 已跑通（碰撞 / 挥砍 / 受击 / 击退 / 血量 / 追击怪 / 音效），待主测手感 |

## 用法

```bash
# 直接玩：浏览器打开 web/game.html（无需服务、无需联网）

# 想换音效：源 wav 在 assets/00-raw/NinjaAdventure/Sounds/Game/
# ffmpeg -i <源>.wav -c:a libmp3lame -b:a 96k -ac 1 web/audio/<名>.mp3

# 改完逻辑后重新打包
node tools/build-webapp.mjs

# 拉取素材（已存在会跳过）
bash tools/fetch-assets.sh

# 校验登记表完整性
bash tools/check-credits.sh
```

`web/vendor/phaser.min.js` 为本地第三方依赖，已入库以保证离线可复现。
