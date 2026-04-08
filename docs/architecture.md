# Arquitectura — Bunker Admin

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Base de datos | Supabase (Postgres + Auth + RLS) |
| Estilos | Tailwind CSS |
| Formularios | React Hook Form + Zod |
| Fechas | date-fns (locale `es`) |

## Estructura de carpetas

```
src/
├── app/
│   ├── (auth)/login/           # Login único por credenciales
│   ├── [slug]/                 # Namespace por establecimiento
│   │   ├── register/           # Formulario público de registro (sin auth)
│   │   ├── owner/              # Dashboard dueño del establecimiento
│   │   ├── admin/              # Dashboard administrador
│   │   └── trainer/            # Dashboard entrenador
│   └── page.tsx
│
├── components/
│   ├── ui/                     # Componentes base reutilizables
│   ├── layout/                 # Sidebars, headers, navegación
│   ├── dashboard/              # Stats cards, actividad reciente
│   ├── members/                # Formularios y cards de miembros
│   └── training/               # Sesiones y ejercicios
│
└── lib/
    └── supabase/               # Todo lo relacionado con Supabase
        ├── client.ts
        ├── server.ts
        ├── middleware.ts
        ├── migrations/         # SQL de referencia (se aplica en panel web)
        └── types/database.ts   # Tipos del schema

docs/
├── architecture.md             # Este archivo
├── decisions/                  # ADRs
└── runbooks/                   # Guías operacionales

knowledge/
└── vision.md                   # Propósito y modelo de negocio

requirements/
└── epics.md                    # Épicas e historias de usuario
```

## Multi-tenancy

Base de datos compartida con `establishment_id` en cada tabla. El aislamiento es responsabilidad del RLS en Postgres, no del código de la aplicación. Las funciones `get_my_establishment_id()` y `get_my_role()` determinan el contexto del usuario autenticado en cada query.

Las URLs usan el `slug` del establecimiento:
```
/bunker-gym/register  → formulario público
/bunker-gym/admin     → dashboard admin
/bunker-gym/trainer   → dashboard entrenador
/bunker-gym/owner     → panel del dueño
```

## Roles

| Rol | Acceso | Capacidades clave |
|-----|--------|-------------------|
| `owner` | `/[slug]/owner` | Configura el gym, gestiona el equipo |
| `admin` | `/[slug]/admin` | Miembros, planes, pagos, asignación de trainers |
| `trainer` | `/[slug]/trainer` | Solo sus miembros asignados y sesiones |

Los tres dashboards son completamente independientes — sin panel selector, sin cambio de rol sin cerrar sesión. El middleware de Next.js redirige según el rol del usuario autenticado.

## Schema (tablas principales)

```
establishments          → gimnasios (slug único para URLs)
establishment_users     → staff con rol por gym (owner/admin/trainer)
members                 → miembros, con establishment_id
membership_plans        → planes del gym
memberships             → pagos y membresías activas
exercises               → catálogo global (establishment_id NULL) o privado del gym
routine_templates       → plantillas de rutinas por gym
training_sessions       → sesiones de entrenamiento
session_exercises       → ejercicios dentro de una sesión
trainer_members         → asignación trainer ↔ miembro
registration_forms      → formulario público por gym (is_enabled toggle)
```

## Flujo de autenticación

```
1. Usuario → /login (email + password vía Supabase Auth)
2. Middleware → lee establishment_users para obtener rol y slug
3. Redirige a /[slug]/[rol]
4. Cada ruta verifica rol; acceso incorrecto → redirect
```

## Convenciones

- Server Components por defecto; `"use client"` solo cuando hay interactividad.
- Server Actions para mutaciones (formularios, crear/actualizar entidades).
- Queries siempre en `lib/supabase/` — nunca inline en componentes o páginas.
- Tipos desde `lib/supabase/types/database.ts` — no redefinir manualmente.
