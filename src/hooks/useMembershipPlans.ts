import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export type CreateMembershipPlanInput = Omit<MembershipPlan, "id" | "created_at">;
export type UpdateMembershipPlanInput = Partial<CreateMembershipPlanInput>;

export function useMembershipPlans(slug: string) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchEstablishmentId = async (): Promise<string | null> => {
    const { data } = await supabase
      .from("establishments")
      .select("id")
      .eq("slug", slug)
      .single();
    return data?.id ?? null;
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const estId = establishmentId ?? await fetchEstablishmentId();
      if (!estId) throw new Error("Establecimiento no encontrado");
      setEstablishmentId(estId);

      const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("establishment_id", estId)
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error("Error fetching membership plans:", err);
      const message = err instanceof Error ? err.message : "Error al cargar los planes";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (input: CreateMembershipPlanInput) => {
    try {
      const estId = establishmentId ?? await fetchEstablishmentId();
      if (!estId) throw new Error("Establecimiento no encontrado");
      setEstablishmentId(estId);

      const { data, error } = await supabase
        .from("membership_plans")
        .insert([{ ...input, establishment_id: estId }])
        .select()
        .single();

      if (error) throw error;
      setPlans((prev) => [...prev, data].sort((a, b) => a.price - b.price));
      return { data, error: null };
    } catch (err) {
      console.error("Error creating plan:", err);
      const message = err instanceof Error ? err.message : "Error al crear plan";
      return { data: null, error: message };
    }
  };

  const updatePlan = async (id: string, input: UpdateMembershipPlanInput) => {
    try {
      const { data, error } = await supabase
        .from("membership_plans")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setPlans((prev) =>
        prev
          .map((p) => (p.id === id ? data : p))
          .sort((a, b) => a.price - b.price)
      );
      return { data, error: null };
    } catch (err) {
      console.error("Error updating plan:", err);
      const message = err instanceof Error ? err.message : "Error al actualizar plan";
      return { data: null, error: message };
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from("membership_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error deleting plan:", err);
      const message = err instanceof Error ? err.message : "Error al eliminar plan";
      return { error: message };
    }
  };

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
