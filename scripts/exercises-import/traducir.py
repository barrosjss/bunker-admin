"""
Traduce los nombres del dataset al español siguiendo el patrón que ya usa el
catálogo de Bunker: movimiento + modificadores, y el equipo al final
("Curl con barra", "Crunch en polea", "Aperturas con mancuernas").

Es determinista a propósito: el mismo término inglés siempre da el mismo
término español, así el catálogo queda coherente y las correcciones se hacen
una sola vez en el diccionario en vez de ejercicio por ejercicio.
"""
import json
import re
import unicodedata

# ── Equipo: se detecta, se saca del nombre y se reubica al final ──────────────
# El orden importa: primero las frases largas, para que "ez barbell" no lo
# capture "barbell".
EQUIPMENT_SUFFIX = [
    ("leverage machine", "en máquina"),
    ("smith machine", "en multipower"),
    ("sled machine", "en trineo"),
    ("stability ball", "en fitball"),
    ("exercise ball", "en fitball"),
    ("medicine ball", "con balón medicinal"),
    ("bosu ball", "en bosu"),
    ("wheel roller", "con rueda abdominal"),
    ("olympic barbell", "con barra olímpica"),
    ("ez barbell", "con barra Z"),
    ("ez-barbell", "con barra Z"),
    ("ez bar", "con barra Z"),
    ("ez-bar", "con barra Z"),
    ("sz-bar", "con barra Z"),
    ("trap bar", "con barra hexagonal"),
    ("t-bar", "con barra T"),
    ("v-bar", "con barra V"),
    ("cambered bar", "con barra curva"),
    ("resistance band", "con banda elástica"),
    ("battling ropes", "con cuerdas de batalla"),
    ("upper body ergometer", "en ergómetro de brazos"),
    ("stepmill machine", "en escaladora"),
    ("elliptical machine", "en elíptica"),
    ("skierg machine", "en skierg"),
    ("stationary bike", "en bicicleta estática"),
    ("body weight", ""),
    ("bodyweight", ""),
    ("barbell", "con barra"),
    ("dumbbells", "con mancuernas"),
    ("dumbbell", "con mancuernas"),
    ("kettlebell", "con kettlebell"),
    ("cable", "en polea"),
    ("pulley", "en polea"),
    ("lever", "en máquina"),
    ("smith", "en multipower"),
    ("sled", "en trineo"),
    ("band", "con banda elástica"),
    ("rope", "con cuerda"),
    ("roller", "con rueda abdominal"),
    ("weighted", "con lastre"),
    ("assisted", "asistido"),
    ("treadmill", "en cinta"),
    ("landmine", "en landmine"),
    ("trainer", "en TRX"),
]

