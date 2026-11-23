# 批 16 · 元进度：20 成就 / 第二技能 / 周目词条

日期：2026-11-23
范围：批 16 元进度。承接批 15 剧情收尾，不新增剧情节点、不改章节数据。

## 1. 结论

- **20 成就**全部接入，`na.save v11` 新增 `ach`，Hall 新增第五页签「成就」，结算页顶部逐条 toast（最多 6 条 + 汇总）。
- **第二技能**按计划落地：忍者 25 / 法师 35 / 骑士 45 宝石；`skillDiscount` 支线 flag 接入 8 折。Hall 角色卡展示与购买，Play 用 `X` 施放，独立冷却与 HUD。
- **周目词条**：`cycle ≥ 2` 时普通怪在房间生成点随机带 1 个词缀（狂暴 / 迅捷 / 护盾 / 分裂），首个普通怪必带；精英词缀仍独立。
- 本地 960 / 640 / 单文件 / v10→v11 迁移通过；线上 Pages 20/20、购买、X、toast 与 `errs=[]` 见 §5 T-10。

## 2. 20 成就

数据与判定同源在 `src/systems/ach.js`。不是逐帧统计：只读已有跨局字段，在 `commitRun()` / Hall 进入时评估，`ach[id]=1` 入档。

| id | 名称 | 条件 | 读取字段 |
|---|---|---|---|
| `first_clear` | 初燃 | 完成任意一关 | `stars` 任一 > 0 |
| `first_blood` | 第一滴血 | 击败第 1 名敌人 | `kills` |
| `kill_50` | 五十步 | 累计击败 50 名敌人 | `kills` |
| `kill_200` | 百人斩 | 累计击败 200 名敌人 | `kills` |
| `boss_1` | 猎首 | 击败任意 Boss | `seen.bosses` |
| `boss_6` | 巨兽猎手 | 击败 6 种 Boss | `seen.bosses` 计数 |
| `boss_all` | 万物皆影 | 击败全部 11 种 Boss | `seen.bosses` 计数 |
| `clear_bamboo` | 竹影归客 | 通关竹林村 5 关 | `stars.bamboo:1..5` |
| `clear_fort` | 旧堡破门 | 通关旧堡 6 关 | `stars.fort:1..6` |
| `clear_desert` | 沙海无旗 | 通关沙海遗迹 7 关 | `stars.desert:1..7` |
| `clear_sunken` | 沉水熄神 | 通关沉水神殿 8 关 | `stars.sunken:1..8` |
| `clear_lava` | 熔岩铸我 | 通关熔岩地心 9 关 | `stars.lava:1..9` |
| `stars_30` | 三十星 | 累计 30 颗星 | 非 `sp_` 星数 |
| `stars_60` | 六十星 | 累计 60 颗星 | 非 `sp_` 星数 |
| `stars_100` | 百星 | 累计 100 颗星 | 非 `sp_` 星数 |
| `no_hit` | 无伤 | 任意关无伤通关 | `noHit` |
| `no_rest` | 不眠 | 任意关不用篝火通关 | `noRest` |
| `special` | 支线旅人 | 通关任意支线 / 隐藏 / 条件关 | `stars` 中 `sp_` 键 |
| `cycle2` | 再燃 | 进入二周目 | `cycle ≥ 2` |
| `story_end` | 星火归途 | 看完终章 | `story.ended` |

**存档**：`save.js VERSION=11`，`defaults()` 增 `ach: {}`、`skills2: []`；`migrate()` / `patchSave()` 都过 `sanitizeMarks` / `sanitizeSkills2`；v10→v11 加载后立即落盘。`ach` 上限 200 键、键字符白名单，不把坏档键带进 UI。

## 3. 第二技能

数据：`web/data/chars.json` 每个角色新增 `skill2`；`chars.js` 白名单 `shadowFan / frostRing / shieldCharge`，并归一化 `cd / cost / desc / short / count / spread / speed / dmg / pierce / life / radius / duration / distance / push / invuln`。

