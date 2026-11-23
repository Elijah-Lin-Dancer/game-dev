# 批 15：九段剧情、六张章节卡与终章之后

> 2026-11-23。范围：把原先“星火被偷 → 夺回 → 村子回暖”的平线，重写成一条有反转、有闭环的九节点剧情；接通 Title / Hall / Map / Play 的真实触发、顺序与一次性、跳过和结局回小屋；`na.save` 升 v10。
>
> 这一批不是“加一段对话”，而是把**主线叙事的因果**改掉：星火不是单纯被偷走的圣物，而是村庄用“归途者”反复回炉维持的祭品。玩家在终章选择不再把火放回祭坛。

## 1. 这一批实际改了什么

| 层 | 改动 |
|---|---|
| 剧情数据 | 重写 `web/data/story.json`：`v=3`，`story.order` 9 节点，`story.nodes` 9 节点、6 张 `card`，每节点 3–4 行对白；终章 `coda` 3 行 |
| 剧情导演 | 新增 `src/systems/story.js`：节点查询、顺序、`requires`、一次性 `seen`、章节 / Boss 映射 |
| 剧情场景 | 新增 `src/scenes/story.js`：章节卡、打字机对话框、终章 coda、ESC / S / 右上角跳过、`NAV.replace` 收尾 |
| 存档 | `save.js` v9 → v10；新增 `story.seen / story.ended`；`sanitizeStory` 只认 9 个正式节点；v9 迁移后立即落盘 |
| 导航 | `nav.js` 新增 `replace()`；同一场景返回时只弹出过场，不重复压栈 |
| 触发 | Title 开始冒险、Hall 创建、Map 打开章节 / 从 Play 返回、Play `win()` 的 `overlayBack` 全部接通 |
| 场景注册 | `main.js` 注册 `Story` |
| 视觉 | 6 张卡分别用 `faceGuide / villager / rsamIdle / faceMerchant / spiritIdle / faceSmith / faceNinjaClear`；新增 `face-ninja-clear.png`，由现有 38px Faceset 泛洪去底，透明肖像用于主角 / 影织者，不引入外部素材 |

## 2. 九节点定稿（剧情圣经）

| id | 标签 / 标题 | 触发 | 载体 | 关键叙事 |
|---|---|---|---|---|
| `prologue` | 序章 · 火熄 / 火 熄 | 首次开始冒险或首次进小屋 | 卡 + 4 行 | 引路人说星火被影织者拿走；村子活不过第七夜；“火里若有声音叫你名字，别答应” |
| `ch1` | 第一章 · 竹林 / 霜 竹 | 打开竹林章节 | 卡 + 4 行 | 村医说第一块碎片在旧堡，赤武士把它缝进胸口；他以前是守村人 |
| `ch2` | 第二章 · 赤武士 / 刀 下 | 旧堡 Boss `samRed` 结算后 | 4 行 | 赤武士：“你守的不是碎片，是一扇门。影织者没有偷火，它只是把火从祭坛上放了出来。”引路人立刻打断：“别听他。” |
| `ch3` | 第三章 · 沙海 / 无 旗 | 打开沙海章节 | 卡 + 4 行 | 商队唯一活人为了女儿把商队卖给“没有脸的影子”；他数死人的钱数得很慢 |
| `ch4` | 第四章 · 沉水 / 熄 神 | 打开沉水章节 | 卡 + 4 行 | 沉水古神是第一座村子，火从它心里长出来又把它烧瞎；“别把它带回去，让它留在这里和我一起烂掉” |
| `ch5` | 第五章 · 熔岩 / 铸 我 | 打开熔岩章节 | 卡 + 4 行 | 铁匠坦白：他不是铁匠，是给星火造笼子的前朝铸剑师；影织者是第一个拒绝回炉的归途者；每块碎片都是上一个你 |
| `final` | 终章 · 星火 / 九 世 | 终章 Boss `weaver` 结算后 | 卡 + 4 行 + 3 行 coda | 影织者是“你第一次说不的那个版本”；引路人要你把碎片放回祭坛；你没有放回去，把火举过头顶，火裂成千万点落向每一扇窗；第七夜没来，来了一场很轻的雨 |
| `epilogue` | 后日谈 · 灰烬之后 / 余 温 | 特殊关 `epilogue` 结算后 | 4 行 | 引路人失去火声；铁匠炉子冷了；商人女儿回来但不记得他；信上只有一句“如果你读到这里，说明你终于没有再点那把火” |
| `cycle2` | 周目 · 再燃 / 再 燃 | 终章后第二次回小屋（且看过后日谈） | 4 行 | 村子第一次下雨，没有火也没有人冻死；引路人退休；远处五片土地依次亮起不属于星火的灯（G2 引子） |

