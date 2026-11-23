# CURRENT

目标：以 Ninja Adventure 为主美术，做《归途：星火之章》这款 Web App 形态的俯视小游戏；技术栈与分辨率已冻结，正在验证核心玩法。

当前段：G0 开放世界雏形「远征」完成。新增 `src/scenes/world.js`（3 屏横向世界 / 镜头跟随 / 无黑场 / 雨与沙尘 / HUD 与对话面板）、`src/systems/worldSave.js`（独立 `na.world` v1）、`web/data/world.json`（草原 / 竹林 / 沙漠、3 丛草药、村医、采 5 草药委托）；`hall.js` 页眉加东门入口，竹林 5 关全通后开放；`main.js` 场景表追加 `World`，`boot.js` 装载 `worldData`；`tokens.js` 加 `UI.world`；图集 118 切片。构建 `dist/game.6efe7a48.js`（231,951 B）+ `assets.bf95b651.js`（99,414 B），单文件 1,921,123 B。W1 三屏 0→2、W2 小雨 / 沙尘可分、W3 采集 0→2→4→6 与交付 `quest=done/tokens=1`、W4 `errs=[]`、W5 world 50.1 vs Play 50.9 fps 全部通过；960×540 / 640×360、东门进入 / ESC 回小屋、刷新恢复、`na.save` 隔离与单文件冒烟通过。代码 / 构建 `412b7d4`、文档 / 16 张截图 `fc39c3e` 已推送；Pages 已切到 `game.6efe7a48.js`，线上草原 / 沙漠 / 东门进入实测通过，`errs=[]`（4 张线上截图见 `docs/revamp/g0/`）。

上一批：P1-C-4 Play HUD / 浮层迁移。`play.js` HUD 文本、房名横幅、引路人对话、事件 / 商店 / 篝火 / 天赋、暂停、死亡结算统一接 `hudText / screenPanel / makeCard`，字号 12 / 24；`tokens.js` 新增 `UI.hud` 三档底色；事件 / 商店 / 篝火 ESC 改为先关面板，不再叠加暂停。构建 `dist/game.86f15d99.js`（211,017 B）+ `assets.5fb07765.js`（98,298 B），单文件 1,898,973 B；HUD / 暂停 / 结算 / 对话 / 事件 / 天赋 / 商店 / 篝火 / 限时计时 960×540 / 640×360 截图、实际 Title→Map→竹林村2→Select→Play、单文件冒烟 `errs=[]`。已推送 `a7a9b6c`（代码 / 构建）、`2313208`（文档 / 截图）；Pages 已切到 `game.86f15d99.js`，线上 Play HUD / 暂停 / 死亡结算实测通过，`errs=[]`。

上一批：P1-C-3 Title / Select / 设置 / 制作名单 / Map 难度覆盖层完成。Title 改为 24px 主标题 + 12px 副标题与 4 个 320×36 双行菜单卡；设置 300×190、名单 420×230 迁入 `makePanel / makeCard / makeText / makeButton`，支持键盘与遮罩关闭；Select 3 张 128×232 角色卡迁入组件层，锁定价格移至卡底；Map 难度层改 460×228 面板 + 3 行 412×34 卡片，当前档 / 解锁态 / 锁定原因保留。构建 `dist/game.fe65475a.js`（210,981 B）+ `assets.5fb07765.js`（98,298 B），单文件 1,898,881 B；Title、设置、名单、Select、锁卡 toast、难度打开 / 切换 / 空白关闭 / ESC、960×540 与 640×360 截图、单文件 Title→Map→Select→Play 冒烟均通过，`errs=[]`。已推送 `f34d355`（代码 / 构建）、`e8098fe`（本地验收文档）；Pages 已切到 `game.fe65475a.js`，线上 Title / 设置 / 名单 / 难度层 / Select / Play 实测通过，`errs=[]`。

P1-C-2 Hall 卡片与 Map 章节 / 节点 / 详情面板完成并推送。`hall.js` 的 6 张武器卡、3 张角色卡改为 `makeCard / makeText / makeButton`；`map.js` 的 6 张章节卡、5–9 个关卡节点、详情面板迁移到组件层，难度改 ghost 按钮，开始行动改 Theme1 暖橙主按钮；`primitives.js` 新增 `makeButton({variant:'ghost'})`。构建 `dist/game.357978dd.js`（204 KB）+ `assets.5fb07765.js`（96 KB），单文件 1853 KB；已推送 `31e53b4`（代码 / 构建）、`1fee341`（文档 / 截图）；Pages 已切到 `game.357978dd.js`，线上 Hall 6 武器 / 3 角色、战锤 200→180、法师 180→150、Map 6 章 / 5 节点 / 开始进 Select `bamboo:2`、锁定章节 / 节点、特殊入口 13 卡实测通过，`errs=[]`。

