#!/usr/bin/env bash
#
# 香港服务器 → 国内服务器。在**香港那台**上跑。
#
# 为什么绕这一道：国内那台直连 GitHub 很慢，而香港那台本来就要拉同一份代码。
# GitHub → 香港（海外，快）→ rsync → 国内（同区域，快，且只传变化的字节）。
# 国内那台因此完全不碰 GitHub，连 git 都不需要装。
#
#   用法：  scripts/deploy-cn.sh [--dry-run]
#   前提：  香港的 ~/.ssh/config 里有目标主机（默认叫 tx-gz），且那个账号对目标目录可写。
#          换目标：  DST=别的别名 scripts/deploy-cn.sh
#
set -euo pipefail

SRC="${SRC:-/var/www/mirror-kalandraeye}"      # 香港这台的站点目录（git 仓库）
# 目标写 ~/.ssh/config 里的别名就够 —— 用户名、端口、密钥都归它管，
# 这里不再重复一遍（重复的那份迟早和 ssh config 对不上）。
DST="${DST:-tx-gz}"
DST_PATH="${DST_PATH:-/var/www/mirror-kalandraeye}"

DRY=(); [ "${1:-}" = "--dry-run" ] && DRY=(--dry-run)

# 进度显示。`--info=progress2` 是一行总进度（百分比 / 速度 / 剩余），rsync 3.1+ 才有；
# 旧版退回 `--progress`（每个文件一行）。`stats1` 是每趟结束时那句一行小结。
if rsync --info=help >/dev/null 2>&1; then
  PROG=(--info=progress2,stats1)
else
  PROG=(--progress --stats)
fi
# 预演时进度条没有意义，改成列文件
[ -n "${DRY[*]:-}" ] && PROG=(-v --info=stats1)

# ⚠️ 目标路径写错 + --delete = 把别人的目录清空。宁可在这里挡一下。
case "$DST_PATH" in
  /|/root|/home|/var|/var/www|"") echo "DST_PATH 看起来不对：$DST_PATH" >&2; exit 2 ;;
esac

# ⚠️ 先探一下。不然别名拼错的表现是三趟 rsync 各报一次错，
#    而第一趟报错时前面已经打印了「① 资源」，看起来像传到一半断了。
ssh -o BatchMode=yes -o ConnectTimeout=10 "$DST" true \
  || { echo "连不上 $DST —— 检查香港这台的 ~/.ssh/config" >&2; exit 3; }

cd "$SRC"
git pull --ff-only

# 已经压过的东西别再让 rsync 压一遍，纯浪费 CPU
NOZ='zip/gz/mp4/webm/png/jpg/jpeg/webp/avif/woff/woff2/ico'
# ⚠️ `.well-known` 必须排除：certbot 续期时把验证文件写在站点根下，而它只在目标
#    那台上存在、源这边没有 —— 不排除的话第三趟 `--delete` 会在续期进行中把它删掉，
#    表现是证书续期莫名其妙失败，而下一次手动续期又好了。
COMMON=(-a --compress --skip-compress="$NOZ" --human-readable
        --exclude '.git' --exclude 'node_modules' --exclude '.github'
        --exclude '.well-known' ${DRY[@]+"${DRY[@]}"})
# ⚠️ `${DRY[@]+"${DRY[@]}"}` 不是啰嗦：`set -u` 下，bash 4.4 以前展开空数组算
#    「未绑定变量」，脚本当场退出。服务器上多半是新 bash 看不出来，本机一跑就炸。

# ⚠️ **三趟，顺序是有意的。**
#
# HTML 里写的是带内容指纹的资源地址（`site.css?v=<hash>`）。HTML 先到而资源没到的
# 那一刻，访客拿到的是一份指向 404 的页面 —— 样式全丢，和站点挂了一模一样。
# 所以：先铺资源（不删任何东西，新旧指纹并存）→ 再换 HTML → 最后才清理旧文件。
step() {                       # step <序号> <标题> <rsync 额外参数...>
  local n="$1" title="$2"; shift 2
  printf '\n\033[1m[%s/3] %s\033[0m\n' "$n" "$title"
  local t0=$SECONDS
  rsync "${COMMON[@]}" "${PROG[@]}" "$@" ./ "$DST:$DST_PATH/"
  printf '      用时 %ds\n' "$((SECONDS - t0))"
}

T0=$SECONDS
step 1 '资源（图片 / 样式 / 脚本，不删任何东西）' --exclude '*.html'
step 2 'HTML（指纹指向的资源已经就位）' --include '*/' --include '*.html' --exclude '*'
step 3 '清理源里已经不存在的文件' --delete

printf '\n\033[32m✓\033[0m 同步完成 → %s:%s   总用时 %ds\n' "$DST" "$DST_PATH" "$((SECONDS - T0))"
