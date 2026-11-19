#!/usr/bin/env bash
# 校验 assets/CREDITS.md 的登记完整性（对应验收标准 M1）。
# 只检查表格字段是否齐全，不联网、不判断协议本身。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$ROOT/assets/CREDITS.md"

[ -f "$FILE" ] || { echo "缺少 $FILE"; exit 1; }

fail=0
rows=0
placeholder=0

while IFS= read -r line; do
  case "$line" in
    \|*) ;;
    *) continue ;;
  esac
  case "$line" in
    *"---"*) continue ;;
    *"名称"*) continue ;;
  esac

  # 去掉行首行尾的竖线后按竖线切分
  body="${line#|}"
  body="${body%|}"
  IFS='|' read -r -a cells <<< "$body"

  if [ "${#cells[@]}" -ne 7 ]; then
    echo "字段数不是 7（实际 ${#cells[@]}）：$line"
    fail=$((fail + 1))
    continue
  fi

  # 占位行（全为 —）视为空表，不计入
  all_dash=1
  for idx in 0 1 2 3 4 5 6; do
    v="$(printf '%s' "${cells[$idx]}" | sed 's/^ *//; s/ *$//')"
    [ "$v" != "—" ] && all_dash=0 && break
  done
  if [ "$all_dash" -eq 1 ]; then
    placeholder=$((placeholder + 1))
    continue
  fi

  rows=$((rows + 1))
  for idx in 0 1 2 3 4 5 6; do
    v="$(printf '%s' "${cells[$idx]}" | sed 's/^ *//; s/ *$//')"
    if [ -z "$v" ] || [ "$v" = "—" ]; then
      echo "第 $rows 条登记缺字段：$line"
      fail=$((fail + 1))
      break
    fi
  done
done < "$FILE"

echo
if [ "$rows" -eq 0 ] && [ "$placeholder" -ge 1 ]; then
  echo "空表状态，允许"
  exit 0
fi

if [ "$fail" -gt 0 ]; then
  echo "不通过：$fail 处问题（共 $rows 条登记）"
  exit 1
fi

echo "通过：$rows 条登记齐全"
