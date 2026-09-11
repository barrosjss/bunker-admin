"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { CalendarClock, Info } from "lucide-react";
import { Modal, ModalFooter, Select, Input, Textarea, Button } from "@/components/ui";
import { calculateEndDate, formatDate } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/formatting";
import type { Member, TrainerService } from "@/lib/supabase/types/database";
import type { RegisterPaymentInput } from "@/hooks/usePersonalTraining";

interface PaymentFormData {
  member_id: string;
  start_date: string;
  amount_paid: number | string;
  payment_method: "cash" | "card" | "transfer";
  notes: string;
}

export interface ServicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** El servicio que se está cobrando. Define precio, duración y vencimiento. */
  service: TrainerService | null;
  /** Miembros elegibles. La página filtra según el caso (alta vs. renovación). */
  members: Member[];
  preselectedMemberId?: string;
  /** Fecha de inicio sugerida para el miembro elegido. */
  suggestedStartDate?: (memberId: string) => string;
  title?: string;
  submitLabel?: string;
  onSubmit: (input: RegisterPaymentInput) => Promise<unknown>;
  onSuccess?: () => void;
}

export function ServicePaymentModal({
  isOpen,
  onClose,
  service,
  members,
  preselectedMemberId,
  suggestedStartDate,
  title,
  submitLabel = "Registrar cobro",
  onSubmit,
  onSuccess,
}: ServicePaymentModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    defaultValues: {
      member_id: preselectedMemberId || "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      amount_paid: "",
      payment_method: "cash",
      notes: "",
    },
  });

  const memberId = watch("member_id");
  const startDate = watch("start_date");

  // Al abrir, precargar precio del servicio y miembro preseleccionado.
  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    reset({
      member_id: preselectedMemberId || "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      amount_paid: service?.price ?? "",
      payment_method: "cash",
      notes: "",
    });
  }, [isOpen, preselectedMemberId, service, reset]);

  // Al elegir miembro, saltar la fecha de inicio al día siguiente de su
  // vencimiento actual, para que renovar antes de tiempo no le coma días.
  useEffect(() => {
    if (!isOpen || !memberId || !suggestedStartDate) return;
    setValue("start_date", suggestedStartDate(memberId));
  }, [isOpen, memberId, suggestedStartDate, setValue]);

  const memberOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: m.name })),
    [members]
  );

  const endDate = useMemo(() => {
    if (!service || service.billing_type !== "recurring" || !service.duration_days) return null;
    if (!startDate) return null;
    try {
      return calculateEndDate(startDate, service.duration_days);
    } catch {
      return null;
    }
  }, [service, startDate]);

  const submit = handleSubmit(async (data) => {
    if (!service) return;
    setSubmitError(null);

    try {
      await onSubmit({
        memberId: data.member_id,
        service,
        startDate: data.start_date,
        amountPaid: Number(data.amount_paid) || 0,
        paymentMethod: data.payment_method,
        notes: data.notes.trim() || null,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo registrar el cobro");
    }
  });

  const priceHint =
    service && service.price > 0
      ? `Precio del servicio: ${formatCurrency(service.price)}`
      : "Este servicio todavía no tiene precio configurado.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (service ? `Cobrar ${service.name.toLowerCase()}` : "Cobrar servicio")}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {!preselectedMemberId && (
          <Select
            label="Miembro"
            placeholder="Selecciona un miembro"
            options={memberOptions}
            error={errors.member_id?.message}
            {...register("member_id", { required: "Selecciona un miembro" })}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Inicio del período"
            error={errors.start_date?.message}
            {...register("start_date", { required: "Indica la fecha de inicio" })}
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            label="Monto cobrado"
            placeholder="0"
            hint={priceHint}
            error={errors.amount_paid?.message}
            {...register("amount_paid", {
              required: "Indica el monto",
              min: { value: 0, message: "El monto no puede ser negativo" },
            })}
          />
        </div>

        {endDate && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-elevated border border-border px-4 py-3">
            <CalendarClock className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-sm text-text-secondary">
              Vence el{" "}
              <span className="font-medium text-text-primary">
                {formatDate(format(endDate, "yyyy-MM-dd"), "d 'de' MMMM yyyy")}
              </span>{" "}
              ({service?.duration_days} días)
            </p>
          </div>
        )}

        {service?.billing_type === "one_off" && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-elevated border border-border px-4 py-3">
            <Info className="h-5 w-5 text-text-secondary flex-shrink-0" />
            <p className="text-sm text-text-secondary">Pago único — no vence.</p>
          </div>
        )}

        <Select
          label="Método de pago"
          options={[
            { value: "cash", label: "Efectivo" },
            { value: "card", label: "Tarjeta" },
            { value: "transfer", label: "Transferencia" },
          ]}
          {...register("payment_method")}
        />

        <Textarea
          label="Notas (opcional)"
          placeholder="Ej. abonó la mitad, queda pendiente el resto"
          className="min-h-[80px]"
          {...register("notes")}
        />

        {submitError && (
          <p className="text-sm text-danger" role="alert">
            {submitError}
          </p>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!service}>
            {submitLabel}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/** Fecha legible del próximo vencimiento, para mostrar fuera del modal. */
export function formatPeriodEnd(endDate: string | null): string {
  if (!endDate) return "Sin vencimiento";
  return formatDate(parseISO(endDate), "d MMM yyyy");
}
