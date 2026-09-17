# Runbook: Importar el catálogo de ejercicios

Carga el dataset [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
(1.324 ejercicios) como catálogo global, traducido al español.

## Antes de empezar: la licencia de la media

El repo tiene **dos licencias distintas**:

- **Los datos** (nombres, músculos, equipo, instrucciones) son **MIT**. Libres de usar.
- **Las imágenes y GIFs son de Gym visual**, no del autor del dataset. Su `NOTICE.md` dice
  que clonar el repo **no otorga derechos sobre la media** y que para usarla en otro
  proyecto hay que conseguir licencia propia de
  [Gym visual](https://gymvisual.com/content/3-terms-and-conditions-of-use).

Por eso `exercises.attribution` es obligatoria y la UI la muestra en el detalle: la licencia
exige que la atribución viaje con cada uso. **No quites esa atribución.**

## Requisitos

1. Clonar el dataset:
   ```bash
   git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset.git
   ```
2. `.env.local` en la raíz con la clave de servicio (Supabase → Settings → API → `service_role`):
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   Hace falta porque la carga escribe en Storage y en filas globales
   (`establishment_id IS NULL`), que el RLS no permite con la clave pública.
3. Migración `022_exercise_media_and_instructions.sql` aplicada.
4. Bucket público `exercise-media` creado.

## Pasos

### 1. Generar las traducciones

```bash
cd scripts/exercises-import
python3 construir_import.py          # espera ./exercises-dataset al lado
```

Produce `import.json`. El traductor (`traducir.py`) es un diccionario determinista: el mismo
término inglés siempre da el mismo español, con el patrón del catálogo —movimiento primero,
equipo al final: *"smith narrow row"* → *"Remo estrecho en multipower"*.

Para cambiar un criterio (por ejemplo "Multipower" por "Smith"), se edita el diccionario y se
regenera: no se corrigen ejercicios de a uno.

### 2. Subir la media

```bash
node scripts/exercises-import/1-subir-media.mjs ../ruta/al/exercises-dataset
```

11 MB de miniaturas y 125 MB de GIFs. Es reanudable: si se corta, se vuelve a correr.

### 3. Cargar los ejercicios

```bash
node scripts/exercises-import/2-cargar-ejercicios.mjs scripts/exercises-import/import.json
```

Idempotente por `(source, source_id)`: volver a correrlo actualiza en vez de duplicar. Los
ejercicios cargados a mano en el gym **no se tocan** — si un nombre importado coincide con uno
existente, se omite.

## Verificar

```sql
select count(*) filter (where source is not null) as importados,
       count(*) filter (where source is null)     as propios,
       count(*) filter (where image_url is not null) as con_imagen
from exercises;
```

## Notas

- El `muscle_group` del dataset es el músculo **secundario**, no el principal (etiqueta el
  press de banca como "triceps"). El bueno es `target`, y es el que usa `construir_import.py`.
  Si alguna vez se reimporta desde otra fuente, revisar esto primero.
- `useExercises` pide `range(0, 4999)`: PostgREST corta en 1.000 filas y el catálogo pasa de eso.
