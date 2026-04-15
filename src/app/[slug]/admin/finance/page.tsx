"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, startOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Banknote, CreditCard, ArrowLeftRight, TrendingUp } from "lucide-react";
import { Button, Input, EmptyState, Spinner } from "@/components/ui";
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
  if (filter === "today") {
    return { start: startOfDay(now), end: now };
  }
  if (filter === "week") {
    return { start: startOfDay(subDays(now, 6)), end: now };
  }
  if (filter === "month") {
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }
  // custom
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

// ─── Finance Page ─────────────────────────────────────────────────────────────
export default function AdminFinancePage() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = createClient();

  const [filter, setFilter] = useState<FilterTab>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customApplied, setCustomApplied] = useState({ from: "", to: "" });
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async (activeFilter: FilterTab, cf: string, ct: string) => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getDateRange(activeFilter, cf, ct);
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const { data, error: dbError } = await supabase
        .from("memberships")
        .select(`id, amount_paid, payment_method, status, start_date, created_at,
          members(name),
          membership_plans(name)
        `)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;
      setMovements((data as Movement[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== "custom") {
      fetchMovements(filter, "", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleCustomSearch = () => {
    setCustomApplied({ from: customFrom, to: customTo });
    fetchMovements("custom", customFrom, customTo);
  };

  // ─── Grouping by date ────────────────────────────────────────────────────
  const grouped = movements.reduce<Record<string, Movement[]>>((acc, mov) => {
    const key = format(new Date(mov.created_at), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(mov);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalIngresos = movements.reduce((sum, m) => sum + (m.amount_paid ?? 0), 0);

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
          {movements.length} movimiento{movements.length !== 1 ? "s" : ""}
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

      {/* Transaction list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-center py-12 text-danger">{error}</p>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin movimientos en este período"
          description="No hay pagos registrados en el rango de fechas seleccionado."
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
