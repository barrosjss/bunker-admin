"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalFooter, Select, Input, Button } from "@/components/ui";
import { useMemberships, useMembershipPlans } from "@/hooks/useMemberships";
import { XCircle } from "lucide-react";
import { calculateEndDate, formatDate } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/formatting";
import type { MemberWithMembership } from "@/lib/supabase/types/database";

const editSchema = z.object({
  plan_id: z.string().min(1, "Selecciona un plan"),
  start_date: z.string().min(1, "Selecciona una fecha de inicio"),
  amount_paid: z.number().min(0),
  payment_method: z.enum(["cash", "card", "transfer"]),
  notes: z.string().optional(),
  status: z.enum(["active", "cancelled"]),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberWithMembership;
  onSuccess: () => void;
}

export function EditMembershipModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: EditMembershipModalProps) {
  const { updateMembership, cancelMembership } = useMemberships();
  const { plans } = useMembershipPlans();
  const membership = member.current_membership;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      plan_id: membership?.plan_id ?? "",
      start_date: membership?.start_date ?? format(new Date(), "yyyy-MM-dd"),
      amount_paid: membership?.amount_paid ?? undefined,
      payment_method: (membership?.payment_method as EditFormData["payment_method"]) ?? "cash",
      notes: membership?.notes ?? "",
      status: (membership?.status as EditFormData["status"]) ?? "active",
    },
  });

  useEffect(() => {
    if (isOpen && membership) {
      reset({
        plan_id: membership.plan_id ?? "",
        start_date: membership.start_date ?? format(new Date(), "yyyy-MM-dd"),
        amount_paid: membership.amount_paid ?? undefined,
        payment_method: (membership.payment_method as EditFormData["payment_method"]) ?? "cash",
        notes: membership.notes ?? "",
        status: (membership.status as EditFormData["status"]) ?? "active",
      });
    }
  }, [isOpen, membership, reset]);

  const selectedPlanId = watch("plan_id");
  const startDate = watch("start_date");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const endDate = selectedPlan
    ? format(calculateEndDate(startDate, selectedPlan.duration_days), "yyyy-MM-dd")
    : membership?.end_date ?? null;

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) setValue("amount_paid", plan.price);
  };

  const handleCancel = async () => {
    if (!membership?.id) return;
    setCancelling(true);
    try {
      await cancelMembership(membership.id);
      onSuccess();
      onClose();
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const handleSave = async (data: EditFormData) => {
    if (!membership?.id) return;
    const plan = plans.find((p) => p.id === data.plan_id);
    await updateMembership(membership.id, {
      plan_id: data.plan_id,
      start_date: data.start_date,
      end_date: plan
        ? format(calculateEndDate(data.start_date, plan.duration_days), "yyyy-MM-dd")
        : membership.end_date,
      amount_paid: data.amount_paid,
      payment_method: data.payment_method,
      notes: data.notes || null,
      status: data.status,
    });
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar membresía — ${member.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
        {/* Aviso */}
        <div className="flex gap-2.5 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Estás modificando la membresía activa. Los cambios se aplican de inmediato y
            reemplazan los datos actuales. No se genera un nuevo registro de pago.
          </p>
        </div>

        <Select
          label="Plan de membresía *"
          placeholder="Selecciona un plan"
          options={plans.map((p) => ({
            value: p.id,
            label: `${p.name} — ${formatCurrency(p.price)} (${p.duration_days} días)`,
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
              {endDate ? formatDate(endDate) : "—"}
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

        <Select
          label="Estado"
          options={[
            { value: "active", label: "Activa" },
            { value: "cancelled", label: "Cancelada" },
          ]}
          error={errors.status?.message}
          {...register("status")}
        />

        <Input
          label="Notas"
          placeholder="Observaciones adicionales..."
          {...register("notes")}
        />

        {/* Dar de baja */}
        {!confirmCancel ? (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex items-center gap-1.5 text-sm text-danger hover:underline"
          >
            <XCircle className="h-4 w-4" />
            Dar de baja la membresía
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger flex-1">¿Confirmas dar de baja? Se cancela de inmediato.</p>
            <Button type="button" variant="danger" size="sm" isLoading={cancelling} onClick={handleCancel}>
              Sí, dar de baja
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmCancel(false)}>
              No
            </Button>
          </div>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Guardar cambios
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
