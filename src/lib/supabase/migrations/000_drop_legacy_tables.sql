-- ============================================================
-- Migration 000: Drop Legacy Tables
-- Ejecutar ANTES de las demás migraciones si ya existía
-- el schema anterior (single-tenant sin establishment_id).
--
-- ⚠️ ESTO BORRA TODOS LOS DATOS EXISTENTES.
-- Solo correr en desarrollo o en un proyecto nuevo.
-- ============================================================

-- Desactivar RLS temporalmente para poder hacer DROP
DROP TABLE IF EXISTS session_exercises       CASCADE;
DROP TABLE IF EXISTS training_sessions       CASCADE;
DROP TABLE IF EXISTS routine_template_exercises CASCADE;
DROP TABLE IF EXISTS routine_templates       CASCADE;
DROP TABLE IF EXISTS trainer_members         CASCADE;
DROP TABLE IF EXISTS memberships             CASCADE;
DROP TABLE IF EXISTS membership_plans        CASCADE;
DROP TABLE IF EXISTS exercises               CASCADE;
DROP TABLE IF EXISTS members                 CASCADE;
DROP TABLE IF EXISTS staff                   CASCADE;

-- Tablas nuevas (por si se corrió algo parcialmente)
DROP TABLE IF EXISTS registration_forms      CASCADE;
DROP TABLE IF EXISTS establishment_users     CASCADE;
DROP TABLE IF EXISTS establishments          CASCADE;

-- Función helper (se recrea en 002)
DROP FUNCTION IF EXISTS update_updated_at    CASCADE;
DROP FUNCTION IF EXISTS get_my_establishment_id CASCADE;
DROP FUNCTION IF EXISTS get_my_role          CASCADE;