# ── Frases: se aplican antes que las palabras sueltas, de más larga a más corta ──
PHRASES = {
    # Movimientos compuestos
    "biceps curl": "curl de bíceps",
    "bicep curl": "curl de bíceps",
    "triceps kickback": "patada de tríceps",
    "tricep kickback": "patada de tríceps",
    "shoulder raise": "elevación de hombros",
    "knee raise": "elevación de rodillas",
    "hip raise": "elevación de cadera",
    "heel raise": "elevación de talones",
    "toe raise": "elevación de puntas",
    "side bend": "flexión lateral",
    "air bike": "bicicleta en el aire",
    "heel touchers": "toques de talón",
    "toe touch": "toque de puntas",
    "bench press": "press de banca",
    "chest press": "press de pecho",
    "shoulder press": "press de hombros",
    "military press": "press militar",
    "leg press": "prensa de piernas",
    "calf press": "press de gemelos",
    "french press": "press francés",
    "upright row": "remo al mentón",
    "good morning": "buenos días",
    "lat pulldown": "jalón al pecho",
    "pull up": "dominada",
    "pull-up": "dominada",
    "pull-ups": "dominadas",
    "chin up": "dominada supina",
    "chin-up": "dominada supina",
    "chin-ups": "dominadas supinas",
    "muscle-up": "muscle-up",
    "push up": "flexión",
    "push-up": "flexión",
    "push-ups": "flexiones",
    "sit up": "abdominal",
    "sit-up": "abdominal",
    "sit-ups": "abdominales",
    "v-up": "abdominal en V",
    "v-sit": "V-sit",
    "l-sit": "L-sit",
    "leg raise": "elevación de piernas",
    "leg-hip raise": "elevación de piernas y cadera",
    "lateral raise": "elevación lateral",
    "front raise": "elevación frontal",
    "calf raise": "elevación de talones",
    "y-raise": "elevación en Y",
    "t-raise": "elevación en T",
    "leg extension": "extensión de piernas",
    "leg curl": "curl femoral",
    "triceps extension": "extensión de tríceps",
    "tricep extension": "extensión de tríceps",
    "triceps pushdown": "extensión de tríceps en polea",
    "triceps dip": "fondos de tríceps",
    "preacher curl": "curl predicador",
    "concentration curl": "curl concentrado",
    "hammer curl": "curl martillo",
    "zottman curl": "curl Zottman",
    "reverse curl": "curl inverso",
    "spider curl": "curl araña",
    "drag curl": "curl drag",
    "wrist curl": "curl de muñeca",
    "deadlift": "peso muerto",
    "romanian deadlift": "peso muerto rumano",
    "stiff leg deadlift": "peso muerto piernas rígidas",
    "sumo deadlift": "peso muerto sumo",
    "hack squat": "sentadilla hack",
    "front squat": "sentadilla frontal",
    "split squat": "sentadilla búlgara",
    "sissy squat": "sentadilla sissy",
    "goblet squat": "sentadilla goblet",
    "pistol squat": "sentadilla pistol",
    "cossack squat": "sentadilla cosaca",
    "jump squat": "sentadilla con salto",
    "shoulder shrug": "encogimiento de hombros",
    "skull crusher": "rompecráneos",
    "skullcrusher": "rompecráneos",
    "mountain climber": "escalador",
    "dead bug": "dead bug",
    "hip thrust": "hip thrust",
    "hip abduction": "abducción de cadera",
    "hip adduction": "aducción de cadera",
    "glute bridge": "puente de glúteos",
    "reverse fly": "aperturas invertidas",
    "reverse flyes": "aperturas invertidas",
    "farmers walk": "paseo del granjero",
    "turkish get up": "turkish get-up",
    "clean and jerk": "cargada y envión",
    "power clean": "cargada de potencia",
    "hang clean": "cargada desde suspensión",
    "face pull": "face pull",
    "renegade row": "remo renegado",
    "pendlay row": "remo Pendlay",
    "arnold press": "press Arnold",
    "bradford press": "press Bradford",
    "svend press": "press Svend",
    "jm press": "press JM",
    "w-press": "press en W",
    "around the world": "círculos",
    "wood chop": "leñador",
    "russian twist": "giro ruso",
    "windshield wipers": "limpiaparabrisas",
    "flutter kick": "patada de aleteo",
    "scissor kick": "patada de tijera",
    "jumping jack": "salto de tijera",
    "wall slide": "deslizamiento en pared",
    "inverted row": "remo invertido",
    "pull through": "pull through",
    "bird dog": "bird dog",

    # Modificadores compuestos
    "one arm": "a un brazo",
    "single arm": "a un brazo",
    "two arm": "a dos brazos",
    "one leg": "a una pierna",
    "single leg": "a una pierna",
    "one legged": "a una pierna",
    "single leg": "a una pierna",
    "bent over": "inclinado",
    "bent-over": "inclinado",
    "close grip": "agarre cerrado",
    "close-grip": "agarre cerrado",
    "wide grip": "agarre abierto",
    "wide-grip": "agarre abierto",
    "narrow grip": "agarre estrecho",
    "reverse grip": "agarre inverso",
    "reverse-grip": "agarre inverso",
    "neutral grip": "agarre neutro",
    "mixed grip": "agarre mixto",
    "behind the neck": "tras nuca",
    "behind neck": "tras nuca",
    "behind head": "tras nuca",
    "over head": "sobre la cabeza",
    "straight arm": "brazo recto",
    "straight leg": "pierna recta",
    "on floor": "en el suelo",
    "on bench": "en banco",
    "on wall": "en pared",
    "against wall": "contra la pared",
    "all fours": "en cuatro apoyos",
    "side to side": "de lado a lado",
    "side-to-side": "de lado a lado",
    "up down": "arriba y abajo",
    "half kneeling": "media rodilla",
    "seated on floor": "sentado en el suelo",
    "palms up": "palmas arriba",
    "palms down": "palmas abajo",
    "palm in": "palma hacia dentro",
    "toes out": "puntas hacia fuera",
    "toes in": "puntas hacia dentro",
    "45 degrees": "a 45 grados",
    "90 degrees": "a 90 grados",
    "rear delt": "deltoides posterior",
    "rear deltoid": "deltoides posterior",
    "front delt": "deltoides anterior",
    "side delt": "deltoides lateral",
    "lower back": "zona lumbar",
    "upper back": "espalda alta",
    "lower chest": "pecho inferior",
    "upper chest": "pecho superior",
    "hip flexor": "flexor de cadera",
    "rotator cuff": "manguito rotador",
    "latissimus dorsi": "dorsal ancho",
    "rectus femoris": "recto femoral",
    "pectoralis major": "pectoral mayor",
}

