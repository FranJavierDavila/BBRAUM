#!/usr/bin/env bash
# ============================================================
#  B. BRAUN - Evaluacion de Inspeccion Visual (botellas de suero)
#  Arranque directo del servidor de produccion (Linux/macOS)
#  Uso:  ./iniciar-servidor.sh          (puerto por defecto 3000)
#        PORT=8080 ./iniciar-servidor.sh
# ============================================================
cd "$(dirname "$0")" || exit 1

export PORT="${PORT:-3000}"
# IP de escucha (BB_BIND permite limitarla; por defecto, todas las interfaces)
export HOSTNAME="${BB_BIND:-0.0.0.0}"
export NODE_ENV=production

# Ruta ABSOLUTA de la base de datos SQLite (Prisma la requiere absoluta)
# BD en la carpeta de datos (fuera del directorio de aplicacion): sobrevive a
# actualizaciones. Se migra la BD antigua una sola vez (v1.4.8)
export DATABASE_URL="file:$(pwd)/datos-ficheros/bbraun.db"
if [ -f datos/bbraun.db ] && [ ! -f datos-ficheros/bbraun.db ]; then
  mkdir -p datos-ficheros && cp datos/bbraun.db datos-ficheros/bbraun.db
fi

# Material subido por el administrador (imagenes, videos, audio), en una carpeta
# de datos FUERA del directorio de aplicacion: sobrevive a actualizaciones y
# reconstrucciones (v1.4.7)
export UPLOADS_DIR="$(pwd)/datos-ficheros/uploads"
mkdir -p "$UPLOADS_DIR"

# Secreto de firma de las cookies de sesion (CAMBIAR en produccion)
export AUTH_SECRET="${AUTH_SECRET:-cambiar-este-secreto-en-produccion}"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js no esta instalado. Instale la version LTS (>=20)."
  exit 1
fi

echo "=========================================================="
echo " B. BRAUN - Evaluacion de Inspeccion Visual"
echo " Servidor:  http://localhost:${PORT}"
echo " BD:        ${DATABASE_URL}"
echo " Detener:   Ctrl+C"
echo "=========================================================="

exec node server.js
