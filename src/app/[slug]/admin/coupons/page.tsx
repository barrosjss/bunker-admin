"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ticket, Plus, Pencil, Trash2, Percent, DollarSign, Calendar, CheckCircle, Copy } from "lucide-react";
import {
  Button, Input, Modal, ModalFooter, EmptyState, Spinner, Badge,
} from "@/components/ui";
import { useParams } from "next/navigation";
import { useCoupons } from "@/hooks/useCoupons";
import { formatCurrency } from "@/lib/utils/formatting";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DiscountCoupon } from "@/lib/supabase/types/database";

// ─── Schema ──────────────────────────────────────────────────────────────────
const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[A-Z0-9_-]+$/, "Solo letras mayúsculas, números, - y _"),
  name: z.string().min(1, "El nombre es requerido").max(80),
  description: z.string().max(200).optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z
    .number()
    .positive("Debe ser mayor a 0")
    .max(100, "Máx. 100%").or(z.number().positive()),
  min_amount: z.number().min(0).optional(),
  max_uses: z.number().int().min(1).optional().nullable(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
});

type CouponFormData = z.infer<typeof couponSchema>;

// ─── Modal formulario ────────────────────────────────────────────────────────
interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: DiscountCoupon | null;
  onSave: (data: CouponFormData) => Promise<void>;
}

