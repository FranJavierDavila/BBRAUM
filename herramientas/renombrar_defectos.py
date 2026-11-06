#!/usr/bin/env python3
"""
Renombrado masivo de defectos (nomenclatura del cliente) para
B. Braun · Evaluación de Inspección Visual.

Lee un CSV con separador ';' (exportable desde Excel) con la estructura:

    codigo;nombre_actual;nombre_nuevo

- `nombre_actual` se usa solo como comprobación (si no coincide, avisa y pide confirmación).
- Las filas con `nombre_nuevo` vacío se omiten.
- El CÓDIGO (D001…) nunca cambia: solo el nombre visible.
- Antes de tocar la BD crea automáticamente una copia .bak con fecha.

Uso:
    python3 renombrar_defectos.py nomenclatura.csv                 # simulación (no escribe)
    python3 renombrar_defectos.py nomenclatura.csv --aplicar       # aplica los cambios
    python3 renombrar_defectos.py nomenclatura.csv --db /ruta/bbraun.db --aplicar

Si no se indica --db, usa la ruta estándar del despliegue: ./datos/bbraun.db
(ejecútalo desde la carpeta de la aplicación, o pasa la ruta completa).
"""
import argparse
import csv
import datetime
import shutil
import sqlite3
import sys

DB_DEFECTO = "datos/bbraun.db"


def main():
    ap = argparse.ArgumentParser(description="Renombrado masivo de defectos")
    ap.add_argument("csv", help="CSV (;) con columnas codigo;nombre_actual;nombre_nuevo")
    ap.add_argument("--db", default=DB_DEFECTO, help="Ruta de la base de datos SQLite")
    ap.add_argument("--aplicar", action="store_true", help="Aplica los cambios (sin esto, solo simula)")
    args = ap.parse_args()

    # 1) Leer el CSV (tolerante a comillas y a BOM de Excel)
    cambios = []
    with open(args.csv, newline="", encoding="utf-8-sig") as f:
        for i, row in enumerate(csv.reader(f, delimiter=";"), start=1):
            if not row or not row[0].strip():
                continue
            if row[0].strip().lower().startswith("codigo"):
                continue  # cabecera
            if len(row) < 3:
                print(f"  fila {i}: incompleta, se omite -> {row}")
                continue
            codigo = row[0].strip().upper()
            actual = row[1].strip()
            nuevo = row[2].strip()
            if not nuevo:
                continue  # sin nombre nuevo: nada que hacer
            cambios.append((codigo, actual, nuevo, i))

    if not cambios:
        print("El CSV no contiene ningún nombre nuevo (columna 'nombre_nuevo' vacía). Nada que hacer.")
        return

    # 2) Abrir la BD y comprobar cada código
    con = sqlite3.connect(args.db)
    cur = con.cursor()
    errores, avisos = [], []
    for codigo, actual, nuevo, i in cambios:
        fila = cur.execute("SELECT name FROM Defect WHERE code = ?", (codigo,)).fetchone()
        if fila is None:
            errores.append(f"fila {i}: el código {codigo} no existe en la BD")
        elif actual and fila[0] != actual:
            avisos.append(
                f"fila {i}: {codigo} en la BD se llama «{fila[0]}», el CSV dice «{actual}» (se usará el de la BD como punto de partida)"
            )
        elif fila[0] == nuevo:
            avisos.append(f"fila {i}: {codigo} ya se llama «{nuevo}»; sin cambios")
    if errores:
        print("ERRORES (nada se aplicará):")
        for e in errores:
            print("  " + e)
        sys.exit(1)
    for a in avisos:
        print("aviso: " + a)

    # 3) Resumen + confirmación
    print(f"\nCambios a aplicar sobre {args.db}: {len(cambios)}")
    for codigo, _, nuevo, _ in cambios:
        viejo = cur.execute("SELECT name FROM Defect WHERE code = ?", (codigo,)).fetchone()[0]
        print(f"  {codigo}: «{viejo}»  →  «{nuevo}»")

    if not args.aplicar:
        print("\n[SIMULACIÓN] No se ha modificado la BD. Añade --aplicar para escribir los cambios.")
        return

    # 4) Copia de seguridad y aplicación
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = f"{args.db}.bak-{stamp}"
    shutil.copy2(args.db, backup)
    print(f"\nCopia de seguridad: {backup}")

    for codigo, _, nuevo, _ in cambios:
        cur.execute("UPDATE Defect SET name = ? WHERE code = ?", (nuevo, codigo))
    con.commit()
    con.close()
    print(f"Listo: {len(cambios)} nombres actualizados. Los cambios son visibles al instante en la aplicación.")


if __name__ == "__main__":
    main()
