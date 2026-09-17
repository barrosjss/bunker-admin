"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Dumbbell, Search, X } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { Header } from "@/components/layout";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Spinner } from "@/components/ui";
import type { Exercise } from "@/lib/supabase/types/database";

/** Cuántas tarjetas se pintan de una. Con ~1.400 ejercicios, pintarlas todas
 *  cuelga el navegador; el resto entra al apretar "Ver más". */
const PAGINA = 60;

export default function TrainerExercisesPage() {
  const { exercises, loading } = useExercises();

  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [visible, setVisible] = useState(PAGINA);
  const [selected, setSelected] = useState<Exercise | null>(null);

  // Los filtros salen de lo que hay cargado, no de una lista fija: así el
  // catálogo importado no queda fuera de sus propias opciones.
  const muscleGroups = useMemo(
    () =>
      Array.from(new Set(exercises.map((e) => e.muscle_group).filter(Boolean)))
        .sort()
        .map((g) => ({ value: g as string, label: g as string })),
    [exercises]
  );

  const equipmentOptions = useMemo(
    () =>
      Array.from(new Set(exercises.map((e) => e.equipment).filter(Boolean)))
        .sort()
        .map((g) => ({ value: g as string, label: g as string })),
    [exercises]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesSearch =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.name_en?.toLowerCase().includes(query);
      const matchesMuscle = muscleFilter === "all" || exercise.muscle_group === muscleFilter;
      const matchesEquipment =
        equipmentFilter === "all" || exercise.equipment === equipmentFilter;
      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [exercises, searchQuery, muscleFilter, equipmentFilter]);

  const shown = filtered.slice(0, visible);
  const resetPaging = () => setVisible(PAGINA);

  return (
    <div>
      <Header title="Catálogo de ejercicios" showSearch={false} />

      <div className="p-6">
        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Buscar ejercicio..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetPaging();
              }}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-4">
            <div className="w-48">
              <Select
                value={muscleFilter}
                onChange={(e) => {
                  setMuscleFilter(e.target.value);
                  resetPaging();
                }}
                options={[{ value: "all", label: "Todos los músculos" }, ...muscleGroups]}
              />
            </div>
            <div className="w-48">
              <Select
                value={equipmentFilter}
                onChange={(e) => {
                  setEquipmentFilter(e.target.value);
                  resetPaging();
                }}
                options={[{ value: "all", label: "Todo el equipo" }, ...equipmentOptions]}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-6">
          {filtered.length === exercises.length
            ? `${exercises.length} ejercicios`
            : `${filtered.length} de ${exercises.length} ejercicios`}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Sin resultados"
            description="Ningún ejercicio coincide con esos filtros."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shown.map((exercise) => (
                <Card
                  key={exercise.id}
                  hoverable
                  padding="none"
                  className="overflow-hidden"
                  onClick={() => setSelected(exercise)}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-surface-elevated overflow-hidden flex items-center justify-center">
                      {exercise.image_url ? (
                        <Image
                          src={exercise.image_url}
                          alt={exercise.name}
                          width={64}
                          height={64}
                          className="object-cover h-full w-full"
                          unoptimized
                        />
                      ) : (
                        <Dumbbell className="h-6 w-6 text-text-secondary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary text-sm leading-snug line-clamp-2">
                        {exercise.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {exercise.muscle_group && (
                          <Badge variant="primary" size="sm">
                            {exercise.muscle_group}
                          </Badge>
                        )}
                        {exercise.equipment && (
                          <Badge variant="default" size="sm">
                            {exercise.equipment}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {visible < filtered.length && (
              <div className="flex justify-center mt-6">
                <Button variant="secondary" onClick={() => setVisible((v) => v + PAGINA)}>
                  Ver más ({filtered.length - visible} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ExerciseDetail exercise={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ExerciseDetail({
  exercise,
  onClose,
}: {
  exercise: Exercise | null;
  onClose: () => void;
}) {
  if (!exercise) return null;

  const steps = Array.isArray(exercise.instruction_steps) ? exercise.instruction_steps : [];

  return (
    <Modal isOpen={!!exercise} onClose={onClose} title={exercise.name} size="full">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {exercise.muscle_group && <Badge variant="primary">{exercise.muscle_group}</Badge>}
          {exercise.equipment && <Badge variant="default">{exercise.equipment}</Badge>}
          {exercise.body_part && <Badge variant="default">{exercise.body_part}</Badge>}
        </div>

        {/* La animación explica el movimiento mejor que el texto */}
        {(exercise.gif_url || exercise.image_url) && (
          <div className="flex justify-center rounded-xl bg-surface-elevated p-4">
            <Image
              src={exercise.gif_url || exercise.image_url!}
              alt={exercise.name}
              width={220}
              height={220}
              className="rounded-lg"
              unoptimized
            />
          </div>
        )}

        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Músculos secundarios</p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.secondary_muscles.map((m) => (
                <Badge key={m} variant="default" size="sm">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {steps.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Ejecución</p>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-text-secondary">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-surface-elevated text-text-primary text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          exercise.instructions && (
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Ejecución</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {exercise.instructions}
              </p>
            </div>
          )
        )}

        {/* La licencia de la media exige que la atribución viaje con cada uso */}
        {exercise.attribution && (
          <p className="text-xs text-text-secondary pt-2 border-t border-border">
            {exercise.attribution}
          </p>
        )}

        {exercise.name_en && (
          <p className="text-xs text-text-secondary">Nombre original: {exercise.name_en}</p>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" leftIcon={<X className="h-4 w-4" />} onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
