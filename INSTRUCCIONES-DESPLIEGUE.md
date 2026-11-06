# Guía de despliegue en servidor propio (autoalojado)

B. Braun · Evaluación de Inspección Visual — versión v1.4.2

Esta guía describe cómo instalar, actualizar y operar la aplicación en un servidor
propio Linux con systemd y Nginx, usando el kit incluido en la carpeta `servidor/`.
Al final se indica la variante para Windows/IIS con el paquete ZIP autocontenido.

---

## 1. Arquitectura de la instalación

La aplicación es un servidor Node.js autocontenido (build «standalone» de Next.js)
con base de datos SQLite en fichero. No necesita servicios de base de datos
instalados. En el servidor se organiza así:

```
/opt/bbraun/
├── fuente/     ← código fuente (clone de git o carpeta «codigo-fuente» del ZIP)
├── app/        ← aplicación en producción (server.js + .next + node_modules + public)
│   ├── datos/bbraun.db        ← base de datos SQLite (persistente)
│   └── public/uploads/        ← material de apoyo subido por el administrador (persistente)
├── backups/    ← copias de seguridad automáticas (backup.sh)
└── servidor/   ← copia del kit (deploy.sh, backup.sh, bbraun.service, nginx-bbraun.conf)
```

El servicio systemd ejecuta `node /opt/bbraun/app/server.js` en el puerto 3000
(escuchando solo en 127.0.0.1) y Nginx publica la aplicación como proxy inverso.

## 2. Requisitos

- Linux con systemd (Debian/Ubuntu, RHEL/Rocky/Alma) y Nginx instalados.
- Node.js 20 o superior en `/usr/bin/node` (solo el servidor de producción lo
  necesita en runtime; para compilar se usa Bun o npm, véase el apartado 4).
- 500 MB de espacio libres como mínimo (los vídeos subidos pueden crecer más).
- Opcional: `sqlite3` de línea de comandos para que `backup.sh` haga copias
  consistentes de la base de datos con el servidor en marcha.

## 3. Creación del usuario y los directorios

```bash
sudo useradd --system --home /opt/bbraun --shell /usr/sbin/nologin bbraun
sudo mkdir -p /opt/bbraun/{fuente,app,backups}
sudo chown -R bbraun:bbraun /opt/bbraun
```

## 4. Primera instalación

1. **Copiar el código fuente** a `/opt/bbraun/fuente` (clone del repositorio o
   contenido de la carpeta `codigo-fuente` del paquete).

2. **Crear el fichero de entorno** `/opt/bbraun/fuente/.env` (después de la
   primera compilación vivirá también en la app publicada; el servicio usa las
   variables definidas en `bbraun.service`):

   ```
   DATABASE_URL=file:/opt/bbraun/app/datos/bbraun.db
   AUTH_SECRET=<cadena larga y aleatoria de 64 caracteres>
   ```

   - `DATABASE_URL` debe ser una **ruta absoluta** (Prisma la exige así).
   - `AUTH_SECRET` firma las cookies de sesión: **cámbialo** por un valor
     aleatorio y guárdalo en lugar seguro (`openssl rand -base64 48`).

3. **Instalar dependencias y preparar la base de datos**:

   ```bash
   cd /opt/bbraun/fuente
   bun install            # o: npm install --no-audit --no-fund
   npx prisma generate
   npx prisma db push     # crea datos/bbraun.db con el esquema
   ```

4. **Datos iniciales (opcionales, recomendado para una demo)**: los scripts
   `scripts/seed.ts` (40 defectos + 200 preguntas + usuario `admin`/`admin`) y
   `scripts/add-demo-user.ts` (inspector de prueba) pueden ejecutarse con
   `bun scripts/seed.ts`. El seed es idempotente: no borra ni sobrescribe
   contenidos, nombres ni multimedia ya editados por el administrador.

5. **Primera compilación y publicación**:

   ```bash
   sudo -u bbraun bash servidor/deploy.sh
   ```

   El script hace, en orden: copia de seguridad previa → dependencias →
   `prisma generate` + `npm run build` → publicación en `/opt/bbraun/app`
   preservando `datos/` y `public/uploads/` → materializa los enlaces
   simbólicos del cliente Prisma → reinicia el servicio → comprueba que la
   aplicación responde con HTTP 200.

   En servidores **sin herramientas de compilación** se puede compilar en otra
   máquina y publicar con `./deploy.sh --sin-build` (copia el build ya hecho).

