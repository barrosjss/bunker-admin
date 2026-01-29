"use client";

import { useState, useMemo } from "react";
import { Exercise } from "@/lib/types/database";
import { Card, Button, Badge } from "@/components/ui";
import { Check, ChevronLeft, Dumbbell } from "lucide-react";

const MUSCLE_GROUP_ORDER = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Piernas",
  "Glúteos",
  "Core",
];

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  onConfirm: (exercises: Exercise[]) => void;
  onCancel: () => void;
}

export function ExerciseSelector({
  exercises,
  selectedExercises: initialSelected,
  onConfirm,
  onCancel,
}: ExerciseSelectorProps) {
  const [selected, setSelected] = useState<Map<string, Exercise>>(
    () => new Map(initialSelected.map((e) => [e.id, e]))
  );
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of exercises) {
      const group = ex.muscle_group || "Otros";
      if (!map[group]) map[group] = [];
      map[group].push(ex);
    }
    return map;
  }, [exercises]);

  const groups = useMemo(() => {
    const keys = Object.keys(grouped);
    return MUSCLE_GROUP_ORDER.filter((g) => keys.includes(g)).concat(
      keys.filter((k) => !MUSCLE_GROUP_ORDER.includes(k))
    );
  }, [grouped]);

  const toggleExercise = (exercise: Exercise) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  };

  const countForGroup = (group: string) =>
    (grouped[group] || []).filter((e) => selected.has(e.id)).length;

  // Group list view
  if (!activeGroup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-text-primary">
            Seleccionar ejercicios
          </h3>
          <Badge variant="primary">{selected.size} seleccionados</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {groups.map((group) => {
            const count = countForGroup(group);
            return (
              <Card
                key={group}
                hoverable
                className="cursor-pointer"
                onClick={() => setActiveGroup(group)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <span className="font-medium text-text-primary">
                      {group}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {count > 0 && (
                      <Badge variant="success" size="sm">
                        {count}
                      </Badge>
                    )}
                    <span className="text-xs text-text-secondary">
                      {grouped[group].length}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(Array.from(selected.values()))}
            disabled={selected.size === 0}
          >
            Confirmar ({selected.size} ejercicios)
          </Button>
        </div>
      </div>
    );
  }

  // Exercise list for active group
  const groupExercises = grouped[activeGroup] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveGroup(null)}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Volver
        </Button>
        <h3 className="font-semibold text-text-primary">{activeGroup}</h3>
        <Badge variant="primary">{countForGroup(activeGroup)}</Badge>
      </div>

      <div className="space-y-2">
        {groupExercises.map((exercise) => {
          const isSelected = selected.has(exercise.id);
          return (
            <Card
              key={exercise.id}
              hoverable
              className={`cursor-pointer transition-colors ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => toggleExercise(exercise)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-border"
                  }`}
                >
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">
                    {exercise.name}
                  </p>
                  {exercise.description && (
                    <p className="text-sm text-text-secondary truncate">
                      {exercise.description}
                    </p>
                  )}
                  {exercise.equipment && (
                    <p className="text-xs text-text-secondary mt-1">
                      {exercise.equipment}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="secondary" onClick={() => setActiveGroup(null)}>
          Ver grupos
        </Button>
        <Button
          variant="primary"
          onClick={() => onConfirm(Array.from(selected.values()))}
          disabled={selected.size === 0}
        >
          Confirmar ({selected.size} ejercicios)
        </Button>
      </div>
    </div>
  );
}