### 2.1 反转链

1. **序章**：观众和主角都以为“火被偷了”。
2. **赤武士**：第一次翻面——火不是被偷，是被从祭坛上放出来；他守的是门。
3. **沙海**：商人不是单纯受害者，他为了女儿出卖了整支商队。
4. **沉水**：古神不是怪物，是第一座村子；火曾从它心里长出来，又把它烧瞎。
5. **熔岩**：铁匠不是铁匠，是造笼人；影织者不是贼，是第一个拒绝回炉的归途者；每块碎片都是上一个主角。
6. **终章**：影织者是“你第一次说不的那个版本”；引路人要你放回祭坛，你选择把火撒进每一扇窗。
7. **后日谈**：村子暖了，但不再需要单一守火人；每个 NPC 都失去原来的功能。
8. **再燃**：引路人退休，五片土地的灯不是星火，为 G2 留门。

## 3. 数据与存档

### 3.1 `web/data/story.json`（v3）

```json
{
  "v": 3,
  "story": {
    "order": ["prologue","ch1","ch2","ch3","ch4","ch5","final","epilogue","cycle2"],
    "nodes": [
      { "id":"prologue", "no":"00", "label":"序章 · 火熄", "chapter":"序章", "title":"火 熄",
        "card":true, "art":"hall", "glyph":"火", "tone":"#ff8a5a", "artPortrait":"faceGuide",
        "requires":null, "lines":[...], "dialog":[...] }
    ]
  }
}
```

节点字段：`id / no / label / chapter / title / subtitle / card / art / glyph / tone / artPortrait / requires / lines / dialog / coda`。`dialog` 每项 `{who,name,text}`；`who` 映射到现有头像 key。

### 3.2 `na.save v10`

```js
story: { seen: {}, ended: false }
```

- `seen`：只认 `STORY_IDS` 九个 id；`markStorySeen()` 在 Story 场景 `create()` 时写入，跳过也会写，保证“只触发一次”。
- `ended`：`final` 见过即 true；不从 `played` 或周目推断，便于后日谈独立判断。
- `sanitizeStory` 丢弃未知 id、坏值；`migrate` 与 `patchSave` 都清洗。
- `loadSave` 发现 `parsed.v !== 10` 时立即 `writeSave(next)`，避免 v9 老档每次读取都重新迁移。

## 4. 触发矩阵

