// Utilidades compartidas por los dos pasos de la importación.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export const BUCKET = "exercise-media";

/**
 * Lee .env.local en vez de pedir la clave por argumento: así la service role
 * key no queda en el historial del shell ni en un archivo versionado
 * (.gitignore ya cubre .env*.local).
 */
export function loadEnv(root) {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) {
    console.error(
      "Falta .env.local en la raíz del proyecto.\n" +
        "Creálo con:\n\n  SUPABASE_SERVICE_ROLE_KEY=...\n\n" +
        "La clave está en Supabase → Settings → API → service_role."
    );
    process.exit(1);
  }

  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }

  const url =
    env.NEXT_PUBLIC_SUPABASE_URL || "https://fdecqsafkhjhbilawfcp.supabase.co";
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
    process.exit(1);
  }
  return { url, key };
}

/** Corre `worker` sobre `items` con concurrencia acotada y barra de progreso. */
export async function runPool(items, concurrency, worker, label) {
  let index = 0;
  let done = 0;
  const failures = [];

  async function next() {
    while (index < items.length) {
      const i = index++;
      try {
        await worker(items[i]);
      } catch (error) {
        failures.push({ item: items[i], error: error.message });
      }
      done++;
      if (done % 50 === 0 || done === items.length) {
        process.stdout.write(`\r${label}: ${done}/${items.length}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, next)
  );
  process.stdout.write("\n");
  return failures;
}

export function publicUrl(supabaseUrl, path) {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}
