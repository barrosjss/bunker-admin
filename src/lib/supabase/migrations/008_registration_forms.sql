-- ============================================================
-- Migration 008: Registration Forms
-- Formulario público por establecimiento para auto-registro
-- de miembros. Se puede activar/desactivar desde el panel admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS registration_forms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE UNIQUE,
  -- Solo un formulario por establecimiento
  is_enabled       BOOLEAN NOT NULL DEFAULT false,
  -- Campos a mostrar en el formulario (todos opcionales excepto name)
  show_phone       BOOLEAN NOT NULL DEFAULT true,
  show_birth_date  BOOLEAN NOT NULL DEFAULT false,
  show_emergency_contact BOOLEAN NOT NULL DEFAULT false,
  -- Mensaje de bienvenida personalizable
  welcome_title    TEXT DEFAULT 'Únete a nosotros',
  welcome_message  TEXT DEFAULT 'Completa el formulario para registrarte.',
  -- Mensaje que se muestra cuando el formulario está deshabilitado
  disabled_message TEXT DEFAULT 'El registro no está disponible en este momento.',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER registration_forms_updated_at
  BEFORE UPDATE ON registration_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_registration_forms_establishment_id
  ON registration_forms(establishment_id);
