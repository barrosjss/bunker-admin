"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Info, Scale, TriangleAlert } from "lucide-react";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import {
  BODY_FAT_BLOCKER_LABELS,
  SKINFOLD_SITES,
  calculateBmi,
  calculateBodyFat,
  formatPercentage,
  totalSkinfolds,
} from "@/lib/utils/anthropometry";
import { formatCurrency } from "@/lib/utils/formatting";
import type { Member, PhysicalEvaluation, TrainerService } from "@/lib/supabase/types/database";

export interface EvaluationCharge {
  amount: number;
  paymentMethod: "cash" | "card" | "transfer";
}

export interface EvaluationFormValues {
  member_id: string;
  evaluated_on: string;
  weight_kg: number | null;
  height_cm: number | null;
  notes: string | null;
  [skinfold: string]: string | number | null;
}

export interface EvaluationFormProps {
  members: Member[];
  /** Ids de miembros con personalizado activo — para ellos la evaluación va incluida. */
  activeClientIds: Set<string>;
  evaluationService: TrainerService | null;
  initialValue?: PhysicalEvaluation | null;
  preselectedMemberId?: string;
  submitLabel?: string;
  onSubmit: (values: EvaluationFormValues, charge: EvaluationCharge | null) => Promise<void>;
  onCancel: () => void;
  /** Guarda el sexo del miembro, que hace falta para estimar el % de grasa. */
  onSetMemberSex: (memberId: string, sex: "male" | "female") => Promise<void>;
}

type FieldMap = Record<string, string>;

/** Las columnas de pliegue, en el orden de la planilla en papel. */
const FIELDS = SKINFOLD_SITES.flatMap((site) =>
  site.bilateral ? [`${site.key}_left`, `${site.key}_right`] : [site.key]
);

