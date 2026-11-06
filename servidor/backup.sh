#!/usr/bin/env bash
# ============================================================
# B. Braun · Evaluación de Inspección Visual — copia de seguridad
#   ./backup.sh                       (copia y conserva las 14 últimas)
#   0 2 * * * /opt/bbraun/servidor/backup.sh   (cron diario 02:00)
#
# Copia: base de datos SQLite (consistente, con .backup de sqlite3),
# material de apoyo subido (public/uploads) y variables de entorno.
# ============================================================
set -euo pipefail
BASE=/opt/bbraun
APP=$BASE/app
DEST=$BASE/backups
STAMP=$(date +%Y%m%d-%H%M%S)
KEEP=14

mkdir -p "$DEST"

# 1) BD con la herramienta segura de sqlite3 (aunque el servidor esté en marcha)
sqlite3 "$APP/datos/bbraun.db" ".backup '$DEST/bbraun-$STAMP.db'"

# 2) Material de apoyo (imágenes/vídeos subidos por el administrador)
if [ -d "$APP/public/uploads" ]; then
  tar czf "$DEST/uploads-$STAMP.tar.gz" -C "$APP/public" uploads
fi

# 3) Variables de entorno del servicio (para poder reconstruir el servidor)
systemctl show bbraun -p Environment > "$DEST/entorno-$STAMP.txt" 2>/dev/null || true

# 4) Rotación: conserva las KEEP últimas de cada tipo
for pref in bbraun uploads entorno; do
  ls -1t "$DEST"/$pref-* 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f
done

echo "Copia completada en $DEST ($STAMP)"
