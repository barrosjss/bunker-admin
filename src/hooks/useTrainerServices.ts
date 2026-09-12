"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentTrainer } from "./useCurrentTrainer";
import type {
  TrainerService,
  TrainerServiceInsert,
  TrainerServiceUpdate,
} from "@/lib/supabase/types/database";

/**
 * El catálogo de servicios del entrenador autenticado.
 *
 * La migración 017 siembra los dos base (personalizado y evaluación) con
 * precio 0 para cada entrenador existente. Si por lo que sea faltan —
 * entrenador creado después de la migración — `ensureBaseServices` los crea.
 */
export function useTrainerServices() {
  const { trainer, loading: trainerLoading } = useCurrentTrainer();
  const [services, setServices] = useState<TrainerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // El alta de los servicios base se intenta una sola vez por sesión. Sin este
  // cerrojo, un insert que falla vuelve a dispararse en cada render: fetchServices
  // togglea `loading`, eso recrea el useCallback y el efecto que lo llama se
  // vuelve a ejecutar, en bucle.
  const ensureAttempted = useRef(false);

  const fetchServices = useCallback(async () => {
    if (!trainer) {
      setServices([]);
      setLoading(trainerLoading);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("trainer_services")
      .select("*")
      .eq("trainer_id", trainer.id)
      .order("kind")
      .order("name");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setServices(data || []);
    setLoading(false);
  }, [supabase, trainer, trainerLoading]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const personalTrainingService = useMemo(
    () => services.find((s) => s.kind === "personal_training") || null,
    [services]
  );

  const evaluationService = useMemo(
    () => services.find((s) => s.kind === "evaluation") || null,
    [services]
  );

  const createService = async (service: Omit<TrainerServiceInsert, "establishment_id" | "trainer_id">) => {
    if (!trainer) throw new Error("No hay entrenador autenticado");

    const { data, error } = await supabase
      .from("trainer_services")
      .insert({
        ...service,
        establishment_id: trainer.establishmentId,
        trainer_id: trainer.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchServices();
    return data;
  };

  const updateService = async (id: string, service: TrainerServiceUpdate) => {
    const { data, error } = await supabase
      .from("trainer_services")
      .update(service)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    await fetchServices();
    return data;
  };

  /**
   * Crea los servicios base que falten — red de seguridad para un entrenador
   * dado de alta después de la migración 017. Corre una sola vez por sesión y
   * se abstiene si la última lectura falló (tabla inexistente, RLS, etc.).
   */
  const ensureBaseServices = useCallback(async () => {
    if (!trainer || loading || error || ensureAttempted.current) return;

    const missing: TrainerServiceInsert[] = [];

    if (!services.some((s) => s.kind === "personal_training")) {
      missing.push({
        establishment_id: trainer.establishmentId,
        trainer_id: trainer.id,
        name: "Entrenamiento personalizado",
        description: "Acompañamiento mensual del entrenador, aparte de la membresía del gym.",
        price: 0,
        billing_type: "recurring",
        duration_days: 30,
        kind: "personal_training",
      });
    }

    if (!services.some((s) => s.kind === "evaluation")) {
      missing.push({
        establishment_id: trainer.establishmentId,
        trainer_id: trainer.id,
        name: "Evaluación física",
        description: "Medición de pliegues cutáneos, peso y estatura. Incluida para personalizados.",
        price: 0,
        billing_type: "one_off",
        duration_days: null,
        kind: "evaluation",
        included_with_personal_training: true,
      });
    }

    if (missing.length === 0) return;

    // Se marca antes del await: si falla, no se reintenta en el render siguiente.
    ensureAttempted.current = true;

    const { error: insertError } = await supabase.from("trainer_services").insert(missing);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    await fetchServices();
  }, [trainer, services, loading, error, supabase, fetchServices]);

  return {
    services,
    personalTrainingService,
    evaluationService,
    loading: loading || trainerLoading,
    error,
    refetch: fetchServices,
    createService,
    updateService,
    ensureBaseServices,
  };
}
