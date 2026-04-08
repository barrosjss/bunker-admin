-- ============================================================
-- Migration 011: Políticas públicas para el formulario de registro
-- Permite al usuario anónimo leer establecimientos activos
-- (necesario para cargar la página /[slug]/register sin auth)
-- ============================================================

-- Anon puede leer establecimientos activos (lookup por slug)
CREATE POLICY "Public can read active establishments"
  ON establishments FOR SELECT TO anon
  USING (is_active = true);
