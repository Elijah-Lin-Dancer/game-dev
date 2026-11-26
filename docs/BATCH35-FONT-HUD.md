# BATCH 35 · 字体 HUD 字形收口

> 2026-11-26。范围仅限“运行时文案都有字形”，不改关卡、玩法、数值、存档或美术。  
> 本地 / 单文件已完成；Pages 线上复核在第 9 节回填。

## 1. 目标

正常 UI 路径中出现的每个字符，都必须能在运行时字体 `web/fonts/game.woff2` 中找到字形，不依赖系统 fallback、不出现豆腐块或半截字。

非目标：

- 不追求完整中文字库；字体仍是构建期按源码 / 数据实际字符裁出的子集。
- 不给源字体补自绘 glyph；优先使用源字体已有、语义相近的符号。
- 不新增关卡、Boss、委托、成就、屏或美术。

## 2. 基线

新增 `tools/audit_glyphs.py`，扫描 `src/**/*.js` 与 `web/data/*.json` 的全部字符，逐字检查 `web/fonts/game.woff2` 的 cmap。

| 项目 | 结果 |
|---|---|
| 运行时字符 | **1419** |
| 字体 cmap | **3938** |
| 缺失 | **5**：`›`（U+203A）、`−`（U+2212）、`≥`（U+2265）、`✓`（U+2713）、`✗`（U+2717） |

用途位置：

- `›`：`src/scenes/title.js` 标题菜单箭头；`src/scenes/map.js` 特殊关卡入口、开始行动 / 开始挑战、难度按钮。
- `✓` / `✗`：`src/scenes/map.js` 章节卡三档难度印记。
- `−`：`web/data/talents.json` 多条天赋描述中的负数；注释中的负号。
- `≥`：`src/systems/stages.js`、`src/scenes/play.js`、`src/systems/story.js` 注释。

## 3. 根因

源字体 `assets/01-primary/fonts/fusion-pixel-12px-monospaced-zh_hans.ttf.woff2` 的 cmap 有 **37,939** 字符，但不含这 5 个码位。只在 `tools/subset_font.py` 的字符集里追加 `›−≥✓✗` 不会生成字形：子集只能从源字体已有的 cmap / glyf 里取，不能凭空造字。

实测源字体支持、且语义接近的替代：

- `>`、`→`、`▶`、`×`、`—`、`-`、`●`、`○`、`□`、`■`、`★`、`☆`、`<`、`=` 均可用。
- `✓`、`✗`、`√`、`−`、`≥` 不可用。

## 4. 处理

按“字体已收录优先”统一文案：

| 原字符 | 替换 | 用在哪里 | 语义 |
|---|---|---|---|
| `›` | `>` | 标题菜单、特殊关卡入口、开始按钮、难度按钮 | 向右进入 / 展开 |
| `✓` | `●` | 章节难度印记（已解锁） | 实心圆点表示可用 |
| `✗` | `×` | 章节难度印记（未解锁） | 叉号表示不可用 |
| `−` | `-` | 天赋负数描述与注释 | ASCII 负号 |
| `≥` | `>=` | 注释中的大于等于 | ASCII 比较符 |

替换次数：`›` 5、`✓` 3、`✗` 2、`−` 12、`≥` 3。

同时清理 `tools/subset_font.py`：移除 `›−≥✓✗`，避免“字符集里有、字体里没有”的假修复；保留源字体实际支持的常用符号。

## 5. 改动文件

| 文件 | 改动 |
|---|---|
| `tools/audit_glyphs.py` | 新增：源码 / 数据全字符 vs 字体 cmap 审计；缺失时退出码 1 |
| `tools/subset_font.py` | 去掉源字体不支持的 5 个符号，注释说明替代口径 |
| `src/scenes/map.js` | `› → >`；`✓ → ●`；`✗ → ×` |
| `src/scenes/title.js` | 菜单箭头 `› → >` |
| `web/data/talents.json` | 负数 `− → -` |
| `src/systems/stages.js`、`src/scenes/play.js`、`src/systems/story.js` | 注释 `− → -`、`≥ → >=` |
| `web/fonts/game.woff2` | 重新构建，去掉无效符号 |
| `dist/game.79e777bc.js`、`dist/assets.7758173e.js` | 文案变化导致的新哈希 |
| `web/game.html`、`sw.js`、`index.html` | 单文件 / PWA 入口同步新哈希 |
| `tools/audit_font_ui.mjs`、`tools/audit_font_single.mjs` | 新增 UI / 单文件字形与溢出验收脚本 |

