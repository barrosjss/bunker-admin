-- ============================================================
-- Migration 005: Membership Plans & Memberships
-- Los planes son por establecimiento.
-- ============================================================

CREATE TABLE IF NOT EXISTS membership_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  duration_days    INTEGER NOT NULL,
  price            DECIMAL(10,2) NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_establishment_id
  ON membership_plans(establishment_id);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS memberships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id        UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  amount_paid    DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer')),
  status         TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  notes          TEXT,
  created_by     UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