# ── Palabras sueltas ─────────────────────────────────────────────────────────
WORDS = {
    # Movimientos
    "curl": "curl", "curls": "curls", "press": "press", "presses": "press",
    "raise": "elevación", "raises": "elevaciones", "row": "remo", "rows": "remos",
    "squat": "sentadilla", "squats": "sentadillas", "extension": "extensión",
    "extensions": "extensiones", "fly": "aperturas", "flyes": "aperturas",
    "flys": "aperturas", "crossover": "cruce", "crossovers": "cruces",
    "crunch": "crunch", "crunches": "crunches", "dip": "fondos", "dips": "fondos",
    "lunge": "zancada", "lunges": "zancadas", "pulldown": "jalón",
    "pullover": "pullover", "shrug": "encogimiento", "shrugs": "encogimientos",
    "kickback": "patada", "kickbacks": "patadas", "pushdown": "extensión en polea",
    "plank": "plancha", "bridge": "puente", "stretch": "estiramiento",
    "twist": "giro", "twists": "giros", "twisting": "con giro",
    "hyperextension": "hiperextensión", "clean": "cargada", "snatch": "arranque",
    "jerk": "envión", "swing": "swing", "swings": "swings", "thruster": "thruster",
    "burpee": "burpee", "burpees": "burpees", "jump": "salto", "jumps": "saltos",
    "hop": "salto", "hops": "saltos", "walk": "caminata", "walking": "caminando",
    "run": "carrera", "sprint": "sprint", "sprints": "sprints", "climb": "escalada",
    "carry": "acarreo", "throw": "lanzamiento", "slam": "golpe", "pull": "tirón",
    "push": "empuje", "lift": "levantamiento", "lifting": "levantamiento",
    "step-up": "step-up", "stepup": "step-up", "bend": "flexión",
    "bends": "flexiones", "rotation": "rotación", "rotations": "rotaciones",
    "abduction": "abducción", "adduction": "aducción", "flexion": "flexión",
    "pronation": "pronación", "supination": "supinación", "tilt": "inclinación",
    "reach": "alcance", "touch": "toque", "touchers": "toques",
    "squeeze": "contracción", "hold": "sostén", "drive": "empuje",
    "fallout": "fallout", "rollout": "rollout", "rollerout": "rollout",
    "jackknife": "navaja", "windmill": "molino", "superman": "superman",
    "butterfly": "mariposa", "scissor": "tijera", "circles": "círculos",
    "march": "marcha", "cocoons": "cocoons", "inchworm": "oruga",
    "handstand": "pino", "planche": "planche", "pike": "pica",
    "kip": "kipping", "kipping": "kipping", "skin": "skin",

    # Modificadores
    "seated": "sentado", "sitted": "sentado", "standing": "de pie",
    "lying": "acostado", "reclining": "recostado", "kneeling": "arrodillado",
    "prone": "boca abajo", "supine": "boca arriba", "hanging": "colgado",
    "incline": "inclinado", "inclined": "inclinado", "decline": "declinado",
    "flat": "plano", "reverse": "inverso", "reversed": "inverso",
    "inverse": "inverso", "inverted": "invertido", "alternate": "alterno",
    "alternating": "alterno", "alternated": "alterno", "single": "unilateral",
    "unilateral": "unilateral", "double": "doble", "wide": "abierto",
    "narrow": "estrecho", "close": "cerrado", "closer": "cerrado",
    "high": "alto", "low": "bajo", "front": "frontal", "rear": "posterior",
    "back": "espalda", "side": "lateral", "lateral": "lateral",
    "overhead": "sobre la cabeza", "underhand": "supino", "overhand": "prono",
    "pronated": "pronado", "supinated": "supinado", "neutral": "neutro",
    "half": "medio", "full": "completo", "quarter": "cuarto",
    "deep": "profundo", "partial": "parcial", "isometric": "isométrico",
    "static": "estático", "dynamic": "dinámico", "explosive": "explosivo",
    "slow": "lento", "quick": "rápido", "elevated": "elevado",
    "raised": "elevado", "extended": "extendido", "bent": "flexionado",
    "cross": "cruzado", "crossed": "cruzado", "diagonal": "diagonal",
    "vertical": "vertical", "horizontal": "horizontal", "circular": "circular",
    "rotational": "rotacional", "twisted": "girado", "straight": "recto",
    "stiff": "rígido", "wall": "en pared", "floor": "en el suelo",
    "bench": "en banco", "chair": "en silla", "box": "en cajón",
    "bar": "barra", "bars": "barras", "parallel": "paralelas",
    "preacher": "predicador", "peacher": "predicador", "scott": "scott",
    "concentration": "concentrado", "hammer": "martillo", "spider": "araña",
    "zercher": "zercher", "sumo": "sumo", "romanian": "rumano",
    "bulgarian": "búlgara", "goblet": "goblet", "pistol": "pistol",
    "military": "militar", "french": "francés", "arnold": "arnold",
    "assisted": "asistido", "supported": "apoyado", "self": "auto",
    "weighted": "con lastre", "resistance": "resistencia", "band": "banda",
    "suspended": "suspendido", "fixed": "fijo", "free": "libre",
    "modified": "modificado", "advanced": "avanzado", "intermediate": "intermedio",
    "basic": "básico", "variation": "variante", "grip": "agarre",
    "stance": "postura", "position": "posición", "motion": "movimiento",
    "range": "rango", "angle": "ángulo", "degrees": "grados",
    "attachment": "accesorio", "handle": "agarradera", "strap": "correa",
    "straps": "correas", "towel": "toalla", "rack": "rack", "cage": "jaula",
    "platform": "plataforma", "stepbox": "step", "step": "step",
    "bosu": "bosu", "ball": "balón", "wheel": "rueda", "pad": "almohadilla",

    # Zonas del cuerpo
    "chest": "pecho", "pec": "pectoral", "pecs": "pectorales",
    "shoulder": "hombro", "shoulders": "hombros", "delt": "deltoides",
    "delts": "deltoides", "deltoid": "deltoides", "arm": "brazo",
    "arms": "brazos", "biceps": "bíceps", "bicep": "bíceps",
    "triceps": "tríceps", "tricep": "tríceps", "forearm": "antebrazo",
    "forearms": "antebrazos", "wrist": "muñeca", "wrists": "muñecas",
    "hand": "mano", "hands": "manos", "finger": "dedos", "elbow": "codo",
    "leg": "pierna", "legs": "piernas", "legged": "pierna",
    "thigh": "muslo", "quad": "cuádriceps", "quads": "cuádriceps",
    "hamstring": "isquiotibial", "hamstrings": "isquiotibiales",
    "glute": "glúteo", "glutes": "glúteos", "gluteus": "glúteo",
    "calf": "gemelo", "calves": "gemelos", "soleus": "sóleo",
    "ankle": "tobillo", "ankles": "tobillos", "knee": "rodilla",
    "knees": "rodillas", "hip": "cadera", "hips": "caderas",
    "waist": "cintura", "abs": "abdominales", "abdominal": "abdominal",
    "abdominals": "abdominales", "ab": "abdominal", "core": "core",
    "oblique": "oblicuo", "obliques": "oblicuos", "lat": "dorsal",
    "lats": "dorsales", "trap": "trapecio", "traps": "trapecios",
    "trapezius": "trapecio", "rhomboids": "romboides", "neck": "cuello",
    "spine": "columna", "scapula": "escápula", "scapular": "escapular",
    "pelvic": "pélvico", "groin": "ingle", "adductor": "aductor",
    "abductor": "abductor", "femoral": "femoral", "tibialis": "tibial",
    "peroneals": "peroneos", "piriformis": "piriforme", "flexor": "flexor",
    "body": "cuerpo", "head": "cabeza", "toe": "punta", "toes": "puntas",
    "heel": "talón", "foot": "pie", "feet": "pies", "inner": "interno",
    "outer": "externo", "upper": "superior", "lower": "inferior",
    "middle": "medio", "internal": "interno", "external": "externo",
    "posterior": "posterior", "anterior": "anterior",

    # Conectores
    "with": "con", "on": "en", "in": "en", "to": "a", "and": "y",
    "of": "de", "from": "desde", "over": "sobre", "under": "bajo",
    "between": "entre", "through": "a través", "across": "a través",
    "against": "contra", "behind": "detrás", "above": "arriba",
    "outside": "exterior", "inside": "interior", "the": "", "a": "",
    "an": "", "male": "", "female": "", "one": "uno", "two": "dos",
    "three": "tres", "both": "ambos", "all": "todo", "off": "",
    "up": "arriba", "down": "abajo", "out": "afuera", "forward": "adelante",
    "backward": "atrás", "left": "izquierdo", "right": "derecho",
}


