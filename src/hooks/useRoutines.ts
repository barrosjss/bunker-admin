"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  RoutineTemplateInsert,
  RoutineTemplateWithExercises,
  RoutineTemplateExerciseInsert,
} from "@/lib/types/database";

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineTemplateWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("routine_templates")
      .select(`
        *,
        routine_template_exercises (
          *,
          exercises (*)
        )
      `)
      .order("name");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setRoutines(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const createRoutine = async (
    routineData: RoutineTemplateInsert,
    exercises?: RoutineTemplateExerciseInsert[]
  ) => {
    const { data: routine, error: routineError } = await supabase
      .from("routine_templates")
      .insert(routineData)
      .select()
      .single();

    if (routineError) throw routineError;

    if (exercises && exercises.length > 0) {
      const exercisesWithTemplateId = exercises.map((ex, index) => ({
        ...ex,
        template_id: routine.id,
        order_index: index,
      }));

      const { error: exercisesError } = await supabase
        .from("routine_template_exercises")
        .insert(exercisesWithTemplateId);

      if (exercisesError) throw exercisesError;
    }

    await fetchRoutines();
    return routine;
  };

  const deleteRoutine = async (id: string) => {
    const { error } = await supabase
      .from("routine_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await fetchRoutines();
  };

  return {
    routines,
    loading,
    error,
    refetch: fetchRoutines,
    createRoutine,
    deleteRoutine,
  };
}

export function useRoutine(id: string) {
  const [routine, setRoutine] = useState<RoutineTemplateWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRoutine = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("routine_templates")
      .select(`
        *,
        routine_template_exercises (
          *,
          exercises (*)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Sort exercises by order_index
    if (data.routine_template_exercises) {
      data.routine_template_exercises.sort(
        (a: { order_index: number | null }, b: { order_index: number | null }) =>
          (a.order_index || 0) - (b.order_index || 0)
      );
    }

    setRoutine(data);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine]);

  return { routine, loading, error, refetch: fetchRoutine };
}
