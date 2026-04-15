"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Banknote, CreditCard, ArrowLeftRight, TrendingUp, Pencil, Trash2, Search } from "lucide-react";
import { Button, Input, EmptyState, Spinner, Select, Modal, ModalFooter } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/formatting";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "cash" | "card" | "transfer";

interface Movement {
  id: string;
  amount_paid: number;
  payment_method: PaymentMethod | null;
  status: string;
  start_date: string;
  notes: string | null;
  created_at: string;
  members: { name: string } | null;
  membership_plans: { name: string } | null;
}

type FilterTab = "today" | "week" | "month" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: "bg-success/10 text-success",
  card: "bg-primary/10 text-primary",
  transfer: "bg-warning/10 text-warning",
};

function getDateRange(filter: FilterTab, customFrom: string, customTo: string): { start: Date; end: Date } {
  const now = new Date();
  if (filter === "today") return { start: startOfDay(now), end: now };
  if (filter === "week") return { start: startOfDay(subDays(now, 6)), end: now };
  if (filter === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
  const start = customFrom ? new Date(customFrom + "T00:00:00") : startOfMonth(now);
  const end = customTo ? new Date(customTo + "T23:59:59") : endOfMonth(now);
  return { start, end };
}

const FILTER_LABELS: Record<FilterTab, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  custom: "Personalizado",
};

// ─── Edit schema ──────────────────────────────────────────────────────────────
const editSchema = z.object({
  amount_paid: z.number().min(0, "El monto debe ser mayor o igual a 0"),
  payment_method: z.enum(["cash", "card", "transfer"]),
  notes: z.string().optional(),
});
type EditFormData = z.infer<typeof editSchema>;

// ─── Edit Modal ───────────────────────────────────────────────────────────────
interface EditMovementModalProps {
  isOpen: boolean;
  movement: Movement | null;
  onClose: () => void;
  onSave: (id: string, data: EditFormData) => Promise<void>;
}

