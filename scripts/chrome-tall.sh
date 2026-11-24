#!/bin/bash
# 渲染用 Chrome 包装：完整版 Chrome 无头模式的可视高度比窗口矮 ~90px，会把成片底部（字幕）截掉。
# 这里把 --window-size 的高度加 240 再启动真正的 Chrome。
# 用法：HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" npx hyperframes render -o out.mp4 --experimental-fast-capture=false
REAL="${REAL_CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
args=()
for a in "$@"; do
  if [[ "$a" =~ ^--window-size=([0-9]+),([0-9]+)$ ]]; then a="--window-size=${BASH_REMATCH[1]},$(( BASH_REMATCH[2] + 240 ))"; fi
  args+=("$a")
done
exec "$REAL" "${args[@]}"
