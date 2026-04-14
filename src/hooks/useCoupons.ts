import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DiscountCoupon, DiscountCouponInsert, DiscountCouponUpdate } from "@/lib/supabase/types/database";

export function useCoupons() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .order("created_at", { ascending: false });

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
      // establishment_id lo agrega RLS automáticamente via get_my_establishment_id()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from("discount_coupons")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([input as any])
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
  }, []);

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
