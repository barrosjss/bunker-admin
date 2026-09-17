"""
Arma el archivo final de importación: nombre traducido, vocabularios alineados
al catálogo que ya usa Bunker, instrucciones en español y rutas de media.
"""
import json
import re
import importlib.util

spec = importlib.util.spec_from_file_location("t", "traducir.py")
t = importlib.util.module_from_spec(spec)
spec.loader.exec_module(t)

# OJO: el `muscle_group` del dataset es el músculo SECUNDARIO, no el principal
# —etiqueta el press de banca como "triceps" y el curl como "forearms"—. El
# músculo que trabaja de verdad está en `target`, y es el que se usa acá.
# `muscle_group` pasa a engrosar los secundarios.
#
# Los 19 valores de `target` se colapsan sobre el vocabulario que el gym ya usa.
TARGET_GROUP = {
    "abs": "Core", "pectorals": "Pecho", "biceps": "Bíceps",
    "glutes": "Glúteos", "delts": "Hombros", "triceps": "Tríceps",
    "upper back": "Espalda", "lats": "Espalda", "traps": "Espalda",
    "spine": "Espalda", "calves": "Pantorrilla", "quads": "Cuádriceps",
    "hamstrings": "Femoral", "forearms": "Antebrazos",
    "cardiovascular system": "Cardio", "adductors": "Piernas",
    "abductors": "Piernas", "serratus anterior": "Core",
    "levator scapulae": "Cuello",
}

# Para traducir los secundarios, que sí vienen del campo `muscle_group`.
MUSCLE_GROUP = {
    "shoulders": "Hombros", "deltoids": "Hombros", "rotator cuff": "Hombros",
    "forearms": "Antebrazos", "wrist flexors": "Antebrazos",
    "wrist extensors": "Antebrazos", "wrists": "Antebrazos", "hands": "Antebrazos",
    "biceps": "Bíceps", "triceps": "Tríceps",
    "hamstrings": "Femoral", "quadriceps": "Cuádriceps", "glutes": "Glúteos",
    "obliques": "Core", "core": "Core", "abdominals": "Core",
    "hip flexors": "Core", "chest": "Pecho",
    "trapezius": "Espalda", "traps": "Espalda", "rhomboids": "Espalda",
    "upper back": "Espalda", "lower back": "Espalda",
    "latissimus dorsi": "Espalda", "lats": "Espalda",
    "calves": "Pantorrilla", "soleus": "Pantorrilla",
    "ankles": "Pantorrilla", "ankle stabilizers": "Pantorrilla",
}

EQUIPMENT = {
    "body weight": "Peso corporal", "dumbbell": "Mancuernas", "cable": "Polea",
    "barbell": "Barra", "leverage machine": "Máquina", "band": "Banda elástica",
    "smith machine": "Multipower", "kettlebell": "Kettlebell",
    "weighted": "Lastre", "stability ball": "Fitball", "ez barbell": "Barra Z",
    "assisted": "Asistido", "sled machine": "Trineo",
    "medicine ball": "Balón medicinal", "rope": "Cuerda",
    "roller": "Rueda abdominal", "resistance band": "Banda elástica",
    "bosu ball": "Bosu", "olympic barbell": "Barra olímpica",
    "wheel roller": "Rueda abdominal", "upper body ergometer": "Ergómetro de brazos",
    "skierg machine": "SkiErg", "hammer": "Martillo",
    "stationary bike": "Bicicleta estática", "tire": "Neumático",
    "trap bar": "Barra hexagonal", "elliptical machine": "Elíptica",
    "stepmill machine": "Escaladora",
}

BODY_PART = {
    "upper arms": "Brazos", "upper legs": "Piernas", "back": "Espalda",
    "waist": "Core", "chest": "Pecho", "shoulders": "Hombros",
    "lower legs": "Pantorrilla", "lower arms": "Antebrazos",
    "cardio": "Cardio", "neck": "Cuello",
}

BUCKET = "exercise-media"


def main():
    items = json.load(open("exercises-dataset/data/exercises.json"))
    out, seen_names = [], {}

    for item in items:
        name, _ = t.translate(item["name"])

        # Dos nombres en inglés pueden colapsar en el mismo español; se
        # desambigua con el equipo, y si aún choca, con el id del dataset.
        if name in seen_names:
            equipment = EQUIPMENT.get(item.get("equipment"), "")
            candidate = f"{name} ({equipment})" if equipment else name
            if candidate in seen_names:
                candidate = f"{name} ({item['id']})"
            name = candidate
        seen_names[name] = True

        instructions = (item.get("instructions") or {}).get("es") or ""
        steps = item.get("instruction_steps") or []
        if isinstance(steps, dict):
            steps = steps.get("es") or []

        out.append({
            "source_id": item["id"],
            "name": name,
            "name_en": item["name"],
            "muscle_group": TARGET_GROUP.get(item.get("target")),
            "body_part": BODY_PART.get(item.get("body_part")),
            "equipment": EQUIPMENT.get(item.get("equipment")),
            "instructions": instructions,
            "instruction_steps": steps if isinstance(steps, list) else [],
            # El muscle_group del dataset es secundario, así que se suma acá
            "secondary_muscles": sorted({
                MUSCLE_GROUP.get(m, m)
                for m in list(item.get("secondary_muscles") or [])
                + ([item["muscle_group"]] if item.get("muscle_group") else [])
                if MUSCLE_GROUP.get(m, m)
            } - {TARGET_GROUP.get(item.get("target"))}),
            "image_file": item["image"].split("/")[-1],
            "gif_file": item["gif_url"].split("/")[-1],
            "attribution": item.get("attribution") or "© Gym visual — https://gymvisual.com/",
        })

    json.dump(out, open("import.json", "w"), ensure_ascii=False, indent=1)

    sin_grupo = sum(1 for o in out if not o["muscle_group"])
    sin_equipo = sum(1 for o in out if not o["equipment"])
    print(f"ejercicios listos: {len(out)}")
    print(f"nombres únicos: {len(seen_names)}")
    print(f"sin grupo muscular mapeado: {sin_grupo}")
    print(f"sin equipo mapeado: {sin_equipo}")
    print(f"con instrucciones en español: {sum(1 for o in out if o['instructions'])}")
    print()
    import collections
    print("--- grupos resultantes ---")
    for g, n in collections.Counter(o["muscle_group"] for o in out).most_common():
        print(f"  {g}: {n}")


if __name__ == "__main__":
    main()
