import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/database";

/**
 * Cliente Supabase con service role key.
 * SOLO para uso en Server Actions y API Routes (nunca en el cliente).
 * Bypasea RLS — usar con cuidado.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no está configurada. " +
      "Agrégala en .env.local (ver .env.local.example)."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
