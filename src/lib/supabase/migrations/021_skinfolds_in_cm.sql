-- ============================================================
-- Migration 021: Pliegues cutáneos en centímetros
--
-- El entrenador registra los pliegues en cm, no en mm. El cambio es de unidad
-- de captura: lo que antes se guardaba como 4 (mm) ahora se guarda como 0.4 (cm).
--
-- Durnin-Womersley trabaja en mm, así que la conversión vive en un único punto
-- (`calculateBodyFat` en lib/utils/anthropometry.ts) y el % de grasa no cambia.
--
-- La precisión tiene que crecer: NUMERIC(4,1) daba un decimal, suficiente en mm
-- pero no en cm — un pliegue de 4,5 mm son 0,45 cm y se redondearía a 0,5.
-- NUMERIC(5,2) conserva el equivalente a 0,1 mm.
--
-- No hay datos que convertir: la tabla está vacía al aplicar esta migración.
-- Si llegara a haber filas en mm, habría que dividirlas entre 10 antes.
-- ============================================================

ALTER TABLE physical_evaluations
  ALTER COLUMN tricipital_left    TYPE NUMERIC(5,2),
  ALTER COLUMN tricipital_right   TYPE NUMERIC(5,2),
  ALTER COLUMN bicipital_left     TYPE NUMERIC(5,2),
  ALTER COLUMN bicipital_right    TYPE NUMERIC(5,2),
  ALTER COLUMN cuadriceps_left    TYPE NUMERIC(5,2),
  ALTER COLUMN cuadriceps_right   TYPE NUMERIC(5,2),
  ALTER COLUMN pantorrilla_left   TYPE NUMERIC(5,2),
  ALTER COLUMN pantorrilla_right  TYPE NUMERIC(5,2),
  ALTER COLUMN pectoral_left      TYPE NUMERIC(5,2),
  ALTER COLUMN pectoral_right     TYPE NUMERIC(5,2),
  ALTER COLUMN subescapular       TYPE NUMERIC(5,2),
  ALTER COLUMN suprailiaco        TYPE NUMERIC(5,2),
  ALTER COLUMN abdominal          TYPE NUMERIC(5,2);

-- Las columnas no llevan la unidad en el nombre, así que queda documentada acá:
-- sin esto, un mm mal asumido rompe el % de grasa en silencio.
COMMENT ON COLUMN physical_evaluations.tricipital_left   IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.tricipital_right  IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.bicipital_left    IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.bicipital_right   IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.cuadriceps_left   IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.cuadriceps_right  IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.pantorrilla_left  IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.pantorrilla_right IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.pectoral_left     IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.pectoral_right    IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.subescapular      IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.suprailiaco       IS 'Pliegue cutáneo en cm';
COMMENT ON COLUMN physical_evaluations.abdominal         IS 'Pliegue cutáneo en cm';
