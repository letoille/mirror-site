#!/usr/bin/env bash
#
# 香港服务器 → 国内服务器。在**香港那台**上跑。
#
# 为什么绕这一道：国内那台直连 GitHub 很慢，而香港那台本来就要拉同一份代码。
# GitHub → 香港（海外，快）→ rsync → 国内（同区域，快，且只传变化的字节）。
# 国内那台因此完全不碰 GitHub，连 git 都不需要装。
#
#   用法：  scripts/deploy-cn.sh [--dry-run]
#   前提：  香港 → 国内 的 SSH 免密（ssh-copy-id），且 $DST_USER 对目标目录可写。
#
set -euo pipefail

SRC="${SRC:-/var/www/mirror-kalandraeye}"      # 香港这台的站点目录（git 仓库）
DST_HOST="${DST_HOST:?请设置 DST_HOST=<国内服务器地址>}"
DST_USER="${DST_USER:-deploy}"
DST_PATH="${DST_PATH:-/var/www/mirror-kalandraeye}"

DRY=(); [ "${1:-}" = "--dry-run" ] && DRY=(--dry-run -v)

# ⚠️ 目标路径写错 + --delete = 把别人的目录清空。宁可在这里挡一下。
case "$DST_PATH" in
  /|/root|/home|/var|/var/www|"") echo "DST_PATH 看起来不对：$DST_PATH" >&2; exit 2 ;;
esac

cd "$SRC"
git pull --ff-only

# 已经压过的东西别再让 rsync 压一遍，纯浪费 CPU
NOZ='zip/gz/mp4/webm/png/jpg/jpeg/webp/avif/woff/woff2/ico'
COMMON=(-a --compress --skip-compress="$NOZ" --human-readable
        --exclude '.git' --exclude 'node_modules' --exclude '.github' "${DRY[@]}")

# ⚠️ **三趟，顺序是有意的。**
#
# HTML 里写的是带内容指纹的资源地址（`site.css?v=<hash>`）。HTML 先到而资源没到的
# 那一刻，访客拿到的是一份指向 404 的页面 —— 样式全丢，和站点挂了一模一样。
# 所以：先铺资源（不删任何东西，新旧指纹并存）→ 再换 HTML → 最后才清理旧文件。
echo "① 资源"
rsync "${COMMON[@]}" --exclude '*.html' ./ "$DST_USER@$DST_HOST:$DST_PATH/"

echo "② HTML"
rsync "${COMMON[@]}" --include '*/' --include '*.html' --exclude '*' ./ "$DST_USER@$DST_HOST:$DST_PATH/"

echo "③ 清理已删除的文件"
rsync "${COMMON[@]}" --delete ./ "$DST_USER@$DST_HOST:$DST_PATH/"

echo "✓ 同步完成 → $DST_HOST:$DST_PATH"
