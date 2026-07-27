-- ============================================================
-- Migration 015: Partner Routines & Weight Tracking
-- ============================================================

-- 1. Agregar member_id a routine_templates para rutinas personales
ALTER TABLE routine_templates 
ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE CASCADE;

-- 2. Actualizar políticas de RLS para routine_templates
-- Permitir que partners vean y gestionen sus propias rutinas
DROP POLICY IF EXISTS "Staff and partners can read routines" ON routine_templates;
CREATE POLICY "Staff and partners can read routines"
  ON routine_templates FOR SELECT TO authenticated
  USING (
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin', 'trainer'))
    OR
    (member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
  );

DROP POLICY IF EXISTS "Staff and partners can manage routines" ON routine_templates;
CREATE POLICY "Staff and partners can manage routines"
  ON routine_templates FOR ALL TO authenticated
  USING (
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin', 'trainer'))
    OR
    (member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
  )
  WITH CHECK (
    (establishment_id = get_my_establishment_id() AND get_my_role() IN ('owner', 'admin', 'trainer'))
    OR
    (member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
  );

-- 3. Actualizar políticas de RLS para routine_template_exercises
DROP POLICY IF EXISTS "Staff and partners can read routine exercises" ON routine_template_exercises;
CREATE POLICY "Staff and partners can read routine exercises"
  ON routine_template_exercises FOR SELECT TO authenticated
  USING (
    template_id IN (
      SELECT id FROM routine_templates 
      WHERE establishment_id = get_my_establishment_id()
        AND (get_my_role() IN ('owner', 'admin', 'trainer') OR member_id = get_my_member_id())
    )
  );

DROP POLICY IF EXISTS "Staff and partners can manage routine exercises" ON routine_template_exercises;
CREATE POLICY "Staff and partners can manage routine exercises"
  ON routine_template_exercises FOR ALL TO authenticated
  USING (
    template_id IN (
      SELECT id FROM routine_templates 
      WHERE establishment_id = get_my_establishment_id()
        AND (get_my_role() IN ('owner', 'admin', 'trainer') OR member_id = get_my_member_id())
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM routine_templates 
      WHERE establishment_id = get_my_establishment_id()
        AND (get_my_role() IN ('owner', 'admin', 'trainer') OR member_id = get_my_member_id())
    )
  );

-- 4. Función para obtener el último peso de un ejercicio para un miembro
CREATE OR REPLACE FUNCTION get_last_exercise_stats(p_member_id UUID, p_exercise_id UUID)
RETURNS TABLE (
  last_weight TEXT,
  last_unit TEXT,
  last_effective_reps TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    effective_weight,
    unit,
    effective_reps_range
  FROM session_exercises se
  JOIN training_sessions ts ON se.session_id = ts.id
  WHERE ts.member_id = p_member_id
    AND se.exercise_id = p_exercise_id
  ORDER BY ts.date DESC, ts.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
