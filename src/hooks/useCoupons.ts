import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DiscountCoupon, DiscountCouponInsert, DiscountCouponUpdate } from "@/lib/supabase/types/database";

export function useCoupons(slug?: string) {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchEstablishmentId = async (): Promise<string | null> => {
    if (!slug) return null;
    const { data } = await supabase
      .from("establishments")
      .select("id")
      .eq("slug", slug)
      .single();
    return data?.id ?? null;
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("discount_coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (slug) {
        const estId = establishmentId ?? await fetchEstablishmentId();
        if (!estId) throw new Error("Establecimiento no encontrado");
        setEstablishmentId(estId);
        query = query.eq("establishment_id", estId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar cupones";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (input: Omit<DiscountCouponInsert, "establishment_id">) => {
    try {
      const estId = slug ? (establishmentId ?? await fetchEstablishmentId()) : null;
      if (slug && !estId) throw new Error("Establecimiento no encontrado");
      if (estId) setEstablishmentId(estId);

      const { data, error } = await supabase
        .from("discount_coupons")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([{ ...input, ...(estId ? { establishment_id: estId } : {}) } as any])
        .select()
        .single();

      if (error) throw error;
      setCoupons((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear cupón";
      return { data: null, error: message };
    }
  };

  const updateCoupon = async (id: string, input: DiscountCouponUpdate) => {
    try {
      const { data, error } = await supabase
        .from("discount_coupons")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setCoupons((prev) => prev.map((c) => (c.id === id ? data : c)));
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar cupón";
      return { data: null, error: message };
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const { error } = await supabase
        .from("discount_coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar cupón";
      return { error: message };
    }
  };

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return {
    coupons,
    loading,
    error,
    refetch: fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
  };
}
