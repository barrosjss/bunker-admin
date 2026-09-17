/**
 * Paso 2: inserta los ejercicios traducidos como catálogo global.
 *
 *   node scripts/exercises-import/2-cargar-ejercicios.mjs <import.json>
 *
 * Idempotente por (source, source_id): volver a correrlo actualiza en vez de
 * duplicar, así se puede recargar con nombres corregidos.
 *
 * Los ejercicios que el gym ya tenía cargados a mano no se tocan: si un nombre
 * importado coincide con uno existente, se omite. Es preferible perder un
 * duplicado del dataset que pisar algo que el entrenador escribió.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, publicUrl } from "./lib.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const IMPORT_FILE = resolve(process.argv[2] || "import.json");
const { url, key } = loadEnv(ROOT);

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  // Sin esto, on_conflict devuelve 409 en vez de actualizar la fila existente
  Prefer: "resolution=merge-duplicates,return=minimal",
};

/** Normaliza para comparar nombres: sin tildes, sin mayúsculas, sin puntuación. */
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

async function rest(path, init) {
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${(await response.text()).slice(0, 300)}`);
  }
  return response;
}

// ── Lo que ya existe, para no pisarlo ────────────────────────────────────────
const existing = await (
  await rest("exercises?select=name,source&limit=5000", { method: "GET" })
).json();

const manuales = new Set(
  existing.filter((e) => !e.source).map((e) => normalize(e.name))
);
console.log(`ya cargados: ${existing.length} (${manuales.size} hechos a mano)`);

// ── Filas a insertar ─────────────────────────────────────────────────────────
const items = JSON.parse(readFileSync(IMPORT_FILE, "utf8"));
const omitidos = [];

const rows = items
  .filter((item) => {
    if (manuales.has(normalize(item.name))) {
      omitidos.push(item.name);
      return false;
    }
    return true;
  })
  .map((item) => ({
    // NULL = catálogo global, disponible para cualquier establecimiento
    establishment_id: null,
    name: item.name,
    name_en: item.name_en,
    muscle_group: item.muscle_group,
    body_part: item.body_part,
    equipment: item.equipment,
    // Las instrucciones van en su propia columna: metidas en description
    // inflarían cada tarjeta del selector de ejercicios.
    description: null,
    instructions: item.instructions || null,
    instruction_steps: item.instruction_steps?.length ? item.instruction_steps : null,
    secondary_muscles: item.secondary_muscles?.length ? item.secondary_muscles : null,
    image_url: publicUrl(url, `images/${item.image_file}`),
    gif_url: publicUrl(url, `gifs/${item.gif_file}`),
    attribution: item.attribution,
    source: "hasaneyldrm/exercises-dataset",
    source_id: item.source_id,
  }));

console.log(`a insertar: ${rows.length}`);
if (omitidos.length) {
  console.log(`omitidos por coincidir con uno existente: ${omitidos.join(", ")}`);
}

// ── Inserción por lotes ──────────────────────────────────────────────────────
const LOTE = 200;
let insertados = 0;

for (let i = 0; i < rows.length; i += LOTE) {
  const lote = rows.slice(i, i + LOTE);
  await rest("exercises?on_conflict=source,source_id", {
    method: "POST",
    body: JSON.stringify(lote),
  });
  insertados += lote.length;
  process.stdout.write(`\rinsertados: ${insertados}/${rows.length}`);
}

process.stdout.write("\n");
console.log("Carga completa.");
