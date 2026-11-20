# LEDGER

每跑完一件事实测落账。时间戳为实际执行时间（+08）。

| # | 时间 | 做了什么 | 结论 | 产物 / 证据 |
|---|---|---|---|---|
| 1 | 2026-11-19 18:26 | 检索素材来源，按授权筛 | 分绿 / 黄 / 红三档；LPC 归红档 | `docs/ASSET-SOURCES.md` |
| 2 | 2026-11-19 18:27 | 克隆 pixelfx 实测代码规模 | core 140 KB（gzip 43 KB）；单特效约 3.6 KB；266 个特效文件；120 纯 + 120 模拟 + 73 带 act | 本机临时克隆，未入库 |
| 3 | 2026-11-19 18:29 | 核对各仓库授权原文 | Fusion Pixel 为 OFL-1.1；Ninja Adventure 为 CC0（含字体与音效）；Tiny Swords 禁再分发 | 各官方页面原文 |
| 4 | 2026-11-19 18:36 | 建仓库骨架与清单 | 目录结构与四条 M 条判据草案 | 本仓库首次提交 |
| 5 | 2026-11-19 19:20 | 尝试直连下载素材包 | kenney.nl 返回 403、itch.io 直连不可达；GitHub 正常 | 网络探测记录 |
| 6 | 2026-11-19 19:40 | 改为抓取各包官方示例图并合成对比板 | 四套可得；Ninja 仅有低分辨率官方图 | `docs/style-comparison/style-compare.png` |
| 7 | 2026-11-19 19:41 | 写入选型说明 | 推荐顺位：Ninja > Tiny Swords > Kenney > Pixel Adventure，待拍板 | `docs/STYLE-PICK.md` |
| 8 | 2026-11-19 19:52 | 主美术拍板 | 选定 Ninja Adventure（CC0）；回填清单与选型页 | `docs/decisions/0002-primary-art.md` |
| 9 | 2026-11-19 20:05 | 素材落地 | itch 两端均不可达；改从转存仓库稀疏拉取完整包，核对 LICENSE 为 CC0 全文；美术入库、音频留 raw | `docs/ASSET-INVENTORY.md` |
| 11 | 2026-11-19 21:10 | P1 战斗手感落地 | 音效接入、碰撞与挥砍判定、受击反馈、死亡重开；闭环机器人验 4 连杀与死亡 | `docs/decisions/0004-combat-feel.md` |
| 10 | 2026-11-19 20:40 | 原型 A 跑通 | Phaser 3 单文件 Web App；修掉列/行误读、摇杆归一化、FIT 展示尺寸三处 bug；三种视口实测通过 | `web/game.html`、ADR 0003 |

| 12 | 2026-11-19 22:05 | P2 房间结构落地 | 24×26 格房间、3×3 随机游走 3–6 间、清房开门、掉落跨房保留、28 血 Boss + 血条、通关/死亡遮罩；修掉墙切片、金币图形、Boss 贴脸生成、掉落残留、入口方向五处坑 | `docs/decisions/0005-room-structure.md` |
| 13 | 2026-11-19 22:35 | P2 闭环实测 | 门锁（px=692 撞不过）、换房（落点与来向一致）、Boss 受击节奏 700–750 ms/3 点、通关与重开（新地牢）全部通过；三种视口无报错 | `docs/PLAYTEST-2.md` |

| 14 | 2026-11-19 23:05 | 工程化第 1 步：模块化与引擎分离 | 源码拆为 core/systems/scenes 五模块，esbuild 出 19 KB 逻辑 + 85 KB 素材 + 独立引擎；冷启动 365 KB（gzip）与旧版持平，但改玩法只重下 6 KB | `docs/decisions/0006-modular-build.md` |

| 15 | 2026-11-19 23:40 | B 步手感修复 | Boss 四态预警（蓄力期贴脸 0 伤害、冲撞单次 −3）、小怪卡住侧滑、镜头朝向前瞻 ±17px、HUD 提示自适应；发现并修正前瞻符号写反 | `docs/decisions/0007-enemy-telegraph.md`、`docs/PLAYTEST-3.md` |