| 角色 | 第二技能 | 价格 | 冷却 | 效果 |
|---|---|---|---|---|
| 忍者 | 影返 `shadowFan` | 25 宝石 | 9s | 向前方扇形掷 3 枚苦无，各 4 伤，穿透 1 个目标 |
| 法师 | 霜环 `frostRing` | 35 宝石 | 10s | 半径 96，冻结普通怪 1.2s，造成 4 伤（Boss 只吃伤害） |
| 骑士 | 盾冲 `shieldCharge` | 45 宝石 | 9s | 前冲 110px，路径上敌人 4 伤并击退；0.3s 无敌 |

- **折扣**：`flags.skillDiscount`（商队线报）时 `skill2Price` 打 8 折，忍者 20 / 法师 28 / 骑士 36；基础价仍在数据里。
- **Hall**：角色卡新增「第二技能」标题 / 简短说明 / 购买按钮或「已掌握 · X 施放」；卡片高度 242→264，技能区下移，640 也留出按钮。
  - 攻击路径：`buy('skill2', id, price)` → `patchSave({ gem, skills2 })` → `render()`。
- **Play**：`X` 走 `castSkill2()`，独立 `skill2At` + `skill2Unlock` + `skill2Text` HUD；未购买时 HUD 显示「X 第二技能 · 未掌握」，按键给浮字提示，不扣冷却。
- **视觉**：影返用 `kunaiProj`；霜环用半透明蓝环 + `stunT`；盾冲用路径线段判定，不只看落点。

## 4. 周目词条

- `CFG.cycle` / `web/data/balance.json` 增 `affixAtCycle: 2`、`affixChance: 0.55`。
- 只在 `spawnRoomEnemies()` 的普通怪生成点调用 `applyCycleAffix`，不污染 Boss 召唤物、幼虫/史莱姆自然分裂、精英本体。
- 每个房间第一个普通怪 `force=true`，避免无头测试/开房随机空；其余按 55% 概率。
- 词缀效果复用精英数值：
  - `enrage`：HP ×1.15、伤害 ×1.25、速度 ×1.08（红）
  - `swift`：速度 ×1.18、`windupMul=0.7`（黄）
  - `shield`：1 层护盾（蓝）
  - `split`：死亡裂 2 只 30% 血小号；小号 `cycleAffix=false`、不再带词缀（绿）
- `__state.enemyList` 第 5 位为 `cycleAffix`；`__dbg.eliteFoe()` 仍可手工造精英。
- 已知：词缀不写回存档；跨房间重进会按新房间重新生成，属于本局状态。

## 5. 验收

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| T-1 | 20 成就与 v11 | 预置 35 个主线关星级键 + sp 星 / 11 Boss / 220 杀 / noHit / noRest / cycle2 / story ended；Hall 成就页读 `ach` | 通过；`ach` 20 键全部 `1`，标题「成就 20/20」；`save.v=11` |
| T-2 | 成就 toast | 无成就档，cycle2，Play 内 `kills=1` 后 `gameOver()` | 通过；`newAch=['first_blood','cycle2']`，顶部右侧 2 条 toast；`ach` 落盘 |
| T-3 | 第二技能计费 | 全角色档，Hall 角色页；实际 `buy('skill2','ninja',25)`；读 `gem/skills2` | 通过；`gem 120→95`、`skills2=['ninja']`；折扣档 25→20 / 35→28 / 45→36 |
| T-4 | X 与三套效果 | Play `ninja` press `X`；`__dbg.skill2State()`、`bolts`；`mage` 霜环；`knight` 盾冲路径 | 通过；`X 影返 9s`、3 枚苦无；霜环命中 1 只 `hp6→2 / stunT=1200`；盾冲前移 110、路径怪 `hp7→3 / kb 120` |
| T-5 | 周目词条 | `cycle=2` 起 Play；读 `__state.enemyList` | 通过；首房 4 只中 2 只 `cycleAffix=true`，首个必带；`cycle=1` 为 0 |
| T-6 | 分裂不与词缀串联 | 手工 `affix=split/cycleAffix=true` 的普通怪 `damageFoe(99)` | 通过；裂 2 只，`mini=true / affix=null / cycleAffix=false / hp2` |
| T-7 | 960 / 640 | Hall 角色 / 成就、Play X、toast、成就详情 | 通过；640 内部 640×360，按钮与底栏不溢出；960 为 CSS 1.5× |
| T-8 | 单文件 | `web/game.html` 2,006,522 B | 通过；9 剧情节点、3 角色 `skill2`、成就页 0/20，`errs=[]` |
| T-9 | v10→v11 | 删除 `ach/skills2` 的 v10 种子，reload + Hall | 通过；`v=11`、`ach`/`skills2` 补齐并立即落盘 |
| T-10 | Pages 线上 20/20 / 购买 / X / toast | 线上 Playwright 960×540，`--no-proxy-server`；预置 20 成就档 → Hall；购买忍者第二技能；`cycle=2` 开 Play 按 `X`；无成就档 `kills=1` 结算 | 通过；`ach` 20 键全部 `1`、标题「成就 20/20」；`gem 120→95 / skills2=['ninja']`；`cycle=2` 首房 3 只带词缀、`X 影返 9s`；`newAch=['first_blood','cycle2']`；`errs=[]` |