# ── Cola larga: términos raros y nombres propios ─────────────────────────────
# Los epónimos (Zottman, Pallof, Gironda...) se dejan como están: son el nombre
# del ejercicio, no una palabra a traducir.
WORDS.update({
    "air": "al aire", "angled": "en ángulo", "anti": "anti", "apart": "separados",
    "around": "alrededor", "astride": "a horcajadas", "balance": "equilibrio",
    "bear": "oso", "benches": "bancos", "bicycle": "bicicleta", "big": "grande",
    "bike": "bicicleta", "blaster": "blaster", "board": "tabla",
    "body-up": "body-up", "bottoms": "fondo", "bottoms-up": "bottoms-up",
    "bowling": "bowling", "boxing": "boxeo", "breeding": "breeding",
    "butt-ups": "butt-ups", "can": "lata", "captains": "del capitán",
    "caster": "caster", "cat": "gato", "catch": "recepción", "chin": "mentón",
    "clap": "con palmada", "clasped": "entrelazadas", "clean-grip": "agarre de cargada",
    "clock": "reloj", "contralateral": "contralateral", "crab": "cangrejo",
    "crawl": "gateo", "cross-over": "cruce", "cuban": "cubana",
    "curl-up": "curl-up", "curtsey": "reverencia", "cycle": "ciclo",
    "depresor": "depresor", "depth": "de profundidad", "diamond": "diamante",
    "dip-": "fondos", "dog": "perro", "donkey": "burro", "drop": "drop",
    "elbow-to-knee": "codo a rodilla", "elevator": "ascensor",
    "elliptical": "elíptica", "equipment": "equipo", "ergometer": "ergómetro",
    "face": "cara", "facing": "mirando", "figure": "figura", "flag": "bandera",
    "flip": "volteo", "flutter": "aleteo", "forth": "adelante", "frog": "rana",
    "glute-ham": "glute-ham", "gorilla": "gorila", "gravity": "gravedad",
    "greatest": "greatest", "gripless": "sin agarre", "gripper": "pinza",
    "ground": "suelo", "guillotine": "guillotina", "hack": "hack",
    "hang": "en suspensión", "hindu": "hindú", "hook": "gancho", "hug": "abrazo",
    "hyper": "hiper", "impossible": "imposible", "into": "hacia", "iron": "hierro",
    "jack": "jack", "keens": "rodillas", "kick": "patada", "kicks": "patadas",
    "knife": "navaja", "l-": "L", "lean": "inclinado", "machine": "máquina",
    "monster": "monster", "multiple": "múltiple", "muscle": "muscle",
    "negative": "negativo", "outstretched": "extendido", "palm": "palma",
    "palm-in": "palma hacia dentro", "palms": "palmas", "pass": "pase",
    "pike-to-cobra": "de pica a cobra", "pin": "pin", "plus": "más",
    "plyo": "pliométrico", "point": "punta", "pose": "postura", "potty": "potty",
    "power": "de potencia", "pro": "pro", "pronate-grip": "agarre pronado",
    "pull-in": "pull-in", "pyramid": "pirámide", "release": "liberación",
    "reps": "repeticiones", "response": "respuesta", "retractor": "retractor",
    "revers": "inverso", "ring": "en anillas", "rocking": "con balanceo",
    "rollerer": "rollout", "rotary": "rotatorio", "rotate": "rotación",
    "round": "redondo", "runners": "de corredor", "russian": "ruso",
    "saw": "sierra", "seesaw": "balancín", "semi": "semi", "sequence": "secuencia",
    "short": "corto", "sit": "sentado", "skater": "patinador", "ski": "esquí",
    "skier": "esquiador", "skull": "cráneo", "sledge": "mazo",
    "slide": "deslizamiento", "slingers": "slingers", "speed": "de velocidad",
    "spell": "spell", "sphinx": "esfinge", "split": "split", "squad": "squad",
    "squatting": "en sentadilla", "stabilization": "estabilización",
    "staircase": "escalera", "star": "estrella", "stepmill": "escaladora",
    "sternum": "esternón", "stirrups": "estribos", "stork": "cigüeña",
    "straddle": "straddle", "stride": "zancada", "style": "estilo",
    "supper": "supper", "support": "apoyo", "swimmer": "nadador", "t": "T",
    "tap": "toque", "tennis": "tenis", "thrusts": "empujes", "tire": "neumático",
    "tuck": "recogido", "twin": "doble", "two-one": "dos-uno",
    "up-down": "arriba y abajo", "upright": "vertical", "ups": "subidas",
    "upward": "hacia arriba", "waiter": "camarero", "wind": "viento",
    "wipers": "limpiaparabrisas", "world": "mundo", "yoga": "yoga",
    "archer": "arquero", "cossack": "cosaca", "prisoner": "prisionero",
    "pirate": "pirata", "zottman": "Zottman", "pallof": "Pallof",
    "bradford": "Bradford", "frankenstein": "Frankenstein", "gironda": "Gironda",
    "hyght": "Hyght", "janda": "Janda", "jefferson": "Jefferson", "jm": "JM",
    "judo": "judo", "kayak": "kayak", "korean": "coreana", "london": "London",
    "maltese": "maltesa", "otis": "Otis", "rocky": "Rocky", "stalder": "Stalder",
    "tate": "Tate", "thibaudeau": "Thibaudeau",
    # Salidas propias y marcadores sueltos del dataset
    "variante": "variante", "pov": "", "v": "",
})


