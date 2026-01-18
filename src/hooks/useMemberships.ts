"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MembershipInsert,
  MembershipPlan,
  MembershipWithPlan,
} from "@/lib/types/database";
import { addDays, format } from "date-fns";

export function useMemberships() {
  const [memberships, setMemberships] = useState<MembershipWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("memberships")
      .select(`
        *,
        membership_plans (*),
        members (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMemberships(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const createMembership = async (membershipData: MembershipInsert) => {
    const { data, error } = await supabase
      .from("memberships")
      .insert(membershipData)
      .select()
      .single();

    if (error) throw error;
    await fetchMemberships();
    return data;
  };

  return {
    memberships,
    loading,
    error,
    refetch: fetchMemberships,
    createMembership,
  };
}

export function useMembershipPlans() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("price");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setPlans(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async (planData: Omit<MembershipPlan, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("membership_plans")
      .insert(planData)
      .select()
      .single();

    if (error) throw error;
    await fetchPlans();
    return data;
  };

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    createPlan,
  };
}

export function useExpiringMemberships(daysThreshold: number = 7) {
  const [memberships, setMemberships] = useState<MembershipWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchExpiring = useCallback(async () => {
    setLoading(true);
    setError(null);

    const today = format(new Date(), "yyyy-MM-dd");
    const thresholdDate = format(addDays(new Date(), daysThreshold), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("memberships")
      .select(`
        *,
        membership_plans (*),
        members (*)
      `)
      .eq("status", "active")
      .gte("end_date", today)
      .lte("end_date", thresholdDate)
      .order("end_date");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMemberships(data);
    setLoading(false);
  }, [supabase, daysThreshold]);

  useEffect(() => {
    fetchExpiring();
  }, [fetchExpiring]);

  return { memberships, loading, error, refetch: fetchExpiring };
}
