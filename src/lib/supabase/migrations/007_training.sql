-- ============================================================
-- Migration 007: Training Sessions & Trainer-Member Assignments
-- ============================================================

-- Asignación entrenador ↔ miembro dentro de un establecimiento
CREATE TABLE IF NOT EXISTS trainer_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  trainer_id       UUID NOT NULL REFERENCES establishment_users(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_by      UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (trainer_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_members_establishment_id
  ON trainer_members(establishment_id);
CREATE INDEX IF NOT EXISTS idx_trainer_members_trainer_id
  ON trainer_members(trainer_id);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS training_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  trainer_id       UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_establishment_id
  ON training_sessions(establishment_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_member_id
  ON training_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date
  ON training_sessions(date);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS session_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id     UUID REFERENCES exercises(id) ON DELETE SET NULL,
  sets_completed  INTEGER,
  reps_completed  TEXT,
  weight          DECIMAL(6,2),
  notes           TEXT,
  order_index     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id
  ON session_exercises(session_id);
