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

待核项：
- GB Studio Community Assets 的 MIT 标注仅见镜像页，未见仓库内 LICENSE 原文 → 标 `[待核]`
