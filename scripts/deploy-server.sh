#!/usr/bin/env bash
# LUNG VAI TEA - Quy trinh trien khai may chu chuan hoa (an toan du lieu & chong stale CSS 500)
# Cach dung tren server:  bash scripts/deploy-server.sh
set -euo pipefail

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
DB_DIR="$APP_DIR/data"
BACKUP_DIR="${BACKUP_DIR:-$HOME/lung-vai-tea-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
PORT="${PORT:-3000}"

echo "==> [LUNG VAI TEA] Bat dau trien khai tai: $APP_DIR (PORT=$PORT)"

# 1. Sao luu co so du lieu SQLite TRUOC moi thao tac git (bao ve du lieu dat ban that)
mkdir -p "$BACKUP_DIR"
if ls "$DB_DIR"/*.db >/dev/null 2>&1; then
  echo "==> 1. Sao luu CSDL vao $BACKUP_DIR/db-$STAMP ..."
  mkdir -p "$BACKUP_DIR/db-$STAMP"
  cp -p "$DB_DIR"/*.db* "$BACKUP_DIR/db-$STAMP/"
else
  echo "==> 1. Chua co file CSDL trong $DB_DIR (bo qua sao luu)"
fi

# 2. Ngung theo doi file CSDL trong git (neu server con ban cu dang track) de git pull
#    KHONG ghi de / KHONG xoa du lieu live. File van nam nguyen tren o dia.
if git ls-files --error-unmatch data/oriental_serenity.db >/dev/null 2>&1; then
  echo "==> 2. Bo theo doi data/oriental_serenity.db khoi git (giu nguyen file tren o dia)..."
  git rm --cached --quiet data/oriental_serenity.db
fi

# 3. Lay code moi nhat
echo "==> 3. Lay ma nguon moi nhat tu GitHub..."
git pull --ff-only origin main

# 3b. Phong ho: neu vi bat ky ly do gi file CSDL bi mat sau khi pull -> khoi phuc tu ban sao luu
if [ -d "$BACKUP_DIR/db-$STAMP" ] && [ ! -f "$DB_DIR/oriental_serenity.db" ]; then
  echo "==> 3b. Khoi phuc CSDL tu ban sao luu..."
  mkdir -p "$DB_DIR"
  cp -p "$BACKUP_DIR/db-$STAMP/"* "$DB_DIR/"
fi

# 4. Cai dat dependencies (dung lockfile)
echo "==> 4. Cai dat dependencies..."
pnpm install --frozen-lockfile

# 5. Build production
echo "==> 5. Bien dich Next.js production build..."
pnpm build

# 6. Phan quyen doc cho .next (tranh loi 500 khi Nginx/Node khong doc duoc CSS chunk)
echo "==> 6. Thiet lap quyen truy cap .next ..."
chmod -R u+rwX,go+rX .next 2>/dev/null || true

# 7. Khoi dong lai ĐÚNG tien trinh Next.js dang giu cong $PORT
#    (Nguyen nhan goc cua loi CSS HTTP 500: chay `pnpm build` nhung tien trinh `next start` cu
#     van giu manifest cu trong RAM tro toi file CSS da bi xoa tren dia!)
echo "==> 7. Khoi dong lai dich vu Next.js / PM2..."
restarted=0
if command -v pm2 >/dev/null 2>&1; then
  # Tim app PM2 hien co dang chay trong thu muc du an nay (bat ke dat ten la gi)
  EXISTING_APP="$(node -e '
    const { execSync } = require("child_process");
    try {
      const list = JSON.parse(execSync("pm2 jlist", { stdio: ["ignore", "pipe", "ignore"] }).toString());
      const cwd = process.argv[1];
      const match = list.find((p) => p && p.pm2_env && (p.pm2_env.pm_cwd === cwd || p.name === "lung-vai-tea"));
      if (match) process.stdout.write(String(match.name));
    } catch {}
  ' "$APP_DIR" 2>/dev/null || true)"

  if [ -n "$EXISTING_APP" ]; then
    echo "    Tim thay PM2 app '$EXISTING_APP' -> restart --update-env..."
    pm2 restart "$EXISTING_APP" --update-env
    restarted=1
  else
    # Neu user hien tai chua co app trong PM2, kiem tra xem cong $PORT co dang bi giu boi tien trinh cu khong
    if command -v fuser >/dev/null 2>&1 && fuser "${PORT}/tcp" >/dev/null 2>&1; then
      echo "    Cong $PORT dang bi giu boi tien trinh cu ngoai PM2 user hien tai -> giai phong cong $PORT..."
      fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
      sleep 1
    fi
    pm2 startOrReload ecosystem.config.js --update-env
    restarted=1
  fi
  pm2 save >/dev/null 2>&1 || true
fi

if [ "$restarted" -eq 0 ]; then
  echo "!! PM2 chua duoc cai dat hoac khong nam trong PATH. Vui long restart dich vu Next.js thu cong!"
fi

# 8. Hau kiem toan dien: kiem tra /, /install, va TAT CA cac file CSS chunk
echo "==> 8. Kiem tra suc khoe he thong sau trien khai..."
if command -v curl >/dev/null 2>&1; then
  # Cho toi da 15 giay de Next.js san sang
  for _ in 1 2 3 4 5; do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || echo 000)"
    [ "$CODE" = "200" ] && break
    sleep 2
  done
  echo "    - Trang chu (/): HTTP $CODE"
  INSTALL_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/install" || echo 000)"
  echo "    - Trang cai app (/install): HTTP $INSTALL_CODE"

  CSS_PATHS="$(curl -s "http://127.0.0.1:$PORT/" | grep -o '/_next/static/[^"]*\.css' | sort -u || true)"
  if [ -z "$CSS_PATHS" ]; then
    echo "!! CANH BAO: Khong tim thay the <link rel=stylesheet> trong HTML trang chu!"
    exit 1
  fi

  for css in $CSS_PATHS; do
    CSS_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$css" || echo 000)"
    echo "    - Stylesheet $css: HTTP $CSS_CODE"
    if [ "$CSS_CODE" != "200" ]; then
      echo ""
      echo "!! LOI NGHIEM TRONG: File CSS $css tra ve HTTP $CSS_CODE!"
      echo "   Nguyen nhan: Tien trinh cu tren cong $PORT (co the chay duoi quyen root/sudo pm2 hoac systemd) chua duoc restart."
      echo "   Hay chay:  sudo pm2 restart all --update-env   (hoac kiem tra: sudo ss -tlnp | grep :$PORT)"
      exit 1
    fi
  done

  if [ "$INSTALL_CODE" != "200" ]; then
    echo ""
    echo "!! CANH BAO: /install tra ve HTTP $INSTALL_CODE — tien trinh tren cong $PORT van dang chay ban build cu."
    echo "   Hay chay:  sudo pm2 restart all --update-env   (hoac kiem tra: sudo ss -tlnp | grep :$PORT)"
    exit 1
  fi
fi

echo "==> [HOAN TAT] Trien khai thanh cong 100%! Kiem tra: https://tea.anf-technology.com"
echo "    Ban sao luu CSDL: $BACKUP_DIR/db-$STAMP"
