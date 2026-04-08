# ADR 001 — Configuración de Supabase solo desde panel web

**Fecha:** 2026-04-08  
**Estado:** Aceptado

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
