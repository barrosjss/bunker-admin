-- Bunker Admin Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff table (admin/trainers)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'trainer')) DEFAULT 'trainer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  emergency_contact TEXT,
  birth_date DATE,
  photo_url TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership plans table
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships table (payments)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer')),
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  notes TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises catalog
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT,
  equipment TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine templates
CREATE TABLE IF NOT EXISTS routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine template exercises
CREATE TABLE IF NOT EXISTS routine_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES routine_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sets INTEGER,
  reps TEXT,
  rest_seconds INTEGER,
  order_index INTEGER,
  notes TEXT
);

-- Training sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES staff(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session exercises
CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sets_completed INTEGER,
  reps_completed TEXT,
  weight DECIMAL(6,2),
  notes TEXT,
  order_index INTEGER
);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users full access)
-- Staff policies
CREATE POLICY "Allow authenticated users to read staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert staff" ON staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update staff" ON staff FOR UPDATE TO authenticated USING (true);

-- Members policies
CREATE POLICY "Allow authenticated users to read members" ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert members" ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update members" ON members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete members" ON members FOR DELETE TO authenticated USING (true);

-- Membership plans policies
CREATE POLICY "Allow authenticated users to read plans" ON membership_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert plans" ON membership_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update plans" ON membership_plans FOR UPDATE TO authenticated USING (true);

-- Memberships policies
CREATE POLICY "Allow authenticated users to read memberships" ON memberships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert memberships" ON memberships FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update memberships" ON memberships FOR UPDATE TO authenticated USING (true);

-- Exercises policies
CREATE POLICY "Allow authenticated users to read exercises" ON exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert exercises" ON exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update exercises" ON exercises FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete exercises" ON exercises FOR DELETE TO authenticated USING (true);

-- Routine templates policies
CREATE POLICY "Allow authenticated users to read routine_templates" ON routine_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert routine_templates" ON routine_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update routine_templates" ON routine_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete routine_templates" ON routine_templates FOR DELETE TO authenticated USING (true);

-- Routine template exercises policies
CREATE POLICY "Allow authenticated users to read routine_template_exercises" ON routine_template_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert routine_template_exercises" ON routine_template_exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update routine_template_exercises" ON routine_template_exercises FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete routine_template_exercises" ON routine_template_exercises FOR DELETE TO authenticated USING (true);

-- Training sessions policies
CREATE POLICY "Allow authenticated users to read training_sessions" ON training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert training_sessions" ON training_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update training_sessions" ON training_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete training_sessions" ON training_sessions FOR DELETE TO authenticated USING (true);

-- Session exercises policies
CREATE POLICY "Allow authenticated users to read session_exercises" ON session_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert session_exercises" ON session_exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update session_exercises" ON session_exercises FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete session_exercises" ON session_exercises FOR DELETE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_member_id ON training_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(date);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);

-- Insert some sample data (optional)
-- Uncomment below to insert sample membership plans

-- INSERT INTO membership_plans (name, description, duration_days, price) VALUES
--   ('Mensual', 'Acceso completo por 30 días', 30, 500),
--   ('Trimestral', 'Acceso completo por 90 días', 90, 1350),
--   ('Semestral', 'Acceso completo por 180 días', 180, 2400),
--   ('Anual', 'Acceso completo por 365 días', 365, 4500);

-- INSERT INTO exercises (name, muscle_group, equipment) VALUES
--   ('Press de banca', 'Pecho', 'Barra'),
--   ('Sentadilla', 'Piernas', 'Barra'),
--   ('Peso muerto', 'Espalda', 'Barra'),
--   ('Curl de bíceps', 'Bíceps', 'Mancuernas'),
--   ('Extensión de tríceps', 'Tríceps', 'Polea'),
--   ('Press militar', 'Hombros', 'Barra'),
--   ('Dominadas', 'Espalda', 'Peso corporal'),
--   ('Fondos', 'Pecho', 'Peso corporal'),
--   ('Plancha', 'Core', 'Peso corporal'),
--   ('Zancadas', 'Piernas', 'Mancuernas');
