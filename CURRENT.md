# CURRENT

目标：以 Ninja Adventure 为主美术，做《归途：星火之章》这款 Web App 形态的俯视小游戏；技术栈与分辨率已冻结，正在验证核心玩法。

当前段：P1-A 章节地图两层化 + Hall 武器/角色页数据驱动升级完成。地图一层六章卡、二层节点路径与关卡详情面板已跑通；Hall 两页改读 `chars.json` / `weapons.json`，稀有度、属性、技能、装备位、价格、掉落权重全部上卡；Select 价格去硬编码。构建 `dist/game.341ee017.js`，单文件 `web/game.html` 1832 KB；本地 Playwright 20 项通过，`errs=[]`。本轮只做页面与展示层，实体扩张（3 角色/5 武器/6 饰品）仍在 P2-1；13 个特殊关卡节点通路未接。G0/开放世界继续暂停。

已完成的批 12B：`chapters.json` 的 `final` 落地为 1 关 ×1 房（`diff 1.8`、`pressure:["threePhase"]`、`bossPool:["weaver"]`、`unlock:"lava.stage9"`、`roomTemplate:["boss"]`）；`bosses.json` 的 `weaver` 从 `kind:frog` 占位改为 `kind:weaver / name:影织者 / hp 108 / dmg 3 / speed 52 / half 30 / scale 2.2`；新增 `CFG.weaverBoss` 与 `updateWeaver` 三幕状态机：第一幕 `stalk → dashWindup → lunge → recover` 影袭冲撞，第二幕 `hover → blinkOut → castWindup → cast` 中距瞬移 + 每 4.2s 召 2 只 `spirit` 影仆 + 12 发环形弹，第三幕 `storm` 4 圈紫粉星火火雨 + 16 发密集环弹；`damageFoe` 对 `weaver` 在 66%/33% 门槛钉血，最后一下不跨幕；`spawnRoomProps` 在 Boss 房提前 return，避免 1 房关混入引路人；新增 `sky` 主题（暗紫地面、58 颗 `dust` 星点、`aura` 星晕、冷色火把/光柱、暗角 1.0）；`win()` 终章分支写星级、`gems +5`、`commitRun(true)`、`finalFx()` 星火炸开与「星火归位 / 第 N 周目」；`hall.js` BOSSES 11 项并支持 tint，`map.js` 中文名同步「影织者」。验收 Q-1~Q-9 见 `docs/BATCH12B-FINAL.md`；普通构建 `dist/game.3229d58d.js`，单文件 `web/game.html` 1817 KB。

已完成的批 12A：`web/data/chapters.json` 第五章 `lava` 落地为 9 关 ×10 房（`diff 1.6` 逐关 +0.08、模板 battle×4/elite×2/treasure/shop/rest/boss、怪池 flam/dragon/demon/lantern/spirit、Boss 池 flam/demonCyclop2、压力 burn/firerain）；`enemies.json` 25 条、`bosses.json` 11 条；新增 5 张 16px 四向小怪与 `flamIdle/demon2Idle/demon2Walk` 三张 Boss 切片，图集 97 切片 / 168 KB；`flam` 中距火球、`dragon` 三连扇、`demon` 直线冲撞、`lantern` 追踪火、`spirit` 三向扇射；炎巨灵近身火环/远距扇火/半血加速，熔火独眼复用恶魔状态机并每 3s 召 2 只 flam；`burn` 每战斗/精英房 3 圈（半径 44、1 伤/650ms、不减速），`firerain` 1.8s 首波后每 2.8s 两圈（半径 34、预警 850ms、2 伤）；暗角从 camera postFX 改为 HUD 下方 Canvas 贴图，修顶栏被压黑；图鉴 25 怪/10 Boss，修 `samurai/samuraiRed` 键与 10 Boss 两行布局；首间改为 flam/demon 交替。验收 P-1~P-8 见 `docs/BATCH12A-LAVA.md`，构建 `dist/game.4bc90aed.js`，单文件 `web/game.html` 1807 KB。

已完成的批 11：`web/data/enemies.json` 扩到 20 怪、`web/data/bosses.json` 扩到 9 Boss；新增 snake / reptile / lizard / mollusc / mouse / fish / octopus / kappa / axolot 九张 16px 四向图与行为；三章 Boss 池 `tenguBlue/tenguRed`、四章 `spirit/demonCyclop`；`desert` 暖砂褐 + 沙尘 + 流沙（2 圈，圈内速度 0.62、向心 52px/s），`sunken` 深青蓝 + 冷雾 + 水沟（全房 0.85、2 条 ±34px/s 暗流）；`enterRoom` 统一清 `zones/currents/waterSlow`；图鉴 20 怪 / 8 Boss（修正 `samBlue/samRed` id，8/8 点亮）；验收 O-1~O-7 见 `docs/BATCH11-CHAPTER34.md`，构建 `dist/game.19c18ee6.js`，单文件 `web/game.html` 1776 KB。

