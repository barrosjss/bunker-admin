import { differenceInDays, parseISO, startOfDay } from "date-fns";
import type { MembershipWithPlan } from "@/lib/supabase/types/database";

export type MembershipStatusKey = "none" | "active" | "expiring" | "expired" | "frozen";

export interface MembershipStatus {
  status: MembershipStatusKey;
  label: string;
  variant: "default" | "success" | "warning" | "danger";
  diffDays: number | null;
}

// Fuente única de verdad: usada tanto en el dashboard como en la vista de
// Miembros para que "vencidos"/"por vencer"/"activos" cuenten exactamente lo
// mismo en toda la app. Un pase de 1 día que ya pasó no cuenta como "vencida"
// (mora) — simplemente se consumió u venció sin generar el mismo problema de
// cobro pendiente que una mensualidad vencida.
export function getMembershipStatus(
  membership?: Pick<MembershipWithPlan, "end_date" | "status"> & {
    membership_plans?: { duration_days: number } | null;
  } | null
): MembershipStatus {
  if (!membership?.end_date) {
    return { status: "none", label: "Sin membresía", variant: "default", diffDays: null };
  }
  if (membership.status === "frozen") {
    return { status: "frozen", label: "Congelada", variant: "default", diffDays: null };
  }

  const today = startOfDay(new Date());
  const endDate = startOfDay(parseISO(membership.end_date));
  const diffDays = differenceInDays(endDate, today);

  const isDayPass = membership.membership_plans?.duration_days === 1;

  if (diffDays < 0) {
    if (isDayPass) return { status: "none", label: "Pasadía consumido", variant: "default", diffDays };
    return { status: "expired", label: "Vencida", variant: "danger", diffDays };
  }

  if (diffDays <= 7) {
    if (isDayPass) return { status: "active", label: "Pasadía Activo", variant: "success", diffDays };
    return { status: "expiring", label: `Vence en ${diffDays}d`, variant: "warning", diffDays };
  }

  return { status: "active", label: "Activa", variant: "success", diffDays };
}
