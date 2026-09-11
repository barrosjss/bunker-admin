"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CurrentTrainer {
  /** establishment_users.id — no es el auth.users.id. */
  id: string;
  establishmentId: string;
  name: string;
  role: string;
}

/**
 * El entrenador autenticado, con su establishment_id.
 *
 * A diferencia de useCurrentTrainerId(), devuelve también el establecimiento:
 * las tablas nuevas lo piden NOT NULL en el insert, y el RLS lo verifica
 * contra get_my_establishment_id().
 */
export function useCurrentTrainer() {
  const [trainer, setTrainer] = useState<CurrentTrainer | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchTrainer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("establishment_users")
        .select("id, establishment_id, name, role")
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (data) {
        setTrainer({
          id: data.id,
          establishmentId: data.establishment_id,
          name: data.name,
          role: data.role,
        });
      }
      setLoading(false);
    }

    fetchTrainer();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { trainer, loading };
}