已完成的批 10：`web/data/enemies.json`（11 怪）、`web/data/bosses.json`（5 Boss，含巨浣熊/赤武士）、竹林 `beast/cyclope/eye/racoon` + `frog/racoon`、旧堡 `larva/skull/spider/mole/slime` + `samBlue/samRed`；旧堡 6 房模板（战斗×2/宝箱/精英/机关/Boss）、机关房石像与 E 拉门、巨浣熊跃扑/抓击/半血狂暴、赤武士 `rsam-*` 前缀复用、`fort` 暖褐石砖皮肤；蓝武士 96×48 帧尺寸修正；图鉴补浣熊/巨浣熊/赤武士/机关并点亮房型；验收 N-1~N-6 见 `docs/BATCH10-CHAPTER12.md`

已完成的批 9：`web/data/chapters.json`（六章 49 关数据表，主线 36 关 + 支线/隐藏/条件 13 关）、`src/systems/stages.js`（关卡规格/解锁/星级/进度）、`dungeon.js` 重写为按房数生成蛇形章节地牢、存档 v6（`stars`，v5 迁移不丢字段）、`src/scenes/map.js` 世界地图、`play.js` 关卡包装（房数/难度/星级结算/回地图）、流程 `Boot→Title→Hall→Map→Select→Play`；验收 Z-1~Z-10 见 `docs/BATCH9-STAGE.md`

已完成的批 8：`src/systems/options.js`（独立 `na.options`，静音/震屏/难度）、`src/scenes/title.js`（标题 + 三菜单 + 设置 + 制作名单 + 篝火）、`play.js` 暂停面板与统一压暗层 `dim()`、`shake()` 开关、困难难度乘区、场景表改为 `Boot→Title→Hall→Select→Play`；验收 Y-1~Y-10 见 `docs/BATCH8-SHELL.md`

