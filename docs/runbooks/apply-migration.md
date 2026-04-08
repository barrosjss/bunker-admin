# Runbook: Aplicar una migración

Las migraciones se aplican manualmente desde el panel web de Supabase. Los archivos SQL en `src/lib/supabase/migrations/` son el registro histórico de referencia.

## Pasos

1. Ir a **Supabase Dashboard → SQL Editor**
2. Abrir el archivo de migración correspondiente desde `src/lib/supabase/migrations/`
3. Pegar el contenido en el editor SQL
4. Revisar el SQL antes de ejecutar (especialmente los `DROP` y modificaciones de RLS)
5. Ejecutar
6. Verificar que no haya errores en el log

## Al crear una migración nueva

1. Crear el archivo SQL en `src/lib/supabase/migrations/` con el número siguiente (ej: `011_nueva_tabla.sql`)
2. Aplicarlo en el panel web siguiendo los pasos anteriores
3. Actualizar `src/lib/supabase/types/database.ts` con los nuevos tipos
4. Commit con los cambios

## Nomenclatura

```
NNN_descripcion_corta.sql
```

Ejemplo: `011_add_member_tags.sql`
