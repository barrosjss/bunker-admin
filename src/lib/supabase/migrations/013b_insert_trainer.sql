-- ============================================================
-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- Paso 1: Verificar establishment_id del slug 'bunker'
-- ============================================================

-- PRIMERO ejecuta esto para obtener el UUID del establecimiento:
SELECT id, name, slug FROM establishments;

-- ============================================================
-- Paso 2: Una vez tengas el UUID, reemplázalo abajo y ejecuta:
-- ============================================================

-- Insertar bc22@bunkergym.co como trainer
-- REEMPLAZA <ESTABLISHMENT_ID> con el UUID del paso anterior

INSERT INTO establishment_users (
  establishment_id,
  user_id,
  name,
  email,
  role,
  is_active
) VALUES (
  (SELECT id FROM establishments WHERE slug = 'bunker'),  -- auto-detecta el slug
  '470b1eec-eb82-4c99-9d4e-cc4ee20bc85f',
  'BC22',
  'bc22@bunkergym.co',
  'trainer',
  true
)
ON CONFLICT (establishment_id, user_id) DO UPDATE
  SET role = 'trainer', is_active = true, name = 'BC22', email = 'bc22@bunkergym.co';

-- ============================================================
-- Paso 3: Verificar que se insertó correctamente
-- ============================================================
SELECT id, name, email, role, is_active
FROM establishment_users
ORDER BY role, name;
