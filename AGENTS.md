# AGENTS.md (Unificado & Minimalista)

Este archivo es la **fuente de verdad suprema** para cualquier agente de IA. No repitas información que ya existe en el código o estructura de carpetas. Concéntrate en lo no obvio y las pautas que el humano prioriza.

## 🏛️ Autoridad Técnica, Negocio & Requerimientos

Si tienes dudas sobre el **por qué (negocio)**, el **qué (requerimientos)** o el **cómo (técnico)**, consulta:

- `knowledge/vision.md`: Propósito, modelo de negocio e identidad.
- `requirements/epics.md`: Épicas e Historias de Usuario (Verdad Funcional).
- `docs/architecture.md`: Diseño global del sistema, roles, schema y convenciones.
- `docs/decisions/`: ADRs que explican los "por qués" históricos técnicos.
- `docs/runbooks/`: Guías operacionales para tareas recurrentes.

## 📜 Reglas de Oro (No Obvias)

1. **Supabase solo vía panel web**: Toda configuración de Supabase se hace desde el panel web. Los archivos en `src/lib/supabase/migrations/` son registro histórico, no se ejecutan con CLI. No generes `config.toml` ni comandos `supabase db push`. Ver ADR 001.

2. **Todo Supabase en `src/lib/supabase/`**: Clientes, tipos, queries y migraciones. Sin carpetas supabase en ningún otro lugar.

3. **El RLS aísla, el código no filtra**: Cada tabla tiene `establishment_id`. El aislamiento lo garantiza RLS en Postgres via `get_my_establishment_id()`. No agregar filtros manuales por tenant en el código de la app. Ver ADR 002.

4. **Tres dashboards independientes**: `owner`, `admin` y `trainer` son rutas separadas bajo `/[slug]/`. Sin panel selector ni contexto compartido. Ver ADR 003.

5. **Migración Progresiva**: No refactorices módulos completos a menos que se solicite. Respeta los ADRs.

6. **No-Go Zones**: Si una carpeta no está en el `README`, trátala como legado. No la modifiques sin confirmación.

7. **Composición sobre herencia**: Componentes pequeños y componibles. Sin abstracciones especulativas.

8. **Audit de Contexto**: Si una regla aquí ya es evidente en el código, sugiérelo para eliminarla y reducir context bloat.

## 🛠️ Herramientas y Operaciones

- Comandos: ver `package.json` (`dev`, `build`, `lint`).
- Ediciones: agrupar cambios relacionados para minimizar tokens.
- Schema cambiado → actualizar `src/lib/supabase/types/database.ts`.
- Migración nueva → seguir `docs/runbooks/apply-migration.md`.

---

> [!TIP]
> Mantén este archivo corto. El minimalismo es poder para una IA (mejor rendimiento y menos costos).