## 6. 验证

### 6.1 字形覆盖

```text
CHARS 1414 / CMAP 3938 / MISSING 0
GLYPHS OK
```

字符数从 1419 降到 1414，是因为 5 个缺字被替换；不是删文案。`tools/audit_glyphs.py` 已作为 `npm run audit:font` 可重复执行。

### 6.2 UI 三档

`tools/audit_font_ui.mjs` 本地起服务，真实进入 Title / Map：

| 视口 | 特殊关卡文案 | 难度印记 | scrollWidth | 结果 |
|---|---|---|---|---|
| 960×540 | `特殊关卡 13 >` | `难度  普 ●  噩 ×  地 ×` | 960 | PASS |
| 640×360 | `特殊关卡 13 >` | `难度  普 ●  噩 ×  地 ×` | 640 | PASS |
| 844×390 | `特殊关卡 13 >` | `难度  普 ●  噩 ×  地 ×` | 844 | PASS |

6 张截图：`docs/revamp/b30-font/font-title-960.png`、`font-map-960.png`、`font-title-640.png`、`font-map-640.png`、`font-title-844.png`、`font-map-844.png`。`pageerror / console.error = 0`。

### 6.3 单文件

`tools/audit_font_single.mjs` 用 `file://` 打开 `web/game.html`，进入 Map：

```text
special: 特殊关卡 13 >
tier:    难度  普 ●  噩 ×  地 ×
scroll:  960
fontCheck: true
errors:  []
```

截图：`docs/revamp/b30-font/font-map-single-960.png`。

### 6.4 回归

| 项目 | 结果 |
|---|---|
| `npm run smoke` | **9 PASS** |
| `python3 tools/audit_scale.py` | **223 INSTANCES / 0 FAIL** |
| 存档 / 数据 | `na.save v11`、`na.world v16`、`world.json v12` 均未改 |
| 关卡 / 屏 / Boss | 仍 49 关 / 36 屏 / 328 房 / 6 Boss，无内容变化 |

## 7. 构建

| 产物 | 结果 |
|---|---|
| 首屏 | **1915 KB / 2.00 MB（gzip 726 KB）** |
| 字体 | **133,724 B**（较审计时 133,808 B 减少 84 B） |
| 游戏逻辑 | `game.79e777bc.js` **386,984 B** |
| 素材数据 | `assets.7758173e.js` **132,445 B** |
| 单文件 | `web/game.html` **2,045,872 B** |
| 图集 | `core.png` **123,847 B / 176 切片（未改）** |
| PWA | `sw.js` 缓存 `na-b18-1ac43899`，新哈希已写入 |

## 8. 已知限制

1. **不是完整中文字库**：字体仍是子集；新增文案若含源字体没有的字符，`npm run audit:font` 会再次报警。当前 1414 字符全部有字形。
2. **`›` / `✓` / `✗` 的视觉略变**：`>` 比 `›` 细、`●` / `×` 比 `✓` / `✗` 更几何化；这是像素字体可读性优先的取舍，三档截图已确认不挤压、不溢出。
3. **没有给源字体补自绘 glyph**：若后续确需这些符号的原始造型，需要单独做 glyph 授权 / 自绘并重新审计；本轮不引入。

## 9. Pages 线上复核

待推送后回填。

## 10. 证据

- `docs/audit/FONT-HUD.json`：本轮汇总（修复前后、构建数字、脚本结果）。
- `docs/audit/FONT-UI.json`：960 / 640 / 844 Title / Map 原始结果。
- `docs/audit/FONT-SINGLE.json`：单文件原始结果。
- `docs/revamp/b30-font/`：7 张截图。
- `tools/audit_glyphs.py`、`tools/audit_font_ui.mjs`、`tools/audit_font_single.mjs`。
