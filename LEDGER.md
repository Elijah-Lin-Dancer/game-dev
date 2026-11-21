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

| 29 | 2026-11-20 20:55 | 批 4 敌人与 Boss | 6 新怪全部用包内 4×4 表（Slime 分裂/Spider 吐网减速/Owl 悬停俯冲/Mushroom 毒雾/Mole 钻地冒头/Skull 追踪弹），新增 `zones` 区域与敌弹 `slow/homing` 字段；4 精英词缀（狂暴/护盾/分裂/迅捷）随机挂载、`enemyList` 可读；`spawnBoss` 双 Boss 随机、新增 `updateSamurai + samuraiSlash`（横斩/突进/召唤/50% 血 roar 二阶段）；同屏上限 8；图集 40→52 切片。验收 U-1~U-12 全过（web slows 1483ms、护盾先破后伤、Boss 打死 `won=true`、无 pageerror） | `docs/BATCH4-ASSETS.md`、`docs/ACCEPTANCE.md`、`docs/screens/b4-*.png` |

| 30 | 2026-11-20 21:40 | 批 5 多角色与技能 | `web/data/chars.json` 三只（忍者 20/3/96 刀·冲刺、法师 16/3/90 杖·火球、骑士 26/4/84 巨剑·壁垒）；`src/systems/chars.js` 白名单归一化；新增 `src/scenes/select.js`（立绘卡 + ←/→ + Enter/点卡）；`play.js` 按皮肤切 `p-<skin>-walk/idle-<dir>`、基础属性读角色、`castSkill()` 三分支（冲刺 100px/0.4s 无敌、火球穿透 2 + 44px 爆炸、壁垒 3s 半伤 + 震开）、HUD 技能行；存档 v4 加 `lastChar/chars`；图集 52→59 切片。验收 V-1~V-8 全过（火球一发死 2、壁垒 3→2 伤、重开记住骑士） | `docs/BATCH5-CHARS.md`、`docs/ACCEPTANCE.md`、`docs/screens/b5-*.png` |

| 31 | 2026-11-21 | 批 6 场景、光照与转场 | `paintFloorAndWalls()` 主题切换（Boss 房/后半程/二周目强制石砖）、石砖 `Interior` 322 + 草地 21 整屏平铺、16 个 `TilesetFloorDetail` 贴花、相机 `addVignette` `[0.62,0.2]/[0.72,0.12]`、墙角火把 ×2（ADD 呼吸）、石砖房 `Raylight` 光柱、`Snow.png` 灰尘粒子（lifespan 2.4–4.6s / 上限 14）、`enterRoom` 120ms `fadeIn` + 1100ms 房名横幅、删旧房名 `floatText`；`TilesetDungeon.png` 实测为道具图不铺地。验收 W-1~W-9 全过（开/关光照同为 23 fps、`errs=[]`） | `docs/BATCH6-SCENE.md`、`docs/ACCEPTANCE.md`、`docs/screens/b6-*.png` |

