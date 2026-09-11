-- ============================================================
-- Migration 017: Servicios del entrenador y evaluación física
--
-- Modelo de negocio:
--   La membresía del gym (tabla `memberships`) es obligatoria para todos.
--   Aparte de eso, el entrenador vende sus propios servicios:
--     - Entrenamiento personalizado → mensual recurrente
--     - Evaluación física           → pago único, INCLUIDA para personalizados
--
--   Esta caja es del entrenador y vive separada de `memberships`, que es lo
--   que lee /[slug]/admin/finance. El admin no ve estos ingresos.
--
--   Ser "personalizado" = tener una service_subscriptions activa sobre un
--   servicio con kind = 'personal_training'. No se usa `trainer_members`.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: el establishment_users.id del usuario autenticado
-- (get_my_establishment_id / get_my_role ya existen en 009)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_establishment_user_id()
RETURNS UUID AS $$
  SELECT id
  FROM establishment_users
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------
-- 1. Sexo del miembro
-- Necesario para estimar % de grasa (Durnin-Womersley es específico
-- por sexo). La edad no se guarda: se deriva de members.birth_date.
-- ------------------------------------------------------------
ALTER TABLE members ADD COLUMN IF NOT EXISTS sex TEXT;

ALTER TABLE members DROP CONSTRAINT IF EXISTS members_sex_check;
ALTER TABLE members ADD CONSTRAINT members_sex_check
  CHECK (sex IS NULL OR sex IN ('male', 'female'));

-- ------------------------------------------------------------
-- 2. Catálogo de servicios del entrenador
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  trainer_id       UUID REFERENCES establishment_users(id) ON DELETE CASCADE,
  -- NULL = servicio del gym; UUID = servicio propio de ese entrenador

  name             TEXT NOT NULL,
  description      TEXT,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,

  billing_type     TEXT NOT NULL DEFAULT 'recurring'
                     CHECK (billing_type IN ('recurring', 'one_off')),
  duration_days    INTEGER,

  -- `kind` permite que el código identifique el servicio de personalizado y
  -- el de evaluación sin depender del texto de `name`, que el entrenador edita.
  kind             TEXT NOT NULL DEFAULT 'other'
                     CHECK (kind IN ('personal_training', 'evaluation', 'other')),

  -- true = quien tiene personalizado activo no paga este servicio
  included_with_personal_training BOOLEAN NOT NULL DEFAULT false,

  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT trainer_services_duration_check CHECK (
    billing_type <> 'recurring' OR (duration_days IS NOT NULL AND duration_days > 0)
  )
);

DROP TRIGGER IF EXISTS trainer_services_updated_at ON trainer_services;
CREATE TRIGGER trainer_services_updated_at
  BEFORE UPDATE ON trainer_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_trainer_services_establishment_id
  ON trainer_services(establishment_id);
CREATE INDEX IF NOT EXISTS idx_trainer_services_trainer_id
  ON trainer_services(trainer_id);

-- Un entrenador tiene como máximo un servicio de personalizado y uno de
-- evaluación. Los 'other' son libres.
CREATE UNIQUE INDEX IF NOT EXISTS uq_trainer_services_kind
  ON trainer_services (establishment_id, trainer_id, kind)
  WHERE kind IN ('personal_training', 'evaluation');

-- ------------------------------------------------------------
-- 3. Contrataciones y cobros de esos servicios
-- Espejo de `memberships`, pero para la caja del entrenador.
-- Recurrente → end_date con la fecha de vencimiento.
-- Pago único → end_date NULL.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_id       UUID NOT NULL REFERENCES trainer_services(id) ON DELETE RESTRICT,
  trainer_id       UUID REFERENCES establishment_users(id) ON DELETE SET NULL,

  start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,

  amount_paid      NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method   TEXT CHECK (payment_method IN ('cash', 'card', 'transfer')),

  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'expired', 'cancelled', 'frozen')),
  frozen_at        TIMESTAMPTZ,

  notes            TEXT,
  created_by       UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_subscriptions_member_id
  ON service_subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_trainer_id
  ON service_subscriptions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_end_date
  ON service_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_status
  ON service_subscriptions(establishment_id, status);

