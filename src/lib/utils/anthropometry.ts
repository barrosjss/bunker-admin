import { differenceInYears, parseISO } from "date-fns";
import type { PhysicalEvaluation } from "@/lib/supabase/types/database";

// ─── Sitios de pliegue ───────────────────────────────────────────────────────
// Calcan la planilla en papel del entrenador. `bilateral` marca los que él
// anota como I/D; en esos el lado derecho es opcional porque no siempre lo toma.

export interface SkinfoldSite {
  key: string;
  label: string;
  bilateral: boolean;
  /** Entra en la suma de 4 de Durnin-Womersley. */
  durnin: boolean;
}

export const SKINFOLD_SITES: SkinfoldSite[] = [
  { key: "tricipital", label: "Tricipital", bilateral: true, durnin: true },
  { key: "bicipital", label: "Bicipital", bilateral: true, durnin: true },
  { key: "subescapular", label: "Subescapular", bilateral: false, durnin: true },
  { key: "suprailiaco", label: "Suprailíaco", bilateral: false, durnin: true },
  { key: "abdominal", label: "Abdominal", bilateral: false, durnin: false },
  { key: "cuadriceps", label: "Cuádriceps", bilateral: true, durnin: false },
  { key: "pantorrilla", label: "Pantorrilla", bilateral: true, durnin: false },
  { key: "pectoral", label: "Pectoral", bilateral: true, durnin: false },
];

/** Las columnas de `physical_evaluations` que guardan pliegues. */
export const SKINFOLD_COLUMNS: string[] = SKINFOLD_SITES.flatMap((s) =>
  s.bilateral ? [`${s.key}_left`, `${s.key}_right`] : [s.key]
);

/**
 * Cualquier objeto con las columnas de pliegue: la fila cruda de la tabla, la
 * fila con relaciones anidadas (`members`), o el borrador del formulario. Por
 * eso los valores son `unknown` y se filtran en `num()`.
 */
type SkinfoldSource = Record<string, unknown>;

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Los pliegues se capturan en cm; Durnin-Womersley trabaja en mm. */
const CM_TO_MM = 10;

/**
 * Techo de un pliegue creíble, en cm.
 *
 * 8 cm son 80 mm: por encima del rango de cualquier plicómetro, así que un
 * valor mayor no es una persona muy grasa — es un número en milímetros escrito
 * en un campo que espera centímetros. Es el error más probable, porque la
 * planilla de papel del entrenador está en mm y al transcribirla hay que correr
 * la coma en cada dato.
 *
 * Importa atajarlo: un pliegue en mm no rompe nada de forma visible, solo
 * devuelve un % de grasa equivocado que parece razonable. Con los datos reales
 * de la planilla, cargar mm en vez de cm convierte un 12,9% en un 42%.
 */
export const SKINFOLD_MAX_CM = 8;

/** true si el valor solo se explica como milímetros mal cargados. */
export function isImplausibleSkinfold(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && value > SKINFOLD_MAX_CM;
}

/**
 * Valor representativo de un sitio, en cm.
 * Bilateral con ambos lados → promedio. Con uno solo → ese.
 */
export function siteValue(evaluation: SkinfoldSource, site: SkinfoldSite): number | null {
  if (!site.bilateral) return num(evaluation[site.key]);

  const left = num(evaluation[`${site.key}_left`]);
  const right = num(evaluation[`${site.key}_right`]);

  if (left !== null && right !== null) return (left + right) / 2;
  return left ?? right;
}

// ─── IMC ─────────────────────────────────────────────────────────────────────

export type BmiCategoryKey = "underweight" | "normal" | "overweight" | "obese";

export interface BmiResult {
  value: number;
  category: BmiCategoryKey;
  label: string;
  variant: "default" | "success" | "warning" | "danger";
}

export function calculateBmi(weightKg: unknown, heightCm: unknown): BmiResult | null {
  const weight = num(weightKg);
  const height = num(heightCm);
  if (weight === null || height === null || weight <= 0 || height <= 0) return null;

  const meters = height / 100;
  const value = weight / (meters * meters);

  if (value < 18.5) {
    return { value, category: "underweight", label: "Bajo peso", variant: "warning" };
  }
  if (value < 25) {
    return { value, category: "normal", label: "Normal", variant: "success" };
  }
  if (value < 30) {
    return { value, category: "overweight", label: "Sobrepeso", variant: "warning" };
  }
  return { value, category: "obese", label: "Obesidad", variant: "danger" };
}

