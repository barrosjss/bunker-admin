# ADR 002 — Multi-tenancy via RLS (no schemas separados)

**Fecha:** 2026-04-08  
**Estado:** Aceptado

## Contexto

Para soportar múltiples gimnasios se evaluaron dos enfoques:
1. Schema separado por tenant (un schema Postgres por gym)
2. Base de datos compartida con `establishment_id` en cada tabla + RLS

## Decisión

Se usa **base de datos compartida con `establishment_id`** y Row Level Security en Postgres.

Las funciones helpers `get_my_establishment_id()` y `get_my_role()` en Supabase determinan el contexto del usuario en cada query, sin necesidad de lógica de filtrado en el código de la aplicación.

## Consecuencias

- El aislamiento es responsabilidad del RLS, no del código Next.js.
- Agregar un nuevo gym es simplemente insertar en `establishments` — sin crear schemas ni configuraciones nuevas.
- Las queries del cliente no necesitan incluir `establishment_id` explícitamente — el RLS lo filtra automáticamente.
- Si el RLS no está bien configurado, hay riesgo de fuga de datos entre tenants. Toda política debe ser revisada cuidadosamente en `migrations/009_rls_policies.sql`.
