-- Insert data for Membership Plans
-- Copy and paste this script into your Supabase SQL Editor to run it

INSERT INTO membership_plans (name, description, duration_days, price, is_active) VALUES
  -- Standard Plans
  ('Plan Día', 'Pase de un día para entrenar.', 1, 15000, true),
  ('Plan Mensual', 'Acceso completo por 30 días.', 30, 80000, true),
  ('Plan Trimestral', 'Ahorra en tu acceso por 90 días.', 90, 220000, true),
  ('Plan Anual', 'La mejor oferta del año. Acceso por 365 días.', 365, 800000, true),
  
  -- Campaign: BC22 Individual
  ('BC22 Individual 1 Mes', 'Entrenamiento estructurado, nutrición práctica y acompañamiento. Incluye mes de gimnasio.', 30, 150000, true),
  ('BC22 Individual 3 Meses', 'Entrenamiento estructurado, nutrición práctica y acompañamiento. Incluye mes de gimnasio.', 90, 400000, true),
  ('BC22 Individual 6 Meses', 'Entrenamiento estructurado, nutrición práctica y acompañamiento. Incluye mes de gimnasio.', 180, 700000, true),
  ('BC22 Individual 12 Meses', 'Entrenamiento estructurado, nutrición práctica y acompañamiento. Incluye mes de gimnasio.', 365, 1200000, true),
  
  -- Campaign: BC22 Por Pareja
  ('BC22 Pareja 1 Mes', 'Plan por pareja. Entrenamiento, nutrición y acompañamiento. Incluye mes de gimnasio.', 30, 250000, true),
  ('BC22 Pareja 3 Meses', 'Plan por pareja. Entrenamiento, nutrición y acompañamiento. Incluye mes de gimnasio.', 90, 600000, true),
  ('BC22 Pareja 6 Meses', 'Plan por pareja. Entrenamiento, nutrición y acompañamiento. Incluye mes de gimnasio.', 180, 900000, true);