// ─── % de grasa corporal ─────────────────────────────────────────────────────
//
// Durnin & Womersley (1974): densidad corporal a partir del log10 de la suma
// de 4 pliegues (tricipital, bicipital, subescapular, suprailíaco), con
// coeficientes por sexo y franja etaria. Luego Siri (1961) convierte densidad
// a porcentaje de grasa.
//
// OJO con las unidades: la tabla original está en mm y acá los pliegues se
// guardan en cm. La conversión se hace una sola vez, en calculateBodyFat.
//
// Se eligió esta fórmula porque los 4 sitios que necesita ya están en la
// planilla que el entrenador usa hoy — no le pide medir nada nuevo.

type Sex = "male" | "female";

interface DurninCoefficients {
  c: number;
  m: number;
}

/** [edadMinima, c, m] — la franja aplica desde esa edad hacia arriba. */
const DURNIN_TABLE: Record<Sex, [number, number, number][]> = {
  male: [
    [50, 1.1715, 0.0779],
    [40, 1.162, 0.07],
    [30, 1.1422, 0.0544],
    [20, 1.1631, 0.0632],
    [0, 1.162, 0.063], // franja 17-19, aplicada también por debajo
  ],
  female: [
    [50, 1.1339, 0.0645],
    [40, 1.1333, 0.0612],
    [30, 1.1423, 0.0632],
    [20, 1.1599, 0.0717],
    [0, 1.1549, 0.0678], // franja 17-19, aplicada también por debajo
  ],
};

function durninCoefficients(sex: Sex, age: number): DurninCoefficients {
  const row = DURNIN_TABLE[sex].find(([minAge]) => age >= minAge)!;
  return { c: row[1], m: row[2] };
}

export type BodyFatCategoryKey = "essential" | "athlete" | "fitness" | "acceptable" | "obese";

export interface BodyFatCategory {
  category: BodyFatCategoryKey;
  label: string;
  variant: "default" | "success" | "warning" | "danger";
}

/** Rangos de referencia ACE, por sexo. */
function classifyBodyFat(sex: Sex, percentage: number): BodyFatCategory {
  const thresholds: [number, BodyFatCategoryKey, string, BodyFatCategory["variant"]][] =
    sex === "male"
      ? [
          [6, "essential", "Grasa esencial", "warning"],
          [14, "athlete", "Atleta", "success"],
          [18, "fitness", "Fitness", "success"],
          [25, "acceptable", "Aceptable", "default"],
        ]
      : [
          [14, "essential", "Grasa esencial", "warning"],
          [21, "athlete", "Atleta", "success"],
          [25, "fitness", "Fitness", "success"],
          [32, "acceptable", "Aceptable", "default"],
        ];

  for (const [max, category, label, variant] of thresholds) {
    if (percentage < max) return { category, label, variant };
  }
  return { category: "obese", label: "Obesidad", variant: "danger" };
}

export interface BodyFatResult {
  percentage: number;
  density: number;
  /** Suma de los 4 pliegues de Durnin-Womersley, en cm. */
  sum4: number;
  age: number;
  sex: Sex;
  category: BodyFatCategoryKey;
  label: string;
  variant: "default" | "success" | "warning" | "danger";
  fatMassKg: number | null;
  leanMassKg: number | null;
  /** true si la edad queda fuera del rango validado del estudio (17-72 años). */
  ageOutOfRange: boolean;
}

/** Por qué no se pudo calcular el % de grasa — se muestra tal cual al entrenador. */
export type BodyFatBlocker = "sex" | "birth_date" | "skinfolds";

export type BodyFatOutcome =
  | { ok: true; result: BodyFatResult }
  | { ok: false; missing: BodyFatBlocker[] };

