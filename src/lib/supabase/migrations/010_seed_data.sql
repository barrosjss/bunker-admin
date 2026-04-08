-- ============================================================
-- Migration 010: Seed Data
-- Ejercicios globales del sistema (establishment_id = NULL)
-- ============================================================

INSERT INTO exercises (establishment_id, name, description, muscle_group, equipment) VALUES
-- Pecho
(NULL, 'Press de banca plano', 'Acostado en banco plano, empujar barra hacia arriba', 'Pecho', 'Barra y banco'),
(NULL, 'Press inclinado con mancuernas', 'En banco inclinado, empujar mancuernas', 'Pecho', 'Mancuernas y banco'),
(NULL, 'Aperturas con mancuernas', 'Acostado, abrir y cerrar brazos', 'Pecho', 'Mancuernas y banco'),
-- Espalda
(NULL, 'Jalón al pecho', 'Tirar barra de polea hacia el pecho', 'Espalda', 'Polea'),
(NULL, 'Remo con barra', 'Inclinado, tirar barra hacia el abdomen', 'Espalda', 'Barra'),
(NULL, 'Remo con mancuerna', 'Apoyado en banco, tirar mancuerna', 'Espalda', 'Mancuerna y banco'),
-- Hombros
(NULL, 'Press militar', 'Empujar barra sobre la cabeza', 'Hombros', 'Barra'),
(NULL, 'Elevaciones laterales', 'Elevar mancuernas a los lados', 'Hombros', 'Mancuernas'),
(NULL, 'Face pull', 'Tirar cuerda de polea hacia la cara', 'Hombros', 'Polea'),
-- Bíceps
(NULL, 'Curl con barra', 'Flexionar brazos con barra', 'Bíceps', 'Barra'),
(NULL, 'Curl con mancuernas alterno', 'Flexionar brazos alternando', 'Bíceps', 'Mancuernas'),
(NULL, 'Curl martillo', 'Flexionar con agarre neutro', 'Bíceps', 'Mancuernas'),
-- Tríceps
(NULL, 'Extensión de tríceps en polea', 'Empujar barra de polea hacia abajo', 'Tríceps', 'Polea'),
(NULL, 'Fondos en paralelas', 'Bajar y subir en barras paralelas', 'Tríceps', 'Paralelas'),
(NULL, 'Press francés', 'Bajar barra detrás de la cabeza', 'Tríceps', 'Barra Z y banco'),
-- Piernas
(NULL, 'Sentadilla con barra', 'Flexionar rodillas con barra en espalda', 'Piernas', 'Barra y rack'),
(NULL, 'Prensa de piernas', 'Empujar plataforma con piernas', 'Piernas', 'Máquina prensa'),
(NULL, 'Extensión de cuádriceps', 'Extender piernas en máquina', 'Piernas', 'Máquina extensión'),
-- Glúteos
(NULL, 'Hip thrust', 'Elevar cadera con barra apoyado en banco', 'Glúteos', 'Barra y banco'),
(NULL, 'Peso muerto rumano', 'Bajar barra con piernas semi-flexionadas', 'Glúteos', 'Barra'),
(NULL, 'Patada de glúteo en polea', 'Patada hacia atrás en polea baja', 'Glúteos', 'Polea'),
-- Core
(NULL, 'Plancha frontal', 'Mantener posición de plancha', 'Core', 'Sin equipo'),
(NULL, 'Crunch en polea', 'Flexionar tronco con polea alta', 'Core', 'Polea'),
(NULL, 'Russian twist', 'Rotar tronco sentado con peso', 'Core', 'Mancuerna o disco')
ON CONFLICT DO NOTHING;