function toNumber(raw: string): number | null {
  const cleaned = raw.replace(",", ".").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * El entrenador anota indistintamente "185 cm" o "1,63 mts".
 * Cualquier cosa por debajo de 3 solo puede ser metros.
 */
function parseHeightCm(raw: string): number | null {
  const n = toNumber(raw);
  if (n === null) return null;
  return n > 0 && n < 3 ? n * 100 : n;
}

export function EvaluationForm({
  members,
  activeClientIds,
  evaluationService,
  initialValue,
  preselectedMemberId,
  submitLabel = "Guardar evaluación",
  onSubmit,
  onCancel,
  onSetMemberSex,
}: EvaluationFormProps) {
  const [memberId, setMemberId] = useState(initialValue?.member_id || preselectedMemberId || "");
  const [evaluatedOn, setEvaluatedOn] = useState(
    initialValue?.evaluated_on || format(new Date(), "yyyy-MM-dd")
  );
  const [weight, setWeight] = useState(
    initialValue?.weight_kg !== null && initialValue?.weight_kg !== undefined
      ? String(initialValue.weight_kg)
      : ""
  );
  const [height, setHeight] = useState(
    initialValue?.height_cm !== null && initialValue?.height_cm !== undefined
      ? String(initialValue.height_cm)
      : ""
  );
  const [notes, setNotes] = useState(initialValue?.notes || "");
  const [fields, setFields] = useState<FieldMap>(() =>
    Object.fromEntries(
      FIELDS.map((f) => {
        const raw = (initialValue as Record<string, unknown> | null | undefined)?.[f];
        return [f, raw === null || raw === undefined ? "" : String(raw)];
      })
    )
  );

  const [shouldCharge, setShouldCharge] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeMethod, setChargeMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [savingSex, setSavingSex] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const member = useMemo(() => members.find((m) => m.id === memberId) || null, [members, memberId]);
  const isIncluded = memberId ? activeClientIds.has(memberId) : false;

  // Si no es personalizado, la evaluación se cobra aparte: se propone por defecto.
  useEffect(() => {
    if (!memberId || initialValue) return;
    setShouldCharge(!isIncluded && !!evaluationService);
    setChargeAmount(evaluationService ? String(evaluationService.price ?? 0) : "");
  }, [memberId, isIncluded, evaluationService, initialValue]);

  /** Los valores numéricos que alimentan los cálculos en vivo. */
  const measurements = useMemo<Record<string, number | null>>(() => {
    const parsed: Record<string, number | null> = {};
    for (const f of FIELDS) parsed[f] = toNumber(fields[f] ?? "");
    return { ...parsed, weight_kg: toNumber(weight), height_cm: parseHeightCm(height) };
  }, [fields, weight, height]);

  const bmi = useMemo(
    () => calculateBmi(measurements.weight_kg, measurements.height_cm),
    [measurements]
  );
  const bodyFat = useMemo(
    () => calculateBodyFat(measurements, member, evaluatedOn),
    [measurements, member, evaluatedOn]
  );
  const total = useMemo(() => totalSkinfolds(measurements), [measurements]);

  // El caso Jeffersson: IMC de sobrepeso con grasa de atleta. Sin esta nota el
  // IMC solo dice "obesidad" y el entrenador tiene que explicarlo a mano.
  const bmiMisleading =
    bmi !== null &&
    (bmi.category === "overweight" || bmi.category === "obese") &&
    bodyFat.ok &&
    (bodyFat.result.category === "athlete" ||
      bodyFat.result.category === "fitness" ||
      bodyFat.result.category === "essential");

  const setField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSetSex = async (sex: "male" | "female") => {
    if (!memberId) return;
    setSavingSex(true);
    try {
      await onSetMemberSex(memberId, sex);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el sexo");
    } finally {
      setSavingSex(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId) {
      setError("Selecciona el miembro evaluado.");
      return;
    }
    if (total.sites === 0 && measurements.weight_kg === null) {
      setError("Registra al menos un pliegue o el peso.");
      return;
    }

    setSubmitting(true);
    try {
      const values: EvaluationFormValues = {
        member_id: memberId,
        evaluated_on: evaluatedOn,
        weight_kg: measurements.weight_kg,
        height_cm: measurements.height_cm,
        notes: notes.trim() || null,
      };
      for (const f of FIELDS) values[f] = measurements[f];

      const charge =
        shouldCharge && evaluationService
          ? { amount: Number(chargeAmount) || 0, paymentMethod: chargeMethod }
          : null;

      await onSubmit(values, charge);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la evaluación");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos de la evaluación */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Miembro"
            placeholder="Selecciona un miembro"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            disabled={!!initialValue}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <Input
            type="date"
            label="Fecha de la evaluación"
            value={evaluatedOn}
            onChange={(e) => setEvaluatedOn(e.target.value)}
          />
        </div>

        {member && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isIncluded ? (
              <Badge variant="success">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Incluida en su personalizado
              </Badge>
            ) : (
              <Badge variant="default">No es personalizado — se cobra aparte</Badge>
            )}
            {!member.birth_date && (
              <Badge variant="warning">Sin fecha de nacimiento</Badge>
            )}
          </div>
        )}
      </Card>

      {/* Sexo: bloquea el % de grasa, así que se resuelve acá mismo */}
      {member && !member.sex && (
        <Card className="border-warning/30 bg-warning/5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Info className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="flex-1 text-sm text-text-secondary">
              Para estimar el % de grasa hace falta el sexo de{" "}
              <span className="font-medium text-text-primary">{member.name}</span>. Se guarda en su
              ficha, se pregunta una sola vez.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={savingSex}
                onClick={() => handleSetSex("male")}
              >
                Hombre
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={savingSex}
                onClick={() => handleSetSex("female")}
              >
                Mujer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Peso y estatura */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Peso y estatura</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="text"
            inputMode="decimal"
            label="Peso (kg)"
            placeholder="101.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            type="text"
            inputMode="decimal"
            label="Estatura"
            placeholder="185"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            hint={
              measurements.height_cm !== null
                ? `${measurements.height_cm.toFixed(0)} cm`
                : "En cm o en metros (1,63 se entiende igual)"
            }
          />
        </div>
      </Card>

      {/* Pliegues */}
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Pliegues cutáneos</h2>
          <span className="text-sm text-text-secondary">en mm</span>
        </div>

        <div className="hidden sm:grid grid-cols-[1fr_7rem_7rem] gap-3 pb-2 mb-2 border-b border-border">
          <span className="text-sm font-medium text-text-secondary">Sitio</span>
          <span className="text-sm font-medium text-text-secondary">Izquierdo</span>
          <span className="text-sm font-medium text-text-secondary">Derecho</span>
        </div>

        <div className="space-y-3">
          {SKINFOLD_SITES.map((site) => (
            <div
              key={site.key}
              className="grid grid-cols-2 sm:grid-cols-[1fr_7rem_7rem] gap-3 items-center"
            >
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                <span className="text-text-primary font-medium">{site.label}</span>
                {site.durnin && (
                  <Badge variant="primary" size="sm" title="Entra en el cálculo de % de grasa">
                    Σ4
                  </Badge>
                )}
              </div>

              {site.bilateral ? (
                <>
                  <Input
                    type="text"
                    inputMode="decimal"
                    aria-label={`${site.label} izquierdo`}
                    placeholder="Izq"
                    value={fields[`${site.key}_left`] ?? ""}
                    onChange={(e) => setField(`${site.key}_left`, e.target.value)}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    aria-label={`${site.label} derecho`}
                    placeholder="Der"
                    value={fields[`${site.key}_right`] ?? ""}
                    onChange={(e) => setField(`${site.key}_right`, e.target.value)}
                  />
                </>
              ) : (
                <div className="col-span-2 sm:col-span-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    aria-label={site.label}
                    placeholder="mm"
                    value={fields[site.key] ?? ""}
                    onChange={(e) => setField(site.key, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-text-secondary">
          En los bilaterales, si anotas los dos lados se usa el promedio. Con uno solo alcanza.
        </p>
      </Card>

      {/* Resultados en vivo */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-success" />
          <h2 className="text-lg font-semibold text-text-primary">Resultados</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-text-secondary">IMC</p>
            <p className="text-2xl font-bold text-text-primary">
              {bmi ? bmi.value.toFixed(1) : "—"}
            </p>
            {bmi && (
              <Badge variant={bmi.variant} size="sm" className="mt-1">
                {bmi.label}
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm text-text-secondary">% de grasa</p>
            <p className="text-2xl font-bold text-text-primary">
              {bodyFat.ok ? formatPercentage(bodyFat.result.percentage) : "—"}
            </p>
            {bodyFat.ok && (
              <Badge variant={bodyFat.result.variant} size="sm" className="mt-1">
                {bodyFat.result.label}
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm text-text-secondary">Σ 4 pliegues</p>
            <p className="text-2xl font-bold text-text-primary">
              {bodyFat.ok ? `${bodyFat.result.sum4.toFixed(1)} mm` : "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-text-secondary">
              Σ total ({total.sites} {total.sites === 1 ? "sitio" : "sitios"})
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {total.sites > 0 ? `${total.sum.toFixed(1)} mm` : "—"}
            </p>
          </div>
        </div>

        {bodyFat.ok && bodyFat.result.fatMassKg !== null && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Masa grasa</p>
              <p className="text-lg font-semibold text-text-primary">
                {bodyFat.result.fatMassKg.toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Masa magra</p>
              <p className="text-lg font-semibold text-text-primary">
                {bodyFat.result.leanMassKg?.toFixed(1)} kg
              </p>
            </div>
          </div>
        )}

        {!bodyFat.ok && (
          <p className="mt-4 text-sm text-text-secondary">
            Para el % de grasa {bodyFat.missing.map((m) => BODY_FAT_BLOCKER_LABELS[m]).join(", ")}.
          </p>
        )}

        {bmiMisleading && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-elevated border border-border px-4 py-3">
            <TriangleAlert className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              El IMC marca <span className="font-medium text-text-primary">{bmi?.label}</span> pero
              el % de grasa da{" "}
              <span className="font-medium text-text-primary">{bodyFat.ok && bodyFat.result.label}</span>.
              El IMC no distingue músculo de grasa: acá manda el pliegue.
            </p>
          </div>
        )}

        {bodyFat.ok && bodyFat.result.ageOutOfRange && (
          <p className="mt-3 text-sm text-warning">
            La fórmula está validada entre 17 y 72 años; a los {bodyFat.result.age} el resultado es
            orientativo.
          </p>
        )}
      </Card>

      {/* Cobro de la evaluación */}
      {!initialValue && member && !isIncluded && evaluationService && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Cobro</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shouldCharge}
              onChange={(e) => setShouldCharge(e.target.checked)}
              className="h-5 w-5 rounded border-border bg-surface-elevated accent-primary"
            />
            <span className="text-text-primary">
              Registrar el cobro de la evaluación
              {Number(evaluationService.price) > 0 && (
                <span className="text-text-secondary">
                  {" "}
                  ({formatCurrency(Number(evaluationService.price))})
                </span>
              )}
            </span>
          </label>

          {shouldCharge && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Monto"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
              />
              <Select
                label="Método de pago"
                value={chargeMethod}
                onChange={(e) => setChargeMethod(e.target.value as typeof chargeMethod)}
                options={[
                  { value: "cash", label: "Efectivo" },
                  { value: "card", label: "Tarjeta" },
                  { value: "transfer", label: "Transferencia" },
                ]}
              />
            </div>
          )}
        </Card>
      )}

      <Card>
        <Textarea
          label="Notas (opcional)"
          placeholder="Observaciones de la evaluación"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
        />
      </Card>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-6">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