P1-C-1 视觉基础层 + 特殊覆盖层完成并推送。新增 `tokens.js / primitives.js`；Theme1 20 张 UI 切片入图集（97→117）；Map 特殊覆盖层改为深色九宫格面板 + 类型色条卡片 + 暖橙按钮，13 卡、锁卡 toast、Enter/ESC/遮罩/按钮/悬停通过。构建 `dist/game.0faa720c.js`（204 KB），已推送 `29f9076` / `2fc5906`，Pages 切到 `game.0faa720c.js`；线上 13 卡与开始按钮进 Select `speedrun` 实测 `errs=[]`。

更早：P1-A 特殊关卡通路完成。特殊关卡 API 组落地，13 卡 5/5/3 覆盖层接入地图页眉；支线/隐藏/条件三色，默认新档只开 `kunai`，条件未达成只弹 toast；Enter 进 Select、Play，首通写 `sp_<id>:1` 并只发一次宝石，返回 Map 自动重开并显示「已通 / 已有通关记录」。修复 Map 场景复用导致 `specialBox` 残留、覆盖层不重开的 bug。构建 `dist/game.acaaf12d.js`（197 KB）+ `assets.4a2b12f8.js`（95 KB），单文件 1843 KB；13 关逐项进入/结算与单文件冒烟通过，`errs=[]`。已推送 `a3ed3c6`，Pages 已切到 `game.acaaf12d.js`；线上特殊覆盖层与 `firefly` 首通返回实测通过，`errs=[]`。

已完成的批 12B：`chapters.json` 的 `final` 落地为 1 关 ×1 房（`diff 1.8`、`pressure:["threePhase"]`、`bossPool:["weaver"]`、`unlock:"lava.stage9"`、`roomTemplate:["boss"]`）；`bosses.json` 的 `weaver` 从 `kind:frog` 占位改为 `kind:weaver / name:影织者 / hp 108 / dmg 3 / speed 52 / half 30 / scale 2.2`；新增 `CFG.weaverBoss` 与 `updateWeaver` 三幕状态机：第一幕 `stalk → dashWindup → lunge → recover` 影袭冲撞，第二幕 `hover → blinkOut → castWindup → cast` 中距瞬移 + 每 4.2s 召 2 只 `spirit` 影仆 + 12 发环形弹，第三幕 `storm` 4 圈紫粉星火火雨 + 16 发密集环弹；`damageFoe` 对 `weaver` 在 66%/33% 门槛钉血，最后一下不跨幕；`spawnRoomProps` 在 Boss 房提前 return，避免 1 房关混入引路人；新增 `sky` 主题（暗紫地面、58 颗 `dust` 星点、`aura` 星晕、冷色火把/光柱、暗角 1.0）；`win()` 终章分支写星级、`gems +5`、`commitRun(true)`、`finalFx()` 星火炸开与「星火归位 / 第 N 周目」；`hall.js` BOSSES 11 项并支持 tint，`map.js` 中文名同步「影织者」。验收 Q-1~Q-9 见 `docs/BATCH12B-FINAL.md`；普通构建 `dist/game.3229d58d.js`，单文件 `web/game.html` 1817 KB。

已完成的批 12A：`web/data/chapters.json` 第五章 `lava` 落地为 9 关 ×10 房（`diff 1.6` 逐关 +0.08、模板 battle×4/elite×2/treasure/shop/rest/boss、怪池 flam/dragon/demon/lantern/spirit、Boss 池 flam/demonCyclop2、压力 burn/firerain）；`enemies.json` 25 条、`bosses.json` 11 条；新增 5 张 16px 四向小怪与 `flamIdle/demon2Idle/demon2Walk` 三张 Boss 切片，图集 97 切片 / 168 KB；`flam` 中距火球、`dragon` 三连扇、`demon` 直线冲撞、`lantern` 追踪火、`spirit` 三向扇射；炎巨灵近身火环/远距扇火/半血加速，熔火独眼复用恶魔状态机并每 3s 召 2 只 flam；`burn` 每战斗/精英房 3 圈（半径 44、1 伤/650ms、不减速），`firerain` 1.8s 首波后每 2.8s 两圈（半径 34、预警 850ms、2 伤）；暗角从 camera postFX 改为 HUD 下方 Canvas 贴图，修顶栏被压黑；图鉴 25 怪/10 Boss，修 `samurai/samuraiRed` 键与 10 Boss 两行布局；首间改为 flam/demon 交替。验收 P-1~P-8 见 `docs/BATCH12A-LAVA.md`，构建 `dist/game.4bc90aed.js`，单文件 `web/game.html` 1807 KB。

