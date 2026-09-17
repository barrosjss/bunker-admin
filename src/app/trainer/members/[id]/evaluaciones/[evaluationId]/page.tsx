"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Header } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Modal,
  ModalFooter,
  Spinner,
} from "@/components/ui";
import { usePhysicalEvaluation, usePhysicalEvaluations } from "@/hooks/usePhysicalEvaluations";
import {
  BODY_FAT_BLOCKER_LABELS,
  SEX_LABELS,
  SKINFOLD_SITES,
  ageAt,
  calculateBmi,
  calculateBodyFat,
  compareEvaluations,
  formatCm,
  formatPercentage,
  siteValue,
  totalSkinfolds,
} from "@/lib/utils/anthropometry";
import { formatDate } from "@/lib/utils/dates";

/** Una mejora es bajar grasa o pliegues; en peso no se asume dirección. */
function DeltaPill({
  value,
  unit,
  decimals = 1,
  lowerIsBetter = true,
}: {
  value: number | null;
  unit: string;
  decimals?: number;
  lowerIsBetter?: boolean;
}) {
  if (value === null) return <span className="text-sm text-text-secondary">—</span>;

  const rounded = Number(value.toFixed(decimals));
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
        <Minus className="h-4 w-4" />
        sin cambio
      </span>
    );
  }

  const dropped = rounded < 0;
  const good = lowerIsBetter ? dropped : !dropped;
  const Icon = dropped ? TrendingDown : TrendingUp;

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        lowerIsBetter ? (good ? "text-success" : "text-warning") : "text-text-primary"
      }`}
    >
      <Icon className="h-4 w-4" />
      {rounded > 0 ? "+" : ""}
      {rounded.toFixed(decimals)} {unit}
    </span>
  );
}

export default function EvaluacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const id = params.evaluationId as string;

  const { evaluation, previous, loading, error } = usePhysicalEvaluation(id);
  const { deleteEvaluation } = usePhysicalEvaluations();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const member = evaluation?.members ?? null;

  const bmi = useMemo(
    () => (evaluation ? calculateBmi(evaluation.weight_kg, evaluation.height_cm) : null),
    [evaluation]
  );
  const bodyFat = useMemo(
    () => (evaluation ? calculateBodyFat(evaluation, member, evaluation.evaluated_on) : null),
    [evaluation, member]
  );
  const total = useMemo(() => (evaluation ? totalSkinfolds(evaluation) : null), [evaluation]);
  const delta = useMemo(
    () => (evaluation ? compareEvaluations(evaluation, previous, member) : null),
    [evaluation, previous, member]
  );

  const age = evaluation && member ? ageAt(member.birth_date, evaluation.evaluated_on) : null;

  const bmiMisleading =
    bmi !== null &&
    (bmi.category === "overweight" || bmi.category === "obese") &&
    bodyFat?.ok &&
    (bodyFat.result.category === "athlete" ||
      bodyFat.result.category === "fitness" ||
      bodyFat.result.category === "essential");

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEvaluation(id);
      router.push(`/trainer/members/${memberId}`);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertCircle className="h-12 w-12 text-danger mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Evaluación no encontrada</h2>
        <p className="text-text-secondary mb-4">{error || "Esta evaluación no existe."}</p>
        <Link href={`/trainer/members/${memberId}`}>
          <Button variant="secondary">Volver a la ficha</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Header title="" showSearch={false} />

      <div className="p-6">
        <Link
          href={`/trainer/members/${memberId}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a la ficha
        </Link>

        {/* Cabecera */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar src={member?.photo_url} name={member?.name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-text-primary">
                  {member?.name || "Miembro eliminado"}
                </h1>
                <Badge variant={evaluation.payment_id ? "default" : "success"} size="sm">
                  {evaluation.payment_id ? "Cobrada" : "Incluida"}
                </Badge>
              </div>
              <p className="text-text-secondary">
                Evaluado el {formatDate(evaluation.evaluated_on, "d 'de' MMMM yyyy")}
                {age !== null && ` · ${age} años`}
                {member?.sex && ` · ${SEX_LABELS[member.sex]}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              aria-label="Eliminar evaluación"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Resultados */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-sm text-text-secondary">Edad</p>
            <p className="text-2xl font-bold text-text-primary">
              {age !== null ? age : "—"}
            </p>
            {age !== null && <p className="text-xs text-text-secondary mt-1">años</p>}
          </Card>

          <Card>
            <p className="text-sm text-text-secondary">Peso</p>
            <p className="text-2xl font-bold text-text-primary">
              {evaluation.weight_kg !== null ? `${evaluation.weight_kg} kg` : "—"}
            </p>
            {delta && <div className="mt-1"><DeltaPill value={delta.weightKg} unit="kg" lowerIsBetter={false} /></div>}
          </Card>

          <Card>
            <p className="text-sm text-text-secondary">Estatura</p>
            <p className="text-2xl font-bold text-text-primary">
              {evaluation.height_cm !== null
                ? `${Number(evaluation.height_cm).toFixed(1).replace(/\.0$/, "")} cm`
                : "—"}
            </p>
            {bmi && (
              <p className="text-xs text-text-secondary mt-1">Con el peso, da el IMC</p>
            )}
          </Card>

          <Card>
            <p className="text-sm text-text-secondary">IMC</p>
            <p className="text-2xl font-bold text-text-primary">
              {bmi ? bmi.value.toFixed(1) : "—"}
            </p>
            {bmi && (
              <Badge variant={bmi.variant} size="sm" className="mt-1">
                {bmi.label}
              </Badge>
            )}
          </Card>

          <Card>
            <p className="text-sm text-text-secondary">% de grasa</p>
            <p className="text-2xl font-bold text-text-primary">
              {bodyFat?.ok ? formatPercentage(bodyFat.result.percentage) : "—"}
            </p>
            {bodyFat?.ok ? (
              <Badge variant={bodyFat.result.variant} size="sm" className="mt-1">
                {bodyFat.result.label}
              </Badge>
            ) : null}
            {delta && <div className="mt-1"><DeltaPill value={delta.bodyFatPct} unit="pts" /></div>}
          </Card>

          <Card>
            <p className="text-sm text-text-secondary">Σ pliegues</p>
            <p className="text-2xl font-bold text-text-primary">
              {total && total.sites > 0 ? `${total.sum.toFixed(2)} cm` : "—"}
            </p>
            {delta && <div className="mt-1"><DeltaPill value={delta.sumSkinfolds} unit="cm" decimals={2} /></div>}
          </Card>
        </div>

        {bodyFat?.ok && bodyFat.result.fatMassKg !== null && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Composición corporal</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-secondary">Masa grasa</p>
                <p className="text-xl font-semibold text-text-primary">
                  {bodyFat.result.fatMassKg.toFixed(1)} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Masa magra</p>
                <p className="text-xl font-semibold text-text-primary">
                  {bodyFat.result.leanMassKg?.toFixed(1)} kg
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              Estimado por Durnin-Womersley sobre la suma de 4 pliegues (
              {bodyFat.result.sum4.toFixed(2)} cm) y convertido con Siri.
            </p>
          </Card>
        )}

        {bodyFat && !bodyFat.ok && (
          <Card className="mb-6 border-warning/30 bg-warning/5">
            <p className="text-sm text-text-secondary">
              No se pudo estimar el % de grasa:{" "}
              {bodyFat.missing.map((m) => BODY_FAT_BLOCKER_LABELS[m]).join(", ")}.
            </p>
          </Card>
        )}

        {bmiMisleading && (
          <Card className="mb-6 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                El IMC marca <span className="font-medium text-text-primary">{bmi?.label}</span>{" "}
                pero el % de grasa da{" "}
                <span className="font-medium text-text-primary">
                  {bodyFat?.ok && bodyFat.result.label}
                </span>
                . El IMC no distingue músculo de grasa — para este caso vale el pliegue, no el IMC.
              </p>
            </div>
          </Card>
        )}

        {/* Pliegues */}
        <Card className="mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Pliegues cutáneos</h2>
            {previous && (
              <span className="text-sm text-text-secondary">
                vs. {formatDate(previous.evaluated_on, "d MMM yyyy")}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left font-medium py-2 pr-4">Sitio</th>
                  <th className="text-right font-medium py-2 px-3">Izq</th>
                  <th className="text-right font-medium py-2 px-3">Der</th>
                  <th className="text-right font-medium py-2 pl-3">Usado</th>
                  {previous && <th className="text-right font-medium py-2 pl-3">Anterior</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SKINFOLD_SITES.map((site) => {
                  const used = siteValue(evaluation, site);
                  const prior = previous ? siteValue(previous, site) : null;
                  const record = evaluation as unknown as Record<string, number | null>;

                  return (
                    <tr key={site.key}>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary">{site.label}</span>
                          {site.durnin && (
                            <Badge variant="primary" size="sm">
                              Σ4
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 text-text-secondary tabular-nums">
                        {site.bilateral ? formatCm(record[`${site.key}_left`]) : "—"}
                      </td>
                      <td className="text-right py-2 px-3 text-text-secondary tabular-nums">
                        {site.bilateral ? formatCm(record[`${site.key}_right`]) : "—"}
                      </td>
                      <td className="text-right py-2 pl-3 font-medium text-text-primary tabular-nums">
                        {formatCm(used)}
                      </td>
                      {previous && (
                        <td className="text-right py-2 pl-3 text-text-secondary tabular-nums">
                          {formatCm(prior)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {delta && delta.sumSkinfolds === null && previous && (
            <p className="mt-4 text-sm text-text-secondary">
              La suma no se compara con la anterior porque no se midieron los mismos sitios.
            </p>
          )}
        </Card>

        {evaluation.notes && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Notas</h2>
            <p className="text-text-secondary whitespace-pre-wrap">{evaluation.notes}</p>
          </Card>
        )}

        {member && (
          <Link href={`/trainer/members/${memberId}/evaluaciones/nueva`}>
            <Button variant="secondary" leftIcon={<Plus className="h-5 w-5" />}>
              Nueva evaluación de {member.name.split(" ")[0]}
            </Button>
          </Link>
        )}
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar evaluación"
        size="sm"
      >
        <p className="text-text-secondary">
          Se borra la evaluación del {formatDate(evaluation.evaluated_on, "d 'de' MMMM yyyy")}. El
          cobro asociado, si lo hubo, se conserva.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" isLoading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
