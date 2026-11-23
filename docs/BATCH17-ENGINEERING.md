# 批 17 · 工程化：PWA / 移动端 / 首屏预算 / 冒烟

日期：2026-11-23
范围：批 17 工程化。承接批 16 元进度，不新增玩法、不改章节与剧情数据；目标是把现有 Web 版做到可安装、可离线启动、手机可操作，并留下可重复的冒烟入口。

## 1. 结论

- **PWA**：根 `manifest.json` + 4 张图标 + 构建生成的 `sw.js`；注册只在 http(s) 下发生，单文件 `file://` 自动跳过。
- **离线**：Service Worker 预缓存 12 个首屏资源；线上页面首次加载后，断网重载仍能进 Title，`storyData` 9 节点 / 3 角色 / `errs=[]`。
- **首屏预算**：关键文件合计 **1,905,859 B（1,861 KB / 1.82 MiB）**，低于 2 MiB；gzip 约 **751 KB**。音乐 3.11 MB 仍懒加载，不计入。
- **移动端**：新增 `src/systems/input.js`，Play 在触屏设备上创建 5 个半透明动作键（攻 / Q / X / E / II），保留拖拽摇杆；桌面不显示、键盘路径不变。
- **冒烟**：新增 `tools/smoke.mjs`，`npm run smoke` 自带静态 server 和 Chromium，约 10 秒跑完 9 项检查。
- 本地 960 / 640 / 844×390 / 390×844 / 单文件 / 离线全部通过；线上 Pages 验收见回填记录。

## 2. PWA

### 2.1 manifest

根 `manifest.json`，`start_url / scope` 都是 `./`，`display=standalone`，`orientation=landscape`，主题色 `#2f3b2a`。图标 3 条：192、512、maskable 512；另有 180 给 iOS `apple-touch-icon`。

图标由现有 `assets/01-primary/hub/face-ninja-clear.png` 用 ImageMagick 最近邻放大并铺底色，不新绘角色：

- `web/icons/icon-180.png`（756 B）
- `web/icons/icon-192.png`（777 B）
- `web/icons/icon-512.png`（1,214 B）
- `web/icons/icon-maskable-512.png`（1,183 B）

`index.html` 新增 `theme-color`、`mobile-web-app-capable`、`apple-mobile-web-app-capable`、manifest 与图标 `<link>`；`web/game.html` 单文件版 `pwa=false`，不引用不存在的根 manifest。

### 2.2 service worker

`tools/build.mjs` 生成根 `sw.js`，缓存名 `na-b17-<assets+game hash>`：

| 行为 | 规则 |
|---|---|
| install | `cache.addAll` 12 个首屏文件，`skipWaiting()` |
| activate | 删除同前缀旧缓存，`clients.claim()` |
| navigate | 网络优先；失败回退缓存的 `./index.html` |
| dist / web / manifest | cache-first；成功后回填 |
| `web/audio/` | 不拦截，保持音乐/音效懒加载 |

注册在 `src/main.js`：`navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })`，`file://` 直接返回；注册失败静默，不影响游戏启动。

### 2.3 离线证据

本地 127.0.0.1 实测：

- manifest `200 application/json`，`short_name=归途`，`display=standalone`，3 个图标。
- `navigator.serviceWorker.ready`：scope `http://127.0.0.1:8124/`、active `activated`、controller `true`、缓存 12 条。
- 网络重载后 controller 仍为 `true`；`context.setOffline(true)` 再 reload：Title 可进、`storyData=9`、`charsData=3`、`errs=[]`。
- CDP `Page.getAppManifest` 无 manifest error；`Page.getInstallabilityErrors` 仅返回 `in-incognito`（无头模式限制，不是 manifest 缺陷）。

截图：`docs/revamp/b17/b17-pwa-offline-960.png`。

## 3. 移动端输入

### 3.1 控件

`src/systems/input.js` 的 `TouchControls` 只在 `isTouchDevice()`（`maxTouchPoints > 0` 或 `pointer: coarse`）时创建。位置按运行时 `scene.scale.width/height` 从右/下回退，640×360 时：

| 键 | 动作 | 半径 | 位置（相对右下） |
|---|---|---|---|
| 攻 | `attack()` | 22 | 右 38 / 下 42 |
| Q | `castSkill()` | 18 | 右 96 / 下 76 |
| X | `castSkill2()` | 18 | 右 140 / 下 38 |
| E | `interact()` | 15 | 右 78 / 下 28 |
| II | `togglePause()` | 13 | 右 34 / 下 112 |

- 按钮是 Phaser `circle + text`，`setScrollFactor(0)`，深度 905/906；半透明暗底 + 细描边，和现有 UI 令牌一致。
- `hitTest(x,y)` 用半径 + 8 的触摸容差；场景级 `pointerdown` 先查按钮，命中则不再启动摇杆。
- `setEnabled` 在暂停 / 对话 / 面板 / 死亡 / 胜利时降透明度并拒绝动作；Play 的 pointerdown / pointerup 也加 `paused` 与 `panelOpen` 拦截。
- 触屏下 HUD 提示改为「拖拽移动 · 右下按键 攻击 / Q / X / E」；暂停面板提示改为「点按上方卡片 · 继续 / 回小屋」。
- 桌面路径不创建 `touchCtl`，原有 WASD / Space / Q / X / ESC 不受影响。

