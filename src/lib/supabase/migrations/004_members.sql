-- ============================================================
-- Migration 004: Members
-- Cada miembro pertenece a un establecimiento.
-- created_by referencia establishment_users (no staff).
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id    UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  emergency_contact   TEXT,
  birth_date          DATE,
  photo_url           TEXT,
  notes               TEXT,
  status              TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_by          UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_members_establishment_id ON members(establishment_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(establishment_id, status);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(establishment_id, email);
