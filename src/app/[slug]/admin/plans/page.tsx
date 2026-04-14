"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tag, Plus, Pencil, Trash2, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";
import {
  Button, Input, Modal, ModalFooter, EmptyState, Spinner, Badge,
} from "@/components/ui";
import { useMembershipPlans } from "@/hooks/useMembershipPlans";
import { formatCurrency } from "@/lib/utils/formatting";
import type { MembershipPlan } from "@/hooks/useMembershipPlans";

// ─── Duraciones predefinidas ────────────────────────────────────────────────
const DURATION_PRESETS = [
  { label: "1 día", days: 1 },
  { label: "15 días", days: 15 },
  { label: "1 mes", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 año", days: 365 },
] as const;

function durationLabel(days: number): string {
  const preset = DURATION_PRESETS.find((p) => p.days === days);
  if (preset) return preset.label;
  if (days === 1) return "1 día";
  if (days < 30) return `${days} días`;
  if (days < 60) return `${Math.round(days / 30)} mes`;
  if (days < 365) return `${Math.round(days / 30)} meses`;
  return `${Math.round(days / 365)} año${Math.round(days / 365) > 1 ? "s" : ""}`;
}

// ─── Schema del formulario ───────────────────────────────────────────────────
const planSchema = z.object({
  name: z.string().min(1, "El título es requerido").max(80),
  description: z.string().max(200).optional(),
  duration_type: z.enum(["1", "15", "30", "90", "180", "365", "custom"]),
  custom_days: z.number().int().min(1).max(3650).optional(),
  price: z.number().min(0, "El precio debe ser positivo"),
  is_active: z.boolean(),
});

type PlanFormData = z.infer<typeof planSchema>;

function getDurationDays(data: PlanFormData): number {
  if (data.duration_type === "custom") return data.custom_days ?? 1;
  return parseInt(data.duration_type, 10);
}

// ─── Modal de plan ───────────────────────────────────────────────────────────
interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: MembershipPlan | null;
  onSave: (data: PlanFormData) => Promise<void>;
}

function PlanModal({ isOpen, onClose, plan, onSave }: PlanModalProps) {
  const isPreset = plan ? DURATION_PRESETS.some((p) => p.days === plan.duration_days) : false;
  const defaultDurationType = plan
    ? (isPreset ? String(plan.duration_days) as PlanFormData["duration_type"] : "custom")
    : "30";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      duration_type: defaultDurationType,
      custom_days: !isPreset && plan ? plan.duration_days : undefined,
      price: plan?.price ?? 0,
      is_active: plan?.is_active ?? true,
    },
  });

  const durationType = watch("duration_type");

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={plan ? "Editar plan" : "Nuevo plan"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <Input
          label="Título *"
          placeholder="Ej. Mensualidad, Plan Anual..."
          error={errors.name?.message}
          {...register("name")}
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Descripción
          </label>
          <textarea
            className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base"
            rows={2}
            placeholder="Beneficios o detalles del plan..."
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger">{errors.description.message}</p>
          )}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Duración *
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setValue("duration_type", String(p.days) as PlanFormData["duration_type"])}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                  durationType === String(p.days)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-elevated border-border text-text-secondary hover:border-primary/50"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setValue("duration_type", "custom")}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all col-span-3 ${
                durationType === "custom"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-elevated border-border text-text-secondary hover:border-primary/50"
              }`}
            >
              Personalizado
            </button>
          </div>
          {durationType === "custom" && (
            <Input
              type="number"
              placeholder="Número de días"
              min={1}
              max={3650}
              error={errors.custom_days?.message}
              {...register("custom_days", { valueAsNumber: true })}
            />
          )}
        </div>

        <Input
          type="number"
          label="Precio *"
          placeholder="0"
          step="0.01"
          min={0}
          leftIcon={<DollarSign className="h-4 w-4" />}
          error={errors.price?.message}
          {...register("price", { valueAsNumber: true })}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={watch("is_active")}
            onClick={() => setValue("is_active", !watch("is_active"))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              watch("is_active") ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                watch("is_active") ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-text-primary">Plan activo</span>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {plan ? "Guardar cambios" : "Crear plan"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Modal de confirmación de eliminación ────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  plan: MembershipPlan | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeleteModal({ isOpen, plan, onConfirm, onClose }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  if (!plan) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar plan" size="sm">
      <p className="text-text-secondary text-sm mb-4">
        ¿Eliminar el plan <strong className="text-text-primary">&ldquo;{plan.name}&rdquo;</strong>? Esta acción no se puede deshacer.
      </p>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button
          variant="danger"
          isLoading={loading}
          onClick={async () => {
            setLoading(true);
            await onConfirm();
            setLoading(false);
          }}
        >
          Eliminar
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function AdminPlansPage() {
  const { plans, loading, error, createPlan, updatePlan, deletePlan } = useMembershipPlans();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSave = async (data: PlanFormData) => {
    setActionError(null);
    const duration_days = getDurationDays(data);
    const payload = {
      name: data.name,
      description: data.description || null,
      duration_days,
      price: data.price,
      is_active: data.is_active,
    };

    const result = editingPlan
      ? await updatePlan(editingPlan.id, payload)
      : await createPlan(payload);

    if (result.error) {
      setActionError(result.error);
      return;
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    const result = await deletePlan(deleteTarget.id);
    if (result.error) {
      setActionError(result.error);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Planes</h1>
          <p className="text-sm text-text-secondary mt-0.5">Gestiona los planes de membresía</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          <span className="hidden sm:inline">Nuevo plan</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-center py-12 text-danger">{error}</p>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin planes"
          description="Crea el primer plan de membresía para tu gimnasio."
          action={
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Crear plan
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface rounded-xl border p-4 flex flex-col gap-3 ${
                plan.is_active ? "border-border" : "border-border opacity-60"
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{plan.description}</p>
                  )}
                </div>
                <Badge variant={plan.is_active ? "success" : "default"}>
                  {plan.is_active ? (
                    <><CheckCircle className="h-3 w-3 mr-1 inline" />Activo</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1 inline" />Inactivo</>
                  )}
                </Badge>
              </div>

              {/* Duración y precio */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{durationLabel(plan.duration_days)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-primary">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{formatCurrency(plan.price)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  leftIcon={<Pencil className="h-4 w-4" />}
                  onClick={() => openEdit(plan)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-danger hover:bg-danger/10 hover:text-danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleteTarget(plan)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={editingPlan}
        onSave={handleSave}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        plan={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
