# ADR 001 — Supabase se gestiona sin CLI local

**Fecha:** 2026-04-08
**Estado:** Aceptado — enmendado el 2026-09-12 (ver "Enmienda")

## Contexto

Supabase ofrece tanto una CLI local (`supabase db push`, `supabase gen types`) como un panel web para gestionar el proyecto.

## Decisión

Toda la configuración de Supabase (auth, storage, RLS, variables de entorno, edge functions) se gestiona **exclusivamente desde el panel web de Supabase**. En el repositorio solo se mantienen los archivos SQL de migración en `src/lib/supabase/migrations/` como **registro histórico de referencia**.

No se usa `supabase/config.toml`, CLI local, ni `supabase db push`.

## Consecuencias

- Los archivos en `migrations/` son documentación, no ejecutables automáticamente.
- Al hacer cambios de schema, primero se aplica en el panel web y luego se registra el SQL en `migrations/`.
- No hay estado local de Supabase que pueda desincronizarse con producción.
- Cualquier agente de IA debe respetar esta decisión y no generar comandos CLI de supabase.

---

## Enmienda — 2026-09-12: el MCP de Supabase es un canal válido

### Contexto de la enmienda

El proyecto ahora tiene configurado el servidor MCP de Supabase en `.mcp.json`. Eso permite aplicar
migraciones y consultar el schema desde el agente, sin CLI local y sin copiar y pegar a mano en el
SQL Editor. La migración 017 se aplicó por esa vía.

Lo que la decisión original quería evitar era **el estado local desincronizado**: un `supabase/`
local, un `config.toml`, un `db push` que pisa producción desde la máquina de alguien. El MCP no
introduce nada de eso — habla directo contra el proyecto remoto, igual que el panel web, y queda
registrado en el historial de migraciones de Supabase.

### Decisión enmendada

Se admiten **dos** canales para aplicar cambios de schema, ambos contra el proyecto remoto:

1. **Panel web** → SQL Editor. Sigue siendo válido y es el camino por defecto para quien no tenga
   el MCP autenticado.
2. **MCP de Supabase** → `apply_migration` para DDL, `execute_sql` para lecturas y verificación.

La CLI local sigue **excluida**: nada de `supabase/config.toml`, `supabase db push` ni stack local.

### Reglas al usar el MCP

- **Inspeccionar antes de escribir.** `list_tables` y `list_migrations` primero, para confirmar el
  estado real y no aplicar dos veces lo mismo.
- **`apply_migration` para DDL, nunca `execute_sql`.** Solo el primero queda asentado en el
  historial de migraciones de Supabase.
- **El archivo en `migrations/` se escribe igual**, y el `name` del `apply_migration` debe coincidir
  con el nombre del archivo. El repo sigue siendo el registro legible; Supabase, el estado real.
- **Verificar después de aplicar**, incluido `get_advisors` con tipo `security`: un DDL que crea
  tablas sin RLS o sin policies aparece ahí.
- **Confirmar con el humano antes de aplicar.** El MCP escribe en producción directamente; no hay
  entorno intermedio que amortigüe un error.

### Consecuencias

- Un agente **sí** puede aplicar migraciones, previa confirmación explícita. Lo que sigue prohibido
  es generar comandos de la CLI.
- El paso "aplicar a mano en el panel" deja de ser obligatorio, pero sigue siendo el fallback.
- `docs/runbooks/apply-migration.md` documenta los dos caminos.