# ── Reordenamiento: en español el movimiento va primero ──────────────────────
# El inglés antepone los modificadores ("narrow row"); el español los pospone
# ("remo estrecho"). Sin este paso el catálogo queda con sintaxis inglesa.
# Cada entrada es (frase, género) para poder concordar los adjetivos.
HEADS = [
    ("curl de bíceps", "m"), ("patada de tríceps", "f"),
    ("elevación de hombros", "f"), ("elevación de rodillas", "f"),
    ("elevación de cadera", "f"), ("elevación de puntas", "f"),
    ("flexión lateral", "f"), ("toques de talón", "m"),
    ("toque de puntas", "m"), ("bicicleta en el aire", "f"),
    ("press de banca", "m"), ("press de pecho", "m"), ("press de hombros", "m"),
    ("press militar", "m"), ("press francés", "m"), ("press de gemelos", "m"),
    ("press Arnold", "m"), ("press Bradford", "m"), ("press Svend", "m"),
    ("press JM", "m"), ("press en W", "m"),
    ("prensa de piernas", "f"), ("peso muerto rumano", "m"),
    ("peso muerto piernas rígidas", "m"), ("peso muerto sumo", "m"),
    ("peso muerto", "m"),
    ("extensión de tríceps en polea", "f"), ("extensión de tríceps", "f"),
    ("extensión de piernas", "f"), ("extensión en polea", "f"),
    ("elevación de piernas y cadera", "f"), ("elevación de piernas", "f"),
    ("elevación de talones", "f"), ("elevación lateral", "f"),
    ("elevación frontal", "f"), ("elevación en Y", "f"), ("elevación en T", "f"),
    ("encogimiento de hombros", "m"), ("jalón al pecho", "m"),
    ("remo al mentón", "m"), ("remo invertido", "m"), ("remo renegado", "m"),
    ("remo Pendlay", "m"),
    ("curl femoral", "m"), ("curl predicador", "m"), ("curl concentrado", "m"),
    ("curl martillo", "m"), ("curl Zottman", "m"), ("curl inverso", "m"),
    ("curl araña", "m"), ("curl drag", "m"), ("curl de muñeca", "m"),
    ("sentadilla búlgara", "f"), ("sentadilla frontal", "f"),
    ("sentadilla hack", "f"), ("sentadilla sissy", "f"),
    ("sentadilla goblet", "f"), ("sentadilla pistol", "f"),
    ("sentadilla cosaca", "f"), ("sentadilla con salto", "f"),
    ("puente de glúteos", "m"), ("aperturas invertidas", "f"),
    ("abducción de cadera", "f"), ("aducción de cadera", "f"),
    ("paseo del granjero", "m"), ("giro ruso", "m"),
    ("dominadas supinas", "f"), ("dominada supina", "f"),
    ("fondos de tríceps", "m"), ("buenos días", "m"),
    ("cargada de potencia", "f"), ("cargada desde suspensión", "f"),
    ("cargada y envión", "f"), ("patada de aleteo", "f"),
    ("patada de tijera", "f"), ("salto de tijera", "m"),
    ("deslizamiento en pared", "m"), ("escalador", "m"),
    ("rompecráneos", "m"), ("hip thrust", "m"), ("face pull", "m"),
    ("dead bug", "m"), ("bird dog", "m"), ("turkish get-up", "m"),
    ("muscle-up", "m"), ("pull through", "m"), ("limpiaparabrisas", "m"),
    ("abdominal en V", "m"), ("hiperextensión", "f"), ("dominadas", "f"),
    ("dominada", "f"), ("flexiones", "f"), ("flexión", "f"),
    ("abdominales", "m"), ("abdominal", "m"), ("sentadillas", "f"),
    ("sentadilla", "f"), ("aperturas", "f"), ("elevaciones", "f"),
    ("elevación", "f"), ("extensiones", "f"), ("extensión", "f"),
    ("encogimientos", "m"), ("encogimiento", "m"), ("pullover", "m"),
    ("zancadas", "f"), ("zancada", "f"), ("crunches", "m"), ("crunch", "m"),
    ("fondos", "m"), ("jalón", "m"), ("remos", "m"), ("remo", "m"),
    ("curls", "m"), ("curl", "m"), ("press", "m"), ("plancha", "f"),
    ("puente", "m"), ("estiramiento", "m"), ("patadas", "f"), ("patada", "f"),
    ("cruces", "m"), ("cruce", "m"), ("giros", "m"), ("giro", "m"),
    ("cargada", "f"), ("arranque", "m"), ("envión", "m"), ("swing", "m"),
    ("thruster", "m"), ("burpees", "m"), ("burpee", "m"), ("saltos", "m"),
    ("salto", "m"), ("caminata", "f"), ("carrera", "f"), ("sprint", "m"),
    ("rollout", "m"), ("navaja", "f"), ("molino", "m"), ("superman", "m"),
    ("mariposa", "f"), ("círculos", "m"), ("marcha", "f"), ("oruga", "f"),
    ("pino", "m"), ("step-up", "m"), ("escalada", "f"), ("acarreo", "m"),
    ("gateo", "m"), ("tirón", "m"), ("empuje", "m"), ("rotación", "f"),
]

