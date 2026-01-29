-- Tabla trainer_members (asignación entrenador↔miembro)
CREATE TABLE trainer_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trainer_id, member_id)
);

ALTER TABLE trainer_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view trainer_members" ON trainer_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert trainer_members" ON trainer_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can delete trainer_members" ON trainer_members FOR DELETE TO authenticated USING (true);

-- Agregar created_by a members
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff(id);

-- Seed de ejercicios
INSERT INTO exercises (name, description, muscle_group, equipment) VALUES
-- Pecho
('Press de banca plano', 'Acostado en banco plano, empujar barra hacia arriba', 'Pecho', 'Barra y banco'),
('Press inclinado con mancuernas', 'En banco inclinado, empujar mancuernas', 'Pecho', 'Mancuernas y banco'),
('Aperturas con mancuernas', 'Acostado, abrir y cerrar brazos', 'Pecho', 'Mancuernas y banco'),
-- Espalda
('Jalón al pecho', 'Tirar barra de polea hacia el pecho', 'Espalda', 'Polea'),
('Remo con barra', 'Inclinado, tirar barra hacia el abdomen', 'Espalda', 'Barra'),
('Remo con mancuerna', 'Apoyado en banco, tirar mancuerna', 'Espalda', 'Mancuerna y banco'),
-- Hombros
('Press militar', 'Empujar barra sobre la cabeza', 'Hombros', 'Barra'),
('Elevaciones laterales', 'Elevar mancuernas a los lados', 'Hombros', 'Mancuernas'),
('Face pull', 'Tirar cuerda de polea hacia la cara', 'Hombros', 'Polea'),
-- Bíceps
('Curl con barra', 'Flexionar brazos con barra', 'Bíceps', 'Barra'),
('Curl con mancuernas alterno', 'Flexionar brazos alternando', 'Bíceps', 'Mancuernas'),
('Curl martillo', 'Flexionar con agarre neutro', 'Bíceps', 'Mancuernas'),
-- Tríceps
('Extensión de tríceps en polea', 'Empujar barra de polea hacia abajo', 'Tríceps', 'Polea'),
('Fondos en paralelas', 'Bajar y subir en barras paralelas', 'Tríceps', 'Paralelas'),
('Press francés', 'Bajar barra detrás de la cabeza', 'Tríceps', 'Barra Z y banco'),
-- Piernas
('Sentadilla con barra', 'Flexionar rodillas con barra en espalda', 'Piernas', 'Barra y rack'),
('Prensa de piernas', 'Empujar plataforma con piernas', 'Piernas', 'Máquina prensa'),
('Extensión de cuádriceps', 'Extender piernas en máquina', 'Piernas', 'Máquina extensión'),
-- Glúteos
('Hip thrust', 'Elevar cadera con barra apoyado en banco', 'Glúteos', 'Barra y banco'),
('Peso muerto rumano', 'Bajar barra con piernas semi-flexionadas', 'Glúteos', 'Barra'),
('Patada de glúteo en polea', 'Patada hacia atrás en polea baja', 'Glúteos', 'Polea'),
-- Core
('Plancha frontal', 'Mantener posición de plancha', 'Core', 'Sin equipo'),
('Crunch en polea', 'Flexionar tronco con polea alta', 'Core', 'Polea'),
('Russian twist', 'Rotar tronco sentado con peso', 'Core', 'Mancuerna o disco')
ON CONFLICT DO NOTHING;
