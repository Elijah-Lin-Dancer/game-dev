# AUDIO · 音频资产与转码

来源统一是 Ninja Adventure 素材包（CC0 1.0，见 `assets/CREDITS.md`）。全量包 `assets/00-raw/NinjaAdventure/` 不入 git，产物 `web/audio/**` 入库，所以 clone 下来游戏**直接有声音**；想重新编码才需要全量包。

## 1. 已接入清单

### BGM（6 首，`web/audio/music/`，流式懒加载，不进 assets.js）

| mood | 产物 | 源文件 | 时长 | 体积 | 用途 |
|---|---|---|---|---|---|
| dungeon | `dungeon.mp3` | `Musics/21 - Dungeon.ogg` | 60s | 587 KB | 地牢战斗房 |
| fight | `fight.mp3` | `Musics/17 - Fight.ogg` | 32s | 313 KB | Boss 房 |
| cave | `cave.mp3` | `Musics/2 - The Cave.ogg` | 44s | 430 KB | 第二套地牢主题（批 6 用） |
| shop | `shop.mp3` | `Musics/20 - Good Time.ogg` | 64s | 626 KB | 商店房（批 2 用） |
| lobby | `lobby.mp3` | `Musics/1 - Adventure Begin.ogg` | 82s | 804 KB | 大厅（批 7 用） |
| victory | `victory.mp3` | `Musics/19 - Ascension.ogg` | 43.6s | 427 KB | 通关，**只播一遍**（`loop:false`） |

合计 3.11 MB。按情绪首个出现时新建 `Audio`，**不同时下载**；当前只玩地牢时只会拉 `dungeon.mp3`。

### SFX（10 个，`web/audio/sfx/`，base64 内联进 `assets.js`）

| key | 源文件 | 体积 | 挂点 |
|---|---|---|---|
| sword | `Sounds/Game/Sword.wav` | 2.5 KB | 每次挥砍 |
| hit | `Sounds/Game/Hit.wav` | 2.7 KB | 刀砍中目标 |
| hurt | `Sounds/Game/MiniImpact.wav` | 2.1 KB | 玩家受伤 |
| kill | `Sounds/Game/Kill.wav` | 2.3 KB | 击杀小怪 |
| coin | `Sounds/Game/Coin.wav` | 3.1 KB | 捡金币 |
| gameover | `Sounds/Game/GameOver.wav` | 19.4 KB | 死亡 |
| ui | `Sounds/Menu/Accept.wav` | 5.6 KB | 打开事件面板 |
| bonus | `Sounds/Game/Bonus.wav` | 4.9 KB | 拿到强化（石龛/祭坛/卷轴） |
| boom | `Sounds/Game/Explosion3.wav` | 3.4 KB | Boss 砸地 |
| alarm | `Sounds/Game/Alert.wav` | 4.5 KB | Boss 变身吼 |

合计 51.6 KB（`du` 按 4 KB 块对齐会报 72 KB）。base64 后约 69 KB，摊进 `assets.js`（65 KB → 71 KB）。

## 2. 转码参数（写死在脚本里，别随手改）

```bash
bash tools/encode_audio.sh
```

| 类别 | 参数 | 理由 |
|---|---|---|
| BGM | `-ac 1 -ar 44100 -b:a 80k` | 芯片风单声道损失小；80 kbps 下每首 0.4–0.8 MB，懒加载不留负担 |
| SFX | `-ac 1 -ar 22050 -b:a 64k` | 短音效听不出差别；单文件 2–20 KB，内联进 assets.js 可接受 |

源目录缺失时脚本直接报错退出（不会产出半截文件）。重跑会覆盖产物，**改完必须重新 `npm run build`**，否则 assets.js 里还是旧的 base64。

## 3. 还没用的库存

| 类别 | 总量 | 已用 | 剩余 |
|---|---|---|---|
| BGM | 31 首 | 6 | 25（Dark Castle / Temple / Mystical / Curse / Aquatic / Final Area / Ruins / Tension…） |
| Game SFX | 47 | 9 | 38 |
| Menu SFX | 15 | 1 | 14 |

挑剩下曲子的原则：**先有挂点再入库**。没有明确场景（比如"某个房间进入时"）的曲子不收，避免 assets/首屏白白变重。批 1 之后预计会补 `magic`（法杖）与 `arrow`（弓）。

## 4. 播放策略与已知限制

- 浏览器自动播放策略：音乐要等**第一次真实输入**后 `unlockMusic()` 才响；在此之前 `setMood()` 只把文件预拉起，不播。
- 只用 `HTML5 Audio`（`audio: { disableWebAudio: true }`），音乐不进 Phaser 加载批次。
- 切 mood 是硬切（pause + 重新 play），**没有交叉淡入**；跨 mood 时会有 1 帧静默。要淡入淡出得自己写 `volume` 渐变，暂不做。
- `M` 键静音会对所有已创建的音效与音乐同时生效（`volume = 0`），状态写进存档。
- 死亡时 `stopMusic()`，通关时切 `victory`（`loop:false`）——战斗曲不会在结算遮罩上继续响。

## 5. 验证记录（本地，2026-11-20）

| 项 | 方法 | 结果 |
|---|---|---|
| 6 首 BGM 都能播 | `__dbg.playMood(m)` 逐个切，读 `musicState()` | 6 个 mood 全部 `playing` 且 `readyState=4` |
| 一次性曲不循环 | `playMood('victory', true)` | `loop:false`，时长 43.6s |
| 死亡停乐 | `__dbg.die()` | `playing: null` |
| 10 个音效可播 | `__dbg.sfxTest(k)` | 10/10 `ok` |
| 挂点无报错 | 开面板 → 选强化 → 砸地 → 变身 → 通关 | 无 `pageerror` |
| 产物体积 | `du -sh web/audio` | 3.3 MB（音乐 3.11 + 音效 0.05） |

**没有验的**：人耳听感（音色是否配、音量是否合适）、移动端 Safari 的自动播放差异、长时间后台切回后的音频状态。这三项只有真机/真人能确认。