# Adjetivos que cambian con el género del movimiento
FEMININE = {
    "completo": "completa", "medio": "media", "inverso": "inversa",
    "invertido": "invertida", "alterno": "alterna", "sentado": "sentada",
    "acostado": "acostada", "arrodillado": "arrodillada", "inclinado": "inclinada",
    "declinado": "declinada", "plano": "plana", "cerrado": "cerrada",
    "abierto": "abierta", "estrecho": "estrecha", "alto": "alta",
    "bajo": "baja", "recto": "recta", "rígido": "rígida", "elevado": "elevada",
    "extendido": "extendida", "flexionado": "flexionada", "cruzado": "cruzada",
    "girado": "girada", "unilateral": "unilateral", "asistido": "asistida",
    "apoyado": "apoyada", "suspendido": "suspendida", "fijo": "fija",
    "modificado": "modificada", "avanzado": "avanzada", "profundo": "profunda",
    "parcial": "parcial", "isométrico": "isométrica", "estático": "estática",
    "dinámico": "dinámica", "explosivo": "explosiva", "lento": "lenta",
    "rápido": "rápida", "corto": "corta", "redondo": "redonda",
    "pronado": "pronada", "supinado": "supinada", "neutro": "neutra",
    "posterior": "posterior", "anterior": "anterior", "supino": "supina",
    "prono": "prona", "pliométrico": "pliométrica", "doble": "doble",
}


