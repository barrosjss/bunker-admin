-- ============================================================
-- Migration 010: Add 'frozen' status to Memberships
-- ============================================================

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_status_check CHECK (status IN ('active', 'expired', 'cancelled', 'frozen'));

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;
