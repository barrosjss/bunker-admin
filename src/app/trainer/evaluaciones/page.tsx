"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Search } from "lucide-react";
import { Header } from "@/components/layout";
import { Avatar, Badge, Button, Card, EmptyState, Input, Spinner } from "@/components/ui";
import { usePhysicalEvaluations } from "@/hooks/usePhysicalEvaluations";
import {
  calculateBmi,
  calculateBodyFat,
  formatPercentage,
  totalSkinfolds,
} from "@/lib/utils/anthropometry";
import { formatDate } from "@/lib/utils/dates";

export default function EvaluacionesPage() {
  const { evaluations, loading, error } = usePhysicalEvaluations();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return evaluations.map((evaluation) => ({
      evaluation,
      bmi: calculateBmi(evaluation.weight_kg, evaluation.height_cm),
      bodyFat: calculateBodyFat(evaluation, evaluation.members, evaluation.evaluated_on),
      total: totalSkinfolds(evaluation),
    }));
  }, [evaluations]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(({ evaluation }) =>
      evaluation.members?.name.toLowerCase().includes(query)
    );
  }, [rows, search]);

  return (
    <div>
      <Header title="Evaluaciones físicas" showSearch={false} />

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link href="/trainer/evaluaciones/nueva">
            <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
              Nueva evaluación
            </Button>
          </Link>
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar por miembro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-danger">{error}</p>
          </div>
        ) : visibleRows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={evaluations.length === 0 ? "Sin evaluaciones todavía" : "Sin resultados"}
            description={
              evaluations.length === 0
                ? "Registra la primera y queda el histórico para comparar la evolución."
                : "Ningún miembro coincide con esa búsqueda."
            }
            action={
              evaluations.length === 0 ? (
                <Link href="/trainer/evaluaciones/nueva">
                  <Button variant="primary" leftIcon={<Plus className="h-5 w-5" />}>
                    Nueva evaluación
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleRows.map(({ evaluation, bmi, bodyFat, total }) => (
              <Link key={evaluation.id} href={`/trainer/evaluaciones/${evaluation.id}`}>
                <Card hoverable>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar
                        src={evaluation.members?.photo_url}
                        name={evaluation.members?.name}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {evaluation.members?.name || "Miembro eliminado"}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(evaluation.evaluated_on, "d 'de' MMMM yyyy")}
                          {total.sites > 0 && ` · ${total.sites} pliegues`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">IMC</p>
                        <p className="font-semibold text-text-primary">
                          {bmi ? bmi.value.toFixed(1) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">% grasa</p>
                        <p className="font-semibold text-text-primary">
                          {bodyFat.ok ? formatPercentage(bodyFat.result.percentage) : "—"}
                        </p>
                      </div>
                      {bodyFat.ok && (
                        <Badge variant={bodyFat.result.variant}>{bodyFat.result.label}</Badge>
                      )}
                      <Badge variant={evaluation.payment_id ? "default" : "success"} size="sm">
                        {evaluation.payment_id ? "Cobrada" : "Incluida"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