def reorder(text: str):
    """Pone el movimiento al frente y concuerda los adjetivos con su género."""
    for head, gender in HEADS:
        pattern = r"\b" + re.escape(head) + r"\b"
        match = re.search(pattern, text)
        if not match:
            continue
        rest = (text[: match.start()] + " " + text[match.end():]).strip()
        rest = re.sub(r"\s+", " ", rest)
        if gender == "f":
            # "agarre cerrado" concuerda con "agarre", que es masculino: si el
            # movimiento es femenino no debe arrastrar a estas frases fijas.
            protected = {}
            for i, phrase in enumerate(re.findall(r"agarre \w+", rest)):
                key = f"\x01{i}\x01"
                protected[key] = phrase
                rest = rest.replace(phrase, key, 1)
            rest = " ".join(FEMININE.get(w, w) for w in rest.split())
            for key, phrase in protected.items():
                rest = rest.replace(key, phrase)
        return f"{head} {rest}".strip()
    return text


def strip_equipment(name: str):
    """
    Saca TODOS los equipos del nombre y devuelve (resto, sufijos en español).

    Acumular importa: "cable seated row (v-bar)" nombra dos cosas, y quedarse
    con la primera deja la otra sin traducir.
    """
    low = name.lower()
    suffixes = []
    for english, spanish in EQUIPMENT_SUFFIX:
        pattern = r"\b" + re.escape(english) + r"\b"
        if re.search(pattern, low):
            low = re.sub(pattern, " ", low)
            if spanish and spanish not in suffixes:
                suffixes.append(spanish)
    return re.sub(r"\s+", " ", low).strip(), " ".join(suffixes)


