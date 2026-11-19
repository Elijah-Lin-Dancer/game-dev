# game-dev

新游戏的开发仓库。当前阶段：素材调研完成，玩法、技术栈、主美术风格待定。

## 目录

| 位置 | 内容 |
|---|---|
| `docs/ASSET-SOURCES.md` | 素材来源清单：GitHub 仓库、平台、按类型、授权红线 |
| `docs/STYLE-PICK.md` | 主美术四选一的对比与推荐顺位（待拍板） |
| `docs/ASSET-INVENTORY.md` | Ninja Adventure 落地清点：来源链、分类统计、缺口 |
| `docs/style-comparison/style-compare.png` | 四套候选的官方示例对比图 |
| `docs/decisions/` | 决策记录（ADR） |
| `docs/ACCEPTANCE.md` | 验收标准（草案，未冻结） |
| `assets/` | 素材落地目录；`00-raw` 放原始包与包内 LICENSE |
| `assets/CREDITS.md` | 逐件素材登记表 |
| `tools/fetch-assets.sh` | 拉取可 clone 的 CC0 素材仓库 |
| `CURRENT.md` / `LEDGER.md` | 当前目标 / 任务台账 |

## 三项待定

技术栈、内部渲染分辨率、是否像素风。这三项未定之前不做批量下载，理由见 `docs/ASSET-SOURCES.md` 第 6 节。

## 阶段

按 `ElijahZhao/List-of-open-source-projects-for-AI-coding-agent-specification` 的新项目路径推进：

| 段 | 状态 |
|---|---|
| 0 立项分诊 | 目标假设已有，成功判据草案见 `docs/ACCEPTANCE.md` |
| 1 调研（素材来源） | 完成，结论见 `docs/decisions/0001-asset-sourcing.md` |
| 2 目标冻结 | 未开始，等三项待定确认 |
| 3 方案 | 未开始 |
| 4 开发 | 未开始；spec-kit 初始化留到写代码前 |

## 用法

```bash
# 拉取可 clone 的素材仓库到 assets/00-raw/
bash tools/fetch-assets.sh

# 校验登记表完整性
bash tools/check-credits.sh
```

仓库不含构建脚本与运行入口，暂无可运行代码。