| 入口 | 代码路径 | 条件 | 结束落点 |
|---|---|---|---|
| Title「开始冒险」 | `title.choose()` → `storyForTitle(meta)` | 未见 `prologue` | `NAV.push('story', {id:'prologue', next:{scene:'map'}})`；结束 `NAV.replace('map')` |
| Hall 创建 | `hall.create()` → `storyForHall(meta)` | 未见 `prologue`；或 `cycle≥2`、见过 `final` / `epilogue` 且未见 `cycle2` | 80ms 后 `NAV.push('story', {next:{scene:'hall'}})` |
| Map 打开章节 | `map.openChapter(i)` → `chapterStory(ch.id)` | 章节映射 `bamboo→ch1 / desert→ch3 / sunken→ch4 / lava→ch5`，且 `requires` 已满足 | `NAV.push('story', {next:{scene:'map', data:{chapterId}}})`；结束回本章 |
| Play Boss 结算 | `play.win()` → `storyAfterBoss(spec,bossId)` | `fort + samRed → ch2`；`chapterId==='final' → final`；`special.id==='epilogue' → epilogue` | `overlayBack.story` 带回 Map；Map `pendingStory` 播放后回 Map / Hall |
| 终章结束 | `Map.create` 的 `pendingStory === 'final'` | `story` 见过 `final`，`ended=true` | 剧情结束后 `NAV.replace('hall')`，**直接回小屋** |
| 二周目再燃 | `hall.create()` → `storyForHall` | `cycle≥2`、`final` 与 `epilogue` 均见过、未见 `cycle2` | 回 Hall，下一次再触发就只走普通 Hall |

### 4.1 顺序链

`prologue → ch1 → ch2 → ch3 → ch4 → ch5 → final → epilogue → cycle2`

- `ch1.requires = prologue`
- `ch2.requires = ch1`
- `ch3.requires = ch2`
- `ch4.requires = ch3`
- `ch5.requires = ch4`
- `final.requires = ch5`
- `epilogue.requires = final`
- `cycle2.requires = epilogue`（外加 `cycle>=2`）

`cycle2` 不直接以 `final` 为前置，是为了让“后日谈”先发生；终章结束回小屋时不会立刻被“再燃”顶掉。

## 5. Story 场景

- 章节卡：内部 640×360 渲染、960 视口以 1.5× CSS 放大（与既有批 13/14 一致），卡面板宽 608；左文右画窗；`artPortrait` 自动按目标像素缩放，`villager` 16px 源单独缩小到 78。
- 对话框：底部 146 / 118 高；头像在左，名字金色；正文打字机 24ms/字；`N` 不跳过；Enter / 空格 / 点击推进；`ESC / S / 右上角`跳过。跳过直接 `finish(true)`，不播完。
- 终章 coda：3 行独立面板，标题「终章 · 星火」，按钮「点击 / Enter 落幕」。
- 返回：`finish()` 统一走 `NAV.replace(next.scene, next.data)`；同一场景返回时（章节卡回 Map、Hall 回 Hall）只弹出 story，不重复压 Map/Hall 栈。
- 字体：沿用 12 / 24 两档；正文 `UI.text.body`，标题 `UI.text.heading`，副标 / 页脚 `muted`。

## 6. 验收

| 编号 | 检查 | 结果 / 证据 |
|---|---|---|
| S1 | Title 首次开始 → 序章 → Map | 通过；`story.id=prologue`、`next={scene:'map'}`，跳过或读完均 `seen.prologue=1`，Map `mode=chapters` |
| S2 | 竹林章节卡只触发一次 | 通过；`openChapter(0)` 首次进 `ch1`，同章再次打开不触发；Hall / Title 二次进入也不重播 |
| S3 | 三、四、五章顺序 | 通过；`seen={prologue,ch1,ch2}` 打开沙漠 → `ch3`；再开沉水 → `ch4`；再开熔岩 → `ch5`；重复打开不再触发 |
| S4 | 赤武士战后 `ch2` | 通过；`play.win()` 的 `overlayBack={chapterId:'fort',stage:3,story:'ch2'}`，实际 Enter 回 Map 后播 `ch2` |
| S5 | 终章 coda 与结局回小屋 | 通过；`overlayBack.story='final'`，final 卡 4 行 + coda 3 行；结束后 active `['hall']`，`seen.final=1 / ended=true / cycle=2`，没有再次触发 cycle2 |
| S6 | 后日谈特殊关 | 通过；`special:'epilogue'` 结算 `overlayBack.story='epilogue'`，播完回 Map；`seen.epilogue=1` |
| S7 | 二周目再燃 | 通过；`final+epilogue+cycle=2` 进 Hall 触发 `cycle2`；同一次 Hall 再进入不再触发；结束回 Hall |
| S8 | 跳过 | 通过；`ESC` 从序章直接回 Map；`S` 从 ch1 直接回 Map；`seen` 已写，二次进入不重播 |
| S9 | v9 → v10 迁移 | 通过；v9 默认档（删除 `story`）读档后 `v=10`、`story={seen:{},ended:false}`；首次序章后 `seen.prologue=1` |
| S10 | 单文件 | 通过；`web/game.html` 1,992,758 B，`storyData` 已内嵌，9 节点 / 6 卡；序章卡正常，`errs=[]` |
| S11 | 960 / 640 | 通过；6 张卡、对话框、终章 coda、Hall、cycle2 均有 960×540 / 640×360 截图；内部 640×360 布局，960 为 1.5× CSS 渲染 |
| S12 | 返回栈 | 通过；章节卡结束回 Map 后 `back` 可经章节层回 Title；final 结束直接 Hall，不把 Story 留在栈 |

