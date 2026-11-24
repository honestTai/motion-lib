#!/bin/bash
# 用法: motion-lib/scripts/new-project.sh <项目目录>
# 把动效库（src/core + src/modules + fonts + vendor + assets + 渲染辅助脚本）扁平同步进项目的 lib/，
# 供分镜页面直接通过 lib/fx.js、lib/fx-*.js、lib/fx.css 零配置引用（HyperFrames 仅读取项目目录内的静态资源）。
# 已有项目再跑一次 = 把库无损热更新到最新版。
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?用法: scripts/new-project.sh <项目目录>}"
mkdir -p "$DIR/lib"
rsync -a --delete \
  "$ROOT/src/core/fx.js" \
  "$ROOT/src/core/fx.css" \
  "$ROOT/src/modules/spatial/"*.js \
  "$ROOT/src/modules/three/"*.js \
  "$ROOT/src/modules/character/"*.js \
  "$ROOT/src/modules/kit/"*.js \
  "$ROOT/src/modules/audio/"*.js \
  "$ROOT/scripts/sfx.mjs" \
  "$ROOT/scripts/chrome-tall.sh" \
  "$ROOT/fonts" \
  "$ROOT/vendor" \
  "$ROOT/assets" \
  "$DIR/lib/"
chmod +x "$DIR/lib/chrome-tall.sh"
echo "✓ 动效库已装到 $DIR/lib"
