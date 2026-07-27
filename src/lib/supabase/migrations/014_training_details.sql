-- ============================================================
-- Migration 014: Detailed Training Registration Fields
-- ============================================================

-- Add detailed fields to session_exercises to follow the user's registry guidelines
ALTER TABLE session_exercises 
ADD COLUMN warmup_sets INTEGER DEFAULT 0,
ADD COLUMN warmup_weight TEXT,
ADD COLUMN warmup_reps TEXT,
ADD COLUMN effective_sets INTEGER DEFAULT 0,
ADD COLUMN effective_reps_range TEXT,
ADD COLUMN effective_weight TEXT,
ADD COLUMN unit TEXT DEFAULT 'kg',
ADD COLUMN circuit_group TEXT,
ADD COLUMN to_failure BOOLEAN DEFAULT FALSE;

-- Update existing weight and reps if needed (optional, keeping for backward compatibility)
-- weight is DECIMAL(6,2), effective_weight (TEXT) will store ranges like "120-130"

COMMENT ON COLUMN session_exercises.warmup_sets IS 'Number of warmup sets';
COMMENT ON COLUMN session_exercises.warmup_weight IS 'Weight used for warmup (can be a range or string)';
COMMENT ON COLUMN session_exercises.warmup_reps IS 'Reps performed in warmup (can be a range)';
COMMENT ON COLUMN session_exercises.effective_sets IS 'Number of effective sets';
COMMENT ON COLUMN session_exercises.effective_reps_range IS 'Target or achieved reps range for effective sets';
COMMENT ON COLUMN session_exercises.effective_weight IS 'Weight used for effective sets (can be a range)';
COMMENT ON COLUMN session_exercises.unit IS 'Unit of weight (kg, placas, lbs)';
COMMENT ON COLUMN session_exercises.circuit_group IS 'Grouping for circuits or supersets (e.g., A1, B1)';
COMMENT ON COLUMN session_exercises.to_failure IS 'Whether the set was performed to failure';
