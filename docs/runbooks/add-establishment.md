# Runbook: Agregar un nuevo establecimiento

## Pasos en Supabase Dashboard → SQL Editor

```sql
-- 1. Crear el establecimiento
INSERT INTO establishments (name, slug, email, phone)
VALUES ('Nombre del Gym', 'slug-del-gym', 'contacto@gym.com', '+57...');

-- 2. Crear el usuario owner en Auth (Supabase Dashboard → Authentication → Users → Invite user)
-- Luego obtener el user_id del usuario creado y ejecutar:

INSERT INTO establishment_users (establishment_id, user_id, name, email, role)
VALUES (
  (SELECT id FROM establishments WHERE slug = 'slug-del-gym'),
  '<user_id_de_auth>',
  'Nombre Owner',
  'owner@gym.com',
  'owner'
);

-- 3. Crear el formulario de registro (deshabilitado por defecto)
INSERT INTO registration_forms (establishment_id, is_enabled)
VALUES (
  (SELECT id FROM establishments WHERE slug = 'slug-del-gym'),
  false
);
```

## Verificación

Después de ejecutar, confirmar que:
- `establishments` tiene el nuevo registro
- `establishment_users` tiene el owner vinculado al `user_id` correcto
- `registration_forms` tiene el registro con `is_enabled = false`
- El owner puede hacer login y accede a `/slug-del-gym/owner`
