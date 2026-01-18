"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Exercise, ExerciseInsert, ExerciseUpdate } from "@/lib/types/database";

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setExercises(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const createExercise = async (exerciseData: ExerciseInsert) => {
    const { data, error } = await supabase
      .from("exercises")
      .insert(exerciseData)
      .select()
      .single();

    if (error) throw error;
    await fetchExercises();
    return data;
  };

  const updateExercise = async (id: string, exerciseData: ExerciseUpdate) => {
    const { data, error } = await supabase
      .from("exercises")
      .update(exerciseData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    await fetchExercises();
    return data;
  };

  const deleteExercise = async (id: string) => {
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) throw error;
    await fetchExercises();
  };

  return {
    exercises,
    loading,
    error,
    refetch: fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}

export function useExercisesByMuscleGroup() {
  const { exercises, loading, error, refetch } = useExercises();

  const groupedExercises = exercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group || "Sin categoría";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return { groupedExercises, loading, error, refetch };
}
