-- ============================================================
-- Migration 006: Exercises & Routine Templates
-- Los ejercicios son globales (compartidos) o por establecimiento.
-- Las rutinas pertenecen al establecimiento y las crea el trainer/admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercises (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  -- NULL = ejercicio global del sistema; UUID = ejercicio privado del gym
  name             TEXT NOT NULL,
  description      TEXT,
  muscle_group     TEXT,
  equipment        TEXT,
  video_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_establishment_id ON exercises(establishment_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS routine_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  difficulty       TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_by       UUID REFERENCES establishment_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routine_templates_establishment_id
  ON routine_templates(establishment_id);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS routine_template_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  sets        INTEGER,
  reps        TEXT,
  rest_seconds INTEGER,
  order_index INTEGER,
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_routine_template_exercises_template_id
  ON routine_template_exercises(template_id);
