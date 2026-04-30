# Runbook: Vincular Trainer + Activar Rol Partner

## 1. Aplicar migración 013 en Supabase Panel Web

Ir a **Supabase → SQL Editor** y ejecutar el archivo:
`src/lib/supabase/migrations/013_partner_role.sql`

> El script altera el CHECK de `role`, agrega `member_id`, crea la función `get_my_member_id()`, y actualiza todas las políticas RLS de `training_sessions` y `session_exercises`.

---

## 2. Obtener el establishment_id

```sql
SELECT id, name, slug FROM establishments;
```

Copiar el `id` del establecimiento correspondiente (ej. Bunker Gym).

---

## 3. Vincular usuario bc22@bunkergym.co como Trainer

Descomentar y ejecutar el bloque INSERT del archivo de migración, reemplazando `<ESTABLISHMENT_ID>`:

```sql
INSERT INTO establishment_users (
  establishment_id,
  user_id,
  name,
  email,
  role,
  is_active
) VALUES (
  '<ESTABLISHMENT_ID>',
  '470b1eec-eb82-4c99-9d4e-cc4ee20bc85f',
  'Nombre del Trainer',       -- ajustar
  'bc22@bunkergym.co',
  'trainer',
  true
)
ON CONFLICT (establishment_id, user_id) DO UPDATE
  SET role = 'trainer', is_active = true;
```

---

## 4. Crear un Partner

Para vincular un usuario existente de `auth.users` como partner de un miembro:

```sql
-- 1. Asegurarse de que el miembro existe en la tabla members
SELECT id, name FROM members WHERE establishment_id = '<ESTABLISHMENT_ID>';

-- 2. Crear el partner (el user_id debe ser el UID de Supabase Auth)
INSERT INTO establishment_users (
  establishment_id,
  user_id,
  name,
  email,
  role,
  member_id,
  is_active
) VALUES (
  '<ESTABLISHMENT_ID>',
  '<USER_UID_DEL_PARTNER>',
  'Nombre del Partner',
  'partner@email.com',
  'partner',
  '<MEMBER_ID>',       -- UUID del registro en members
  true
);
```

> ⚠️ El campo `member_id` es **obligatorio** para el rol partner. Sin él, el layout de `/[slug]/partner` redirige al login.

---

## 5. Verificar

```sql
-- Ver todos los usuarios del establecimiento con sus roles
SELECT eu.email, eu.role, eu.is_active, m.name as member_name
FROM establishment_users eu
LEFT JOIN members m ON m.id = eu.member_id
WHERE eu.establishment_id = '<ESTABLISHMENT_ID>'
ORDER BY eu.role;
```

---

## Flujo de redirección post-login

```
Usuario inicia sesión → / → lee establishment_users → redirige según rol:
  owner   → /[slug]/owner
  admin   → /[slug]/admin
  trainer → /[slug]/trainer → /trainer  (TODO: migrar)
  partner → /[slug]/partner
```
