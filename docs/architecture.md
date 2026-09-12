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
│   │   ├── trainer/            # Redirección a /trainer (TODO: migrar)
│   │   └── partner/            # Dashboard partner (acceso a sus sesiones)
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
| `trainer` | `/[slug]/trainer` → `/trainer` | Sus miembros y sesiones, sus personalizados y evaluaciones físicas |
| `partner` | `/[slug]/partner` | Solo sus propias sesiones de entrenamiento |

Los dashboards son completamente independientes — sin panel selector, sin cambio de rol sin cerrar sesión. El middleware de Next.js redirige según el rol del usuario autenticado.

**Partner**: persona que recibe entrenamiento personal y tiene cuenta en el sistema. Tiene `role = 'partner'` en `establishment_users` y un `member_id` que lo vincula a su registro en `members`. El RLS garantiza que solo acceda a sus propias `training_sessions`.

## Schema (tablas principales)

```
establishments          → gimnasios (slug único para URLs)
establishment_users     → staff con rol por gym (owner/admin/trainer/partner)
                          partner tiene member_id → FK a members
members                 → miembros, con establishment_id
membership_plans        → planes del gym
memberships             → pagos y membresías activas
exercises               → catálogo global (establishment_id NULL) o privado del gym
routine_templates       → plantillas de rutinas por gym
training_sessions       → sesiones de entrenamiento
session_exercises       → ejercicios dentro de una sesión
trainer_members         → asignación trainer ↔ miembro
registration_forms      → formulario público por gym (is_enabled toggle)
trainer_services        → catálogo de servicios del entrenador (kind: personal_training
                          | evaluation | other). Precio y duración los fija el entrenador.
service_subscriptions   → cobros de esos servicios. Caja del entrenador, separada de
                          `memberships`. Recurrente → end_date; pago único → end_date NULL.
physical_evaluations    → pliegues cutáneos, peso y estatura. IMC y % de grasa se
                          calculan en la app, no se guardan.
```

## Servicios del entrenador

La membresía del gym (`memberships`) es obligatoria para todos y es lo que alimenta
`/[slug]/admin/finance`. Aparte de eso, el entrenador vende sus propios servicios y esa
plata **no** entra a la caja del gym: vive en `service_subscriptions`, con RLS que la
restringe al entrenador dueño del cobro y al `owner`. El `admin` no la ve.

- **Personalizado**: mensual recurrente. Ser personalizado = tener una
  `service_subscriptions` activa sobre un servicio con `kind = 'personal_training'`.
  No se usa `trainer_members` para esto. Se activa de dos formas, según
  `billing_source`: `paid` (el entrenador cobra aparte, período según
  `duration_days` del servicio) o `included_in_membership` (ya venía con la
  membresía del gym: `amount_paid = 0` y el período termina cuando vence esa
  membresía). Lo incluido no suma a la caja del entrenador.
- **Evaluación física**: pago único, incluida sin costo para quien tenga el
  personalizado vigente (`included_with_personal_training`). Si no es personalizado,
  la evaluación se cobra y queda enlazada vía `physical_evaluations.payment_id`.

Al renovar no se mutan las filas viejas: cada cobro es un período y el vigente es el de
`end_date` más lejana. El estado (al día / por vencer / vencido) se deriva en
`lib/utils/serviceStatus.ts`, espejo de `membershipStatus.ts`.

El % de grasa usa Durnin & Womersley (1974) sobre la suma de 4 pliegues + Siri, en
`lib/utils/anthropometry.ts`. Necesita `members.sex` y `members.birth_date`; la edad se
calcula a la fecha de la evaluación, no a hoy.

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
