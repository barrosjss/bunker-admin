# Runbook: Aplicar una migración

Las migraciones se aplican siempre **contra el proyecto remoto**, por uno de dos caminos: el panel
web o el MCP de Supabase. La CLI local no se usa (ver ADR 001).

Los archivos SQL en `src/lib/supabase/migrations/` se escriben en ambos casos: son el registro
legible en el repo. El estado real vive en Supabase.

## Crear la migración

1. Crear el archivo en `src/lib/supabase/migrations/` con el número siguiente (ej: `018_nueva_tabla.sql`).
2. Hacerlo re-ejecutable: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, y un
   `DROP ... IF EXISTS` antes de cada `CREATE POLICY` y `CREATE TRIGGER`, que no aceptan `IF NOT EXISTS`.
   Si algo falla a mitad de camino, se corrige y se vuelve a correr el archivo entero.

## Camino A — MCP de Supabase

Requiere el servidor MCP autenticado (`.mcp.json` ya lo configura; la autorización es por OAuth).

1. `list_tables` y `list_migrations` — confirmar el estado real antes de escribir.
2. Verificar las dependencias que la migración da por sentadas: funciones helper, columnas previas,
   filas que la siembra espera encontrar.
3. **Confirmar con el humano.** Esto escribe en producción directo, sin entorno intermedio.
4. `apply_migration` con `name` igual al nombre del archivo, sin el `.sql`.
   **DDL siempre por acá, nunca por `execute_sql`** — solo `apply_migration` queda asentado en el
   historial de migraciones.
5. `execute_sql` para verificar: que las tablas existan, que RLS esté activo, que las policies estén,
   que la siembra haya corrido.
6. `get_advisors` con tipo `security`. Una tabla nueva sin RLS o sin policies aparece ahí.

## Camino B — Panel web

1. Ir a **Supabase Dashboard → SQL Editor**.
2. Pegar el contenido del archivo de migración.
3. Revisar el SQL antes de ejecutar (sobre todo los `DROP` y los cambios de RLS).
4. Ejecutar y verificar que no haya errores en el log.

Nota: el SQL Editor **no** registra la migración en el historial de Supabase. Si te importa que
quede asentada ahí, usá el camino A.

## Después, en ambos casos

Si el schema cambió, actualizar `src/lib/supabase/types/database.ts` con los tipos nuevos, y
`docs/architecture.md` si se agregaron tablas. Commit con todo junto.

## Nomenclatura

```
NNN_descripcion_corta.sql
```

Ejemplo: `018_add_member_tags.sql`