| 32 | 2026-11-21 | 批 7 大厅、宝石与图鉴 | 新 Scene `hall.js`（武器/角色/图鉴三页签 + 宝石数）；宝石 Boss 掉 1–3、通关 +5、结算写档、HUD 与结算层显示；解锁弓 15 / 锤 20 / 法师 30 / 骑士 40；`W.list` 按 `unlockedWeapons` 过滤（职业起始武器保底）；`select.js` 锁卡与拦出发；存档 v5（`gem/unlockedWeapons/seen`，v4 迁移保留已解锁角色）；图鉴 10 怪 / 2 Boss / 6 武器 / 7 房型首次点亮；宝石图标取包内 `TilesetDungeon` frame 43，0 外部件 0 自绘。验收 X-1~X-8 全过（掉落池 4 把、80→65→35 扣费、`gem 55→61`、`errs=[]`） | `docs/BATCH7-HALL.md`、`docs/ACCEPTANCE.md`、`docs/screens/b7-*.png` |
| 33 | 2026-11-21 | 批 8 外壳：标题 / 设置 / 暂停 | 新增 `src/systems/options.js`（独立 `na.options`：静音/震屏/难度，困难敌血 ×1.25、敌伤 ×1.2）与 `src/scenes/title.js`（「忍者地牢」+ 三菜单 + 设置面板 + 制作名单 + 双角篝火动画 + 存档统计）；`play.js` 收 `shake()` 开关、ESC 暂停面板（继续 / 回小屋）、统一压暗层 `dim()` 覆盖暂停与结算；场景表 `Boot→Title→Hall→Select→Play`，`boot` 默认进标题。实测 Y-1~Y-10 全过（`spawn('beast')` 困难 max 8、暂停后角色不动、`errs=[]`）。同时把路线改写成大作骨架 `docs/MASTERPLAN.md`（三章 12 关 + 世界地图 + 小屋功能区 + 主线五阶段） | `docs/BATCH8-SHELL.md`、`docs/MASTERPLAN.md`、`docs/screens/b8-*.png` |
| 34 | 2026-11-21 | 规划定稿：章节骨架 + 开放世界独立模式 | `docs/MASTERPLAN.md` 升 v2（三章 15 关 + 隐藏关、星级三判据、地图与小屋功能区规格、主线 6 节点、批 9–14 批次表、风险表）；新建 `docs/OPENWORLD.md`（独立模式「远征」：四区 24 屏、五个动词、8 条委托、独立存档 `na.world`、G1–G3、前置条件与不做清单）；ADR 0015 记"章节化优先、开放世界独立、非无缝手作地图" | `docs/MASTERPLAN.md`、`docs/OPENWORLD.md`、`docs/decisions/0015-chapters-and-open-world.md` |
| 35 | 2026-11-21 | 规划改版：五章 41 关 + 开放世界雏形 | `MASTERPLAN.md` 升 v3：五章关数 4/5/6/7/8 + 终章（31 关主线）、难度 1.00→1.80、5 支线 / 2 隐藏 / 3 条件关（共 41 关 123★）、每章一个压力机制、7 节点叙事与 3 NPC 弧光、批 9–16 与 G0 排期；`OPENWORLD.md` 升 v2：屏幕网格 + 0.45s 边缘滑屏（不切黑场）、地表/台地/洞穴三层、五群系与五种气候（含轻机制）、G0 只做 3 屏验证四件事；ADR 0016 记录上述取舍 | `docs/MASTERPLAN.md`、`docs/OPENWORLD.md`、`docs/decisions/0016-escalating-chapters-and-world-proto.md` |
| 36 | 2026-11-21 | 规模定稿：六章 49 关 + 表结构落地 | `MASTERPLAN.md` 升 v4：主线 36 关（5/6/7/8/9+终章）、单关房数 5/6/7/8/10、章内 +0.05/关、支线 6 / 隐藏 3 / 条件 4、共 49 关 147★、328 房；`web/data/chapters.json` v1（六章、怪池/Boss 池/压力机制/门槛全量）；ADR 0017 记录规模取舍 | `docs/MASTERPLAN.md`、`web/data/chapters.json`、`docs/decisions/0017-49-stage-scale.md` |

| 37 | 2026-11-21 | 批 9 章节骨架 | `web/data/chapters.json` v1（六章主线 36 关 108★ 259 房 + 支线6/隐藏3/条件4 门槛奖励，单关房数 5/6/7/8/10、难度 1.00→1.80、章内 +5%）；`src/systems/stages.js`（规格/解锁/星级/进度/满星上限）；`dungeon.js` 重写 `makeDungeon({rooms,template})` 蛇形路线 + 末房 Boss；存档 v6 加 `stars`（白名单键、0–3、v5 迁移全保留）；新 `src/scenes/map.js`（六章页签、关卡卡、章面板、支线/隐藏/条件数量）；`play.js` 关卡包装（按章房数/难度、Boss 乘区、三星结算取最高、回地图定位）；流程 `Boot→Title→Hall→Map→Select→Play`，`boot` 补 `__chaptersData` 透传。修复 map Enter 崩溃（缺全局数据）。验收 Z-1~Z-10 全过（一章 5 房、熔岩 10 房、终章 1 房、`lava:1=3`、v5→v6 字段保留、单文件可走、`errs=[]`） | `docs/BATCH9-STAGE.md`、`docs/screens/b9-*.png`、`web/data/chapters.json` |

