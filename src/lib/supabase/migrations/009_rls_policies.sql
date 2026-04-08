-- ============================================================
-- Migration 009: Row Level Security Policies
--
-- Estrategia:
--   - establishment_users: visible solo para usuarios del mismo establecimiento
--   - members, plans, etc: visible solo para usuarios autenticados del mismo gym
--   - registration_forms: lectura pública (para la página de registro)
--   - members INSERT: permitido anónimo vía formulario público (con check de form activo)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE establishments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishment_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE members                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships             ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises               ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises       ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_forms      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Función helper: retorna el establishment_id del usuario actual
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_establishment_id()
RETURNS UUID AS $$
  SELECT establishment_id
  FROM establishment_users
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Función helper: retorna el rol del usuario actual
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role
  FROM establishment_users
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- establishments
-- ============================================================
CREATE POLICY "Users can read their own establishment"
  ON establishments FOR SELECT TO authenticated
  USING (id = get_my_establishment_id());

-- Solo owners pueden actualizar su establecimiento
CREATE POLICY "Owners can update their establishment"
  ON establishments FOR UPDATE TO authenticated
  USING (id = get_my_establishment_id() AND get_my_role() = 'owner');

-- ============================================================
-- establishment_users
-- ============================================================
CREATE POLICY "Users can read users of their establishment"
  ON establishment_users FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Owners and admins can insert users"
  ON establishment_users FOR INSERT TO authenticated
  WITH CHECK (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can update users"
  ON establishment_users FOR UPDATE TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- ============================================================
-- members
-- ============================================================
CREATE POLICY "Staff can read their establishment members"
  ON members FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Staff can insert members"
  ON members FOR INSERT TO authenticated
  WITH CHECK (establishment_id = get_my_establishment_id());

CREATE POLICY "Staff can update members"
  ON members FOR UPDATE TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Admins and owners can delete members"
  ON members FOR DELETE TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- Registro público: anónimo puede insertar un miembro si el formulario está habilitado
CREATE POLICY "Public can register via enabled form"
  ON members FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_forms
      WHERE registration_forms.establishment_id = members.establishment_id
        AND registration_forms.is_enabled = true
    )
  );

-- ============================================================
-- membership_plans
-- ============================================================
CREATE POLICY "Staff can read their plans"
  ON membership_plans FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Admins can manage plans"
  ON membership_plans FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- ============================================================
-- memberships
-- ============================================================
CREATE POLICY "Staff can read memberships"
  ON memberships FOR SELECT TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE establishment_id = get_my_establishment_id()
    )
  );

CREATE POLICY "Staff can insert memberships"
  ON memberships FOR INSERT TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE establishment_id = get_my_establishment_id()
    )
  );

CREATE POLICY "Staff can update memberships"
  ON memberships FOR UPDATE TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE establishment_id = get_my_establishment_id()
    )
  );

-- ============================================================
-- exercises (globales o del gym)
-- ============================================================
CREATE POLICY "Anyone authenticated can read global exercises"
  ON exercises FOR SELECT TO authenticated
  USING (
    establishment_id IS NULL
    OR establishment_id = get_my_establishment_id()
  );

CREATE POLICY "Admins can manage their exercises"
  ON exercises FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin', 'trainer')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
  );

-- ============================================================
-- routine_templates
-- ============================================================
CREATE POLICY "Staff can read their routines"
  ON routine_templates FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Staff can manage their routines"
  ON routine_templates FOR ALL TO authenticated
  USING (establishment_id = get_my_establishment_id())
  WITH CHECK (establishment_id = get_my_establishment_id());

-- ============================================================
-- routine_template_exercises
-- ============================================================
CREATE POLICY "Staff can read routine exercises"
  ON routine_template_exercises FOR SELECT TO authenticated
  USING (
    template_id IN (
      SELECT id FROM routine_templates WHERE establishment_id = get_my_establishment_id()
    )
  );

CREATE POLICY "Staff can manage routine exercises"
  ON routine_template_exercises FOR ALL TO authenticated
  USING (
    template_id IN (
      SELECT id FROM routine_templates WHERE establishment_id = get_my_establishment_id()
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM routine_templates WHERE establishment_id = get_my_establishment_id()
    )
  );

-- ============================================================
-- trainer_members
-- ============================================================
CREATE POLICY "Staff can read trainer assignments"
  ON trainer_members FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Admins can manage trainer assignments"
  ON trainer_members FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
  );

-- ============================================================
-- training_sessions
-- ============================================================
CREATE POLICY "Staff can read their sessions"
  ON training_sessions FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Staff can insert sessions"
  ON training_sessions FOR INSERT TO authenticated
  WITH CHECK (establishment_id = get_my_establishment_id());

CREATE POLICY "Staff can update sessions"
  ON training_sessions FOR UPDATE TO authenticated
  USING (establishment_id = get_my_establishment_id());

CREATE POLICY "Admins can delete sessions"
  ON training_sessions FOR DELETE TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- ============================================================
-- session_exercises
-- ============================================================
CREATE POLICY "Staff can read session exercises"
  ON session_exercises FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM training_sessions WHERE establishment_id = get_my_establishment_id()
    )
  );

CREATE POLICY "Staff can manage session exercises"
  ON session_exercises FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT id FROM training_sessions WHERE establishment_id = get_my_establishment_id()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM training_sessions WHERE establishment_id = get_my_establishment_id()
    )
  );

-- ============================================================
-- registration_forms
-- Lectura pública (anon y authenticated) para mostrar el formulario
-- Solo admins/owners pueden actualizar
-- ============================================================
CREATE POLICY "Public can read registration forms"
  ON registration_forms FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage registration form"
  ON registration_forms FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin')
  );