已完成的批 11：`web/data/enemies.json` 扩到 20 怪、`web/data/bosses.json` 扩到 9 Boss；新增 snake / reptile / lizard / mollusc / mouse / fish / octopus / kappa / axolot 九张 16px 四向图与行为；三章 Boss 池 `tenguBlue/tenguRed`、四章 `spirit/demonCyclop`；`desert` 暖砂褐 + 沙尘 + 流沙（2 圈，圈内速度 0.62、向心 52px/s），`sunken` 深青蓝 + 冷雾 + 水沟（全房 0.85、2 条 ±34px/s 暗流）；`enterRoom` 统一清 `zones/currents/waterSlow`；图鉴 20 怪 / 8 Boss（修正 `samBlue/samRed` id，8/8 点亮）；验收 O-1~O-7 见 `docs/BATCH11-CHAPTER34.md`，构建 `dist/game.19c18ee6.js`，单文件 `web/game.html` 1776 KB。

已完成的批 10：`web/data/enemies.json`（11 怪）、`web/data/bosses.json`（5 Boss，含巨浣熊/赤武士）、竹林 `beast/cyclope/eye/racoon` + `frog/racoon`、旧堡 `larva/skull/spider/mole/slime` + `samBlue/samRed`；旧堡 6 房模板（战斗×2/宝箱/精英/机关/Boss）、机关房石像与 E 拉门、巨浣熊跃扑/抓击/半血狂暴、赤武士 `rsam-*` 前缀复用、`fort` 暖褐石砖皮肤；蓝武士 96×48 帧尺寸修正；图鉴补浣熊/巨浣熊/赤武士/机关并点亮房型；验收 N-1~N-6 见 `docs/BATCH10-CHAPTER12.md`

已完成的批 9：`web/data/chapters.json`（六章 49 关数据表，主线 36 关 + 支线/隐藏/条件 13 关）、`src/systems/stages.js`（关卡规格/解锁/星级/进度）、`dungeon.js` 重写为按房数生成蛇形章节地牢、存档 v6（`stars`，v5 迁移不丢字段）、`src/scenes/map.js` 世界地图、`play.js` 关卡包装（房数/难度/星级结算/回地图）、流程 `Boot→Title→Hall→Map→Select→Play`；验收 Z-1~Z-10 见 `docs/BATCH9-STAGE.md`

已完成的批 8：`src/systems/options.js`（独立 `na.options`，静音/震屏/难度）、`src/scenes/title.js`（标题 + 三菜单 + 设置 + 制作名单 + 篝火）、`play.js` 暂停面板与统一压暗层 `dim()`、`shake()` 开关、困难难度乘区、场景表改为 `Boot→Title→Hall→Select→Play`；验收 Y-1~Y-10 见 `docs/BATCH8-SHELL.md`

已完成：
- G0 开放世界雏形：`src/scenes/world.js` + `web/data/world.json` + `worldSave.js`；3 屏草原→竹林→沙漠、雨/沙尘、3 丛草药 2 秒采集 / 90 秒重生、村医采 5 交付、独立 `na.world`、Hall 东门门槛入口；W1–W5 全过，960/640 / 单文件 / 刷新恢复 / `na.save` 隔离通过（`docs/G0.md`，构建 `dist/game.6efe7a48.js`）
- P1-C-4 Play HUD / 浮层：`play.js` HUD 文本、房名横幅、引路人对话、事件 / 商店 / 篝火 / 天赋、暂停、死亡结算迁入 `hudText / screenPanel / makeCard`，字号收敛到 12 / 24；事件 / 商店 / 篝火 ESC 先关面板；960/640 截图、实际入口、单文件冒烟与线上 HUD / 暂停 / 结算通过，`errs=[]`（`docs/P1-C-4.md`，已推送 `a7a9b6c` / `2313208`）
- P1-C-3 Title / Select / 设置 / 制作名单 / 难度层：`title.js`、`select.js`、`map.js openDiff()` 迁入 `tokens / primitives`，字号收敛到 12 / 24；960/640 截图、锁卡 toast、难度切换与单文件冒烟通过，`errs=[]`（`docs/P1-C-3.md`，已推送 `f34d355` / `e8098fe`，线上验证通过）
- P1-C-1 视觉基础层：`src/systems/ui/tokens.js` + `primitives.js`；Theme1 20 张 UI 切片入图集（117 张）；Map 特殊覆盖层改九宫格面板/类型色条卡片/暖橙按钮；13 卡、锁卡、Enter/ESC/遮罩/按钮/悬停与 960/640 截图通过，`errs=[]`（`docs/P1-C-UI.md`，2026-11-22）
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
- **G1 草原群系**：6 屏铺满 + 障碍 / 采集 / 1 个世界 Boss；G0 的 3 屏与独立 `na.world` 作为基线
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

