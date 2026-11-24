# 批 22 / G2-5：火山第二委托、篝火传送与 world 触屏

日期：2026-11-24

## 范围

在 G2-4 火山群系上继续做**闭环**，不再增加第六群系：

1. 火山第二条委托「三淬归火」：首委托完成后，熔匠要求去焦原 / 黑曜坡 / 灰口三处既有炉眼按 E 淬火，交 3 处，奖励 3 碎片；
2. 三淬完成后解锁篝火传送：任意已点亮篝火旁按 E 打开面板，只允许去已经访问过的篝火；
3. 补 world 场景触屏：复用 `TouchControls` 的配置化按钮组，world 使用「攻 / E / 返」三键 + 场景拖拽摇杆；
4. `na.world` 由 v6 升到 v7，新增 `volcanoQuest2 / volcanoVents`，旧群系字段全部保留。

本轮不新增美术件，火种、炉眼、篝火全部复用 G2-4 / 既有素材；比例仍按 **PNG alpha 可见 bbox** 对 32px 玩家（16×16 源帧 ×2）校准。

## 数据

| 项 | 值 |
|---|---|
| 总屏数 | 30（`field / bamboo / desert / snow / volcano` 各 6） |
| 顶层新增 | `volcanoQuest2`、`quenches`、`campfires` |
| 第二委托 | `volcanoQuest2 = { id:'volcanoForge3', name:'三淬归火', npc:'volcanoSmith', need:3, rewardTokens:3 }` |
| 炉眼 | `vent-jiao 焦原炉眼 / volcano-1 / 190,232`；`vent-hei 黑曜炉眼 / volcano-4 / 200,240`；`vent-hui 灰口炉眼 / volcano-5 / 240,232` |
| 篝火 | `field-1 村口 380,246` / `bamboo-4 旧祠 180,246` / `desert-4 旧门 386,244` / `snow-3 破祠 386,244` / `volcano-3 铁砧 420,244` |
| 存档 | `na.world v7`，`SCREENS=30`，新增 `volcanoQuest2 / volcanoVents`；`VENTS` 白名单只允许三处炉眼 ID；v6→v7 迁移保留 `visited / herbs / quest / bamboo / desert / snow / volcano / boss / tokens` 并即时落盘 |

`field-1` 与 `bamboo-4` 补了实际 `campfire` 摆件（`scale 1.3`）；`desert-4` / `snow-3` / `volcano-3` 沿用原摆件。`volcano-3` 的篝火 `420,244` 与火种 `400,216` 很近，运行时在传送解锁后让篝火优先于采集；未解锁时仍允许采集。

## 运行时

- `QUEST_PROFILE.volcano` 新增 `quest2Def / quest2Save / ventSave / item2:'炉眼' / unit2:'处' / readyHint2`；`normalizeWorld` 支持 `volcanoQuest2 / quenches / campfires`。
- 新函数：`buildQuenches / refreshQuenchVisuals / buildCampfires / nearestQuench / nearestCampfire / travelUnlocked / interactCampfire / quenchAt / openTravel / travelTo`。
- 炉眼：第二委托 active 时显示淡青 `aura` + 1px 青色环 + 「E 淬火」；淬火写入 `volcanoVents`，改为暖色余烬；计数到 3 时 HUD 切「可交付 3/3」并提示回铁砧。
- 篝火：`volcanoQuest2 === 'done'` 后 `E 传送`；面板 6 行 = 5 个篝火 + 「留在原地」；未访问篝火「未点亮」且不可点；标签用「村口 · 草原 / 旧祠 · 竹林 / 旧门 · 沙海 / 破祠 · 雪原 / 铁砧 · 火山」。
- NPC：首委托 done 后优先处理第二委托，新增 `npcLines2 / showQuestChoice(npc, stage) / deliverQuest(npc, stage)`；q2 交付不消耗炉眼，只写 `volcanoQuest2:'done'` 并奖励 3 碎片。
- HUD：首委托 done 后从「火种 n/5」切「炉眼 n/3 · 淬火 / 可交付 / 已淬」；提示补「靠近炉眼按 E 淬火」「篝火旁按 E 传送」。
- 触屏：`src/systems/input.js` 的 `TouchControls` 增加第三参数 `specs`（默认仍是 Play 的 5 键）；world 新建 `WORLD_TOUCH` 三键（攻 / E / 返，锚点右下）并在 `buildTouch()` 创建。world 加场景拖拽摇杆：`stick` 状态、`pointerdown / pointermove / pointerup`、`drawStickRing`。
- 面板打开时销毁场景 banner，修复「火山 · 铁砧」横幅盖住委托 / 传送面板；传送标签不再出现「村口 · 村口」。

## 验证

