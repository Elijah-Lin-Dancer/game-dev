#!/usr/bin/env bash
# 拉取可 clone 的 CC0 / MIT 素材仓库到 assets/00-raw/。
# 可重复执行：已存在的目录会跳过。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/assets/00-raw"
mkdir -p "$RAW"

clone() {
  name="$1"
  url="$2"
  if [ -d "$RAW/$name/.git" ]; then
    echo "跳过 $name（已存在）"
    return 0
  fi
  echo "拉取 $name"
  git clone --depth 1 --quiet "$url" "$RAW/$name"
}

# CC0：整套主题素材
clone superpowers-asset-packs https://github.com/sparklinlabs/superpowers-asset-packs.git
# CC0：俯视忍者全套，含字体与音效
clone NinjaAdventure        https://github.com/pixel-boy/NinjaAdventure.git
# OFL-1.1：中日韩像素字体
clone fusion-pixel-font     https://github.com/TakWolf/fusion-pixel-font.git
# MIT：代码级像素特效
clone pixelfx               https://github.com/patch-gg/pixelfx.git

echo
echo "完成。下一步："
echo "  1. 核对 assets/00-raw/<包名>/LICENSE 原文"
echo "  2. 逐件登记到 assets/CREDITS.md"
