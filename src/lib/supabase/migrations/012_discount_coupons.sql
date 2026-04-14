-- Migration 012: Discount Coupons
-- Tabla de cupones de descuento por establecimiento

CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_amount numeric DEFAULT 0,
  max_uses integer,          -- NULL = usos ilimitados
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,    -- NULL = sin vencimiento
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, code)
);

-- RLS
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Solo el staff del establecimiento puede ver/gestionar sus cupones
CREATE POLICY "staff_can_manage_coupons"
  ON discount_coupons
  FOR ALL
  TO authenticated
  USING (establishment_id = get_my_establishment_id())
  WITH CHECK (establishment_id = get_my_establishment_id());

-- Índice para búsqueda por código
CREATE INDEX IF NOT EXISTS idx_discount_coupons_code
  ON discount_coupons (establishment_id, code);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_discount_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_discount_coupons_updated_at
  BEFORE UPDATE ON discount_coupons
  FOR EACH ROW EXECUTE FUNCTION update_discount_coupons_updated_at();
