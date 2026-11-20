#!/usr/bin/env bash
# 音频转码：把 Ninja Adventure 全量包里的 ogg/wav 转成游戏用的 mp3。
#
# 为什么要有这个脚本：
#   全量包 52 MB（34 MB 音乐 + 5.4 MB 音效）不入 git，但游戏要能直接跑，
#   所以产物 web/audio/** 入库；这个脚本负责"从源重新生成"，参数写死在这里，
#   避免以后有人换一套码率把包体积炸掉。
#
# 用法：bash tools/encode_audio.sh
# 依赖：ffmpeg（/usr/bin/ffmpeg）；源包缺失时直接报错退出，不会产出半截文件。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/00-raw/NinjaAdventure"
MUS="${SRC}/Musics"
SFX="${SRC}/Sounds"
OUT_MUS="$ROOT/web/audio/music"
OUT_SFX="$ROOT/web/audio/sfx"

[ -d "$MUS" ] || { echo "缺少源音乐目录：$MUS（先跑 tools/fetch-assets.sh）" >&2; exit 1; }
[ -d "$SFX" ] || { echo "缺少源音效目录：$SFX（先跑 tools/fetch-assets.sh）" >&2; exit 1; }
mkdir -p "$OUT_MUS" "$OUT_SFX"

# BGM：单声道 44.1k / 80 kbps（每首约 0.4–0.8 MB，按情绪懒加载，不会一次性拉完）
bgm() {
  local src="$1" name="$2"
  ffmpeg -y -loglevel error -i "$MUS/$src" -ac 1 -ar 44100 -b:a 80k "$OUT_MUS/$name.mp3"
  printf '  BGM  %-22s ← %s\n' "$name.mp3" "$src"
}

# SFX：单声道 22.05k / 64 kbps（base64 内联进 assets.js，必须小）
sfx() {
  local src="$1" name="$2"
  ffmpeg -y -loglevel error -i "$SFX/$src" -ac 1 -ar 22050 -b:a 64k "$OUT_SFX/$name.mp3"
  printf '  SFX  %-22s ← %s\n' "$name.mp3" "$src"
}

echo "转码 BGM："
bgm "21 - Dungeon.ogg"        dungeon
bgm "17 - Fight.ogg"          fight
bgm "1 - Adventure Begin.ogg" lobby
bgm "20 - Good Time.ogg"      shop
bgm "19 - Ascension.ogg"      victory
bgm "2 - The Cave.ogg"        cave

echo "转码 SFX："
sfx "Game/Sword.wav"       sword
sfx "Game/Hit.wav"         hit
sfx "Game/MiniImpact.wav"  hurt
sfx "Game/Kill.wav"        kill
sfx "Game/GameOver.wav"    gameover
sfx "Game/Coin.wav"        coin
sfx "Menu/Accept.wav"      ui
sfx "Game/Bonus.wav"       bonus
sfx "Game/Explosion3.wav"  boom
sfx "Game/Alert.wav"       alarm
sfx "Game/Magic1.wav"      magic

echo
echo "产物："
du -sh "$OUT_MUS" "$OUT_SFX"
