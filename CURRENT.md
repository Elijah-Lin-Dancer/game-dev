# CURRENT

目标：以 Ninja Adventure 为主美术，做一款 Web App 形态的俯视小游戏；技术栈与分辨率已冻结，正在验证核心玩法。

当前段：批 7 跨局进程完成（大厅三页签 + 宝石货币 + 解锁 + 图鉴）。下一步批 8 工程化收尾：PWA / Capacitor / 图集拆分 / 冒烟脚本 / 性能预算。

已完成：
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
- **批 6 表现力与反馈升级**（`docs/ROADMAP.md §8`）
- 批 7–8（顺位见 ROADMAP §3）
- 按章节拆图集与房间预加载（真·懒加载）
- 中文字体接入 HUD
- 叙事层（NPC 对话/周目）与结算页对比历史最好
- Boss 二阶段与第二招（现只有冲撞）
- 小怪绕障的定点验证（U 形墙）

不做什么：
- 不做多包混搭（只允许一套补充，且不补角色）
- 不引入 CC-BY-SA / GPL 素材
- 原始全量包不入 git
- 首期不做抖音小游戏打包，不接存档