function CouponModal({ isOpen, onClose, coupon, onSave }: CouponModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code ?? "",
      name: coupon?.name ?? "",
      description: coupon?.description ?? "",
      discount_type: coupon?.discount_type ?? "percentage",
      discount_value: coupon?.discount_value ?? 10,
      min_amount: coupon?.min_amount ?? 0,
      max_uses: coupon?.max_uses ?? null,
      expires_at: coupon?.expires_at ? format(parseISO(coupon.expires_at), "yyyy-MM-dd") : "",
      is_active: coupon?.is_active ?? true,
    },
  });

  const discountType = watch("discount_type");
  const isActive = watch("is_active");

  const handleClose = () => {
    reset();
    onClose();
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setValue("code", code);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={coupon ? "Editar cupón" : "Nuevo cupón"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        {/* Código */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Código *</label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-3 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary uppercase font-mono text-sm tracking-widest"
              placeholder="PROMO2024"
              {...register("code")}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase();
                setValue("code", upper);
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={generateCode} title="Generar código">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {errors.code && <p className="mt-1 text-sm text-danger">{errors.code.message}</p>}
          <p className="mt-1 text-xs text-text-secondary">Solo mayúsculas, números, guión y guión bajo</p>
        </div>

        <Input
          label="Nombre del cupón *"
          placeholder="Ej. Descuento bienvenida, Promo verano..."
          error={errors.name?.message}
          {...register("name")}
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Descripción</label>
          <textarea
            className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base"
            rows={2}
            placeholder="Detalles del descuento..."
            {...register("description")}
          />
        </div>

        {/* Tipo de descuento */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Tipo de descuento *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue("discount_type", "percentage")}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border transition-all ${
                discountType === "percentage"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-elevated border-border text-text-secondary hover:border-primary/50"
              }`}
            >
              <Percent className="h-4 w-4" />
              Porcentaje
            </button>
            <button
              type="button"
              onClick={() => setValue("discount_type", "fixed")}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border transition-all ${
                discountType === "fixed"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-elevated border-border text-text-secondary hover:border-primary/50"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Valor fijo
            </button>
          </div>
        </div>

        <Input
          type="number"
          label={discountType === "percentage" ? "Porcentaje de descuento *" : "Valor del descuento *"}
          placeholder={discountType === "percentage" ? "10" : "50000"}
          step={discountType === "percentage" ? "1" : "0.01"}
          min={0}
          max={discountType === "percentage" ? 100 : undefined}
          leftIcon={discountType === "percentage" ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
          error={errors.discount_value?.message}
          {...register("discount_value", { valueAsNumber: true })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            label="Monto mínimo"
            placeholder="0"
            min={0}
            step="0.01"
            leftIcon={<DollarSign className="h-4 w-4" />}
            error={errors.min_amount?.message}
            {...register("min_amount", { valueAsNumber: true })}
          />
          <Input
            type="number"
            label="Usos máximos"
            placeholder="Ilimitado"
            min={1}
            error={errors.max_uses?.message}
            {...register("max_uses", {
              setValueAs: (v) => (v === "" || v === null ? null : parseInt(v, 10)),
            })}
          />
        </div>

        <Input
          type="date"
          label="Vence el"
          leftIcon={<Calendar className="h-4 w-4" />}
          error={errors.expires_at?.message}
          {...register("expires_at")}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setValue("is_active", !isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-text-primary">Cupón activo</span>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {coupon ? "Guardar cambios" : "Crear cupón"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Modal de confirmación de eliminación ────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  coupon: DiscountCoupon | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeleteModal({ isOpen, coupon, onConfirm, onClose }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  if (!coupon) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar cupón" size="sm">
      <p className="text-text-secondary text-sm mb-4">
        ¿Eliminar el cupón <strong className="text-text-primary font-mono">&ldquo;{coupon.code}&rdquo;</strong>? Esta acción no se puede deshacer.
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
export default function AdminCouponsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { coupons, loading, error, createCoupon, updateCoupon, deleteCoupon } = useCoupons(slug);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCoupon | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const openEdit = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CouponFormData) => {
    setActionError(null);
    const payload = {
      code: data.code,
      name: data.name,
      description: data.description || null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_amount: data.min_amount ?? 0,
      max_uses: data.max_uses ?? null,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      is_active: data.is_active,
    };

    const result = editingCoupon
      ? await updateCoupon(editingCoupon.id, payload)
      : await createCoupon(payload);

    if (result.error) {
      setActionError(result.error);
      return;
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError(null);
    const result = await deleteCoupon(deleteTarget.id);
    if (result.error) setActionError(result.error);
    setDeleteTarget(null);
  };

  const copyCode = async (coupon: DiscountCoupon) => {
    await navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDiscount = (coupon: DiscountCoupon) => {
    if (coupon.discount_type === "percentage") return `${coupon.discount_value}% OFF`;
    return `${formatCurrency(coupon.discount_value)} OFF`;
  };

  const isExpired = (coupon: DiscountCoupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
  };

  const isMaxUsed = (coupon: DiscountCoupon) => {
    if (!coupon.max_uses) return false;
    return coupon.used_count >= coupon.max_uses;
  };

  const getStatus = (coupon: DiscountCoupon): { label: string; variant: "success" | "danger" | "warning" | "default" } => {
    if (!coupon.is_active) return { label: "Inactivo", variant: "default" };
    if (isExpired(coupon)) return { label: "Vencido", variant: "danger" };
    if (isMaxUsed(coupon)) return { label: "Agotado", variant: "warning" };
    return { label: "Activo", variant: "success" };
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Cupones</h1>
          <p className="text-sm text-text-secondary mt-0.5">Descuentos para membresías</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          <span className="hidden sm:inline">Nuevo cupón</span>
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
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Sin cupones"
          description="Crea cupones de descuento para ofrecer promociones a tus miembros."
          action={
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Crear cupón
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const status = getStatus(coupon);
            const expired = isExpired(coupon);
            const maxUsed = isMaxUsed(coupon);
            return (
              <div
                key={coupon.id}
                className={`bg-surface rounded-xl border p-4 flex flex-col gap-3 ${
                  !coupon.is_active || expired || maxUsed ? "border-border opacity-70" : "border-border"
                }`}
              >
                {/* Código + estado */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-text-primary text-sm tracking-wider truncate">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(coupon)}
                      className="shrink-0 text-text-secondary hover:text-primary transition-colors"
                      title="Copiar código"
                    >
                      {copiedId === coupon.id ? (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {/* Nombre y descripción */}
                <div>
                  <p className="text-sm font-medium text-text-primary">{coupon.name}</p>
                  {coupon.description && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{coupon.description}</p>
                  )}
                </div>

                {/* Descuento */}
                <div className="flex items-center gap-1.5">
                  {coupon.discount_type === "percentage" ? (
                    <Percent className="h-4 w-4 text-primary" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-semibold text-primary">{formatDiscount(coupon)}</span>
                  {coupon.min_amount > 0 && (
                    <span className="text-xs text-text-secondary ml-1">
                      (mín. {formatCurrency(coupon.min_amount)})
                    </span>
                  )}
                </div>

                {/* Meta: usos y vencimiento */}
                <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3.5 w-3.5" />
                    {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""} usos
                  </span>
                  {coupon.expires_at && (
                    <span className={`flex items-center gap-1 ${expired ? "text-danger" : ""}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(coupon.expires_at), "d MMM yyyy", { locale: es })}
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    leftIcon={<Pencil className="h-4 w-4" />}
                    onClick={() => openEdit(coupon)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-danger hover:bg-danger/10 hover:text-danger"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setDeleteTarget(coupon)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coupon={editingCoupon}
        onSave={handleSave}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        coupon={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
