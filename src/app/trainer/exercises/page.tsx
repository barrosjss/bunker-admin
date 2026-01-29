"use client";

import { useState, useMemo } from "react";
import { useExercises } from "@/hooks/useExercises";
import { Header } from "@/components/layout";
import {
  Card,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import { Search, Dumbbell, Video } from "lucide-react";

const muscleGroups = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Piernas",
  "Glúteos",
  "Core",
  "Cardio",
  "Cuerpo completo",
];

export default function TrainerExercisesPage() {
  const { exercises, loading } = useExercises();

  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesMuscle =
        muscleFilter === "all" || exercise.muscle_group === muscleFilter;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, muscleFilter]);

  // Group filtered exercises by muscle group
  const groupedExercises = useMemo(() => {
    return filteredExercises.reduce((acc, exercise) => {
      const group = exercise.muscle_group || "Sin categoría";
      if (!acc[group]) acc[group] = [];
      acc[group].push(exercise);
      return acc;
    }, {} as Record<string, typeof exercises>);
  }, [filteredExercises]);

  return (
    <div>
      <Header title="Catálogo de Ejercicios" showSearch={false} />

      <div className="p-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Buscar ejercicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-48">
              <Select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value)}
                options={[
                  { value: "all", label: "Todos los grupos" },
                  ...muscleGroups.map((g) => ({ value: g, label: g })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <Badge variant="success" className="px-4 py-2 whitespace-nowrap">
            {exercises.length} ejercicios totales
          </Badge>
          {muscleGroups.map((group) => {
            const count = exercises.filter(
              (e) => e.muscle_group === group
            ).length;
            if (count === 0) return null;
            return (
              <Badge
                key={group}
                variant="default"
                className="px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-surface-elevated"
                onClick={() =>
                  setMuscleFilter(muscleFilter === group ? "all" : group)
                }
              >
                {group}: {count}
              </Badge>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredExercises.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title={searchQuery ? "Sin resultados" : "Sin ejercicios"}
            description={
              searchQuery
                ? "No se encontraron ejercicios con esos criterios."
                : "No hay ejercicios en el catálogo."
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExercises).map(([group, exercises]) => (
              <div key={group}>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-success" />
                  {group}
                  <Badge variant="default" size="sm">
                    {exercises.length}
                  </Badge>
                </h2>
                <div className="grid-tablet">
                  {exercises.map((exercise) => (
                    <Card key={exercise.id}>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary mb-1">
                          {exercise.name}
                        </h3>
                        {exercise.description && (
                          <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                            {exercise.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {exercise.equipment && (
                            <Badge variant="default" size="sm">
                              {exercise.equipment}
                            </Badge>
                          )}
                          {exercise.video_url && (
                            <a
                              href={exercise.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-success hover:underline"
                            >
                              <Video className="h-3 w-3" />
                              Ver video
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
