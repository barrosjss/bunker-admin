"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Retorna el member_id del partner autenticado.
 * Solo funciona si el usuario tiene role = 'partner' en establishment_users.
 */
export function usePartnerMemberId() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [partnerEuId, setPartnerEuId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("establishment_users")
      .select("id, member_id, name")
      .eq("user_id", user.id)
      .eq("role", "partner")
      .eq("is_active", true)
      .single();

    if (data) {
      setMemberId(data.member_id);
      setPartnerEuId(data.id);
      setName(data.name);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { memberId, partnerEuId, name, loading };
}
