"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { addDays, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useCurrentTrainer } from "./useCurrentTrainer";
import { getServiceStatus } from "@/lib/utils/serviceStatus";
import { calculateEndDate } from "@/lib/utils/dates";
import type {
  ServiceSubscriptionWithDetails,
  PersonalTrainingClient,
  TrainerService,
} from "@/lib/supabase/types/database";

export interface RegisterPaymentInput {
  memberId: string;
  service: TrainerService;
  /** Texto libre: qué está pagando. Lo escribe el entrenador en cada cobro. */
  concept: string;
  startDate: string;
  amountPaid: number;
  paymentMethod: "cash" | "card" | "transfer";
  notes?: string | null;
}

export interface ActivateIncludedInput {
  memberId: string;
  service: TrainerService;
  concept: string;
  /** El período copia el de la membresía del gym: mientras esa valga, esto vale. */
  startDate: string;
  endDate: string;
  notes?: string | null;
}

/**
 * La caja del entrenador: sus cobros de personalizado y de servicios sueltos.
 *
 * Cada fila de service_subscriptions es un período pagado. No se mutan las
 * filas viejas al renovar — el período vigente es simplemente el de end_date
 * más lejana, y el historial queda intacto para poder auditarlo.
 */
export function usePersonalTraining() {
  const { trainer, loading: trainerLoading } = useCurrentTrainer();
  const [subscriptions, setSubscriptions] = useState<ServiceSubscriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSubscriptions = useCallback(async () => {
    if (!trainer) {
      setSubscriptions([]);
      setLoading(trainerLoading);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("service_subscriptions")
      .select("*, trainer_services (*), members (*)")
      .eq("trainer_id", trainer.id)
      .order("start_date", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubscriptions((data as ServiceSubscriptionWithDetails[]) || []);
    setLoading(false);
  }, [supabase, trainer, trainerLoading]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  /** Un cliente por miembro, con el período de personalizado vigente. */
  const clients = useMemo<PersonalTrainingClient[]>(() => {
    const byMember = new Map<string, ServiceSubscriptionWithDetails[]>();

    for (const sub of subscriptions) {
      if (sub.trainer_services?.kind !== "personal_training") continue;
      if (!sub.members) continue;
      const list = byMember.get(sub.member_id) || [];
      list.push(sub);
      byMember.set(sub.member_id, list);
    }

    const result: PersonalTrainingClient[] = [];

    for (const subs of Array.from(byMember.values())) {
      // El período vigente es el que vence más tarde, no el creado más tarde:
      // así una renovación cargada con fecha retroactiva no "pisa" al actual.
      const sorted = [...subs].sort((a, b) => {
        const aEnd = a.end_date || a.start_date;
        const bEnd = b.end_date || b.start_date;
        return bEnd.localeCompare(aEnd);
      });

      result.push({
        ...sorted[0].members!,
        subscriptions: sorted,
        current_subscription: sorted[0],
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [subscriptions]);

  /**
   * Desde cuándo corre el próximo período.
   * Si el personalizado sigue vigente, arranca el día después del vencimiento
   * para que pagar antes de tiempo no le regale días al entrenador ni se los
   * quite al miembro. Si ya venció, arranca hoy.
   */
  const suggestedStartDate = useCallback(
    (memberId: string): string => {
      const client = clients.find((c) => c.id === memberId);
      const current = client?.current_subscription;
      const { status } = getServiceStatus(current);

      if (current?.end_date && (status === "active" || status === "expiring")) {
        return format(addDays(parseISO(current.end_date), 1), "yyyy-MM-dd");
      }
      return format(new Date(), "yyyy-MM-dd");
    },
    [clients]
  );

  const registerPayment = async (input: RegisterPaymentInput) => {
    if (!trainer) throw new Error("No hay entrenador autenticado");

    const { service } = input;
    const endDate =
      service.billing_type === "recurring" && service.duration_days
        ? format(calculateEndDate(input.startDate, service.duration_days), "yyyy-MM-dd")
        : null;

    const { data, error } = await supabase
      .from("service_subscriptions")
      .insert({
        establishment_id: trainer.establishmentId,
        member_id: input.memberId,
        service_id: service.id,
        trainer_id: trainer.id,
        concept: input.concept.trim() || service.name,
        billing_source: "paid",
        start_date: input.startDate,
        end_date: endDate,
        amount_paid: input.amountPaid,
        payment_method: input.paymentMethod,
        status: "active",
        notes: input.notes || null,
        created_by: trainer.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchSubscriptions();
    return data;
  };

  /**
   * Activa el personalizado sin cobro, porque el miembro ya lo tiene incluido
   * en lo que pagó por la membresía del gym. No entra a la caja del entrenador:
   * queda como período vigente con amount_paid en 0 y billing_source marcado.
   */
  const activateIncluded = async (input: ActivateIncludedInput) => {
    if (!trainer) throw new Error("No hay entrenador autenticado");

    const { data, error } = await supabase
      .from("service_subscriptions")
      .insert({
        establishment_id: trainer.establishmentId,
        member_id: input.memberId,
        service_id: input.service.id,
        trainer_id: trainer.id,
        concept: input.concept.trim() || input.service.name,
        billing_source: "included_in_membership",
        start_date: input.startDate,
        end_date: input.endDate,
        amount_paid: 0,
        payment_method: null,
        status: "active",
        notes: input.notes || null,
        created_by: trainer.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchSubscriptions();
    return data;
  };

  /** Da de baja el personalizado. El historial de cobros se conserva. */
  const cancelSubscription = async (id: string) => {
    const { error } = await supabase
      .from("service_subscriptions")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) throw error;
    await fetchSubscriptions();
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase.from("service_subscriptions").delete().eq("id", id);
    if (error) throw error;
    await fetchSubscriptions();
  };

  return {
    subscriptions,
    clients,
    loading: loading || trainerLoading,
    error,
    refetch: fetchSubscriptions,
    registerPayment,
    activateIncluded,
    cancelSubscription,
    deleteSubscription,
    suggestedStartDate,
  };
}