### 3.2 窄屏 HUD

新增 `fitInfo()`：信息条超过屏宽时等比缩到 `width - 16`。390×844 竖屏下内部逻辑 360×779，信息条不再被裁掉；640 与 960 不触发缩放。

## 4. 首屏预算

`build.mjs` 对 Pages 入口的关键文件求和并在超过 2 MiB 时让构建失败：

| 文件 | 字节 |
|---|---:|
| `index.html` | 1,328 |
| `manifest.json` | 762 |
| `web/vendor/phaser.min.js` | 1,181,917 |
| `web/fonts/game.woff2` | 133,460 |
| `web/atlas/core.png` | 181,563 |
| `dist/assets.97721d4f.js` | 110,304 |
| `dist/game.55c34185.js` | 296,525 |
| **合计** | **1,905,859 B（1,861 KB / 1.82 MiB）** |

gzip 合计约 751 KB；`web/audio/` 共 3.11 MB 不进首屏。单文件 `web/game.html` 2,009,830 B 只用于本地双击自测，不参与 Pages 首屏预算。

## 5. 冒烟脚本

`tools/smoke.mjs` 自带随机端口静态 server，自动寻找 `/usr/local/bin/chromium`、`/usr/bin/chromium`、`/usr/bin/google-chrome`，可用 `CHROME_PATH` / `PLAYWRIGHT_PATH` 覆盖。

```bash
npm run build
npm run smoke
```

实测输出：

```text
PASS Title / story 9 / chars 3
PASS Title → Map
PASS Map 章节 → Select
PASS Select → Play
PASS WASD 移动
PASS 攻击
PASS 暂停 / 恢复
PASS 存档 v11 / runs 1
PASS 触屏攻击 / 摇杆互斥
SMOKE OK
```

冒烟固定覆盖：数据装载、真实 Title→Map→章节→Select→Play、WASD 位移、攻击、暂停/恢复、`na.save v11`、触屏按钮与摇杆互斥；控制台 `pageerror` / `console.error` 非空即失败。

## 6. 本地验收

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| V-1 | manifest 与图标 | 本地 HTTP 请求 manifest；解析字段 / 图标 | 通过；200 application/json，3 图标，standalone，无 manifest error |
| V-2 | SW 安装与离线 | 首次加载 → `serviceWorker.ready` → 在线 reload → `setOffline(true)` 再 reload | 通过；active、controller、12 条缓存；离线 Title / story 9 / chars 3，`errs=[]` |
| V-3 | 首屏预算 | `npm run build` 求和 + 2 MiB 断言 | 通过；1,905,859 B（gzip 751 KB） |
| V-4 | 触屏动作键 | 844×390 hasTouch；点攻 / Q / X / E / II | 通过；5 键可见，攻触发 `atkAt`，`press=null / stick=false`，Q 进入 8s 冷却，X 未掌握、E 无报错，II 打开暂停 |
| V-5 | 竖屏窄屏 | 390×844 hasTouch；HUD 信息条与按钮 | 通过；内部 360×779，信息条缩放不裁切，5 键在右下可达 |
| V-6 | 桌面回归 | 960×540 / 640×360 无 `hasTouch` | 通过；`touchCtl=false`，键盘 HUD 与批 16 一致，`errs=[]` |
| V-7 | 单文件 | `file:///.../web/game.html?debug=1` | 通过；story 9、chars 3、`touchCtl=false`，`errs=[]` |
| V-8 | 冒烟脚本 | `npm run smoke` | 通过；9 项 PASS，`SMOKE OK` |

截图 7 张：`b17-pwa-offline-960`、`b17-mobile-play-844x390`、`b17-mobile-pause-844x390`、`b17-mobile-portrait-390x844`、`b17-play-960`、`b17-play-640`、`b17-single-960`。

## 7. 构建产物

- `dist/game.55c34185.js` **296,525 B**
- `dist/assets.97721d4f.js` **110,304 B**
- `web/game.html` **2,009,830 B**
- `index.html` **1,328 B**
- `sw.js` **1,774 B**，缓存名 `na-b17-af1d3b6e`
- `manifest.json` **762 B**
- 图集 127 切片 **181,563 B**；字体 **133,460 B**

## 8. 已知限制

- 移动端动作键只覆盖 Play；开放世界仍用点按移动 / 攻击按钮，采集与对话需要再点目标，未做统一虚拟键位。
- 不弹 `beforeinstallprompt` 自定义安装提示；浏览器菜单手动「添加到主屏幕」。
- PWA 只在 http(s) 注册；`web/game.html` 双击仍是单文件自测模式。
- portrait 不是主姿态（manifest 锁 landscape）；竖屏只保证 HUD 不裁、按钮可达，不重排战斗视野。
- 单文件 2,009,830 B 超过 2 MB，但它不是 Pages 首屏路径。