| 项 | 结果 |
|---|---|
| 基础 | 30 屏 / 5 NPC / 65 采集点 / 5 篝火 / 3 炉眼；`save.v=7`，`errs=[]` |
| 第二委托接取 | seed `volcanoQuest:'done'`，熔匠对白「火稳了，可铁砧还差三口气。」→ 接受 `volcanoQuest2:'active'`，三处炉眼 `glow.visible=true` |
| 三处淬火 | 焦原 1 → 黑曜坡 2 → 灰口 3；`volcanoVents=['vent-jiao','vent-hei','vent-hui']`；HUD「炉眼 3 · 可交付 3/3」 |
| q2 交付 | 回铁砧面板 stage 2 / 2 行；点击交付 `volcanoQuest2:'done'`、`tokens 5`、`travelUnlocked=true`；对白「三淬归火。铁砧记住了你的手。」 |
| 篝火传送 | 在 `volcano-3` 旁按 E 打开 `panel.type='travel'`，6 行；第一行「村口 · 草原」；点击后 `volcano-3 x=12900 y=288 → field-1 x=344 y=288`，`visited` 保留 |
| 面板修复 | 960 截图无 banner 遮挡；传送标签为「村口 · 草原 / 旧祠 · 竹林…」，无重复名 |
| v6→v7 | v6 种子 reload：`v=7 / screens=30 / snowQuest='active'` 保留，`volcanoQuest2='none' / volcanoVents=[]` 补齐并落盘 |
| 960 / 640 | 960×540 / 640×360；30 / 5 / 65 / 5 / 3；640 传送面板 6 行无溢出 |
| 844×390 触屏 | `hasTouch=true`、`touch=true`、`touchItems=3`；E 按钮可进入采集（`gathering=true`）；拖拽摇杆实测玩家 `x 240→268`，`stick.dx=1`；HUD 切「摇杆移动 · E 采集 / 交谈 · 攻 攻击 · 返 回小屋」 |
| 单文件 | `file:///.../web/game.html?world=1&debug`：`__SINGLE__=true / 30 屏 / 5 篝火 / panel=travel / save v7`，`errs=[]` |
| PWA 断网 | `na-b18-7a92b9e9` / 12 条；在线 reload → `setOffline(true)` reload，仍 30 屏 / 5 篝火 / travel 面板可用，`errs=[]` |
| 比例审计 | `python3 tools/audit_scale.py`：**141 实例 / 0 FAIL**（新增 2 个 campfire 实例；无新增美术件） |
| 构建 / 冒烟 | 首屏 1927 KB / gzip 788 KB；`dist/game.cdb847c9.js` 323,713 B；`dist/assets.5c5b7a63.js` 123,658 B；单文件 2,085,666 B；`npm run smoke` 9 项 PASS |
| Pages 线上 | 通过；入口 `game.cdb847c9.js` + `assets.5c5b7a63.js`；30 屏 / 5 NPC / 65 点 / 5 篝火 / 3 炉眼；q2 `none→active→1/2/3→done / tokens 5`；`volcano-3 → field-1`；844×390 `touchItems=3` 且 E 打开传送；PWA `na-b18-7a92b9e9` / 12 条断网仍 30 屏；`errs=[]` |

## 素材与来源

本轮 **0 新增美术**。篝火仍为 krial CC0 `16x16 Animated Campfire`（`assets/CREDITS.md` 已登记）；炉眼复用 `volcanoVent`，火种复用 `volcanoEmber`，均为 G2-4 已登记的 ink-studio / G2 后备件重导。基础地形仍是 NinjaAdventure CC0 16px tile 调色。未新增源文件，未改素材授权表。

`tools/audit_scale.py` 的实例数由 139 增至 141，仅因 `field-1` / `bamboo-4` 增加了两个 `campfire` 摆件；可见高度下限仍通过，0 FAIL。

## 证据

本地：
- `docs/revamp/g2/g2-volcano-quest2-accept-960.png`
- `docs/revamp/g2/g2-volcano-quench-glow-960.png`
- `docs/revamp/g2/g2-volcano-quench-960.png`
- `docs/revamp/g2/g2-volcano-quest2-960.png`
- `docs/revamp/g2/g2-volcano-quest2-done-960.png`
- `docs/revamp/g2/g2-travel-960.png`
- `docs/revamp/g2/g2-travel-field-960.png`
- `docs/revamp/g2/g2-volcano-3-640.png`
- `docs/revamp/g2/g2-volcano-touch-844x390.png`
- `docs/revamp/g2/g2-volcano-touch-joystick-844x390.png`
- `docs/revamp/g2/g2-volcano-single-960.png`
- `docs/revamp/g2/g2-volcano-pwa-960.png`

线上：
- `docs/revamp/g2/g2-online-volcano-quest2-accept-960.png`
- `docs/revamp/g2/g2-online-volcano-quench-960.png`
- `docs/revamp/g2/g2-online-volcano-quest2-960.png`
- `docs/revamp/g2/g2-online-volcano-quest2-done-960.png`
- `docs/revamp/g2/g2-online-travel-960.png`
- `docs/revamp/g2/g2-online-travel-field-960.png`
- `docs/revamp/g2/g2-online-touch-844x390.png`
- `docs/revamp/g2/g2-online-pwa-960.png`

代码：
- `web/data/world.json`
- `src/systems/worldSave.js`
- `src/scenes/world.js`
- `src/systems/input.js`
- `dist/game.cdb847c9.js`
- `dist/assets.5c5b7a63.js`
- `web/game.html`
- `sw.js`
- `index.html`

## 已知限制 / 下一步

- G2 总量现为 **30 屏 / 5 群系 / 6 委托**（火山 2 条）；目标 10 条，仍缺 4 条：雪原第二条 + 草原 / 竹林 / 沙漠各 1。
- 篝火传送目前只到 5 个主落点，未做“篝火休息切昼夜”。
- world 触屏已接按钮与摇杆，但面板内点击 / 完整手动回归仍只做了自动化证据；后续真机手动手感需要再走一遍。
- 熔岩格持续伤害仍未做；`lava / vent` 只是摆件与光效，不碰生命值。
- G3 的世界 Boss 仍只有草原 `field-6` 的苔背巨兽。
