# Bunker Admin

Plataforma SaaS multi-tenant para la gestión de gimnasios. Permite a múltiples establecimientos administrar miembros, entrenadores, rutinas y membresías con aislamiento total de datos entre gyms.

## Stack

- **Next.js 14** (App Router) — framework principal
- **Supabase** — base de datos (Postgres + Auth + RLS)
- **Tailwind CSS** — estilos
- **React Hook Form + Zod** — formularios y validación

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/       # Login
│   └── [slug]/             # Rutas por establecimiento
│       ├── register/       # Formulario público de registro
│       ├── owner/          # Dashboard dueño
│       ├── admin/          # Dashboard administrador
│       └── trainer/        # Dashboard entrenador
├── components/             # UI, layout, members, training
├── hooks/                  # Custom hooks
└── lib/supabase/           # Clientes, tipos y migraciones

docs/
├── architecture.md         # Diseño global del sistema
├── decisions/              # ADRs (por qués técnicos)
└── runbooks/               # Guías operacionales

knowledge/vision.md         # Propósito y modelo de negocio
requirements/epics.md       # Épicas e historias de usuario
AGENTS.md                   # Fuente de verdad para agentes IA
```

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # Agregar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Base de datos

Las migraciones están en `src/lib/supabase/migrations/` como referencia histórica. Se aplican manualmente desde el panel web de Supabase. Ver `docs/runbooks/apply-migration.md`.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| `AGENTS.md` | Reglas y contexto para agentes IA |
| `docs/architecture.md` | Arquitectura, schema, roles y convenciones |
| `docs/decisions/` | ADRs con decisiones técnicas tomadas |
| `docs/runbooks/` | Guías paso a paso para operaciones recurrentes |
| `knowledge/vision.md` | Propósito del producto y modelo de negocio |
| `requirements/epics.md` | Funcionalidades y alcance |