| 16 | 2026-11-20 10:20 | 资源管线落地 | 8 张切片打成 1024×240 图集（13.4 KB，1 请求），运行期 canvas 还原 spritesheet 帧号不变；音乐改 HTMLAudio 流式，普通房 dungeon / Boss 房 fight 自动切换，首次输入前不响；M 静音；单文件版双击可玩 | `docs/decisions/0008-asset-pipeline.md`、`web/atlas/core.png` |

| 17 | 2026-11-20 11:05 | 数据驱动与存档 | 平衡数值外置 26 项（改 JSON 免构建，实测 enemyHp 6→12 生效）；存档 v2 存累计金币/击杀/最深/通关/静音，死亡与通关各记一次；v1 迁移与坏档兜底都实测通过；`?reset` 清档 | `docs/decisions/0009-data-and-save.md`、`web/data/balance.json` |

| 18 | 2026-11-20 12:10 | 内容扩充第 1 批 | 四种小怪行为（冲刺/远程/分裂）、Boss 半血二阶段（moveCount%3 砸地+78px 预警圈）、三张强化卷轴可叠层；自测抓出 phaseT 漏减、roar 重入、UPG_ICON 未定义三个 bug | `docs/decisions/0010-content-expansion.md` |

| 19 | 2026-11-20 13:30 | 叙事层落地 | 引路人 3 行对话（28ms 打字、E 推进、对话期世界暂停）；石龛/行脚商/祭坛三事件（面板可点可按 1-4）；存档 v3 加 cycle，通关 +1，新局继承起步强化并按周目放血；实测 10→4 金币、20→15 血、6→7 小怪血 | `docs/decisions/0011-narrative.md`、`web/data/story.json` |

| 20 | 2026-11-20 16:30 | 表现力线落地 | 字体：Fusion Pixel 12px → 构建期子集 3911 字 / 129.8 KB，改名 NinjaPixel，先 load 后建 Phaser；特效：act 时间轴 8 套（hit/kill/hurt/slam/roar/pickup/upgrade），十字星+环+碎片+压扁；顿帧 42/78/95/130/190，震屏 4 档；顿帧只冻动画不冻特效补间；小怪受击白色剪影 | `docs/decisions/0012-feel-and-font.md`、`src/systems/fx.js`、`tools/subset_font.py` |

| 21 | 2026-11-20 17:10 | 扩展方案文书 | 新增 `docs/ROADMAP.md`：现状基线（含素材实数清点：24 武器 / 81 角色皮 / 58 怪 / 12 Boss / 16 图集）、5 条简陋根因、四维打分排序、8 批改动清单（文件级）+ 验收判据 + 风险登记 + 硬指标；未开工批次不改代码 | `docs/ROADMAP.md` |

| 22 | 2026-11-20 17:40 | 素材审计 | 逐批核对 58 怪（全 64×64/16px，统规格但锚点不一）、81 角色、23 武器、12 Boss（6 只有 Attack 帧）、16 图集、音频库存 31 BGM + 62 SFX（已入库仅 2+6）；确认 gem/货架/火把 三处真缺；外部平台 403/000 不可用；写入 `ROADMAP §11` 与风险 R7/R8 | `docs/ROADMAP.md` |

| 23 | 2026-11-20 21:40 | 音频线 + R7 补齐 | `tools/encode_audio.sh`（BGM 80k/44.1k、SFX 64k/22.05k）转出 6 首 BGM 3.11 MB + 10 个 SFX 51.6 KB，`web/audio` 重构为 `music/` + `sfx/`；`build.mjs` MUSIC/SFX 表扩到 6/10，单文件版 music key 同步；`music.js` 支持多 mood + `stopMusic` + 一次性曲；`play.js` 接 ui/bonus/boom/alarm 四个挂点与 victory/gameOver 音乐切换；自测抓出「sfx 实例表硬编码 6 键导致新音效 missing」并修复，10/10 音效 + 6/6 mood 运行时通过；新建 `docs/AUDIO.md`，ROADMAP 基线/R7/§11.2 同步 | `docs/AUDIO.md`、`tools/encode_audio.sh` |

