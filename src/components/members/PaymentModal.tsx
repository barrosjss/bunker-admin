"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Modal, ModalFooter, Select, Input, Button } from "@/components/ui";
import { useMemberships, useMembershipPlans } from "@/hooks/useMemberships";
import { useMembers } from "@/hooks/useMembers";
import { calculateEndDate, formatDate } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/formatting";
import { MembershipInsert } from "@/lib/types/database";

const paymentSchema = z.object({
  member_id: z.string().min(1, "Selecciona un miembro"),
  plan_id: z.string().min(1, "Selecciona un plan"),
  start_date: z.string().min(1, "Selecciona una fecha de inicio"),
  amount_paid: z.number().min(0, "El monto debe ser mayor a 0"),
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
}

export function PaymentModal({
  isOpen,
  onClose,
  preselectedMemberId,
}: PaymentModalProps) {
  const { createMembership } = useMemberships();
  const { plans } = useMembershipPlans();
  const { members } = useMembers();

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
      plan_id: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      amount_paid: 0,
      payment_method: "cash",
      notes: "",
    },
  });

  useEffect(() => {
    if (preselectedMemberId && isOpen) {
      setValue("member_id", preselectedMemberId);
    }
  }, [preselectedMemberId, isOpen, setValue]);

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
      setValue("amount_paid", plan.price);
    }
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
      onClose();
    } catch (err) {
      console.error("Error creating membership:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
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
            step="0.01"
            error={errors.amount_paid?.message}
            {...register("amount_paid")}
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