export function calculateBodyFat(
  evaluation: SkinfoldSource,
  member: { sex?: string | null; birth_date?: string | null } | null | undefined,
  evaluatedOn?: string | Date | null
): BodyFatOutcome {
  const missing: BodyFatBlocker[] = [];

  const sex = member?.sex === "male" || member?.sex === "female" ? member.sex : null;
  if (!sex) missing.push("sex");

  const age = member?.birth_date ? ageAt(member.birth_date, evaluatedOn) : null;
  if (age === null) missing.push("birth_date");

  const sites = SKINFOLD_SITES.filter((s) => s.durnin);
  const values = sites.map((s) => siteValue(evaluation, s));
  if (values.some((v) => v === null || v <= 0)) missing.push("skinfolds");

  if (missing.length > 0) return { ok: false, missing };

  // Único punto donde se cambia de unidad: la fórmula está publicada en mm,
  // así que convertir acá evita tener que pensarlo en el resto del código.
  const sum4 = values.reduce<number>((acc, v) => acc + v!, 0);
  const sum4Mm = sum4 * CM_TO_MM;

  const { c, m } = durninCoefficients(sex!, age!);
  const density = c - m * Math.log10(sum4Mm);
  const percentage = 495 / density - 450;

  const weight = num(evaluation.weight_kg);
  const fatMassKg = weight !== null ? (weight * percentage) / 100 : null;
  const leanMassKg = weight !== null && fatMassKg !== null ? weight - fatMassKg : null;

  return {
    ok: true,
    result: {
      percentage,
      density,
      sum4,
      age: age!,
      sex: sex!,
      ...classifyBodyFat(sex!, percentage),
      fatMassKg,
      leanMassKg,
      ageOutOfRange: age! < 17 || age! > 72,
    },
  };
}

export const BODY_FAT_BLOCKER_LABELS: Record<BodyFatBlocker, string> = {
  sex: "falta el sexo del miembro",
  birth_date: "falta la fecha de nacimiento del miembro",
  skinfolds: "faltan pliegues (tricipital, bicipital, subescapular y suprailíaco)",
};

// ─── Suma total de pliegues ──────────────────────────────────────────────────

/** Suma de los 8 sitios medidos, en cm. Sirve para seguir la evolución. */
export function totalSkinfolds(evaluation: SkinfoldSource): { sum: number; sites: number } {
  let sum = 0;
  let sites = 0;
  for (const site of SKINFOLD_SITES) {
    const value = siteValue(evaluation, site);
    if (value !== null) {
      sum += value;
      sites += 1;
    }
  }
  return { sum, sites };
}

// ─── Edad ────────────────────────────────────────────────────────────────────

/**
 * Edad del miembro en la fecha de la evaluación — no la de hoy, para que una
 * evaluación vieja no cambie de resultado con el paso del tiempo.
 */
export function ageAt(
  birthDate: string | null | undefined,
  reference?: string | Date | null
): number | null {
  if (!birthDate) return null;
  const born = parseISO(birthDate);
  if (Number.isNaN(born.getTime())) return null;

  const ref = reference
    ? typeof reference === "string"
      ? parseISO(reference)
      : reference
    : new Date();
  if (Number.isNaN(ref.getTime())) return null;

  const years = differenceInYears(ref, born);
  return years >= 0 ? years : null;
}

// ─── Comparación entre evaluaciones ──────────────────────────────────────────

export interface EvaluationDelta {
  weightKg: number | null;
  sumSkinfolds: number | null;
  bodyFatPct: number | null;
}

/**
 * Diferencia contra la evaluación anterior. Negativo = bajó.
 * Solo compara la suma de pliegues cuando ambas midieron los mismos sitios;
 * si no, la resta compararía cosas distintas y engañaría.
 */
export function compareEvaluations(
  current: PhysicalEvaluation,
  previous: PhysicalEvaluation | null | undefined,
  member: { sex?: string | null; birth_date?: string | null } | null | undefined
): EvaluationDelta | null {
  if (!previous) return null;

  const currentWeight = num(current.weight_kg);
  const previousWeight = num(previous.weight_kg);

  const currentTotal = totalSkinfolds(current);
  const previousTotal = totalSkinfolds(previous);
  const comparableSites = currentTotal.sites === previousTotal.sites && currentTotal.sites > 0;

  const currentFat = calculateBodyFat(current, member, current.evaluated_on);
  const previousFat = calculateBodyFat(previous, member, previous.evaluated_on);

  return {
    weightKg:
      currentWeight !== null && previousWeight !== null ? currentWeight - previousWeight : null,
    sumSkinfolds: comparableSites ? currentTotal.sum - previousTotal.sum : null,
    bodyFatPct:
      currentFat.ok && previousFat.ok
        ? currentFat.result.percentage - previousFat.result.percentage
        : null,
  };
}

// ─── Formato ─────────────────────────────────────────────────────────────────

export function formatCm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2).replace(/\.?0+$/, "")} cm`;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatDelta(value: number | null, unit: string, decimals = 1): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)} ${unit}`;
}

export const SEX_LABELS: Record<string, string> = {
  male: "Hombre",
  female: "Mujer",
};
