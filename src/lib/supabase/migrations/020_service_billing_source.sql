-- ============================================================
-- Migration 020: Origen del cobro en service_subscriptions
--
-- No todos los personalizados se pagan aparte: algunos miembros lo tienen
-- incluido en lo que ya pagaron por la membresía del gym. Los dos casos
-- generan un período de personalizado vigente, pero solo uno mueve plata.
--
-- Sin esta columna, un personalizado incluido sería indistinguible de uno
-- pagado en $0, y el historial financiero contaría cobros que nunca existieron.
--
--   paid                    → el entrenador cobró aparte (comportamiento previo)
--   included_in_membership  → va con la membresía del gym; amount_paid = 0 y el
--                             período corre hasta que venza esa membresía
-- ============================================================

ALTER TABLE service_subscriptions
  ADD COLUMN IF NOT EXISTS billing_source TEXT NOT NULL DEFAULT 'paid';

ALTER TABLE service_subscriptions
  DROP CONSTRAINT IF EXISTS service_subscriptions_billing_source_check;

ALTER TABLE service_subscriptions
  ADD CONSTRAINT service_subscriptions_billing_source_check
  CHECK (billing_source IN ('paid', 'included_in_membership'));

COMMENT ON COLUMN service_subscriptions.billing_source IS
  'paid = cobrado aparte por el entrenador; included_in_membership = venía con la membresía del gym, sin cobro';

-- Los filtros de caja del entrenador excluyen lo incluido, así que conviene
-- el índice por origen dentro del establecimiento.
CREATE INDEX IF NOT EXISTS idx_service_subscriptions_billing_source
  ON service_subscriptions(establishment_id, billing_source);