function EditMovementModal({ isOpen, movement, onClose, onSave }: EditMovementModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount_paid: movement?.amount_paid ?? undefined,
      payment_method: movement?.payment_method ?? "cash",
      notes: movement?.notes ?? "",
    },
  });

  // Sync defaults when movement changes
  useEffect(() => {
    if (movement) {
      reset({
        amount_paid: movement.amount_paid,
        payment_method: movement.payment_method ?? "cash",
        notes: movement.notes ?? "",
      });
    }
  }, [movement, reset]);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: EditFormData) => {
    if (!movement) return;
    setServerError(null);
    try {
      await onSave(movement.id, data);
      handleClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  if (!movement) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar movimiento" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {serverError}
          </div>
        )}

        <div>
          <p className="text-sm text-text-secondary mb-1">Miembro</p>
          <p className="text-sm font-medium text-text-primary">{movement.members?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary mb-1">Plan</p>
          <p className="text-sm font-medium text-text-primary">{movement.membership_plans?.name ?? "—"}</p>
        </div>

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

        <Input
          label="Notas"
          placeholder="Observaciones..."
          {...register("notes")}
        />

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Guardar</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
interface DeleteMovementModalProps {
  isOpen: boolean;
  movement: Movement | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteMovementModal({ isOpen, movement, onClose, onConfirm }: DeleteMovementModalProps) {
  const [loading, setLoading] = useState(false);
  if (!movement) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar movimiento" size="sm">
      <p className="text-text-secondary text-sm mb-4">
        ¿Eliminar el pago de <strong className="text-text-primary">{movement.members?.name ?? "este miembro"}</strong> por{" "}
        <strong className="text-text-primary">{formatCurrency(movement.amount_paid)}</strong>? Esta acción no se puede deshacer.
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

// ─── Finance Page ─────────────────────────────────────────────────────────────
export default function AdminFinancePage() {
  useParams<{ slug: string }>();
  const supabase = createClient();

  const [filter, setFilter] = useState<FilterTab>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null);

  // Keep last fetched params so we can refetch after mutations
  const [lastFetchParams, setLastFetchParams] = useState<{ filter: FilterTab; cf: string; ct: string }>({
    filter: "month", cf: "", ct: "",
  });

  const fetchMovements = async (activeFilter: FilterTab, cf: string, ct: string) => {
    setLoading(true);
    setError(null);
    setLastFetchParams({ filter: activeFilter, cf, ct });
    try {
      const { start, end } = getDateRange(activeFilter, cf, ct);
      const { data, error: dbError } = await supabase
        .from("memberships")
        .select(`id, amount_paid, payment_method, status, start_date, notes, created_at,
          members(name),
          membership_plans(name)
        `)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;
      setMovements((data as Movement[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchMovements(lastFetchParams.filter, lastFetchParams.cf, lastFetchParams.ct);

  useEffect(() => {
    if (filter !== "custom") {
      fetchMovements(filter, "", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleCustomSearch = () => {
    fetchMovements("custom", customFrom, customTo);
  };

  const handleEditSave = async (id: string, data: EditFormData) => {
    const { error } = await supabase
      .from("memberships")
      .update({
        amount_paid: data.amount_paid,
        payment_method: data.payment_method,
        notes: data.notes || null,
      })
      .eq("id", id);
    if (error) throw error;
    await refetch();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMovement) return;
    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("id", deletingMovement.id);
    if (error) throw error;
    setDeletingMovement(null);
    await refetch();
  };

  // ─── Filter by member name (client-side) ────────────────────────────────
  const filteredMovements = memberSearch.trim()
    ? movements.filter((m) =>
        m.members?.name.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : movements;

  // ─── Grouping by date ────────────────────────────────────────────────────
  const grouped = filteredMovements.reduce<Record<string, Movement[]>>((acc, mov) => {
    const key = format(new Date(mov.created_at), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(mov);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const totalIngresos = filteredMovements.reduce((sum, m) => sum + (m.amount_paid ?? 0), 0);
  const today = format(new Date(), "d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Finanzas</h1>
          <p className="text-sm text-text-secondary mt-0.5 capitalize">{today}</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-surface rounded-2xl border border-border p-5 mb-6">
        <p className="text-sm text-text-secondary mb-1">Total ingresos</p>
        <div className="flex items-end justify-between gap-2 flex-wrap">
          <p className="text-3xl sm:text-4xl font-bold text-text-primary tabular-nums">
            {formatCurrency(totalIngresos)}
          </p>
          <span className="text-sm text-text-secondary bg-surface-elevated border border-border px-3 py-1 rounded-full">
            {FILTER_LABELS[filter]}
          </span>
        </div>
        <p className="text-sm text-text-secondary mt-2">
          {filteredMovements.length} movimiento{filteredMovements.length !== 1 ? "s" : ""}
          {memberSearch.trim() && ` · filtrado por "${memberSearch.trim()}"`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(["today", "week", "month", "custom"] as FilterTab[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {f === "today" ? "Hoy" : f === "week" ? "Semana" : f === "month" ? "Mes" : "Personalizado"}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {filter === "custom" && (
        <div className="flex items-end gap-2 mb-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <Input
              type="date"
              label="Desde"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Input
              type="date"
              label="Hasta"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCustomSearch}
            disabled={!customFrom || !customTo}
          >
            Buscar
          </Button>
        </div>
      )}

      {/* Member search */}
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Buscar por miembro..."
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-center py-12 text-danger">{error}</p>
      ) : filteredMovements.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={memberSearch.trim() ? "Sin resultados" : "Sin movimientos en este período"}
          description={memberSearch.trim() ? `No hay pagos de "${memberSearch.trim()}" en este período.` : "No hay pagos registrados en el rango de fechas seleccionado."}
        />
      ) : (
        <div className="space-y-6">
          {groupKeys.map((dateKey) => {
            const dayMovements = grouped[dateKey];
            const dayDate = new Date(dateKey + "T12:00:00");
            const dayLabel = format(dayDate, "d 'de' MMMM yyyy", { locale: es });
            const dayTotal = dayMovements.reduce((sum, m) => sum + (m.amount_paid ?? 0), 0);

            return (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-text-secondary capitalize whitespace-nowrap">
                    {dayLabel}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                    {formatCurrency(dayTotal)}
                  </span>
                </div>

                {/* Transactions */}
                <div className="space-y-2">
                  {dayMovements.map((mov) => {
                    const method = mov.payment_method ?? "cash";
                    const Icon = METHOD_ICONS[method] ?? Banknote;
                    const methodLabel = METHOD_LABELS[method] ?? method;
                    const methodColor = METHOD_COLORS[method] ?? METHOD_COLORS.cash;
                    const time = format(new Date(mov.created_at), "HH:mm");

                    return (
                      <div
                        key={mov.id}
                        className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border"
                      >
                        {/* Icon */}
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${methodColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-primary text-sm truncate">
                            {mov.members?.name ?? "—"}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {mov.membership_plans?.name ?? "Sin plan"}
                          </p>
                        </div>

                        {/* Right side */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-success text-sm tabular-nums">
                            +{formatCurrency(mov.amount_paid)}
                          </p>
                          <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodColor}`}>
                              {methodLabel}
                            </span>
                            <span className="text-xs text-text-secondary">{time}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingMovement(mov)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                            title="Editar movimiento"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMovement(mov)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditMovementModal
        isOpen={!!editingMovement}
        movement={editingMovement}
        onClose={() => setEditingMovement(null)}
        onSave={handleEditSave}
      />

      <DeleteMovementModal
        isOpen={!!deletingMovement}
        movement={deletingMovement}
        onClose={() => setDeletingMovement(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
