-- ============================================================
-- Migration 023: El índice de procedencia no puede ser parcial
--
-- La 022 creó uq_exercises_source con `WHERE source IS NOT NULL`. Postgres no
-- admite un índice parcial como árbitro de ON CONFLICT salvo que la sentencia
-- repita esa misma cláusula, y PostgREST no la emite: el upsert de la
-- importación fallaba con "no unique or exclusion constraint matching".
--
-- El filtro tampoco hacía falta. En un índice único los NULL cuentan como
-- distintos entre sí, así que los ejercicios cargados a mano —que tienen
-- source NULL— pueden convivir de a muchos sin chocar.
-- ============================================================

DROP INDEX IF EXISTS uq_exercises_source;

CREATE UNIQUE INDEX IF NOT EXISTS uq_exercises_source
  ON exercises (source, source_id);
