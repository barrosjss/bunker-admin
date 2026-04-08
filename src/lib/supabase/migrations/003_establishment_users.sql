-- ============================================================
-- Migration 003: Establishment Users (reemplaza a staff)
-- Cada usuario pertenece a un establecimiento con un rol:
--   owner   → dueño, puede crear admins y entrenadores
--   admin   → gestiona miembros, planes y pagos
--   trainer → accede solo a sus sesiones y miembros asignados
-- ============================================================

CREATE TABLE IF NOT EXISTS establishment_users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'trainer')),
  avatar_url       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un usuario solo puede tener un rol por establecimiento
  UNIQUE (establishment_id, user_id),
  -- El email es único dentro del mismo establecimiento
  UNIQUE (establishment_id, email)
);

CREATE TRIGGER establishment_users_updated_at
  BEFORE UPDATE ON establishment_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices de acceso frecuente
CREATE INDEX IF NOT EXISTS idx_establishment_users_establishment_id
  ON establishment_users(establishment_id);
CREATE INDEX IF NOT EXISTS idx_establishment_users_user_id
  ON establishment_users(user_id);
CREATE INDEX IF NOT EXISTS idx_establishment_users_role
  ON establishment_users(establishment_id, role);
