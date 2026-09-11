"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentTrainer } from "./useCurrentTrainer";
import type {
  PhysicalEvaluation,
  PhysicalEvaluationInsert,
  PhysicalEvaluationUpdate,
  PhysicalEvaluationWithMember,
} from "@/lib/supabase/types/database";

const WITH_MEMBER = "*, members (*)";

/** Todas las evaluaciones del gym, de la más reciente a la más vieja. */
export function usePhysicalEvaluations() {
  const { trainer, loading: trainerLoading } = useCurrentTrainer();
  const [evaluations, setEvaluations] = useState<PhysicalEvaluationWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("physical_evaluations")
      .select(WITH_MEMBER)
      .order("evaluated_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setEvaluations((data as PhysicalEvaluationWithMember[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const createEvaluation = async (
    evaluation: Omit<PhysicalEvaluationInsert, "establishment_id" | "trainer_id" | "created_by">
  ) => {
    if (!trainer) throw new Error("No hay entrenador autenticado");

    const { data, error } = await supabase
      .from("physical_evaluations")
      .insert({
        ...evaluation,
        establishment_id: trainer.establishmentId,
        trainer_id: trainer.id,
        created_by: trainer.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchEvaluations();
    return data;
  };

  const updateEvaluation = async (id: string, evaluation: PhysicalEvaluationUpdate) => {
    const { data, error } = await supabase
      .from("physical_evaluations")
      .update(evaluation)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    await fetchEvaluations();
    return data;
  };

  const deleteEvaluation = async (id: string) => {
    const { error } = await supabase.from("physical_evaluations").delete().eq("id", id);
    if (error) throw error;
    await fetchEvaluations();
  };

  return {
    evaluations,
    loading: loading || trainerLoading,
    error,
    refetch: fetchEvaluations,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  };
}

/** Historial de un miembro, de la más reciente a la más vieja. */
export function useMemberEvaluations(memberId?: string) {
  const [evaluations, setEvaluations] = useState<PhysicalEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchEvaluations = useCallback(async () => {
    if (!memberId) {
      setEvaluations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from("physical_evaluations")
      .select("*")
      .eq("member_id", memberId)
      .order("evaluated_on", { ascending: false })
      .order("created_at", { ascending: false });

    setEvaluations(data || []);
    setLoading(false);
  }, [supabase, memberId]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  return { evaluations, loading, refetch: fetchEvaluations };
}

/**
 * Una evaluación y la inmediatamente anterior del mismo miembro, para poder
 * mostrar la evolución sin que la página tenga que ir a buscarla por su cuenta.
 */
export function usePhysicalEvaluation(id?: string) {
  const [evaluation, setEvaluation] = useState<PhysicalEvaluationWithMember | null>(null);
  const [previous, setPrevious] = useState<PhysicalEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchEvaluation = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("physical_evaluations")
      .select(WITH_MEMBER)
      .eq("id", id)
      .single();

    if (error || !data) {
      setError(error?.message || "Evaluación no encontrada");
      setLoading(false);
      return;
    }

    const current = data as PhysicalEvaluationWithMember;
    setEvaluation(current);

    // La anterior es la evaluación previa por fecha; ante empate de fecha,
    // desempata por created_at para que dos del mismo día no se confundan.
    const { data: prior } = await supabase
      .from("physical_evaluations")
      .select("*")
      .eq("member_id", current.member_id)
      .or(
        `evaluated_on.lt.${current.evaluated_on},and(evaluated_on.eq.${current.evaluated_on},created_at.lt.${current.created_at})`
      )
      .order("evaluated_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);

    setPrevious(prior?.[0] || null);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  return { evaluation, previous, loading, error, refetch: fetchEvaluation };
}