| 38 | 2026-11-21 | 批 10 一、二章内容 | 两章怪物池/Boss 池/房型模板全部落地：竹林 beast/cyclope/eye/racoon → frog/racoon；旧堡 larva/skull/spider/mole/slime → samBlue/samRed；旧堡模板改为战斗×2+宝箱+精英+机关+Boss。新增 `enemies.json`（11 怪）、`bosses.json`（5 Boss，含巨浣熊/赤武士）；巨浣熊跃扑+抓击+半血狂暴，赤武士复用武士行为换 `rsam-*` 前缀；机关房 3 守卫+石像，清怪后必须按 E 拉机关才开门；`fort` 皮肤暖褐石砖+加法暖光，与草地可分；修正蓝武士 96×48 帧尺寸（原 48×48 只播半身）；图鉴补浣熊/巨浣熊/赤武士/机关并让房型首次进入点亮。验收 N-1~N-6 全过（四 Boss id、旧堡 6 房模板、门锁 true→false、单文件 `errs=[]`） | `docs/BATCH10-CHAPTER12.md`、`docs/ACCEPTANCE.md`、`docs/screens/b10-*.png`、`web/data/enemies.json`、`web/data/bosses.json` |

| 39 | 2026-11-21 | 批 11 三、四章内容 | 三、四章皮肤与压力机制落地：`desert` 暖砂褐 tint + 沙尘 + 流沙（每战斗/精英房 2 圈，半径 58，圈内速度 0.62、向心 52px/s、无伤害）；`sunken` 深青蓝 + 冷雾 + 水沟（全房 `waterSlow=0.85`、2 条反向暗流 ±34px/s）；`enterRoom` 统一清 `zones/currents`，修跨房毒雾残留。新增 9 张 16px 四向小怪（snake/reptile/lizard/mollusc/mouse/fish/octopus/kappa/axolot）与四 Boss：天狗双色扇射/俯冲、魂灵环形弹幕/瞬移、恶魔独眼冲撞/震地/召唤；`enemies.json` 20 条、`bosses.json` 9 条、图集 89 切片 155 KB、`core.png` 155 KB。图鉴 20 怪/8 Boss，修 `samBlue/samRed` id 后 8/8 点亮。验收 O-1~O-7 全过（沙漠 `zones=2/envSpeed=0.62`、水殿 `waterSlow=0.85/currents±34`、四 Boss 池与二阶段、单文件 `errs=[]`）。构建 `dist/game.19c18ee6.js`，截图 b11-1~b11-7 | `docs/BATCH11-CHAPTER34.md`、`docs/ACCEPTANCE.md`、`docs/screens/b11-*.png` |