-- ------------------------------------------------------------
-- 4. Evaluación física
-- Calca la planilla en papel: pliegues cutáneos en mm, algunos
-- bilaterales (izquierdo/derecho), más peso y estatura.
-- IMC, suma de pliegues y % de grasa se calculan en la app para
-- poder recalcular histórico si se ajusta la fórmula.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS physical_evaluations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  trainer_id       UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  evaluated_on     DATE NOT NULL DEFAULT CURRENT_DATE,

  weight_kg        NUMERIC(5,2),
  height_cm        NUMERIC(5,1),

  -- Pliegues bilaterales (mm). El entrenador no siempre anota los dos lados.
  tricipital_left    NUMERIC(4,1),
  tricipital_right   NUMERIC(4,1),
  bicipital_left     NUMERIC(4,1),
  bicipital_right    NUMERIC(4,1),
  cuadriceps_left    NUMERIC(4,1),
  cuadriceps_right   NUMERIC(4,1),
  pantorrilla_left   NUMERIC(4,1),
  pantorrilla_right  NUMERIC(4,1),
  pectoral_left      NUMERIC(4,1),
  pectoral_right     NUMERIC(4,1),

  -- Pliegues de un solo sitio (mm)
  subescapular     NUMERIC(4,1),
  suprailiaco      NUMERIC(4,1),
  abdominal        NUMERIC(4,1),

  -- NULL = incluida en el personalizado. Con valor = se cobró aparte.
  payment_id       UUID REFERENCES service_subscriptions(id) ON DELETE SET NULL,

  notes            TEXT,
  created_by       UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS physical_evaluations_updated_at ON physical_evaluations;
CREATE TRIGGER physical_evaluations_updated_at
  BEFORE UPDATE ON physical_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_physical_evaluations_member_id
  ON physical_evaluations(member_id, evaluated_on DESC);
CREATE INDEX IF NOT EXISTS idx_physical_evaluations_trainer_id
  ON physical_evaluations(trainer_id);
CREATE INDEX IF NOT EXISTS idx_physical_evaluations_establishment_id
  ON physical_evaluations(establishment_id, evaluated_on DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE trainer_services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_evaluations  ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- trainer_services: cada entrenador gestiona su propio catálogo.
-- El owner ve todo (es su negocio). El admin no.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Trainers manage their own services" ON trainer_services;
CREATE POLICY "Trainers manage their own services"
  ON trainer_services FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND (trainer_id = get_my_establishment_user_id() OR get_my_role() = 'owner')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
    AND (trainer_id = get_my_establishment_user_id() OR get_my_role() = 'owner')
  );

-- ------------------------------------------------------------
-- service_subscriptions: la caja del entrenador.
-- Solo el entrenador dueño del cobro (y el owner del gym).
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Trainers manage their own service subscriptions" ON service_subscriptions;
CREATE POLICY "Trainers manage their own service subscriptions"
  ON service_subscriptions FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND (trainer_id = get_my_establishment_user_id() OR get_my_role() = 'owner')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
    AND (trainer_id = get_my_establishment_user_id() OR get_my_role() = 'owner')
  );

-- ------------------------------------------------------------
-- physical_evaluations: dato clínico, no plata.
-- Todo el staff del gym puede leerlas; las gestiona quien entrena.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can read evaluations of their establishment" ON physical_evaluations;
CREATE POLICY "Staff can read evaluations of their establishment"
  ON physical_evaluations FOR SELECT TO authenticated
  USING (establishment_id = get_my_establishment_id());

DROP POLICY IF EXISTS "Trainers and admins can manage evaluations" ON physical_evaluations;
CREATE POLICY "Trainers and admins can manage evaluations"
  ON physical_evaluations FOR ALL TO authenticated
  USING (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin', 'trainer')
  )
  WITH CHECK (
    establishment_id = get_my_establishment_id()
    AND get_my_role() IN ('owner', 'admin', 'trainer')
  );

-- ============================================================
-- Seed: los dos servicios base para cada entrenador existente.
-- Precio en 0 — cada entrenador pone el suyo desde el panel.
-- ============================================================
INSERT INTO trainer_services
  (establishment_id, trainer_id, name, description, price, billing_type,
   duration_days, kind, included_with_personal_training)
SELECT
  eu.establishment_id,
  eu.id,
  'Entrenamiento personalizado',
  'Acompañamiento mensual del entrenador, aparte de la membresía del gym.',
  0,
  'recurring',
  30,
  'personal_training',
  false
FROM establishment_users eu
WHERE eu.role = 'trainer' AND eu.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO trainer_services
  (establishment_id, trainer_id, name, description, price, billing_type,
   duration_days, kind, included_with_personal_training)
SELECT
  eu.establishment_id,
  eu.id,
  'Evaluación física',
  'Medición de pliegues cutáneos, peso y estatura. Incluida para personalizados.',
  0,
  'one_off',
  NULL,
  'evaluation',
  true
FROM establishment_users eu
WHERE eu.role = 'trainer' AND eu.is_active = true
ON CONFLICT DO NOTHING;