证据：`docs/revamp/b16/` 15 张（本地 11 张：`b16-hall-skill2-960`、`b16-hall-skill2-owned-960`、`b16-hall-ach-20-960`、`b16-ach-detail-960`、`b16-hall-char-640`、`b16-hall-ach-640`、`b16-play-x-960`、`b16-play-affix-960`、`b16-overlay-toast-960`、`b16-play-x-640`、`b16-single-960`；线上 4 张：`b16-online-ach-960`、`b16-online-skill2-960`、`b16-online-play-x-960`、`b16-online-toast-960`）。

## 6. 代码 / 构建

- 新增 `src/systems/ach.js`。
- `save.js` v11（`ach` / `skills2` / 迁移即时落盘）；`chars.js` 第二技能白名单与归一化。
- `hall.js` 第五页签、成就卡/详情、角色卡第二技能区、`buy('skill2')`、折扣价。
- `play.js` `X`、`castSkill2` / 三套效果、HUD、`commitRun` 评估 + toast、`spawnRoomEnemies` 词缀、`updateFoe` 冻结、split 条件。
- `core/config.js` / `balance.json` 周目词缀参数；`web/data/chars.json` 三套 `skill2`。
- 构建：`dist/game.1e72ccaa.js` 293,405 B + `dist/assets.97721d4f.js` 110,304 B；`web/game.html` 2,006,522 B；图集 127 切片；字体 133,392 B。

## 7. 提交与线上

- 代码 / 构建 / 11 张本地截图：`4fae361`。
- 文档、`CURRENT.md`、`LEDGER.md`、`ACCEPTANCE.md`、`MASTERPLAN.md`：`387bbba`。
- 已推送 `b5c11ed..387bbba` 到 `origin/main`；Pages 已切到 `game.1e72ccaa.js` + `assets.97721d4f.js`。
- 线上 960×540：`ach` 20 键 / 「成就 20/20」；购买忍者 25 宝石后 `gem 120→95`；`cycle=2` 首房 3 只词缀、`X 影返 9s`；无成就档 `newAch=['first_blood','cycle2']`；`errs=[]`。线上图见 §5 证据。

## 8. 已知限制

- 成就只记录、不发宝石；避免新增经济口子，后续若要奖励再单独设计。
- `story_end` 在 Hall 进入时评估；终章结束回 Hall 才看到「星火归途」入账，不在 coda 上单独 toast。
- 词缀是房间级随机，不是精英专属；`cycle=1` 不生成，`cycle=3+` 同一套强度（后续可做周目递增）。
- 第二技能折扣只在 Hall 购买时生效；购买后再拿 `skillDiscount` 不退款。
- `F` 键 / 手柄映射未接；当前只做键盘 `X`。
