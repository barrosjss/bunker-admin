"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrainingSessionInsert,
  TrainingSessionWithDetails,
  SessionExerciseInsert,
} from "@/lib/types/database";
import { format } from "date-fns";

export function useTrainingSessions(date?: string) {
  const [sessions, setSessions] = useState<TrainingSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("training_sessions")
      .select(`
        *,
        members (*),
        staff (*),
        session_exercises (
          *,
          exercises (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (date) {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSessions(data);
    setLoading(false);
  }, [supabase, date]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (
    sessionData: TrainingSessionInsert,
    exercises?: SessionExerciseInsert[]
  ) => {
    const { data: session, error: sessionError } = await supabase
      .from("training_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) throw sessionError;

    if (exercises && exercises.length > 0) {
      const exercisesWithSessionId = exercises.map((ex) => ({
        ...ex,
        session_id: session.id,
      }));

      const { error: exercisesError } = await supabase
        .from("session_exercises")
        .insert(exercisesWithSessionId);

      if (exercisesError) throw exercisesError;
    }

    await fetchSessions();
    return session;
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
  };
}

export function useTodaySessions() {
  const today = format(new Date(), "yyyy-MM-dd");
  return useTrainingSessions(today);
}

export function useMemberSessions(memberId: string) {
  const [sessions, setSessions] = useState<TrainingSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSessions = useCallback(async () => {
    if (!memberId) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("training_sessions")
      .select(`
        *,
        members (*),
        staff (*),
        session_exercises (
          *,
          exercises (*)
        )
      `)
      .eq("member_id", memberId)
      .order("date", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSessions(data);
    setLoading(false);
  }, [memberId, supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}
