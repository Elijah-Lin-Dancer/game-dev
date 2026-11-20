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

待核项：
- GB Studio Community Assets 的 MIT 标注仅见镜像页，未见仓库内 LICENSE 原文 → 标 `[待核]`
