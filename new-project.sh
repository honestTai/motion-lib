#!/bin/bash
# 用法: motion-lib/new-project.sh <项目目录>
# 把动效库（fx.js / fx.css / 字体 / GSAP）拷进项目的 lib/，HyperFrames 只能读项目目录里的文件。
# 已有项目再跑一次 = 把库更新到最新版。
set -e
LIB="$(cd "$(dirname "$0")" && pwd)"
DIR="${1:?用法: new-project.sh <项目目录>}"
mkdir -p "$DIR/lib"
rsync -a --delete "$LIB/fx.js" "$LIB/fx.css" "$LIB/chrome-tall.sh" "$LIB/fonts" "$LIB/vendor" "$DIR/lib/"
echo "✓ 动效库已装到 $DIR/lib"