6. **Instalar el servicio systemd**:

   ```bash
   sudo cp servidor/bbraun.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now bbraun
   ```

   Edita antes `bbraun.service` si tu ruta de `node` o los puertos difieren, y
   **sustituye el valor de `AUTH_SECRET` de ejemplo**.

7. **Instalar el proxy Nginx**:

   ```bash
   sudo cp servidor/nginx-bbraun.conf /etc/nginx/sites-available/bbraun   # Debian/Ubuntu
   #   o /etc/nginx/conf.d/bbraun.conf en RHEL/Rocky
   sudo ln -s /etc/nginx/sites-available/bbraun /etc/nginx/sites-enabled/ # Debian/Ubuntu
   sudo nginx -t && sudo systemctl reload nginx
   ```

   Ajusta `server_name` a tu dominio o IP. La configuración incluida ya fija
   `client_max_body_size 40M` y el tipo MIME `application/wasm` para el
   decodificador Draco de los modelos 3D.

## 5. El kit `servidor/`

| Fichero | Función |
| --- | --- |
| `deploy.sh` | Despliegue/actualización completo (backup → build → publicación → reinicio → verificación HTTP). |
| `bbraun.service` | Unidad systemd: arranque automático, reinicio ante caídas, endurecimiento básico (`NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=full`) y escritura limitada a `datos/` y `public/uploads/`. |
| `nginx-bbraun.conf` | Proxy inverso con cabeceras `X-Forwarded-*`, `client_max_body_size` y caché larga para `/_next/static/`. |
| `backup.sh` | Copia de seguridad consistente de la BD (`.backup` de sqlite3), de `public/uploads` y del entorno del servicio, con rotación de 14 copias. |

## 6. Actualizaciones de versión

```bash
cd /opt/bbraun/fuente
git pull                      # o copiar el nuevo «codigo-fuente»
sudo -u bbraun bash servidor/deploy.sh
```

`deploy.sh` preserva siempre `datos/` (base de datos) y `public/uploads/`
(material subido). Tras un cambio de esquema de Prisma ejecuta además
`npx prisma db push` antes de reiniciar (la publicación no toca la BD).

## 7. Copias de seguridad y restauración

- **Automáticas**: añade al cron del usuario root o bbraun:
  `0 2 * * * /opt/bbraun/servidor/backup.sh` (diaria a las 02:00, conserva 14).
- **Contenido**: `bbraun-<fecha>.db` (base de datos), `uploads-<fecha>.tar.gz`
  (multimedia) y `entorno-<fecha>.txt` (variables del servicio).
- **Restauración**: parar el servicio (`systemctl stop bbraun`), copiar el
  `.db` a `/opt/bbraun/app/datos/bbraun.db`, descomprimir el tar de uploads en
  `public/` y arrancar de nuevo. Comprobar propietario `bbraun:bbraun`.

## 8. Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Ruta absoluta de la BD SQLite (`file:/opt/bbraun/app/datos/bbraun.db`). |
| `AUTH_SECRET` | Secreto de firma de las cookies de sesión. Obligatorio cambiarlo. |
| `PORT` | Puerto de escucha (3000 por defecto; Nginx hace de frente). |
| `HOSTNAME` | Debe ser `127.0.0.1` tras Nginx (la app solo se publica vía proxy). |

## 9. HTTPS y cookies de sesión

La aplicación detecta automáticamente el canal del navegador mediante la
cabecera `X-Forwarded-Proto`:

- **HTTP interno directo** (p. ej. IIS interno sin TLS): cookies `SameSite=Lax`.
- **HTTPS de cara al navegador** (Nginx con certificado, o pasarela corporativa):
  cookies `SameSite=None; Secure; Partitioned`, necesarias para el acceso
  embebido en portales (iframe) y compatible con Chrome/Edge modernos.

Para activar TLS en Nginx, termina el certificado en el `server` block
(`listen 443 ssl`) y mantén el `proxy_pass http://127.0.0.1:3000`; no hay que
tocar la aplicación. Nota: Safari puede seguir bloqueando cookies de terceros
en iframes por su política ITP (limitación del navegador).

## 10. Nomenclatura de los defectos (nombre visible y displayName)

El código (D001…D040) **nunca cambia**: lo referencian las URLs, los QR y los
registros. Lo que ve el evaluador se resuelve con la cadena de respaldo
`displayName → nombre → código` en todas las superficies: catálogo de Teoría,
ficha (apartado 1), visor 3D, autoevaluación, Prueba de Evaluación, resultado y
etiquetas QR. Dos formas de gestionarlo:

1. **Panel de administración → Contenidos**: campo «Nombre del defecto» (nombre
   general) y campo «Nombre de visualización (opcional)» (etiqueta específica;
   si se deja vacío se muestra el nombre).
2. **Renombrado masivo**: `herramientas/renombrar_defectos.py` aplica un CSV
   exportado de Excel (`codigo;nombre_actual;nombre_nuevo`) directamente sobre
   la base de datos, creando antes una copia `.bak`. Ejecuta primero la
   simulación sin `--aplicar` para revisar los cambios.

## 11. Contenidos, multimedia y modelos 3D

- La ficha de cada defecto tiene una **estructura fija de 7 apartados numerados**
  (1 · Defecto, 2 · Descripción breve, 3 · Riesgos, 4 · Causas, 5 · Actuación,
  6 · Detección, 7 · Prevención) con nota normativa al pie. Los apartados sin
  texto se muestran como «pendientes de completar» y conservan su numeración.
- Cada apartado admite **recursos multimedia enlazados** (imágenes con carrusel,
  vídeo, audio y enlaces incrustados) con visor unificado; los recursos sin
  apartado aparecen en la galería del pie.
- Límites de subida: imágenes 8 MB (jpg/png/webp/gif), vídeo 64 MB
  (mp4/webm/ogg/mov/m4v), audio 16 MB (mp3/wav/ogg/m4a/aac), modelos .glb 32 MB.
  Si vas a permitir vídeos grandes tras Nginx, sube también
  `client_max_body_size` en `nginx-bbraun.conf` (p. ej. `80M`).
- Todo lo subido queda en `public/uploads/defects/<código>/` y se preserva en
  cada despliegue.

## 12. Fuente corporativa

La pila tipográfica declara «BBraun Type Digital» con `@font-face` que resuelve
primero la fuente instalada en el cliente (GPO/SCCM) y después los ficheros
`.woff2` servidos desde `public/fonts/`. Basta copiar los ficheros licenciados
con los nombres documentados en los comentarios de `src/app/globals.css` — sin
recompilar: `public/` se sirve estáticamente y Nginx la sirve en caliente.

## 13. Códigos QR

En Administración → Códigos QR se configura la **URL base** pública del servidor
(p. ej. `https://evaluacion.bbraun.local`); si se deja vacía se deduce de la
petición. Cada QR apunta a `?defecto=CODE&via=qr` y abre la ficha directamente.
Puedes descargar PNG por código, un ZIP con todos, o la hoja A4 imprimible.
Los QR no cambian al renombrar defectos (referencian el código).

## 14. Resolución de problemas

| Síntoma | Causa y solución |
| --- | --- |
| 404 en CSS/JS (`/_next/static/...`) tras recompilar | El `npm run build` ya copia los estáticos al standalone; si publicas a mano, copia `.next/static` dentro del `.next` del standalone y reinicia. |
| Error Prisma `P2022`/campo desconocido tras actualizar | El cliente Prisma quedó obsoleto en memoria: `npx prisma generate && npx prisma db push` y `systemctl restart bbraun`. |
| La subida de material falla con ficheros grandes | `client_max_body_size` de Nginx por debajo del límite de la app (apartado 11). |
| La app no arranca; `journalctl -u bbraun` muestra error de BD | `DATABASE_URL` no es absoluta o el proceso no puede escribir en `datos/` (revisa `ReadWritePaths` y el propietario `bbraun:bbraun`). |
| La sesión no se mantiene en un iframe del portal | Solo ocurre sin HTTPS de cara al navegador; activa TLS (apartado 9). |

## 15. Variante Windows / IIS

El paquete ZIP autocontenido incluye el motor Prisma para Windows
(`binaryTargets: ["native","windows"]`), `iniciar-servidor.bat` y `web.config`
para HttpPlatformHandler. Pasos resumidos: instalar Node.js 20+, copiar la
carpeta `aplicacion/`, ajustar `DATABASE_URL` (ruta absoluta con `file:`) y
`AUTH_SECRET` en el `.bat`, crear el sitio en IIS apuntando a la carpeta con
HttpPlatformHandler y servir `public/` estático. Para la publicación detrás de
IIS con HTTPS se aplican las mismas reglas de cookies del apartado 9.
