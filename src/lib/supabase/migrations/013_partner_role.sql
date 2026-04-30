-- ============================================================
-- Migration 013: Rol Partner + Vinculación Trainer
--
-- Cambios:
--   1. Ampliar CHECK constraint de role para incluir 'partner'
--   2. Agregar columna member_id en establishment_users (solo para partners)
--   3. Función helper get_my_member_id() para partners
--   4. Políticas RLS actualizadas para permitir que partners
--      accedan únicamente a sus propias training_sessions
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- PASO 1: Ampliar el rol en establishment_users
-- ──────────────────────────────────────────────────────────────

-- Eliminar el constraint existente de role
ALTER TABLE establishment_users
  DROP CONSTRAINT IF EXISTS establishment_users_role_check;

-- Recrear incluyendo 'partner'
ALTER TABLE establishment_users
  ADD CONSTRAINT establishment_users_role_check
  CHECK (role IN ('owner', 'admin', 'trainer', 'partner'));

-- ──────────────────────────────────────────────────────────────
-- PASO 2: Agregar member_id en establishment_users
-- Solo se usa para el rol 'partner'; para el resto es NULL
-- ──────────────────────────────────────────────────────────────

ALTER TABLE establishment_users
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_establishment_users_member_id
  ON establishment_users(member_id);

-- ──────────────────────────────────────────────────────────────
-- PASO 3: Vincular usuario bc22@bunkergym.co como trainer
--
-- IMPORTANTE: Reemplazar <ESTABLISHMENT_ID> con el UUID real
-- del establecimiento antes de ejecutar.
-- Para obtenerlo: SELECT id FROM establishments WHERE slug = 'bunker-gym';
-- ──────────────────────────────────────────────────────────────

-- INSERT INTO establishment_users (
--   establishment_id,
--   user_id,
--   name,
--   email,
--   role,
--   is_active
-- ) VALUES (
--   '<ESTABLISHMENT_ID>',
--   '470b1eec-eb82-4c99-9d4e-cc4ee20bc85f',
--   'BC22',
--   'bc22@bunkergym.co',
--   'trainer',
--   true
-- )
-- ON CONFLICT (establishment_id, user_id) DO UPDATE
--   SET role = 'trainer', is_active = true;

-- ──────────────────────────────────────────────────────────────
-- PASO 4: Función helper para partners
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS UUID AS $$
  SELECT member_id
  FROM establishment_users
  WHERE user_id = auth.uid()
    AND is_active = true
    AND role = 'partner'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────
-- PASO 5: RLS — training_sessions
-- Partners solo ven/modifican sus propias sesiones
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Staff can read their sessions" ON training_sessions;
CREATE POLICY "Staff and partners can read sessions"
  ON training_sessions FOR SELECT TO authenticated
  USING (
    -- Staff del gym ve todas las sesiones del establecimiento
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin', 'trainer'))
    OR
    -- Partner solo ve las sesiones donde es el miembro
    (member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Staff can insert sessions" ON training_sessions;
CREATE POLICY "Staff and partners can insert sessions"
  ON training_sessions FOR INSERT TO authenticated
  WITH CHECK (
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin', 'trainer'))
    OR
    -- Partner solo puede insertar sesiones para sí mismo, dentro de su establecimiento
    (
      member_id = get_my_member_id()
      AND get_my_member_id() IS NOT NULL
      AND establishment_id = get_my_establishment_id()
    )
  );

DROP POLICY IF EXISTS "Staff can update sessions" ON training_sessions;
CREATE POLICY "Staff and partners can update sessions"
  ON training_sessions FOR UPDATE TO authenticated
  USING (
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin', 'trainer'))
    OR
    (member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Admins can delete sessions" ON training_sessions;
CREATE POLICY "Admins and partners can delete sessions"
  ON training_sessions FOR DELETE TO authenticated
  USING (
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin'))
    OR
    (member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
  );

-- ──────────────────────────────────────────────────────────────
-- PASO 6: RLS — session_exercises
-- Partners acceden solo a exercises de sus propias sesiones
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Staff can read session exercises" ON session_exercises;
CREATE POLICY "Staff and partners can read session exercises"
  ON session_exercises FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM training_sessions
      WHERE establishment_id = get_my_establishment_id()
        AND get_my_role() IN ('owner', 'admin', 'trainer')
    )
    OR
    session_id IN (
      SELECT id FROM training_sessions
      WHERE member_id = get_my_member_id()
        AND get_my_member_id() IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Staff can manage session exercises" ON session_exercises;
CREATE POLICY "Staff and partners can manage session exercises"
  ON session_exercises FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT id FROM training_sessions
      WHERE establishment_id = get_my_establishment_id()
    )
    OR
    session_id IN (
      SELECT id FROM training_sessions
      WHERE member_id = get_my_member_id()
        AND get_my_member_id() IS NOT NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM training_sessions
      WHERE establishment_id = get_my_establishment_id()
    )
    OR
    session_id IN (
      SELECT id FROM training_sessions
      WHERE member_id = get_my_member_id()
        AND get_my_member_id() IS NOT NULL
    )
  );
