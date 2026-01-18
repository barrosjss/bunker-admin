"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoutines } from "@/hooks/useRoutines";
import { useExercises } from "@/hooks/useExercises";
import { Header } from "@/components/layout";
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  ModalFooter,
  Badge,
  Spinner,
  EmptyState,
  Textarea,
} from "@/components/ui";
import { Plus, Search, BookOpen, Trash2, ChevronRight, Dumbbell } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getDifficultyLabel } from "@/lib/utils/formatting";
import {
  RoutineTemplateInsert,
  RoutineTemplateExerciseInsert,
} from "@/lib/types/database";

const routineExerciseSchema = z.object({
  exercise_id: z.string().min(1, "Selecciona un ejercicio"),
  sets: z.number().min(1, "Mínimo 1 serie"),
  reps: z.string().min(1, "Indica las repeticiones"),
  rest_seconds: z.number().optional(),
  notes: z.string().optional(),
});

const routineSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  exercises: z.array(routineExerciseSchema).min(1, "Agrega al menos un ejercicio"),
});

type RoutineFormData = {
  name: string;
  description?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  exercises: {
    exercise_id: string;
    sets: number;
    reps: string;
    rest_seconds?: number;
    notes?: string;
  }[];
};

export default function RoutinesPage() {
  const { routines, loading, createRoutine, deleteRoutine } = useRoutines();
  const { exercises } = useExercises();

  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: "",
      description: "",
      difficulty: "beginner",
      exercises: [
        {
          exercise_id: "",
          sets: 3,
          reps: "10",
          rest_seconds: 60,
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const filteredRoutines = routines.filter((routine) => {
    const matchesSearch = routine.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === "all" || routine.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const handleCreate = async (data: RoutineFormData) => {
    setIsSubmitting(true);
    try {
      const routineData: RoutineTemplateInsert = {
        name: data.name,
        description: data.description || null,
        difficulty: data.difficulty,
      };

      const exercisesData: RoutineTemplateExerciseInsert[] = data.exercises.map(
        (ex, index) => ({
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds || null,
          notes: ex.notes || null,
          order_index: index,
          template_id: "", // Will be set by the hook
        })
      );

      await createRoutine(routineData, exercisesData);
      reset();
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating routine:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      await deleteRoutine(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting routine:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const routineToDelete = routines.find((r) => r.id === deletingId);

  const difficultyVariants: Record<string, "success" | "warning" | "danger"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "danger",
  };

  // Group exercises by muscle group for the select
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group || "Otros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(exercise);
    return acc;
  }, {} as Record<string, typeof exercises>);

  return (
    <div>
      <Header title="Plantillas de Rutinas" showSearch={false} />

      <div className="p-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Buscar rutina..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <div className="w-48">
              <Select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                options={[
                  { value: "all", label: "Todas las dificultades" },
                  { value: "beginner", label: "Principiante" },
                  { value: "intermediate", label: "Intermedio" },
                  { value: "advanced", label: "Avanzado" },
                ]}
              />
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => {
              reset();
              setIsCreating(true);
            }}
          >
            Nueva rutina
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredRoutines.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={searchQuery ? "Sin resultados" : "Sin rutinas"}
            description={
              searchQuery
                ? "No se encontraron rutinas con esos criterios."
                : "Crea plantillas de rutinas para asignar a los miembros."
            }
            action={
              !searchQuery && (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="h-5 w-5" />}
                  onClick={() => {
                    reset();
                    setIsCreating(true);
                  }}
                >
                  Crear rutina
                </Button>
              )
            }
          />
        ) : (
          <div className="grid-tablet">
            {filteredRoutines.map((routine) => (
              <Link key={routine.id} href={`/routines/${routine.id}`}>
                <Card hoverable className="h-full group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary mb-1">
                        {routine.name}
                      </h3>
                      {routine.description && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {routine.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeletingId(routine.id);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-danger hover:text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          difficultyVariants[routine.difficulty || "beginner"]
                        }
                        size="sm"
                      >
                        {getDifficultyLabel(routine.difficulty || "beginner")}
                      </Badge>
                      <Badge variant="default" size="sm">
                        <Dumbbell className="h-3 w-3 mr-1" />
                        {routine.routine_template_exercises?.length || 0}{" "}
                        ejercicios
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-secondary group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
          reset();
        }}
        title="Nueva plantilla de rutina"
        size="xl"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              placeholder="Ej: Rutina de piernas"
              error={errors.name?.message}
              {...register("name")}
            />

            <Select
              label="Dificultad *"
              options={[
                { value: "beginner", label: "Principiante" },
                { value: "intermediate", label: "Intermedio" },
                { value: "advanced", label: "Avanzado" },
              ]}
              error={errors.difficulty?.message}
              {...register("difficulty")}
            />
          </div>

          <Textarea
            label="Descripción"
            placeholder="Descripción de la rutina..."
            {...register("description")}
          />

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Ejercicios</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({
                    exercise_id: "",
                    sets: 3,
                    reps: "10",
                    rest_seconds: 60,
                    notes: "",
                  })
                }
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Agregar
              </Button>
            </div>

            {errors.exercises?.message && (
              <p className="text-sm text-danger mb-2">
                {errors.exercises.message}
              </p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} variant="elevated" padding="sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <Select
                          placeholder="Selecciona un ejercicio"
                          options={Object.entries(groupedExercises).flatMap(
                            ([group, exs]) => [
                              {
                                value: `__group_${group}`,
                                label: `--- ${group} ---`,
                              },
                              ...exs.map((e) => ({ value: e.id, label: e.name })),
                            ]
                          )}
                          error={errors.exercises?.[index]?.exercise_id?.message}
                          {...register(`exercises.${index}.exercise_id`)}
                        />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-danger hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pl-11">
                      <Input
                        type="number"
                        placeholder="Series"
                        error={errors.exercises?.[index]?.sets?.message}
                        {...register(`exercises.${index}.sets`)}
                      />
                      <Input
                        placeholder="Reps (ej: 8-12)"
                        error={errors.exercises?.[index]?.reps?.message}
                        {...register(`exercises.${index}.reps`)}
                      />
                      <Input
                        type="number"
                        placeholder="Descanso (seg)"
                        {...register(`exercises.${index}.rest_seconds`)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreating(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Crear rutina
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Eliminar rutina"
        size="sm"
      >
        <p className="text-text-secondary mb-4">
          ¿Estás seguro de que deseas eliminar{" "}
          <strong>{routineToDelete?.name}</strong>? Esta acción no se puede
          deshacer.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeletingId(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isSubmitting}
          >
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
