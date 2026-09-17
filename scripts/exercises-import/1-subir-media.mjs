/**
 * Paso 1: sube las miniaturas y los GIFs al bucket exercise-media.
 *
 *   node scripts/exercises-import/1-subir-media.mjs <ruta-al-dataset>
 *
 * Es reanudable: los archivos que ya están se saltan, así que si se corta a
 * mitad se vuelve a correr y sigue donde quedó.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadEnv, runPool, BUCKET } from "./lib.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const DATASET = resolve(process.argv[2] || join(ROOT, "dataset"));
const { url, key } = loadEnv(ROOT);

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif" };

async function upload(localPath, remotePath) {
  const body = readFileSync(localPath);
  const ext = remotePath.slice(remotePath.lastIndexOf("."));

  const response = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${remotePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": MIME[ext] || "application/octet-stream",
        // upsert evita que un reintento falle por "ya existe"
        "x-upsert": "true",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(`${response.status} ${(await response.text()).slice(0, 120)}`);
  }
}

async function subirCarpeta(carpetaLocal, prefijoRemoto, etiqueta) {
  const dir = join(DATASET, carpetaLocal);
  const files = readdirSync(dir).filter((f) => !f.startsWith("."));
  console.log(`${etiqueta}: ${files.length} archivos`);

  const failures = await runPool(
    files,
    8,
    (file) => upload(join(dir, file), `${prefijoRemoto}/${file}`),
    etiqueta
  );

  if (failures.length) {
    console.error(`  ${failures.length} fallaron. Primeros 5:`);
    for (const f of failures.slice(0, 5)) console.error(`   ${f.item}: ${f.error}`);
  }
  return failures.length;
}

const fallidas =
  (await subirCarpeta("images", "images", "miniaturas")) +
  (await subirCarpeta("videos", "gifs", "gifs"));

console.log(fallidas === 0 ? "\nMedia subida completa." : `\nTerminó con ${fallidas} fallos.`);
process.exit(fallidas === 0 ? 0 : 1);
