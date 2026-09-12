-- ============================================================
-- Migration 019: Cerrar get_last_exercise_stats
--
-- La función nació en la 015 como SECURITY DEFINER recibiendo `p_member_id`
-- por parámetro, sin derivarlo de la sesión y sin verificar nada. Eso saltea
-- el RLS de training_sessions: con EXECUTE otorgado a `anon`, cualquiera sin
-- iniciar sesión podía pegarle a /rest/v1/rpc/get_last_exercise_stats con un
-- member_id y recibir los pesos y repeticiones de esa persona. Los UUID no se
-- adivinan a lo bruto, pero aparecen en las URLs del panel.
--
-- Dos arreglos:
--   1. El cuerpo espeja la policy de SELECT de training_sessions, así el RPC
--      no puede mostrar nada que un SELECT directo no mostrara.
--   2. Se revoca EXECUTE a PUBLIC y anon; queda solo para authenticated.
--
-- El único consumidor es usePartnerRoutines (panel del partner, con su propio
-- member_id), que entra por la rama de partner del predicado.
-- ============================================================

-- OJO: CREATE OR REPLACE reemplaza la definición completa, incluida la
-- configuración. Hay que repetir el SET search_path de la 018 o se pierde.
CREATE OR REPLACE FUNCTION public.get_last_exercise_stats(p_member_id UUID, p_exercise_id UUID)
RETURNS TABLE(last_weight TEXT, last_unit TEXT, last_effective_reps TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    se.effective_weight,
    se.unit,
    se.effective_reps_range
  FROM session_exercises se
  JOIN training_sessions ts ON se.session_id = ts.id
  WHERE ts.member_id = p_member_id
    AND se.exercise_id = p_exercise_id
    -- Mismo predicado que la policy "Staff and partners can read sessions"
    -- de la migración 013. Si esa policy cambia, esto cambia con ella.
    AND (
      (ts.establishment_id = get_my_establishment_id()
        AND get_my_role() IN ('owner', 'admin', 'trainer'))
      OR
      (ts.member_id = get_my_member_id() AND get_my_member_id() IS NOT NULL)
    )
  ORDER BY ts.date DESC, ts.created_at DESC
  LIMIT 1;
END;
$function$;

-- Sin sesión no hay nada que consultar: get_my_*() devuelven NULL y el
-- predicado no matchea. Igual se revoca, para que la función deje de estar
-- expuesta en la API pública.
REVOKE EXECUTE ON FUNCTION public.get_last_exercise_stats(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_last_exercise_stats(UUID, UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_last_exercise_stats(UUID, UUID) TO authenticated;
