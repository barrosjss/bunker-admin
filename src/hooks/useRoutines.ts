"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RoutineTemplate, RoutineTemplateExercise, Exercise } from "@/lib/supabase/types/database";

export type RoutineWithExercises = RoutineTemplate & {
  routine_template_exercises: (RoutineTemplateExercise & {
    exercises: Exercise | null;
  })[];
};

export interface PlanExercise {
  id: string;
  exercise_id: string | null;
  sets: number | null;
  reps: string | null;
  notes: string | null;
  order_index: number | null;
  exercises: { id: string; name: string; muscle_group: string | null } | null;
}

export interface PlanDay {
  id: string;
  name: string;
  routine_template_exercises: PlanExercise[];
}

export interface RoutinePlan {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  routine_templates: PlanDay[];
}

export function usePartnerRoutinePlans(memberId: string) {
  const [plans, setPlans] = useState<RoutinePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPlans = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: dbErr } = await (supabase as any)
      .from("routine_plans")
      .select(`
        id, name, description, created_at,
        routine_templates (
          id, name,
          routine_template_exercises (
            id, exercise_id, sets, reps, notes, order_index,
            exercises ( id, name, muscle_group )
          )
        )
      `)
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (dbErr) { setError(dbErr.message); setLoading(false); return; }
    setPlans((data ?? []) as RoutinePlan[]);
    setLoading(false);
  }, [memberId, supabase]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  return { plans, loading, error, refetch: fetchPlans };
}

export function usePartnerRoutines(memberId: string) {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRoutines = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("routine_templates")
      .select(`*, routine_template_exercises (*, exercises (*))`)
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) { setError(error.message); setLoading(false); return; }
    setRoutines(data as RoutineWithExercises[]);
    setLoading(false);
  }, [memberId, supabase]);

  useEffect(() => { fetchRoutines(); }, [fetchRoutines]);

  const getLastExerciseStats = async (exerciseId: string) => {
    if (!memberId) return null;
    const { data, error } = await supabase.rpc("get_last_exercise_stats", {
      p_member_id: memberId,
      p_exercise_id: exerciseId,
    });
    if (error || !data || data.length === 0) return null;
    return data[0] as { last_weight: string; last_unit: string; last_effective_reps: string };
  };

  return { routines, loading, error, refetch: fetchRoutines, getLastExerciseStats };
}
