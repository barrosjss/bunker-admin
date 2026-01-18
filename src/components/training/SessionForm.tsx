"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
} from "@/components/ui";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Member, Exercise, SessionExerciseInsert } from "@/lib/types/database";

const exerciseSchema = z.object({
  exercise_id: z.string().min(1, "Selecciona un ejercicio"),
  sets_completed: z.number().min(1, "Mínimo 1 serie"),
  reps_completed: z.string().min(1, "Indica las repeticiones"),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

const sessionSchema = z.object({
  member_id: z.string().min(1, "Selecciona un miembro"),
  date: z.string().min(1, "Selecciona una fecha"),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, "Agrega al menos un ejercicio"),
});

type SessionFormData = {
  member_id: string;
  date: string;
  notes?: string;
  exercises: {
    exercise_id: string;
    sets_completed: number;
    reps_completed: string;
    weight?: number;
    notes?: string;
  }[];
};

interface SessionFormProps {
  members: Member[];
  exercises: Exercise[];
  defaultMemberId?: string;
  onSubmit: (data: {
    session: { member_id: string; date: string; notes?: string };
    exercises: SessionExerciseInsert[];
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SessionForm({
  members,
  exercises,
  defaultMemberId,
  onSubmit,
  onCancel,
  isLoading,
}: SessionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      member_id: defaultMemberId || "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      exercises: [
        {
          exercise_id: "",
          sets_completed: 3,
          reps_completed: "10",
          weight: 0,
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const handleFormSubmit = async (data: SessionFormData) => {
    const sessionExercises: SessionExerciseInsert[] = data.exercises.map(
      (ex, index) => ({
        exercise_id: ex.exercise_id,
        sets_completed: ex.sets_completed,
        reps_completed: ex.reps_completed,
        weight: ex.weight || null,
        notes: ex.notes || null,
        order_index: index,
        session_id: "", // Will be set by the hook
      })
    );

    await onSubmit({
      session: {
        member_id: data.member_id,
        date: data.date,
        notes: data.notes,
      },
      exercises: sessionExercises,
    });
  };

  // Group exercises by muscle group
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group || "Otros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Miembro *"
          placeholder="Selecciona un miembro"
          options={members.map((m) => ({ value: m.id, label: m.name }))}
          error={errors.member_id?.message}
          {...register("member_id")}
        />

        <Input
          type="date"
          label="Fecha *"
          error={errors.date?.message}
          {...register("date")}
        />
      </div>

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
                sets_completed: 3,
                reps_completed: "10",
                weight: 0,
                notes: "",
              })
            }
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Agregar ejercicio
          </Button>
        </div>

        {errors.exercises?.message && (
          <p className="text-sm text-danger mb-2">{errors.exercises.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} variant="elevated" padding="sm">
              <div className="flex items-start gap-3">
                <div className="pt-3 text-text-secondary cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-3">
                  <Select
                    placeholder="Selecciona un ejercicio"
                    options={Object.entries(groupedExercises).flatMap(
                      ([group, exs]) => [
                        { value: `__group_${group}`, label: `--- ${group} ---` },
                        ...exs.map((e) => ({ value: e.id, label: e.name })),
                      ]
                    )}
                    error={errors.exercises?.[index]?.exercise_id?.message}
                    {...register(`exercises.${index}.exercise_id`)}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      label="Series"
                      placeholder="0"
                      error={errors.exercises?.[index]?.sets_completed?.message}
                      {...register(`exercises.${index}.sets_completed`)}
                    />
                    <Input
                      label="Reps"
                      placeholder="10"
                      error={errors.exercises?.[index]?.reps_completed?.message}
                      {...register(`exercises.${index}.reps_completed`)}
                    />
                    <Input
                      type="number"
                      label="Peso (kg)"
                      placeholder="0"
                      step="0.5"
                      {...register(`exercises.${index}.weight`)}
                    />
                  </div>

                  <Input
                    placeholder="Notas del ejercicio..."
                    {...register(`exercises.${index}.notes`)}
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
            </Card>
          ))}
        </div>
      </div>

      <Textarea
        label="Notas de la sesión"
        placeholder="Observaciones generales de la sesión..."
        {...register("notes")}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Guardar sesión
        </Button>
      </div>
    </form>
  );
}