已完成：
- P1-A 章节地图两层 + Hall 数据驱动：`map.js` 重写为六章卡一层 / 关卡节点+详情面板二层（6–9 关按 `ceil(n/2)` 双行居中）；`hall.js` 武器页 3×2 六卡、角色页三卡改读 JSON，补稀有度/属性/技能/装备位/价格/权重；`select.js` 删除 `LOCK_PRICE`，改读 `unlock.cost`；`chars.json`/`weapons.json` 补齐字段；修 `panel` 未定义、6 关 5+1 孤行、难度覆盖层副标题遮挡、锁定角色价格压技能标题、武器卡重复「掉落池」；验收见 `docs/P1-A.md`（2026-11-22）
- P0-2 逐章难度：`difficulty.js` 三档倍率与按章解锁、`save` v7（`diffSel`/`tierStars`）、地图难度覆盖层、Select/Play 消费链、Title 设置减为两行；验收见 `docs/P0-DIFF.md`
- 批 12B 终章「星火之巅」：影织者三阶段（影袭/影潮/星火）、终章结局与周目写盘、`sky` 主题、图鉴 25/11、单文件 1817 KB（`docs/BATCH12B-FINAL.md`）
- 批 12A 第五章熔岩地心：9 关 ×10 房、5 新怪、2 Boss、灼烧/火雨、暗角贴图修 HUD、图鉴 25/10、单文件 1807 KB（`docs/BATCH12A-LAVA.md`）
- 批 9 章节骨架：六章 36 关主线（5/6/7/8/9+终章，单关房数 5/6/7/8/10）、108★、259 房；地图六章页签 + 关卡卡 + 章面板；星级三判据（通关/剩血≥70%/未用休整房）写 `na.save.stars` 并取最高；存档 v6；单文件版可走通（`docs/BATCH9-STAGE.md`）
- 批 7 大厅、宝石与图鉴：`src/scenes/hall.js` 三页签、宝石 Boss 1–3 + 通关 5、解锁（弓15/锤20/法师30/骑士40）、掉落池按解锁过滤、存档 v5（`gem/unlockedWeapons/seen`）、图鉴四类首次点亮、流程 `Boot→Hall→Select→Play`；验收 X-1~X-8 全过（`docs/BATCH7-HALL.md`）
- 批 6 场景、光照与转场：`paintFloorAndWalls()` 按 `isBoss/idx≥中段/cycle≥2` 切 `dungeon|field`，石砖 `Interior` frame 322 + 草地 frame 21、16 个 `TilesetFloorDetail` 贴花、相机 `addVignette`（`[0.62,0.2]/[0.72,0.12]`）、墙角火把 ×2、石砖房 `Raylight` 光柱、`Snow.png` 灰尘粒子（上限 14）、`fadeIn(120)` + `roomBanner()`；调试口 `theme/light/dustCount/hearts`；验收 W-1~W-9 全过（`docs/BATCH6-SCENE.md`）
- 批 5 多角色与主动技能：`web/data/chars.json` 3 只、`src/systems/chars.js` 归一化、`src/scenes/select.js` 选人界面、`play.js` 按皮肤切动画与 `castSkill()`（疾影冲刺/烈焰贯穿/壁垒，CD 8s）、存档 v4 记 `lastChar/chars`；验收 V-1~V-8 全过（`docs/BATCH5-CHARS.md`）
- 批 4 敌人与 Boss 扩展：6 新怪（Slime 分裂/Spider 吐网减速/Owl 悬停俯冲/Mushroom 毒雾/Mole 钻地冒头/Skull 追踪弹）、4 词缀（狂暴/护盾/分裂/迅捷）、第二只 Boss 蓝武士（横斩/突进斩/召唤/半血二阶段）、同屏上限 8；素材全部包内，外部件 0、自绘 0；验收 U-1~U-12 全过（`docs/BATCH4-ASSETS.md`）
- 批 3 层间天赋：`web/data/talents.json` 14 张（6/5/3 档）、`src/systems/talents.js`（归一化/深度加权抽卡/修正合并）、`play.js` 三列卡片 UI（点卡或 1–3）、上限/伤害/攻速/移速/受伤/金币/击杀与进房回血接入、动态心数；验收 T-1~T-9 全过（`docs/BATCH3-TALENTS.md`）
- 批 2 房间编排：`dungeon.js` 加 `assignTypes()`（55/12/10/10/8/5 + 精英≤1/非战斗不连续/钥匙断供保护）；`play.js` 按房型生成敌人与道具、`spawnShop/spawnChest/spawnRest`、通用 `showPanel`、`keyCount` 钥匙、精英 `makeElite()`+橙色圆环、`drawMinimap()`；`story.json` 加 `rooms` 文案与三条交互提示；`save.js` 加 `roomsSeen`；图集 40 切片；调试口 `roomTypes/jumpType/keys/shopStock/use/tex`。验收 R-1~R-8 全过（`docs/BATCH2-ASSETS.md §5`）
- 批 1 武器系统（ADR 0014）：`web/data/weapons.json` 6 把（刀/巨剑/锤/弓/杖/苦无）、`attack()` 拆 melee/ranged/throw、`this.bolts` 玩家弹体、掉落换装（旧武器留地可取回）、HUD 武器行
- 音频线（`docs/AUDIO.md`）：`tools/encode_audio.sh` 转 6 首 BGM（3.11 MB，懒加载）+ 10 个 SFX（51.6 KB，内联），按 mood 切换、`loop:false` 一次性胜利曲、死亡停乐、M 静音入档
- 素材来源清单与授权策略（ADR 0001）
- 主美术选定 Ninja Adventure（ADR 0002），素材已落地
- 跨端策略、分辨率与技术栈（ADR 0003），原型 A 可运行并已实测
- P1 战斗手感（ADR 0004）：碰撞、挥砍、受击、击退、血条、追击怪、音效
- P2 房间结构（ADR 0005）：3–6 间随机地牢、清房开门、掉落跨房保留、Boss 房、通关与死亡重开
- 工程化第 1 步（ADR 0006）：源码拆成 5 个模块 + esbuild 打包，引擎单独缓存，更新只下 6 KB
- 叙事层（ADR 0011）：引路人对话（打字机+世界暂停）、石龛/行脚商/祭坛三类事件、周目继承（起始强化与血量缩放）
- 内容扩充（ADR 0010）：Beast/Cyclope/Eye/Larva 四种行为、Boss 半血二阶段（冲撞+砸地预警圈）、三张强化卷轴与 HUD 叠层显示
- 数据驱动与存档（ADR 0009）：平衡数值外置 `web/data/balance.json`（改数字免构建）、版本化 localStorage 存档（坏档/旧档兜底）、结算写盘、HUD 显示累计进度
- 资源管线（ADR 0008）：构建期打图集（1 张 PNG 装 8 张切片）、运行期还原 spritesheet 不改帧号、音乐 HTMLAudio 流式按房间切换、M 静音
- B 步手感（ADR 0007）：Boss 四态预警、伤害绑冲撞帧、小怪卡住侧滑、镜头朝向前瞻、提示条自适应（证据见 PLAYTEST-3）

阻塞项：
- P1 手感待主测（见 docs/PLAYTEST-1.md 六问）

下一步：
- **G0 开放世界雏形**：3 屏、2 气候、采集 + 1 NPC、`na.world`（顺位见 `docs/MASTERPLAN.md`）
- 批 13 小屋：出发台/锻造/训练场 + 3 NPC
- 按章节拆图集与房间预加载（真·懒加载）
- 中文字体接入 HUD
- 叙事层（NPC 对话/周目）与结算页对比历史最好
- Boss 攻击帧与更多招式（影织者仍只有 5 帧 Idle，靠状态机/预警）
- 小怪绕障的定点验证（U 形墙）

不做什么：
- 不做多包混搭（只允许一套补充，且不补角色）
- 不引入 CC-BY-SA / GPL 素材
- 原始全量包不入 git
- 首期不做抖音小游戏打包，不接存档

