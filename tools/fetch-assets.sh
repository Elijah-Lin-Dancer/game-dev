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
# CC0：Ninja Adventure 官方 Godot 示例工程（只有地图切片与 4 首音乐，不含角色美术）
clone NinjaAdventure-godot   https://github.com/pixel-boy/NinjaAdventure.git
# OFL-1.1：中日韩像素字体
clone fusion-pixel-font     https://github.com/TakWolf/fusion-pixel-font.git
# MIT：代码级像素特效
clone pixelfx               https://github.com/patch-gg/pixelfx.git

# CC0：Ninja Adventure 完整素材包（itch.io 不可达，改从转存仓库稀疏拉取）
# 该目录带官方 README.md 与 LICENSE.txt 原文，下载后先核对 LICENSE 是否为 CC0。
fetch_ninja_pack() {
  dest="$RAW/NinjaAdventure"
  if [ -f "$dest/LICENSE.txt" ]; then
    echo "跳过 NinjaAdventure（已存在）"
    return 0
  fi
  echo "拉取 NinjaAdventure（稀疏）"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  git clone --depth 1 --filter=blob:none --sparse --quiet \
    https://github.com/MarioLDD/Kuroshiro-adventure.git "$tmp/src"
  ( cd "$tmp/src" && git sparse-checkout set Assets/NinjaAdventure )
  mkdir -p "$dest"
  rsync -a --exclude='*.meta' "$tmp/src/Assets/NinjaAdventure/" "$dest/"
}
fetch_ninja_pack

echo
echo "完成。下一步："
echo "  1. 核对 assets/00-raw/<包名>/LICENSE 原文"
echo "  2. 逐件登记到 assets/CREDITS.md"
