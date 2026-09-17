-- ============================================================
-- Migration 022: Media, instrucciones y procedencia en exercises
--
-- El catálogo pasa de 75 ejercicios cargados a mano a ~1.400 importados, y la
-- tabla no tenía dónde poner ni la imagen ni la explicación del movimiento.
--
-- `attribution` no es opcional: la media viene de Gym visual y su licencia
-- exige que la atribución viaje con cada uso.
--
-- `source` + `source_id` hacen la importación repetible: si hay que recargar
-- con nombres corregidos, el ON CONFLICT actualiza en vez de duplicar.
-- ============================================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url          TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS gif_url            TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions       TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instruction_steps  JSONB;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS body_part          TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscles  TEXT[];
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS attribution        TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS source             TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS source_id          TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name_en            TEXT;

COMMENT ON COLUMN exercises.image_url IS 'Miniatura 180x180 en Storage';
COMMENT ON COLUMN exercises.gif_url IS 'Animación del movimiento en Storage';
COMMENT ON COLUMN exercises.attribution IS 'Obligatoria cuando la media no es propia';
COMMENT ON COLUMN exercises.source_id IS 'Id en el dataset de origen; permite reimportar sin duplicar';
COMMENT ON COLUMN exercises.name_en IS 'Nombre original en inglés, para poder rastrear la traducción';

-- Un ejercicio importado se identifica por su origen, no por el nombre: el
-- nombre lo puede editar el entrenador y entonces una reimportación lo duplicaría.
CREATE UNIQUE INDEX IF NOT EXISTS uq_exercises_source
  ON exercises (source, source_id)
  WHERE source IS NOT NULL;

-- Con ~1.400 filas el listado se busca por nombre en vez de recorrerse.
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises (lower(name));
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_equipment
  ON exercises (muscle_group, equipment);