### 6.1 构建与文件

| 项 | 值 |
|---|---|
| 普通构建 | `dist/game.6c0b3f26.js`（280,524 B）+ `dist/assets.dbc51cb0.js`（109,593 B） |
| 单文件 | `web/game.html`（1,992,758 B） |
| 剧情数据 | `web/data/story.json` 14,224 B |
| 图集 | `web/atlas/core.png` 181,563 B / 127 切片（新增 `faceNinjaClear`） |
| 字体 | `web/fonts/game.woff2` 133,376 B |
| 入口 | `index.html` 指向 `game.6c0b3f26.js` + `assets.dbc51cb0.js` |

## 7. 截图

- `docs/revamp/b15/b15-prologue-card-960.png` / `-640.png`：序章卡
- `docs/revamp/b15/b15-prologue-dialog-960.png` / `-640.png`：打字机对话框
- `docs/revamp/b15/b15-prologue-you-dialog-960.png`：主角透明头像
- `docs/revamp/b15/b15-ch1-card-960.png` / `-640.png`：竹林 / 霜竹
- `docs/revamp/b15/b15-ch3-card-960.png`：沙海 / 无旗
- `docs/revamp/b15/b15-ch4-card-960.png`：沉水 / 熄神
- `docs/revamp/b15/b15-ch5-card-960.png`：熔岩 / 铸我
- `docs/revamp/b15/b15-final-card-960.png` / `-640.png`：终章 / 九世
- `docs/revamp/b15/b15-final-coda-960.png` / `-640.png`：终章 coda
- `docs/revamp/b15/b15-final-hall-960.png` / `-640.png`：结局回小屋
- `docs/revamp/b15/b15-cycle2-960.png` / `-640.png`：二周目再燃
- `docs/revamp/b15/b15-single-960.png`：单文件序章卡

## 8. 已知边界

- `ch2 / final / epilogue` 的验收走真实 `Play` 场景与真实 `win()`，但为了缩短验收，Boss 战本身是直接调用 `win()`，不是逐阶段打完整场；`overlayBack → Map → Story` 的路径与实战一致，完整长跑仍需后续补一次。
- Story 场景沿用内部 640×360 渲染、960 CSS 放大；不是真正 960 内部排版，和既有批 13/14 一致。
- `faceNinjaClear` 是现有 `BlueNinja/Faceset.png` 的泛洪去底派生物，只替换 Story 里 `you` 与 `final` 立绘；原 `faceNinja` 未改，Hall / Title 仍用原图。
- 后日谈特殊关是现有 13 特殊关中的 `epilogue`，未重做关卡玩法；本批只接结算后的 Story。
- `cycle2` 现在必须先看后日谈才触发；如果后续希望“终章后立刻再燃”，需要重新评估顺序链。
- G2 五群系未开始；`cycle2` 最后一句只留了“五片土地亮起不属于星火的灯”的引子。
- 视频 / 配音 / 分支 / 多结局仍不做；剧情是单线 9 节点。