| 40 | 2026-11-21 | 批 12A 第五章熔岩地心 | 第五章 `lava` 落地：9 关 ×10 房（diff 1.6→2.24、模板 battle×4/elite×2/treasure/shop/rest/boss、怪池 flam/dragon/demon/lantern/spirit、Boss 池 flam/demonCyclop2、压力 burn/firerain）；`enemies.json` 25 条、`bosses.json` 11 条；新增 5 张 64×64/4×4/16px 小怪与 `flamIdle`（5 帧）、`demon2Idle`（5 帧）、`demon2Walk`（6 帧），图集 97 切片 / 168 KB。小怪行为：flam 中距单发火球、dragon 远距三连扇、demon 近身蓄力直线冲、lantern 漂浮追踪火、spirit 三向扇射；通用 `enemyShot()`。Boss：炎巨灵近身火环/远距扇火/半血 ×1.2，熔火独眼复用 `updateDemon()` + 前缀/图集/召唤参数，每 3s 召 2 只 flam。压力：burn 每战斗/精英房 3 圈（半径 44、1 伤/650ms、不减速），firerain 1.8s 首波后 2.8s 两圈（半径 34、预警 850ms、2 伤）；`enterRoom` 清 `fireRain/rainT`。修复：暗角从 camera postFX 改为 HUD 下方 640×360 Canvas 贴图（depth 790，主题 alpha 表），HUD 不再被压黑；首间 `easy.filter(pool.includes)` + flam/demon 交替；图鉴 `samurai/samuraiRed` 键修正；10 Boss 两行 `bossRows` 布局；Boss 截图改为 Boss(384,555)+玩家(100,620)，HUD 不遮头。验收 P-1~P-8 全过（10 房 `won=true/hp=20`、9 关 diff 1.6→2.24、Boss 奇偶轮换、5 怪弹数 1/3/1/5、burn 20→18、`burn=3/fireRain=2`、Boss 房压力 0、图鉴 25/25+10/10、单文件 1807 KB `errs=[]`、火雨 24.3 vs 25.1 fps）。构建 `dist/game.4bc90aed.js`、单文件 `web/game.html`，截图 b12a-1~6 | `docs/BATCH12A-LAVA.md`、`docs/ACCEPTANCE.md`、`docs/screens/b12a-*.png`、`web/data/chapters.json` |

待核项：
- GB Studio Community Assets 的 MIT 标注仅见镜像页，未见仓库内 LICENSE 原文 → 标 `[待核]`

| 41 | 2026-11-21 | 批 12B 终章「星火之巅」 | `chapters.json` 的 `final` 落地：1 关 ×1 房、`diff 1.8`、`pressure:threePhase`、`bossPool:weaver`、`unlock:lava.stage9`、`boss` 模板；`bosses.json` 的 `weaver` 从 `frog` 占位改为 `kind:weaver / spiritIdle / 影织者 / hp108 dmg3 speed52 half30 scale2.2`；新增 `CFG.weaverBoss` 与 `updateWeaver` 三幕：①`stalk→dashWindup→lunge→recover` 影袭 430ms 前摇/260ms 250 速；②`hover/blinkOut/castWindup/cast` 120–190 中距、2.6s 瞬移、4.2s 召 2 只 tint `0xb89aff` 的 `spirit` 影仆（45% 血/44 速/2 伤）、12 发 112 速环弹；③`storm` 4 圈紫粉火雨 + 16 发 128 速环弹；`damageFoe` 在 66%/33% 门槛钉血、`weaverShift` 900ms 无敌转场；新增 `sky` 主题（暗紫石砖、58 颗 `dust` 星点、`aura` 星晕、冷色火把/光柱、暗角 1.0）；`spawnRoomProps` Boss 房提前 return；`win()` 终章分支 `gems+5`、`commitRun(true)`、`finalFx()` 22 颗星火、星级结算与「第 N 周目」；`hall.js` BOSSES 11 项 + tint，`map.js` 同步「影织者」。顺带修 `updateFireRain` 的落点：改为围绕玩家 56–132 半径、撞墙重试 10 次，避免 fallback 随机到镜头外。验收 Q-1~Q-9 全过（终章 1 房、三幕 fp1/2/3、`fireRain=4/shots17/n5`、真实 `attack()` 三刀 `194→128→64→0`、`cycle1→2/wins0→1/gem8`、图鉴 25/11、单文件 1817 KB `errs=[]`、12A 火雨回归 2 圈）。构建 `dist/game.3229d58d.js`、单文件 `web/game.html`，截图 b12b-1~6 | `docs/BATCH12B-FINAL.md`、`docs/ACCEPTANCE.md`、`docs/MASTERPLAN.md`、`docs/screens/b12b-*.png`、`web/data/chapters.json`、`web/data/bosses.json` |
