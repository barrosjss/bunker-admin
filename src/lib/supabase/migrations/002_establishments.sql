-- ============================================================
-- Migration 002: Establishments
-- Cada gimnasio/establecimiento tiene su propio slug único
-- que se usa en las URLs públicas (ej: /bunker/register)
-- ============================================================

CREATE TABLE IF NOT EXISTS establishments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,          -- URL-friendly, ej: "bunker-gym"
  logo_url     TEXT,
  address      TEXT,
  phone        TEXT,
  email        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER establishments_updated_at
  BEFORE UPDATE ON establishments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
