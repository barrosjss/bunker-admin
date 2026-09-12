-- ============================================================
-- Migration 018: Fijar search_path en las funciones del schema public
--
-- El linter de Supabase (0011_function_search_path_mutable) marca toda función
-- sin `search_path` fijo. En las SECURITY DEFINER eso es explotable: la función
-- corre con los privilegios de su dueño, y quien la invoca controla el
-- search_path, así que puede anteponer un esquema propio con una tabla
-- `establishment_users` falsa y hacer que la función lea de ahí.
--
-- Se fija `public, pg_temp` — no `''` — porque los cuerpos referencian las
-- tablas sin calificar (`establishment_users`, `session_exercises`). Con `''`
-- dejarían de resolver. `pg_temp` va ÚLTIMO a propósito: si fuera primero, un
-- usuario podría crear una tabla temporal homónima y shadowear la real.
--
-- Se usa ALTER FUNCTION en vez de CREATE OR REPLACE: no toca el cuerpo, así que
-- no hay forma de cambiar el comportamiento sin querer. Los triggers que
-- dependen de estas funciones no se ven afectados.
-- ============================================================

-- SECURITY DEFINER — acá el search_path mutable era el problema real
ALTER FUNCTION public.get_my_establishment_id()                SET search_path = public, pg_temp;
ALTER FUNCTION public.get_my_establishment_user_id()           SET search_path = public, pg_temp;
ALTER FUNCTION public.get_my_role()                            SET search_path = public, pg_temp;
ALTER FUNCTION public.get_my_member_id()                       SET search_path = public, pg_temp;
ALTER FUNCTION public.get_last_exercise_stats(uuid, uuid)      SET search_path = public, pg_temp;

-- SECURITY INVOKER (triggers de updated_at). Corren con los privilegios de
-- quien dispara el UPDATE, así que el riesgo es bajo y solo usan now(), que
-- está en pg_catalog. Se fijan igual para dejar el linter en cero.
ALTER FUNCTION public.update_updated_at()                      SET search_path = public, pg_temp;
ALTER FUNCTION public.update_discount_coupons_updated_at()     SET search_path = public, pg_temp;
