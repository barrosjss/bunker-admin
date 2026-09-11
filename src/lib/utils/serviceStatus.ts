import { differenceInDays, parseISO, startOfDay } from "date-fns";
import type { ServiceSubscription } from "@/lib/supabase/types/database";

export type ServiceStatusKey = "none" | "active" | "expiring" | "expired" | "frozen";

export interface ServiceStatus {
  status: ServiceStatusKey;
  label: string;
  variant: "default" | "success" | "warning" | "danger";
  /** Días hasta el vencimiento. Negativo = días de mora. */
  diffDays: number | null;
}

/** Mismo umbral que las membresías del gym, para que "por vencer" signifique lo mismo. */
export const EXPIRING_THRESHOLD_DAYS = 7;

/**
 * Estado de cobro de un servicio del entrenador.
 *
 * Espeja getMembershipStatus() a propósito: el entrenador ya lee "Vence en 3d"
 * en la ficha del miembro, y que el personalizado use otro vocabulario para lo
 * mismo sería una trampa. La diferencia es que los pagos únicos (evaluación
 * suelta) no vencen — no tienen end_date y no generan mora.
 */
export function getServiceStatus(
  subscription?: Pick<ServiceSubscription, "end_date" | "status"> | null
): ServiceStatus {
  if (!subscription) {
    return { status: "none", label: "Sin personalizado", variant: "default", diffDays: null };
  }

  if (subscription.status === "cancelled") {
    return { status: "none", label: "Cancelado", variant: "default", diffDays: null };
  }

  if (subscription.status === "frozen") {
    return { status: "frozen", label: "Congelado", variant: "default", diffDays: null };
  }

  // Pago único: se cobró y listo, no vence.
  if (!subscription.end_date) {
    return { status: "active", label: "Pagado", variant: "success", diffDays: null };
  }

  const today = startOfDay(new Date());
  const endDate = startOfDay(parseISO(subscription.end_date));
  const diffDays = differenceInDays(endDate, today);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      status: "expired",
      label: days === 1 ? "Vencido hace 1d" : `Vencido hace ${days}d`,
      variant: "danger",
      diffDays,
    };
  }

  if (diffDays <= EXPIRING_THRESHOLD_DAYS) {
    return {
      status: "expiring",
      label: diffDays === 0 ? "Vence hoy" : `Vence en ${diffDays}d`,
      variant: "warning",
      diffDays,
    };
  }

  return { status: "active", label: "Al día", variant: "success", diffDays };
}

/** ¿Este miembro es personalizado hoy? Determina si la evaluación va incluida. */
export function isActivePersonalTraining(
  subscription?: Pick<ServiceSubscription, "end_date" | "status"> | null
): boolean {
  const { status } = getServiceStatus(subscription);
  return status === "active" || status === "expiring" || status === "frozen";
}
