"use client";

import { useState, useMemo } from "react";
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
} from "@/components/ui";
import { Plus, Search, Dumbbell, Edit, Trash2, Video } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExerciseInsert } from "@/lib/types/database";

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

const exerciseSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  muscle_group: z.string().optional(),
  equipment: z.string().optional(),
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

export default function AdminExercisesPage() {
  const {
    exercises,
    loading,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useExercises();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: "",
      description: "",
      muscle_group: "",
      equipment: "",
      video_url: "",
    },
  });

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

  const handleCreate = async (data: ExerciseFormData) => {
    setIsSubmitting(true);
    try {
      const exerciseData: ExerciseInsert = {
        name: data.name,
        description: data.description || null,
        muscle_group: data.muscle_group || null,
        equipment: data.equipment || null,
        video_url: data.video_url || null,
      };
      await createExercise(exerciseData);
      reset();
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating exercise:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: ExerciseFormData) => {
    if (!editingId) return;
    setIsSubmitting(true);
    try {
      await updateExercise(editingId, {
        name: data.name,
        description: data.description || null,
        muscle_group: data.muscle_group || null,
        equipment: data.equipment || null,
        video_url: data.video_url || null,
      });
      reset();
      setEditingId(null);
    } catch (err) {
      console.error("Error updating exercise:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      await deleteExercise(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting exercise:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (exercise) {
      setValue("name", exercise.name);
      setValue("description", exercise.description || "");
      setValue("muscle_group", exercise.muscle_group || "");
      setValue("equipment", exercise.equipment || "");
      setValue("video_url", exercise.video_url || "");
      setEditingId(exerciseId);
    }
  };

  const exerciseToDelete = exercises.find((e) => e.id === deletingId);

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
          <Button
            variant="primary"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => {
              reset();
              setIsCreating(true);
            }}
          >
            Nuevo ejercicio
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          <Badge variant="primary" className="px-4 py-2 whitespace-nowrap">
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
                : "Comienza creando tu primer ejercicio."
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
                  Crear ejercicio
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedExercises).map(([group, exercises]) => (
              <div key={group}>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  {group}
                  <Badge variant="default" size="sm">
                    {exercises.length}
                  </Badge>
                </h2>
                <div className="grid-tablet">
                  {exercises.map((exercise) => (
                    <Card key={exercise.id} className="group">
                      <div className="flex items-start justify-between gap-3">
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
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Video className="h-3 w-3" />
                                Ver video
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(exercise.id)}
                            className="p-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(exercise.id)}
                            className="p-2 text-danger hover:text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Create/Edit modal */}
      <Modal
        isOpen={isCreating || editingId !== null}
        onClose={() => {
          setIsCreating(false);
          setEditingId(null);
          reset();
        }}
        title={editingId ? "Editar ejercicio" : "Nuevo ejercicio"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit(editingId ? handleUpdate : handleCreate)}
          className="space-y-4"
        >
          <Input
            label="Nombre *"
            placeholder="Ej: Press de banca"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Descripción"
            placeholder="Breve descripción del ejercicio..."
            {...register("description")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Grupo muscular"
              placeholder="Selecciona un grupo"
              options={muscleGroups.map((g) => ({ value: g, label: g }))}
              {...register("muscle_group")}
            />

            <Input
              label="Equipamiento"
              placeholder="Ej: Barra, mancuernas"
              {...register("equipment")}
            />
          </div>

          <Input
            label="URL de video"
            placeholder="https://youtube.com/..."
            error={errors.video_url?.message}
            {...register("video_url")}
          />

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingId ? "Guardar cambios" : "Crear ejercicio"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Eliminar ejercicio"
        size="sm"
      >
        <p className="text-text-secondary mb-4">
          ¿Estás seguro de que deseas eliminar{" "}
          <strong>{exerciseToDelete?.name}</strong>? Esta acción no se puede
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