| 24 | 2026-11-20 22:10 | 素材策略修正 | 推翻"外部平台不可用"的旧结论：重测 `opengameart.org` 200 并实际下载 3 个文件（campfire 467 B / gems 202 KB / slash sheet 1.2 MB），`raw.githubusercontent.com` 200；四个真缺口逐个核对许可与风格（篝火采纳 CC0、宝石与刀光因风格不合不采纳）；新增 ADR 0013「素材优先」与 `ASSET-SOURCES §4.1` 候选表，ROADMAP §11.3 与 §4 同步 | `docs/decisions/0013-asset-first-sourcing.md`、`docs/ASSET-SOURCES.md` |

| 25 | 2026-11-20 22:40 | 批 1 素材关 | 逐个量 22 个武器目录：19 把有 `SpriteInHand`，Bow/Bow2 只有 `Sprite`+`Arrow`（用横弓顶替手持，不画）；发现 `FX/SlashFx/` 7 套 32×32 斩击帧（Slash/SlashCurved/SlashDouble/SlashDoubleCurved/CircularSlash/Cut/Claw）可与武器一一配对，取代原计划的纯代码画弧；判定外部件 0、自绘 0；出两张 4× 对照图与 W-1~W-5 判据 | `docs/BATCH1-ASSETS.md`、`docs/screens/g1-weapons.png`、`g2-slashfx.png` |

| 26 | 2026-11-20 23:20 | 批 1 武器系统 | `web/data/weapons.json` 6 把 + `src/systems/weapons.js` 归一化；`attack()` 拆 melee/ranged/throw，玩家弹体独立 `this.bolts`（pierce/墙碰撞/逐目标命中）；掉落换装带 700ms 锁；HUD 武器行；图集 18→36 切片 30 KB；实测 6 把数据、苦无一穿二、换装往返；截图 w1–w4 | `docs/decisions/0014-weapons.md` |

| 27 | 2026-11-20 18:55 | 批 2 房间编排 | `dungeon.js` 新增 `assignTypes()`：6 类房权重 55/12/10/10/8/5，首间 battle、末间 boss、精英≤1、非战斗不连续、有宝箱无钥匙源时强制补精英；`play.js` 按房型生成（elite=放大 2.5×/血×2.4/橙色圆环，treasure=红宝箱+2 守卫，shop=商人+3 货，shrine=石龛，rest=篝火 3×，非战斗房直接开门）；`keyCount` 钥匙 + 0 钥匙拒开 + 精英必掉 + 商店 5 金币；通用 `showPanel` 面板；`drawMinimap()` 3×3 按房型上色；`story.json` 加 `rooms` 与三条交互提示；`save.js` 加 `roomsSeen`；图集 36→40 切片。验收 R-1~R-8 全过（10 局 dump、非战斗 20.4%、全流程通关、无 pageerror） | `docs/BATCH2-ASSETS.md`、`docs/ACCEPTANCE.md`、`assets/01-primary/external/campfire-16x16.png` |

| 28 | 2026-11-20 19:40 | 批 3 层间天赋 | `web/data/talents.json` 14 张（普通6/稀有5/史诗3）；`src/systems/talents.js` 白名单归一化 + 深度加权抽卡（60/30/10，每深一间 −6/+2/+6，已选不进池，全普通保底换一张稀有）+ 修正合并；`play.js` 每 2 间弹三列卡片（点卡/1–3 键），上限、伤害、攻速、移速、受伤、金币小数累加、击杀回血、进房回血全部接入；心数随上限重算（17→4 格半、24→6 颗）；新增 `__dbg.talents/talentPool/openTalent/pick/addTalent`。验收 T-1~T-9 全过（狂战 17/5、深度稀有度 91/75/14→73/58/49、5 间通关无报错） | `docs/BATCH3-TALENTS.md`、`docs/ACCEPTANCE.md` |

待核项：
- GB Studio Community Assets 的 MIT 标注仅见镜像页，未见仓库内 LICENSE 原文 → 标 `[待核]`
