"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Modal, ModalFooter, Select, Input, Button } from "@/components/ui";
import { useMemberships, useMembershipPlans } from "@/hooks/useMemberships";
import { useMembers } from "@/hooks/useMembers";
import { calculateEndDate, formatDate } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/formatting";
import { MembershipInsert } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/client";
import type { DiscountCoupon } from "@/lib/supabase/types/database";

const paymentSchema = z.object({
  member_id: z.string().min(1, "Selecciona un miembro"),
  plan_id: z.string().min(1, "Selecciona un plan"),
  start_date: z.string().min(1, "Selecciona una fecha de inicio"),
  amount_paid: z.number().min(0, "El monto debe ser mayor o igual a 0"),
  payment_method: z.enum(["cash", "card", "transfer"]),
  notes: z.string().optional(),
});

type PaymentFormData = {
  member_id: string;
  plan_id: string;
  start_date: string;
  amount_paid: number;
  payment_method: "cash" | "card" | "transfer";
  notes?: string;
};

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
  preselectedPlanId?: string;
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  preselectedMemberId,
  preselectedPlanId,
  onSuccess,
}: PaymentModalProps) {
  const { createMembership } = useMemberships();
  const { plans } = useMembershipPlans();
  const { members } = useMembers();
  const supabase = createClient();

  // Coupon state
  const [couponSectionOpen, setCouponSectionOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      member_id: preselectedMemberId || "",
      plan_id: preselectedPlanId || "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      amount_paid: undefined,
      payment_method: "cash",
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (preselectedMemberId) setValue("member_id", preselectedMemberId);
    if (preselectedPlanId) {
      setValue("plan_id", preselectedPlanId);
      const plan = plans.find((p) => p.id === preselectedPlanId);
      if (plan) setValue("amount_paid", plan.price);
    }
  }, [preselectedMemberId, preselectedPlanId, isOpen, plans, setValue]);

  const selectedPlanId = watch("plan_id");
  const startDate = watch("start_date");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const endDate = selectedPlan
    ? format(
        calculateEndDate(startDate, selectedPlan.duration_days),
        "yyyy-MM-dd"
      )
    : null;

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      // If coupon applied, recalculate with new plan price
      if (appliedCoupon) {
        const discounted = calcDiscountedPrice(plan.price, appliedCoupon);
        setValue("amount_paid", discounted);
      } else {
        setValue("amount_paid", plan.price);
      }
    }
  };

  const calcDiscountedPrice = (basePrice: number, coupon: DiscountCoupon): number => {
    if (coupon.discount_type === "percentage") {
      return Math.round(basePrice * (1 - coupon.discount_value / 100) * 100) / 100;
    } else {
      return Math.max(0, basePrice - coupon.discount_value);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setCouponLoading(true);

    try {
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setCouponError("Cupón no encontrado o inactivo.");
        setCouponLoading(false);
        return;
      }

      // Validate expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError("Este cupón ha vencido.");
        setCouponLoading(false);
        return;
      }

      // Validate max uses
      if (data.max_uses !== null && data.used_count >= data.max_uses) {
        setCouponError("Este cupón ha alcanzado su límite de usos.");
        setCouponLoading(false);
        return;
      }

      // Apply coupon
      setAppliedCoupon(data);
      setCouponError(null);

      const currentPlan = plans.find((p) => p.id === selectedPlanId);
      if (currentPlan) {
        const discounted = calcDiscountedPrice(currentPlan.price, data);
        setValue("amount_paid", discounted);
      }
    } catch {
      setCouponError("Error al verificar el cupón.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    const currentPlan = plans.find((p) => p.id === selectedPlanId);
    if (currentPlan) {
      setValue("amount_paid", currentPlan.price);
    }
  };

  const resetCouponState = () => {
    setCouponSectionOpen(false);
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponLoading(false);
  };

  const handleCreateMembership = async (data: PaymentFormData) => {
    try {
      const plan = plans.find((p) => p.id === data.plan_id);
      if (!plan) return;

      const membershipData: MembershipInsert = {
        member_id: data.member_id,
        plan_id: data.plan_id,
        start_date: data.start_date,
        end_date: format(
          calculateEndDate(data.start_date, plan.duration_days),
          "yyyy-MM-dd"
        ),
        amount_paid: data.amount_paid,
        payment_method: data.payment_method,
        notes: data.notes || null,
        status: "active",
      };

      await createMembership(membershipData);
      reset();
      resetCouponState();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error creating membership:", err);
    }
  };

  const discountLabel = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? `${appliedCoupon.discount_value}% de descuento`
      : `${formatCurrency(appliedCoupon.discount_value)} de descuento`
    : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        resetCouponState();
        onClose();
      }}
      title="Registrar pago de membresía"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleCreateMembership)} className="space-y-4">
        <Select
          label="Miembro *"
          placeholder="Selecciona un miembro"
          options={members.map((m) => ({
            value: m.id,
            label: m.name,
          }))}
          error={errors.member_id?.message}
          {...register("member_id")}
        />

        <Select
          label="Plan de membresía *"
          placeholder="Selecciona un plan"
          options={plans.map((p) => ({
            value: p.id,
            label: `${p.name} - ${formatCurrency(p.price)} (${p.duration_days} días)`,
          }))}
          error={errors.plan_id?.message}
          {...register("plan_id", {
            onChange: (e) => handlePlanChange(e.target.value),
          })}
        />

        {/* ─── Coupon Section ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-surface-elevated overflow-hidden">
          <button
            type="button"
            onClick={() => setCouponSectionOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>Aplicar cupón</span>
            {couponSectionOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {couponSectionOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-border">
              {appliedCoupon ? (
                <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
                  <div>
                    <p className="text-sm font-semibold text-success">
                      Cupón aplicado: <span className="font-mono">{appliedCoupon.code}</span>
                    </p>
                    <p className="text-xs text-success/80">{appliedCoupon.name} — {discountLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="shrink-0 text-success hover:text-danger transition-colors"
                    title="Quitar cupón"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="CODIGO2024"
                      className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary uppercase font-mono text-sm tracking-widest"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Aplicar"
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-sm text-danger">{couponError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* ─── End Coupon Section ──────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de inicio *"
            error={errors.start_date?.message}
            {...register("start_date")}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Fecha de vencimiento
            </label>
            <div className="px-4 py-3 bg-surface-elevated border border-border rounded-lg text-text-secondary">
              {endDate ? formatDate(endDate) : "Selecciona un plan"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Monto pagado *"
            placeholder="0"
            step="0.01"
            error={errors.amount_paid?.message}
            {...register("amount_paid", { valueAsNumber: true })}
          />
          <Select
            label="Método de pago *"
            options={[
              { value: "cash", label: "Efectivo" },
              { value: "card", label: "Tarjeta" },
              { value: "transfer", label: "Transferencia" },
            ]}
            error={errors.payment_method?.message}
            {...register("payment_method")}
          />
        </div>

        <Input
          label="Notas"
          placeholder="Observaciones adicionales..."
          {...register("notes")}
        />

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              resetCouponState();
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Registrar pago
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
