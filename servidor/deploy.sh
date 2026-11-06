#!/usr/bin/env bash
# ============================================================
# B. Braun · Evaluación de Inspección Visual — despliegue/actualización
#
#   ./deploy.sh                 # compila y publica la versión del código fuente
#   ./deploy.sh --sin-build     # publica un build ya compilado (útil en servidores sin Node de compilación)
#
# Estructura esperada (crear si no existe):
#   /opt/bbraun/fuente   → código fuente (clone de git o ZIP «codigo-fuente»)
#   /opt/bbraun/app      → aplicación en producción (server.js + .next + node_modules + public + datos)
#   /opt/bbraun/backups  → copias de seguridad automáticas
#
# El script: copia de seguridad → build → publica preservando datos/ y
# public/uploads → materializa symlinks de Prisma → reinicia el servicio.
# ============================================================
set -euo pipefail

BASE=/opt/bbraun
FUENTE=$BASE/fuente
APP=$BASE/app
BACKUPS=$BASE/backups
STAMP=$(date +%Y%m%d-%H%M%S)

[ -d "$FUENTE" ] || { echo "Falta $FUENTE (copia ahí el código fuente)"; exit 1; }
mkdir -p "$BACKUPS"

echo "── 1/6 Copia de seguridad previa"
tar czf "$BACKUPS/app-$STAMP.tar.gz" -C "$APP" .next server.js package.json 2>/dev/null || true
cp "$APP/datos/bbraun.db" "$BACKUPS/bbraun-$STAMP.db"

echo "── 2/6 Dependencias"
cd "$FUENTE"
if command -v bun >/dev/null; then bun install; else npm install --no-audit --no-fund; fi

echo "── 3/6 Compilación (2-4 min)"
npx prisma generate
npm run build   # next build + copia static y public dentro de .next/standalone

STANDALONE="$FUENTE/.next/standalone"
# Next anida el standalone según la ruta del proyecto:
if [ -f "$STANDALONE/server.js" ]; then ST="$STANDALONE"; else ST=$(dirname "$(find "$STANDALONE" -name server.js | head -1)"); fi

echo "── 4/6 Publicación (preserva datos/ y public/uploads)"
mkdir -p "$APP"
rsync -a --delete \
  --exclude '/datos/' --exclude '/public/uploads/' \
  --exclude '/server.log' \
  "$ST/" "$APP/"
rsync -a --delete "$FUENTE/.next/static/" "$APP/.next/static/" 2>/dev/null || true

echo "── 5/6 Materializar symlinks de Prisma (si apuntan fuera del árbol)"
while IFS= read -r -d '' L; do
  T=$(readlink "$L"); PKG="${T#*node_modules/}"
  SRC=""
  [ -e "$APP/node_modules/$PKG" ] && SRC="$APP/node_modules/$PKG"
  [ -z "$SRC" ] && [ -e "$FUENTE/node_modules/$PKG" ] && SRC="$FUENTE/node_modules/$PKG"
  if [ -n "$SRC" ]; then rm "$L"; mkdir -p "$(dirname "$L")"; cp -rL "$SRC" "$L"; echo "  materializado: ${L#$APP/}"; fi
done < <(find "$APP/.next/node_modules" -type l -print0 2>/dev/null)

chown -R bbraun:bbraun "$APP"

echo "── 6/6 Reinicio del servicio"
systemctl restart bbraun
sleep 3
systemctl --no-pager --lines 3 status bbraun || true
curl -fsS -o /dev/null -w "Comprobación http://127.0.0.1:3000 → HTTP %{http_code}\n" http://127.0.0.1:3000/ \
  || { echo "ATENCIÓN: la aplicación no responde; revisa: journalctl -u bbraun -n 50"; exit 1; }
echo "Despliegue completado."