def translate_body(text: str):
    """
    Traduce el cuerpo del nombre. Devuelve (español, tokens que quedaron en inglés).

    Las frases se sustituyen por marcadores antes de traducir palabra por
    palabra: si no, el español que producen se vuelve a analizar y se reporta
    como "sin traducir".
    """
    placeholders = {}
    index = 0
    for english in sorted(PHRASES, key=len, reverse=True):
        pattern = r"\b" + re.escape(english) + r"\b"
        while re.search(pattern, text):
            key = f"\x00{index}\x00"
            placeholders[key] = PHRASES[english]
            text = re.sub(pattern, key, text, count=1)
            index += 1

    missing = []

    def replace(match):
        word = match.group(0)
        if word in WORDS:
            return WORDS[word]
        missing.append(word)
        return word

    text = re.sub(r"[a-z][a-z'\-]*", replace, text)
    for key, spanish in placeholders.items():
        text = text.replace(key, spanish)
    return text, missing


def translate(name: str):
    text = name.lower().replace("в°", "°")
    # Marcadores del dataset que no aportan al nombre del ejercicio
    text = re.sub(r"\((male|female|pov)\)", " ", text)
    # "v. 2" en el dataset marca una variante del mismo ejercicio
    text = re.sub(r"\bv\.?\s*(\d+)\b", r"(variante \1)", text)
    body, suffix = strip_equipment(text)
    spanish, missing = translate_body(body)
    spanish = reorder(spanish)
    # "with" traduce a "con", que choca con el "con mancuernas" del equipo
    spanish = re.sub(r"\b(con|en)\s*$", "", spanish).strip()
    full = f"{spanish} {suffix}".strip()
    full = re.sub(r"\bcon\s+con\b", "con", full)
    full = re.sub(r"\ben\s+en\b", "en", full)
    # Limpieza: paréntesis vacíos y espaciado que dejan las sustituciones
    full = re.sub(r"\(\s*\)", " ", full)
    full = re.sub(r"\s+([,.)])", r"\1", full)
    full = re.sub(r"\(\s+", "(", full)
    full = re.sub(r"\s*-\s*$", "", full)
    full = re.sub(r"\s+", " ", full).strip(" -,")
    return (full[:1].upper() + full[1:]) if full else name, missing


if __name__ == "__main__":
    items = json.load(open("exercises-dataset/data/exercises.json"))
    results, all_missing = [], {}
    for item in items:
        es, missing = translate(item["name"])
        results.append({"id": item["id"], "en": item["name"], "es": es})
        for m in missing:
            all_missing[m] = all_missing.get(m, 0) + 1

    clean = sum(1 for r, i in zip(results, items) if not translate(i["name"])[1])
    print(f"traducidos sin residuo en inglés: {clean}/{len(items)} "
          f"({clean * 100 // len(items)}%)")
    print(f"tokens sin traducir: {len(all_missing)}")
    print()
    print("--- los 60 más frecuentes ---")
    for w, c in sorted(all_missing.items(), key=lambda x: -x[1])[:60]:
        print(f"{w}({c})", end="  ")
    print()
    json.dump(results, open("traducciones.json", "w"), ensure_ascii=False, indent=1)
